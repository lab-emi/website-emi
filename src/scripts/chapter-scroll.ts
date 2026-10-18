import { notePageMovement } from './motion-scenes';

interface ChapterScrollOptions {
  sections: HTMLElement[];
  getInset: () => number;
  reduced: MediaQueryList;
}

type Bounds = { start: number; end: number };
type Gesture = {
  mode: 'pending' | 'chapter' | 'content' | 'nested' | 'free';
  lastEvent: number;
  lastMagnitude: number;
  direction: number;
  events: number;
  intent: number;
  index: number;
  bounds: Bounds;
  scroller?: Element;
};

export function createChapterScroller({ sections, getInset, reduced }: ChapterScrollOptions) {
  const root = document.documentElement;
  const desktop = matchMedia('(pointer: fine)');
  const quietPeriod = 320;
  const tailMemory = 1400;
  let gesture: Gesture | undefined;
  let quietTimer: number | undefined;
  let motionTimer: number | undefined;
  let contentFrame: number | undefined;
  let contentDelta = 0;
  let motionTarget: number | undefined;
  let motionDeadline = 0;
  let positions: Bounds[] = [];
  let sectionTops: number[] = [];
  let scrollLimit = 0;

  function refresh() {
    const y = scrollY;
    const inset = getInset();
    scrollLimit = Math.max(0, root.scrollHeight - innerHeight);
    sectionTops = [];
    positions = sections.map(section => {
      const rect = section.getBoundingClientRect();
      sectionTops.push(y + rect.top);
      const start = Math.min(scrollLimit, Math.max(0, y + rect.top - inset));
      const end = Math.min(scrollLimit, Math.max(start, y + rect.bottom - innerHeight + 12));
      return { start, end: end - start < 24 ? start : end };
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
    if (contentFrame !== undefined) cancelAnimationFrame(contentFrame);
    contentFrame = undefined;
    contentDelta = 0;
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
    gesture = undefined;
    window.clearTimeout(quietTimer);
    navigateTo(positions[sections.indexOf(section)].start);
  }
  function scrollableParent(target: EventTarget | null, delta: number) {
    if (!(target instanceof Element)) return;
    for (let element: Element | null = target; element && element !== document.body; element = element.parentElement) {
      if (!/(auto|scroll)/.test(getComputedStyle(element).overflowY) || element.scrollHeight <= element.clientHeight + 1) continue;
      if (canMove(element, delta)) return element;
    }
  }
  function canMove(element: Element, delta: number) {
    return delta > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 2 : element.scrollTop > 2;
  }
  function scrollContent(delta: number, bounds: Bounds) {
    if (motionTarget !== undefined) cancelMotion();
    contentDelta += delta;
    if (contentFrame !== undefined) return;
    contentFrame = requestAnimationFrame(() => {
      window.scrollTo({ top: Math.min(bounds.end, Math.max(bounds.start, scrollY + contentDelta)), behavior: 'instant' });
      contentDelta = 0;
      contentFrame = undefined;
    });
  }
  function resetGesture() {
    gesture = undefined;
    window.clearTimeout(quietTimer);
  }
  function syncMode() {
    cancelMotion();
    resetGesture();
    root.classList.toggle('chapter-scroll-managed', desktop.matches && !reduced.matches);
  }

  window.addEventListener('wheel', event => {
    if (!desktop.matches || reduced.matches) return;
    if (event.ctrlKey || event.metaKey || event.altKey) { cancelMotion(); resetGesture(); return; }
    if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (!event.deltaY) return;

    const now = performance.now();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const magnitude = Math.abs(delta);
    if (gesture && now - gesture.lastEvent > quietPeriod) {
      const gap = now - gesture.lastEvent;
      const renewed = magnitude >= 12 && (gap >= 650 || gesture.lastMagnitude < 12 || magnitude > gesture.lastMagnitude * 1.35 || Math.sign(delta) !== gesture.direction);
      if (gap >= tailMemory || gesture.events < 3 || renewed) resetGesture();
    }
    if (!gesture) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      let index = 0;
      positions.forEach((position, i) => { if (position.start <= scrollY + 16) index = i; });
      const bounds = positions[index] && { ...positions[index] };
      if (!bounds) return;
      if (index === sections.length - 1) bounds.end = Math.max(bounds.end, scrollY);
      const scroller = scrollableParent(event.target, delta);
      const insideContent = bounds.end > bounds.start && (delta > 0 ? scrollY < bounds.end - 16 : scrollY > bounds.start + 16);
      gesture = { mode: scroller ? 'nested' : insideContent ? 'content' : 'pending', lastEvent: now, lastMagnitude: magnitude, direction: Math.sign(delta), events: 0, intent: 0, index, bounds, scroller };
    }
    // Even sub-pixel momentum events belong to this gesture and must extend it.
    gesture.lastEvent = now;
    gesture.lastMagnitude = magnitude;
    gesture.events++;
    window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(resetGesture, tailMemory);
    if (gesture.mode === 'free') return;
    if (gesture.mode === 'nested') {
      // Keep the whole gesture in its original scroller, even at its edge.
      event.preventDefault();
      gesture.scroller!.scrollTop += delta;
      return;
    }
    if (gesture.mode === 'chapter') { event.preventDefault(); return; }
    if (gesture.mode === 'content') { event.preventDefault(); scrollContent(delta, gesture.bounds); return; }

    gesture.intent += delta;
    if (Math.abs(gesture.intent) < 24) { event.preventDefault(); return; }
    const direction = Math.sign(gesture.intent);
    const index = gesture.index;
    const bounds = gesture.bounds;
    let next = index + direction;
    if (direction < 0 && scrollY > bounds.start + 16) next = index;
    if (next < 0 || next >= sections.length) { gesture.mode = 'free'; return; }
    event.preventDefault();
    gesture.mode = 'chapter';
    const destination = positions[next];
    navigateTo(direction > 0 || next === index ? destination.start : destination.end);
    history.replaceState(null, '', `#${sections[next].id}`);
  }, { passive: false });

  desktop.addEventListener('change', syncMode);
  reduced.addEventListener('change', syncMode);
  window.addEventListener('resize', syncMode, { passive: true });
  window.addEventListener('pointerdown', () => { cancelMotion(); resetGesture(); }, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) { cancelMotion(); resetGesture(); }
  });
  window.addEventListener('emi:motion', () => {
    if (root.dataset.motion === 'off' && motionTarget !== undefined) navigateTo(motionTarget);
  });
  window.addEventListener('pagehide', () => { cancelMotion(); resetGesture(); });
  window.addEventListener('popstate', () => { cancelMotion(); resetGesture(); });
  window.addEventListener('hashchange', () => { cancelMotion(); resetGesture(); });
  document.addEventListener('scrollend', checkMotion);
  window.addEventListener('pageshow', syncMode);
  refresh();
  syncMode();
  return { navigate, refresh, currentAt };
}
