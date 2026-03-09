import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tab, TabAction } from '../types/tabs';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  dispatch: React.Dispatch<TabAction>;
}

interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  dispatch: React.Dispatch<TabAction>;
}

function SortableTab({ tab, isActive, dispatch }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
        text-sm cursor-pointer shrink-0 select-none
        border-b-2 transition-colors
        ${isActive
          ? 'border-orange-500 text-orange-700 bg-white/80'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/40'
        }
      `}
      onClick={() => dispatch({ type: 'FOCUS', id: tab.id })}
      title={tab.path}
    >
      {/* Loading indicator */}
      {tab.loading && (
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
      )}

      <span className="max-w-[140px] truncate">{tab.label}</span>

      {/* Dirty indicator dot — visible when tab has unsaved changes */}
      {tab.dirty && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"
          title="Unsaved changes"
        />
      )}

      {/* Close button — always rendered for layout stability, becomes visible on hover/active */}
      <button
        className={`
          shrink-0 rounded-sm p-0.5 transition-colors
          ${isActive
            ? 'text-orange-400 hover:text-orange-700 hover:bg-orange-100'
            : 'text-transparent group-hover:text-gray-400 hover:!text-gray-700 hover:bg-gray-200'
          }
        `}
        onClick={(e) => {
          e.stopPropagation(); // don't trigger FOCUS when closing
          if (tab.dirty) {
            const confirmed = window.confirm(`"${tab.label}" has unsaved changes. Close anyway?`);
            if (!confirmed) return;
          }
          dispatch({ type: 'CLOSE', id: tab.id });
        }}
        title={`Close ${tab.label}`}
        // Prevent dnd-kit from treating close click as drag start
        onPointerDown={(e) => e.stopPropagation()}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M9.5 3.5L8.5 2.5L6 5L3.5 2.5L2.5 3.5L5 6L2.5 8.5L3.5 9.5L6 7L8.5 9.5L9.5 8.5L7 6L9.5 3.5Z"/>
        </svg>
      </button>
    </div>
  );
}

export function TabBar({ tabs, activeTabId, dispatch }: TabBarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = tabs.findIndex(t => t.id === active.id);
      const to   = tabs.findIndex(t => t.id === over.id);
      if (from !== -1 && to !== -1) {
        dispatch({ type: 'REORDER', from, to });
      }
    }
  }

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end overflow-x-auto border-b border-gray-200/60 bg-gray-50/60 scrollbar-none">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
      </DndContext>
    </div>
  );
}
