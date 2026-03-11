// Wave 0 RED tests — client/src/lib/builtInTemplates.ts does not exist yet.
// All tests will fail with import errors until Wave 1 creates the module.

import { describe, it, expect } from 'vitest';
import { BUILT_IN_TEMPLATES } from '../builtInTemplates';

describe('BUILT_IN_TEMPLATES', () => {
  it('has exactly 3 entries', () => {
    expect(BUILT_IN_TEMPLATES).toHaveLength(3);
  });

  it('each entry has non-empty id, label, and content fields', () => {
    for (const entry of BUILT_IN_TEMPLATES) {
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.content).toBe('string');
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });

  it('daily-note entry has id "daily-note" and content contains {{date}}', () => {
    const entry = BUILT_IN_TEMPLATES.find((t) => t.id === 'daily-note');
    expect(entry).toBeDefined();
    expect(entry!.content).toContain('{{date}}');
  });

  it('meeting-note entry has id "meeting-note" and content contains {{title}}', () => {
    const entry = BUILT_IN_TEMPLATES.find((t) => t.id === 'meeting-note');
    expect(entry).toBeDefined();
    expect(entry!.content).toContain('{{title}}');
  });

  it('decision-record entry has id "decision-record" and content contains both {{date}} and {{title}}', () => {
    const entry = BUILT_IN_TEMPLATES.find((t) => t.id === 'decision-record');
    expect(entry).toBeDefined();
    expect(entry!.content).toContain('{{date}}');
    expect(entry!.content).toContain('{{title}}');
  });
});
