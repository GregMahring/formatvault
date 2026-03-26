import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

export type XmlIndent = 2 | 4;

export interface XmlFormatResult {
  output: string;
  error: null;
}

export interface XmlFormatError {
  output: null;
  error: string;
  line?: number;
  col?: number;
}

export type XmlResult = XmlFormatResult | XmlFormatError;

const PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  cdataPropName: '__cdata',
  commentPropName: '__comment',
  processEntities: true,
  htmlEntities: false,
  allowBooleanAttributes: true,
} as const;

function validateInput(input: string): XmlFormatError | null {
  const result = XMLValidator.validate(input, { allowBooleanAttributes: true });
  if (result === true) return null;
  return {
    output: null,
    error: result.err.msg,
    line: result.err.line,
    col: result.err.col,
  };
}

export function formatXml(input: string, indent: XmlIndent): XmlResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  const validationError = validateInput(trimmed);
  if (validationError) return validationError;

  try {
    const parser = new XMLParser(PARSER_OPTIONS);
    const parsed = parser.parse(trimmed) as unknown;

    const builder = new XMLBuilder({
      ...PARSER_OPTIONS,
      format: true,
      indentBy: ' '.repeat(indent),
    });

    const output = builder.build(parsed).trim();
    return { output, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }
}

export function minifyXml(input: string): XmlResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  const validationError = validateInput(trimmed);
  if (validationError) return validationError;

  try {
    const parser = new XMLParser(PARSER_OPTIONS);
    const parsed = parser.parse(trimmed) as unknown;

    const builder = new XMLBuilder({
      ...PARSER_OPTIONS,
      format: false,
    });

    const output = builder.build(parsed).trim();
    return { output, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }
}

/** Validate only — returns null if valid, error object if not. */
export function validateXmlOnly(input: string): XmlFormatError | null {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };
  return validateInput(trimmed);
}
