const carousel = document.querySelector<HTMLElement>('[data-hero-carousel]');

if (carousel) {
  const slides = [...carousel.querySelectorAll<HTMLImageElement>('.hero-slide')];
  const caption = carousel.querySelector<HTMLElement>('[data-carousel-caption]')!;
  const toggle = carousel.querySelector<HTMLButtonElement>('[data-carousel-toggle]')!;
  const pauseIcon = toggle.querySelector<HTMLElement>('[data-pause-icon]')!;
  const playIcon = toggle.querySelector<HTMLElement>('[data-play-icon]')!;
  // Start automatically; reduced-motion styles remove the crossfade animation.
  let paused = false;
  let focused = carousel.contains(document.activeElement);
  let hovered = window.matchMedia('(any-hover: hover)').matches && carousel.matches(':hover');
  let active = 0;
  let timer: number | undefined;

  function updateControl() {
    const label = paused ? 'Play slideshow' : 'Pause slideshow';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    pauseIcon.toggleAttribute('hidden', paused);
    playIcon.toggleAttribute('hidden', !paused);
  }

  function schedule() {
    window.clearTimeout(timer);
    if (paused || focused || hovered || document.hidden || slides.length < 2) return;
    timer = window.setTimeout(() => {
      // Keep the current image visible until another photo has loaded.
      for (let offset = 1; offset < slides.length; offset++) {
        const next = (active + offset) % slides.length;
        if (!slides[next].complete || !slides[next].naturalWidth) continue;
        slides[active].classList.remove('is-active');
        slides[active].setAttribute('aria-hidden', 'true');
        slides[next].classList.add('is-active');
        slides[next].setAttribute('aria-hidden', 'false');
        caption.textContent = slides[next].dataset.caption || '';
        active = next;
        break;
      }
      schedule();
    }, 2000);
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
  window.addEventListener('pagehide', () => window.clearTimeout(timer));
  window.addEventListener('pageshow', schedule);

  toggle.hidden = slides.length < 2;
  updateControl();
  schedule();
}
