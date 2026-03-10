// Wave 0: @testing-library/react must be installed in Plan 02 before this test can run.
// This import will cause a RED failure because @testing-library/react is not yet installed.
// That is intentional — RED phase. Plan 02 installs the dependency and this test will pass.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// useAutoSave does not exist yet — created in Plan 03.
// Signature: useAutoSave(path: string, content: string, onSaved: (content: string) => void, enabled: boolean, delayMs?: number): void
import { useAutoSave } from '../useAutoSave';

beforeEach(() => {
  vi.useFakeTimers();
  global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useAutoSave — debounce and PUT', () => {
  it('calls PUT /api/files/:path after the debounce delay', async () => {
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave('notes/page.md', content, onSaved, true, 800),
      { initialProps: { content: '# Hello' } }
    );

    // Change content to trigger debounce
    rerender({ content: '# Hello world' });

    // Before delay: fetch not yet called
    expect(global.fetch).not.toHaveBeenCalled();

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(800);

    expect(global.fetch).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/files/notes/page.md',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('Hello world'),
      })
    );
  });

  it('does NOT call PUT before the debounce delay expires', async () => {
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave('notes/page.md', content, onSaved, true, 800),
      { initialProps: { content: '# Hello' } }
    );

    rerender({ content: '# Hello world' });

    // Only advance halfway
    await vi.advanceTimersByTimeAsync(400);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls PUT only once when content changes twice within the debounce window', async () => {
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave('notes/page.md', content, onSaved, true, 800),
      { initialProps: { content: '# Hello' } }
    );

    rerender({ content: '# Hello world' });
    await vi.advanceTimersByTimeAsync(400); // 400ms in — not fired yet

    rerender({ content: '# Hello world!' }); // second change resets debounce
    await vi.advanceTimersByTimeAsync(800); // full delay from last change

    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it('calls onSaved() callback after PUT completes', async () => {
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave('notes/page.md', content, onSaved, true, 800),
      { initialProps: { content: '# Hello' } }
    );

    rerender({ content: '# Hello world' });
    await vi.advanceTimersByTimeAsync(800);

    // Wait for fetch promise to resolve
    await Promise.resolve();

    expect(onSaved).toHaveBeenCalledOnce();
  });

  it('does NOT call PUT on unmount before debounce fires (cleanup)', async () => {
    const onSaved = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave('notes/page.md', content, onSaved, true, 800),
      { initialProps: { content: '# Hello' } }
    );

    rerender({ content: '# Hello world' });

    // Unmount before debounce fires
    await vi.advanceTimersByTimeAsync(400);
    unmount();

    // Advance past original debounce deadline — timer should be cancelled
    await vi.advanceTimersByTimeAsync(800);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
