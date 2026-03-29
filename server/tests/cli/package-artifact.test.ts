// Wave 0 RED tests — packaging contract is not implemented yet.
// These tests lock the npm-pack artifact shape required for standalone CLI distribution.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function extractPackJson(output: string) {
  const match = output.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/);
  if (!match) {
    throw new Error('npm pack --json did not emit a trailing JSON array');
  }
  return JSON.parse(match[1]);
}

describe('root package contract', () => {
  it('is named marky and exposes server/dist/cli.js as the bin entry', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

    expect(pkg.name).toBe('marky');
    expect(pkg.bin).toMatchObject({
      marky: 'server/dist/cli.js',
    });
  });
});

describe('npm pack artifact contract', () => {
  it('includes the built CLI and built client assets', () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marky-pack-cache-'));
    const output = execFileSync('npm', ['pack', '--json', '--dry-run'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: cacheDir,
      },
    });

    const parsed = extractPackJson(output);
    const filePaths = parsed[0]?.files?.map((file: { path: string }) => file.path) ?? [];

    expect(filePaths).toContain('server/dist/cli.js');
    expect(filePaths).toContain('client/dist/index.html');
    expect(filePaths).toContain('package.json');

    fs.rmSync(cacheDir, { recursive: true, force: true });
  });
});
