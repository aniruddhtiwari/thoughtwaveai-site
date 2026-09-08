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
      copy: 'Choose how ThoughtWaveAI supports the moment—follow Discussion, ask directly with Ask TW, request Assist, or consider proactive TW Intelligence Assist.'
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
      title: 'Right Intelligence',
      micro: 'Discussion · Ask TW · Assist · TW Intelligence Assist',
      copy: 'Surface the right help at the right time—whether you ask directly, request assistance, or ThoughtWaveAI identifies something worth raising.'
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