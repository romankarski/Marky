import React from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { ViewUpdate } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  tabId: string; // used as React key to reset CM state when switching files
  onUpdate?: (update: ViewUpdate) => void;
}

export const MarkdownEditor = React.forwardRef<ReactCodeMirrorRef, MarkdownEditorProps>(
  function MarkdownEditor({ value, onChange, tabId, onUpdate }, ref) {
    return (
      <CodeMirror
        ref={ref}
        key={tabId}
        value={value}
        height="100%"
        extensions={[markdown()]}
        onChange={onChange}
        onUpdate={onUpdate}
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
);
