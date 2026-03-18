import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';

export interface SlashItem {
  title: string;
  description: string;
  icon: string;
  command: (params: { editor: any; range: any }) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Heading 1',
    description: 'Large heading',
    icon: 'H1',
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: 'H2',
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run(),
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: 'H3',
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run(),
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: '|',
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'Image',
    description: 'Insert an image',
    icon: 'img',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        // Upload handler will be wired in Plan 04
      };
      input.click();
    },
  },
  {
    title: 'Code Block',
    description: 'Insert code',
    icon: '<>',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
];

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: any;
          range: any;
          props: any;
        }) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
