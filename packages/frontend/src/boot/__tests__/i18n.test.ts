import { describe, expect, it, beforeEach, vi } from 'vitest';
import { detectLocale } from '@/lib/i18n';

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    clear: () => store.clear(),
  };
}

describe('detectLocale', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('returns the stored locale when it is en-US', () => {
    localStorage.setItem('locale', 'en-US');
    expect(detectLocale()).toBe('en-US');
  });

  it('returns the stored locale when it is pt-BR', () => {
    localStorage.setItem('locale', 'pt-BR');
    expect(detectLocale()).toBe('pt-BR');
  });

  it('defaults to pt-BR when no stored locale and navigator is Portuguese', () => {
    vi.stubGlobal('navigator', { language: 'pt-BR' });
    expect(detectLocale()).toBe('pt-BR');
    vi.unstubAllGlobals();
  });

  it('defaults to en-US when no stored locale and navigator is not Portuguese', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectLocale()).toBe('en-US');
    vi.unstubAllGlobals();
  });
});
