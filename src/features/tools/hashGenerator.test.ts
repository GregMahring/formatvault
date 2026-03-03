import { describe, it, expect } from 'vitest';
import { computeHash, isHashError, type HashResult } from './hashGenerator';

// Test vectors verified with openssl sha256/sha512/md5
describe('computeHash', () => {
  describe('MD5', () => {
    it('hashes empty string', async () => {
      const result = await computeHash('', 'md5');
      expect(isHashError(result)).toBe(false);
      const { hex, base64 } = result as HashResult;
      expect(hex).toBe('d41d8cd98f00b204e9800998ecf8427e');
      expect(hex).toHaveLength(32);
      expect(base64).toBe('1B2M2Y8AsgTpgAmY7PhCfg==');
    });

    it('hashes "abc"', async () => {
      const result = await computeHash('abc', 'md5');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toBe('900150983cd24fb0d6963f7d28e17f72');
      expect(hex).toHaveLength(32);
    });

    it('hashes ArrayBuffer input matching string result', async () => {
      const buf = new TextEncoder().encode('abc').buffer;
      const result = await computeHash(buf, 'md5');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toBe('900150983cd24fb0d6963f7d28e17f72');
    });
  });

  describe('SHA-256', () => {
    it('hashes empty string', async () => {
      const result = await computeHash('', 'sha-256');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(hex).toHaveLength(64);
    });

    it('hashes "abc"', async () => {
      const result = await computeHash('abc', 'sha-256');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      expect(hex).toHaveLength(64);
    });

    it('produces correct base64 for empty string', async () => {
      const result = await computeHash('', 'sha-256');
      expect(isHashError(result)).toBe(false);
      const { base64 } = result as HashResult;
      expect(base64).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
    });

    it('hashes ArrayBuffer input matching string result', async () => {
      const buf = new TextEncoder().encode('abc').buffer;
      const result = await computeHash(buf, 'sha-256');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
  });

  describe('SHA-512', () => {
    it('hashes empty string', async () => {
      const result = await computeHash('', 'sha-512');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      // NIST FIPS 180-4 test vector
      expect(hex).toBe(
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
      );
      expect(hex).toHaveLength(128);
    });

    it('hashes "abc"', async () => {
      const result = await computeHash('abc', 'sha-512');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toBe(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
      );
      expect(hex).toHaveLength(128);
    });

    it('hashes ArrayBuffer input', async () => {
      const buf = new TextEncoder().encode('abc').buffer;
      const result = await computeHash(buf, 'sha-512');
      expect(isHashError(result)).toBe(false);
      const { hex } = result as HashResult;
      expect(hex).toHaveLength(128);
    });
  });

  describe('isHashError', () => {
    it('identifies error objects', () => {
      expect(isHashError({ error: 'something went wrong' })).toBe(true);
    });

    it('identifies result objects', () => {
      expect(isHashError({ hex: 'abc', base64: 'xyz' })).toBe(false);
    });
  });
});
