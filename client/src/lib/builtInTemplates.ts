export interface TemplateEntry {
  id: string;
  label: string;
  content: string;
}

export const BUILT_IN_TEMPLATES: TemplateEntry[] = [
  {
    id: 'daily-note',
    label: 'Daily Note',
    content: '---\ndate: {{date}}\ntags: [daily]\n---\n\n# {{date}}\n\n## Today\n\n- \n\n## Notes\n\n',
  },
  {
    id: 'meeting-note',
    label: 'Meeting Note',
    content:
      '---\ndate: {{date}}\ntags: [meeting]\n---\n\n# Meeting: {{title}}\n\n**Date:** {{date}}\n\n## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Notes\n\n## Action Items\n\n- [ ] \n',
  },
  {
    id: 'decision-record',
    label: 'Decision Record',
    content:
      '---\ndate: {{date}}\ntags: [decision]\n---\n\n# Decision: {{title}}\n\n**Date:** {{date}}\n**Status:** Proposed\n\n## Context\n\n## Decision\n\n## Consequences\n\n',
  },
];
