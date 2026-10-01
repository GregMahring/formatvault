import { describe, it, expect, vi, afterEach } from 'vitest';
import { utf8ByteLength, gzipByteLength, formatBytes } from './byteSize';

describe('utf8ByteLength', () => {
  it('counts ASCII as one byte per character', () => {
    expect(utf8ByteLength('hello')).toBe(5);
  });

  it('counts multi-byte characters by their UTF-8 encoding', () => {
    expect(utf8ByteLength('é')).toBe(2);
    expect(utf8ByteLength('€')).toBe(3);
    expect(utf8ByteLength('😀')).toBe(4);
  });

  it('returns 0 for an empty string', () => {
    expect(utf8ByteLength('')).toBe(0);
  });
});

describe('gzipByteLength', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('compresses repetitive text well below its raw size', async () => {
    const text = 'const value = 1;\n'.repeat(1000);
    const size = await gzipByteLength(text);
    expect(size).not.toBeNull();
    expect(size).toBeLessThan(utf8ByteLength(text) / 10);
  });

  it('returns null when CompressionStream is unavailable', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    expect(await gzipByteLength('abc')).toBeNull();
  });
});

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [12_595, '12.3 KB'],
    [1024 * 1024, '1.00 MB'],
    [4_256_000, '4.06 MB'],
  ])('formats %i as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});
