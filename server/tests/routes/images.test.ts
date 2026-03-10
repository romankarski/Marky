// Wave 0 RED tests — /api/image route does not exist yet.
// All tests will fail with 404 (route not registered) until Wave 1 creates
// server/src/routes/images.ts and registers it in app.ts.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

// Minimal 1x1 pixel PNG in binary (valid PNG file for realistic testing)
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000' +
  '0090wc3d000000000c4944415478016360f8cfc000000002000' +
  '1e221bc330000000049454e44ae426082',
  'hex'
);

// Simple 1x1 white PNG via raw bytes that any image reader accepts
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length + type
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth=8, color type=2(RGB), compression, filter, interlace + CRC
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, // IDAT data (zlib compressed 1px)
  0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, // IDAT end + CRC
  0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND
  0x44, 0xae, 0x42, 0x60, 0x82, // IEND CRC
]);

// Minimal SVG content
const MINIMAL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-images-test-'));
  app = await buildApp({ rootDir: tmpDir });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/image — valid images', () => {
  it('returns 200 with Content-Type image/png for a valid PNG inside rootDir', async () => {
    const imgPath = path.join(tmpDir, 'screenshot.png');
    await fs.writeFile(imgPath, MINIMAL_PNG);

    const encodedPath = encodeURIComponent(imgPath);
    const res = await app.inject({
      method: 'GET',
      url: `/api/image?path=${encodedPath}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
  });

  it('returns 200 with Content-Type image/svg+xml for a valid SVG inside rootDir', async () => {
    const svgPath = path.join(tmpDir, 'diagram.svg');
    await fs.writeFile(svgPath, MINIMAL_SVG, 'utf-8');

    const encodedPath = encodeURIComponent(svgPath);
    const res = await app.inject({
      method: 'GET',
      url: `/api/image?path=${encodedPath}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('image/svg');
  });
});

describe('GET /api/image — path security', () => {
  it('returns 403 for path traversal attempt (../../../etc/passwd)', async () => {
    const traversalPath = path.join(tmpDir, '..', '..', '..', 'etc', 'passwd');
    const encodedPath = encodeURIComponent(traversalPath);

    const res = await app.inject({
      method: 'GET',
      url: `/api/image?path=${encodedPath}`,
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 403 for an absolute path outside rootDir', async () => {
    // /tmp is valid but is the parent — not inside tmpDir itself
    const outsidePath = encodeURIComponent('/tmp/some-other-file.png');

    const res = await app.inject({
      method: 'GET',
      url: `/api/image?path=${outsidePath}`,
    });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/image — error cases', () => {
  it('returns 404 for a non-existent file path inside rootDir', async () => {
    const missingPath = path.join(tmpDir, 'nonexistent.png');
    const encodedPath = encodeURIComponent(missingPath);

    const res = await app.inject({
      method: 'GET',
      url: `/api/image?path=${encodedPath}`,
    });

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 or 422 when path query param is absent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/image',
    });

    expect([400, 403, 422]).toContain(res.statusCode);
  });

  it('returns 400 or 422 when path query param is empty string', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/image?path=',
    });

    expect([400, 403, 422]).toContain(res.statusCode);
  });
});
