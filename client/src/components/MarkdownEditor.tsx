import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  tabId: string; // used as React key to reset CM state when switching files
}

export function MarkdownEditor({ value, onChange, tabId }: MarkdownEditorProps) {
  return (
    <CodeMirror
      key={tabId}
      value={value}
      height="100%"
      extensions={[markdown()]}
      onChange={onChange}
      className="h-full text-sm font-mono overflow-auto"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
      }}
    />
  );
}
