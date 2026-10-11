/** TOML ↔ YAML conversions. */

import { parseYaml, serializeToYaml } from '../yaml/yamlFormatter';
import type { YamlIndent } from '../yaml/yamlFormatter';
import { parseToml, serializeToToml } from '../toml/tomlFormatter';
import type { ConversionResult, ConvertError } from './converters';

// ─── TOML → YAML ───────────────────────────────────────────────────────────

export function tomlToYaml(input: string, indent: YamlIndent = 2): ConversionResult {
  const { value, error } = parseToml(input);
  if (error) return { output: null, error };

  try {
    const output = serializeToYaml(value, indent);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `YAML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── YAML → TOML ───────────────────────────────────────────────────────────

export function yamlToToml(input: string): ConversionResult {
  const { value, error } = parseYaml(input);
  if (error) return { output: null, error };

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      output: null,
      error:
        'TOML root must be a table (object). YAML sequences and scalar values cannot be converted to TOML.',
      // Note: YAML arrays map directly to TOML arrays but only as table values, not roots
    } as ConvertError;
  }

  try {
    const output = serializeToToml(value as Record<string, unknown>);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `TOML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
