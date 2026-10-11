/** JSON ↔ XML conversions. */

import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import type { ConversionResult } from './converters';

// ─── XML → JSON ────────────────────────────────────────────────────────────

/**
 * Convert XML to a JSON representation.
 * Attributes are prefixed with "@" to distinguish them from child elements.
 * Text content of elements with attributes is stored under "#text".
 */
export function xmlToJson(input: string, indent = 2): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  const validation = XMLValidator.validate(trimmed, { allowBooleanAttributes: true });
  if (validation !== true) {
    return {
      output: null,
      error: `Invalid XML: ${validation.err.msg} (line ${String(validation.err.line)})`,
    };
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      textNodeName: '#text',
      cdataPropName: '#cdata',
      allowBooleanAttributes: true,
    });
    const parsed: unknown = parser.parse(trimmed);
    return { output: JSON.stringify(parsed, null, indent), error: null };
  } catch (err) {
    return {
      output: null,
      error: `Conversion error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── JSON → XML ────────────────────────────────────────────────────────────

/**
 * Convert a JSON object to XML.
 * Keys prefixed with "@" are treated as attributes; "#text" becomes text content.
 * The JSON must be an object (not an array or primitive) — XML requires a single root element.
 * If the object has multiple top-level keys they are wrapped in <root> with a warning.
 */
export function jsonToXml(input: string, indent = 2): ConversionResult {
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

  if (Array.isArray(parsed)) {
    return {
      output: null,
      error:
        'JSON arrays cannot be directly converted to XML — XML requires a single root element. Wrap the array in an object first: { "items": [ ... ] }.',
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      output: null,
      error:
        'JSON must be an object to convert to XML. Primitive values cannot be XML root elements.',
    };
  }

  const keys = Object.keys(parsed);
  if (keys.length === 0) return { output: null, error: 'JSON object is empty.' };

  let xmlInput: Record<string, unknown>;
  let warning: string | undefined;

  if (keys.length > 1) {
    // Multiple top-level keys — wrap in <root> to produce valid XML
    xmlInput = { root: parsed };
    warning =
      'JSON had multiple top-level keys. They were wrapped in a <root> element to produce valid XML.';
  } else {
    xmlInput = parsed as Record<string, unknown>;
  }

  try {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      cdataPropName: '#cdata',
      format: true,
      indentBy: ' '.repeat(indent),
      processEntities: true,
    });

    const body = builder.build(xmlInput).trim();
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
    return { output, error: null, warning };
  } catch (err) {
    return {
      output: null,
      error: `XML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
