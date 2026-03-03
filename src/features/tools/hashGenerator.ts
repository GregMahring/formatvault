/**
 * Pure async hash utilities — no React, no side effects.
 *
 * MD5 uses js-md5 (not in Web Crypto API).
 * SHA-256 / SHA-512 use native crypto.subtle.digest().
 */
import md5 from 'js-md5';

export type HashAlgorithm = 'md5' | 'sha-256' | 'sha-512';

export interface HashResult {
  hex: string;
  base64: string;
}

export interface HashError {
  error: string;
}

export type HashOutput = HashResult | HashError;

export const HASH_ALGORITHMS: { value: HashAlgorithm; label: string }[] = [
  { value: 'md5', label: 'MD5' },
  { value: 'sha-256', label: 'SHA-256' },
  { value: 'sha-512', label: 'SHA-512' },
];

export const DEFAULT_ALGORITHM: HashAlgorithm = 'sha-256';

export function isHashError(r: HashOutput): r is HashError {
  return 'error' in r;
}

/** Convert an ArrayBuffer to a lowercase hex string. */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert an ArrayBuffer to a base64 string. Safe for fixed-length hash digests. */
function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Compute a hash of the given input using the specified algorithm.
 * Accepts a string or an ArrayBuffer (for file hashing).
 */
export async function computeHash(
  input: string | ArrayBuffer,
  algorithm: HashAlgorithm
): Promise<HashOutput> {
  try {
    if (algorithm === 'md5') {
      // Normalize to string or Uint8Array — md5 may not handle raw ArrayBuffer in all envs.
      const msg = typeof input === 'string' ? input : new Uint8Array(input);
      // @types/js-md5 uses `export =` CJS style; eslint-typescript can't resolve its member
      // types under moduleResolution:bundler (false positive — tsc resolves them correctly).
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      const hex = md5.hex(msg) as string;
      const base64 = md5.base64(msg) as string;
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      return { hex, base64 };
    }

    // SHA-256 / SHA-512 via Web Crypto
    // Pass Uint8Array directly rather than .buffer — in Node.js the backing buffer
    // may be a shared pool buffer larger than the actual data.
    const subtleAlgo = algorithm === 'sha-256' ? 'SHA-256' : 'SHA-512';
    const data =
      typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    const buf = await crypto.subtle.digest(subtleAlgo, data);
    return { hex: bufToHex(buf), base64: bufToBase64(buf) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Hashing failed' };
  }
}
