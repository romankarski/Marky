import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FileInfo } from '../components/FileInfo';

afterEach(() => { cleanup(); });

describe('FileInfo component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('renders Tags heading when file is open', () => {
    render(<FileInfo activeFilePath="notes/a.md" currentFileTags={['work']} onTagsUpdated={vi.fn()} />);
    expect(screen.getByText('Tags')).toBeTruthy();
  });

  it('renders existing tags as pills', () => {
    render(<FileInfo activeFilePath="notes/a.md" currentFileTags={['work', 'project']} onTagsUpdated={vi.fn()} />);
    expect(screen.getByText('work')).toBeTruthy();
    expect(screen.getByText('project')).toBeTruthy();
  });

  it('clicking × removes the tag and calls onTagsUpdated', async () => {
    const onTagsUpdated = vi.fn();
    render(<FileInfo activeFilePath="notes/a.md" currentFileTags={['work']} onTagsUpdated={onTagsUpdated} />);
    fireEvent.click(screen.getByTitle('Remove work'));
    await vi.waitFor(() => expect(onTagsUpdated).toHaveBeenCalled());
  });

  it('returns null when no file is open', () => {
    const { container } = render(<FileInfo activeFilePath={null} currentFileTags={[]} onTagsUpdated={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
