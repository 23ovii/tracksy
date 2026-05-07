import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// .github/dependabot.yml
// ---------------------------------------------------------------------------

describe('.github/dependabot.yml', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(resolve(root, '.github/dependabot.yml'), 'utf-8');
  });

  it('exists and is non-empty', () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('specifies Dependabot config schema version 2', () => {
    expect(content).toMatch(/^version:\s*2/m);
  });

  it('configures the npm package ecosystem', () => {
    expect(content).toMatch(/package-ecosystem:\s*["']?npm["']?/);
  });

  it('sets the root directory for npm updates', () => {
    expect(content).toMatch(/directory:\s*["']\/["']/);
  });

  it('uses a weekly update schedule', () => {
    expect(content).toMatch(/interval:\s*["']?weekly["']?/);
  });

  it('schedules updates on Monday', () => {
    expect(content).toMatch(/day:\s*["']?monday["']?/);
  });

  it('caps open pull-requests at 10', () => {
    expect(content).toMatch(/open-pull-requests-limit:\s*10/);
  });

  it('defines a dev-dependencies group', () => {
    expect(content).toMatch(/dev-dependencies:/);
  });

  it('maps dev-dependencies group to dependency-type "development"', () => {
    expect(content).toMatch(/dependency-type:\s*["']?development["']?/);
  });

  it('defines a production-dependencies group', () => {
    expect(content).toMatch(/production-dependencies:/);
  });

  it('maps production-dependencies group to dependency-type "production"', () => {
    expect(content).toMatch(/dependency-type:\s*["']?production["']?/);
  });

  it('contains exactly one updates entry (one ecosystem configured)', () => {
    const matches = content.match(/- package-ecosystem:/g);
    expect(matches).toHaveLength(1);
  });

  it('does not contain unexpected package ecosystems', () => {
    // Only npm should be configured
    expect(content).not.toMatch(/package-ecosystem:\s*["']?(pip|bundler|cargo|composer|docker|gomod|gradle|maven|nuget|pub|terraform)["']?/);
  });
});

// ---------------------------------------------------------------------------
// LICENSE
// ---------------------------------------------------------------------------

describe('LICENSE', () => {
  let content: string;
  let lines: string[];

  beforeAll(() => {
    content = readFileSync(resolve(root, 'LICENSE'), 'utf-8');
    lines = content.split('\n');
  });

  it('exists and is non-empty', () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('starts with "MIT License" on the first line', () => {
    expect(lines[0].trim()).toBe('MIT License');
  });

  it('identifies the license as MIT', () => {
    expect(content).toContain('MIT License');
  });

  it('contains a copyright notice', () => {
    expect(content).toMatch(/Copyright\s*\(c\)/i);
  });

  it('states the copyright year as 2026', () => {
    expect(content).toMatch(/Copyright\s*\(c\)\s*2026/i);
  });

  it('names "23ovii" as the copyright holder', () => {
    expect(content).toContain('23ovii');
  });

  it('grants permission to use, copy, modify, merge, publish, distribute, sublicense, and sell', () => {
    expect(content).toMatch(/use, copy, modify, merge, publish, distribute, sublicense, and\/or sell/i);
  });

  it('requires the copyright and permission notice to be included in copies', () => {
    expect(content).toMatch(/copyright notice and this permission notice shall be included/i);
  });

  it('includes the "AS IS" warranty disclaimer', () => {
    expect(content).toMatch(/THE SOFTWARE IS PROVIDED ["']?AS IS["']?/i);
  });

  it('disclaims liability for damages', () => {
    expect(content).toMatch(/IN NO EVENT SHALL THE\s+AUTHORS OR COPYRIGHT HOLDERS BE LIABLE/i);
  });

  it('does not reference any other license (e.g. GPL, Apache)', () => {
    expect(content).not.toMatch(/GNU General Public License|Apache License|BSD License/i);
  });

  it('ends with "SOFTWARE." clause (complete license text)', () => {
    const trimmed = content.trimEnd();
    expect(trimmed).toMatch(/IN THE SOFTWARE\.$/);
  });
});
