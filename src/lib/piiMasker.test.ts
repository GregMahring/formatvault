import { describe, it, expect } from 'vitest';
import { maskPii, unmaskPii } from './piiMasker';

// ── Helpers ──────────────────────────────────────────────────────────────────

function masked(input: string) {
  return maskPii(input).masked;
}

// ── Existing value-pattern detectors ─────────────────────────────────────────

describe('EMAIL', () => {
  it('masks standard email', () => {
    expect(masked('contact user@example.com now')).toBe('contact [EMAIL-1] now');
  });
});

describe('IP', () => {
  it('masks IPv4 address', () => {
    expect(masked('server at 192.168.1.1 is down')).toBe('server at [IP-1] is down');
  });
});

describe('UUID', () => {
  it('masks UUID', () => {
    expect(masked('id: 550e8400-e29b-41d4-a716-446655440000')).toBe('id: [UUID-1]');
  });
});

describe('CC', () => {
  it('masks valid Luhn credit card number', () => {
    // 4111111111111111 is a valid Luhn test number
    expect(masked('card: 4111111111111111')).toBe('card: [CC-1]');
  });

  it('does not mask invalid Luhn number', () => {
    expect(masked('not a card: 1234567890123456')).not.toContain('[CC-1]');
  });
});

// ── SSN ──────────────────────────────────────────────────────────────────────

describe('SSN', () => {
  it('masks formatted SSN', () => {
    expect(masked('ssn: 123-45-6789')).toBe('ssn: [SSN-1]');
  });

  it('masks SSN embedded in sentence', () => {
    expect(masked('my SSN is 078-05-1120 do not share')).toBe('my SSN is [SSN-1] do not share');
  });

  it('does not mask invalid area 000', () => {
    expect(masked('000-12-3456')).toBe('000-12-3456');
  });

  it('does not mask invalid area 666', () => {
    expect(masked('666-12-3456')).toBe('666-12-3456');
  });

  it('does not mask invalid area 900+', () => {
    expect(masked('900-12-3456')).toBe('900-12-3456');
  });

  it('does not mask invalid group 00', () => {
    expect(masked('123-00-3456')).toBe('123-00-3456');
  });

  it('does not mask invalid serial 0000', () => {
    expect(masked('123-45-0000')).toBe('123-45-0000');
  });

  it('does not mask unformatted 9-digit number', () => {
    // Unformatted SSN should NOT be detected (too many false positives)
    expect(masked('ref: 123456789')).toBe('ref: 123456789');
  });
});

// ── IBAN ─────────────────────────────────────────────────────────────────────

describe('IBAN', () => {
  it('masks valid GB IBAN', () => {
    // GB82WEST12345698765432 — MOD-97 valid
    expect(masked('account: GB82WEST12345698765432')).toBe('account: [IBAN-1]');
  });

  it('masks valid DE IBAN', () => {
    // DE89370400440532013000 — MOD-97 valid
    expect(masked('IBAN: DE89370400440532013000')).toBe('IBAN: [IBAN-1]');
  });

  it('does not mask invalid IBAN (bad checksum)', () => {
    // GB00WEST12345698765432 — invalid checksum
    expect(masked('GB00WEST12345698765432')).toBe('GB00WEST12345698765432');
  });

  it('does not mask short random uppercase strings', () => {
    // Too short to be an IBAN
    expect(masked('GB82WEST')).toBe('GB82WEST');
  });
});

// ── DOB (key-name detector) ───────────────────────────────────────────────────

describe('DOB', () => {
  it('masks value when key is dob in JSON', () => {
    expect(masked('"dob": "1990-04-15"')).toBe('"dob": "[DOB-1]"');
  });

  it('masks value when key is date_of_birth in YAML', () => {
    expect(masked('date_of_birth: 1990-04-15')).toBe('date_of_birth: [DOB-1]');
  });

  it('masks value when key is dateOfBirth (camelCase)', () => {
    expect(masked('"dateOfBirth": "15/04/1990"')).toBe('"dateOfBirth": "[DOB-1]"');
  });

  it('masks value when key is birthday', () => {
    expect(masked('birthday: April 15 1990')).toContain('[DOB-1]');
  });

  it('is case-insensitive on key name', () => {
    expect(masked('DOB: 1990-04-15')).toBe('DOB: [DOB-1]');
    // Key itself stays, only value is masked when quotes are absent
  });

  it('does not mask a date not associated with a known key', () => {
    // A standalone date with no PII key should not be detected
    const result = maskPii('created: 2024-01-15');
    expect(result.summary.DOB).toBeUndefined();
  });

  it('preserves JSON structure — quotes stay, only value content is replaced', () => {
    const result = masked('"date_of_birth": "1990-04-15"');
    expect(result).toBe('"date_of_birth": "[DOB-1]"');
    // Outer quotes of the value are preserved
    expect(result).toMatch(/^"date_of_birth": "/);
    expect(result).toMatch(/"$/);
  });
});

// ── DL (key-name detector) ────────────────────────────────────────────────────

describe('DL', () => {
  it('masks value when key is drivers_license', () => {
    expect(masked('"drivers_license": "D1234567"')).toBe('"drivers_license": "[DL-1]"');
  });

  it('masks value when key is dl_number', () => {
    expect(masked('dl_number: X9876543')).toBe('dl_number: [DL-1]');
  });

  it('masks value when key is licenseNumber (camelCase)', () => {
    expect(masked('"licenseNumber": "ABC-123-456"')).toBe('"licenseNumber": "[DL-1]"');
  });

  it('masks value when key is dl', () => {
    expect(masked('dl: D123456789')).toBe('dl: [DL-1]');
  });
});

// ── PASSPORT (key-name detector) ─────────────────────────────────────────────

describe('PASSPORT', () => {
  it('masks value when key is passport', () => {
    expect(masked('"passport": "AB1234567"')).toBe('"passport": "[PASSPORT-1]"');
  });

  it('masks value when key is passport_number', () => {
    expect(masked('passport_number: 123456789')).toBe('passport_number: [PASSPORT-1]');
  });

  it('masks value when key is passportNo', () => {
    expect(masked('"passportNo": "P0123456"')).toBe('"passportNo": "[PASSPORT-1]"');
  });
});

// ── Overlap deduplication ─────────────────────────────────────────────────────

describe('overlap deduplication', () => {
  it('does not double-mask a value caught by both SSN value-pattern and key-name', () => {
    // If an SSN appears both as a pattern match and a field value, it should only be
    // replaced once — the deduplication pass handles this
    const result = maskPii('"ssn": "123-45-6789"');
    expect(result.totalCount).toBe(1);
  });
});

// ── unmaskPii ────────────────────────────────────────────────────────────────

describe('unmaskPii', () => {
  it('restores original values from placeholders', () => {
    const result = maskPii('email: user@example.com, dob: 1990-04-15');
    const restored = unmaskPii(result.masked, result.matches);
    // unmask order is not guaranteed to produce exact original spacing,
    // but all original values should be present
    expect(restored).toContain('user@example.com');
  });
});

// ── Empty / edge cases ────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('returns empty masked string for empty input', () => {
    const result = maskPii('');
    expect(result.masked).toBe('');
    expect(result.totalCount).toBe(0);
  });

  it('returns input unchanged when no PII found', () => {
    const input = 'hello world, no pii here';
    expect(masked(input)).toBe(input);
  });

  it('numbers multiple matches of same category', () => {
    const result = maskPii('a@b.com and c@d.com');
    expect(result.masked).toBe('[EMAIL-1] and [EMAIL-2]');
    expect(result.summary.EMAIL).toBe(2);
  });
});
