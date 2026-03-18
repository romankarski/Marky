import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

/**
 * Create a TipTap editor, parse markdown in, serialize it back out.
 * Uses the same extension set as WysiwygEditor.tsx for fidelity.
 */
function roundTrip(md: string): string {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ link: false }),
      Markdown.configure({ markedOptions: { gfm: true } }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: md,
    contentType: 'markdown',
  });
  const result = editor.getMarkdown();
  editor.destroy();
  return result;
}

/** Normalize whitespace: trim and collapse multiple blank lines */
function normalize(s: string): string {
  return s.trim().replace(/\n{3,}/g, '\n\n');
}

describe('Markdown round-trip fidelity', () => {
  it('preserves headings (h1, h2, h3) through parse/serialize', () => {
    const input = '# Heading 1\n\n## Heading 2\n\n### Heading 3';
    const output = normalize(roundTrip(input));
    expect(output).toContain('# Heading 1');
    expect(output).toContain('## Heading 2');
    expect(output).toContain('### Heading 3');
  });

  it('preserves bold and italic through parse/serialize', () => {
    const input = '**bold** and *italic*';
    const output = normalize(roundTrip(input));
    expect(output).toContain('**bold**');
    expect(output).toContain('*italic*');
  });

  it('preserves links through parse/serialize', () => {
    const input = '[link text](http://example.com)';
    const output = normalize(roundTrip(input));
    expect(output).toContain('[link text](http://example.com)');
  });

  it('preserves inline code through parse/serialize', () => {
    const input = 'Use `inline code` here';
    const output = normalize(roundTrip(input));
    expect(output).toContain('`inline code`');
  });

  it('preserves fenced code blocks through parse/serialize', () => {
    const input = '```js\nconst x = 1;\n```';
    const output = normalize(roundTrip(input));
    // TipTap may use ``` or ~~~ — check for the code content
    expect(output).toContain('const x = 1;');
    // Should be in a fenced code block
    expect(output).toMatch(/```/);
  });

  it('preserves GFM tables through parse/serialize', () => {
    const input = '| A | B |\n| --- | --- |\n| 1 | 2 |';
    const output = normalize(roundTrip(input));
    // Table should contain headers and data
    expect(output).toContain('A');
    expect(output).toContain('B');
    expect(output).toContain('1');
    expect(output).toContain('2');
    // Should have pipe characters (markdown table format)
    expect(output).toContain('|');
  });

  it('preserves images through parse/serialize', () => {
    const input = '![alt text](/images/photo.png)';
    const output = normalize(roundTrip(input));
    expect(output).toContain('![alt text](/images/photo.png)');
  });

  it('preserves bullet and numbered lists through parse/serialize', () => {
    const input = '- item 1\n- item 2\n\n1. first\n2. second';
    const output = normalize(roundTrip(input));
    // Bullet list items
    expect(output).toContain('item 1');
    expect(output).toContain('item 2');
    // Ordered list items
    expect(output).toContain('first');
    expect(output).toContain('second');
    // Should use markdown list syntax
    expect(output).toMatch(/[-*] item 1/);
    expect(output).toMatch(/1[.)]\s*first/);
  });

  it('preserves blockquotes through parse/serialize', () => {
    const input = '> blockquote text';
    const output = normalize(roundTrip(input));
    expect(output).toContain('> blockquote text');
  });

  it('preserves horizontal rules through parse/serialize', () => {
    const input = 'above\n\n---\n\nbelow';
    const output = normalize(roundTrip(input));
    expect(output).toContain('above');
    expect(output).toContain('below');
    // Horizontal rule: ---, ***, or ___
    expect(output).toMatch(/---|\*\*\*|___/);
  });

  it('preserves YAML frontmatter through parse/serialize', () => {
    const input = '---\ntitle: Test\ntags: [a, b]\n---\n\n# Hello';
    const output = normalize(roundTrip(input));
    // Frontmatter should survive round-trip
    // TipTap may not natively support frontmatter — check if it's preserved
    // At minimum, the heading after frontmatter must survive
    expect(output).toContain('# Hello');
    // Check if frontmatter content is preserved (may be raw or as a node)
    expect(output).toContain('title: Test');
  });
});
