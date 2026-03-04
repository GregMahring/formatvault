/**
 * Color format parsing and conversion utilities.
 * Supports hex, RGB, HSL, and OKLCH.
 * All processing is client-side — no data leaves the browser (ADR-0001).
 *
 * OKLCH math follows Björn Ottosson's OKLab specification.
 */

export interface RgbColor {
  r: number; // 0–255 integer
  g: number;
  b: number;
}

export interface HslColor {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export interface OklchColor {
  l: number; // 0–1
  c: number; // 0 to ~0.4
  h: number; // 0–360 (0 when achromatic)
}

export interface ParsedColor {
  rgb: RgbColor;
  hex: string; // lowercase #rrggbb
  hsl: HslColor;
  oklch: OklchColor;
}

export interface ColorParseError {
  error: string;
}

export type ColorResult = ParsedColor | ColorParseError;

export function isColorError(r: ColorResult): r is ColorParseError {
  return 'error' in r;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round(v: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

function toHexByte(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
}

// ── RGB ↔ HSL ─────────────────────────────────────────────────────────────────

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: round(l * 100, 1) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) {
    h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  } else if (max === gn) {
    h = ((bn - rn) / d + 2) / 6;
  } else {
    h = ((rn - gn) / d + 4) / 6;
  }

  return {
    h: round(h * 360, 1),
    s: round(s * 100, 1),
    l: round(l * 100, 1),
  };
}

function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

// ── RGB ↔ OKLCH ───────────────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function linearToSrgbByte(c: number): number {
  const clamped = clamp(c, 0, 1);
  const encoded =
    clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
}

function rgbToOklch({ r, g, b }: RgbColor): OklchColor {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  // Linear sRGB → LMS (Björn Ottosson M1)
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS → OKLab (M2)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bk = 0.0259040371 * l_ + 0.4072384251 * m_ - 0.4328948739 * s_;

  // OKLab → OKLCH (threshold small C to zero for achromatic colors)
  const C = Math.sqrt(a * a + bk * bk);
  const isAchromatic = C < 0.0005;
  const H = isAchromatic ? 0 : (Math.atan2(bk, a) * 180) / Math.PI;

  return {
    l: round(L, 4),
    c: isAchromatic ? 0 : round(C, 4),
    h: round(H < 0 ? H + 360 : H, 1),
  };
}

function oklchToRgb({ l, c, h }: OklchColor): RgbColor {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bk = c * Math.sin(hRad);

  // OKLab → LMS (numerically computed inverse of M2)
  const l_ = 0.9999008157 * l + 0.3939278718 * a + 0.4006279324 * bk;
  const m_ = 1.0000293561 * l - 0.104848271 * a - 0.1185418004 * bk;
  const s_ = 1.0005936174 * l - 0.075061925 * a - 2.397572616 * bk;

  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  // LMS → linear sRGB (inverse M1)
  const rL = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const gL = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bL = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;

  return {
    r: linearToSrgbByte(rL),
    g: linearToSrgbByte(gL),
    b: linearToSrgbByte(bL),
  };
}

// ── Build ParsedColor from RGB ────────────────────────────────────────────────

export function fromRgb(rgb: RgbColor): ParsedColor {
  const r = clamp(Math.round(rgb.r), 0, 255);
  const g = clamp(Math.round(rgb.g), 0, 255);
  const b = clamp(Math.round(rgb.b), 0, 255);
  const clamped = { r, g, b };
  return {
    rgb: clamped,
    hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
    hsl: rgbToHsl(clamped),
    oklch: rgbToOklch(clamped),
  };
}

// ── CSS string formatters ─────────────────────────────────────────────────────

export function cssHex(c: ParsedColor): string {
  return c.hex;
}

export function cssRgb(c: ParsedColor): string {
  return `rgb(${String(c.rgb.r)}, ${String(c.rgb.g)}, ${String(c.rgb.b)})`;
}

