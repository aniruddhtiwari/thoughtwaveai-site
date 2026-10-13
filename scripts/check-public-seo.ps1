[CmdletBinding()]
param(
    [string]$SitemapPath,
    [ValidateRange(3, 60)]
    [int]$TimeoutSeconds = 15,
    [ValidateRange(1, 3)]
    [int]$Attempts = 2
)

$ErrorActionPreference = 'Stop'
$script:PassCount = 0
$script:WarningCount = 0
$script:FailCount = 0

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($SitemapPath)) {
    $SitemapPath = Join-Path -Path $scriptDirectory -ChildPath '..\sitemap.xml'
}

Add-Type -AssemblyName System.Net.Http
if ([Net.ServicePointManager]::SecurityProtocol -band [Net.SecurityProtocolType]::Tls12) {
    # Preserve the current protocol selection when TLS 1.2 is already enabled.
}
else {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
}

function Add-CheckResult {
    param(
        [ValidateSet('PASS', 'WARNING', 'FAIL')]
        [string]$Level,
        [string]$Scope,
        [string]$Message
    )

    switch ($Level) {
        'PASS' { $script:PassCount++ }
        'WARNING' { $script:WarningCount++ }
        'FAIL' { $script:FailCount++ }
    }

    Write-Output ('[{0}] {1}: {2}' -f $Level, $Scope, $Message)
}

function Invoke-PublicRequest {
    param(
        [Parameter(Mandatory)]
        [uri]$Uri
    )

    $lastError = $null
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $handler = $null
        $client = $null
        try {
            $handler = New-Object Net.Http.HttpClientHandler
            $handler.AllowAutoRedirect = $true
            $handler.MaxAutomaticRedirections = 10

            $client = New-Object Net.Http.HttpClient -ArgumentList $handler
            $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
            [void]$client.DefaultRequestHeaders.UserAgent.ParseAdd('ThoughtWaveAI-Public-SEO-Check/1.0')

            $httpResponse = $client.GetAsync($Uri).GetAwaiter().GetResult()
            $content = $httpResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            $xRobotsTag = $null
            $headerValues = $null
            if ($httpResponse.Headers.TryGetValues('X-Robots-Tag', [ref]$headerValues)) {
                $xRobotsTag = $headerValues -join ','
            }

            $response = [pscustomobject]@{
                StatusCode = [int]$httpResponse.StatusCode
                FinalUri = $httpResponse.RequestMessage.RequestUri
                ContentType = if ($httpResponse.Content.Headers.ContentType) {
                    $httpResponse.Content.Headers.ContentType.ToString()
                }
                else {
                    ''
                }
                Content = $content
                XRobotsTag = $xRobotsTag
            }

            return [pscustomobject]@{
                Response = $response
                Error = $null
                Attempts = $attempt
            }
        }
        catch {
            $exception = $_.Exception
            while ($exception.InnerException) {
                $exception = $exception.InnerException
            }
            $lastError = $exception.Message
            if ($attempt -lt $Attempts) {
                Start-Sleep -Milliseconds 400
            }
        }
        finally {
            if ($client) { $client.Dispose() }
            if ($handler) { $handler.Dispose() }
        }
    }

    return [pscustomobject]@{
        Response = $null
        Error = $lastError
        Attempts = $Attempts
    }
}

function Get-TagAttribute {
    param(
        [Parameter(Mandatory)]
        [string]$Tag,
        [Parameter(Mandatory)]
        [string]$Name
    )

    $pattern = '(?is)\b' + [regex]::Escape($Name) + '\s*=\s*(["''])(.*?)\1'
    $match = [regex]::Match($Tag, $pattern)
    if (-not $match.Success) {
        return $null
    }

    return [Net.WebUtility]::HtmlDecode($match.Groups[2].Value.Trim())
}

function Get-MetaContent {
    param(
        [Parameter(Mandatory)]
        [string]$Html,
        [Parameter(Mandatory)]
        [string]$Key
    )

    foreach ($match in [regex]::Matches($Html, '(?is)<meta\b[^>]*>')) {
        $tag = $match.Value
        $identifier = Get-TagAttribute -Tag $tag -Name 'name'
        if (-not $identifier) {
            $identifier = Get-TagAttribute -Tag $tag -Name 'property'
        }
        if ($identifier -and $identifier.Equals($Key, [StringComparison]::OrdinalIgnoreCase)) {
            return Get-TagAttribute -Tag $tag -Name 'content'
        }
    }

    return $null
}

function Get-CanonicalHref {
    param([Parameter(Mandatory)][string]$Html)

    foreach ($match in [regex]::Matches($Html, '(?is)<link\b[^>]*>')) {
        $tag = $match.Value
        $rel = Get-TagAttribute -Tag $tag -Name 'rel'
        if ($rel -and (($rel -split '\s+') -contains 'canonical')) {
            return Get-TagAttribute -Tag $tag -Name 'href'
        }
    }

    return $null
}

