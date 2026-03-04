import { describe, it, expect } from 'vitest';
import {
  fromRgb,
  parseColor,
  isColorError,
  cssHex,
  cssRgb,
  cssHsl,
  cssOklch,
  type ParsedColor,
} from './colorConverter';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Assert result is not an error; return as ParsedColor. */
function assertParsed(result: ReturnType<typeof parseColor>): ParsedColor {
  if (isColorError(result)) throw new Error(`Unexpected parse error: ${result.error}`);
  return result;
}

// ── fromRgb ───────────────────────────────────────────────────────────────────

describe('fromRgb', () => {
  it('builds correct hex for pure red', () => {
    const c = fromRgb({ r: 255, g: 0, b: 0 });
    expect(c.hex).toBe('#ff0000');
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('builds correct hex for pure green', () => {
    expect(fromRgb({ r: 0, g: 255, b: 0 }).hex).toBe('#00ff00');
  });

  it('builds correct hex for pure blue', () => {
    expect(fromRgb({ r: 0, g: 0, b: 255 }).hex).toBe('#0000ff');
  });

  it('builds correct hex for black', () => {
    expect(fromRgb({ r: 0, g: 0, b: 0 }).hex).toBe('#000000');
  });

  it('builds correct hex for white', () => {
    expect(fromRgb({ r: 255, g: 255, b: 255 }).hex).toBe('#ffffff');
  });

  it('hex is always lowercase', () => {
    expect(fromRgb({ r: 171, g: 205, b: 239 }).hex).toBe('#abcdef');
  });

  it('clamps out-of-range inputs', () => {
    const c = fromRgb({ r: 300, g: -10, b: 128 });
    expect(c.rgb.r).toBe(255);
    expect(c.rgb.g).toBe(0);
    expect(c.rgb.b).toBe(128);
  });

  it('rounds fractional inputs', () => {
    const c = fromRgb({ r: 254.7, g: 0.3, b: 127.5 });
    expect(c.rgb.r).toBe(255);
    expect(c.rgb.g).toBe(0);
    expect(c.rgb.b).toBe(128);
  });

  it('computes HSL for pure red correctly', () => {
    const c = fromRgb({ r: 255, g: 0, b: 0 });
    expect(c.hsl.h).toBe(0);
    expect(c.hsl.s).toBe(100);
    expect(c.hsl.l).toBe(50);
  });

  it('computes HSL for pure green correctly', () => {
    const c = fromRgb({ r: 0, g: 255, b: 0 });
    expect(c.hsl.h).toBe(120);
    expect(c.hsl.s).toBe(100);
    expect(c.hsl.l).toBe(50);
  });

  it('computes HSL for pure blue correctly', () => {
    const c = fromRgb({ r: 0, g: 0, b: 255 });
    expect(c.hsl.h).toBe(240);
    expect(c.hsl.s).toBe(100);
    expect(c.hsl.l).toBe(50);
  });

  it('computes HSL for black (achromatic)', () => {
    const c = fromRgb({ r: 0, g: 0, b: 0 });
    expect(c.hsl.s).toBe(0);
    expect(c.hsl.l).toBe(0);
  });

  it('computes HSL for white (achromatic)', () => {
    const c = fromRgb({ r: 255, g: 255, b: 255 });
    expect(c.hsl.s).toBe(0);
    expect(c.hsl.l).toBe(100);
  });

  it('computes HSL for 50% grey (achromatic)', () => {
    const c = fromRgb({ r: 128, g: 128, b: 128 });
    expect(c.hsl.s).toBe(0);
  });

  it('OKLCH L is in [0, 1] for all inputs', () => {
    for (const rgb of [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 0, b: 0 },
      { r: 128, g: 128, b: 128 },
    ]) {
      const c = fromRgb(rgb);
      expect(c.oklch.l).toBeGreaterThanOrEqual(0);
      expect(c.oklch.l).toBeLessThanOrEqual(1);
    }
  });

  it('OKLCH C is 0 for achromatic colors', () => {
    expect(fromRgb({ r: 0, g: 0, b: 0 }).oklch.c).toBe(0);
    expect(fromRgb({ r: 255, g: 255, b: 255 }).oklch.c).toBe(0);
    expect(fromRgb({ r: 128, g: 128, b: 128 }).oklch.c).toBe(0);
  });

  it('OKLCH H is 0 for achromatic (black)', () => {
    expect(fromRgb({ r: 0, g: 0, b: 0 }).oklch.h).toBe(0);
  });

  it('OKLCH L is greater for lighter colors', () => {
    const white = fromRgb({ r: 255, g: 255, b: 255 });
    const grey = fromRgb({ r: 128, g: 128, b: 128 });
    const black = fromRgb({ r: 0, g: 0, b: 0 });
    expect(white.oklch.l).toBeGreaterThan(grey.oklch.l);
    expect(grey.oklch.l).toBeGreaterThan(black.oklch.l);
  });
});

// ── CSS formatters ────────────────────────────────────────────────────────────

describe('cssHex', () => {
  it('returns the hex string as-is', () => {
    const c = fromRgb({ r: 255, g: 0, b: 0 });
    expect(cssHex(c)).toBe('#ff0000');
  });
});

describe('cssRgb', () => {
  it('formats pure red correctly', () => {
    expect(cssRgb(fromRgb({ r: 255, g: 0, b: 0 }))).toBe('rgb(255, 0, 0)');
  });

  it('formats an arbitrary color correctly', () => {
    expect(cssRgb(fromRgb({ r: 59, g: 130, b: 246 }))).toBe('rgb(59, 130, 246)');
  });
});

describe('cssHsl', () => {
  it('formats pure red correctly', () => {
    expect(cssHsl(fromRgb({ r: 255, g: 0, b: 0 }))).toBe('hsl(0, 100%, 50%)');
  });

  it('formats white correctly', () => {
    expect(cssHsl(fromRgb({ r: 255, g: 255, b: 255 }))).toBe('hsl(0, 0%, 100%)');
  });
});

describe('cssOklch', () => {
  it('returns a string with three space-separated values', () => {
    const str = cssOklch(fromRgb({ r: 255, g: 0, b: 0 }));
    expect(str).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
  });
});

// ── parseColor — hex ──────────────────────────────────────────────────────────

describe('parseColor — hex', () => {
  it('parses #rrggbb', () => {
    const c = assertParsed(parseColor('#ff0000'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses uppercase #RRGGBB', () => {
    const c = assertParsed(parseColor('#FF0000'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-digit shorthand #rgb', () => {
    const c = assertParsed(parseColor('#f00'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-digit #abc as #aabbcc', () => {
    const c = assertParsed(parseColor('#abc'));
    expect(c.rgb).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('parses hex without # prefix', () => {
    const c = assertParsed(parseColor('ff0000'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 8-digit hex (strips alpha channel)', () => {
    const c = assertParsed(parseColor('#ff000080'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('trims surrounding whitespace', () => {
    const c = assertParsed(parseColor('  #ff0000  '));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns error for invalid hex characters', () => {
    expect(isColorError(parseColor('#gggggg'))).toBe(true);
  });

  it('returns error for wrong length hex', () => {
    expect(isColorError(parseColor('#ff00'))).toBe(true);
  });
});

// ── parseColor — rgb ──────────────────────────────────────────────────────────

describe('parseColor — rgb()', () => {
  it('parses comma-separated rgb()', () => {
    const c = assertParsed(parseColor('rgb(255, 0, 0)'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses space-separated rgb() (modern CSS)', () => {
    const c = assertParsed(parseColor('rgb(255 0 0)'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses rgba() and ignores alpha', () => {
    const c = assertParsed(parseColor('rgba(0, 128, 255, 0.5)'));
    expect(c.rgb).toEqual({ r: 0, g: 128, b: 255 });
  });

  it('clamps out-of-range values', () => {
    const c = assertParsed(parseColor('rgb(300, -10, 128)'));
    expect(c.rgb.r).toBe(255);
    expect(c.rgb.g).toBe(0);
    expect(c.rgb.b).toBe(128);
  });

  it('returns error for malformed rgb()', () => {
    expect(isColorError(parseColor('rgb(255)'))).toBe(true);
  });

  it('returns error for rgb() with letters', () => {
    expect(isColorError(parseColor('rgb(red, 0, 0)'))).toBe(true);
  });
});

// ── parseColor — hsl ──────────────────────────────────────────────────────────

describe('parseColor — hsl()', () => {
  it('parses comma-separated hsl()', () => {
    const c = assertParsed(parseColor('hsl(0, 100%, 50%)'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses hsl() with deg suffix', () => {
    const c = assertParsed(parseColor('hsl(0deg, 100%, 50%)'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses hsla() and ignores alpha', () => {
    const c = assertParsed(parseColor('hsla(120, 100%, 50%, 0.8)'));
    expect(c.rgb).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('wraps negative hue values', () => {
    // hsl(-120, 100%, 50%) == hsl(240, 100%, 50%) == pure blue
    const c = assertParsed(parseColor('hsl(-120, 100%, 50%)'));
    expect(c.rgb).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('wraps hue > 360', () => {
    // hsl(360, 100%, 50%) == hsl(0, 100%, 50%) == pure red
    const c = assertParsed(parseColor('hsl(360, 100%, 50%)'));
    expect(c.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses achromatic (s=0)', () => {
    const c = assertParsed(parseColor('hsl(0, 0%, 50%)'));
    expect(c.rgb.r).toBe(c.rgb.g);
    expect(c.rgb.g).toBe(c.rgb.b);
  });

  it('returns error for malformed hsl()', () => {
    expect(isColorError(parseColor('hsl(120)'))).toBe(true);
  });
});

// ── parseColor — oklch ────────────────────────────────────────────────────────

describe('parseColor — oklch()', () => {
  it('parses valid oklch(L C H)', () => {
    const result = assertParsed(parseColor('oklch(0.5 0.1 120)'));
    expect(result.rgb.r).toBeGreaterThanOrEqual(0);
    expect(result.rgb.r).toBeLessThanOrEqual(255);
  });

  it('parses oklch with percentage L', () => {
    // oklch(50% 0.1 120) is the same as oklch(0.5 0.1 120)
    const a = assertParsed(parseColor('oklch(0.5 0.1 120)'));
    const b = assertParsed(parseColor('oklch(50% 0.1 120)'));
    expect(a.rgb).toEqual(b.rgb);
  });

  it('parses oklch with deg suffix on H', () => {
    const a = assertParsed(parseColor('oklch(0.5 0.1 120)'));
    const b = assertParsed(parseColor('oklch(0.5 0.1 120deg)'));
    expect(a.rgb).toEqual(b.rgb);
  });

  it('oklch(1 0 0) produces white', () => {
    const c = assertParsed(parseColor('oklch(1 0 0)'));
    expect(c.rgb.r).toBeGreaterThan(250);
    expect(c.rgb.g).toBeGreaterThan(250);
    expect(c.rgb.b).toBeGreaterThan(250);
  });

  it('oklch(0 0 0) produces black', () => {
    const c = assertParsed(parseColor('oklch(0 0 0)'));
    expect(c.rgb.r).toBe(0);
    expect(c.rgb.g).toBe(0);
    expect(c.rgb.b).toBe(0);
  });

  it('returns error for malformed oklch()', () => {
    expect(isColorError(parseColor('oklch(0.5 0.1)'))).toBe(true);
  });
});

// ── parseColor — error cases ──────────────────────────────────────────────────

describe('parseColor — errors', () => {
  it('returns error for empty string', () => {
    expect(isColorError(parseColor(''))).toBe(true);
  });

  it('returns error for whitespace-only string', () => {
    expect(isColorError(parseColor('   '))).toBe(true);
  });

  it('returns error for unrecognized format', () => {
    expect(isColorError(parseColor('red'))).toBe(true);
  });

  it('returns error for partial input', () => {
    expect(isColorError(parseColor('rgb('))).toBe(true);
  });

  it('error object contains a non-empty message', () => {
    const result = parseColor('notacolor');
    expect(isColorError(result)).toBe(true);
    expect((result as { error: string }).error.length).toBeGreaterThan(0);
  });
});

// ── Roundtrip accuracy ────────────────────────────────────────────────────────

describe('roundtrip: hex → cssOklch → parseColor → same hex', () => {
  const testHexes = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#3b82f6', '#a855f7'];

  for (const hex of testHexes) {
    it(`roundtrips ${hex} through OKLCH within ±1 per channel`, () => {
      const original = assertParsed(parseColor(hex));
      const oklchStr = cssOklch(original);
      const reparsed = assertParsed(parseColor(oklchStr));
      expect(Math.abs(reparsed.rgb.r - original.rgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(reparsed.rgb.g - original.rgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(reparsed.rgb.b - original.rgb.b)).toBeLessThanOrEqual(1);
    });
  }
});

describe('roundtrip: hex → cssHsl → parseColor → same hex', () => {
  const testHexes = ['#ff0000', '#00ff00', '#0000ff', '#3b82f6', '#7c3aed'];

  for (const hex of testHexes) {
    it(`roundtrips ${hex} through HSL within ±1 per channel`, () => {
      const original = assertParsed(parseColor(hex));
      const hslStr = cssHsl(original);
      const reparsed = assertParsed(parseColor(hslStr));
      expect(Math.abs(reparsed.rgb.r - original.rgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(reparsed.rgb.g - original.rgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(reparsed.rgb.b - original.rgb.b)).toBeLessThanOrEqual(1);
    });
  }
});

describe('roundtrip: hex → cssRgb → parseColor → same hex', () => {
  it('roundtrips arbitrary color exactly through RGB', () => {
    const original = assertParsed(parseColor('#abcdef'));
    const rgbStr = cssRgb(original);
    const reparsed = assertParsed(parseColor(rgbStr));
    expect(reparsed.hex).toBe(original.hex);
  });
});
