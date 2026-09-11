// Vitest setup: Node 26 exposes experimental global `localStorage`/`sessionStorage`
// getters that emit an ExperimentalWarning and return `undefined` (no
// `--localstorage-file`), and they shadow jsdom's implementations. Install a
// simple in-memory Storage so tests and app code have a working Web Storage API.
import { beforeEach } from 'vitest';

class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length(): number {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value));
  }
}

for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: new MemoryStorage(),
  });
}

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  globalThis.sessionStorage?.clear?.();
});
