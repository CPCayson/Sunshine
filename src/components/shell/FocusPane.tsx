import React, { useState } from 'react';
import {
  ActiveWorkspaceTab,
  PaneId,
  WorkspaceSelection,
  UxSMission
} from '../../types';
import {
  Maximize2,
  Minimize2,
  MinusSquare,
  Layers,
  Sparkles,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { PaneLens } from './PaneLens';

interface FocusPaneProps {
  id: PaneId;
  title: string;
  activeTab: ActiveWorkspaceTab;
  isFocused: boolean;
  isMaximized: boolean;
  heightPercent: number;
  mission: UxSMission;
  selection: WorkspaceSelection;
  onActivate: () => void;
  onMaximizeToggle: () => void;
  onSwitchTab: (tab: ActiveWorkspaceTab) => void;
  onSuggestCompanion?: (tab: ActiveWorkspaceTab) => void;
  children: React.ReactNode;
}

export const FocusPane: React.FC<FocusPaneProps> = ({
  id,
  title,
  activeTab,
  isFocused,
  isMaximized,
  heightPercent,
  mission,
  selection,
  onActivate,
  onMaximizeToggle,
  onSwitchTab,
  onSuggestCompanion,
  children,
}) => {
  const [isLocalLensOpen, setIsLocalLensOpen] = useState(false);

  // Suggested companions for smart pairing without auto-switching
  const getCompanionSuggestion = (): { tab: ActiveWorkspaceTab; label: string } | null => {
    switch (activeTab) {
      case 'lifecycle':
        return { tab: 'graph', label: 'Knowledge Graph' };
      case 'graph':
        return { tab: 'map', label: 'Map' };
      case 'charlie-intake':
        return { tab: 'mission', label: 'Accepted Mission' };
      case 'evidence':
        return { tab: 'signal', label: 'Signal' };
      case 'mission':
        return { tab: 'rosetta', label: 'Rosetta' };
      case 'projections':
        return { tab: 'map', label: 'Map' };
      default:
        return null;
    }
  };

  const companion = getCompanionSuggestion();

  return (
    <section
      id={`focus-pane-${id.toLowerCase()}`}
      onClick={onActivate}
      style={{
        height: `${heightPercent}%`,
        transition: 'height 220ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className={`relative w-full flex flex-col overflow-hidden bg-[#060b14] border-cyan-500/20 ${
        isFocused ? 'ring-1 ring-cyan-500/40 z-10' : 'opacity-95'
      }`}
    >
      {/* Subtle Pane Toolbar / Header */}
      <div className="h-7 px-3 bg-[#060d19] border-b border-cyan-500/15 flex items-center justify-between font-mono text-xs select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {title}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            ({activeTab})
          </span>

          {/* Smart Companion Pair Hint */}
          {companion && onSuggestCompanion && id === 'PRIMARY' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSuggestCompanion(companion.tab);
              }}
              className="ml-3 text-[10px] text-cyan-400/80 hover:text-cyan-300 hover:underline flex items-center gap-1 font-sans"
              title={`Open ${companion.label} in companion pane`}
            >
              <span>Pair with {companion.label} below →</span>
            </button>
          )}
        </div>

        {/* Right Pane Controls: Local Lens + Maximize */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLocalLensOpen(!isLocalLensOpen);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors border ${
              isLocalLensOpen
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/60'
            }`}
            title="Toggle Local Contextual Pane Lens"
          >
            <Layers className="w-3 h-3" />
            <span>Lens</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximizeToggle();
            }}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition-colors"
            title={isMaximized ? 'Restore Split' : 'Maximize Pane'}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Pane Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>

        {/* Local Slide-over Lens */}
        <PaneLens
          isOpen={isLocalLensOpen}
          onClose={() => setIsLocalLensOpen(false)}
          paneView={activeTab}
          selection={selection}
          mission={mission}
          onNavigateTab={onSwitchTab}
        />
      </div>
    </section>
  );
};
