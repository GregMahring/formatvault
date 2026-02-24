import { describe, it, expect } from 'vitest';
import { decodeJwtToken, isJwtError } from './jwtDecoder';

// Minimal valid JWT: header.payload.signature (all base64url-encoded)
// header: {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Expired JWT (exp in the past)
const EXPIRED_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9' +
  '.drt_po6bHhDOF_FJEHTrO_gOdODt48U9HyTk_qwUIYA';

/** Decode and throw if it's an error — removes need for conditional expects. */
function assertDecoded(token: string) {
  const result = decodeJwtToken(token);
  if (isJwtError(result)) throw new Error(`Expected success but got error: ${result.error}`);
  return result;
}

describe('decodeJwtToken', () => {
  it('decodes a valid JWT header and payload', () => {
    const result = assertDecoded(VALID_JWT);
    expect(result.header.alg).toBe('HS256');
    expect(result.header.typ).toBe('JWT');
    expect(result.payload.sub).toBe('1234567890');
    expect(result.payload.name).toBe('John Doe');
  });

  it('returns issuedAt from iat claim', () => {
    const result = assertDecoded(VALID_JWT);
    expect(result.issuedAt).toBe('2018-01-18T01:30:22.000Z');
  });

  it('returns isExpired=false for token without exp', () => {
    const result = assertDecoded(VALID_JWT);
    expect(result.isExpired).toBe(false);
    expect(result.expiresAt).toBeNull();
  });

  it('detects expired tokens', () => {
    const result = assertDecoded(EXPIRED_JWT);
    expect(result.isExpired).toBe(true);
  });

  it('returns error for empty input', () => {
    const result = decodeJwtToken('');
    expect(isJwtError(result)).toBe(true);
  });

  it('returns error for malformed token (wrong part count)', () => {
    const result = decodeJwtToken('abc.def');
    expect(isJwtError(result)).toBe(true);
    // Narrow for message assertion — throw ensures we never reach it if not error
    if (!isJwtError(result)) throw new Error('Expected error result');
    expect(result.error).toMatch(/3 parts/);
  });

  it('returns error for completely invalid token', () => {
    const result = decodeJwtToken('not.a.jwt');
    expect(isJwtError(result)).toBe(true);
  });

  it('trims whitespace from input', () => {
    const result = decodeJwtToken(`  ${VALID_JWT}  `);
    expect(isJwtError(result)).toBe(false);
  });
});
