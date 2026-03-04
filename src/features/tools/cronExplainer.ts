/**
 * Cron expression parser, explainer, and next-run calculator.
 * Supports standard 5-field cron (minute hour dom month dow).
 * Also handles @-presets: @hourly, @daily, @midnight, @weekly, @monthly, @yearly, @annually.
 * All processing is client-side — no data leaves the browser (ADR-0001).
 *
 * DOM/DOW semantics: when both fields are restricted (not `*`), cron fires when EITHER
 * matches (OR semantics). When only one is restricted, standard AND matching applies.
 */

export type CronResult = CronParseResult | CronParseError;

export interface CronField {
  raw: string;
  values: readonly number[];
  description: string;
}

export interface CronExpression {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
  summary: string;
}

export interface CronParseResult {
  expression: CronExpression;
  nextRuns: Date[];
  error: null;
}

export interface CronParseError {
  expression: null;
  nextRuns: null;
  error: string;
}

export function isCronError(r: CronResult): r is CronParseError {
  return r.error !== null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS: Record<string, string> = {
  '@hourly': '0 * * * *',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@weekly': '0 0 * * 0',
  '@monthly': '0 0 1 * *',
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
};

const MONTH_ALIASES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DOW_ALIASES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CRON_PRESETS = [
  { label: '@hourly', value: '0 * * * *', description: 'Every hour at :00' },
  { label: '@daily', value: '0 0 * * *', description: 'Daily at midnight' },
  { label: '@weekly', value: '0 0 * * 0', description: 'Sundays at midnight' },
  { label: '@monthly', value: '0 0 1 * *', description: 'First of month' },
  { label: '@yearly', value: '0 0 1 1 *', description: 'January 1st' },
  { label: '*/5 * * * *', value: '*/5 * * * *', description: 'Every 5 minutes' },
  { label: '0 9 * * 1-5', value: '0 9 * * 1-5', description: 'Weekdays at 09:00' },
] as const;

// ── Field parsing ─────────────────────────────────────────────────────────────

function resolveAlias(val: string, aliases: Record<string, number>): string {
  const aliasVal = aliases[val.toLowerCase()];
  return aliasVal !== undefined ? String(aliasVal) : val;
}

function parseNum(raw: string, aliases: Record<string, number>): number {
  const resolved = resolveAlias(raw, aliases);
  const n = parseInt(resolved, 10);
  if (isNaN(n)) throw new Error(`Invalid value: "${raw}"`);
  return n;
}

function expandSingle(
  token: string,
  min: number,
  max: number,
  aliases: Record<string, number>
): number[] {
  const slashIdx = token.indexOf('/');
  if (slashIdx !== -1) {
    const rangePart = token.slice(0, slashIdx);
    const stepStr = token.slice(slashIdx + 1);
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step < 1) throw new Error(`Invalid step: "${stepStr}"`);

    let rangeMin = min;
    let rangeMax = max;
    if (rangePart !== '*') {
      const dashIdx = rangePart.indexOf('-');
      if (dashIdx !== -1) {
        rangeMin = parseNum(rangePart.slice(0, dashIdx), aliases);
        rangeMax = parseNum(rangePart.slice(dashIdx + 1), aliases);
      } else {
        rangeMin = parseNum(rangePart, aliases);
      }
    }
    if (rangeMin < min || rangeMax > max) {
      throw new Error(
        `Range ${String(rangeMin)}-${String(rangeMax)} out of bounds [${String(min)}-${String(max)}]`
      );
    }
    const values: number[] = [];
    for (let i = rangeMin; i <= rangeMax; i += step) values.push(i);
    return values;
  }

  const dashIdx = token.indexOf('-');
  if (dashIdx !== -1) {
    const start = parseNum(token.slice(0, dashIdx), aliases);
    const end = parseNum(token.slice(dashIdx + 1), aliases);
    if (start > end) throw new Error(`Invalid range: "${token}"`);
    if (start < min || end > max) {
      throw new Error(
        `Range ${String(start)}-${String(end)} out of bounds [${String(min)}-${String(max)}]`
      );
    }
    const values: number[] = [];
    for (let i = start; i <= end; i++) values.push(i);
    return values;
  }

  if (token === '*') {
    const values: number[] = [];
    for (let i = min; i <= max; i++) values.push(i);
    return values;
  }

  const n = parseNum(token, aliases);
  if (n < min || n > max) {
    throw new Error(`Value ${String(n)} out of range [${String(min)}-${String(max)}]`);
  }
  return [n];
}

