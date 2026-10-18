import { observeMotionScene } from './motion-scenes';

document.querySelectorAll<HTMLElement>('[data-research-concept]').forEach(root => {
  const replay = root.querySelector<HTMLButtonElement>('[data-concept-replay]')!;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let timer: number | undefined;
  let elapsed = 0;
  let startedAt = 0;
  let active = false;

  const motionAllowed = () => !preference.matches && document.documentElement.dataset.motion !== 'off';
  function pause() {
    if (timer !== undefined) elapsed = (performance.now() - startedAt) % 6000;
    window.clearTimeout(timer);
    timer = undefined;
  }
  function tick() {
    elapsed = (performance.now() - startedAt) % 6000;
    const phase = Math.floor(elapsed / 2000);
    if (root.dataset.phase !== String(phase)) root.dataset.phase = String(phase);
    timer = window.setTimeout(tick, Math.max(16, (phase + 1) * 2000 - elapsed));
  }
  function start() {
    if (!active || timer !== undefined) return;
    root.dataset.running = 'true';
    startedAt = performance.now() - elapsed;
    tick();
  }
  function sync(running: boolean) {
    active = running;
    replay.hidden = !motionAllowed();
    if (!motionAllowed()) {
      pause();
      elapsed = 0;
      root.dataset.running = 'false';
      root.dataset.phase = 'ready';
    } else if (active) start();
    else pause();
  }
  replay.addEventListener('click', () => {
    pause();
    elapsed = 0;
    root.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 0; });
    start();
  });
  root.dataset.running = 'false';
  root.dataset.phase = 'ready';
  observeMotionScene(root, sync);
});
