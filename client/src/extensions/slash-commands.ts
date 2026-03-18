import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { SlashCommandMenu } from '../components/SlashCommandMenu';
import { uploadImageFromPicker } from './image-upload';

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
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: 'H2',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: 'H3',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
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
      uploadImageFromPicker(editor);
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
          let currentProps: any = null;

          const destroy = () => {
            root?.unmount();
            container?.remove();
            container = null;
            root = null;
            currentProps = null;
          };

          const mountMenu = (props: any) => {
            currentProps = props;

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

            selectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));

            root!.render(
              createElement(SlashCommandMenu, {
                items,
                query: props.query ?? '',
                selectedIndex,
                command: (item: SlashItem) => {
                  // Capture command ref before destroy nulls currentProps
                  const cmd = command;
                  destroy();
                  cmd(item);
                },
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
              if (!currentProps) return false;
              const { items, command } = currentProps;

              if (event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % items.length;
                mountMenu(currentProps);
                return true;
              }
              if (event.key === 'ArrowUp') {
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                mountMenu(currentProps);
                return true;
              }
              if (event.key === 'Enter') {
                const item = items[selectedIndex];
                if (item) {
                  // Capture before destroy
                  const cmd = command;
                  destroy();
                  cmd(item);
                }
                return true;
              }
              if (event.key === 'Escape') {
                destroy();
                return true;
              }
              return false;
            },
            onExit: destroy,
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