function expandField(
  raw: string,
  min: number,
  max: number,
  aliases: Record<string, number>
): number[] {
  const values = new Set<number>();
  for (const token of raw.split(',')) {
    for (const v of expandSingle(token.trim(), min, max, aliases)) {
      values.add(v);
    }
  }
  return [...values].sort((a, b) => a - b);
}

// ── Field description ─────────────────────────────────────────────────────────

function describeMinute(raw: string, values: number[]): string {
  if (raw === '*' || raw === '*/1') return 'every minute';
  if (/^\*\/\d+$/.test(raw)) return `every ${raw.slice(2)} minutes`;
  if (/^\d+-\d+\/\d+$/.test(raw)) {
    const slash = raw.indexOf('/');
    return `every ${raw.slice(slash + 1)} minutes within ${raw.slice(0, slash)}`;
  }
  if (/^\d+-\d+$/.test(raw)) {
    const dash = raw.indexOf('-');
    return `minutes ${raw.slice(0, dash)} through ${raw.slice(dash + 1)}`;
  }
  if (values.length === 1) return `minute ${String(values[0])}`;
  if (values.length <= 6) return `minutes ${values.join(', ')}`;
  return `${String(values.length)} specific minutes`;
}

function describeHour(raw: string, values: number[]): string {
  if (raw === '*' || raw === '*/1') return 'every hour';
  if (/^\*\/\d+$/.test(raw)) return `every ${raw.slice(2)} hours`;
  if (/^\d+-\d+\/\d+$/.test(raw)) {
    const slash = raw.indexOf('/');
    return `every ${raw.slice(slash + 1)} hours within ${raw.slice(0, slash)}`;
  }
  if (/^\d+-\d+$/.test(raw)) {
    const dash = raw.indexOf('-');
    return `hours ${raw.slice(0, dash)} through ${raw.slice(dash + 1)}`;
  }
  if (values.length === 1) return `hour ${String(values[0])}`;
  if (values.length <= 6) return `hours ${values.join(', ')}`;
  return `${String(values.length)} specific hours`;
}

function describeDom(raw: string, values: number[]): string {
  if (raw === '*') return 'every day';
  if (/^\*\/\d+$/.test(raw)) return `every ${raw.slice(2)} days`;
  if (/^\d+-\d+$/.test(raw)) {
    const dash = raw.indexOf('-');
    return `days ${raw.slice(0, dash)}–${raw.slice(dash + 1)} of the month`;
  }
  if (values.length === 1) return `day ${String(values[0])} of the month`;
  if (values.length <= 6) return `days ${values.join(', ')} of the month`;
  return `${String(values.length)} specific days`;
}

function describeMonth(raw: string, values: number[]): string {
  if (raw === '*') return 'every month';
  if (/^\*\/\d+$/.test(raw)) return `every ${raw.slice(2)} months`;
  if (/^\d+-\d+$/.test(raw)) {
    const dash = raw.indexOf('-');
    const a = parseInt(raw.slice(0, dash), 10);
    const b = parseInt(raw.slice(dash + 1), 10);
    return `${MONTH_NAMES[a] ?? String(a)} through ${MONTH_NAMES[b] ?? String(b)}`;
  }
  if (values.length === 1) {
    const v = values[0];
    return v !== undefined ? (MONTH_NAMES[v] ?? `month ${String(v)}`) : 'unknown month';
  }
  if (values.length <= 4) return values.map((v) => MONTH_NAMES[v] ?? String(v)).join(', ');
  return `${String(values.length)} specific months`;
}

function describeDow(raw: string, values: number[]): string {
  if (raw === '*') return 'every day of the week';
  if (/^\d+-\d+$/.test(raw)) {
    const dash = raw.indexOf('-');
    const a = parseInt(raw.slice(0, dash), 10);
    const b = parseInt(raw.slice(dash + 1), 10);
    const aName = DOW_SHORT[a] ?? String(a);
    const bName = DOW_SHORT[b === 7 ? 0 : b] ?? String(b);
    return `${aName} through ${bName}`;
  }
  if (values.length === 1) {
    const v = values[0];
    return v !== undefined ? (DOW_SHORT[v] ?? `day ${String(v)}`) : 'unknown day';
  }
  if (values.length <= 5) return values.map((v) => DOW_SHORT[v] ?? String(v)).join(', ');
  return 'every day of the week';
}

