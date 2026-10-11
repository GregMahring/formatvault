/**
 * Detected-format types and route mapping, kept apart from the detectors in
 * detectFormat.ts so the home page can render without bundling every format
 * parser — it loads detectFormat on demand when the user enters input.
 */

export type DetectedFormat =
  | 'json'
  | 'json5'
  | 'xml'
  | 'csv'
  | 'yaml'
  | 'toml'
  | 'sql'
  | 'jwt'
  | 'base64'
  | 'url-encoded'
  | 'unknown';

/** Maps detected format to the corresponding tool route */
export const FORMAT_TO_ROUTE: Record<Exclude<DetectedFormat, 'unknown' | 'json5'>, string> = {
  json: '/json-formatter',
  xml: '/xml-formatter',
  csv: '/csv-formatter',
  yaml: '/yaml-formatter',
  toml: '/toml-formatter',
  sql: '/sql-formatter',
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
