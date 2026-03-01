/**
 * JWT decode-only utilities (ADR: no verification — display only).
 * Uses `jose` for base64url decoding; never sends token to a server.
 */
import { decodeJwt, decodeProtectedHeader } from 'jose';

export interface JwtHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface JwtDecodeResult {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
  /** ISO string or null if no exp claim */
  expiresAt: string | null;
  /** ISO string or null if no iat claim */
  issuedAt: string | null;
  /** ISO string or null if no nbf claim */
  notBefore: string | null;
  isExpired: boolean;
}

export interface JwtDecodeError {
  error: string;
}

export type JwtResult = JwtDecodeResult | JwtDecodeError;

export function isJwtError(r: JwtResult): r is JwtDecodeError {
  return 'error' in r;
}

/** Decode a raw JWT string into its parts. Never verifies the signature. */
export function decodeJwtToken(raw: string): JwtResult {
  const token = raw.trim();
  if (!token) return { error: 'Enter a JWT token to decode.' };

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      error: `Invalid JWT: expected 3 parts separated by '.', got ${String(parts.length)}.`,
    };
  }

  try {
    const header = decodeProtectedHeader(token) as JwtHeader;
    const payload = decodeJwt(token) as JwtPayload;
    const signature = parts[2] ?? '';

    const now = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === 'number' ? payload.exp : null;
    const iat = typeof payload.iat === 'number' ? payload.iat : null;
    const nbf = typeof payload.nbf === 'number' ? payload.nbf : null;

    return {
      header,
      payload,
      signature,
      expiresAt: exp !== null ? new Date(exp * 1000).toISOString() : null,
      issuedAt: iat !== null ? new Date(iat * 1000).toISOString() : null,
      notBefore: nbf !== null ? new Date(nbf * 1000).toISOString() : null,
      isExpired: exp !== null && exp < now,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to decode JWT.' };
  }
}

/**
 * Heuristic: quick check whether a string looks like a JWT.
 * Used by format auto-detection on the landing page.
 * JWTs are base64url-encoded JSON, so the header always starts with `eyJ` ({"...).
 */
export function looksLikeJwt(input: string): boolean {
  const trimmed = input.trim();
  const parts = trimmed.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0) && trimmed.startsWith('eyJ');
}

/** Format a unix timestamp (seconds) as a human-readable local string. */
export function formatUnixTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}
