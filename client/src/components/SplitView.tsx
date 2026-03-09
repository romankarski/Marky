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
}

export function SplitView({ leftTab, rightTab, dispatch, rightDispatch, onLinkClick }: SplitViewProps) {
  return (
    <Group orientation="horizontal" className="h-full">
      <Panel id="split-left" minSize="200px" defaultSize="50%">
        <div className="h-full overflow-hidden rounded-xl backdrop-blur-md bg-white/60 border border-white/20 shadow-sm">
          {leftTab ? (
            <EditorPane tab={leftTab} dispatch={dispatch} onLinkClick={onLinkClick} />
          ) : (
            <WelcomeScreen />
          )}
        </div>
      </Panel>
      <Separator className="w-1 mx-1 bg-gray-200 hover:bg-orange-400 transition-colors cursor-col-resize" />
      <Panel id="split-right" minSize="200px" defaultSize="50%">
        <div className="h-full overflow-hidden rounded-xl backdrop-blur-md bg-white/60 border border-white/20 shadow-sm">
          {rightTab ? (
            <EditorPane tab={rightTab} dispatch={rightDispatch} onLinkClick={onLinkClick} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Open a file
            </div>
          )}
        </div>
      </Panel>
    </Group>
  );
}
