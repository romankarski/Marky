import { useCallback, useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { Tab, TabAction } from '../types/tabs';
import { useAutoSave } from '../hooks/useAutoSave';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownPreview } from './MarkdownPreview';

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

  // Reset editContent when switching tabs or when edit mode activates
  useEffect(() => {
    if (tab.editMode && tab.content !== null) {
      setEditContent(tab.content);
    }
  }, [tab.id, tab.editMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable callback: syncs saved content back to reducer and clears dirty flag
  const onSaved = useCallback((savedContent: string) => {
    dispatch({ type: 'SET_CONTENT', path: tab.path, content: savedContent });
    dispatch({ type: 'CLEAR_DIRTY', id: tab.id });
  }, [dispatch, tab.id, tab.path]);

  // Auto-save hook — only fires when in edit mode AND the user has made changes
  useAutoSave(tab.path, editContent, onSaved, tab.editMode && tab.dirty);

  function handleChange(value: string) {
    setEditContent(value);
    // Mark dirty on first keystroke only
    if (!tab.dirty) {
      dispatch({ type: 'SET_DIRTY', id: tab.id });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex justify-end px-4 py-1 border-b border-gray-100 bg-white/40 shrink-0">
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
              <div className="h-full overflow-y-auto">
                <MarkdownPreview content={editContent} onLinkClick={onLinkClick} />
              </div>
            </Panel>
            <Separator className="h-1 bg-gray-200 hover:bg-orange-400 transition-colors cursor-row-resize" />
            <Panel id={`editor-${tab.id}`} defaultSize="50%">
              <div className="h-full overflow-hidden border-t border-gray-200">
                <MarkdownEditor value={editContent} onChange={handleChange} tabId={tab.id} />
              </div>
            </Panel>
          </Group>
        ) : (
          // Preview-only mode
          <div className="h-full overflow-y-auto">
            <MarkdownPreview content={tab.content ?? ''} onLinkClick={onLinkClick} />
          </div>
        )}
      </div>

    </div>
  );
}
