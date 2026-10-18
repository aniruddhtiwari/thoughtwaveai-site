const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
}));

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal').forEach((element) => {
    element.classList.add('is-visible');
  });
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach((element) => {
    observer.observe(element);
  });
}

const lifecycleRing = document.getElementById('lifecycle-ring');

if (lifecycleRing) {
  const ringSegments = lifecycleRing.querySelectorAll('.tw-ring-segment');
  const detailTitle = document.getElementById('lifecycle-ring-detail-title');
  const detailMicro = document.getElementById('lifecycle-ring-detail-micro');
  const detailCopy = document.getElementById('lifecycle-ring-detail-copy');

  const ringData = {
    prepare: {
      title: 'Prepare',
      micro: 'Prepare for the conversation.',
      copy: 'Set the Outcome, choose Influence, add the Session Context that matters, and prepare likely questions and talking points before you start.'
    },

    control: {
      title: 'Control',
      micro: 'Stay in control of the conversation.',
      copy: 'Choose how ThoughtWaves supports the moment—follow Discussion, ask directly with Ask TW, request Assist, or consider proactive TW Intelligence Assist.'
    },

    reflect: {
      title: 'Reflect',
      micro: 'Reflect after the conversation.',
      copy: 'Review what happened first, then Download or Summarize what you want to preserve and decide what context is worth carrying forward.'
    },

    plan: {
      title: 'Plan',
      micro: 'Outcome · Influence · Session Context',
      copy: 'Define what you want to accomplish, how strongly guidance should help move toward it, and what information should ground the session.'
    },

    ri: {
      title: 'Real Intelligence',
      micro: 'Discussion · Ask TW · Assist · TW Intelligence Assist',
      copy: 'Surface the right help at the right time—whether you ask directly, request assistance, or ThoughtWaves identifies something worth raising.'
    },

    conclude: {
      title: 'Conclude',
      micro: 'Review · Download · Summarize',
      copy: 'Understand what happened, what mattered, what could have gone better, and preserve the material you need after the session.'
    },

    curate: {
      title: 'Curate What Matters',
      micro: 'User-selected context',
      copy: 'Choose what remains useful and deliberately add only that material as Session Context for a future conversation.'
    }
  };

  const selectRingSegment = (segment) => {
    const data = ringData[segment?.dataset.key];

    if (!data) return;

    ringSegments.forEach((item) => {
      item.classList.toggle('is-active', item === segment);
    });

    // Raise the active segment above neighboring wedges so its full
    // black outline remains visible on every side.
    const svg = lifecycleRing.querySelector('svg');
    const hubStart = svg?.querySelector(
      'circle[filter="url(#twRingHubShadow)"]'
    );

    if (svg && hubStart && segment.parentNode === svg) {
      svg.insertBefore(segment, hubStart);
    }

    if (detailTitle) {
      detailTitle.textContent = data.title;
    }

    if (detailMicro) {
      detailMicro.textContent = data.micro;
    }

    if (detailCopy) {
      detailCopy.textContent = data.copy;
    }
  };

  ringSegments.forEach((segment) => {
    segment.addEventListener('mouseenter', () => {
      selectRingSegment(segment);
    });

    segment.addEventListener('focus', () => {
      selectRingSegment(segment);
    });

    segment.addEventListener('click', () => {
      selectRingSegment(segment);
    });

    segment.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectRingSegment(segment);
      }
    });
  });
}

// Vertical phrase wheel is CSS-driven for smooth, gapless movement.

const carousel = document.querySelector('[data-carousel]');

