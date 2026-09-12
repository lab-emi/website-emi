export interface VisitorCountry { code: string; name: string; visitors: number }
export interface VisitorReport {
  status: 'ok' | 'unavailable';
  fetchedAt?: string;
  startDate?: string | null;
  endDate?: string;
  windowMinutes?: number;
  total?: number;
  countries?: VisitorCountry[];
  thresholded?: boolean;
}
export interface VisitorData { version: 1; source: 'GA4'; history: VisitorReport; realtime: VisitorReport }
export type VisitorMode = 'history' | 'realtime';

// Fail closed: an invalid response must never become a plausible visitor count.
export function parseVisitorData(value: unknown): VisitorData {
  if (!value || typeof value !== 'object') throw new Error('Invalid visitor response');
  const data = value as VisitorData;
  if (data.version !== 1 || data.source !== 'GA4') throw new Error('Unknown visitor response');
  for (const mode of ['history', 'realtime'] as const) {
    const report = data[mode];
    if (!report || !['ok', 'unavailable'].includes(report.status)) throw new Error('Missing visitor report');
    if (report.status === 'unavailable') continue;
    if (!Number.isSafeInteger(report.total) || report.total! < 0 || !report.fetchedAt || !Number.isFinite(Date.parse(report.fetchedAt))) throw new Error('Invalid visitor total');
    if (!Array.isArray(report.countries) || report.countries.length > 400) throw new Error('Invalid countries');
    const codes = new Set<string>();
    for (const row of report.countries) {
      if (!row || !/^(?:[A-Z]{2}|unknown)$/.test(row.code) || codes.has(row.code) || typeof row.name !== 'string' || row.name.length > 100 || !Number.isSafeInteger(row.visitors) || row.visitors < 0) throw new Error('Invalid country row');
      codes.add(row.code);
    }
    if (mode === 'realtime' && report.windowMinutes !== 30) throw new Error('Invalid realtime window');
    if (mode === 'history' && (!/^\d{4}-\d{2}-\d{2}$/.test(report.endDate ?? '') || (report.startDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(report.startDate ?? '')))) throw new Error('Invalid historical dates');
  }
  return data;
}

export function reportFresh(report: VisitorReport, mode: VisitorMode, now = Date.now()): boolean {
  if (report.status !== 'ok' || !report.fetchedAt) return false;
  const age = now - Date.parse(report.fetchedAt);
  return age >= -60_000 && age <= (mode === 'realtime' ? 120_000 : 24 * 60 * 60_000);
}

export const mapColours = ['#dce6eb', '#acd9eb', '#57b5d8', '#007dad', '#104768'];
export function colourBand(count: number, mode: VisitorMode): number {
  const thresholds = mode === 'history' ? [1, 10, 100, 1000] : [1, 2, 5, 10];
  return thresholds.filter(n => count >= n).length;
}
