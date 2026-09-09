import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Terminal,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Database,
  GitFork,
  MapPin,
  FileSpreadsheet,
  Activity,
  Languages,
  Send,
  Eye,
  GitBranch,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Cpu,
  Box,
  Compass
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  UxSMission,
  WorkspaceSelection,
  FederatedSearchResult,
  CorpusCapabilityQuery
} from '../../types';
import { SEED_FEDERATED_SEARCH_RESULTS } from '../../data/evidenceAndClaims';
import {
  getCorpusDeterministicQueries,
  executeCorpusCapabilityQuery
} from '../../services/identityResolutionService';

export type MantasScriptMode = 'SCRIPT' | 'SEARCH' | 'CLEAN' | 'TRACE' | 'COMPARE';

interface MantaScriptCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: MantasScriptMode;
  mission: UxSMission;
  selection: WorkspaceSelection;
  activePrimaryTab: ActiveWorkspaceTab;
  activeSecondaryTab: ActiveWorkspaceTab;
  onExecuteCommand: (command: string) => void;
  onSelectSearchResult: (result: FederatedSearchResult) => void;
  onOpenWorkspaceBelow: (tab: ActiveWorkspaceTab) => void;
  onSelectPrimaryWorkspace: (tab: ActiveWorkspaceTab) => void;
}

