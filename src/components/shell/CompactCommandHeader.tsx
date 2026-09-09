import React from 'react';
import {
  ChevronDown,
  Compass,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
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
  selection,
  onOpenMantasScript,
  onToggleGlobalLens,
  isGlobalLensOpen,
  onSelectTab,
  onLaunchEn2501Demo,
}) => {
  const [activeFamilyMenu, setActiveFamilyMenu] = React.useState<WorkspaceFamily | null>(null);

  const getFamily = (tab: ActiveWorkspaceTab): WorkspaceFamily => {
    if (tab === 'search' || tab === 'charlie-intake') return 'DISCOVER';
    if (tab === 'projections' || tab === 'destination-compare' || tab === 'comet') return 'DELIVER';
    return 'UNDERSTAND';
  };

  const activeFamily = getFamily(activePrimaryTab);

  const families: Record<WorkspaceFamily, Array<{ id: ActiveWorkspaceTab; label: string; desc: string }>> = {
    DISCOVER: [
      { id: 'search', label: 'Federated Search', desc: 'Find external and internal evidence' },
      { id: 'charlie-intake', label: 'Charlie Intake', desc: 'Form / sheet source adapter' },
    ],
    UNDERSTAND: [
      { id: 'lifecycle', label: 'Lifecycle', desc: 'State, guards and readiness' },
      { id: 'mission', label: 'Mission', desc: 'Accepted mission meaning' },
      { id: 'graph', label: 'Knowledge Graph', desc: 'Entities and relationships' },
      { id: 'map', label: 'Map', desc: 'Tracks and spatial context' },
      { id: 'evidence', label: 'Evidence', desc: 'Observations, claims and decisions' },
      { id: 'signal', label: 'Signal', desc: 'Assurance findings' },
      { id: 'rosetta', label: 'Rosetta', desc: 'Semantic crosswalks' },
      { id: 'constellation', label: 'Constellation', desc: 'Explainable similarity' },
    ],
    DELIVER: [
      { id: 'projections', label: 'Projections', desc: 'ISO, STAC and DCAT' },
      { id: 'destination-compare', label: 'Destination Compare', desc: 'OneStop / CMR observations' },
      { id: 'comet', label: 'CoMET Companion', desc: 'Metadata-authority companion' },
    ],
  };

  const getTabLabel = (tab: ActiveWorkspaceTab) => {
    switch (tab) {
      case 'lifecycle': return 'Lifecycle';
      case 'charlie-intake': return 'Charlie Intake';
      case 'destination-compare': return 'Destination Compare';
      case 'comet': return 'CoMET Companion';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  return (
    <header
      id="manta-compact-command-header"
      className="h-14 w-full bg-[#050b16] border-b border-slate-800 px-5 flex items-center justify-between z-40 select-none font-sans"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/30 border border-cyan-500/25 flex items-center justify-center">
            <Compass className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">MANTA</div>
            <div className="text-[10px] text-slate-600">UxS assurance workbench</div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div className="relative shrink-0">
          <button
            onClick={() => setActiveFamilyMenu(activeFamilyMenu ? null : activeFamily)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <span className="text-slate-500">{activeFamily}</span>
            <span className="font-medium text-slate-100">{getTabLabel(activePrimaryTab)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {activeFamilyMenu && (
            <div className="absolute top-full left-0 mt-2 w-[340px] bg-[#081122] border border-slate-700 rounded-2xl shadow-2xl p-3 z-50">
              {(['DISCOVER', 'UNDERSTAND', 'DELIVER'] as WorkspaceFamily[]).map((family) => (
                <div key={family} className="py-2 first:pt-0 last:pb-0">
                  <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.14em] text-slate-600">{family}</div>
                  <div className="space-y-1">
                    {families[family].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id, 'PRIMARY');
                          setActiveFamilyMenu(null);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                          activePrimaryTab === item.id
                            ? 'bg-cyan-950/30 text-cyan-200'
                            : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'
                        }`}
                      >
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block min-w-0 border-l border-slate-800 pl-4">
          <div className="text-xs text-slate-500 truncate max-w-[220px]" title={mission.title}>
            {mission.alternateTitle || mission.id}
          </div>
          {selection.entityName && (
            <div className="text-xs text-emerald-300/80 truncate max-w-[240px] mt-0.5" title={selection.entityName}>
              {selection.entityName}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onLaunchEn2501Demo && (
          <button
            onClick={onLaunchEn2501Demo}
            id="en2501-flagship-demo-btn"
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-700/40 bg-emerald-950/20 text-xs text-emerald-300 hover:bg-emerald-900/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            EN2501
          </button>
        )}

        <button
          onClick={() => onOpenMantasScript('SCRIPT')}
          id="mantascript-trigger-btn"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a1528] hover:bg-[#0e1e38] border border-slate-700 text-xs text-slate-300 hover:text-cyan-200 transition-colors"
          title="Open MANTAScript Canvas (Cmd+K)"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">MANTAScript</span>
        </button>

        <button
          onClick={onToggleGlobalLens}
          id="global-lens-toggle-btn"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors border ${
            isGlobalLensOpen
              ? 'bg-cyan-600 text-slate-950 border-cyan-400'
              : 'bg-[#0a1528] text-slate-300 hover:text-cyan-200 border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Lens
        </button>
      </div>
    </header>
  );
};
