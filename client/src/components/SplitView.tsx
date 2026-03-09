import { Group, Panel, Separator } from 'react-resizable-panels';
import type { Tab, TabAction } from '../types/tabs';
import { EditorPane } from './EditorPane';
import { WelcomeScreen } from './WelcomeScreen';

interface SplitViewProps {
  leftTab: Tab | null;
  rightTab: Tab | null;
  dispatch: React.Dispatch<TabAction>;
  rightDispatch: React.Dispatch<TabAction>;
  onLinkClick: (path: string) => void;
  activePaneId: 'left' | 'right';
  onPaneFocus: (pane: 'left' | 'right') => void;
}

export function SplitView({ leftTab, rightTab, dispatch, rightDispatch, onLinkClick, activePaneId, onPaneFocus }: SplitViewProps) {
  return (
    <Group orientation="horizontal" className="h-full">
      <Panel id="split-left" minSize="200px" defaultSize="50%">
        <div
          className={`h-full overflow-hidden rounded-xl backdrop-blur-md bg-white/60 border shadow-sm transition-colors ${
            activePaneId === 'left' ? 'border-orange-300/60' : 'border-white/20'
          }`}
          onMouseDown={() => onPaneFocus('left')}
        >
          {leftTab ? (
            <EditorPane tab={leftTab} dispatch={dispatch} onLinkClick={onLinkClick} />
          ) : (
            <WelcomeScreen />
          )}
        </div>
      </Panel>
      <Separator className="w-1 mx-1 bg-gray-200 hover:bg-orange-400 transition-colors cursor-col-resize" />
      <Panel id="split-right" minSize="200px" defaultSize="50%">
        <div
          className={`h-full overflow-hidden rounded-xl backdrop-blur-md bg-white/60 border shadow-sm transition-colors ${
            activePaneId === 'right' ? 'border-orange-300/60' : 'border-white/20'
          }`}
          onMouseDown={() => onPaneFocus('right')}
        >
          {rightTab ? (
            <EditorPane tab={rightTab} dispatch={rightDispatch} onLinkClick={onLinkClick} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm select-none">
              Click to focus · open a file from sidebar
            </div>
          )}
        </div>
      </Panel>
    </Group>
  );
}