// ── Summary builder ───────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildDatePart(
  dom: string,
  domVals: number[],
  month: string,
  monthVals: number[],
  dow: string,
  dowVals: number[]
): string {
  const parts: string[] = [];
  const domRestricted = dom !== '*';
  const dowRestricted = dow !== '*';

  if (domRestricted && dowRestricted) {
    parts.push(`when it is ${describeDom(dom, domVals)} or ${describeDow(dow, dowVals)}`);
  } else if (dowRestricted) {
    parts.push(`on ${describeDow(dow, dowVals)}`);
  } else if (domRestricted) {
    parts.push(`on ${describeDom(dom, domVals)}`);
  }

  if (month !== '*') {
    parts.push(`in ${describeMonth(month, monthVals)}`);
  }

  return parts.join(', ');
}

function buildSummary(
  minute: string,
  hour: string,
  dom: string,
  month: string,
  dow: string,
  minuteVals: number[],
  hourVals: number[],
  domVals: number[],
  monthVals: number[],
  dowVals: number[]
): string {
  // Every minute
  if (minute === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute';
  }

  // Every N minutes, all other fields unrestricted
  if (
    /^(\*\/\d+|\*)$/.test(minute) &&
    hour === '*' &&
    dom === '*' &&
    month === '*' &&
    dow === '*'
  ) {
    return minute === '*' || minute === '*/1' ? 'Every minute' : `Every ${minute.slice(2)} minutes`;
  }

  const dp = buildDatePart(dom, domVals, month, monthVals, dow, dowVals);
  const suffix = dp ? `, ${dp}` : '';

  // Exact minute and exact hour → "At HH:MM"
  if (minuteVals.length === 1 && hourVals.length === 1) {
    const h = hourVals[0] ?? 0;
    const m = minuteVals[0] ?? 0;
    return `At ${pad2(h)}:${pad2(m)}${suffix}`;
  }

  // Exact minute, any hour → "Every hour at :MM"
  if (minuteVals.length === 1 && hour === '*') {
    const m = minuteVals[0] ?? 0;
    return `Every hour at :${pad2(m)}${suffix}`;
  }

  // Exact minute, every N hours → "Every N hours at :MM"
  if (minuteVals.length === 1 && /^\*\/\d+$/.test(hour)) {
    const m = minuteVals[0] ?? 0;
    return `Every ${hour.slice(2)} hours at :${pad2(m)}${suffix}`;
  }

  // Exact minute, hour range → "At :MM from HH:00 to HH:00"
  if (minuteVals.length === 1 && /^\d+-\d+$/.test(hour)) {
    const m = minuteVals[0] ?? 0;
    const dash = hour.indexOf('-');
    const h1 = pad2(parseInt(hour.slice(0, dash), 10));
    const h2 = pad2(parseInt(hour.slice(dash + 1), 10));
    return `At :${pad2(m)} past each hour from ${h1}:00 to ${h2}:00${suffix}`;
  }

  // Fallback structured description
  return `At ${describeMinute(minute, minuteVals)} past ${describeHour(hour, hourVals)}${suffix}`;
}

// ── Next run computation ──────────────────────────────────────────────────────

function matchesExpression(d: Date, expr: CronExpression): boolean {
  const minute = d.getMinutes();
  const hour = d.getHours();
  const dom = d.getDate();
  const month = d.getMonth() + 1;
  const dow = d.getDay();

  if (!expr.minute.values.includes(minute)) return false;
  if (!expr.hour.values.includes(hour)) return false;
  if (!expr.month.values.includes(month)) return false;

  const domRestricted = expr.dayOfMonth.raw !== '*';
  const dowRestricted = expr.dayOfWeek.raw !== '*';

  if (domRestricted && dowRestricted) {
    return expr.dayOfMonth.values.includes(dom) || expr.dayOfWeek.values.includes(dow);
  }
  if (domRestricted) return expr.dayOfMonth.values.includes(dom);
  if (dowRestricted) return expr.dayOfWeek.values.includes(dow);
  return true;
}