function Add-AssetReference {
    param(
        [Parameter(Mandatory)][hashtable]$Assets,
        [Parameter(Mandatory)][uri]$PageUri,
        [AllowNull()][string]$Reference,
        [Parameter(Mandatory)][string]$Kind
    )

    if ([string]::IsNullOrWhiteSpace($Reference) -or $Reference.StartsWith('data:')) {
        return
    }

    try {
        $assetUri = [uri]::new($PageUri, $Reference)
        if ($assetUri.Scheme -notin @('http', 'https')) {
            return
        }

        $key = $assetUri.AbsoluteUri
        if (-not $Assets.ContainsKey($key)) {
            $Assets[$key] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        }
        [void]$Assets[$key].Add($Kind)
    }
    catch {
        Add-CheckResult -Level 'FAIL' -Scope $PageUri.AbsoluteUri -Message "Invalid $Kind asset URL: $Reference"
    }
}

$resolvedSitemapPath = [IO.Path]::GetFullPath($SitemapPath)
if (-not (Test-Path -LiteralPath $resolvedSitemapPath -PathType Leaf)) {
    Add-CheckResult -Level 'FAIL' -Scope 'sitemap' -Message "File not found: $resolvedSitemapPath"
    Write-Output "SUMMARY: PASS=$script:PassCount WARNING=$script:WarningCount FAIL=$script:FailCount"
    exit 1
}

try {
    [xml]$sitemap = Get-Content -LiteralPath $resolvedSitemapPath -Raw
}
catch {
    Add-CheckResult -Level 'FAIL' -Scope 'sitemap' -Message "Invalid XML: $($_.Exception.Message)"
    Write-Output "SUMMARY: PASS=$script:PassCount WARNING=$script:WarningCount FAIL=$script:FailCount"
    exit 1
}

$namespaceManager = [Xml.XmlNamespaceManager]::new($sitemap.NameTable)
$namespaceManager.AddNamespace('sm', 'http://www.sitemaps.org/schemas/sitemap/0.9')
$locationNodes = @($sitemap.SelectNodes('/sm:urlset/sm:url/sm:loc', $namespaceManager))
if ($locationNodes.Count -eq 0) {
    Add-CheckResult -Level 'FAIL' -Scope 'sitemap' -Message 'No page URLs were found.'
    Write-Output "SUMMARY: PASS=$script:PassCount WARNING=$script:WarningCount FAIL=$script:FailCount"
    exit 1
}

$pageUris = [System.Collections.Generic.List[uri]]::new()
$seenSitemapUrls = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($node in $locationNodes) {
    $value = $node.InnerText.Trim()
    $parsedUri = $null
    if (-not [uri]::TryCreate($value, [UriKind]::Absolute, [ref]$parsedUri) -or $parsedUri.Scheme -ne 'https') {
        Add-CheckResult -Level 'FAIL' -Scope 'sitemap' -Message "Invalid absolute HTTPS URL: $value"
        continue
    }
    if (-not $seenSitemapUrls.Add($parsedUri.AbsoluteUri)) {
        Add-CheckResult -Level 'FAIL' -Scope 'sitemap' -Message "Duplicate URL: $($parsedUri.AbsoluteUri)"
        continue
    }
    $pageUris.Add($parsedUri)
}

if ($pageUris.Count -gt 0) {
    Add-CheckResult -Level 'PASS' -Scope 'sitemap' -Message "Valid XML with $($pageUris.Count) unique page URL(s)."
}

$assets = @{}
$pageCanonicalUrls = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

