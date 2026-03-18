import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlashCommandMenu } from '../components/SlashCommandMenu';
import { SLASH_ITEMS } from '../extensions/slash-commands';

describe('SlashCommandMenu', () => {
  it('renders all 6 command items when query is empty', () => {
    render(
      <SlashCommandMenu
        items={SLASH_ITEMS}
        query=""
        command={vi.fn()}
        selectedIndex={0}
      />,
    );
    expect(screen.getByText('Heading 1')).toBeTruthy();
    expect(screen.getByText('Heading 2')).toBeTruthy();
    expect(screen.getByText('Heading 3')).toBeTruthy();
    expect(screen.getByText('Table')).toBeTruthy();
    expect(screen.getByText('Image')).toBeTruthy();
    expect(screen.getByText('Code Block')).toBeTruthy();
  });

  it('filters items as query changes', () => {
    render(
      <SlashCommandMenu
        items={SLASH_ITEMS}
        query="head"
        command={vi.fn()}
        selectedIndex={0}
      />,
    );
    expect(screen.getByText('Heading 1')).toBeTruthy();
    expect(screen.getByText('Heading 2')).toBeTruthy();
    expect(screen.getByText('Heading 3')).toBeTruthy();
    expect(screen.queryByText('Table')).toBeNull();
    expect(screen.queryByText('Image')).toBeNull();
    expect(screen.queryByText('Code Block')).toBeNull();
  });

  it('calls command handler when item is clicked', () => {
    const command = vi.fn();
    render(
      <SlashCommandMenu
        items={SLASH_ITEMS}
        query=""
        command={command}
        selectedIndex={0}
      />,
    );
    fireEvent.click(screen.getByText('Table'));
    expect(command).toHaveBeenCalledTimes(1);
    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Table' }),
    );
  });

  it('highlights selected item with orange-100 background', () => {
    render(
      <SlashCommandMenu
        items={SLASH_ITEMS}
        query=""
        command={vi.fn()}
        selectedIndex={2}
      />,
    );
    // The third item (Heading 3, index 2) should have bg-orange-100
    const buttons = screen.getAllByRole('button');
    expect(buttons[2].className).toContain('bg-orange-100');
    expect(buttons[0].className).not.toContain('bg-orange-100');
  });

  it('shows "No results" when query matches nothing', () => {
    render(
      <SlashCommandMenu
        items={SLASH_ITEMS}
        query="zzzzz"
        command={vi.fn()}
        selectedIndex={0}
      />,
    );
    expect(screen.getByText('No results')).toBeTruthy();
  });
});
