type Scene = { element: HTMLElement | SVGElement; visible: boolean; active: boolean; change?: (active: boolean) => void };

const root = document.documentElement;
const scenes = new Map<Element, Scene>();
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let moving = false;
let pageActive = true;
let lastMovement = 0;
let idleTimer: number | undefined;

function sync(scene: Scene) {
  const active = scene.visible && pageActive && !moving && !document.hidden && !preference.matches && root.dataset.motion !== 'off';
  if (scene.active === active) return;
  scene.active = active;
  scene.element.dataset.sceneActive = String(active);
  scene.change?.(active);
}
function syncAll() { scenes.forEach(sync); }
function finishScrolling() {
  window.clearTimeout(idleTimer);
  idleTimer = undefined;
  if (!moving) return;
  moving = false;
  root.removeAttribute('data-scrolling');
  syncAll();
}
function checkIdle() {
  const remaining = 180 - (performance.now() - lastMovement);
  if (remaining > 0) idleTimer = window.setTimeout(checkIdle, remaining);
  else finishScrolling();
}

// Freeze only decorative timelines while the browser is moving the page.
// One shared observer and one idle timer serve all scenes.
export function notePageMovement() {
  lastMovement = performance.now();
  if (!moving) {
    moving = true;
    root.dataset.scrolling = 'true';
    syncAll();
  }
  if (idleTimer === undefined) idleTimer = window.setTimeout(checkIdle, 180);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const scene = scenes.get(entry.target);
    if (!scene) return;
    scene.visible = entry.isIntersecting;
    scene.element.dataset.sceneVisible = String(scene.visible);
    sync(scene);
  });
}, { threshold: 0 });

export function observeMotionScene(element: HTMLElement | SVGElement, change?: Scene['change']) {
  const scene: Scene = { element, visible: false, active: false, change };
  scenes.set(element, scene);
  element.dataset.motionScene = '';
  element.dataset.sceneActive = 'false';
  change?.(false);
  observer.observe(element);
}

window.addEventListener('scroll', notePageMovement, { passive: true });
document.addEventListener('scrollend', finishScrolling);
function syncPreferences() {
  syncAll();
  // Inactive scenes also need to expose their static reduced-motion state.
  scenes.forEach(scene => { if (!scene.active) scene.change?.(false); });
}
window.addEventListener('emi:motion', syncPreferences);
preference.addEventListener('change', syncPreferences);
document.addEventListener('visibilitychange', syncAll);
window.addEventListener('pagehide', () => { pageActive = false; observer.disconnect(); finishScrolling(); syncAll(); });
window.addEventListener('pageshow', () => {
  pageActive = true;
  scenes.forEach(scene => observer.observe(scene.element));
  syncAll();
});
