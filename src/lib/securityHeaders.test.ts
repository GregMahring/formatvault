import { describe, it, expect } from 'vitest';
import { parseHeadersFile, applyDocumentHeaders, DOCUMENT_HEADERS } from './securityHeaders';

describe('parseHeadersFile', () => {
  const SAMPLE = [
    '/*',
    '  # comment',
    '  X-Frame-Options: DENY',
    "  Content-Security-Policy: default-src 'self'; img-src data: https:",
    '',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
  ].join('\n');

  it('groups indented headers under their URL pattern', () => {
    const rules = parseHeadersFile(SAMPLE);
    expect([...rules.keys()]).toEqual(['/*', '/assets/*']);
    expect(rules.get('/assets/*')).toEqual([
      ['Cache-Control', 'public, max-age=31536000, immutable'],
    ]);
  });

  it('skips comments and keeps colons inside values', () => {
    expect(parseHeadersFile(SAMPLE).get('/*')).toEqual([
      ['X-Frame-Options', 'DENY'],
      ['Content-Security-Policy', "default-src 'self'; img-src data: https:"],
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(parseHeadersFile('/*\r\n  X-Test: 1\r\n').get('/*')).toEqual([['X-Test', '1']]);
  });
});

describe('DOCUMENT_HEADERS (from public/_headers)', () => {
  const names = DOCUMENT_HEADERS.map(([name]) => name);
  const value = (name: string) => DOCUMENT_HEADERS.find(([n]) => n === name)?.[1];

  it.each([
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Embedder-Policy',
    'Cross-Origin-Resource-Policy',
  ])('includes %s', (name) => {
    expect(names).toContain(name);
  });

  it('carries the CSP directives pages depend on', () => {
    expect(value('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    // The CSS minifier's WASM won't compile without this (ADR-0007 amendment).
    expect(value('Content-Security-Policy')).toContain("'wasm-unsafe-eval'");
  });

  it('does not pull in rules from other path blocks', () => {
    expect(value('Cache-Control')).toBe('no-cache');
  });
});

describe('applyDocumentHeaders', () => {
  it('sets every header and overrides weaker values a route set', () => {
    const headers = new Headers({ 'X-Frame-Options': 'SAMEORIGIN', 'X-Custom': 'kept' });
    applyDocumentHeaders(headers, [
      ['X-Frame-Options', 'DENY'],
      ['Referrer-Policy', 'no-referrer'],
    ]);
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(headers.get('X-Custom')).toBe('kept');
  });
});
