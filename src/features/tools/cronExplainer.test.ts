import { describe, it, expect } from 'vitest';
import {
  parseCron,
  isCronError,
  buildExpression,
  DEFAULT_BUILDER_STATE,
  type CronParseResult,
  type BuilderState,
} from './cronExplainer';

function assertCron(r: ReturnType<typeof parseCron>): CronParseResult {
  if (isCronError(r)) throw new Error(`Unexpected cron error: ${r.error}`);
  return r;
}

// ── isCronError ───────────────────────────────────────────────────────────────

describe('isCronError', () => {
  it('returns true for error results', () => {
    expect(isCronError(parseCron(''))).toBe(true);
  });

  it('returns false for success results', () => {
    expect(isCronError(parseCron('* * * * *'))).toBe(false);
  });
});

// ── parseCron — summary strings ───────────────────────────────────────────────

describe('parseCron — summary', () => {
  it('"* * * * *" → "Every minute"', () => {
    expect(assertCron(parseCron('* * * * *')).expression.summary).toBe('Every minute');
  });

  it('"0 * * * *" → every hour at :00', () => {
    expect(assertCron(parseCron('0 * * * *')).expression.summary).toMatch(/every hour/i);
  });

  it('"0 0 * * *" → at 00:00', () => {
    expect(assertCron(parseCron('0 0 * * *')).expression.summary).toMatch(/00:00/);
  });

  it('"30 9 * * *" → at 09:30', () => {
    expect(assertCron(parseCron('30 9 * * *')).expression.summary).toMatch(/09:30/);
  });

  it('"*/5 * * * *" → every 5 minutes', () => {
    expect(assertCron(parseCron('*/5 * * * *')).expression.summary).toMatch(/5 minutes/i);
  });
});

// ── parseCron — field parsing ─────────────────────────────────────────────────

describe('parseCron — field values', () => {
  it('parses wildcard "*" as all values', () => {
    const r = assertCron(parseCron('* * * * *'));
    expect(r.expression.minute.values).toHaveLength(60); // 0–59
    expect(r.expression.hour.values).toHaveLength(24); // 0–23
  });

  it('parses exact minute value', () => {
    expect(assertCron(parseCron('30 * * * *')).expression.minute.values).toEqual([30]);
  });

  it('parses range "1-5"', () => {
    expect(assertCron(parseCron('0 0 * * 1-5')).expression.dayOfWeek.values).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it('parses step "*/5" for minutes', () => {
    expect(assertCron(parseCron('*/5 * * * *')).expression.minute.values).toEqual([
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
    ]);
  });

  it('parses comma-separated list "1,3,5"', () => {
    expect(assertCron(parseCron('0 0 * * 1,3,5')).expression.dayOfWeek.values).toEqual([1, 3, 5]);
  });

  it('parses named month aliases (jan, jun, dec)', () => {
    expect(assertCron(parseCron('0 0 1 jan *')).expression.month.values).toEqual([1]);
    expect(assertCron(parseCron('0 0 1 dec *')).expression.month.values).toEqual([12]);
  });

  it('parses named day-of-week aliases (mon, fri)', () => {
    expect(assertCron(parseCron('0 0 * * mon')).expression.dayOfWeek.values).toEqual([1]);
    expect(assertCron(parseCron('0 0 * * fri')).expression.dayOfWeek.values).toEqual([5]);
  });

  it('treats dow "7" as Sunday (maps to 0)', () => {
    expect(assertCron(parseCron('0 0 * * 7')).expression.dayOfWeek.values).toEqual([0]);
  });

  it('deduplicates "0,7" for dow (both = Sunday)', () => {
    expect(assertCron(parseCron('0 0 * * 0,7')).expression.dayOfWeek.values).toEqual([0]);
  });
});

// ── parseCron — @presets ──────────────────────────────────────────────────────

describe('parseCron — @presets', () => {
  const equivalentPairs: [string, string][] = [
    ['@hourly', '0 * * * *'],
    ['@daily', '0 0 * * *'],
    ['@midnight', '0 0 * * *'],
    ['@weekly', '0 0 * * 0'],
    ['@monthly', '0 0 1 * *'],
    ['@yearly', '0 0 1 1 *'],
    ['@annually', '0 0 1 1 *'],
  ];

  for (const [preset, equivalent] of equivalentPairs) {
    it(`${preset} produces the same values as "${equivalent}"`, () => {
      const presetResult = assertCron(parseCron(preset));
      const equivResult = assertCron(parseCron(equivalent));
      expect(presetResult.expression.minute.values).toEqual(equivResult.expression.minute.values);
      expect(presetResult.expression.hour.values).toEqual(equivResult.expression.hour.values);
    });
  }

  it('@reboot returns a descriptive error', () => {
    const r = parseCron('@reboot');
    expect(isCronError(r)).toBe(true);
    expect((r as { error: string }).error).toMatch(/reboot/i);
  });

  it('unknown @preset returns an error', () => {
    expect(isCronError(parseCron('@unknown'))).toBe(true);
  });
});

// ── parseCron — next runs ─────────────────────────────────────────────────────

describe('parseCron — next runs', () => {
  it('returns exactly 5 next runs', () => {
    expect(assertCron(parseCron('* * * * *')).nextRuns).toHaveLength(5);
  });

  it('all next runs are Date instances', () => {
    for (const d of assertCron(parseCron('0 9 * * 1-5')).nextRuns) {
      expect(d).toBeInstanceOf(Date);
    }
  });

  it('all next runs are in the future', () => {
    const now = Date.now();
    for (const d of assertCron(parseCron('* * * * *')).nextRuns) {
      expect(d.getTime()).toBeGreaterThan(now);
    }
  });

  it('next runs are in ascending order', () => {
    const runs = assertCron(parseCron('*/10 * * * *')).nextRuns;
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i]!.getTime()).toBeGreaterThan(runs[i - 1]!.getTime());
    }
  });

  it('"* * * * *" — first next run is within 2 minutes', () => {
    const runs = assertCron(parseCron('* * * * *')).nextRuns;
    expect(runs[0]).toBeInstanceOf(Date);
    const diffMs = runs[0]!.getTime() - Date.now();
    expect(diffMs).toBeLessThan(2 * 60 * 1000);
  });
});

