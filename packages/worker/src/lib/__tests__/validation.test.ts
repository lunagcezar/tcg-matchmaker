import { describe, expect, it } from 'vitest';

import { validate } from '../validation.js';

const successSchema = {
  safeParse: (body: unknown) => ({ success: true as const, data: body }),
};

const failureSchema = {
  safeParse: () => ({
    success: false as const,
    error: { issues: [{ message: 'Name is too short' }] },
  }),
};

describe('validate', () => {
  it('returns success data for a valid payload', () => {
    const result = validate<unknown>(successSchema, { name: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'test' });
    }
  });

  it('returns failure with joined issues for an invalid payload', () => {
    const result = validate<unknown>(failureSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Validation failed');
      expect(result.issues).toContain('Name is too short');
    }
  });
});
