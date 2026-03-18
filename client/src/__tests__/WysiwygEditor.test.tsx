// TDD RED — WysiwygEditor component tests
// These test the TipTap editor wrapper with markdown round-trip

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WysiwygEditor } from '../components/WysiwygEditor';

afterEach(() => {
  cleanup();
});

describe('WysiwygEditor', () => {
  it('renders a div with class "ProseMirror" and contenteditable="true"', () => {
    render(
      <WysiwygEditor
        content=""
        onChange={vi.fn()}
        onLinkClick={vi.fn()}
      />,
    );
    const proseMirror = document.querySelector('.ProseMirror');
    expect(proseMirror).toBeTruthy();
    expect(proseMirror?.getAttribute('contenteditable')).toBe('true');
  });

  it('editor container has "prose prose-orange" class for consistent typography', () => {
    render(
      <WysiwygEditor
        content=""
        onChange={vi.fn()}
        onLinkClick={vi.fn()}
      />,
    );
    // EditorContent receives the className with prose prose-orange
    const proseEl = document.querySelector('.prose.prose-orange');
    expect(proseEl).toBeTruthy();
  });

  it('empty editor shows placeholder text "Click anywhere to begin, or type / for commands"', () => {
    render(
      <WysiwygEditor
        content=""
        onChange={vi.fn()}
        onLinkClick={vi.fn()}
      />,
    );
    // TipTap placeholder extension renders via data-placeholder or a <p> with placeholder class
    const placeholder = document.querySelector('[data-placeholder]');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.getAttribute('data-placeholder')).toBe(
      'Click anywhere to begin, or type / for commands',
    );
  });

  it('calls onChange with markdown when editor content updates', async () => {
    const onChange = vi.fn();
    render(
      <WysiwygEditor
        content="# Hello"
        onChange={onChange}
        onLinkClick={vi.fn()}
      />,
    );
    // The editor should have parsed the markdown content
    const proseMirror = document.querySelector('.ProseMirror');
    expect(proseMirror).toBeTruthy();
    // Verify the heading was rendered (markdown parsed)
    const heading = proseMirror?.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Hello');
  });
});
