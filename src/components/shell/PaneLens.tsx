import React, { useState } from 'react';
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
  Key,
  ShieldAlert,
  Fingerprint,
  Cpu,
  Anchor,
  Box,
  Binary,
  Radio,
  Share2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  UxSMission,
  WorkspaceSelection,
  SignalFinding,
  Claim,
  CapabilityEvidenceLevel
} from '../../types';
import { CompactAccordion } from './CompactAccordion';
import { getCapabilityMaturity } from '../../services/identityResolutionService';

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
  // Determine local contextual tabs based on active pane view
  const getTabsForPane = () => {
    switch (paneView) {
      case 'lifecycle':
        return ['Passport', 'Lifecycle', 'Cockpit', 'Guards', 'Ledger'];
      case 'graph':
        return ['Passport', 'Overview', 'Evidence', 'Signal', 'Rosetta', 'Paths'];
      case 'projections':
        return ['Passport', 'Item', 'Assets', 'Canonical', 'Validation'];
      case 'charlie-intake':
        return ['Passport', 'Source', 'Mapping', 'Signal', 'Evidence'];
      case 'map':
        return ['Passport', 'Trajectory', 'Deployments', 'Sensors'];
      case 'evidence':
        return ['Passport', 'Claims', 'Sources', 'Conflicts', 'Decisions'];
      case 'signal':
        return ['Passport', 'Findings', 'Rules', 'DocuComp', 'Remediation'];
      default:
        return ['Passport', 'Overview', 'Evidence', 'Signal'];
    }
  };

  const tabs = getTabsForPane();
  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Keep active tab in sync if pane view changes
  React.useEffect(() => {
    setActiveTab('Passport');
  }, [paneView, selection.canonicalRef, selection.entityName]);

  if (!isOpen) return null;

  const handleAction = (actionName: string) => {
    setActionNotice(`Executing ${actionName}...`);
    setTimeout(() => setActionNotice(null), 3500);
    if (actionName === 'EVIDENCE' && onNavigateTab) {
      onNavigateTab('evidence');
    } else if (actionName === 'MISSIONS' && onNavigateTab) {
      onNavigateTab('lifecycle');
    } else if (actionName === 'TRACE' && onNavigateTab) {
      onNavigateTab('graph');
    }
  };

  // Compute entity passport properties based on selection
  const entityName = selection.entityName || mission.platform.name || 'REMUS 620 Autonomous Vehicle Model';
  const isRemus = entityName.toLowerCase().includes('remus') || entityName.toLowerCase().includes('6401');
  const isMinsas = entityName.toLowerCase().includes('minsas') || entityName.toLowerCase().includes('sas');
  const isAsset = entityName.includes('6401') || selection.entityType === 'physicalAsset';

  const knowledgeKey = isAsset
    ? 'KK:physical-asset:remus-620:6401'
    : isMinsas
    ? 'KK:instrument-model:kraken:minsas-120'
    : 'KK:platform-model:remus-620';

  const providerName = isMinsas ? 'Kraken Robotics Inc.' : 'Huntington Ingalls Industries (HII) / Hydroid';
  const entityType = isAsset ? 'Physical Asset' : isMinsas ? 'Instrument Model' : 'Platform Model';
  const maturity = getCapabilityMaturity('plat-model-remus620', 'inst-model-minsas');

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
            {activeTab === 'Passport' ? 'KNOWLEDGE PASSPORT' : `${paneView.toUpperCase()} LENS`}
          </span>
          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
            {entityName}
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

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="mx-3 mt-2 px-3 py-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded text-[11px] text-cyan-300 font-mono flex items-center justify-between">
          <span>{actionNotice}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        </div>
      )}

      {/* Pane Lens Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs text-slate-300">
        {/* Selected Entity Card */}
        <div className="p-3 rounded-lg bg-[#081224] border border-cyan-500/20 space-y-1">
          <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center justify-between">
            <span>Active Selection Context</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {selection.entityType || entityType.toUpperCase()}
            </span>
          </div>
          <div className="text-sm font-sans font-bold text-slate-100 truncate">
            {entityName}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Canonical Ref: <code className="text-cyan-300">{selection.canonicalRef || knowledgeKey}</code>
          </div>
        </div>

        {/* 0. KNOWLEDGE PASSPORT VIEW */}
        {activeTab === 'Passport' && (
          <div className="space-y-3 text-xs">
            {/* Passport Identity Header */}
            <div className="p-3 bg-[#071328] rounded-lg border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">TYPE:</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                  {entityType}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Knowledge Key:</div>
                <div className="font-mono text-cyan-300 text-[11px] break-all bg-black/40 p-1 rounded border border-cyan-900/50 mt-0.5">
                  {knowledgeKey}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">PROVIDER:</span>
                <span className="text-slate-200 font-semibold">{providerName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">DATA PROVENANCE:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                  IMPORTED_ARTIFACT
                </span>
              </div>
            </div>

            {/* Passport Action Buttons */}
            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
              <button
                onClick={() => handleAction('TRACE')}
                className="p-1.5 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/60 text-center transition-colors"
              >
                TRACE
              </button>
              <button
                onClick={() => handleAction('EVIDENCE')}
                className="p-1.5 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-emerald-300 border border-emerald-800/60 text-center transition-colors"
              >
                EVIDENCE
              </button>
              <button
                onClick={() => handleAction('PROOF')}
                className="p-1.5 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-purple-300 border border-purple-800/60 text-center transition-colors"
              >
                PROOF
              </button>
              <button
                onClick={() => handleAction('MISSIONS')}
                className="p-1.5 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-amber-300 border border-amber-800/60 text-center transition-colors col-span-1"
              >
                MISSIONS
              </button>
              <button
                onClick={() => handleAction('SCIENCE CANDIDATES')}
                className="p-1.5 rounded bg-[#0b1b36] hover:bg-cyan-900/40 text-slate-200 border border-slate-700 text-center transition-colors col-span-2"
              >
                SCIENCE CANDIDATES
              </button>
            </div>

            {/* Structured Passport Sections */}
            <CompactAccordion title="Aliases & Candidate Labels" count={3} badge={{ label: 'MAPPED', variant: 'cyan' }} defaultExpanded>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>• HII REMUS-620 (Fleet Registry):</span>
                  <span className="text-emerald-400 font-bold">EXACT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• REMUS620 (ISO Draft):</span>
                  <span className="text-cyan-300">STRONG</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• "REMUS" (CoMET CEDIT):</span>
                  <span className="text-amber-400 font-bold">WEAK (HELD)</span>
                </div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Known Physical Assets" count={1} badge={{ label: 'VERIFIED', variant: 'emerald' }} defaultExpanded>
              <div className="p-2 bg-[#050e1c] rounded border border-slate-800 text-[11px] space-y-1">
                <div className="font-bold text-slate-100">REMUS 620 Hull #6401</div>
                <div>Serial: <code className="text-cyan-300">6401</code> | Barcode: <code className="text-slate-300">NOAA-UXS-6401</code></div>
                <div>Owner: <span className="text-slate-300">NOAA OMAO</span></div>
                <div>Operational Status: <span className="text-emerald-400 font-bold">ACTIVE DEPLOYED</span></div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Engineering Capabilities (CAN_CARRY)" count={3} badge={{ label: 'SPEC', variant: 'purple' }} defaultExpanded>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-1.5 rounded bg-[#09152b] border border-slate-800">
                  <div className="text-cyan-300 font-semibold">Kraken MINSAS-120 SAS</div>
                  <div className="text-[10px] text-slate-400">Mid-Section 0.18m³ bay rated | 337 kHz SAS</div>
                </div>
                <div className="p-1.5 rounded bg-[#09152b] border border-slate-800">
                  <div className="text-cyan-300 font-semibold">Voyis Insight Pro Optical/Laser</div>
                  <div className="text-[10px] text-slate-400">Forward optical compartment rated</div>
                </div>
                <div className="p-1.5 rounded bg-[#09152b] border border-slate-800">
                  <div className="text-cyan-300 font-semibold">Sea-Bird SBE49 FastCAT CTD</div>
                  <div className="text-[10px] text-slate-400">Standard internal mast integration</div>
                </div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Known Physical Configurations" count={2} badge={{ label: 'CHASSIS', variant: 'amber' }}>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div>• Hull #6401 <strong className="text-amber-300">CONFIGURED_WITH</strong> Kraken MINSAS SN #204</div>
                <div>• Hull #6401 <strong className="text-amber-300">CONFIGURED_WITH</strong> Voyis Insight Pro SN #088</div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Actual Deployments" count={3} badge={{ label: 'CARRIED', variant: 'emerald' }}>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-1.5 rounded bg-[#09152b] border border-slate-800">
                  <div className="font-bold text-slate-200">EN2501 Dive 01 (Penguin Bank SAS)</div>
                  <div className="text-[10px] text-slate-400">Duration: 14.2h | Depth: 50m - 220m | CARRIED: MINSAS SN-204</div>
                </div>
                <div className="p-1.5 rounded bg-[#09152b] border border-slate-800">
                  <div className="font-bold text-slate-200">EN2501 Dive 02 (Kaiwi Trough Deep)</div>
                  <div className="text-[10px] text-slate-400">Duration: 18.5h | Depth: 400m - 1,250m | CARRIED: MINSAS SN-204</div>
                </div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Produced Datasets" count={2} badge={{ label: 'PRODUCED', variant: 'cyan' }}>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div>• Acoustic Backscatter GeoTIFF Mosaic (EN2501_D01_Backscatter_50cm.tif)</div>
                <div>• Bathymetry BAG 1m Gridded Surface (EN2501_D01_Bathy_1m.bag)</div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Capability Evidence Maturity" badge={{ label: maturity?.overallMaturity || 'DATA_PROVEN', variant: 'emerald' }} defaultExpanded>
              <div className="space-y-1 text-xs">
                <div className="p-1.5 rounded bg-[#050e1c] flex items-center justify-between">
                  <span>POTENTIAL (Provider Spec):</span>
                  <span className="text-emerald-400 font-bold">● VERIFIED</span>
                </div>
                <div className="p-1.5 rounded bg-[#050e1c] flex items-center justify-between">
                  <span>CONFIGURED (Deck Inventory):</span>
                  <span className="text-emerald-400 font-bold">● VERIFIED</span>
                </div>
                <div className="p-1.5 rounded bg-[#050e1c] flex items-center justify-between">
                  <span>DEPLOYED (Underway Dive Log):</span>
                  <span className="text-emerald-400 font-bold">● VERIFIED</span>
                </div>
                <div className="p-1.5 rounded bg-[#050e1c] flex items-center justify-between">
                  <span>DATA_PROVEN (Archived Dataset):</span>
                  <span className="text-emerald-400 font-bold">● VERIFIED</span>
                </div>
              </div>
            </CompactAccordion>

            <CompactAccordion title="Authority & Freshness" badge={{ label: 'CURRENT', variant: 'emerald' }}>
              <div className="space-y-1 text-[11px] text-slate-400">
                <div>Active Registration: <strong className="text-slate-200">NOAA UxSO Fleet Registry CY2025</strong></div>
                <div>Historical Snapshot: <span className="text-slate-300">2020 Navy/USM Custody (Preserved)</span></div>
                <div>Authority: <span className="text-cyan-300 font-mono">NOAA OMAO / Ocean Exploration</span></div>
                <div>Ledger Anchor: <span className="text-purple-300 font-mono">Block L-000184 (c586116ea982)</span></div>
              </div>
            </CompactAccordion>
          </div>
        )}

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
                <div className="text-cyan-300">KK:platform-model:remus-620</div>
                <div className="text-cyan-300">KK:physical-asset:remus-620:6401</div>
                <div className="text-purple-300">KK:instrument-instance:kraken:minsas:204</div>
                <div className="text-emerald-300">KK:deployment:en2501:dive-01</div>
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
              <div>REMUS 620 <span className="text-cyan-400">→ CAN_CARRY →</span> Kraken MINSAS</div>
              <div>Hull #6401 <span className="text-purple-400">→ CONFIGURED_WITH →</span> MINSAS SN-204</div>
              <div>Dive 01 <span className="text-emerald-400">→ CARRIED →</span> MINSAS SN-204</div>
              <div>MINSAS SN-204 <span className="text-cyan-400">→ PRODUCED →</span> Backscatter GeoTIFF</div>
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
