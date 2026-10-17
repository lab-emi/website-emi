document.querySelectorAll<HTMLElement>('[data-agentic-build]').forEach(root => {
  const pieces = [...root.querySelectorAll<SVGElement>('[data-piece-at]')];
  const wires = [...root.querySelectorAll<SVGElement>('[data-wire-at]')];
  const replay = root.querySelector<HTMLButtonElement>('[data-build-replay]')!;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let timer: number | undefined;
  let startedAt = 0;
  let disposed = false;

  function motionAllowed() {
    return !preference.matches && document.documentElement.dataset.motion !== 'off';
  }
  function stop() {
    window.clearTimeout(timer);
    timer = undefined;
  }
  function render(time: number) {
    let assembled = 0;
    pieces.forEach(piece => {
      const built = time >= Number(piece.dataset.pieceAt);
      if (built) assembled++;
      if (piece.dataset.built !== String(built)) piece.dataset.built = String(built);
    });
    wires.forEach(wire => {
      const built = time >= Number(wire.dataset.wireAt);
      if (wire.dataset.built !== String(built)) wire.dataset.built = String(built);
    });
    const phase = time < 350 ? 'plan' : time < 2900 ? 'compose' : time < 3900 ? 'connect' : time < 5000 ? 'refine' : 'ready';
    if (root.dataset.phase !== phase) root.dataset.phase = phase;
    root.dataset.assembled = String(assembled);
  }
  function showComplete() {
    stop();
    root.dataset.animated = 'false';
    render(6000);
    replay.hidden = !motionAllowed();
  }
  function tick() {
    timer = undefined;
    if (disposed || !visible || document.hidden || root.closest('[hidden]')) { showComplete(); return; }
    if (!motionAllowed()) { showComplete(); return; }
    const elapsed = performance.now() - startedAt;
    if (elapsed >= 7800) startedAt = performance.now();
    render(elapsed >= 7800 ? 0 : elapsed);
    timer = window.setTimeout(tick, 90);
  }
  function start(restart = false) {
    replay.hidden = !motionAllowed();
    if (disposed || !visible || document.hidden || root.closest('[hidden]') || !motionAllowed()) { showComplete(); return; }
    if (timer !== undefined && !restart) return;
    stop();
    startedAt = performance.now();
    root.dataset.animated = 'true';
    render(0);
    timer = window.setTimeout(tick, 90);
  }
  const observer = new IntersectionObserver(entries => {
    const wasVisible = visible;
    visible = entries[0].isIntersecting;
    if (!visible) showComplete();
    else start(!wasVisible);
  }, { threshold: .1 });
  observer.observe(root);
  replay.addEventListener('click', () => start(true));
  preference.addEventListener('change', () => start(true));
  window.addEventListener('emi:motion', () => start(true));
  document.addEventListener('visibilitychange', () => start(true));
  window.addEventListener('pagehide', event => {
    stop();
    if (!event.persisted) { disposed = true; observer.disconnect(); }
  });
  window.addEventListener('pageshow', () => start(true));
  showComplete();
});
