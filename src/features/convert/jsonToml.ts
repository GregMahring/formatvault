/** JSON ↔ TOML conversions. */

import { parseToml, serializeToToml } from '../toml/tomlFormatter';
import type { ConversionResult } from './converters';

// ─── TOML → JSON ───────────────────────────────────────────────────────────

export function tomlToJson(input: string, indent = 2): ConversionResult {
  const { value, error } = parseToml(input);
  if (error) return { output: null, error };

  try {
    return { output: JSON.stringify(value, null, indent), error: null };
  } catch (err) {
    return {
      output: null,
      error: `JSON serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── JSON → TOML ───────────────────────────────────────────────────────────

export function jsonToToml(input: string): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      output: null,
      error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      output: null,
      error:
        'TOML root must be a table (object). JSON arrays and scalar values cannot be converted to TOML.',
    };
  }

  try {
    const output = serializeToToml(parsed as Record<string, unknown>);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `TOML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
