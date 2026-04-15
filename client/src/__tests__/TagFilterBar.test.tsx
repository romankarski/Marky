import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TagFilterBar } from '../components/TagFilterBar';

afterEach(() => {
  cleanup();
});

const baseProps = {
  allTags: ['work', 'home'],
  hiddenTags: new Set<string>(),
  onToggleTag: vi.fn(),
  showTagEdges: true,
  showFileLinks: true,
  onToggleTagEdges: vi.fn(),
  onToggleFileLinks: vi.fn(),
};

describe('TagFilterBar', () => {
  it('renders a chip for every tag', () => {
    render(<TagFilterBar {...baseProps} />);
    expect(screen.getByText('work')).toBeTruthy();
    expect(screen.getByText('home')).toBeTruthy();
  });

  it('marks hidden tags as aria-pressed=false', () => {
    render(<TagFilterBar {...baseProps} hiddenTags={new Set(['work'])} />);
    const workButton = screen.getByText('work').closest('button');
    expect(workButton?.getAttribute('aria-pressed')).toBe('false');
    const homeButton = screen.getByText('home').closest('button');
    expect(homeButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onToggleTag when a chip is clicked', () => {
    const onToggleTag = vi.fn();
    render(<TagFilterBar {...baseProps} onToggleTag={onToggleTag} />);
    fireEvent.click(screen.getByText('work'));
    expect(onToggleTag).toHaveBeenCalledWith('work');
  });

  it('calls edge-toggle handlers when checkboxes flip', () => {
    const onToggleTagEdges = vi.fn();
    const onToggleFileLinks = vi.fn();
    render(
      <TagFilterBar
        {...baseProps}
        onToggleTagEdges={onToggleTagEdges}
        onToggleFileLinks={onToggleFileLinks}
      />,
    );
    fireEvent.click(screen.getByLabelText('Tag edges'));
    fireEvent.click(screen.getByLabelText('Document links'));
    expect(onToggleTagEdges).toHaveBeenCalled();
    expect(onToggleFileLinks).toHaveBeenCalled();
  });

  it('shows empty-state message when no tags exist', () => {
    render(<TagFilterBar {...baseProps} allTags={[]} />);
    expect(screen.getByText(/No tags in workspace/)).toBeTruthy();
  });
});
