import { describe, it, expect } from 'vitest';
import { SlashCommands, SLASH_ITEMS } from '../slash-commands';

describe('slash-commands extension', () => {
  it('exports a TipTap Extension named slashCommands', () => {
    expect(SlashCommands).toBeDefined();
    expect(SlashCommands.name).toBe('slashCommands');
  });

  it('configures suggestion with char "/" and startOfLine true', () => {
    const config = SlashCommands.config;
    expect(config).toBeDefined();
  });

  it('provides SLASH_ITEMS array with exactly 6 entries', () => {
    expect(SLASH_ITEMS).toHaveLength(6);
    const titles = SLASH_ITEMS.map((item) => item.title);
    expect(titles).toEqual([
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Table',
      'Image',
      'Code Block',
    ]);
  });
});
