import { observeMotionScene } from './motion-scenes';

document.querySelectorAll<HTMLElement>('[data-agentic-build]').forEach(root => {
  const pieces = [...root.querySelectorAll<SVGElement>('[data-piece-at]')].map(element => ({ element, at: Number(element.dataset.pieceAt) }));
  const wires = [...root.querySelectorAll<SVGElement>('[data-wire-at]')].map(element => ({ element, at: Number(element.dataset.wireAt) }));
  const moments = [...new Set([350, 2900, 3900, 5000, 7800, ...pieces.map(p => p.at), ...wires.map(p => p.at)])].sort((a, b) => a - b);
  const replay = root.querySelector<HTMLButtonElement>('[data-build-replay]')!;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let active = false;
  let timer: number | undefined;
  let elapsed = 0;
  let startedAt = 0;

  function motionAllowed() {
    return !preference.matches && document.documentElement.dataset.motion !== 'off';
  }
  function pause() {
    if (timer !== undefined) elapsed = (performance.now() - startedAt) % 7800;
    window.clearTimeout(timer);
    timer = undefined;
  }
  function render(time: number) {
    let assembled = 0;
    pieces.forEach(({ element, at }) => {
      const built = time >= at;
      if (built) assembled++;
      if (element.dataset.built !== String(built)) element.dataset.built = String(built);
    });
    wires.forEach(({ element, at }) => {
      const built = String(time >= at);
      if (element.dataset.built !== built) element.dataset.built = built;
    });
    const phase = time < 350 ? 'plan' : time < 2900 ? 'compose' : time < 3900 ? 'connect' : time < 5000 ? 'refine' : 'ready';
    if (root.dataset.phase !== phase) root.dataset.phase = phase;
    if (root.dataset.assembled !== String(assembled)) root.dataset.assembled = String(assembled);
  }
  function tick() {
    elapsed = (performance.now() - startedAt) % 7800;
    render(elapsed);
    const next = moments.find(at => at > elapsed) ?? 7800;
    timer = window.setTimeout(tick, Math.max(16, next - elapsed));
  }
  function start() {
    if (!active || timer !== undefined) return;
    root.dataset.animated = 'true';
    startedAt = performance.now() - elapsed;
    tick();
  }
  function sync(running: boolean) {
    active = running;
    replay.hidden = !motionAllowed();
    if (!motionAllowed()) {
      pause();
      elapsed = 0;
      root.dataset.animated = 'false';
      render(6000);
    } else if (active) start();
    else pause();
  }
  replay.addEventListener('click', () => {
    pause();
    elapsed = 0;
    render(0);
    start();
  });
  root.dataset.animated = 'false';
  render(6000);
  observeMotionScene(root, sync);
});
