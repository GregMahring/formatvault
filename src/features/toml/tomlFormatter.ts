import { parse, stringify, TomlError } from 'smol-toml';

export interface TomlFormatResult {
  output: string;
  error: null;
}

export interface TomlFormatError {
  output: null;
  error: string;
  line?: number;
}

export type TomlResult = TomlFormatResult | TomlFormatError;

/**
 * Parse and re-stringify TOML to normalize formatting.
 */
export function formatToml(input: string): TomlResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = parse(trimmed) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof TomlError) {
      return { output: null, error: err.message, line: err.line };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }

  try {
    const output = stringify(parsed);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: `Serialization error: ${msg}` };
  }
}

/**
 * Validate TOML only. Returns null on success or error with optional line number.
 */
export function validateToml(input: string): TomlFormatError | null {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  try {
    parse(trimmed);
    return null;
  } catch (err) {
    if (err instanceof TomlError) {
      return { output: null, error: err.message, line: err.line };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }
}

/**
 * Parse TOML to a JS object. Used by converters.
 */
export function parseToml(input: string): { value: Record<string, unknown>; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { value: {}, error: 'Input is empty.' };

  try {
    const value = parse(trimmed) as Record<string, unknown>;
    return { value, error: null };
  } catch (err) {
    if (err instanceof TomlError) {
      return { value: {}, error: err.message };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { value: {}, error: msg };
  }
}

/** Serialize a JS object to TOML string. Used by converters. */
export function serializeToToml(value: Record<string, unknown>): string {
  return stringify(value);
}
