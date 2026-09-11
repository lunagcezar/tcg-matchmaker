import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, it, expect } from 'vitest';

const SRC = join(process.cwd(), 'src');

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === '__tests__') continue;
      out.push(...collectSourceFiles(full));
    } else if (
      (full.endsWith('.ts') || full.endsWith('.vue')) &&
      !full.endsWith('.test.ts') &&
      !full.endsWith('.spec.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

describe('Supabase client singleton', () => {
  it('creates the supabase client in exactly one source file', () => {
    const hits = collectSourceFiles(SRC).filter((file) =>
      readFileSync(file, 'utf8').includes('createClient('),
    );
    expect(hits).toEqual([join(SRC, 'lib', `${sep}supabase.ts`)]);
  });
});
