import { createChapterScroller } from './chapter-scroll';

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
let layoutDirty = true;
let headerHeight = header?.offsetHeight || 70;
let currentId: string | undefined;
const scroller = createChapterScroller({ sections, getInset: () => headerHeight + 10, reduced });

function update() {
  if (layoutDirty) {
    headerHeight = header?.offsetHeight || 70;
    root.style.setProperty('--site-header-size', `${headerHeight}px`);
    if (stage && chip && matchMedia('(min-width: 901px)').matches) {
      const scale = Math.min(1, (stage.clientWidth - 28) / (chip.offsetWidth * 1.62), (stage.clientHeight - 24) / (chip.offsetHeight * 1.4));
      chip.style.setProperty('--home-chip-scale', String(Math.max(.15, scale)));
    } else chip?.style.removeProperty('--home-chip-scale');
    scroller.refresh();
    layoutDirty = false;
  }

  const readingLine = headerHeight + Math.min(140, innerHeight * .2);
  const current = scroller.currentAt(readingLine);
  if (currentId !== current?.id) {
    currentId = current?.id;
    links.forEach(link => {
      if (link.dataset.chapterLink === currentId) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  scheduled = false;
}
function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
function scheduleLayout() { layoutDirty = true; scheduleUpdate(); }
window.addEventListener('resize', scheduleLayout, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleLayout, { passive: true });
const layoutObserver = new ResizeObserver(scheduleLayout);
if (header) layoutObserver.observe(header);
if (stage) layoutObserver.observe(stage);
sections.forEach(section => layoutObserver.observe(section));

links.forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.dataset.chapterLink!);
  if (!target) return;
  event.preventDefault();
  scroller.navigate(target);
  history.pushState(null, '', link.hash);
}));

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
  sections.forEach(section => layoutObserver.observe(section));
  if (collage) teamObserver.observe(collage);
  syncTeamMotion();
  scheduleLayout();
});
syncTeamMotion();
update();
