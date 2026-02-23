import yaml from 'js-yaml';

export type YamlIndent = 2 | 4;

export interface YamlFormatOptions {
  indent: YamlIndent;
}

export interface YamlFormatResult {
  output: string;
  error: null;
  /** Number of YAML documents found (separated by ---) */
  documentCount: number;
}

export interface YamlFormatError {
  output: null;
  error: string;
  line?: number;
}

export type YamlResult = YamlFormatResult | YamlFormatError;

/**
 * Parse and re-format YAML. Handles multi-document YAML (--- separators).
 */
export function formatYaml(input: string, options: YamlFormatOptions): YamlResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }

  // Split on document separators to support multi-document YAML
  // js-yaml loadAll handles this natively
  const documents: unknown[] = [];

  try {
    yaml.loadAll(trimmed, (doc) => {
      documents.push(doc);
    });
  } catch (err) {
    if (err instanceof yaml.YAMLException) {
      return {
        output: null,
        error: err.message,
        // js-yaml always provides mark on YAMLException; line is 0-based, convert to 1-based
        line: err.mark.line + 1,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }

  try {
    const parts = documents.map((doc) =>
      yaml.dump(doc, {
        indent: options.indent,
        lineWidth: -1, // disable line wrapping
        noRefs: true, // don't use YAML anchors/aliases
        quotingType: '"',
        forceQuotes: false,
      })
    );

    const output = parts.join('---\n');
    return { output: output.trimEnd(), error: null, documentCount: documents.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: `Serialization error: ${msg}` };
  }
}

/**
 * Validate YAML only. Returns null on success or error string with optional line number.
 */
export function validateYaml(input: string): YamlFormatError | null {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  try {
    yaml.loadAll(trimmed, () => undefined);
    return null;
  } catch (err) {
    if (err instanceof yaml.YAMLException) {
      return {
        output: null,
        error: err.message,
        line: err.mark.line + 1,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }
}

/**
 * Parse YAML to a JS value. Used by converters.
 * Returns { value, error }.
 */
export function parseYaml(input: string): { value: unknown; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { value: null, error: 'Input is empty.' };

  try {
    const value = yaml.load(trimmed);
    return { value, error: null };
  } catch (err) {
    if (err instanceof yaml.YAMLException) {
      return { value: null, error: err.message };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { value: null, error: msg };
  }
}

/** Serialize a JS value to YAML string. Used by converters. */
export function serializeToYaml(value: unknown, indent: YamlIndent = 2): string {
  return yaml.dump(value, {
    indent,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}
