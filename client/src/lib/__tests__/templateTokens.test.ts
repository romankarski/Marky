// Wave 0 RED tests — client/src/lib/templateTokens.ts does not exist yet.
// All tests will fail with import errors until Wave 1 creates the module.

import { describe, it, expect } from 'vitest';
import { applyTokens } from '../templateTokens';

describe('applyTokens', () => {
  it('substitutes {{title}} token with the provided title', () => {
    expect(applyTokens('Hello {{title}}', { title: 'my-note', date: '2026-03-11' })).toBe('Hello my-note');
  });

  it('substitutes {{date}} token with the provided date', () => {
    expect(applyTokens('Date: {{date}}', { title: 'x', date: '2026-03-11' })).toBe('Date: 2026-03-11');
  });

  it('substitutes both {{title}} and {{date}} in the same string', () => {
    expect(applyTokens('{{title}} on {{date}}', { title: 'meeting', date: '2026-03-11' })).toBe('meeting on 2026-03-11');
  });

  it('replaces multiple occurrences of the same token (global replace)', () => {
    const result = applyTokens('# {{title}}\n\n{{title}} is great', { title: 'my-note', date: '2026-03-11' });
    expect(result).toBe('# my-note\n\nmy-note is great');
  });

  it('strips .md extension from title before substitution', () => {
    const result = applyTokens('# {{title}}', { title: 'my-note.md', date: '2026-03-11' });
    expect(result).toBe('# my-note');
    expect(result).not.toContain('.md');
  });
});
