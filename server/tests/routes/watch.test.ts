import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-watch-test-'));
  app = await buildApp({ rootDir: tmpDir });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/watch (SSE)', () => {
  it('LIVE-02 — watcher detects file change in subdirectory', async () => {
    // Create nested directory structure
    const subDir = path.join(tmpDir, 'subdir');
    await fs.mkdir(subDir, { recursive: true });
    const filePath = path.join(subDir, 'file.md');
    await fs.writeFile(filePath, '# initial');

    // Connect to SSE endpoint — will return 404 until Plan 02 implements the route
    const response = await app.inject({
      method: 'GET',
      url: '/api/watch',
      payloadAsStream: true,
    });

    expect(response.statusCode).toBe(200);

    // Collect SSE data events
    const events: string[] = [];
    response.body.on('data', (chunk: Buffer) => {
      events.push(chunk.toString());
    });

    // Trigger a file change after connecting
    await new Promise(r => setTimeout(r, 50));
    await fs.writeFile(filePath, '# updated');
    await new Promise(r => setTimeout(r, 200));

    // Expect an SSE event with the relative path
    const allData = events.join('');
    expect(allData).toContain('"path":"subdir/file.md"');
    expect(allData).toContain('event: change');
  });

  it('LIVE-02 — watcher detects new file creation (add event)', async () => {
    // Connect to SSE endpoint — will return 404 until Plan 02 implements the route
    const response = await app.inject({
      method: 'GET',
      url: '/api/watch',
      payloadAsStream: true,
    });

    expect(response.statusCode).toBe(200);

    // Collect SSE data events
    const events: string[] = [];
    response.body.on('data', (chunk: Buffer) => {
      events.push(chunk.toString());
    });

    // Create a new file after connecting
    await new Promise(r => setTimeout(r, 50));
    await fs.writeFile(path.join(tmpDir, 'newfile.md'), '# new file');
    await new Promise(r => setTimeout(r, 200));

    // Expect an SSE add event
    const allData = events.join('');
    expect(allData).toContain('"path":"newfile.md"');
    expect(allData).toContain('event: add');
  });

  it('LIVE-01 — app PUT write does NOT trigger SSE event (write-lock)', async () => {
    // Create a file to update
    await fs.writeFile(path.join(tmpDir, 'note.md'), '# original');

    // Connect to SSE endpoint — will return 404 until Plan 02 implements the route
    const sseResponse = await app.inject({
      method: 'GET',
      url: '/api/watch',
      payloadAsStream: true,
    });

    expect(sseResponse.statusCode).toBe(200);

    // Collect SSE data events
    const events: string[] = [];
    sseResponse.body.on('data', (chunk: Buffer) => {
      events.push(chunk.toString());
    });

    await new Promise(r => setTimeout(r, 50));

    // Do a PUT write via the app's own API — this should NOT trigger an SSE event
    await app.inject({
      method: 'PUT',
      url: '/api/files/note.md',
      payload: { content: '# updated via PUT' },
    });

    // Wait a bit to ensure no event arrives for the internal write
    await new Promise(r => setTimeout(r, 200));

    // The SSE stream must NOT contain an event for note.md
    const allData = events.join('');
    expect(allData).not.toContain('"path":"note.md"');
  });
});
