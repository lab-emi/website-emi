import { observeMotionScene } from './motion-scenes';

const carousel = document.querySelector<HTMLElement>('[data-hero-carousel]');

if (carousel) {
  const slides = [...carousel.querySelectorAll<HTMLImageElement>('.hero-slide')];
  const caption = carousel.querySelector<HTMLElement>('[data-carousel-caption]')!;
  const toggle = carousel.querySelector<HTMLButtonElement>('[data-carousel-toggle]')!;
  const pauseIcon = toggle.querySelector<HTMLElement>('[data-pause-icon]')!;
  const playIcon = toggle.querySelector<HTMLElement>('[data-play-icon]')!;
  // Autoplay only while visible and while the site's motion controls allow it.
  let paused = false;
  let focused = carousel.contains(document.activeElement);
  let hovered = window.matchMedia('(any-hover: hover)').matches && carousel.matches(':hover');
  let active = 0;
  let timer: number | undefined;
  let inView = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sitePaused = () => reduced.matches || document.documentElement.dataset.motion === 'off';

  function updateControl() {
    const effectivePause = paused || sitePaused();
    const label = sitePaused() ? 'Slideshow paused with site animations' : paused ? 'Play slideshow' : 'Pause slideshow';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.disabled = sitePaused();
    pauseIcon.toggleAttribute('hidden', effectivePause);
    playIcon.toggleAttribute('hidden', !effectivePause);
  }

  function showSlide(next: number) {
    slides[active].classList.remove('is-active');
    slides[active].setAttribute('aria-hidden', 'true');
    slides[next].classList.add('is-active');
    slides[next].setAttribute('aria-hidden', 'false');
    caption.textContent = slides[next].dataset.caption || '';
    active = next;
  }

  function schedule() {
    window.clearTimeout(timer);
    if (paused || sitePaused() || !inView || focused || hovered || document.hidden || slides.length < 2) return;
    timer = window.setTimeout(() => {
      // Keep the current image visible until another photo has loaded.
      for (let offset = 1; offset < slides.length; offset++) {
        const next = (active + offset) % slides.length;
        if (!slides[next].complete || !slides[next].naturalWidth) continue;
        showSlide(next);
        break;
      }
      schedule();
    }, 3000);
  }

  carousel.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovered = true;
    schedule();
  });
  carousel.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    hovered = false;
    schedule();
  });
  carousel.addEventListener('focusin', () => { focused = true; schedule(); });
  carousel.addEventListener('focusout', event => {
    focused = event.relatedTarget instanceof Node && carousel.contains(event.relatedTarget);
    schedule();
  });
  toggle.addEventListener('click', () => {
    paused = !paused;
    // An explicit Play action can resume after keyboard focus paused rotation.
    if (!paused) focused = false;
    updateControl();
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('emi:motion', () => { updateControl(); schedule(); });
  reduced.addEventListener('change', () => { updateControl(); schedule(); });
  observeMotionScene(carousel, active => { inView = active; schedule(); });
  for (const [selector, direction] of [['[data-carousel-previous]', -1], ['[data-carousel-next]', 1]] as const) {
    const button = carousel.querySelector<HTMLButtonElement>(selector);
    if (!button) continue;
    button.hidden = slides.length < 2;
    button.addEventListener('click', () => { showSlide((active + direction + slides.length) % slides.length); schedule(); });
  }
  window.addEventListener('pagehide', () => window.clearTimeout(timer));
  window.addEventListener('pageshow', schedule);

  toggle.hidden = slides.length < 2;
  updateControl();
  schedule();
}
