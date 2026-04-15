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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tab, TabAction } from '../types/tabs';

interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  dispatch: React.Dispatch<TabAction>;
}

function SortableTab({ tab, isActive, dispatch }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
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
        text-sm cursor-grab w-[160px] select-none
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
      <span className="flex-1 min-w-0 truncate">{tab.label}</span>
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
        ${isOver ? 'bg-orange-50/80' : ''}
      `}
    >
      <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
        {tabs.map(tab => (
          <SortableTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            dispatch={dispatch}
          />
        ))}
      </SortableContext>
      {tabs.length === 0 && (
        <span className="px-3 py-2.5 text-xs text-gray-300 italic select-none">
          {isOver ? 'Drop here' : 'Empty — drag tabs here'}
        </span>
      )}
    </div>
  );
}

export interface SplitTabBarProps {
  /** All open tabs */
  allTabs: Tab[];
  /** Ordered list of tab IDs in the left pane */
  leftTabIds: string[];
  /** Ordered list of tab IDs in the right pane */
  rightTabIds: string[];
  leftActiveTabId: string | null;
  rightActiveTabId: string | null;
  leftDispatch: React.Dispatch<TabAction>;
  rightDispatch: React.Dispatch<TabAction>;
  /** Called when left pane tab order changes */
  onLeftReorder: (ids: string[]) => void;
  /** Called when right pane tab order changes */
  onRightReorder: (ids: string[]) => void;
  /** Called when a tab is moved from one pane to the other */
  onMoveToPane: (tabId: string, targetPane: 'left' | 'right') => void;
  splitToggle: React.ReactNode;
}

export function SplitTabBar({
  allTabs,
  leftTabIds,
  rightTabIds,
  leftActiveTabId,
  rightActiveTabId,
  leftDispatch,
  rightDispatch,
  onLeftReorder,
  onRightReorder,
  onMoveToPane,
  splitToggle,
}: SplitTabBarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overPane, setOverPane] = useState<'left' | 'right' | null>(null);
  const [dragSourcePane, setDragSourcePane] = useState<'left' | 'right' | null>(null);

  const tabById = (id: string) => allTabs.find(t => t.id === id);
  const leftTabs = leftTabIds.map(id => tabById(id)).filter(Boolean) as Tab[];
  const rightTabs = rightTabIds.map(id => tabById(id)).filter(Boolean) as Tab[];
  const activeTab = activeId ? tabById(activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    const tabId = event.active.id as string;
    setActiveId(tabId);
    setDragSourcePane(leftTabIds.includes(tabId) ? 'left' : 'right');
  }

  function handleDragOver(event: { over: { id: string } | null }) {
    if (!event.over) { setOverPane(null); return; }
    const overId = event.over.id as string;
    if (overId === 'pane-left') setOverPane('left');
    else if (overId === 'pane-right') setOverPane('right');
    else {
      // Hovering over a tab — determine which pane it belongs to
      if (leftTabIds.includes(overId)) setOverPane('left');
      else if (rightTabIds.includes(overId)) setOverPane('right');
      else setOverPane(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const tabId = active.id as string;
    setActiveId(null);
    setOverPane(null);
    setDragSourcePane(null);

    if (!over) return;

    const overId = over.id as string;

    // Dropped on a pane drop zone (empty area of a bar)
    if (overId === 'pane-left' || overId === 'pane-right') {
      const targetPane = overId === 'pane-left' ? 'left' : 'right';
      if (targetPane !== dragSourcePane) {
        onMoveToPane(tabId, targetPane);
      }
      return;
    }

    // Dropped on a tab
    if (tabId === overId) return;

    const overInLeft = leftTabIds.includes(overId);
    const overInRight = rightTabIds.includes(overId);
    const sourceInLeft = leftTabIds.includes(tabId);

    if (overInLeft && sourceInLeft) {
      // Reorder within left
      const from = leftTabIds.indexOf(tabId);
      const to = leftTabIds.indexOf(overId);
      onLeftReorder(arrayMove(leftTabIds, from, to));
    } else if (overInRight && !sourceInLeft) {
      // Reorder within right
      const from = rightTabIds.indexOf(tabId);
      const to = rightTabIds.indexOf(overId);
      onRightReorder(arrayMove(rightTabIds, from, to));
    } else if (overInLeft && !sourceInLeft) {
      // Move from right to left
      onMoveToPane(tabId, 'left');
    } else if (overInRight && sourceInLeft) {
      // Move from left to right
      onMoveToPane(tabId, 'right');
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
        <DroppablePaneBar
          pane="left"
          tabs={leftTabs}
          activeTabId={leftActiveTabId}
          dispatch={leftDispatch}
          isOver={overPane === 'left'}
        />
        <div className="w-px bg-gray-200 shrink-0 self-stretch" />
        <DroppablePaneBar
          pane="right"
          tabs={rightTabs}
          activeTabId={rightActiveTabId}
          dispatch={rightDispatch}
          isOver={overPane === 'right'}
        />
        <div className="shrink-0 flex items-center border-l border-gray-200/40">
          {splitToggle}
        </div>
      </div>

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
