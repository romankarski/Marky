import { useCallback, useEffect, useRef, useState } from 'react';
import type { Tab, TabAction } from '../types/tabs';
import { useAutoSave } from '../hooks/useAutoSave';
import { useScrollPersist } from '../hooks/useScrollPersist';
import { WysiwygEditor, type WysiwygEditorHandle } from './WysiwygEditor';
import { MarkdownEditor } from './MarkdownEditor';
import { exportPdf, exportHtml, exportMarkdown } from '../lib/export';

interface EditorPaneProps {
  tab: Tab;
  dispatch: React.Dispatch<TabAction>;
  onLinkClick: (path: string) => void;
}

export function EditorPane({ tab, dispatch, onLinkClick }: EditorPaneProps) {
  // Local state: raw mode toggle (WYSIWYG is default)
  const [rawMode, setRawMode] = useState(false);

  // Local edit content — single source of truth while editing.
  const [editContent, setEditContent] = useState<string>('');

  // Auto-save gate: temporarily disabled during mode switch (Pitfall 3)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const wysiwygRef = useRef<WysiwygEditorHandle>(null);

  // Scroll persistence for the WYSIWYG editor container
  const scrollRef = useScrollPersist(tab.path, tab.content);

  // Initialize editContent from tab.content when tab changes
  useEffect(() => {
    if (tab.content !== null) {
      setEditContent(tab.content);
    }
  }, [tab.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update editContent when external file changes arrive (live reload)
  useEffect(() => {
    if (tab.content !== null && !tab.dirty) {
      setEditContent(tab.content);
      // If in WYSIWYG mode, update the TipTap editor content
      if (!rawMode && wysiwygRef.current) {
        wysiwygRef.current.setContent(tab.content);
      }
    }
  }, [tab.content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable callback: clears dirty flag after auto-save
  const onSaved = useCallback((_savedContent: string) => {
    dispatch({ type: 'CLEAR_DIRTY', id: tab.id });
  }, [dispatch, tab.id]);

  // Auto-save — always enabled (editing is always active), controlled by autoSaveEnabled flag
  useAutoSave(tab.path, editContent, onSaved, tab.dirty && autoSaveEnabled);

  function handleWysiwygChange(md: string) {
    setEditContent(md);
    if (!tab.dirty) dispatch({ type: 'SET_DIRTY', id: tab.id });
  }

  function handleRawChange(value: string) {
    setEditContent(value);
    if (!tab.dirty) dispatch({ type: 'SET_DIRTY', id: tab.id });
  }

  function handleToggleRawMode() {
    // Temporarily disable auto-save during transition (Pitfall 3)
    setAutoSaveEnabled(false);

    if (rawMode) {
      // raw -> WYSIWYG: editContent already has latest markdown from CodeMirror
      if (wysiwygRef.current) {
        wysiwygRef.current.setContent(editContent);
      }
    } else {
      // WYSIWYG -> raw: serialize TipTap to markdown
      const md = wysiwygRef.current?.getMarkdown() ?? editContent;
      setEditContent(md);
    }

    setRawMode(!rawMode);

    // Re-enable auto-save after React renders the new mode
    requestAnimationFrame(() => setAutoSaveEnabled(true));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-gray-100 bg-white/40 shrink-0">
        {/* Export buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportPdf(editContent, tab.path)}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            title="Export as PDF"
          >
            PDF
          </button>
          <button
            onClick={() => exportHtml(editContent, tab.path)}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            title="Export as HTML (opens in Word / LibreOffice)"
          >
            HTML
          </button>
          <button
            onClick={() => exportMarkdown(editContent, tab.path)}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            title="Download raw Markdown"
          >
            MD
          </button>
        </div>

        {/* Raw mode toggle (replaces old Edit/Preview toggle) */}
        <button
          onClick={handleToggleRawMode}
          className={`text-xs font-medium transition-colors ${rawMode ? 'text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
          title={rawMode ? 'Switch to rich editor' : 'Switch to raw Markdown'}
        >
          {rawMode ? 'WYSIWYG' : '</>'}
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden transition-opacity duration-150">
        {tab.deleted ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <span className="text-2xl">&#x1F5D1;</span>
            <p className="text-sm">This file was deleted</p>
            <button
              onClick={() => dispatch({ type: 'CLOSE', id: tab.id })}
              className="text-xs text-orange-500 hover:text-orange-700 transition-colors"
            >
              Close tab
            </button>
          </div>
        ) : tab.loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="w-4 h-4 rounded-full bg-orange-400 animate-pulse" />
          </div>
        ) : rawMode ? (
          <MarkdownEditor
            value={editContent}
            onChange={handleRawChange}
            tabId={tab.id}
          />
        ) : (
          <div className="h-full">
            <WysiwygEditor
              ref={wysiwygRef}
              content={editContent}
              onChange={handleWysiwygChange}
              onLinkClick={onLinkClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