if (carousel) {
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
  const previousButton = carousel.querySelector('[data-carousel-previous]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  const toggleButton = carousel.querySelector('[data-carousel-toggle]');
  const status = carousel.querySelector('[data-carousel-status]');
  let activeSlide = 0;
  let autoplayTimer = null;
  let explicitlyPaused = false;
  let focusInside = false;
  let touchStartX = null;

  const renderSlide = (index, announce = false) => {
    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeSlide;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    dots.forEach((dot, dotIndex) => {
      if (dotIndex === activeSlide) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    if (announce && status) {
      status.textContent = `Slide ${activeSlide + 1} of ${slides.length}`;
    }
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (reduceMotion || explicitlyPaused || focusInside || document.hidden) return;

    autoplayTimer = window.setInterval(() => {
      renderSlide(activeSlide + 1);
    }, 6000);
  };

  const showManualSlide = (index) => {
    renderSlide(index, true);
    startAutoplay();
  };

  previousButton?.addEventListener('click', () => showManualSlide(activeSlide - 1));
  nextButton?.addEventListener('click', () => showManualSlide(activeSlide + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => showManualSlide(index)));

  toggleButton?.addEventListener('click', () => {
    explicitlyPaused = !explicitlyPaused;
    toggleButton.setAttribute('aria-label', explicitlyPaused ? 'Play carousel' : 'Pause carousel');
    toggleButton.firstElementChild.textContent = explicitlyPaused ? 'Play' : 'Pause';
    startAutoplay();
  });

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showManualSlide(activeSlide - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showManualSlide(activeSlide + 1);
    }
  });

  carousel.addEventListener('focusin', () => {
    focusInside = true;
    stopAutoplay();
  });
  carousel.addEventListener('focusout', (event) => {
    if (event.relatedTarget && carousel.contains(event.relatedTarget)) return;
    focusInside = false;
    startAutoplay();
  });

  carousel.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
    stopAutoplay();
  }, { passive: true });
  carousel.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchStartX !== null && touchEndX !== undefined) {
      const distance = touchEndX - touchStartX;
      if (Math.abs(distance) >= 45) {
        showManualSlide(activeSlide + (distance < 0 ? 1 : -1));
      }
    }
    touchStartX = null;
    startAutoplay();
  }, { passive: true });

  document.addEventListener('visibilitychange', startAutoplay);

  if (reduceMotion && toggleButton) {
    toggleButton.hidden = true;
  }

  renderSlide(0);
  startAutoplay();
}


