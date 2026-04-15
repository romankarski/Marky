import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-upload-test-'));
  app = await buildApp({ rootDir: tmpDir, enableWatcher: false });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function buildMultipartPayload(
  filename: string,
  content: Buffer,
  contentType = 'image/png',
) {
  const boundary = '----FormBoundary' + Date.now();
  const parts = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    '',
    '',
  ];
  const header = Buffer.from(parts.join('\r\n'));
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    body: Buffer.concat([header, content, footer]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

describe('POST /api/upload-image', () => {
  it('saves uploaded file to rootDir/images/ directory', async () => {
    const fileContent = Buffer.from('fake-png-data');
    const { body, contentType } = buildMultipartPayload(
      'test.png',
      fileContent,
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload-image',
      payload: body,
      headers: { 'content-type': contentType },
    });
    expect(res.statusCode).toBe(200);
    const files = await fs.readdir(path.join(tmpDir, 'images'));
    expect(files.length).toBe(1);
    const savedContent = await fs.readFile(
      path.join(tmpDir, 'images', files[0]),
    );
    expect(savedContent.toString()).toBe('fake-png-data');
  });

  it('returns JSON with image proxy path for the uploaded file', async () => {
    const { body, contentType } = buildMultipartPayload(
      'photo.png',
      Buffer.from('data'),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload-image',
      payload: body,
      headers: { 'content-type': contentType },
    });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.path).toMatch(/^\/api\/image\?path=images\/\d+-photo\.png$/);
  });

  it('creates images/ directory if it does not exist', async () => {
    // Ensure images dir does not exist
    await fs
      .rm(path.join(tmpDir, 'images'), { recursive: true, force: true })
      .catch(() => {});
    const { body, contentType } = buildMultipartPayload(
      'new.png',
      Buffer.from('data'),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload-image',
      payload: body,
      headers: { 'content-type': contentType },
    });
    expect(res.statusCode).toBe(200);
    const stat = await fs.stat(path.join(tmpDir, 'images'));
    expect(stat.isDirectory()).toBe(true);
  });

  it('returns 400 if no file is provided', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload-image',
      headers: { 'content-type': 'multipart/form-data; boundary=----empty' },
      payload: Buffer.from('------empty--\r\n'),
    });
    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.body);
    expect(json.error).toBe('No file provided');
  });

  it('prepends timestamp to filename to avoid collisions', async () => {
    const before = Date.now();
    const { body, contentType } = buildMultipartPayload(
      'pic.jpg',
      Buffer.from('data'),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload-image',
      payload: body,
      headers: { 'content-type': contentType },
    });
    const after = Date.now();
    const json = JSON.parse(res.body);
    // Extract timestamp from /api/image?path=images/{timestamp}-pic.jpg
    const match = json.path.match(/images\/(\d+)-pic\.jpg$/);
    expect(match).not.toBeNull();
    const ts = Number(match![1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
