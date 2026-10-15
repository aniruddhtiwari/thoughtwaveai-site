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
      title: 'Real Intelligence',
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
