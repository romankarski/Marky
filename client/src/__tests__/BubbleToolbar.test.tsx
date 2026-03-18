// TDD GREEN — BubbleToolbar component tests
// Tests the floating toolbar buttons, active states, and editor commands

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BubbleToolbar } from '../components/BubbleToolbar';

afterEach(() => {
  cleanup();
});

// Create a mock editor that satisfies BubbleToolbar's usage
function createMockEditor(activeMark?: string) {
  const chainMethods = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleCode: vi.fn().mockReturnThis(),
    extendMarkRange: vi.fn().mockReturnThis(),
    setLink: vi.fn().mockReturnThis(),
    unsetLink: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  return {
    chain: vi.fn(() => chainMethods),
    isActive: vi.fn((mark: string) => mark === activeMark),
    // Required by BubbleMenu but we mock at component level
    view: { dom: document.createElement('div') },
    _chainMethods: chainMethods,
  };
}

// We need to mock BubbleMenu since it requires a real ProseMirror editor view
vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bubble-menu">{children}</div>
  ),
}));

describe('BubbleToolbar', () => {
  it('renders 4 buttons with titles "Bold (Cmd+B)", "Italic (Cmd+I)", "Insert link (Cmd+K)", "Inline code (Cmd+E)"', () => {
    const editor = createMockEditor();
    render(<BubbleToolbar editor={editor as any} />);

    expect(screen.getByTitle('Bold (Cmd+B)')).toBeTruthy();
    expect(screen.getByTitle('Italic (Cmd+I)')).toBeTruthy();
    expect(screen.getByTitle('Insert link (Cmd+K)')).toBeTruthy();
    expect(screen.getByTitle('Inline code (Cmd+E)')).toBeTruthy();
  });

  it('Bold button has orange-600 text class when editor.isActive("bold") returns true', () => {
    const editor = createMockEditor('bold');
    render(<BubbleToolbar editor={editor as any} />);

    const boldBtn = screen.getByTitle('Bold (Cmd+B)');
    expect(boldBtn.className).toContain('text-orange-600');

    // Other buttons should NOT have orange-600
    const italicBtn = screen.getByTitle('Italic (Cmd+I)');
    expect(italicBtn.className).toContain('text-gray-600');
  });

  it('clicking Bold button calls editor.chain().focus().toggleBold().run()', () => {
    const editor = createMockEditor();
    render(<BubbleToolbar editor={editor as any} />);

    fireEvent.click(screen.getByTitle('Bold (Cmd+B)'));

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMethods.focus).toHaveBeenCalled();
    expect(editor._chainMethods.toggleBold).toHaveBeenCalled();
    expect(editor._chainMethods.run).toHaveBeenCalled();
  });

  it('clicking Italic button calls editor.chain().focus().toggleItalic().run()', () => {
    const editor = createMockEditor();
    render(<BubbleToolbar editor={editor as any} />);

    fireEvent.click(screen.getByTitle('Italic (Cmd+I)'));

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMethods.focus).toHaveBeenCalled();
    expect(editor._chainMethods.toggleItalic).toHaveBeenCalled();
    expect(editor._chainMethods.run).toHaveBeenCalled();
  });
});
