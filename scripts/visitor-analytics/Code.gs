/* Public, read-only country aggregates for tudemi.com. No client-controlled GA queries. */
const VISITOR_PROPERTY = 'properties/326174462';
const VISITOR_STREAM = '3883300841';
const VISITOR_START = '2020-01-01';

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  if (callback && !/^emiVisitorData_\d{10,16}_\d{1,8}$/.test(callback)) {
    return ContentService.createTextOutput('{"error":"Invalid callback"}').setMimeType(ContentService.MimeType.JSON);
  }
  const json = JSON.stringify(visitorData_()).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return ContentService.createTextOutput(callback ? callback + '(' + json + ');' : json)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

// Run once in the editor to authorize the explicitly read-only Analytics service.
function verifyVisitorSource() {
  const data = visitorData_();
  console.log(JSON.stringify(data));
  if (data.history.status !== 'ok' || data.realtime.status !== 'ok') throw new Error('A visitor report is unavailable. Inspect the execution log.');
}

function visitorData_() {
  return {
    version: 1, source: 'GA4',
    history: cachedReport_('history-v2', 21600, historyReport_),
    realtime: cachedReport_('realtime-v2', 60, realtimeReport_)
  };
}

function cachedReport_(key, seconds, load) {
  const cache = CacheService.getScriptCache();
  const existing = cache.get(key);
  if (existing) return JSON.parse(existing);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { status: 'unavailable' };
  try {
    const second = cache.get(key);
    if (second) return JSON.parse(second);
    let report;
    try { report = load(); }
    catch (error) {
      // Diagnostic errors stay in the owner's execution log, never the public response.
      console.error(String(error));
      report = { status: 'unavailable' };
    }
    cache.put(key, JSON.stringify(report), report.status === 'ok' ? seconds : 60);
    return report;
  } finally { lock.releaseLock(); }
}

function streamFilter_() {
  return { filter: { fieldName: 'streamId', stringFilter: { matchType: 'EXACT', value: VISITOR_STREAM } } };
}

function historicalFilter_() {
  return { andGroup: { expressions: [streamFilter_(), {
    filter: { fieldName: 'hostName', inListFilter: { values: ['www.tudemi.com', 'tudemi.com'], caseSensitive: false } }
  }] } };
}

function historyReport_() {
  const base = {
    dateRanges: [{ startDate: VISITOR_START, endDate: 'yesterday' }],
    metrics: [{ name: 'totalUsers' }], dimensionFilter: historicalFilter_()
  };
  const countries = AnalyticsData.Properties.runReport(Object.assign({}, base, {
    dimensions: [{ name: 'countryId' }, { name: 'country' }], limit: 400
  }), VISITOR_PROPERTY);
  // Query the undimensioned total: never sum country or daily distinct-user counts.
  const total = AnalyticsData.Properties.runReport(Object.assign({}, base, { limit: 1 }), VISITOR_PROPERTY);
  const first = AnalyticsData.Properties.runReport(Object.assign({}, base, {
    dimensions: [{ name: 'date' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 1
  }), VISITOR_PROPERTY);
  const timeZone = countries.metadata && countries.metadata.timeZone || 'Europe/Amsterdam';
  const today = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd');
  const yesterday = new Date(today + 'T12:00:00Z'); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const rawDate = first.rows && first.rows[0] && first.rows[0].dimensionValues[0].value;
  return {
    status: 'ok', fetchedAt: new Date().toISOString(),
    startDate: rawDate ? rawDate.slice(0, 4) + '-' + rawDate.slice(4, 6) + '-' + rawDate.slice(6, 8) : null,
    endDate: yesterday.toISOString().slice(0, 10),
    total: totalValue_(total), countries: countryRows_(countries, function(ids) {
      return totalValue_(AnalyticsData.Properties.runReport(unknownRequest_(base, ids), VISITOR_PROPERTY));
    }),
    thresholded: isThresholded_(countries) || isThresholded_(total)
  };
}

function realtimeReport_() {
  const base = {
    metrics: [{ name: 'activeUsers' }], dimensionFilter: streamFilter_(),
    minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }]
  };
  // Realtime has no hostname dimension. The selected stream is the EMI web stream.
  const countries = AnalyticsData.Properties.runRealtimeReport(Object.assign({}, base, {
    dimensions: [{ name: 'countryId' }, { name: 'country' }], limit: 400
  }), VISITOR_PROPERTY);
  const total = AnalyticsData.Properties.runRealtimeReport(Object.assign({}, base, { limit: 1 }), VISITOR_PROPERTY);
  return {
    status: 'ok', fetchedAt: new Date().toISOString(), windowMinutes: 30,
    total: totalValue_(total), countries: countryRows_(countries, function(ids) {
      return totalValue_(AnalyticsData.Properties.runRealtimeReport(unknownRequest_(base, ids), VISITOR_PROPERTY));
    }),
    thresholded: isThresholded_(countries) || isThresholded_(total)
  };
}

function totalValue_(report) {
  const value = Number(report.rows && report.rows[0] ? report.rows[0].metricValues[0].value : 0);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid Analytics total');
  return value;
}

function unknownRequest_(base, ids) {
  return Object.assign({}, base, { limit: 1, dimensionFilter: {
    andGroup: { expressions: [base.dimensionFilter, {
      filter: { fieldName: 'countryId', inListFilter: { values: ids, caseSensitive: true } }
    }] }
  } });
}

function countryRows_(report, unknownTotal) {
  if (report.rowCount > 400) throw new Error('Country report would be truncated');
  const unknownIds = [];
  const countries = (report.rows || []).filter(function(row) {
    const code = row.dimensionValues[0].value;
    if (/^[A-Z]{2}$/.test(code)) return true;
    if (unknownIds.indexOf(code) === -1) unknownIds.push(code);
    return false;
  }).map(function(row) {
    const raw = row.dimensionValues[0].value;
    const visitors = Number(row.metricValues[0].value);
    if (!Number.isSafeInteger(visitors) || visitors < 0) throw new Error('Invalid country count');
    return { code: raw, name: row.dimensionValues[1].value, visitors: visitors };
  });
  // GA can return both an empty location and "(not set)". Query their combined
  // distinct users rather than adding their counts or emitting duplicate IDs.
  if (unknownIds.length) countries.push({ code: 'unknown', name: 'Location unavailable', visitors: unknownTotal(unknownIds) });
  return countries.sort(function(a, b) { return b.visitors - a.visitors; });
}

function isThresholded_(report) { return !!(report.metadata && report.metadata.subjectToThresholding); }
