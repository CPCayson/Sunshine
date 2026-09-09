import React from 'react';
import {
  Compass,
  ChevronRight,
  ChevronDown,
  Terminal,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
  GitFork,
  Database,
  FileSpreadsheet,
  Activity,
  Languages,
  Send,
  Minimize2,
  Maximize2
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  WorkspaceFamily,
  UxSMission,
  WorkspaceSelection
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
  activeSecondaryTab,
  selection,
  onOpenMantasScript,
  onToggleGlobalLens,
  isGlobalLensOpen,
  onSelectTab,
  onLaunchEn2501Demo,
}) => {
  const [activeFamilyMenu, setActiveFamilyMenu] = React.useState<WorkspaceFamily | null>(null);

  // Determine which family activePrimaryTab belongs to
  const getFamily = (tab: ActiveWorkspaceTab): WorkspaceFamily => {
    if (tab === 'search' || tab === 'charlie-intake') return 'DISCOVER';
    if (tab === 'projections' || tab === 'comet') return 'DELIVER';
    return 'UNDERSTAND';
  };

  const activeFamily = getFamily(activePrimaryTab);

  const families: Record<WorkspaceFamily, Array<{ id: ActiveWorkspaceTab; label: string; desc: string }>> = {
    DISCOVER: [
      { id: 'search', label: 'Federated Search', desc: 'CoMET, OneStop, STAC, DocuComp' },
      { id: 'charlie-intake', label: 'Charlie Intake', desc: '25-column Google Form adapter' },
    ],
    UNDERSTAND: [
      { id: 'lifecycle', label: 'UxS Lifecycle & Cockpit', desc: 'Acquire → Observe → Reconcile → Accept → Assure → Project → Handoff' },
      { id: 'mission', label: 'Mission Metadata', desc: 'Core ISO profile, platform, sensors' },
      { id: 'graph', label: 'Knowledge Graph', desc: 'Entity-relationship topology' },
      { id: 'map', label: 'SpatioTemporal Map', desc: 'Geodesic bounds & dive tracks' },
      { id: 'evidence', label: 'Evidence & Claims', desc: 'First-class source observations' },
      { id: 'signal', label: 'Signal Assurance', desc: 'Three-tier conformance engine' },
      { id: 'rosetta', label: 'Rosetta Crosswalk', desc: 'Multi-authority semantic translation' },
      { id: 'constellation', label: 'Constellation', desc: 'Corpus entity identity clusters' },
    ],
    DELIVER: [
      { id: 'projections', label: 'Multi-Projections', desc: 'ISO 19115-2, STAC, DCAT, OISS' },
      { id: 'destination-compare', label: 'Destination Compare', desc: 'OneStop ↔ CMR Parity & Reconciliation' },
      { id: 'comet', label: 'CoMET Companion', desc: 'CEDIT upstream synchronization' },
    ],
  };

  const getTabLabel = (tab: ActiveWorkspaceTab) => {
    switch (tab) {
      case 'lifecycle': return 'Lifecycle & Cockpit';
      case 'search': return 'Search';
      case 'charlie-intake': return 'Charlie Intake';
      case 'mission': return 'Mission';
      case 'graph': return 'Graph';
      case 'map': return 'Map';
      case 'evidence': return 'Evidence';
      case 'signal': return 'Signal';
      case 'rosetta': return 'Rosetta';
      case 'constellation': return 'Constellation';
      case 'projections': return 'Projections';
      case 'destination-compare': return 'Destination Compare';
      case 'comet': return 'CoMET Companion';
      default: return tab;
    }
  };

  return (
    <header
      id="manta-compact-command-header"
      className="w-full bg-[#050b16] border-b border-cyan-500/20 px-4 py-2 flex items-center justify-between z-40 select-none font-sans"
    >
      {/* Left: Brand + Interactive Breadcrumb Navigation */}
      <div className="flex items-center gap-3">
        {/* Brand Mark */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-900/80 to-blue-950 border border-cyan-500/40 flex items-center justify-center shadow-inner">
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <span className="font-mono font-bold text-xs tracking-wider text-slate-100 uppercase">
            MANTA
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Breadcrumb Group Switcher */}
        <div className="flex items-center text-xs font-mono">
          {/* Workspace Family Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setActiveFamilyMenu(activeFamilyMenu ? null : activeFamily)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-[#0a1528] transition-colors font-semibold uppercase tracking-wider text-[11px]"
            >
              <span>{activeFamily}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeFamilyMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 w-64 bg-[#081122] border border-cyan-500/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setActiveFamilyMenu(null)}
              >
                <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 mb-1">
                  Select Workspace
                </div>
                {(['DISCOVER', 'UNDERSTAND', 'DELIVER'] as WorkspaceFamily[]).map((fam) => (
                  <div key={fam} className="mb-2 last:mb-0">
                    <div className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 tracking-wider">
                      {fam}
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {families[fam].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id, 'PRIMARY');
                            setActiveFamilyMenu(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                            activePrimaryTab === item.id
                              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/50'
                              : 'text-slate-300 hover:bg-[#0d1c34] hover:text-slate-100'
                          }`}
                        >
                          <span className="font-semibold">{item.label}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[110px]">
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 mx-1" />

          {/* Primary View */}
          <span className="text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
            {getTabLabel(activePrimaryTab)}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 mx-1" />

          {/* Mission Context */}
          <span className="text-slate-300 font-medium truncate max-w-[140px] sm:max-w-[200px]" title={mission.title}>
            {mission.alternateTitle || mission.id}
          </span>

          {/* Contextual Target Selection if present */}
          {selection.entityName && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 mx-1" />
              <span className="text-emerald-400 font-semibold truncate max-w-[120px]" title={selection.entityName}>
                {selection.entityName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Quick Action Triggers (EN2501 Demo, MANTAScript, Clean, Lens) */}
      <div className="flex items-center gap-2">
        {/* EN2501 Flagship Demo Trigger */}
        {onLaunchEn2501Demo && (
          <button
            onClick={onLaunchEn2501Demo}
            id="en2501-flagship-demo-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-xs font-mono text-emerald-300 transition-all shadow-sm"
            title="Launch Flagship Demo: CoMET Inspection → Destination Reconciliation → OISS Hand-off Profile"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">EN2501 Demo</span>
          </button>
        )}

        {/* MANTAScript Quick-Bar Prompt Trigger */}
        <button
          onClick={() => onOpenMantasScript('SCRIPT')}
          id="mantascript-trigger-btn"
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0a1528] hover:bg-[#0e1e38] border border-cyan-500/30 text-xs font-mono text-slate-300 hover:text-cyan-200 transition-all shadow-sm group"
          title="Open MANTAScript Canvas (Cmd+K)"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-semibold">MANTAScript</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-[#060b14] border border-slate-700 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Fast Clean Trigger */}
        <button
          onClick={() => onOpenMantasScript('CLEAN')}
          className="px-2.5 py-1 rounded-lg bg-[#081222] hover:bg-[#0c1a32] border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          title="Surface Clean (Collapse resolved, normalize chrome)"
        >
          Clean
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Global Lens Toggle */}
        <button
          onClick={onToggleGlobalLens}
          id="global-lens-toggle-btn"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
            isGlobalLensOpen
              ? 'bg-cyan-600 text-slate-950 font-bold border-cyan-400 shadow'
              : 'bg-[#0a1528] text-slate-300 hover:text-cyan-200 border-cyan-500/30'
          }`}
          title="Toggle Global Contextual Lens (Cross-pane evidence & authority)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Lens</span>
        </button>
      </div>
    </header>
  );
};
