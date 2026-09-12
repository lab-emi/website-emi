import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseVisitorData, reportFresh } from '../../src/lib/visitor-data.ts';

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const row = (code, name, count) => ({ dimensionValues: [{ value: code }, { value: name }], metricValues: [{ value: String(count) }] });
function backend({ fail = false, empty = false, unknown = false } = {}) {
  const calls = []; const cache = new Map();
  const run = (request, property, realtime) => {
    calls.push({ request, property, realtime });
    if (fail) throw new Error('PRIVATE DIAGNOSTIC');
    if (empty) return { rows: [], metadata: { timeZone: 'Europe/Amsterdam' } };
    if (request.dimensions?.[0]?.name === 'date') return { rows: [{ dimensionValues: [{ value: '20220305' }], metricValues: [{ value: '1' }] }] };
    if (unknown && request.dimensionFilter?.andGroup?.expressions.some(e => e.filter?.fieldName === 'countryId')) return { rows: [{ metricValues: [{ value: '2' }] }] };
    return request.dimensions ? { rows: [row('NL', 'Netherlands', 3), row('US', 'United States', 2), ...(unknown ? [row('', '', 2), row('(not set)', '(not set)', 1)] : [])], rowCount: unknown ? 4 : 2 } : { rows: [{ metricValues: [{ value: '4' }] }] };
  };
  const ctx = vm.createContext({
    console: { log() {}, error() {} },
    AnalyticsData: { Properties: { runReport: (r, p) => run(r, p, false), runRealtimeReport: (r, p) => run(r, p, true) } },
    CacheService: { getScriptCache: () => ({ get: k => cache.get(k), put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { formatDate: () => '2026-09-12' },
    ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
  });
  vm.runInContext(source, ctx);
  return { ctx, calls, data: () => JSON.parse(JSON.stringify(ctx.visitorData_())) };
}

test('distinct totals are separate from country counts and queries stay in the EMI scope', () => {
  const b = backend(); const data = parseVisitorData(b.data());
  assert.equal(data.history.total, 4); assert.equal(data.history.countries.reduce((n, c) => n + c.visitors, 0), 5);
  assert.equal(data.history.startDate, '2022-03-05'); assert.equal(data.history.endDate, '2026-09-11');
  assert.equal(b.calls.length, 5);
  assert.ok(b.calls.every(call => call.property === 'properties/326174462'));
  const historical = b.calls.filter(call => !call.realtime);
  assert.ok(historical.every(call => JSON.stringify(call.request).includes('www.tudemi.com')));
  assert.ok(b.calls.every(call => JSON.stringify(call.request).includes('3883300841')));
  assert.ok(b.calls.filter(call => call.realtime).every(call => call.request.minuteRanges[0].startMinutesAgo === 29));
  b.data(); assert.equal(b.calls.length, 5, 'cached reads must not query Google again');
});

test('a successful empty report is zero; a failed report is unavailable without private errors', () => {
  const empty = parseVisitorData(backend({ empty: true }).data());
  assert.equal(empty.realtime.total, 0); assert.equal(empty.history.startDate, null);
  const failed = parseVisitorData(backend({ fail: true }).data());
  assert.equal(failed.realtime.status, 'unavailable'); assert.equal(failed.realtime.total, undefined);
  assert.ok(!JSON.stringify(failed).includes('PRIVATE'));
});

test('stale realtime data cannot continue to be presented as live', () => {
  const data = backend().data(); const time = Date.parse(data.realtime.fetchedAt);
  assert.equal(reportFresh(data.realtime, 'realtime', time + 119_000), true);
  assert.equal(reportFresh(data.realtime, 'realtime', time + 121_000), false);
  assert.equal(reportFresh({ status: 'unavailable' }, 'realtime'), false);
  data.history.countries[0].visitors = -1; assert.throws(() => parseVisitorData(data));
});

test('empty and not-set country buckets share one separately deduplicated total', () => {
  const b = backend({ unknown: true }); const data = parseVisitorData(b.data());
  for (const mode of ['history', 'realtime']) {
    const unknown = data[mode].countries.filter(country => country.code === 'unknown');
    assert.equal(unknown.length, 1); assert.equal(unknown[0].visitors, 2, 'do not add the two unknown buckets');
  }
  assert.equal(b.calls.length, 7);
});

test('only the fixed JSONP callback syntax is accepted, before any Analytics access', () => {
  const b = backend();
  const response = b.ctx.doGet({ parameter: { callback: 'alert(1)//', property: 'other' } });
  assert.equal(response.text, '{"error":"Invalid callback"}'); assert.equal(b.calls.length, 0);
  const valid = b.ctx.doGet({ parameter: { callback: 'emiVisitorData_1789214400000_1', property: 'other' } });
  assert.ok(valid.text.startsWith('emiVisitorData_1789214400000_1('));
  assert.ok(b.calls.every(call => call.property === 'properties/326174462'));
});