export function cssHsl(c: ParsedColor): string {
  return `hsl(${String(c.hsl.h)}, ${String(c.hsl.s)}%, ${String(c.hsl.l)}%)`;
}

export function cssOklch(c: ParsedColor): string {
  return `oklch(${String(c.oklch.l)} ${String(c.oklch.c)} ${String(c.oklch.h)})`;
}

// ── Format parsers ────────────────────────────────────────────────────────────

function parseHexStr(input: string): ColorResult {
  const hex = input.startsWith('#') ? input.slice(1) : input;
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) {
    return { error: 'Invalid hex color. Expected #rgb, #rrggbb, or #rrggbbaa.' };
  }
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt((hex[0] ?? '0') + (hex[0] ?? '0'), 16);
    g = parseInt((hex[1] ?? '0') + (hex[1] ?? '0'), 16);
    b = parseInt((hex[2] ?? '0') + (hex[2] ?? '0'), 16);
  } else {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  return fromRgb({ r, g, b });
}

function parseRgbStr(input: string): ColorResult {
  const match =
    /rgba?\(\s*(-?[\d.]+)%?\s*[,\s]\s*(-?[\d.]+)%?\s*[,\s]\s*(-?[\d.]+)%?(?:\s*[,/]\s*-?[\d.]+%?)?\s*\)/i.exec(
      input
    );
  if (!match?.[1] || !match[2] || !match[3]) {
    return { error: 'Invalid rgb() value. Expected rgb(r, g, b) with 0–255 integers.' };
  }
  const isPercent = input.slice(0, input.indexOf('(')).length < 6 && input.includes('%');
  const scale = isPercent ? 2.55 : 1;
  return fromRgb({
    r: clamp(Math.round(parseFloat(match[1]) * scale), 0, 255),
    g: clamp(Math.round(parseFloat(match[2]) * scale), 0, 255),
    b: clamp(Math.round(parseFloat(match[3]) * scale), 0, 255),
  });
}

function parseHslStr(input: string): ColorResult {
  const match =
    /hsla?\(\s*(-?[\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)/i.exec(
      input
    );
  if (!match?.[1] || !match[2] || !match[3]) {
    return { error: 'Invalid hsl() value. Expected hsl(h, s%, l%).' };
  }
  const rawH = parseFloat(match[1]);
  const h = ((rawH % 360) + 360) % 360;
  const s = clamp(parseFloat(match[2]), 0, 100);
  const l = clamp(parseFloat(match[3]), 0, 100);
  return fromRgb(hslToRgb({ h, s, l }));
}

function parseOklchStr(input: string): ColorResult {
  const match =
    /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*[\d.]+%?)?\s*\)/i.exec(input);
  if (!match?.[1] || !match[3] || !match[4]) {
    return { error: 'Invalid oklch() value. Expected oklch(L C H) e.g. oklch(0.5 0.2 120).' };
  }
  let lVal = parseFloat(match[1]);
  if (match[2] === '%') lVal = lVal / 100;
  const c = parseFloat(match[3]);
  const h = parseFloat(match[4]);
  return fromRgb(oklchToRgb({ l: clamp(lVal, 0, 1), c: clamp(c, 0, 1), h }));
}

/** Auto-detect format and parse. Returns a ColorParseError on failure. */
export function parseColor(input: string): ColorResult {
  const t = input.trim();
  if (!t) return { error: 'Enter a color value.' };

  if (t.startsWith('#') || /^[0-9a-fA-F]{3,8}$/.test(t)) return parseHexStr(t);
  if (/^rgba?\(/i.test(t)) return parseRgbStr(t);
  if (/^hsla?\(/i.test(t)) return parseHslStr(t);
  if (/^oklch\(/i.test(t)) return parseOklchStr(t);

  return {
    error: 'Unrecognized format. Enter a hex color (#rrggbb), rgb(), hsl(), or oklch() value.',
  };
}
