// Wave 0 RED tests — client/src/components/BacklinksPanel.tsx does not exist yet.
// All tests will fail with import errors until Wave 1 creates BacklinksPanel.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BacklinksPanel } from '../components/BacklinksPanel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('BacklinksPanel', () => {
  it('renders "Backlinks (3)" header when 3 backlinks returned from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            backlinks: ['notes/other.md', 'notes/another.md', 'notes/third.md'],
          }),
      }),
    );
    render(<BacklinksPanel activeFilePath="notes/active.md" onOpen={vi.fn()} />);
    expect(await screen.findByText('Backlinks (3)')).toBeTruthy();
  });

  it('renders "Backlinks (0)" header when 0 backlinks returned — NOT hidden', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ backlinks: [] }),
      }),
    );
    render(<BacklinksPanel activeFilePath="notes/active.md" onOpen={vi.fn()} />);
    expect(await screen.findByText('Backlinks (0)')).toBeTruthy();
  });

  it('renders "No incoming links" empty-state message when 0 backlinks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ backlinks: [] }),
      }),
    );
    render(<BacklinksPanel activeFilePath="notes/active.md" onOpen={vi.fn()} />);
    expect(await screen.findByText('No incoming links')).toBeTruthy();
  });

  it('renders each backlink as a clickable button showing filename without extension', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            backlinks: ['notes/other.md', 'notes/another.md'],
          }),
      }),
    );
    render(<BacklinksPanel activeFilePath="notes/active.md" onOpen={vi.fn()} />);
    expect(await screen.findByText('other')).toBeTruthy();
    expect(screen.getByText('another')).toBeTruthy();
  });

  it('clicking a backlink button calls onOpen with the full path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            backlinks: ['notes/other.md'],
          }),
      }),
    );
    const onOpen = vi.fn();
    render(<BacklinksPanel activeFilePath="notes/active.md" onOpen={onOpen} />);
    fireEvent.click(await screen.findByText('other'));
    expect(onOpen).toHaveBeenCalledWith('notes/other.md');
  });

  it('returns null when activeFilePath is null', () => {
    const { container } = render(
      <BacklinksPanel activeFilePath={null} onOpen={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
