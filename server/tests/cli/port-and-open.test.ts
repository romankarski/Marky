// Wave 0 RED tests — server/src/cli.ts does not exist yet.
// These tests lock explicit-port failure, default probing, and browser-open gating.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import open from 'open';
import { maybeOpenBrowser, resolvePort } from '../../src/cli.js';

vi.mock('open', () => ({
  default: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolvePort', () => {
  it('rejects explicit busy ports with a clear error', async () => {
    await expect(
      resolvePort({
        requestedPort: 4310,
        defaultPort: 4310,
        isPortAvailable: async (port) => port !== 4310,
      })
    ).rejects.toThrow('Port 4310 is already in use');
  });

  it('chooses the first free port in 4310..4320 for implicit selection', async () => {
    await expect(
      resolvePort({
        requestedPort: null,
        defaultPort: 4310,
        isPortAvailable: async (port) => port !== 4310,
      })
    ).resolves.toBe(4311);
  });
});

describe('maybeOpenBrowser', () => {
  it('does not call the open helper when --no-open is active', async () => {
    await maybeOpenBrowser({
      url: 'http://127.0.0.1:4310',
      openBrowser: false,
    });

    expect(open).not.toHaveBeenCalled();
  });

  it('calls the open helper once when browser opening is enabled', async () => {
    await maybeOpenBrowser({
      url: 'http://127.0.0.1:4310',
      openBrowser: true,
    });

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('http://127.0.0.1:4310');
  });
});
