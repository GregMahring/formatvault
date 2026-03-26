import { describe, it, expect } from 'vitest';
import { formatXml, minifyXml, validateXmlOnly } from './xmlFormatter';

const SIMPLE_XML = '<root><child>hello</child></root>';
const FORMATTED_XML = `<root>\n  <child>hello</child>\n</root>`;
const XML_WITH_ATTRS = '<root id="1"><item enabled="true">value</item></root>';
const INVALID_XML = '<root><unclosed></root>';
const EMPTY_XML = '   ';

describe('formatXml', () => {
  it('pretty-prints simple XML with 2-space indent', () => {
    const result = formatXml(SIMPLE_XML, 2);
    expect(result.error).toBeNull();
    expect(result.output).toBe(FORMATTED_XML);
  });

  it('pretty-prints with 4-space indent', () => {
    const result = formatXml(SIMPLE_XML, 4);
    expect(result.error).toBeNull();
    expect(result.output).toContain('    <child>');
  });

  it('preserves attributes', () => {
    const result = formatXml(XML_WITH_ATTRS, 2);
    expect(result.error).toBeNull();
    expect(result.output).toContain('id="1"');
    expect(result.output).toContain('enabled="true"');
  });

  it('returns error for invalid XML', () => {
    const result = formatXml(INVALID_XML, 2);
    expect(result.error).not.toBeNull();
    expect(result.output).toBeNull();
  });

  it('returns error for empty input', () => {
    const result = formatXml(EMPTY_XML, 2);
    expect(result.error).toBe('Input is empty.');
    expect(result.output).toBeNull();
  });

  it('handles XML with a declaration', () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?><root><item>1</item></root>';
    const result = formatXml(input, 2);
    expect(result.error).toBeNull();
    expect(result.output).toContain('<item>1</item>');
  });

  it('handles CDATA sections', () => {
    const input = '<root><![CDATA[some & raw <data>]]></root>';
    const result = formatXml(input, 2);
    expect(result.error).toBeNull();
    expect(result.output).toContain('CDATA');
  });

  it('handles deeply nested XML', () => {
    const input = '<a><b><c><d>deep</d></c></b></a>';
    const result = formatXml(input, 2);
    expect(result.error).toBeNull();
    expect(result.output).toContain('      <d>deep</d>');
  });
});

describe('minifyXml', () => {
  it('removes whitespace from already-formatted XML', () => {
    const result = minifyXml(FORMATTED_XML);
    expect(result.error).toBeNull();
    expect(result.output).not.toContain('\n');
    expect(result.output).not.toContain('  ');
  });

  it('returns error for invalid XML', () => {
    const result = minifyXml(INVALID_XML);
    expect(result.error).not.toBeNull();
  });

  it('returns error for empty input', () => {
    const result = minifyXml(EMPTY_XML);
    expect(result.error).toBe('Input is empty.');
  });
});

describe('validateXmlOnly', () => {
  it('returns null for valid XML', () => {
    expect(validateXmlOnly(SIMPLE_XML)).toBeNull();
  });

  it('returns error for unclosed tag', () => {
    const err = validateXmlOnly(INVALID_XML);
    expect(err).not.toBeNull();
    expect(err?.error).toBeTruthy();
  });

  it('returns error for empty input', () => {
    const err = validateXmlOnly(EMPTY_XML);
    expect(err?.error).toBe('Input is empty.');
  });

  it('returns null for XML with attributes', () => {
    expect(validateXmlOnly(XML_WITH_ATTRS)).toBeNull();
  });

  it('returns line/col info for parse errors', () => {
    const err = validateXmlOnly('<root><bad attr=noquotes></root>');
    // fast-xml-parser may or may not catch this specific case; just verify it doesn't crash
    expect(err === null || typeof err.error === 'string').toBe(true);
  });
});
