// Updated in Plan 05: SearchPanel is a pure presentational component that receives results
// as props. No useSearch hook ownership — App.tsx owns search state and passes results down.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SearchPanel from '../components/SearchPanel';

afterEach(() => { cleanup(); });

const mockResult = {
  id: 'notes/hello.md',
  name: 'hello',
  path: 'notes/hello.md',
  text: 'hello world content',
  tags: ['search'],
  score: 1,
  match: {},
  terms: ['hello'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchPanel component', () => {
  it('SRCH-02: renders the result file name and text snippet', () => {
    const onOpen = vi.fn();
    render(<SearchPanel results={[mockResult]} onOpen={onOpen} />);

    expect(screen.getByText('hello')).toBeTruthy();
    expect(screen.getByText(/hello world content/)).toBeTruthy();
  });

  it('SRCH-03: clicking a result item calls onOpen with the correct file path', () => {
    const onOpen = vi.fn();
    render(<SearchPanel results={[mockResult]} onOpen={onOpen} />);

    // Click on the result item (which shows the name "hello")
    fireEvent.click(screen.getByText('hello'));

    expect(onOpen).toHaveBeenCalledWith('notes/hello.md');
  });

  it('SRCH-03: renders nothing when results array is empty', () => {
    const onOpen = vi.fn();
    const { container } = render(<SearchPanel results={[]} onOpen={onOpen} />);

    expect(container.firstChild).toBeNull();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
