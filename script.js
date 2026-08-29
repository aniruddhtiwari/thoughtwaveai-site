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

const betaAccessTriggers = document.querySelectorAll('[data-beta-trigger]');
const betaAccessModal = document.getElementById('beta-access-modal');
const modalPanel = betaAccessModal?.querySelector('.modal-panel');
const modalClose = betaAccessModal?.querySelector('.modal-close');
let modalReturnFocus = null;

const modalFocusableElements = () => Array.from(betaAccessModal?.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
const openBetaModal = (event) => {
  if (!betaAccessModal) return;
  modalReturnFocus = event?.currentTarget ?? document.activeElement;
  betaAccessModal.hidden = false;
  document.body.classList.add('modal-open');
  modalClose?.focus();
};
const closeBetaModal = () => {
  if (!betaAccessModal || betaAccessModal.hidden) return;
  betaAccessModal.hidden = true;
  document.body.classList.remove('modal-open');
  modalReturnFocus?.focus();
  modalReturnFocus = null;
};

betaAccessTriggers.forEach((trigger) => trigger.addEventListener('click', openBetaModal));
modalClose?.addEventListener('click', closeBetaModal);
betaAccessModal?.addEventListener('click', (event) => { if (event.target === betaAccessModal) closeBetaModal(); });
modalPanel?.addEventListener('click', (event) => event.stopPropagation());

document.addEventListener('keydown', (event) => {
  if (!betaAccessModal || betaAccessModal.hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); closeBetaModal(); return; }
  if (event.key !== 'Tab') return;
  const focusable = modalFocusableElements();
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
