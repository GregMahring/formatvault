import { describe, it, expect } from 'vitest';
import { detectFormat, getRouteForFormat } from './detectFormat';

describe('detectFormat: XML', () => {
  it.each([
    ['declaration', '<?xml version="1.0"?>\n<note><to>Ana</to></note>'],
    ['plain element', '<config><item key="a">1</item></config>'],
    ['self-closing root', '<empty />'],
    ['namespaced', '<x:root xmlns:x="urn:test"><x:a/></x:root>'],
  ])('detects %s', (_name, input) => {
    expect(detectFormat(input).primary).toBe('xml');
  });

  it('routes XML to the XML formatter', () => {
    expect(getRouteForFormat('xml')).toBe('/xml-formatter');
  });

  it('does not treat malformed markup as XML', () => {
    expect(detectFormat('<a><b></a>').alternatives).not.toContain('xml');
  });

  it('uses a cheap prefix check for very large input', () => {
    const big = `<rows>${'<row id="1">value</row>'.repeat(5000)}</rows>`;
    expect(big.length).toBeGreaterThan(100_000);
    expect(detectFormat(big).primary).toBe('xml');
  });
});

// Guards the existing detectors against the new XML check stealing their input.
describe('detectFormat: other formats unaffected', () => {
  it.each([
    ['json', '{"a": 1, "b": [1, 2]}'],
    ['csv', 'name,age\nAna,30\nBo,25'],
    ['yaml', 'name: Ana\nage: 30\ntags:\n  - a\n  - b'],
    ['sql', 'SELECT * FROM users WHERE id = 1'],
    ['jwt', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'],
  ])('%s', (format, input) => {
    expect(detectFormat(input).primary).toBe(format);
  });

  it('returns unknown for empty input', () => {
    expect(detectFormat('   ').primary).toBe('unknown');
  });
});
