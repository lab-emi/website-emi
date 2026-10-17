const html = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
let manual: string | null = null;
try { manual = sessionStorage.getItem('emi-motion'); } catch { /* Storage is optional. */ }

function syncMotion() {
  const paused = preference.matches || manual === 'off';
  html.dataset.motion = paused ? 'off' : 'on';
  motionButton?.setAttribute('aria-pressed', String(paused));
  motionButton?.setAttribute('aria-label', paused ? 'Play animations' : 'Pause animations');
  if (motionButton) { motionButton.title = paused ? 'Play animations' : 'Pause animations'; motionButton.hidden = preference.matches; }
  window.dispatchEvent(new CustomEvent('emi:motion'));
}
motionButton?.addEventListener('click', () => {
  manual = html.dataset.motion === 'off' ? 'on' : 'off';
  try { sessionStorage.setItem('emi-motion', manual); } catch { /* Storage is optional. */ }
  syncMotion();
});
preference.addEventListener('change', syncMotion);
syncMotion();

if ('IntersectionObserver' in window && !preference.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); } });
  }, { threshold: .06, rootMargin: '0px 0px -22px 0px' });
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight * .95) element.classList.add('reveal-pending');
    observer.observe(element);
  });
}

const header = document.querySelector<HTMLElement>('.site-header');
const progress = document.querySelector<HTMLElement>('[data-reading-progress]');
let scheduled = false;
function updateScroll() {
  const distance = html.scrollHeight - window.innerHeight;
  const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
  if (progress) progress.style.transform = `scaleX(${fraction})`;
  header?.classList.toggle('is-scrolled', window.scrollY > 15);
  scheduled = false;
}
window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
window.addEventListener('resize', updateScroll, { passive: true });
updateScroll();
