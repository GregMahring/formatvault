/**
 * JSON Schema generation and validation.
 *
 * Both libraries (to-json-schema, ajv) are dynamically imported
 * to keep them out of the main bundle and code-split per route.
 */

export interface SchemaGenOptions {
  /** Infer required fields (default true) */
  required?: boolean;
}

export interface SchemaResult {
  output: string;
  error: null;
}

export interface SchemaError {
  output: null;
  error: string;
}

export type SchemaGenResult = SchemaResult | SchemaError;

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidateResult {
  result: ValidationResult;
  error: null;
}

export interface ValidateError {
  result: null;
  error: string;
}

export type SchemaValidateResult = ValidateResult | ValidateError;

/**
 * Generate a JSON Schema from a JSON string.
 * Dynamically imports `to-json-schema` for code splitting.
 */
export async function generateJsonSchema(
  input: string,
  options?: SchemaGenOptions
): Promise<SchemaGenResult> {
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

  try {
    const toJsonSchema = (await import('to-json-schema')).default;
    const schema = toJsonSchema(parsed, {
      required: options?.required !== false,
      arrays: { mode: 'first' },
      strings: { detectFormat: true },
      objects: { additionalProperties: false },
    }) as Record<string, unknown>;

    // Add $schema draft identifier
    schema.$schema = 'http://json-schema.org/draft-07/schema#';

    const output = JSON.stringify(schema, null, 2);
    return { output, error: null };
  } catch (err) {
    return {
      output: null,
      error: `Schema generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Validate a JSON string against a JSON Schema string.
 * Dynamically imports `ajv` for code splitting.
 */
export async function validateJsonAgainstSchema(
  jsonInput: string,
  schemaInput: string
): Promise<SchemaValidateResult> {
  const trimmedJson = jsonInput.trim();
  const trimmedSchema = schemaInput.trim();

  if (!trimmedJson) return { result: null, error: 'JSON input is empty.' };
  if (!trimmedSchema) return { result: null, error: 'Schema input is empty.' };

  let data: unknown;
  try {
    data = JSON.parse(trimmedJson);
  } catch (err) {
    return {
      result: null,
      error: `Invalid JSON data: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let schema: unknown;
  try {
    schema = JSON.parse(trimmedSchema);
  } catch (err) {
    return {
      result: null,
      error: `Invalid JSON Schema: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  try {
    const Ajv = (await import('ajv')).default;
    const ajv = new Ajv({ allErrors: true, verbose: true });
    const validate = ajv.compile(schema as Record<string, unknown>);
    const valid = validate(data);

    if (valid) {
      return { result: { valid: true, errors: [] }, error: null };
    }

    const errors: ValidationError[] = (validate.errors ?? []).map((e) => ({
      path: e.instancePath || '/',
      message: e.message ?? 'Unknown error',
      keyword: e.keyword,
    }));

    return { result: { valid: false, errors }, error: null };
  } catch (err) {
    return {
      result: null,
      error: `Validation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
