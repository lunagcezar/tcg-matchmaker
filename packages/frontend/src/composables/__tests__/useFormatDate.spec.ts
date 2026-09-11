process.env.TZ = 'UTC';

import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';

import { useAppStore } from '@/stores/useAppStore';

import { useFormatDate } from '../useFormatDate';

describe('useFormatDate', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('formats ISO string to short date in pt-BR', () => {
    const appStore = useAppStore();
    appStore.setLocale('pt-BR');
    const { formatDate } = useFormatDate();
    expect(formatDate('2026-07-20T10:00:00Z')).toBe('20 de jul. de 2026');
  });

  it('formats to time', () => {
    const { formatTime } = useFormatDate();
    expect(formatTime('2026-07-20T14:30:00Z')).toBe('2:30 PM');
  });

  it('formats date and time together', () => {
    const { formatDateTime } = useFormatDate();
    expect(formatDateTime('2026-07-20T14:30:00Z')).toBe('Jul 20, 2026, 2:30 PM');
  });

  it('returns fallback for invalid or empty input', () => {
    const { formatDate, formatTime, formatDateTime, formatRelative } = useFormatDate();
    expect(formatDate('')).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
    expect(formatTime(null)).toBe('-');
    expect(formatDateTime('invalid')).toBe('-');
    expect(formatRelative('')).toBe('-');
  });

  it('reacts to locale changes', () => {
    const appStore = useAppStore();
    appStore.setLocale('en-US');
    const { formatDate } = useFormatDate();
    expect(formatDate('2026-07-20T10:00:00Z')).toBe('Jul 20, 2026');
    appStore.setLocale('pt-BR');
    expect(formatDate('2026-07-20T10:00:00Z')).toBe('20 de jul. de 2026');
  });
});
