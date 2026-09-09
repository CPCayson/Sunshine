import React from 'react';
import {
  Compass,
  FileCode2,
  GitFork,
  Activity,
  Languages,
  Layers,
  Send,
  Search,
  Lock,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Database,
  FileSpreadsheet,
  Share2
} from 'lucide-react';
import { ActiveWorkspaceTab, UxSMission } from '../types';
import { CometOperationMode } from '../services/cometAdapter';

interface TopNavProps {
  mission: UxSMission;
  activeTab: ActiveWorkspaceTab;
  onChangeTab: (tab: ActiveWorkspaceTab) => void;
  cometMode: CometOperationMode;
  onChangeCometMode: (mode: CometOperationMode) => void;
  onToggleLensPanel: () => void;
  isLensPanelOpen: boolean;
  activeLensTab: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  mission,
  activeTab,
  onChangeTab,
  cometMode,
  onChangeCometMode,
  onToggleLensPanel,
  isLensPanelOpen,
}) => {
  const statuses = mission.authorityStatuses || {
    missionCoverage: mission.conformanceScore || 86,
    isoState: 'READY',
    isoErrorsCount: 0,
    cometState: 'NOT VALIDATED',
    stacState: 'READY',
    oissState: 'NOT TESTED',
    mode: cometMode,
  };

  const navItems: Array<{ id: ActiveWorkspaceTab; label: string; icon: React.ReactNode }> = [
    { id: 'search', label: 'Search', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'charlie-intake', label: 'Charlie Intake', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'mission', label: 'Mission', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'evidence', label: 'Evidence', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'graph', label: 'Graph', icon: <GitFork className="w-3.5 h-3.5" /> },
    { id: 'constellation', label: 'Constellation', icon: <Share2 className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'signal', label: 'Signal', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'rosetta', label: 'Rosetta', icon: <Languages className="w-3.5 h-3.5" /> },
    { id: 'projections', label: 'Projections', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'comet', label: 'CoMET', icon: <Send className="w-3.5 h-3.5" /> },
  ];

  return (
    <header id="manta-top-nav" className="w-full bg-[#070d19]/95 border-b border-cyan-500/20 px-3.5 py-2 flex flex-col gap-2 sticky top-0 z-50 backdrop-blur-md">
      {/* Top Row: System Identity, Mission Context, Scoped Authorities, Lens Drawer Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: MANTAS Workbench Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-900/60 to-blue-950/80 border border-cyan-500/40 shadow-inner">
            <Compass className="w-4 h-4 text-cyan-300" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                MANTA LENS
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                NOAA UxS Workbench
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[240px] sm:max-w-[360px]">
              <span className="text-cyan-400 font-semibold">{mission.id}</span>
              <span className="text-slate-500 mx-1.5">|</span>
              <span className="text-slate-300">{mission.platform.name}</span>
            </p>
          </div>
        </div>

        {/* Center: Scoped Authority Indicators (Mandated: Never a single global PASS) */}
        <div id="scoped-authority-bar" className="hidden md:flex items-center gap-2 text-[11px] font-mono bg-[#050914] border border-cyan-500/20 rounded-lg px-2.5 py-1">
          {/* Mission Coverage */}
          <div className="flex items-center gap-1.5 px-1.5 border-r border-slate-800">
            <span className="text-slate-400">Mission</span>
            <span className="text-cyan-300 font-semibold">{statuses.missionCoverage}% profile</span>
          </div>

          {/* ISO */}
          <div className="flex items-center gap-1.5 px-1.5 border-r border-slate-800">
            <span className="text-slate-400">ISO</span>
            <span className={`px-1 rounded text-[10px] font-semibold ${
              statuses.isoState === 'READY'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
            }`}>
              {statuses.isoState}
            </span>
          </div>

          {/* CoMET */}
          <div className="flex items-center gap-1.5 px-1.5 border-r border-slate-800">
            <span className="text-slate-400">CoMET</span>
            <span className="px-1 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/50">
              {statuses.cometState}
            </span>
          </div>

          {/* STAC */}
          <div className="flex items-center gap-1.5 px-1.5 border-r border-slate-800">
            <span className="text-slate-400">STAC</span>
            <span className="px-1 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
              {statuses.stacState}
            </span>
          </div>

          {/* OISS */}
          <div className="flex items-center gap-1.5 px-1.5">
            <span className="text-slate-400">OISS</span>
            <span className="px-1 rounded text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-700/50">
              {statuses.oissState}
            </span>
          </div>
        </div>

        {/* Right: Operational Mode Selector & Lens Panel Toggle */}
        <div className="flex items-center gap-2">
          {/* Mode Pill */}
          <div className="flex items-center bg-[#09101f] border border-cyan-500/25 rounded-md px-2 py-0.5 text-[11px] font-mono">
            <Lock className="w-3 h-3 text-cyan-400 mr-1.5" />
            <select
              id="operational-mode-select"
              value={cometMode}
              onChange={(e) => onChangeCometMode(e.target.value as CometOperationMode)}
              className="bg-transparent text-cyan-300 outline-none cursor-pointer text-[11px] font-mono"
            >
              <option value="READ_ONLY" className="bg-[#0b1320] text-cyan-200">
                READ ONLY
              </option>
              <option value="DEV_DRAFT_AUTHORIZED" className="bg-[#0b1320] text-amber-300">
                DEV DRAFT AUTH
              </option>
              <option value="PRODUCTION_WRITE_DISABLED" className="bg-[#0b1320] text-rose-300">
                PROD WRITE DISABLED
              </option>
            </select>
          </div>

          {/* Right Lens Panel Dock Toggle */}
          <button
            id="toggle-lens-panel-btn"
            onClick={onToggleLensPanel}
            title="Toggle Right Lens Inspection Workspace"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
              isLensPanelOpen
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                : 'bg-[#091120] text-slate-300 border-cyan-500/25 hover:bg-[#0f1d33]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Lens</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: The Required TOP NAV Tabs (Search | Mission | Evidence | Graph | Signal | Rosetta | Projections | CoMET) */}
      <nav id="canonical-workbench-nav" className="flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-1.5 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1628]/60 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-cyan-300' : 'text-slate-500'}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'evidence' && (mission.claims?.length || 0) > 0 && (
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 ml-0.5">
                  {mission.claims?.length}
                </span>
              )}
              {item.id === 'signal' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