foreach ($pageUri in $pageUris) {
    $scope = $pageUri.AbsoluteUri
    $request = Invoke-PublicRequest -Uri $pageUri
    if ($request.Error) {
        Add-CheckResult -Level 'WARNING' -Scope $scope -Message "Network check was inconclusive after $($request.Attempts) attempt(s): $($request.Error)"
        continue
    }

    $response = $request.Response
    $statusCode = [int]$response.StatusCode
    if ($statusCode -ne 200) {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Expected HTTP 200; received $statusCode."
        continue
    }

    $finalUri = $response.FinalUri
    if ($finalUri.AbsoluteUri -ne $pageUri.AbsoluteUri) {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Canonical sitemap URL redirects to $($finalUri.AbsoluteUri)."
    }

    $contentType = $response.ContentType
    if ($contentType -notmatch '(?i)^text/html\b') {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Expected an HTML content type; received '$contentType'."
        continue
    }

    $html = [string]$response.Content
    $canonical = Get-CanonicalHref -Html $html
    if ([string]::IsNullOrWhiteSpace($canonical)) {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message 'Missing canonical link.'
    }
    else {
        try {
            $canonicalUri = [uri]::new($pageUri, $canonical)
            if ($canonicalUri.AbsoluteUri -ne $pageUri.AbsoluteUri) {
                Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Canonical mismatch: $($canonicalUri.AbsoluteUri)"
            }
            elseif (-not $pageCanonicalUrls.Add($canonicalUri.AbsoluteUri)) {
                Add-CheckResult -Level 'FAIL' -Scope $scope -Message 'Canonical URL is duplicated by another sitemap page.'
            }
        }
        catch {
            Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Invalid canonical URL: $canonical"
        }
    }

    $titleMatch = [regex]::Match($html, '(?is)<title\b[^>]*>(.*?)</title>')
    $title = if ($titleMatch.Success) { [Net.WebUtility]::HtmlDecode($titleMatch.Groups[1].Value).Trim() } else { $null }
    $description = Get-MetaContent -Html $html -Key 'description'
    foreach ($requiredField in @{
        'title' = $title
        'meta description' = $description
        'og:title' = (Get-MetaContent -Html $html -Key 'og:title')
        'og:description' = (Get-MetaContent -Html $html -Key 'og:description')
        'og:url' = (Get-MetaContent -Html $html -Key 'og:url')
        'og:image' = (Get-MetaContent -Html $html -Key 'og:image')
        'twitter:card' = (Get-MetaContent -Html $html -Key 'twitter:card')
        'twitter:title' = (Get-MetaContent -Html $html -Key 'twitter:title')
        'twitter:description' = (Get-MetaContent -Html $html -Key 'twitter:description')
        'twitter:image' = (Get-MetaContent -Html $html -Key 'twitter:image')
    }.GetEnumerator()) {
        if ([string]::IsNullOrWhiteSpace([string]$requiredField.Value)) {
            Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Missing $($requiredField.Key)."
        }
    }

    $ogUrl = Get-MetaContent -Html $html -Key 'og:url'
    if ($ogUrl -and $ogUrl -ne $pageUri.AbsoluteUri) {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "og:url mismatch: $ogUrl"
    }

    $robotsValues = @(
        (Get-MetaContent -Html $html -Key 'robots'),
        $response.XRobotsTag
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $robotsText = $robotsValues -join ', '
    if ($robotsText -match '(?i)(^|[,;\s])(noindex|none)(?=$|[,;\s:])') {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Restrictive indexing directive: $robotsText"
    }
    elseif ($robotsText -match '(?i)(nofollow|nosnippet|noarchive|unavailable_after)') {
        Add-CheckResult -Level 'WARNING' -Scope $scope -Message "Restrictive crawler directive to review: $robotsText"
    }

    foreach ($linkMatch in [regex]::Matches($html, '(?is)<link\b[^>]*>')) {
        $tag = $linkMatch.Value
        $rel = Get-TagAttribute -Tag $tag -Name 'rel'
        if ($rel -and (($rel -split '\s+') -contains 'stylesheet')) {
            Add-AssetReference -Assets $assets -PageUri $pageUri -Reference (Get-TagAttribute -Tag $tag -Name 'href') -Kind 'stylesheet'
        }
    }
    foreach ($scriptMatch in [regex]::Matches($html, '(?is)<script\b[^>]*\bsrc\s*=\s*(["'']).*?\1[^>]*>')) {
        Add-AssetReference -Assets $assets -PageUri $pageUri -Reference (Get-TagAttribute -Tag $scriptMatch.Value -Name 'src') -Kind 'script'
    }
    Add-AssetReference -Assets $assets -PageUri $pageUri -Reference (Get-MetaContent -Html $html -Key 'og:image') -Kind 'social image'
    Add-AssetReference -Assets $assets -PageUri $pageUri -Reference (Get-MetaContent -Html $html -Key 'twitter:image') -Kind 'social image'

    Add-CheckResult -Level 'PASS' -Scope $scope -Message 'HTTP, canonical, metadata, and indexability checks passed.'
}

foreach ($assetUrl in ($assets.Keys | Sort-Object)) {
    $assetUri = [uri]$assetUrl
    $kinds = @($assets[$assetUrl])
    $scope = "asset $assetUrl"
    $request = Invoke-PublicRequest -Uri $assetUri
    if ($request.Error) {
        Add-CheckResult -Level 'WARNING' -Scope $scope -Message "Network check was inconclusive after $($request.Attempts) attempt(s): $($request.Error)"
        continue
    }

    $response = $request.Response
    $statusCode = [int]$response.StatusCode
    if ($statusCode -ne 200) {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Expected HTTP 200; received $statusCode."
        continue
    }

    $contentType = $response.ContentType
    $typeMismatch = $false
    if ($kinds -contains 'stylesheet' -and $contentType -notmatch '(?i)^text/css\b') { $typeMismatch = $true }
    if ($kinds -contains 'script' -and $contentType -notmatch '(?i)(javascript|ecmascript)') { $typeMismatch = $true }
    if ($kinds -contains 'social image' -and $contentType -notmatch '(?i)^image/') { $typeMismatch = $true }
    if ($typeMismatch) {
        Add-CheckResult -Level 'FAIL' -Scope $scope -Message "Unexpected content type '$contentType' for $($kinds -join ', ')."
        continue
    }

    Add-CheckResult -Level 'PASS' -Scope $scope -Message "HTTP 200 with expected content type for $($kinds -join ', ')."
}

Write-Output "SUMMARY: PASS=$script:PassCount WARNING=$script:WarningCount FAIL=$script:FailCount"
if ($script:FailCount -gt 0) {
    exit 1
}
exit 0
