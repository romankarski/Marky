// Wave 0 RED tests — FolderPickerModal template step does not exist yet.
// All tests will fail with "Unable to find element" errors until Wave 1 adds
// the template selection step to FolderPickerModal.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FolderPickerModal } from '../components/FolderPickerModal';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: async () => ({ items: [] }),
    ok: true,
  } as Response);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FolderPickerModal — template selection step (Wave 0 RED)', () => {
  const noop = () => {};

  it('renders a modal title (e.g. "New File" or "Choose template")', () => {
    render(<FolderPickerModal onConfirm={noop} onCancel={noop} />);
    // Template step should show a title referencing template selection
    expect(screen.getByText(/choose template|new file/i)).toBeInTheDocument();
  });

  it('step 1 contains a "Blank" option', () => {
    render(<FolderPickerModal onConfirm={noop} onCancel={noop} />);
    expect(screen.getByText(/blank/i)).toBeInTheDocument();
  });

  it('step 1 lists all 3 built-in template labels', () => {
    render(<FolderPickerModal onConfirm={noop} onCancel={noop} />);
    expect(screen.getByText(/daily note/i)).toBeInTheDocument();
    expect(screen.getByText(/meeting note/i)).toBeInTheDocument();
    expect(screen.getByText(/decision record/i)).toBeInTheDocument();
  });

  it('clicking "Blank" advances to step 2 (filename input is visible)', () => {
    render(<FolderPickerModal onConfirm={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText(/blank/i));
    // Step 2 = location step with filename input
    expect(screen.getByPlaceholderText(/my-note/i)).toBeInTheDocument();
  });

  it('clicking a built-in template advances to step 2 with filename input visible', () => {
    render(<FolderPickerModal onConfirm={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText(/meeting note/i));
    expect(screen.getByPlaceholderText(/my-note/i)).toBeInTheDocument();
  });
});
