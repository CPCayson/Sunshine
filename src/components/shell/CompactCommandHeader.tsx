import React from 'react';
import { ChevronDown, Compass, Layers, Terminal } from 'lucide-react';
import {
  ActiveWorkspaceTab,
  WorkspaceFamily,
  UxSMission,
  WorkspaceSelection,
} from '../../types';

interface CompactCommandHeaderProps {
  mission: UxSMission;
  activePrimaryTab: ActiveWorkspaceTab;
  activeSecondaryTab: ActiveWorkspaceTab;
  selection: WorkspaceSelection;
  onOpenMantasScript: (mode?: 'SCRIPT' | 'SEARCH' | 'CLEAN' | 'TRACE' | 'COMPARE') => void;
  onToggleGlobalLens: () => void;
  isGlobalLensOpen: boolean;
  onSelectTab: (tab: ActiveWorkspaceTab, targetPane?: 'PRIMARY' | 'SECONDARY') => void;
  onLaunchEn2501Demo?: () => void;
}

export const CompactCommandHeader: React.FC<CompactCommandHeaderProps> = ({
  mission,
  activePrimaryTab,
  onOpenMantasScript,
  onToggleGlobalLens,
  isGlobalLensOpen,
  onSelectTab,
}) => {
  const [activeFamilyMenu, setActiveFamilyMenu] = React.useState<WorkspaceFamily | null>(null);

  const getFamily = (tab: ActiveWorkspaceTab): WorkspaceFamily => {
    if (tab === 'search' || tab === 'charlie-intake') return 'DISCOVER';
    if (tab === 'projections' || tab === 'destination-compare' || tab === 'comet') return 'DELIVER';
    return 'UNDERSTAND';
  };

  const activeFamily = getFamily(activePrimaryTab);

  const families: Record<WorkspaceFamily, Array<{ id: ActiveWorkspaceTab; label: string }>> = {
    DISCOVER: [
      { id: 'search', label: 'Search' },
      { id: 'charlie-intake', label: 'Charlie Intake' },
    ],
    UNDERSTAND: [
      { id: 'lifecycle', label: 'Lifecycle' },
      { id: 'mission', label: 'Mission' },
      { id: 'graph', label: 'Knowledge Graph' },
      { id: 'map', label: 'Map' },
      { id: 'evidence', label: 'Evidence' },
      { id: 'signal', label: 'Signal' },
      { id: 'rosetta', label: 'Rosetta' },
      { id: 'constellation', label: 'Constellation' },
    ],
    DELIVER: [
      { id: 'projections', label: 'Projections' },
      { id: 'destination-compare', label: 'Destination Compare' },
      { id: 'comet', label: 'CoMET' },
    ],
  };

  const getTabLabel = (tab: ActiveWorkspaceTab) => {
    switch (tab) {
      case 'charlie-intake': return 'Charlie Intake';
      case 'destination-compare': return 'Destination Compare';
      case 'comet': return 'CoMET';
      case 'graph': return 'Knowledge Graph';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  return (
    <header
      id="manta-compact-command-header"
      className="h-12 w-full bg-[#050a12] border-b border-slate-900 px-4 flex items-center justify-between z-40 select-none font-sans"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Compass className="w-4 h-4 text-cyan-300" />
          <span className="text-sm font-semibold text-slate-100 tracking-wide">MANTA</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setActiveFamilyMenu(activeFamilyMenu ? null : activeFamily)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors"
          >
            <span className="font-medium text-slate-100">{getTabLabel(activePrimaryTab)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {activeFamilyMenu && (
            <div className="absolute top-full left-0 mt-2 w-[260px] bg-[#07101d] border border-slate-800 rounded-xl shadow-xl p-2 z-50">
              {(['DISCOVER', 'UNDERSTAND', 'DELIVER'] as WorkspaceFamily[]).map((family) => (
                <div key={family} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-600">{family}</div>
                  <div className="space-y-0.5">
                    {families[family].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id, 'PRIMARY');
                          setActiveFamilyMenu(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          activePrimaryTab === item.id
                            ? 'bg-cyan-950/30 text-cyan-200'
                            : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="hidden md:block text-xs text-slate-600 truncate max-w-[180px]" title={mission.title}>
          {mission.alternateTitle || mission.id}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onOpenMantasScript('SCRIPT')}
          id="mantascript-trigger-btn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60 transition-colors"
          title="Open MANTAScript (Cmd+K)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Command</span>
        </button>

        <button
          onClick={onToggleGlobalLens}
          id="global-lens-toggle-btn"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
            isGlobalLensOpen
              ? 'bg-cyan-950/50 text-cyan-200'
              : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Lens
        </button>
      </div>
    </header>
  );
};
