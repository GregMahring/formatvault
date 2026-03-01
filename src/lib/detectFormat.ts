/**
 * Format auto-detection — identifies the most likely data format from raw input.
 *
 * Detection priority (most specific → least specific):
 * 1. JWT — starts with `eyJ`, 3 dot-separated parts
 * 2. URL-encoded — contains %XX sequences
 * 3. JSON — JSON.parse succeeds
 * 4. JSON5 — json5.parse succeeds (relaxed JSON with comments/trailing commas)
 * 5. CSV — 2+ lines with consistent delimiter count and 2+ columns
 * 6. YAML — js-yaml.load succeeds and result is not a scalar string
 * 7. Base64 — heuristic pattern match (last to avoid false positives)
 * 8. Unknown — no match
 */
import JSON5 from 'json5';
import yaml from 'js-yaml';
import Papa from 'papaparse';
import { looksLikeJwt } from '@/features/tools/jwtDecoder';
import { looksLikeBase64 } from '@/features/tools/base64Codec';
import { looksLikeEncoded } from '@/features/tools/urlCodec';

export type DetectedFormat =
  | 'json'
  | 'json5'
  | 'csv'
  | 'yaml'
  | 'jwt'
  | 'base64'
  | 'url-encoded'
  | 'unknown';

export interface DetectionResult {
  /** The best-guess format */
  primary: DetectedFormat;
  /** All formats that matched, ordered by priority */
  alternatives: DetectedFormat[];
  /** high = only one match; medium = ambiguous (multiple matches); low = weak heuristic */
  confidence: 'high' | 'medium' | 'low';
}

/** Maps detected format to the corresponding tool route */
export const FORMAT_TO_ROUTE: Record<Exclude<DetectedFormat, 'unknown' | 'json5'>, string> = {
  json: '/json-formatter',
  csv: '/csv-formatter',
  yaml: '/yaml-formatter',
  jwt: '/jwt-decoder',
  base64: '/base64-encoder',
  'url-encoded': '/url-encoder',
};

/**
 * Get the route for a detected format.
 * JSON5 maps to the JSON formatter (with relaxed mode).
 */
export function getRouteForFormat(format: DetectedFormat): string | null {
  if (format === 'json5') return '/json-formatter';
  if (format === 'unknown') return null;
  return FORMAT_TO_ROUTE[format];
}

// ── Individual detectors ─────────────────────────────────────────────────────

function isJwt(input: string): boolean {
  return looksLikeJwt(input);
}

function isUrlEncoded(input: string): boolean {
  // Require at least one %XX and some substance beyond just a single encoded char
  return looksLikeEncoded(input) && input.trim().length > 3;
}

function isJson(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}

function isJson5(input: string): boolean {
  try {
    const result: unknown = JSON5.parse(input);
    // Ensure it's actually structured data, not just a bare string/number
    return typeof result === 'object' && result !== null;
  } catch {
    return false;
  }
}

function isCsv(input: string): boolean {
  const sample = input.trim();
  const lines = sample.split('\n');
  // Need at least 2 lines for CSV to be meaningful
  if (lines.length < 2) return false;

  // Use PapaParse to attempt parsing — check first 20 lines for performance
  const preview = lines.slice(0, 20).join('\n');
  const result = Papa.parse(preview, { delimiter: '', header: false });

  if (result.errors.length > 0) return false;
  const data = result.data as string[][];
  if (data.length < 2) return false;

  // Must have at least 2 columns
  const firstRowCols = data[0]?.length ?? 0;
  if (firstRowCols < 2) return false;

  // Check column consistency — at least 80% of rows should have the same column count
  let consistent = 0;
  for (const row of data) {
    if (row.length === firstRowCols) consistent++;
  }
  return consistent / data.length >= 0.8;
}

function isYaml(input: string): boolean {
  try {
    const result = yaml.load(input);
    // Valid JSON is valid YAML, so this detector only matches non-JSON YAML.
    // We also reject scalar results (any plain text is a YAML scalar string).
    return typeof result === 'object' && result !== null;
  } catch {
    return false;
  }
}

function isBase64(input: string): boolean {
  const trimmed = input.trim();
  // Require minimum length to avoid false positives on short strings
  return trimmed.length >= 8 && looksLikeBase64(trimmed);
}

// ── Main detection function ──────────────────────────────────────────────────

export function detectFormat(input: string): DetectionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { primary: 'unknown', alternatives: [], confidence: 'low' };
  }

  // For large inputs, detect on a sample for performance
  const sample = trimmed.length > 100_000 ? trimmed.slice(0, 1024) : trimmed;

  const matches: DetectedFormat[] = [];

  // Priority order — most specific first
  if (isJwt(sample)) matches.push('jwt');
  if (isUrlEncoded(sample)) matches.push('url-encoded');
  if (isJson(trimmed)) matches.push('json');
  else if (isJson5(trimmed)) matches.push('json5');
  if (isCsv(sample)) matches.push('csv');
  if (isYaml(trimmed) && !matches.includes('json') && !matches.includes('json5')) {
    matches.push('yaml');
  }
  if (isBase64(sample) && matches.length === 0) matches.push('base64');

  if (matches.length === 0) {
    return { primary: 'unknown', alternatives: [], confidence: 'low' };
  }

  const [primary] = matches;
  if (!primary) {
    return { primary: 'unknown', alternatives: [], confidence: 'low' };
  }
  const confidence = matches.length === 1 ? 'high' : 'medium';

  return { primary, alternatives: matches, confidence };
}
