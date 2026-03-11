import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import type { Tab, TabAction } from '../types/tabs';
import { useAutoSave } from '../hooks/useAutoSave';
import { useScrollPersist } from '../hooks/useScrollPersist';
import { useScrollSync } from '../hooks/useScrollSync';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { exportPdf, exportHtml, exportMarkdown } from '../lib/export';

interface EditorPaneProps {
  tab: Tab;
  dispatch: React.Dispatch<TabAction>;
  onLinkClick: (path: string) => void;
}

export function EditorPane({ tab, dispatch, onLinkClick }: EditorPaneProps) {
  // Local edit content — single source of truth while editing.
  // Initialized from tab.content when editMode becomes true.
  // NOT written to reducer on every keystroke (prevents cursor-jumping).
  const [editContent, setEditContent] = useState<string>('');

  // Debounced content for scroll sync — avoids cache rebuild on every keystroke
  const [syncContent, setSyncContent] = useState('');

  // Scroll persistence: saves/restores preview scroll position per file.
  // Pass null in edit mode — the scrollRef isn't mounted in edit mode anyway.
  const scrollRef = useScrollPersist(tab.path, tab.editMode ? null : tab.content);

  // Refs for bidirectional scroll sync in edit mode
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const editPreviewRef = useRef<HTMLDivElement>(null);

  // Saves preview scrollTop before each keystroke so we can restore it after DOM mutation
  const editPreviewScrollRef = useRef(0);

  // Track when the CodeMirror view is ready (populated after first render)
  const [cmView, setCmView] = useState<EditorView | null>(null);

  useScrollSync({
    editorView: cmView,
    previewRef: editPreviewRef,
    content: syncContent,
  });

  // Reset editContent when switching tabs or when edit mode activates
  useEffect(() => {
    if (tab.editMode && tab.content !== null) {
      setEditContent(tab.content);
      setSyncContent(tab.content); // initialize immediately, no debounce on first load
    }
  }, [tab.id, tab.editMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce syncContent updates during typing (400ms after last keystroke)
  useEffect(() => {
    const timer = setTimeout(() => setSyncContent(editContent), 400);
    return () => clearTimeout(timer);
  }, [editContent]);

  // Restore preview scroll after each DOM mutation caused by editContent change
  useLayoutEffect(() => {
    const el = editPreviewRef.current;
    if (el) el.scrollTop = editPreviewScrollRef.current;
  }, [editContent]);

  // Clear cmView when leaving edit mode so effects re-attach on next entry
  useEffect(() => {
    if (!tab.editMode) setCmView(null);
  }, [tab.editMode, tab.id]);

  // Stable callback: syncs saved content back to reducer and clears dirty flag
  const onSaved = useCallback((savedContent: string) => {
    dispatch({ type: 'SET_CONTENT', path: tab.path, content: savedContent });
    dispatch({ type: 'CLEAR_DIRTY', id: tab.id });
  }, [dispatch, tab.id, tab.path]);

  // Auto-save hook — only fires when in edit mode AND the user has made changes
  useAutoSave(tab.path, editContent, onSaved, tab.editMode && tab.dirty);

  function handleChange(value: string) {
    // Capture scroll position BEFORE setEditContent triggers re-render
    editPreviewScrollRef.current = editPreviewRef.current?.scrollTop ?? 0;
    setEditContent(value);
    // Mark dirty on first keystroke only
    if (!tab.dirty) {
      dispatch({ type: 'SET_DIRTY', id: tab.id });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-gray-100 bg-white/40 shrink-0">
        {/* Export buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const el = tab.editMode ? editPreviewRef.current : scrollRef.current;
              if (el) exportPdf(el, tab.path);
            }}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            title="Export as PDF"
          >
            PDF
          </button>
          <button
            onClick={() => {
              const el = tab.editMode ? editPreviewRef.current : scrollRef.current;
              if (el) exportHtml(el, tab.path);
            }}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            title="Export as HTML (opens in Word / LibreOffice)"
          >
            HTML
          </button>
          <button
            onClick={() => exportMarkdown(tab.editMode ? editContent : (tab.content ?? ''), tab.path)}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            title="Download raw Markdown"
          >
            MD
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'TOGGLE_EDIT', id: tab.id })}
          className="text-xs font-medium text-orange-600 hover:text-orange-800 transition-colors"
        >
          {tab.editMode ? 'Preview' : 'Edit'}
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {tab.deleted ? (
          // File was deleted externally
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <span className="text-2xl">🗑</span>
            <p className="text-sm">This file was deleted</p>
            <button
              onClick={() => dispatch({ type: 'CLOSE', id: tab.id })}
              className="text-xs text-orange-500 hover:text-orange-700 transition-colors"
            >
              Close tab
            </button>
          </div>
        ) : tab.loading ? (
          // Loading spinner
          <div className="flex items-center justify-center h-full">
            <span className="w-4 h-4 rounded-full bg-orange-400 animate-pulse" />
          </div>
        ) : tab.editMode ? (
          // Split pane: preview on top, editor on bottom
          <Group orientation="vertical" className="h-full">
            <Panel id={`preview-${tab.id}`} defaultSize="50%">
              <div ref={editPreviewRef} className="h-full overflow-y-auto">
                <MarkdownPreview content={editContent} onLinkClick={onLinkClick} filePath={tab.path} />
              </div>
            </Panel>
            <Separator className="h-1 bg-gray-200 hover:bg-orange-400 transition-colors cursor-row-resize" />
            <Panel id={`editor-${tab.id}`} defaultSize="50%">
              <div className="h-full overflow-hidden border-t border-gray-200">
                <MarkdownEditor
                  ref={editorRef}
                  value={editContent}
                  onChange={handleChange}
                  tabId={tab.id}
                  onUpdate={(update) => {
                    if (!cmView && update.view) setCmView(update.view);
                  }}
                />
              </div>
            </Panel>
          </Group>
        ) : (
          // Preview-only mode
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <MarkdownPreview content={tab.content ?? ''} onLinkClick={onLinkClick} filePath={tab.path} />
          </div>
        )}
      </div>

    </div>
  );
}
