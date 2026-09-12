import { parseVisitorData, reportFresh, colourBand, mapColours, type VisitorData, type VisitorMode } from '../lib/visitor-data';

const root = document.querySelector<HTMLElement>('[data-visitors]');
if (root) setupVisitors(root);

function setupVisitors(root: HTMLElement) {
  const get = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const text = (selector: string, value: string) => { get(selector).textContent = value; };
  const rows = get<HTMLTableSectionElement>('[data-visitor-rows]');
  const select = get<HTMLSelectElement>('[data-visitor-select]');
  const retry = get<HTMLButtonElement>('[data-visitor-retry]');
  const state = get('[data-visitor-state]');
  const legend = get('[data-visitor-legend]');
  const shapes = Array.from(root.querySelectorAll<SVGElement>('[data-country]'));
  const names = new Map(shapes.map(shape => [shape.dataset.country!, shape.dataset.countryName!]));
  const number = new Intl.NumberFormat('en');
  const date = (value: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
  let data: VisitorData | undefined;
  let mode: VisitorMode = 'history';
  let selected = '';
  let inView = false;
  let pending = false;
  let lastRequest = 0;
  let requestId = 0;
  let failed = false;

  function render() {
    const report = data?.[mode];
    const usable = !!report && reportFresh(report, mode);
    const countries = usable ? report.countries! : [];
    const counts = new Map(countries.map(country => [country.code, country.visitors]));
    root.dataset.reportFresh = String(usable);
    root.dataset.liveFresh = String(!!data && reportFresh(data.realtime, 'realtime'));
    root.querySelectorAll<HTMLButtonElement>('[data-visitor-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.visitorMode === mode)));
    text('[data-visitor-total]', usable ? number.format(report.total!) : '—');
    text('[data-visitor-total-label]', mode === 'history' ? 'recorded visitors' : 'active visitors');
    text('[data-visitor-country-total]', usable ? String(countries.filter(country => country.code !== 'unknown' && country.visitors > 0).length) : '—');
    text('[data-visitor-column]', mode === 'history' ? 'Visitors' : 'Active');
    text('[data-visitor-period]', usable
      ? mode === 'history' ? report.startDate ? `${date(report.startDate)} – ${date(report.endDate!)}` : `No recorded visits through ${date(report.endDate!)}` : 'Active within the last 30 minutes'
      : failed || data ? 'Statistics temporarily unavailable' : 'Loading visitor statistics…');
    text('[data-visitor-updated]', usable ? `Source: Google Analytics · Updated ${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.fetchedAt!))}${report.thresholded ? ' · Some data withheld by Google' : ''}` : 'Source: Google Analytics · No current data available');
    state.hidden = usable && countries.some(country => country.visitors > 0);
    state.textContent = usable ? report.total === 0 ? mode === 'realtime' ? 'No active visitors were reported in the last 30 minutes.' : 'No visits were reported for this period.' : 'Country information is not available for these visitors.' : failed || data ? 'Country statistics could not be loaded. Please try again shortly.' : 'Loading country data…';
    retry.hidden = usable || (!failed && !data);
    select.disabled = !usable;
    rows.replaceChildren();
    const countryNames = new Map(names);
    countries.forEach(country => countryNames.set(country.code, country.name));
    const options = [new Option('Choose a country', ''), ...[...countryNames].sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => new Option(name, code))];
    select.replaceChildren(...options);
    select.value = selected;
    countries.filter(country => country.visitors > 0).sort((a, b) => b.visitors - a.visitors || a.name.localeCompare(b.name)).forEach(country => {
      const row = document.createElement('tr');
      row.dataset.code = country.code;
      const countryCell = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = country.name;
      button.addEventListener('click', () => choose(country.code));
      countryCell.append(button);
      const count = document.createElement('td'); count.textContent = number.format(country.visitors);
      row.append(countryCell, count); rows.append(row);
    });
    shapes.forEach(shape => {
      const code = shape.dataset.country!;
      const count = counts.get(code);
      shape.style.setProperty('--country-fill', usable ? mapColours[colourBand(count ?? 0, mode)] : mapColours[0]);
      shape.dataset.hasVisitors = String(usable && (count ?? 0) > 0);
      shape.querySelector('title')!.textContent = `${countryNames.get(code)}: ${usable ? count === undefined ? 'no reported visitors' : `${number.format(count)} ${mode === 'realtime' ? 'active visitors' : 'visitors'}` : 'data unavailable'}`;
    });
    legend.hidden = !usable;
    legend.replaceChildren();
    (mode === 'history' ? ['No reported visits', '1–9', '10–99', '100–999', '1,000+'] : ['No reported activity', '1', '2–4', '5–9', '10+']).forEach((label, i) => {
      const item = document.createElement('span');
      const swatch = document.createElement('i'); swatch.style.setProperty('--swatch', mapColours[i]); swatch.setAttribute('aria-hidden', 'true');
      item.append(swatch, document.createTextNode(label)); legend.append(item);
    });
    highlight();
  }

  function highlight() {
    shapes.forEach(shape => { shape.dataset.selected = String(shape.dataset.country === selected); });
    rows.querySelectorAll<HTMLTableRowElement>('tr').forEach(row => { row.dataset.selected = String(row.dataset.code === selected); });
    const report = data?.[mode];
    const row = report?.countries?.find(country => country.code === selected);
    const country = row?.name ?? names.get(selected);
    text('[data-visitor-selection]', !country ? 'Select a country on the map or in the list.' : !report || !reportFresh(report, mode) ? `${country} · Data unavailable` : row ? `${country} · ${number.format(row.visitors)} ${mode === 'realtime' ? 'active visitors in the last 30 minutes' : 'recorded visitors'}` : `${country} · No visitors reported for this period`);
  }
  function choose(code: string) { selected = code; select.value = code; highlight(); }
  shapes.forEach(shape => shape.addEventListener('click', () => choose(shape.dataset.country!)));
  select.addEventListener('change', () => choose(select.value));
  root.querySelectorAll<HTMLButtonElement>('[data-visitor-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.visitorMode as VisitorMode; render(); void refresh(); }));

  function loadData(): Promise<VisitorData> {
    return new Promise((resolve, reject) => {
      const endpoint = root.dataset.endpoint;
      // Only the dedicated, owner-controlled Google endpoint can execute a callback.
      if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) { reject(new Error('Visitor source unavailable')); return; }
      const callback = `emiVisitorData_${Date.now()}_${++requestId}`;
      const callbacks = window as unknown as Record<string, unknown>;
      const script = document.createElement('script');
      const cleanup = () => { clearTimeout(timeout); script.remove(); callbacks[callback] = () => {}; window.setTimeout(() => { delete callbacks[callback]; }, 60_000); };
      const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Visitor request timed out')); }, 25_000);
      callbacks[callback] = (payload: unknown) => { cleanup(); try { resolve(parseVisitorData(payload)); } catch (error) { reject(error); } };
      script.onerror = () => { cleanup(); reject(new Error('Visitor request failed')); };
      script.src = `${endpoint}?callback=${callback}`; script.async = true; script.referrerPolicy = 'no-referrer';
      document.head.append(script);
    });
  }

  async function refresh(force = false) {
    if (pending || !inView || document.hidden || (!force && Date.now() - lastRequest < 60_000)) return;
    pending = true; lastRequest = Date.now(); retry.disabled = true;
    try { data = await loadData(); failed = false; } catch { failed = true; }
    finally { pending = false; retry.disabled = false; render(); }
  }
  retry.addEventListener('click', () => { void refresh(true); });
  const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) { render(); void refresh(); } }, { rootMargin: '150px' });
  observer.observe(root);
  window.setInterval(() => {
    if (!inView || document.hidden) return;
    const report = data?.[mode];
    if (root.dataset.reportFresh !== String(!!report && reportFresh(report, mode))) render();
    void refresh();
  }, 15_000);
  document.addEventListener('visibilitychange', () => { render(); void refresh(); });
}
