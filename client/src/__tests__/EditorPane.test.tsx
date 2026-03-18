import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock WysiwygEditor
const mockGetMarkdown = vi.fn(() => '# Mock markdown');
const mockSetContent = vi.fn();

vi.mock('../components/WysiwygEditor', () => ({
  WysiwygEditor: React.forwardRef(function MockWysiwyg(
    props: { content: string; onChange: (md: string) => void; onLinkClick: (path: string) => void },
    ref: any,
  ) {
    React.useImperativeHandle(ref, () => ({
      getMarkdown: mockGetMarkdown,
      setContent: mockSetContent,
    }));
    return <div data-testid="wysiwyg-editor">{props.content}</div>;
  }),
}));

// Mock MarkdownEditor
vi.mock('../components/MarkdownEditor', () => ({
  MarkdownEditor: React.forwardRef(function MockMdEditor(
    props: { value: string; onChange: (v: string) => void; tabId: string },
    _ref: any,
  ) {
    return (
      <div data-testid="markdown-editor">
        <textarea
          data-testid="raw-textarea"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
    );
  }),
}));

// Mock useAutoSave
const mockUseAutoSave = vi.fn();
vi.mock('../hooks/useAutoSave', () => ({
  useAutoSave: (...args: any[]) => mockUseAutoSave(...args),
}));

// Mock useScrollPersist
vi.mock('../hooks/useScrollPersist', () => ({
  useScrollPersist: () => ({ current: null }),
}));

// Mock export functions
vi.mock('../lib/export', () => ({
  exportPdf: vi.fn(),
  exportHtml: vi.fn(),
  exportMarkdown: vi.fn(),
}));

import { EditorPane } from '../components/EditorPane';
import type { Tab, TabAction } from '../types/tabs';

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 'tab-1',
    path: 'notes/test.md',
    label: 'test.md',
    content: '# Hello World',
    loading: false,
    dirty: false,
    deleted: false,
    ...overrides,
  };
}

describe('EditorPane -- WYSIWYG mode', () => {
  let dispatch: React.Dispatch<TabAction>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatch = vi.fn();
  });

  describe('WYSIWYG-05: raw mode toggle', () => {
    it('renders WysiwygEditor by default (not split-pane)', () => {
      const tab = makeTab();
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);
      expect(screen.getByTestId('wysiwyg-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();
    });

    it('renders a </> toggle button in the toolbar', () => {
      const tab = makeTab();
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);
      const toggleBtn = screen.getByTitle('Switch to raw Markdown');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn.textContent).toBe('</>');
    });

    it('switches to MarkdownEditor (CodeMirror) when toggle is clicked', () => {
      const tab = makeTab();
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);
      const toggleBtn = screen.getByTitle('Switch to raw Markdown');
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('wysiwyg-editor')).not.toBeInTheDocument();
    });

    it('preserves content when toggling WYSIWYG -> raw', () => {
      const tab = makeTab({ content: '# Hello World' });
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);

      // Mock getMarkdown to return the content
      mockGetMarkdown.mockReturnValue('# Hello World');

      const toggleBtn = screen.getByTitle('Switch to raw Markdown');
      fireEvent.click(toggleBtn);

      // Raw editor should have the content
      const textarea = screen.getByTestId('raw-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('# Hello World');
    });

    it('preserves content when toggling raw -> WYSIWYG', () => {
      const tab = makeTab({ content: '# Hello World' });
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);

      mockGetMarkdown.mockReturnValue('# Hello World');

      // Switch to raw
      fireEvent.click(screen.getByTitle('Switch to raw Markdown'));

      // Switch back to WYSIWYG
      fireEvent.click(screen.getByTitle('Switch to rich editor'));

      // setContent should have been called with the content
      expect(mockSetContent).toHaveBeenCalled();
    });

    it('auto-save fires in WYSIWYG mode on content change', () => {
      const tab = makeTab({ dirty: true });
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);

      // useAutoSave should be called with enabled=true (dirty && autoSaveEnabled)
      expect(mockUseAutoSave).toHaveBeenCalled();
      const lastCall = mockUseAutoSave.mock.calls[mockUseAutoSave.mock.calls.length - 1];
      expect(lastCall[0]).toBe('notes/test.md'); // path
      expect(lastCall[3]).toBe(true); // enabled = dirty && autoSaveEnabled
    });

    it('auto-save fires in raw mode on content change', () => {
      const tab = makeTab({ dirty: true });
      render(<EditorPane tab={tab} dispatch={dispatch} onLinkClick={vi.fn()} />);

      mockGetMarkdown.mockReturnValue('# Hello World');

      // Switch to raw mode
      fireEvent.click(screen.getByTitle('Switch to raw Markdown'));

      // useAutoSave should still be called (dirty tab in raw mode)
      const lastCall = mockUseAutoSave.mock.calls[mockUseAutoSave.mock.calls.length - 1];
      expect(lastCall[0]).toBe('notes/test.md'); // path
    });
  });
});
