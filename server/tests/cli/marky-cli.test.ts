// Wave 0 RED tests — server/src/cli.ts does not exist yet.
// These tests lock the CLI contract before implementation begins.
import { describe, it, expect } from 'vitest';
import { isDirectCliInvocation, parseCliArgs, resolveRootDir } from '../../src/cli.js';

describe('parseCliArgs', () => {
  it('returns defaults for empty argv', () => {
    expect(parseCliArgs([])).toEqual({
      rootArg: null,
      port: null,
      openBrowser: true,
    });
  });

  it('treats a single positional path as the root arg', () => {
    expect(parseCliArgs(['.'])).toEqual({
      rootArg: '.',
      port: null,
      openBrowser: true,
    });
  });

  it('parses path, --port, and --no-open together', () => {
    expect(parseCliArgs(['/notes', '--port', '4310', '--no-open'])).toEqual({
      rootArg: '/notes',
      port: 4310,
      openBrowser: false,
    });
  });
});

describe('resolveRootDir', () => {
  it('uses ROOT_DIR over positional path and cwd', () => {
    expect(
      resolveRootDir({
        envRootDir: '/env-root',
        rootArg: '/arg-root',
        cwd: '/cwd-root',
      })
    ).toBe('/env-root');
  });

  it('uses positional path when ROOT_DIR is empty', () => {
    expect(
      resolveRootDir({
        envRootDir: '',
        rootArg: '/arg-root',
        cwd: '/cwd-root',
      })
    ).toBe('/arg-root');
  });

  it('falls back to process.cwd() when no env var or arg is provided', () => {
    expect(
      resolveRootDir({
        envRootDir: '',
        rootArg: null,
        cwd: '/cwd-root',
      })
    ).toBe('/cwd-root');
  });
});

describe('isDirectCliInvocation', () => {
  it('treats symlinked temp paths as the same file after canonicalization', () => {
    expect(
      isDirectCliInvocation({
        moduleUrl: 'file:///private/var/folders/test/marky/server/dist/cli.js',
        argv1: '/var/folders/test/marky/server/dist/cli.js',
        realpath: () => '/private/var/folders/test/marky/server/dist/cli.js',
      })
    ).toBe(true);
  });

  it('returns false for different entry files', () => {
    expect(
      isDirectCliInvocation({
        moduleUrl: 'file:///Users/romankarski/project/server/dist/cli.js',
        argv1: '/Users/romankarski/project/server/dist/index.js',
        realpath: (filePath) => filePath,
      })
    ).toBe(false);
  });
});
