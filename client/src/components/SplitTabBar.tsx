import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tab, TabAction } from '../types/tabs';

interface PaneId {
  pane: 'left' | 'right';
}

interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  pane: 'left' | 'right';
  dispatch: React.Dispatch<TabAction>;
}

function SortableTab({ tab, isActive, dispatch }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${tab.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : ('auto' as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative flex items-center gap-1.5 px-4 py-2.5
        text-sm cursor-grab shrink-0 select-none
        border-b-2 transition-colors
        ${isActive
          ? 'border-orange-500 text-orange-700 bg-white/80'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/40'
        }
      `}
      onClick={() => dispatch({ type: 'FOCUS', id: tab.id })}
      title={tab.path}
    >
      {tab.loading && (
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
      )}
      <span className="max-w-[120px] truncate">{tab.label}</span>
      {tab.dirty && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" title="Unsaved changes" />
      )}
      <button
        className={`
          shrink-0 rounded-sm p-0.5 transition-colors
          ${isActive
            ? 'text-orange-400 hover:text-orange-700 hover:bg-orange-100'
            : 'text-transparent group-hover:text-gray-400 hover:!text-gray-700 hover:bg-gray-200'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          if (tab.dirty) {
            const confirmed = window.confirm(`"${tab.label}" has unsaved changes. Close anyway?`);
            if (!confirmed) return;
          }
          dispatch({ type: 'CLOSE', id: tab.id });
        }}
        title={`Close ${tab.label}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M9.5 3.5L8.5 2.5L6 5L3.5 2.5L2.5 3.5L5 6L2.5 8.5L3.5 9.5L6 7L8.5 9.5L9.5 8.5L7 6L9.5 3.5Z"/>
        </svg>
      </button>
    </div>
  );
}

function DroppablePaneBar({
  pane,
  tabs,
  activeTabId,
  dispatch,
  isOver,
}: {
  pane: 'left' | 'right';
  tabs: Tab[];
  activeTabId: string | null;
  dispatch: React.Dispatch<TabAction>;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `pane-${pane}` });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-end overflow-x-auto scrollbar-none min-h-[40px] flex-1
        transition-colors
        ${isOver ? 'bg-orange-50/60' : ''}
      `}
    >
      <SortableContext
        items={tabs.map(t => t.id)}
        strategy={horizontalListSortingStrategy}
      >
        {tabs.map(tab => (
          <SortableTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            pane={pane}
            dispatch={dispatch}
          />
        ))}
      </SortableContext>
      {tabs.length === 0 && (
        <span className="px-3 py-2.5 text-xs text-gray-300 italic">Drop tabs here</span>
      )}
    </div>
  );
}

interface SplitTabBarProps {
  tabs: Tab[];
  leftActiveTabId: string | null;
  rightActiveTabId: string | null;
  leftDispatch: React.Dispatch<TabAction>;
  rightDispatch: React.Dispatch<TabAction>;
  onReorder: (from: number, to: number) => void;
  onMoveToPane: (tabId: string, targetPane: 'left' | 'right') => void;
  splitToggle: React.ReactNode;
}

// Track which pane each tab "belongs to" for drag-to-move
// Tabs are shared but each pane has an active tab — we derive "ownership" from activeTabId
// For drag purposes, source pane = pane whose tab bar the drag started from

export function SplitTabBar({
  tabs,
  leftActiveTabId,
  rightActiveTabId,
  leftDispatch,
  rightDispatch,
  onReorder,
  onMoveToPane,
  splitToggle,
}: SplitTabBarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overPane, setOverPane] = useState<'left' | 'right' | null>(null);
  const [dragSourcePane, setDragSourcePane] = useState<'left' | 'right' | null>(null);

  const activeTab = tabs.find(t => t.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    const tabId = event.active.id as string;
    setActiveId(tabId);
    // Determine source pane: if tab is active in left → left, else right (fallback left)
    setDragSourcePane(tabId === leftActiveTabId ? 'left' : tabId === rightActiveTabId ? 'right' : 'left');
  }

  function handleDragOver(event: { over: { id: string } | null }) {
    if (!event.over) { setOverPane(null); return; }
    const overId = event.over.id as string;
    if (overId === 'pane-left') setOverPane('left');
    else if (overId === 'pane-right') setOverPane('right');
    else setOverPane(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverPane(null);
    setDragSourcePane(null);

    if (!over) return;

    const overId = over.id as string;

    // Dropped on a pane drop zone
    if (overId === 'pane-left' || overId === 'pane-right') {
      const targetPane = overId === 'pane-left' ? 'left' : 'right';
      if (targetPane !== dragSourcePane) {
        onMoveToPane(active.id as string, targetPane);
      }
      return;
    }

    // Dropped on another tab (reorder within same pane — same behaviour as before)
    if (active.id !== over.id) {
      const from = tabs.findIndex(t => t.id === active.id);
      const to = tabs.findIndex(t => t.id === over.id);
      if (from !== -1 && to !== -1) {
        onReorder(from, to);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver as never}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-stretch border-b border-gray-200/60 bg-gray-50/60 shrink-0">
        {/* Left pane tab bar */}
        <DroppablePaneBar
          pane="left"
          tabs={tabs}
          activeTabId={leftActiveTabId}
          dispatch={leftDispatch}
          isOver={overPane === 'left'}
        />

        {/* Divider */}
        <div className="w-px bg-gray-200 shrink-0 self-stretch" />

        {/* Right pane tab bar */}
        <DroppablePaneBar
          pane="right"
          tabs={tabs}
          activeTabId={rightActiveTabId}
          dispatch={rightDispatch}
          isOver={overPane === 'right'}
        />

        {/* Split toggle */}
        <div className="shrink-0 flex items-center border-l border-gray-200/40">
          {splitToggle}
        </div>
      </div>

      {/* Drag overlay — ghost tab while dragging */}
      <DragOverlay>
        {activeTab ? (
          <div className="flex items-center gap-1.5 px-4 py-2.5 text-sm bg-white shadow-lg rounded border border-orange-200 text-orange-700 cursor-grabbing opacity-90">
            <span className="max-w-[120px] truncate">{activeTab.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
