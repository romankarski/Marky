import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { BubbleToolbar } from './BubbleToolbar';
import { SlashCommands } from '../extensions/slash-commands';

export interface WysiwygEditorHandle {
  getMarkdown: () => string;
  setContent: (md: string) => void;
}

interface WysiwygEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onLinkClick: (path: string) => void;
}

/** Split `--- frontmatter ---\n body` into [frontmatter, body]. */
function splitFrontmatter(md: string): { frontmatter: string; body: string } {
  if (!md.startsWith('---')) return { frontmatter: '', body: md };
  const end = md.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: '', body: md };
  const frontmatter = md.slice(0, end + 4); // includes closing ---
  const body = md.slice(end + 4).replace(/^\n/, '');
  return { frontmatter, body };
}

export const WysiwygEditor = forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(
  function WysiwygEditor({ content, onChange, onLinkClick }, ref) {
    // Keep the frontmatter so we can re-attach it on getMarkdown()
    const frontmatterRef = useRef('');
    const lastContentRef = useRef(content);

    const { frontmatter, body } = splitFrontmatter(content);
    frontmatterRef.current = frontmatter;

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ link: false }),
        Markdown.configure({ markedOptions: { gfm: true } }),
        Link.configure({ openOnClick: false }),
        Image.configure({ inline: false }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Placeholder.configure({
          placeholder: 'Click anywhere to begin, or type / for commands',
        }),
        SlashCommands,
      ],
      content: body,
      contentType: 'markdown',
      onUpdate: ({ editor: e }) => {
        const md = e.getMarkdown();
        const full = frontmatterRef.current
          ? `${frontmatterRef.current}\n${md}`
          : md;
        lastContentRef.current = full;
        onChange(full);
      },
    });

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        const md = editor?.getMarkdown() ?? '';
        return frontmatterRef.current ? `${frontmatterRef.current}\n${md}` : md;
      },
      setContent: (md: string) => {
        if (editor) {
          const { frontmatter: fm, body: b } = splitFrontmatter(md);
          frontmatterRef.current = fm;
          lastContentRef.current = md;
          editor.commands.setContent(b, { contentType: 'markdown' });
        }
      },
    }), [editor]);

    // Sync content prop when a new file is loaded
    useEffect(() => {
      if (!editor) return;
      if (content !== lastContentRef.current) {
        const { frontmatter: fm, body: b } = splitFrontmatter(content);
        frontmatterRef.current = fm;
        lastContentRef.current = content;
        editor.commands.setContent(b, { contentType: 'markdown' });
      }
    }, [content, editor]);

    if (!editor) return null;

    return (
      <div className="h-full overflow-y-auto">
        <style>{`
          .ProseMirror {
            min-height: 100%;
            outline: none;
          }
          .ProseMirror > * {
            border-left: 2px solid transparent;
            padding-left: 6px;
            transition: border-color 150ms ease;
          }
          .ProseMirror > *:hover {
            border-left: 2px solid rgb(254 215 170);
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
        `}</style>
        <BubbleToolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-orange max-w-none px-6 py-4"
        />
      </div>
    );
  },
);