// Homepage audience and scenario tabs. Examples illustrate contextual help; future capabilities are not promised.
(() => {
  const audienceTabs = [...document.querySelectorAll('[data-tw-audience]')];
  const choices = document.querySelector('.tw-scenario-selector');
  const panel = document.getElementById('tw-scenario-panel');
  const audiencePanel = document.getElementById('tw-audience-content');
  if (!audienceTabs.length || !choices || !panel || !audiencePanel) return;
  const scenarios = {
    individual: [
      {"id":"classes","title":"Classes & Lectures","tagline":"Understand difficult lecture concepts while the class is happening","heading":"A university machine-learning lecture","intro":"Your professor is presenting a neural-network slide showing gradients flowing backward through hidden layers while explaining backpropagation and gradient descent.","quote":"“Backpropagation applies the chain rule to calculate how each weight contributes to the loss, allowing gradient descent to update the network.”","response":"TW Intelligence Assist (proactive): Real-world connection — a bank's fraud-detection model incorrectly flags a legitimate transaction. Backpropagation calculates how the network's weights contributed to the prediction error; gradient descent adjusts them to reduce errors across labeled training examples. Ask TW (on demand): You ask, “Give me a question to test my understanding.” TW suggests: “If the learning rate is too high, why might a fraud-detection model fail to converge even when its gradients are correct?”","source":"Drawing on: the ongoing lecture and displayed slide for Intelligence Assist; your practice-question request for Ask TW","benefit":"Connect the diagram on screen to a real fraud-detection problem, ask questions, and check your understanding while your professor is still on the topic—not hours later while rereading notes."},
      {"id":"interviews","title":"Interview Preparation","tagline":"Turn an enterprise-scale question into a defensible plan","heading":"An Enterprise AI Architect interview","intro":"You are interviewing for an enterprise AI architecture role at a financial institution. AI assistance is explicitly permitted.","quote":"“We have 40+ applications and sensitive customer data. How would you roll out GenAI securely, control costs, and prove business value?”","response":"Structure the answer as an execution roadmap: (1) rank use cases by measurable value, data readiness, and risk; (2) pilot a reusable AI gateway with governed RAG and model routing; (3) enforce identity-aware retrieval, PII controls, auditability, and human oversight; (4) introduce evaluation, latency and cost guardrails; (5) scale only when pilots meet quality, adoption, and cost-per-outcome targets. Tie each stage to a decision gate, not a technology shopping list.","source":"Drawing on: the interviewer’s question, enterprise AI architecture principles, and professional context you chose to provide","benefit":"Walk away from a sprawling 40-application question with an ordered rollout plan, measurable gates, and a clear way to defend each trade-off—not a list of AI buzzwords."}
    ],
    professional: [
      {"id":"discovery","title":"Client Discovery","tagline":"Expose a scope change before it becomes a commitment","heading":"Scoping a project","intro":"Your goal is to leave with an agreed scope and unresolved risks. Your supplied notes say the pilot covers Finance only.","quote":"“We need this to work for several departments, but their approval processes are different.”","response":"Suggested follow-up: “Are those other departments part of phase one, or does the Finance-only pilot still stand? Who approves exceptions across departments?”","source":"Drawing on: your Finance-only scope notes and the new department requirement","benefit":"Catch scope expansion at the moment it surfaces—before an ambiguous remark turns into an unpriced delivery obligation."},
      {"id":"demos","title":"Demos & Sales","tagline":"Handle objections without inventing product guarantees","heading":"An unexpected demo question","intro":"You shared your integration guide with TW before a customer demo.","quote":"“What happens if the integration fails halfway through?”","response":"Your guide says failed batches retry up to three times, then pause for manual review. It does not confirm that partial writes are rolled back. Explain the documented retry path, and say rollback behavior needs verification before you promise it.","source":"Drawing on: your supplied integration guide, including what it does not specify","benefit":"Answer a difficult live objection from your actual documentation—and avoid a costly promise the product guide cannot support."},
      {"id":"meetings","title":"Technical Meetings","tagline":"Spot the mismatch before you commit","heading":"A deadline that conflicts with the estimate","intro":"Your documented implementation estimate is eight weeks; the client is asking for a six-week launch.","quote":"“Can you commit to the launch date?”","response":"Your eight-week estimate conflicts with the six-week request. Before agreeing, ask whether launch scope can be phased, dependencies can be accelerated, or the date is flexible. State which assumptions would have to change.","source":"Drawing on: your eight-week estimate and the live request","benefit":"Catch a two-week delivery gap before saying “yes”—and leave the call with specific options instead of an accidental commitment."},
      {"id":"followup","title":"Follow-Up Discussions","tagline":"Bring a hidden open item into the next decision","heading":"The next client conversation","intro":"You explicitly supplied the unresolved actions from the previous session; automatic cross-session recall is not assumed.","quote":"“Great, can we kick off next week?”","response":"The carried-forward notes say phase-one SSO approval is still pending. Confirm who owns that decision and its due date before agreeing to a kickoff.","source":"Drawing on: prior-call action items that you supplied for this session","benefit":"Prevent a kickoff commitment from skipping a prerequisite everyone stopped mentioning—without searching old notes mid-call."}
    ],
    leaders: [
      {id:"executive", title:"Executive Decisions", tagline:"Evaluate hidden risks before approving a multimillion-dollar decision.", heading:"A $5 million rollout decision", intro:"At the previous quarter's review, leaders set a 70% pilot adoption threshold before expansion. You've supplied that presentation as context. Today's shared slide shows only 43% adoption, yet recommends a $5 million rollout.", quote:"“The pilot results support moving to a full rollout now.”", response:"Risk to evaluate: the rollout recommendation does not meet the earlier 70% adoption gate. At 43% adoption, projected benefits may not materialize as modeled. Before approving $5 million, ask for downside scenarios at current adoption, revised benefit assumptions, and whether phased investment can reduce exposure.", source:"Drawing on: the prior-quarter presentation supplied to TW, the currently shown slide, and the discussion using supplied prior-session context and current screen.", benefit:"Assess the downside and challenge unsupported assumptions before committing $5 million."},
      {id:"alignment", title:"Strategy & Alignment", tagline:"Avoid costly execution by choosing the right strategy early.", heading:"Choosing an enterprise AI delivery model", intro:"Leadership is considering a centralized enterprise AI platform versus separate business-unit AI solutions. Your supplied strategy sets governance, time-to-value, and total cost as key decision criteria.", quote:"“Should we centralize everything or let each business unit build its own AI stack?”", response:"Compare the decision before funding it: centralization can improve reuse and governance but may slow initial delivery; separate stacks can speed pilots but increase duplication and compliance overhead. A shared model/security gateway with business-unit applications may balance both. Ask which option best meets the agreed cost, speed, and risk criteria.", source:"Drawing on: the supplied AI strategy, proposed architecture options, and live discussion (illustrative).", benefit:"Avoid duplicated investment and expensive architecture rework by evaluating trade-offs before teams commit resources."},
      {id:"accountability", title:"Delivery & Accountability", tagline:"Surface hidden dependencies before your project turns red.", heading:"A green dashboard with an open launch dependency", intro:"The displayed delivery dashboard reports Green and the team proposes a launch next Friday. The release checklist supplied to TW still shows production security approval as pending.", quote:"“Development is complete, so can we confirm next Friday as the launch date?”", response:"The project is green for development, but production security sign-off remains open on the launch critical path. Confirm the approval owner, likely sign-off date, escalation trigger, and contingency before reaffirming the launch date.", source:"Drawing on: the supplied release checklist, currently displayed dashboard, and the live question.", benefit:"Escalate a release-critical dependency while there is still time to recover—not after a missed launch turns the project Red."}
    ]
  };
  let audience='individual';
  let tabs=[];
  function activateScenario(tab) {
    const data=scenarios[audience].find(x=>x.id===tab.dataset.twScenario);
    if(!data) return;
    tabs.forEach(t=>{const yes=t===tab;t.classList.toggle('is-active',yes);t.setAttribute('aria-selected',String(yes));t.tabIndex=yes?0:-1;});
    panel.setAttribute('aria-labelledby',tab.id);
    for(const key of ['heading','intro','quote','response','source','benefit']) {
      const el=panel.querySelector(`[data-tw-scenario-${key}]`);
      if(el) el.textContent=data[key];
    }
  }
  function selectAudience(tab) {
    audience=tab.dataset.twAudience;
    audienceTabs.forEach(t=>{const yes=t===tab;t.classList.toggle('is-active',yes);t.setAttribute('aria-selected',String(yes));t.tabIndex=yes?0:-1;});
    audiencePanel.setAttribute('aria-labelledby',tab.id);
    choices.replaceChildren();
    scenarios[audience].forEach(data=>{
      const btn=document.createElement('button');
      btn.type='button'; btn.className='tw-choice';btn.id='tw-tab-'+data.id;
      btn.setAttribute('role','tab');btn.setAttribute('aria-selected','false');btn.setAttribute('aria-controls','tw-scenario-panel');btn.tabIndex=-1;btn.dataset.twScenario=data.id;
      const strong=document.createElement('strong');strong.textContent=data.title;
      const span=document.createElement('span');span.textContent=data.tagline;
      btn.append(strong,span);choices.append(btn);
    });
    tabs=[...choices.querySelectorAll('[data-tw-scenario]')];
    if(tabs.length) activateScenario(tabs[0]);
  }
  function keyboardTabs(event,arr,current,callback) {
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const index=arr.indexOf(current);
    const next=event.key==='Home'?0:event.key==='End'?arr.length-1:(index+(event.key==='ArrowRight'?1:-1)+arr.length)%arr.length;
    callback(arr[next]);arr[next].focus();
  }
  audienceTabs.forEach(t=>{
    t.addEventListener('click',()=>selectAudience(t));
    t.addEventListener('keydown',e=>keyboardTabs(e,audienceTabs,t,selectAudience));
  });
  choices.addEventListener('click',e=>{const t=e.target.closest('[data-tw-scenario]');if(t) activateScenario(t);});
  choices.addEventListener('keydown',e=>{const t=e.target.closest('[data-tw-scenario]');if(t) keyboardTabs(e,tabs,t,activateScenario);});
  selectAudience(audienceTabs[0]);
  document.querySelector("[data-tw-seo-catalog]")?.setAttribute("hidden", "");
})();

