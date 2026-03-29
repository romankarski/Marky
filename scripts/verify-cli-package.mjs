import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-pack-cache-'));

function extractPackJson(output) {
  const match = output.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/);
  if (!match) {
    throw new Error('npm pack --json did not emit a trailing JSON array');
  }
  return JSON.parse(match[1]);
}

function waitForUrl(child, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Timed out waiting for CLI URL output'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const match = text.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`CLI exited before printing URL (code ${code ?? 'unknown'}): ${stderr.trim()}`));
    });
  });
}

const packOutput = execFileSync('npm', ['pack', '--json'], {
  cwd: repoRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    npm_config_cache: cacheDir,
  },
});
const packInfo = extractPackJson(packOutput)[0];
const tarballPath = path.join(repoRoot, packInfo.filename);

const extractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-pack-'));
const notesDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-notes-'));
await fs.writeFile(path.join(notesDir, 'note.md'), '# Packed CLI\n');

execFileSync('tar', ['-xzf', tarballPath, '-C', extractDir]);

execFileSync('npm', ['install', '--omit=dev'], {
  cwd: path.join(extractDir, 'package'),
  stdio: 'inherit',
  env: {
    ...process.env,
    npm_config_cache: cacheDir,
  },
});

const cliPath = path.join(extractDir, 'package', 'server', 'dist', 'cli.js');
const child = spawn('node', [cliPath, '--no-open', notesDir], {
  cwd: notesDir,
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  const url = await waitForUrl(child);
  const response = await fetch(`${url}/api/files`);
  if (!response.ok) {
    throw new Error(`Expected /api/files to return 200, got ${response.status}`);
  }
  const body = await response.json();
  const items = Array.isArray(body.items) ? body.items : [];
  const noteFound = items.some((item) => item?.name === 'note.md');
  if (!noteFound) {
    throw new Error('Packed CLI did not expose note.md via /api/files');
  }
  console.log(`Packed CLI smoke passed: ${url}`);
} finally {
  child.kill('SIGTERM');
  await fs.rm(extractDir, { recursive: true, force: true });
  await fs.rm(notesDir, { recursive: true, force: true });
  await fs.rm(tarballPath, { force: true });
  await fs.rm(cacheDir, { recursive: true, force: true });
}
