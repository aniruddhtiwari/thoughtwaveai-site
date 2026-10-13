# ThoughtWaveAI Website

This repository contains the public product website for ThoughtWaveAI — a real-time AI companion for conversations, context, and professional work.

Preview locally from the repository root with `python -m http.server 8080`, then open `http://localhost:8080/`.

## SEO Health Check

Run from Windows CMD:

```arduino
cd /d C:\Projects\thoughtwaveai-site
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\check-public-seo.ps1
```

Expected healthy result:

```yaml
SUMMARY: PASS=9 WARNING=0 FAIL=0
```

The checker validates the deployed sitemap, public pages, canonical URLs, SEO metadata, indexing directives, and required assets. It requires Windows PowerShell 5.1 or later; PowerShell 7 is also supported. It does not determine whether Google or Bing has indexed any pages. PASS, WARNING, and FAIL counts can change as the number of pages changes.
