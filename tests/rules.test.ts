import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** The rules of the architecture that a type checker cannot see. */
const LIB = join(__dirname, '..', 'src', 'lib');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
  });
}

const sources = files(LIB).map((path) => ({ path: path.slice(LIB.length + 1), code: readFileSync(path, 'utf8') }));
const offenders = (test: (file: { path: string; code: string }) => boolean): string[] => sources.filter(test).map((file) => file.path);

describe('architecture rules', () => {
  it('reads the time only through an injected clock', () => {
    // RealClock in model/time.ts is the one place allowed to ask the device.
    expect(offenders(({ path, code }) => path !== 'model/time.ts' && /\bDate\.now\(|new Date\(\)/.test(code))).toEqual([]);
  });

  it('keeps the library free of the site framework', () => {
    expect(offenders(({ code }) => /from ['"]astro[:/'"]/.test(code))).toEqual([]);
  });

  it('keeps replicas from reading source-specific data', () => {
    expect(offenders(({ path, code }) => path.startsWith('replicas/') && /\.ext\b/.test(code))).toEqual([]);
  });

  it('keeps displays off private timers: motion comes from the shared ticker', () => {
    expect(
      offenders(({ path, code }) => (path.startsWith('replicas/') || path.startsWith('hardware/')) && /\bset(Interval|Timeout)\(|requestAnimationFrame\(/.test(code)),
    ).toEqual([]);
  });

  it('keeps sources and replicas apart', () => {
    expect(offenders(({ path, code }) => path.startsWith('sources/') && /from ['"][./]+\/replicas\//.test(code))).toEqual([]);
    expect(offenders(({ path, code }) => path.startsWith('replicas/') && /from ['"][./]+\/sources\/(?!types)/.test(code))).toEqual([]);
  });
});
