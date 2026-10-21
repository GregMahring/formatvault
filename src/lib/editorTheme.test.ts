import { describe, it, expect } from 'vitest';
import { editorPalettes } from './editorTheme';

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Expected #rrggbb, got ${hex}`);
  return [parseInt(m[1] ?? '', 16), parseInt(m[2] ?? '', 16), parseInt(m[3] ?? '', 16)];
}

/** Composite an `rgba(r,g,b,a)` overlay onto an opaque background. */
function overlay(rgba: string, under: Rgb): Rgb {
  const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(rgba);
  if (!m) throw new Error(`Expected rgba(...), got ${rgba}`);
  const a = Number(m[4]);
  const top = [Number(m[1]), Number(m[2]), Number(m[3])];
  return under.map((c, i) => (top[i] ?? 0) * a + c * (1 - a)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio. */
function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// Every other key renders text (syntax, comments, punctuation, line numbers,
// fold placeholder), so a colour added to a palette is checked automatically.
const BACKGROUND_KEYS = new Set([
  'bg',
  'bgLine',
  'bgSelection',
  'bgMatchingBracket',
  'gutter',
  'gutterBorder',
]);
// Non-text UI (WCAG 1.4.11) only needs 3:1.
const NON_TEXT_KEYS = new Set(['cursor']);

describe.each(Object.entries(editorPalettes))('%s editor palette', (_name, palette) => {
  const bg = parseHex(palette.bg);
  // The active-line highlight sits behind the line being edited, so text must pass there too.
  const activeLine = overlay(palette.bgLine, bg);

  const colours = Object.entries(palette).filter(([key]) => !BACKGROUND_KEYS.has(key));

  it.each(colours)('%s (%s) meets WCAG AA contrast', (key, value) => {
    const fg = parseHex(value);
    const worst = Math.min(contrast(fg, bg), contrast(fg, activeLine));
    expect(worst).toBeGreaterThanOrEqual(NON_TEXT_KEYS.has(key) ? 3 : 4.5);
  });
});