export const MantaScriptCanvas: React.FC<MantaScriptCanvasProps> = ({
  isOpen,
  onClose,
  initialMode = 'SCRIPT',
  mission,
  selection,
  activePrimaryTab,
  activeSecondaryTab,
  onExecuteCommand,
  onSelectSearchResult,
  onOpenWorkspaceBelow,
  onSelectPrimaryWorkspace,
}) => {
  const [mode, setMode] = useState<MantasScriptMode>(initialMode);
  const [query, setQuery] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [activeDeterministicQuery, setActiveDeterministicQuery] = useState<CorpusCapabilityQuery | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const deterministicQueries = useMemo(() => getCorpusDeterministicQueries(), []);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setCommandFeedback(null);
      setActiveDeterministicQuery(null);
    }
  }, [isOpen]);

  // Search execution against FEDERATED_SEARCH_INDEX
  const searchResults = useMemo(() => {
    if (!query.trim() || mode !== 'SEARCH') return [];
    const q = query.toLowerCase();
    return SEED_FEDERATED_SEARCH_RESULTS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.authority && item.authority.toLowerCase().includes(q))
    );
  }, [query, mode]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAction(query);
    }
  };

  const executeDeterministic = (qId: string) => {
    const res = executeCorpusCapabilityQuery(qId);
    if (res) {
      setActiveDeterministicQuery(res);
      setCommandFeedback(`✓ Deterministic Graph Query executed: "${res.question}"`);
    }
  };

  const runAction = (rawCmd: string) => {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;

    // Check for deterministic graph queries first
    if (cmd.includes('carried sas') || cmd.includes('assets have actually carried sas')) {
      executeDeterministic('query-assets-carried-sas');
      return;
    }

    if (
      cmd.includes('datasets trace') ||
      cmd.includes('datasets to instrument') ||
      cmd.includes('datasets trace to a physical instrument')
    ) {
      executeDeterministic('query-datasets-trace-instrument-instance');
      return;
    }

    if (cmd.includes('seafloor mapping') || cmd.includes('support seafloor mapping')) {
      executeDeterministic('query-platforms-seafloor-mapping');
      return;
    }

    if (cmd.includes('observe bathymetry') || cmd.includes('instruments can observe bathymetry')) {
      executeDeterministic('query-instruments-observe-bathymetry');
      return;
    }

    if (cmd.includes('remus produced datasets') || cmd.includes('produced datasets')) {
      executeDeterministic('query-remus-produced-datasets');
      return;
    }

    if (cmd.includes('unresolved identity') || cmd.includes('unresolved assets')) {
      executeDeterministic('query-unresolved-identity');
      return;
    }

    if (cmd.includes('sensors configured') || cmd.includes('sensors are configured on remus')) {
      executeDeterministic('query-sensors-configured-remus6401');
      return;
    }

    if (cmd.startsWith('search ')) {
      const term = cmd.replace('search ', '').trim();
      setMode('SEARCH');
      setQuery(term);
      return;
    }

    if (cmd === 'clean' || cmd === 'clean this view' || cmd === 'clean surface') {
      onExecuteCommand('CLEAN');
      setCommandFeedback('✓ Surface cleaned: Collapsed resolved sections, normalized layout padding.');
      setTimeout(() => onClose(), 1200);
      return;
    }

    if (cmd === 'open tree' || cmd === 'tree' || cmd === 'knowledge tree' || cmd === 'open knowledge tree') {
      onSelectPrimaryWorkspace('knowledge-tree');
      onClose();
      return;
    }

    if (cmd === 'open tree below' || cmd === 'tree below' || cmd === 'knowledge tree below') {
      onOpenWorkspaceBelow('knowledge-tree');
      onClose();
      return;
    }

    if (cmd === 'open graph' || cmd === 'graph') {
      onSelectPrimaryWorkspace('graph');
      onClose();
      return;
    }

    if (cmd === 'open map' || cmd === 'map') {
      onSelectPrimaryWorkspace('map');
      onClose();
      return;
    }

    if (cmd === 'open map below' || cmd === 'map below') {
      onOpenWorkspaceBelow('map');
      onClose();
      return;
    }

    if (cmd === 'open stac below' || cmd === 'stac below') {
      onOpenWorkspaceBelow('projections');
      onClose();
      return;
    }

    if (cmd === 'open mission below' || cmd === 'mission below') {
      onOpenWorkspaceBelow('mission');
      onClose();
      return;
    }

    if (cmd === 'swap' || cmd === 'swap panes') {
      onExecuteCommand('SWAP_PANES');
      onClose();
      return;
    }

    if (cmd === 'focus bottom' || cmd === 'focus secondary') {
      onExecuteCommand('FOCUS_SECONDARY');
      onClose();
      return;
    }

    if (cmd === 'focus top' || cmd === 'focus primary') {
      onExecuteCommand('FOCUS_PRIMARY');
      onClose();
      return;
    }

    if (cmd === 'compare charlie' || cmd === 'compare charlie to canonical') {
      onSelectPrimaryWorkspace('charlie-intake');
      onOpenWorkspaceBelow('mission');
      onClose();
      return;
    }

    if (
      cmd === 'compare onestop and cmr' ||
      cmd === 'compare destinations' ||
      cmd === 'destination compare' ||
      cmd === 'compare onestop cmr'
    ) {
      onSelectPrimaryWorkspace('destination-compare');
      onClose();
      return;
    }

    if (
      cmd === 'why is oiss handoff not ready' ||
      cmd === 'oiss handoff' ||
      cmd === 'oiss readiness' ||
      cmd === 'check oiss'
    ) {
      onSelectPrimaryWorkspace('lifecycle');
      onOpenWorkspaceBelow('destination-compare');
      onClose();
      return;
    }

    if (cmd === 'comet companion' || cmd === 'open comet') {
      onSelectPrimaryWorkspace('comet');
      onClose();
      return;
    }

    // Default fallback: pass to generic executor
    onExecuteCommand(rawCmd);
    setCommandFeedback(`Executing MANTAScript directive: "${rawCmd}"`);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div
      id="mantascript-canvas-overlay"
      className="fixed inset-0 z-50 bg-[#030711]/92 backdrop-blur-xl flex flex-col font-mono text-slate-100 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Quiet Bar */}
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-cyan-500/20 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-300 font-bold tracking-widest uppercase">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>MANTAScript</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-sans">
            Surface Workbench Execution Canvas & Deterministic Queries
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">ESC</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Large Central Area */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 max-w-4xl mx-auto w-full overflow-y-auto">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 mb-6 select-none mt-2">
          {(['SCRIPT', 'TRACE', 'SEARCH', 'CLEAN', 'COMPARE'] as MantasScriptMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                if (m === 'TRACE' && !activeDeterministicQuery) {
                  executeDeterministic('query-assets-carried-sas');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                mode === m
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                  : 'bg-[#060e1c] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Primary Command Input Bar */}
        <div className="w-full relative shadow-2xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">
            {mode === 'SEARCH' ? <Search className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'SEARCH'
                ? 'Type to search records, models, platforms, and STAC assets (e.g. "REMUS 620")...'
                : mode === 'TRACE'
                ? 'Ask deterministic graph query (e.g. "Which physical assets have actually carried SAS?")...'
                : 'Enter MANTAScript command (e.g. "open tree", "Which physical assets have actually carried SAS?", "clean")...'
            }
            className="w-full pl-12 pr-28 py-4 bg-[#060c18] border-2 border-cyan-500/50 focus:border-cyan-400 rounded-2xl text-base sm:text-lg text-slate-100 placeholder-slate-500 font-mono outline-none shadow-2xl transition-all"
          />

          <button
            onClick={() => runAction(query)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md flex items-center gap-1.5"
          >
            <span>Run</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Command Feedback Toast */}
        {commandFeedback && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono animate-in fade-in flex items-center justify-between w-full">
            <span>{commandFeedback}</span>
            <button
              onClick={() => setCommandFeedback(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Deterministic Query Explainable Path Result View */}
        {activeDeterministicQuery && (
          <div className="w-full mt-6 bg-[#061022] border-2 border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono text-[10px] font-bold">
                    DETERMINISTIC GRAPH QUERY: {activeDeterministicQuery.category}
                  </span>
                  <span className="text-slate-500 text-xs">· Exact Edge Traversal</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1 font-sans">
                  {activeDeterministicQuery.question}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Rationale: <span className="text-slate-300">{activeDeterministicQuery.rationale}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveDeterministicQuery(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Traversal Results with Explainable Paths */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                Graph Traversal Proof Results ({activeDeterministicQuery.results.length})
              </div>

              {activeDeterministicQuery.results.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#040914] border border-cyan-500/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-100 font-sans flex items-center gap-2">
                        <span>{res.title}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                          {res.maturity}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-300/90 font-mono mt-0.5">
                        {res.subtitle}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectPrimaryWorkspace('knowledge-tree');
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800 text-xs font-mono transition-colors flex items-center gap-1"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>Focus in Tree</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPrimaryWorkspace('graph');
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-emerald-300 border border-emerald-800 text-xs font-mono transition-colors flex items-center gap-1"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Trace in Graph</span>
                      </button>
                    </div>
                  </div>

                  {/* Explainable Path Step-by-Step Visualization */}
                  <div className="p-3 rounded-lg bg-[#071326] border border-slate-800 space-y-1.5 font-mono text-xs">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Explainable Path through Knowledge Graph ({res.explanationPath.length} hops):</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {res.explanationPath.map((step, sIdx) => {
                        const isLast = sIdx === res.explanationPath.length - 1;
                        return (
                          <div key={sIdx} className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-500 text-[10px] w-4">{sIdx + 1}.</span>
                            <span className={isLast ? 'text-cyan-200 font-bold' : 'text-slate-300'}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evidence refs */}
                  {res.evidenceRefs && res.evidenceRefs.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>Source Evidence:</span>
                      {res.evidenceRefs.map((ref, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-1.5 py-0.5 rounded bg-[#081224] border border-amber-500/30 text-amber-300"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Deterministic Graph Queries Catalog (Always visible in TRACE or when browsing) */}
        <div className="w-full mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Deterministic Graph Queries (Explainable Path Traverse)</span>
            </span>
            <span className="text-slate-500 text-[10px]">Click any query to run</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {deterministicQueries.map((dq) => (
              <div
                key={dq.id}
                onClick={() => executeDeterministic(dq.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-left space-y-1 ${
                  activeDeterministicQuery?.id === dq.id
                    ? 'bg-[#081730] border-cyan-400 text-cyan-200 shadow-md'
                    : 'bg-[#050c1b] hover:bg-[#071328] border-slate-800 hover:border-cyan-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#040814] text-cyan-400 border border-slate-800 font-mono font-bold">
                    {dq.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dq.results.length} results
                  </span>
                </div>
                <div className="text-xs font-bold font-sans text-slate-100">
                  {dq.question}
                </div>
                <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                  {dq.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Search Results (if SEARCH mode) */}
        {mode === 'SEARCH' && searchResults.length > 0 && (
          <div className="w-full mt-6 max-h-[40vh] overflow-y-auto space-y-2 pr-1 no-scrollbar">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
              Command Result Stream ({searchResults.length} matches)
            </div>
            {searchResults.map((res) => (
              <div
                key={res.id}
                onClick={() => {
                  onSelectSearchResult(res);
                  onClose();
                }}
                className="p-3 bg-[#071122] hover:bg-[#0b1b36] border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#040812] text-cyan-300 border border-slate-800">
                      {res.authority}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{res.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans truncate max-w-xl">
                    {res.subtitle || res.metadataSummary?.platform || res.identifier || 'UXS Observation Record'}
                  </div>
                </div>

                <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 shrink-0">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Context Information & Quick Operational Scripts */}
        <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="p-3.5 bg-[#050b18] border border-slate-800/80 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Surface Pairings
            </div>
            <div className="space-y-1 text-[11px] font-sans">
              <div
                onClick={() => runAction('open tree')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-cyan-300 font-bold">open tree</code> (Knowledge Tree Projection)
              </div>
              <div
                onClick={() => runAction('Which physical assets have actually carried SAS?')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-slate-300">assets carried SAS</code>
              </div>
              <div
                onClick={() => runAction('Which datasets trace to a physical instrument instance?')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-slate-300">datasets trace to instrument</code>
              </div>
              <div
                onClick={() => runAction('open map below')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-slate-300">open map below</code>
              </div>
              <div
                onClick={() => runAction('compare OneStop and CMR')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-cyan-300 font-bold">compare OneStop and CMR</code>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#050b18] border border-slate-800/80 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Focus & Layout
            </div>
            <div className="space-y-1 text-[11px] font-sans">
              <div
                onClick={() => runAction('swap panes')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-slate-300">swap panes</code>
              </div>
              <div
                onClick={() => runAction('focus bottom')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-slate-300">focus bottom</code>
              </div>
              <div
                onClick={() => runAction('clean this view')}
                className="cursor-pointer hover:text-cyan-300 transition-colors"
              >
                • <code className="text-slate-300">clean this view</code>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#050b18] border border-slate-800/80 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Active Context
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div>Primary: <strong className="text-slate-200">{activePrimaryTab}</strong></div>
              <div>Secondary: <strong className="text-slate-200">{activeSecondaryTab}</strong></div>
              <div>Focus: <strong className="text-emerald-400">{selection.entityName || mission.id}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

