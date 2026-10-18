import { notePageMovement } from './motion-scenes';

interface ChapterScrollOptions {
  sections: HTMLElement[];
  getInset: () => number;
  reduced: MediaQueryList;
}

export function createChapterScroller({ sections, getInset, reduced }: ChapterScrollOptions) {
  const root = document.documentElement;
  let motionTimer: number | undefined;
  let motionTarget: number | undefined;
  let motionDeadline = 0;
  let destinations: number[] = [];
  let sectionTops: number[] = [];
  let scrollLimit = 0;

  function refresh() {
    const y = scrollY;
    const inset = getInset();
    scrollLimit = Math.max(0, root.scrollHeight - innerHeight);
    sectionTops = [];
    destinations = sections.map(section => {
      const rect = section.getBoundingClientRect();
      sectionTops.push(y + rect.top);
      return Math.min(scrollLimit, Math.max(0, y + rect.top - inset));
    });
  }
  function currentAt(readingLine: number) {
    const y = scrollY + readingLine;
    let index = 0;
    sectionTops.forEach((top, i) => { if (top <= y) index = i; });
    return sections[index];
  }
  function finishMotion() {
    window.clearTimeout(motionTimer);
    motionTimer = undefined;
    motionTarget = undefined;
    root.classList.remove('chapter-transition');
  }
  function cancelMotion() {
    if (motionTarget !== undefined) window.scrollTo({ top: scrollY, behavior: 'instant' });
    finishMotion();
  }
  function checkMotion() {
    window.clearTimeout(motionTimer);
    motionTimer = undefined;
    if (motionTarget === undefined) return;
    if (Math.abs(scrollY - motionTarget) < 2 || performance.now() > motionDeadline) finishMotion();
    else motionTimer = window.setTimeout(checkMotion, 120);
  }
  function navigateTo(top: number) {
    cancelMotion();
    const target = Math.max(0, Math.min(top, scrollLimit));
    if (reduced.matches || root.dataset.motion === 'off' || Math.abs(target - scrollY) < 1) {
      window.scrollTo({ top: target, behavior: 'instant' });
      return;
    }
    notePageMovement();
    motionTarget = target;
    motionDeadline = performance.now() + 2400;
    root.classList.add('chapter-transition');
    // Native smooth scrolling does not depend on a JavaScript callback per frame.
    window.scrollTo({ top: target, behavior: 'smooth' });
    motionTimer = window.setTimeout(checkMotion, 120);
  }
  function navigate(section: HTMLElement) {
    const destination = destinations[sections.indexOf(section)];
    if (destination !== undefined) navigateTo(destination);
  }

  // Wheel and touch input belong entirely to the browser. Only an explicit
  // chapter-link click starts programmatic scrolling; no input is prevented.
  window.addEventListener('wheel', finishMotion, { passive: true });
  reduced.addEventListener('change', cancelMotion);
  window.addEventListener('resize', cancelMotion, { passive: true });
  window.addEventListener('pointerdown', cancelMotion, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) cancelMotion();
  });
  window.addEventListener('emi:motion', () => {
    if (root.dataset.motion === 'off' && motionTarget !== undefined) navigateTo(motionTarget);
  });
  window.addEventListener('pagehide', cancelMotion);
  window.addEventListener('popstate', cancelMotion);
  window.addEventListener('hashchange', cancelMotion);
  document.addEventListener('scrollend', checkMotion);
  refresh();
  return { navigate, refresh, currentAt };
}