// Three real-product walkthrough states; no AI-generated mock screenshots.
(() => {
  const tabs = [...document.querySelectorAll('[data-tw-step]')];
  if (!tabs.length) return;
  const panel = document.getElementById('tw-step-preview');
  const img = panel.querySelector('[data-tw-preview-img]');
  const fallback = panel.querySelector('[data-tw-preview-fallback]');
  const caption = panel.querySelector('[data-tw-preview-caption]');
  const previews = [
    { src: './assets/screenshots/site-real/tw-toolbar-presession.png', alt: 'Real ThoughtWaves desktop toolbar before a session', caption: 'Open the TW desktop app and start a live session whenever a conversation begins. TW listens through your selected audio sources, and you can add context beforehand if you want—no mandatory preparation.' },
    { src: './assets/screenshots/site-real/tw-discussion.png', alt: 'Real ThoughtWaves Discussion screen', caption: 'View conversation and contextual assistance in the real application.' },
    { src: './assets/screenshots/site-real/tw-review.png', alt: 'Actual ThoughtWaves Review screen captured in the desktop application', caption: 'See session review insights in the actual ThoughtWaves app.' }
  ];
  function select(tab) {
    const idx = Number(tab.dataset.twStep);
    const data = previews[idx]; if (!data) return;
    tabs.forEach(t => { const active = t === tab; t.classList.toggle('is-active', active); t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tab.id);
    if (data.src) { img.src = data.src; img.alt = data.alt; img.hidden = false; fallback.hidden = true; }
    else { img.hidden = true; fallback.hidden = false; }
    caption.textContent = data.caption;
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (['ArrowDown','ArrowRight'].includes(e.key) ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[next]); tabs[next].focus();
    });
  });
})();
