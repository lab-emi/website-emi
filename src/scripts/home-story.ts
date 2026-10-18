export {};

const root = document.documentElement;
const sections = [...document.querySelectorAll<HTMLElement>('[data-story-section]')];
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]')];
const header = document.querySelector<HTMLElement>('.site-header');
const stage = document.querySelector<HTMLElement>('.research-first .engine-stage');
const chip = stage?.querySelector<HTMLElement>('.engine-platform');
const team = document.querySelector<HTMLElement>('[data-team-section]');
const collage = team?.querySelector<HTMLElement>('.team-collage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
root.classList.add('home-story');
let scheduled = false;

function update() {
  const headerHeight = header?.offsetHeight || 70;
  root.style.setProperty('--site-header-size', `${headerHeight}px`);
  if (stage && chip && matchMedia('(min-width: 901px)').matches) {
    const scale = Math.min(1, (stage.clientWidth - 28) / (chip.offsetWidth * 1.62), (stage.clientHeight - 24) / (chip.offsetHeight * 1.4));
    chip.style.setProperty('--home-chip-scale', String(Math.max(.15, scale)));
  } else chip?.style.removeProperty('--home-chip-scale');

  const readingLine = headerHeight + Math.min(140, innerHeight * .2);
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine) current = section;
  }
  links.forEach(link => {
    if (link.dataset.chapterLink === current?.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scheduled = false;
}
function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleUpdate, { passive: true });
const layoutObserver = new ResizeObserver(scheduleUpdate);
if (header) layoutObserver.observe(header);
if (stage) layoutObserver.observe(stage);

links.forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.dataset.chapterLink!);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ block: 'start', behavior: reduced.matches || root.dataset.motion === 'off' ? 'instant' : 'smooth' });
  history.pushState(null, '', link.hash);
}));

// A desktop wheel gesture advances at chapter boundaries; long content and
// nested scrollers keep normal scrolling, and browser zoom is never intercepted.
let gestureUsed = false;
let lockedUntil = 0;
let quietTimer: number | undefined;
function nestedScrollerCanMove(target: EventTarget | null, direction: number) {
  if (!(target instanceof Element)) return false;
  for (let element: Element | null = target; element && element !== document.body; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (!/(auto|scroll)/.test(style.overflowY) || element.scrollHeight <= element.clientHeight + 1) continue;
    if (direction > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 2 : element.scrollTop > 2) return true;
  }
  return false;
}
window.addEventListener('wheel', event => {
  if (reduced.matches || !matchMedia('(min-width: 901px) and (pointer: fine)').matches || event.ctrlKey || event.metaKey || event.altKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || Math.abs(event.deltaY) < 2) return;
  const direction = Math.sign(event.deltaY);
  if (nestedScrollerCanMove(event.target, direction)) return;
  window.clearTimeout(quietTimer);
  quietTimer = window.setTimeout(() => { gestureUsed = false; }, 200);
  if (gestureUsed || performance.now() < lockedUntil) { event.preventDefault(); return; }
  const inset = (header?.offsetHeight || 70) + 10;
  const positions = sections.map(section => {
    const bounds = section.getBoundingClientRect();
    return { start: Math.max(0, scrollY + bounds.top - inset), end: Math.max(0, scrollY + bounds.bottom - innerHeight + 12) };
  });
  let index = 0;
  positions.forEach((position, i) => { if (position.start <= scrollY + 16) index = i; });
  const position = positions[index];
  if (!position || (direction > 0 && scrollY < Math.max(position.start,position.end) - 16) || (direction < 0 && scrollY > position.start + 16)) return;
  const next = index + direction;
  if (next < 0 || next >= sections.length) return;
  event.preventDefault();
  gestureUsed = true;
  lockedUntil = performance.now() + 900;
  const destination = direction > 0 ? positions[next].start : Math.max(positions[next].start, positions[next].end);
  window.scrollTo({ top: destination, behavior: root.dataset.motion === 'off' ? 'instant' : 'smooth' });
  history.replaceState(null, '', `#${sections[next].id}`);
}, { passive: false });

function syncTeamMotion() {
  if (!team || !collage) return;
  const enabled = !reduced.matches && root.dataset.motion !== 'off';
  team.classList.toggle('team-motion-ready', enabled);
  if (!enabled) team.dataset.teamVisible = 'true';
  else {
    const bounds = collage.getBoundingClientRect();
    team.dataset.teamVisible = String(bounds.bottom > 0 && bounds.top < innerHeight * .92);
  }
}
const teamObserver = new IntersectionObserver(entries => {
  if (!team || reduced.matches || root.dataset.motion === 'off') return;
  team.dataset.teamVisible = String(entries[0].isIntersecting);
}, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
if (collage) teamObserver.observe(collage);
reduced.addEventListener('change', syncTeamMotion);
window.addEventListener('emi:motion', syncTeamMotion);
window.addEventListener('pagehide', () => { layoutObserver.disconnect(); teamObserver.disconnect(); });
window.addEventListener('pageshow', () => {
  if (header) layoutObserver.observe(header);
  if (stage) layoutObserver.observe(stage);
  if (collage) teamObserver.observe(collage);
  syncTeamMotion();
  scheduleUpdate();
});
syncTeamMotion();
update();
