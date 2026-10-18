interface ChapterScrollOptions {
  sections: HTMLElement[];
  getInset: () => number;
  reduced: MediaQueryList;
}

type Bounds = { start: number; end: number };
type Gesture = {
  mode: 'pending' | 'chapter' | 'content' | 'nested' | 'free';
  lastEvent: number;
  intent: number;
  index: number;
  bounds: Bounds;
  scroller?: Element;
};

export function createChapterScroller({ sections, getInset, reduced }: ChapterScrollOptions) {
  const root = document.documentElement;
  const desktop = matchMedia('(pointer: fine)');
  const quietPeriod = 320;
  let gesture: Gesture | undefined;
  let quietTimer: number | undefined;
  let motionFrame: number | undefined;
  let contentFrame: number | undefined;
  let contentDelta = 0;
  let motionTarget: number | undefined;

  function boundsFor(section: HTMLElement): Bounds {
    const rect = section.getBoundingClientRect();
    const limit = Math.max(0, root.scrollHeight - innerHeight);
    const start = Math.min(limit, Math.max(0, scrollY + rect.top - getInset()));
    const end = Math.min(limit, Math.max(start, scrollY + rect.bottom - innerHeight + 12));
    return { start, end: end - start < 24 ? start : end };
  }
  function cancelMotion() {
    if (motionFrame !== undefined) cancelAnimationFrame(motionFrame);
    if (contentFrame !== undefined) cancelAnimationFrame(contentFrame);
    motionFrame = contentFrame = undefined;
    motionTarget = undefined;
    contentDelta = 0;
    root.classList.remove('chapter-transition');
  }
  function navigateTo(top: number) {
    cancelMotion();
    const target = Math.max(0, Math.min(top, root.scrollHeight - innerHeight));
    const from = scrollY;
    if (reduced.matches || root.dataset.motion === 'off' || Math.abs(target - from) < 1) {
      window.scrollTo({ top: target, behavior: 'instant' });
      return;
    }
    const duration = Math.min(600, Math.max(320, Math.abs(target - from) * .55));
    const began = performance.now();
    motionTarget = target;
    root.classList.add('chapter-transition');
    const frame = (now: number) => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({ top: from + (target - from) * eased, behavior: 'instant' });
      if (progress < 1) motionFrame = requestAnimationFrame(frame);
      else {
        motionFrame = undefined;
        motionTarget = undefined;
        root.classList.remove('chapter-transition');
      }
    };
    motionFrame = requestAnimationFrame(frame);
  }
  function navigate(section: HTMLElement) {
    gesture = undefined;
    window.clearTimeout(quietTimer);
    navigateTo(boundsFor(section).start);
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
    if (motionFrame !== undefined) cancelMotion();
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
    if (gesture && now - gesture.lastEvent > quietPeriod) resetGesture();
    if (!gesture) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const positions = sections.map(boundsFor);
      let index = 0;
      positions.forEach((position, i) => { if (position.start <= scrollY + 16) index = i; });
      const bounds = positions[index];
      if (!bounds) return;
      if (index === sections.length - 1) bounds.end = Math.max(bounds.end, scrollY);
      const scroller = scrollableParent(event.target, delta);
      const insideContent = bounds.end > bounds.start && (delta > 0 ? scrollY < bounds.end - 16 : scrollY > bounds.start + 16);
      gesture = { mode: scroller ? 'nested' : insideContent ? 'content' : 'pending', lastEvent: now, intent: 0, index, bounds, scroller };
    }
    // Even sub-pixel momentum events belong to this gesture and must extend it.
    gesture.lastEvent = now;
    window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(resetGesture, quietPeriod);
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
    const destination = boundsFor(sections[next]);
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
  window.addEventListener('pageshow', syncMode);
  syncMode();
  return { navigate };
}
