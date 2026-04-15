import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TableOfContents } from '../components/TableOfContents';

// jsdom does not implement IntersectionObserver — stub it so component mounts cleanly
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

const CONTENT = '# Hello World\n\n## Section Two\n\nSome text.';

describe('TableOfContents', () => {
  it('renders heading links extracted from markdown', () => {
    render(<TableOfContents content={CONTENT} />);
    expect(screen.getByText('Hello World')).toBeTruthy();
    expect(screen.getByText('Section Two')).toBeTruthy();
  });

  it('calls onHeadingClick with heading id and text when link is clicked', () => {
    const onHeadingClick = vi.fn();
    render(<TableOfContents content={CONTENT} onHeadingClick={onHeadingClick} />);
    fireEvent.click(screen.getByText('Hello World'));
    expect(onHeadingClick).toHaveBeenCalledWith('hello-world', 'Hello World');
  });

  it('renders nothing when content has no headings', () => {
    const { container } = render(<TableOfContents content="No headings here." />);
    expect(container.firstChild).toBeNull();
  });
});
