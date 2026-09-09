import React from 'react';
import {
  X,
  Database,
  Activity,
  Languages,
  Layers,
  GitFork,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCode,
  Sparkles,
  Workflow,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Key
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  UxSMission,
  WorkspaceSelection,
  SignalFinding,
  Claim
} from '../../types';
import { CompactAccordion } from './CompactAccordion';

interface PaneLensProps {
  isOpen: boolean;
  onClose: () => void;
  paneView: ActiveWorkspaceTab;
  selection: WorkspaceSelection;
  mission: UxSMission;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
}

export const PaneLens: React.FC<PaneLensProps> = ({
  isOpen,
  onClose,
  paneView,
  selection,
  mission,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  // Determine local contextual tabs based on active pane view
  const getTabsForPane = () => {
    switch (paneView) {
      case 'lifecycle':
        return ['Lifecycle', 'Cockpit', 'Guards', 'Ledger'];
      case 'graph':
        return ['Overview', 'Evidence', 'Signal', 'Rosetta', 'Paths'];
      case 'projections':
        return ['Item', 'Assets', 'Canonical', 'Validation'];
      case 'charlie-intake':
        return ['Source', 'Mapping', 'Signal', 'Evidence'];
      case 'map':
        return ['Trajectory', 'Deployments', 'Sensors'];
      case 'evidence':
        return ['Claims', 'Sources', 'Conflicts', 'Decisions'];
      case 'signal':
        return ['Findings', 'Rules', 'DocuComp', 'Remediation'];
      default:
        return ['Overview', 'Evidence', 'Signal'];
    }
  };

  const tabs = getTabsForPane();
  const [activeTab, setActiveTab] = React.useState(tabs[0]);

  // Keep active tab in sync if pane view changes
  React.useEffect(() => {
    setActiveTab(tabs[0]);
  }, [paneView]);

  return (
    <aside
      id="pane-local-lens-slideover"
      className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#060c18]/95 border-l border-cyan-500/30 backdrop-blur-md flex flex-col z-30 shadow-2xl font-sans animate-in slide-in-from-right duration-200"
    >
      {/* Pane Lens Header */}
      <div className="p-3 bg-[#081224] border-b border-cyan-500/20 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2 truncate">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {paneView.toUpperCase()} LENS
          </span>
          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
            {selection.entityName || 'Selection Context'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
          title="Close Local Lens"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pane Lens Sub-Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800/80 bg-[#050a14] overflow-x-auto no-scrollbar font-mono text-xs shrink-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-2.5 py-1 rounded-t text-[11px] font-semibold transition-colors ${
              activeTab === t
                ? 'bg-[#081224] text-cyan-300 border-t border-x border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Pane Lens Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs text-slate-300">
        {/* Selected Entity Card */}
        <div className="p-3 rounded-lg bg-[#081224] border border-cyan-500/20 space-y-1">
          <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center justify-between">
            <span>Active Selection Context</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {selection.entityType || 'CANONICAL'}
            </span>
          </div>
          <div className="text-sm font-sans font-bold text-slate-100 truncate">
            {selection.entityName || mission.title}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Canonical Ref: <code className="text-cyan-300">{selection.canonicalRef || mission.id}</code>
          </div>
        </div>

        {/* 1. LIFECYCLE TABS */}
        {paneView === 'lifecycle' && activeTab === 'Lifecycle' && (
          <div className="space-y-2">
            <CompactAccordion title="Operational State Machine" primaryValue="Stage 4: ACCEPT" badge={{ label: 'ACTIVE', variant: 'cyan' }} defaultExpanded>
              <div className="space-y-1 text-slate-400">
                <div>Vehicle: <strong className="text-slate-200">{mission.platform.name}</strong></div>
                <div>Hull Number: <strong className="text-slate-200">{mission.platform.physicalAssetId || '#6401'}</strong></div>
                <div>Deployment: <strong className="text-slate-200">Dive 01 (Leg 1)</strong></div>
                <div>Physical Files: <strong className="text-slate-200">17 Ingested</strong></div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Knowledge Key Mappings" count={3} badge={{ label: 'MINTED', variant: 'purple' }}>
              <div className="space-y-1 text-[11px]">
                <div className="text-cyan-300">KK:asset:remus620:6401</div>
                <div className="text-purple-300">KK:instrument:kraken:120</div>
                <div className="text-emerald-300">KK:deployment:en2501:dive01</div>
              </div>
            </CompactAccordion>
          </div>
        )}

        {paneView === 'lifecycle' && activeTab === 'Cockpit' && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">Five Operational Readiness Domains:</div>
            <div className="space-y-1 text-xs">
              <div className="p-2 rounded bg-[#09152b] border border-slate-800 flex items-center justify-between">
                <span>Vehicle Domain</span>
                <span className="text-emerald-400 font-bold">● READY</span>
              </div>
              <div className="p-2 rounded bg-[#09152b] border border-slate-800 flex items-center justify-between">
                <span>Payload Domain</span>
                <span className="text-emerald-400 font-bold">● READY</span>
              </div>
              <div className="p-2 rounded bg-[#09152b] border border-slate-800 flex items-center justify-between">
                <span>Mission Domain</span>
                <span className="text-emerald-400 font-bold">● READY</span>
              </div>
              <div className="p-2 rounded bg-[#09152b] border border-slate-800 flex items-center justify-between">
                <span>Data Domain</span>
                <span className="text-amber-400 font-bold">▲ PARTIAL</span>
              </div>
              <div className="p-2 rounded bg-[#09152b] border border-slate-800 flex items-center justify-between">
                <span>Metadata Domain</span>
                <span className="text-emerald-400 font-bold">● READY</span>
              </div>
            </div>
          </div>
        )}

        {paneView === 'lifecycle' && activeTab === 'Guards' && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">Current Stage Transition Guards:</div>
            <div className="space-y-1 text-xs">
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Platform identity resolved & accepted</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Payload linked to physical hull asset</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Blocking claims decided by Human Steward</span>
              </div>
            </div>
          </div>
        )}

        {paneView === 'lifecycle' && activeTab === 'Ledger' && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">Merkle Proof Block:</div>
            <div className="p-2.5 bg-[#050e1c] rounded border border-slate-800 space-y-1 text-[11px]">
              <div>Block ID: <strong className="text-purple-300">L-000184</strong></div>
              <div>Canonical Hash: <code className="text-cyan-300">c586116ea982</code></div>
              <div>Rules Hash: <code className="text-emerald-300">71f93ce08912</code></div>
              <div>Actor: <span className="text-slate-300">Human Data Steward</span></div>
            </div>
          </div>
        )}

        {/* 2. STANDARD OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-2">
            <CompactAccordion title="Platform Profile" primaryValue={mission.platform.name} badge={{ label: 'SUPPORTED', variant: 'emerald' }} defaultExpanded>
              <div className="space-y-1 text-slate-400">
                <div>Model ID: <strong className="text-slate-200">{mission.platform.modelId || 'REMUS-620'}</strong></div>
                <div>Category: <strong className="text-slate-200">{mission.platform.uxsCategory}</strong></div>
                <div>Callsign: <strong className="text-slate-200">{mission.platform.callSign}</strong></div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Spatial Bounds" primaryValue={mission.spatialExtent.placeName} badge={{ label: 'COMPLETE', variant: 'cyan' }}>
              <div className="space-y-1 text-slate-400">
                <div>North: <span className="text-slate-200">{mission.spatialExtent.north}°</span></div>
                <div>South: <span className="text-slate-200">{mission.spatialExtent.south}°</span></div>
                <div>West: <span className="text-slate-200">{mission.spatialExtent.west}°</span></div>
                <div>East: <span className="text-slate-200">{mission.spatialExtent.east}°</span></div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Installed Sensors" count={mission.instruments.length} badge={{ label: 'ACTIVE', variant: 'purple' }}>
              <div className="space-y-1">
                {mission.instruments.map((inst, i) => (
                  <div key={i} className="text-slate-200 py-0.5 border-b border-slate-800 last:border-0">
                    • {inst}
                  </div>
                ))}
              </div>
            </CompactAccordion>
          </div>
        )}

        {/* 3. EVIDENCE TAB */}
        {(activeTab === 'Evidence' || activeTab === 'Claims') && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">
              Corroborating source observations for active selection:
            </div>
            {(mission.claims || []).slice(0, 4).map((claim) => (
              <div key={claim.id} className="p-2 bg-[#09152b] rounded border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-cyan-400 font-semibold">{claim.predicate}</span>
                  <span className="px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {claim.sources?.[0]?.id || 'direct'}
                  </span>
                </div>
                <div className="text-slate-200 font-sans">{claim.subject} → {String(claim.objectValue)}</div>
              </div>
            ))}
          </div>
        )}

        {/* 4. SIGNAL TAB */}
        {(activeTab === 'Signal' || activeTab === 'Findings') && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">
              Active rule verification for this node:
            </div>
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-emerald-300">
              <div className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>DocuComp Slot Conformance</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                All candidate XML fragments match provisional target ISO slot xpath rules.
              </div>
            </div>
          </div>
        )}

        {/* 5. ROSETTA TAB */}
        {activeTab === 'Rosetta' && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">
              Cross-standard field projections:
            </div>
            <div className="p-2 bg-[#050e1c] rounded border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="text-slate-400">Canonical: <code>platform.modelId</code></div>
              <div className="text-cyan-300">ISO: <code>gmi:MI_Platform/gmi:description</code></div>
              <div className="text-emerald-300">STAC: <code>properties['platform:model']</code></div>
              <div className="text-amber-300">DCAT: <code>dcat:theme / keyword</code></div>
            </div>
          </div>
        )}

        {/* 6. PATHS TAB */}
        {activeTab === 'Paths' && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">
              Topological relationship traversals:
            </div>
            <div className="p-2 bg-[#050e1c] rounded border border-slate-800 space-y-1.5 text-[11px]">
              <div>REMUS 620 <span className="text-cyan-400">→ carriedBy →</span> Okeanos Explorer</div>
              <div>REMUS 620 <span className="text-purple-400">→ operatesSensor →</span> Kraken MINSAS</div>
              <div>Kraken MINSAS <span className="text-emerald-400">→ measures →</span> Acoustic Backscatter</div>
            </div>
          </div>
        )}

        {/* 7. PROJECTIONS ITEM TAB */}
        {activeTab === 'Item' && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">STAC Item ID:</div>
            <div className="p-2 bg-[#050e1c] rounded border border-slate-800 text-cyan-300 font-mono text-[11px]">
              EN2501-DIVE-01-REMUS620
            </div>
            <div className="text-slate-400 text-[11px]">Geometry: Bounding Polygon (4 coordinates)</div>
          </div>
        )}
      </div>
    </aside>
  );
};
