// Wave 0 RED tests — MarkdownPreview currently has no `filePath` prop.
// The img proxy URL tests below will fail (RED) until Wave 1 implements the
// filePath prop and /api/image proxy URL resolution in the component.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from '../components/MarkdownPreview';

const noop = () => {};

describe('MarkdownPreview — data-source-line (rehypeSourceLines)', () => {
  it('stamps data-source-line on rendered headings', () => {
    const { container } = render(
      <MarkdownPreview
        content={'# Title\n\n## Section\n\nSome paragraph\n'}
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    const h1 = container.querySelector('h1');
    const h2 = container.querySelector('h2');
    expect(h1).not.toBeNull();
    expect(h1!.getAttribute('data-source-line')).toBe('1');
    expect(h2).not.toBeNull();
    expect(h2!.getAttribute('data-source-line')).toBe('3');
  });

  it('stamps data-source-line on rendered paragraphs', () => {
    const { container } = render(
      <MarkdownPreview
        content={'First\n\nSecond\n'}
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    const paras = container.querySelectorAll('p');
    expect(paras.length).toBeGreaterThanOrEqual(2);
    expect(paras[0].getAttribute('data-source-line')).toBe('1');
    expect(paras[1].getAttribute('data-source-line')).toBe('3');
  });
});

describe('MarkdownPreview — smoke test', () => {
  it('renders without error when filePath prop is provided', () => {
    const { container } = render(
      <MarkdownPreview
        content="# Hello"
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    // Should render the heading
    expect(container.querySelector('h1')).not.toBeNull();
  });
});

describe('MarkdownPreview — image proxy URL resolution (IMG-01)', () => {
  it('resolves relative path ./screenshot.png to /api/image proxy URL', () => {
    const { container } = render(
      <MarkdownPreview
        content="![alt](./screenshot.png)"
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    // Relative to docs/notes.md → docs/screenshot.png → encoded as docs%2Fscreenshot.png
    expect(img!.src).toContain('/api/image?path=');
    expect(img!.src).toContain('docs%2Fscreenshot.png');
  });

  it('resolves parent-relative path ../assets/photo.jpg to /api/image proxy URL', () => {
    const { container } = render(
      <MarkdownPreview
        content="![photo](../assets/photo.jpg)"
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toContain('/api/image?path=');
    expect(img!.src).toContain('assets%2Fphoto.jpg');
  });

  it('passes absolute path directly to /api/image proxy URL with encoding', () => {
    const { container } = render(
      <MarkdownPreview
        content="![img](/Users/romankarski/notes/img.png)"
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toContain('/api/image?path=');
    expect(img!.src).toContain('%2FUsers%2Fromankarski%2Fnotes%2Fimg.png');
  });

  it('passes remote URLs through without proxying', () => {
    const { container } = render(
      <MarkdownPreview
        content="![remote](https://example.com/img.png)"
        onLinkClick={noop}
        filePath="docs/notes.md"
      />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toBe('https://example.com/img.png');
    expect(img!.src).not.toContain('/api/image');
  });

  it('renders /api/image proxy for local image even when filePath is at root', () => {
    const { container } = render(
      <MarkdownPreview
        content="![shot](./diagram.png)"
        onLinkClick={noop}
        filePath="readme.md"
      />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toContain('/api/image?path=');
    expect(img!.src).toContain('diagram.png');
  });
});