// ── parseCron — error cases ───────────────────────────────────────────────────

describe('parseCron — errors', () => {
  it('returns error for empty string', () => {
    expect(isCronError(parseCron(''))).toBe(true);
  });

  it('returns error for whitespace only', () => {
    expect(isCronError(parseCron('   '))).toBe(true);
  });

  it('returns error for too few fields', () => {
    expect(isCronError(parseCron('* * * *'))).toBe(true);
  });

  it('returns error for too many fields', () => {
    expect(isCronError(parseCron('* * * * * *'))).toBe(true);
  });

  it('returns error for out-of-range minute (60)', () => {
    expect(isCronError(parseCron('60 * * * *'))).toBe(true);
  });

  it('returns error for out-of-range hour (24)', () => {
    expect(isCronError(parseCron('0 24 * * *'))).toBe(true);
  });

  it('returns error for out-of-range month (13)', () => {
    expect(isCronError(parseCron('0 0 1 13 *'))).toBe(true);
  });

  it('returns error for invalid step (step 0)', () => {
    expect(isCronError(parseCron('*/0 * * * *'))).toBe(true);
  });

  it('error has non-empty message', () => {
    const r = parseCron('');
    expect(isCronError(r)).toBe(true);
    expect((r as { error: string }).error.length).toBeGreaterThan(0);
  });
});

// ── buildExpression ───────────────────────────────────────────────────────────

describe('buildExpression', () => {
  function state(overrides: Partial<BuilderState>): BuilderState {
    return { ...DEFAULT_BUILDER_STATE, ...overrides };
  }

  it('every-minute → "* * * * *"', () => {
    expect(buildExpression(state({ mode: 'every-minute' }))).toBe('* * * * *');
  });

  it('every-n-minutes (5) → "*/5 * * * *"', () => {
    expect(buildExpression(state({ mode: 'every-n-minutes', stepMinutes: 5 }))).toBe('*/5 * * * *');
  });

  it('every-n-minutes (15) → "*/15 * * * *"', () => {
    expect(buildExpression(state({ mode: 'every-n-minutes', stepMinutes: 15 }))).toBe(
      '*/15 * * * *'
    );
  });

  it('hourly at minute 0 → "0 * * * *"', () => {
    expect(buildExpression(state({ mode: 'hourly', minute: 0 }))).toBe('0 * * * *');
  });

  it('hourly at minute 30 → "30 * * * *"', () => {
    expect(buildExpression(state({ mode: 'hourly', minute: 30 }))).toBe('30 * * * *');
  });

  it('daily at 09:00 → "0 9 * * *"', () => {
    expect(buildExpression(state({ mode: 'daily', hour: 9, minute: 0 }))).toBe('0 9 * * *');
  });

  it('weekly Mon–Fri at 09:00 → "0 9 * * 1-5"', () => {
    expect(
      buildExpression(state({ mode: 'weekly', hour: 9, minute: 0, daysOfWeek: [1, 2, 3, 4, 5] }))
    ).toBe('0 9 * * 1-5');
  });

  it('weekly with all days → "0 9 * * *"', () => {
    expect(
      buildExpression(
        state({ mode: 'weekly', hour: 9, minute: 0, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] })
      )
    ).toBe('0 9 * * *');
  });

  it('weekly with no days → "0 9 * * *"', () => {
    expect(buildExpression(state({ mode: 'weekly', hour: 9, minute: 0, daysOfWeek: [] }))).toBe(
      '0 9 * * *'
    );
  });

  it('monthly on day 1 at 00:00 → "0 0 1 * *"', () => {
    expect(buildExpression(state({ mode: 'monthly', hour: 0, minute: 0, dayOfMonth: 1 }))).toBe(
      '0 0 1 * *'
    );
  });

  it('custom → joins custom fields with spaces', () => {
    expect(
      buildExpression(
        state({
          mode: 'custom',
          customMinute: '30',
          customHour: '9',
          customDom: '*',
          customMonth: '*',
          customDow: '1-5',
        })
      )
    ).toBe('30 9 * * 1-5');
  });

  it('custom empty fields default to "*"', () => {
    expect(
      buildExpression(
        state({
          mode: 'custom',
          customMinute: '',
          customHour: '',
          customDom: '',
          customMonth: '',
          customDow: '',
        })
      )
    ).toBe('* * * * *');
  });

  it('buildExpression output is parseable by parseCron', () => {
    const modes: BuilderState['mode'][] = [
      'every-minute',
      'every-n-minutes',
      'hourly',
      'daily',
      'weekly',
      'monthly',
    ];
    for (const mode of modes) {
      const expr = buildExpression(state({ mode }));
      expect(isCronError(parseCron(expr))).toBe(false);
    }
  });
});
