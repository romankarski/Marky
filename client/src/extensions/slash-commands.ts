import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { SlashCommandMenu } from '../components/SlashCommandMenu';

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
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: 'H2',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: 'H3',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: '|',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
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
        startOfLine: false,
        items: ({ query }: { query: string }) =>
          SLASH_ITEMS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()),
          ),
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range });
        },
        render: () => {
          let container: HTMLElement | null = null;
          let root: Root | null = null;
          let selectedIndex = 0;

          const mountMenu = (props: any) => {
            if (!container) {
              container = document.createElement('div');
              container.style.position = 'absolute';
              container.style.zIndex = '9999';
              document.body.appendChild(container);
              root = createRoot(container);
            }

            const { clientRect, items, command } = props;
            const rect = clientRect?.();
            if (rect) {
              container.style.top = `${rect.bottom + window.scrollY + 4}px`;
              container.style.left = `${rect.left + window.scrollX}px`;
            }

            root!.render(
              createElement(SlashCommandMenu, {
                items,
                query: props.query ?? '',
                selectedIndex,
                command: (item: SlashItem) => command(item),
              }),
            );
          };

          return {
            onStart: (props: any) => {
              selectedIndex = 0;
              mountMenu(props);
            },
            onUpdate: (props: any) => {
              mountMenu(props);
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (event.key === 'ArrowDown') {
                selectedIndex = Math.min(selectedIndex + 1, SLASH_ITEMS.length - 1);
                return true;
              }
              if (event.key === 'ArrowUp') {
                selectedIndex = Math.max(selectedIndex - 1, 0);
                return true;
              }
              if (event.key === 'Escape') {
                root?.unmount();
                container?.remove();
                container = null;
                root = null;
                return true;
              }
              return false;
            },
            onExit: () => {
              root?.unmount();
              container?.remove();
              container = null;
              root = null;
            },
          };
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