function computeNextRuns(expr: CronExpression, after: Date, count: number): Date[] {
  const results: Date[] = [];
  const d = new Date(after);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  // Safety limit: 5 years of minutes
  const maxIterations = 5 * 366 * 24 * 60;
  for (let i = 0; i < maxIterations && results.length < count; i++) {
    if (matchesExpression(d, expr)) {
      results.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }

  return results;
}

// ── Builder ───────────────────────────────────────────────────────────────────

export type BuilderMode =
  | 'every-minute'
  | 'every-n-minutes'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export interface BuilderState {
  mode: BuilderMode;
  stepMinutes: number;
  minute: number;
  hour: number;
  dayOfMonth: number;
  daysOfWeek: number[];
  customMinute: string;
  customHour: string;
  customDom: string;
  customMonth: string;
  customDow: string;
}

export const DEFAULT_BUILDER_STATE: BuilderState = {
  mode: 'daily',
  stepMinutes: 5,
  minute: 0,
  hour: 9,
  dayOfMonth: 1,
  daysOfWeek: [1, 2, 3, 4, 5], // Mon–Fri default for weekly mode
  customMinute: '*',
  customHour: '*',
  customDom: '*',
  customMonth: '*',
  customDow: '*',
};

function compressRanges(sorted: number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    if (start === undefined) break;
    let end = start;
    while (i + 1 < sorted.length) {
      const next = sorted[i + 1];
      if (next === undefined || next !== end + 1) break;
      i++;
      end = next;
    }
    parts.push(start === end ? String(start) : `${String(start)}-${String(end)}`);
    i++;
  }
  return parts.join(',');
}

export function buildExpression(state: BuilderState): string {
  const m = String(state.minute);
  const h = String(state.hour);

  switch (state.mode) {
    case 'every-minute':
      return '* * * * *';
    case 'every-n-minutes':
      return `*/${String(state.stepMinutes)} * * * *`;
    case 'hourly':
      return `${m} * * * *`;
    case 'daily':
      return `${m} ${h} * * *`;
    case 'weekly': {
      const sorted = [...state.daysOfWeek].sort((a, b) => a - b);
      const dow = sorted.length === 0 || sorted.length === 7 ? '*' : compressRanges(sorted);
      return `${m} ${h} * * ${dow}`;
    }
    case 'monthly':
      return `${m} ${h} ${String(state.dayOfMonth)} * *`;
    case 'custom':
      return [
        state.customMinute || '*',
        state.customHour || '*',
        state.customDom || '*',
        state.customMonth || '*',
        state.customDow || '*',
      ].join(' ');
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parseCron(input: string): CronResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { expression: null, nextRuns: null, error: 'Enter a cron expression.' };
  }

  if (trimmed.toLowerCase() === '@reboot') {
    return {
      expression: null,
      nextRuns: null,
      error:
        '@reboot is a special directive that runs at system startup — next run times cannot be calculated.',
    };
  }

  let normalized = trimmed;
  if (trimmed.startsWith('@')) {
    const preset = PRESETS[trimmed.toLowerCase()];
    if (preset === undefined) {
      return {
        expression: null,
        nextRuns: null,
        error: `Unknown preset "${trimmed}". Supported: @hourly, @daily, @weekly, @monthly, @yearly, @annually, @midnight.`,
      };
    }
    normalized = preset;
  }

  const parts = normalized.split(/\s+/);
  if (parts.length !== 5) {
    return {
      expression: null,
      nextRuns: null,
      error: `Expected 5 fields (minute hour day-of-month month day-of-week), got ${String(parts.length)}.`,
    };
  }

  const [minute = '', hour = '', dom = '', month = '', dow = ''] = parts;

  try {
    const minuteVals = expandField(minute, 0, 59, {});
    const hourVals = expandField(hour, 0, 23, {});
    const domVals = expandField(dom, 1, 31, {});
    const monthVals = expandField(month, 1, 12, MONTH_ALIASES);
    const rawDowVals = expandField(dow, 0, 7, DOW_ALIASES);
    // Map 7 → 0 (both mean Sunday) and deduplicate
    const dowVals = [...new Set(rawDowVals.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b);

    const summary = buildSummary(
      minute,
      hour,
      dom,
      month,
      dow,
      minuteVals,
      hourVals,
      domVals,
      monthVals,
      dowVals
    );

    const expression: CronExpression = {
      minute: { raw: minute, values: minuteVals, description: describeMinute(minute, minuteVals) },
      hour: { raw: hour, values: hourVals, description: describeHour(hour, hourVals) },
      dayOfMonth: { raw: dom, values: domVals, description: describeDom(dom, domVals) },
      month: { raw: month, values: monthVals, description: describeMonth(month, monthVals) },
      dayOfWeek: { raw: dow, values: dowVals, description: describeDow(dow, dowVals) },
      summary,
    };

    const nextRuns = computeNextRuns(expression, new Date(), 5);

    return { expression, nextRuns, error: null };
  } catch (err) {
    return {
      expression: null,
      nextRuns: null,
      error: err instanceof Error ? err.message : 'Invalid cron expression.',
    };
  }
}
