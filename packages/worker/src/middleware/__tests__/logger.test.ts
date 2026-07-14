import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger } from '../logger.js';

describe('createLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs info messages to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger({ level: 'info' });
    logger.info('test message', { userId: 'abc' });
    const call = consoleSpy.mock.calls[0];
    expect(call[0]).toContain('[info]');
    expect(call[1]).toBe('test message');
    expect((call[2] as Record<string, unknown>).userId).toBe('abc');
  });

  it('sanitizes personal fields in Sentry transport', () => {
    const sentrySpy = { captureException: vi.fn(), captureMessage: vi.fn() };
    const logger = createLogger({ level: 'info', sentry: sentrySpy });
    logger.warn('user action', { email: 'user@test.com', username: 'jdoe', display_name: 'John' });
    const context = sentrySpy.captureMessage.mock.calls[0][1] as { extra: Record<string, string> };
    expect(context.extra.email).toBe('[SANITIZED]');
    expect(context.extra.username).toBe('[SANITIZED]');
    expect(context.extra.display_name).toBe('[SANITIZED]');
  });

  it('suppresses debug messages when not in development', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger({ level: 'info' });
    logger.debug('should not appear');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('allows debug messages in development mode', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger({ level: 'debug' });
    logger.debug('debug detail', { trace: 'abc' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('strips tokens and passwords from extra data', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger({ level: 'info' });
    logger.error('auth error', { token: 'secret123', password: 'hunter2', userId: 'abc' });
    const call = consoleSpy.mock.calls[0];
    const extra = call[2] as Record<string, unknown>;
    expect(extra.token).toBeUndefined();
    expect(extra.password).toBeUndefined();
    expect(extra.userId).toBe('abc');
  });
});
