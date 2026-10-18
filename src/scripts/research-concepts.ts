document.querySelectorAll<HTMLElement>('[data-research-concept]').forEach(root => {
  const replay = root.querySelector<HTMLButtonElement>('[data-concept-replay]')!;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let timer: number | undefined;
  let startedAt = 0;
  let visible = false;

  const motionAllowed = () => !preference.matches && document.documentElement.dataset.motion !== 'off';
  function onScreen() {
    if (!root.isConnected || root.closest('[hidden]')) return false;
    const bounds = root.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight && bounds.right > 0 && bounds.left < innerWidth;
  }
  function stop() {
    window.clearTimeout(timer);
    timer = undefined;
    root.dataset.running = 'false';
    root.dataset.phase = 'ready';
    replay.hidden = !motionAllowed();
  }
  function tick() {
    timer = undefined;
    if (!onScreen() || document.hidden || !motionAllowed()) { stop(); return; }
    root.dataset.phase = String(Math.floor((performance.now() - startedAt) % 6000 / 2000));
    timer = window.setTimeout(tick, 160);
  }
  function start(restart = false) {
    replay.hidden = !motionAllowed();
    if (!onScreen() || document.hidden || !motionAllowed()) { stop(); return; }
    if (timer !== undefined && !restart) return;
    window.clearTimeout(timer);
    startedAt = performance.now();
    root.dataset.running = 'true';
    // Reset the CSS timelines together so Replay restarts the full visual sequence.
    root.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 0; });
    tick();
  }
  const observer = new IntersectionObserver(() => {
    const inside = onScreen();
    if (inside) start(!visible);
    else stop();
    visible = inside;
  }, { threshold: .1 });
  observer.observe(root);
  replay.addEventListener('click', () => start(true));
  preference.addEventListener('change', () => start(true));
  window.addEventListener('emi:motion', () => start(true));
  document.addEventListener('visibilitychange', () => start(true));
  window.addEventListener('pagehide', () => { stop(); observer.disconnect(); });
  window.addEventListener('pageshow', () => { observer.observe(root); start(true); });
  stop();
  requestAnimationFrame(() => start(true));
});
