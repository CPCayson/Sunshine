import React from 'react';
import {
  Maximize2,
  ChevronUp,
  ChevronDown,
  Compass,
  GitFork,
  Activity,
  Languages,
  Layers,
  Send,
  Search,
  FileSpreadsheet,
  Database,
  MapPin,
  Sparkles,
  Workflow
} from 'lucide-react';
import { ActiveWorkspaceTab, PaneId, WorkspaceSelection } from '../../types';

interface CollapsedPaneDockProps {
  paneId: PaneId;
  viewName: ActiveWorkspaceTab;
  selection: WorkspaceSelection;
  findingCount?: number;
  claimCount?: number;
  onRestore: () => void;
  onMaximize: () => void;
  position: 'TOP' | 'BOTTOM';
}

export const CollapsedPaneDock: React.FC<CollapsedPaneDockProps> = ({
  paneId,
  viewName,
  selection,
  findingCount,
  claimCount,
  onRestore,
  onMaximize,
  position,
}) => {
  const getViewIcon = (view: ActiveWorkspaceTab) => {
    switch (view) {
      case 'lifecycle':
        return <Workflow className="w-3.5 h-3.5 text-cyan-400" />;
      case 'graph':
        return <GitFork className="w-3.5 h-3.5 text-purple-400" />;
      case 'map':
        return <MapPin className="w-3.5 h-3.5 text-cyan-400" />;
      case 'mission':
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      case 'charlie-intake':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
      case 'evidence':
        return <Database className="w-3.5 h-3.5 text-blue-400" />;
      case 'signal':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      case 'rosetta':
        return <Languages className="w-3.5 h-3.5 text-pink-400" />;
      case 'projections':
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      case 'comet':
        return <Send className="w-3.5 h-3.5 text-cyan-400" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getViewLabel = (view: ActiveWorkspaceTab) => {
    switch (view) {
      case 'lifecycle': return 'UxS Data Lifecycle & Cockpit';
      case 'graph': return 'Knowledge Graph';
      case 'map': return 'Oceanographic Map';
      case 'mission': return 'Mission Profile';
      case 'charlie-intake': return 'Charlie Intake';
      case 'evidence': return 'Evidence Claims';
      case 'signal': return 'Signal Assurance';
      case 'rosetta': return 'Rosetta Crosswalk';
      case 'projections': return 'Projections';
      case 'comet': return 'CoMET Exchange';
      case 'search': return 'Search';
      default: return view;
    }
  };

  return (
    <div
      onClick={onRestore}
      className={`w-full h-11 bg-[#060d1b] hover:bg-[#09152b] border-y border-cyan-500/30 px-4 flex items-center justify-between cursor-pointer transition-colors select-none font-mono text-xs z-30 group shadow-lg ${
        position === 'TOP' ? 'border-t-0' : 'border-b-0'
      }`}
      title="Click to restore and focus this pane"
    >
      {/* Left: View Identity & Selection Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-slate-200">
          <div className="p-1 rounded bg-[#0b1b36] border border-cyan-500/40">
            {getViewIcon(viewName)}
          </div>
          <span className="font-bold tracking-wide uppercase text-[11px] text-cyan-300">
            {getViewLabel(viewName)}
          </span>
        </div>

        <span className="text-slate-600">·</span>

        {/* Selected Entity / Focus state */}
        <span className="text-slate-300 truncate max-w-[240px]">
          {selection.entityName || selection.canonicalRef || 'REMUS 620 Autonomous Survey'}
        </span>

        {/* Scoped State Indicators */}
        {findingCount !== undefined && findingCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50">
            <span>{findingCount} findings</span>
          </span>
        )}

        {claimCount !== undefined && claimCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
            {claimCount} claims
          </span>
        )}
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors hidden sm:inline">
          Click to restore
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestore();
          }}
          className="p-1 rounded hover:bg-[#112444] text-slate-400 hover:text-cyan-300 transition-colors"
          title="Restore Pane"
        >
          {position === 'TOP' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
          className="p-1 rounded hover:bg-[#112444] text-slate-400 hover:text-cyan-300 transition-colors"
          title="Maximize Pane"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
