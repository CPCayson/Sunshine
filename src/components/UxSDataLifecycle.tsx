import React, { useState, useEffect } from 'react';
import {
  Compass,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  FileCode,
  Layers,
  ArrowRight,
  Database,
  GitFork,
  Radio,
  Cpu,
  Anchor,
  ChevronRight,
  FileText,
  Key,
  ShieldAlert,
  Server,
  Activity,
  Workflow,
  Sparkles,
  ExternalLink,
  Sliders,
  Check,
  X,
  User,
  Hash
} from 'lucide-react';
import {
  UxSMission,
  UxSLifecycleState,
  ReadinessCockpitState,
  ReadinessDomainStatus,
  WorkspaceSelection,
  UxSLifecycleTransition
} from '../types';
import {
  LIFECYCLE_STAGES,
  INITIAL_READINESS_COCKPIT
} from '../data/lifecycleStages';
import { CompactAccordion } from './shell/CompactAccordion';
import { uxSLifecycleService, PLAYBACK_PIPELINE_SEQUENCE } from '../services/uxSLifecycleService';
import { ledgerService } from '../services/ledgerService';
import { evaluateOissHandoffProfile } from '../services/oissHandoffService';
import { compareFileInventories } from '../data/packageInventory';

interface UxSDataLifecycleProps {
  mission: UxSMission;
  onUpdateMission?: React.Dispatch<React.SetStateAction<UxSMission>>;
  onNavigateTab?: (tab: any) => void;
  onSelectNode?: (selection: WorkspaceSelection) => void;
}

export const UxSDataLifecycle: React.FC<UxSDataLifecycleProps> = ({
  mission,
  onUpdateMission,
  onNavigateTab,
  onSelectNode,
}) => {
  const [activeStage, setActiveStage] = useState<UxSLifecycleState>(mission.lifecycleState || 'ACCEPT');
  const [cockpit, setCockpit] = useState<ReadinessCockpitState>(() =>
    uxSLifecycleService.computeCockpitState(mission, activeStage)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(2400);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'COCKPIT' | 'FLOW' | 'LEDGER' | 'OISS_HANDOFF'>('COCKPIT');
  const [selectedDrilldown, setSelectedDrilldown] = useState<{
    domain: string;
    itemLabel: string;
    status: ReadinessDomainStatus;
    detail?: string;
    findingType: 'CLAIM' | 'SIGNAL' | 'GUARD' | 'METADATA';
    sourceEvidence?: string;
    actionLabel?: string;
    targetTab?: string;
  } | null>(null);

  // Sync state whenever mission changes
  useEffect(() => {
    setCockpit(uxSLifecycleService.computeCockpitState(mission, activeStage));
  }, [mission, activeStage]);

  // Stages ordered in linear progression
  const stageList: UxSLifecycleState[] = [
    'ACQUIRE',
    'OBSERVE',
    'RECONCILE',
    'ACCEPT',
    'ASSURE',
    'PROJECT',
    'HANDOFF_READY',
    'SUBMITTED',
    'DESTINATION_OBSERVED',
    'ARCHIVED',
    'DISCOVERABLE'
  ];

  // Sequential mission pipeline playback
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStage((curr) => {
          const idx = stageList.indexOf(curr);
          if (idx < stageList.length - 1) {
            const nextStage = stageList[idx + 1];
            if (onUpdateMission) {
              const stepInfo = PLAYBACK_PIPELINE_SEQUENCE.find((s) => s.stage === nextStage);
              const { mission: updated } = uxSLifecycleService.transitionMission(
                mission,
                nextStage,
                stepInfo?.triggerSource || 'System',
                stepInfo?.actor || 'MANTAS Pipeline Playback Engine',
                stepInfo?.ledgerSummary || `Playback advanced mission state to ${nextStage}`
              );
              onUpdateMission(updated);
            }
            return nextStage;
          } else {
            setIsPlaying(false);
            return 'ACQUIRE';
          }
        });
      }, playbackSpeedMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeedMs, mission, onUpdateMission]);

  // Current stage definition
  const currentStageDef = LIFECYCLE_STAGES.find((s) => s.id === activeStage) || LIFECYCLE_STAGES[0];
  const currentIndex = stageList.indexOf(activeStage);

  // Status badge styling helper supporting 'Ready', 'Partial', 'Not Evaluated', and 'Review'
  const getDomainStatusBadge = (status: ReadinessDomainStatus | string) => {
    switch (status) {
      case 'READY':
      case 'PROJECTABLE':
      case 'OBSERVED_VERIFIED':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          dot: 'bg-emerald-400',
          pillBg: 'bg-emerald-950 text-emerald-400 border-emerald-800',
          label: 'Ready'
        };
      case 'PARTIAL':
        return {
          bg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
          dot: 'bg-cyan-400',
          pillBg: 'bg-cyan-950 text-cyan-400 border-cyan-800',
          label: 'Partial'
        };
      case 'REVIEW':
      case 'BLOCKED':
        return {
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          dot: 'bg-amber-400',
          pillBg: 'bg-amber-950 text-amber-400 border-amber-800',
          label: 'Review'
        };
      case 'NOT_EVALUATED':
      case 'NOT_TESTED':
      default:
        return {
          bg: 'bg-slate-900/90 border-slate-700 text-slate-400',
          dot: 'bg-slate-500',
          pillBg: 'bg-slate-900 text-slate-400 border-slate-700',
          label: 'Not Evaluated'
        };
    }
  };

  // Step advancement handler with ledger recording
  const handleAdvanceStage = (nextStage: UxSLifecycleState) => {
    setActiveStage(nextStage);
    if (onUpdateMission) {
      const stepInfo = PLAYBACK_PIPELINE_SEQUENCE.find((s) => s.stage === nextStage);
      const { mission: updated } = uxSLifecycleService.transitionMission(
        mission,
        nextStage,
        stepInfo?.triggerSource || 'System',
        'Human Data Steward (Active Session)',
        stepInfo?.ledgerSummary || `Transitioned mission state to ${nextStage}`
      );
      onUpdateMission(updated);
    }
  };

  // Open drilldown for a non-ready or ready item
  const handleItemClick = (domainKey: string, domainName: string, item: any) => {
    let findingType: 'CLAIM' | 'SIGNAL' | 'GUARD' | 'METADATA' = 'GUARD';
    let sourceEvidence = '';
    let actionLabel = 'Inspect in Mission Metadata';
    let targetTab = 'mission';

    if (domainKey === 'vehicle') {
      findingType = 'CLAIM';
      sourceEvidence = 'Cross-referenced against Charlie Intake (col 8 "Platform Model") vs NCEI Cruise Inventory row.';
      actionLabel = 'Inspect Platform Claim in Evidence Lens';
      targetTab = 'evidence';
    } else if (domainKey === 'payload') {
      findingType = 'SIGNAL';
      sourceEvidence = 'Kraken MINSAS acoustic telemetry verified; optical camera laser channel calibration.';
      actionLabel = 'Verify Sensors in Signal Assurance';
      targetTab = 'signal';
    } else if (domainKey === 'mission') {
      findingType = 'GUARD';
      sourceEvidence = `Dive track coordinates [${mission.spatialExtent.north}°, ${mission.spatialExtent.west}°] within Hawaiian Ridge boundary.`;
      actionLabel = 'Inspect Spatial Extent on Map';
      targetTab = 'map';
    } else if (domainKey === 'data') {
      findingType = 'SIGNAL';
      sourceEvidence = '17 raw payload files checksummed against ingest manifest. Auxiliary CTD log requires validation.';
      actionLabel = 'Audit Raw Checksums in Charlie Intake';
      targetTab = 'charlie-intake';
    } else if (domainKey === 'metadata') {
      findingType = 'METADATA';
      sourceEvidence = 'DocuComp pointOfContact slot UUID 440b3ac2-64a5-46e2-9846-38305718b644 verified.';
      actionLabel = 'Edit Responsible Party & Keywords';
      targetTab = 'mission';
    }

    setSelectedDrilldown({
      domain: domainName,
      itemLabel: item.label,
      status: item.status,
      detail: item.detail,
      findingType,
      sourceEvidence,
      actionLabel,
      targetTab
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#040813] text-slate-200 overflow-y-auto font-mono text-xs select-none">
      {/* 1. TOP PIPELINE TIMELINE & CONTROLS */}
      <div className="p-3 bg-[#060c1a] border-b border-cyan-500/20 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">UxS DATA STATE MACHINE & READINESS COCKPIT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {mission.id} / DIVE 01
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 hidden sm:inline">
                  REMUS 620 #6401
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Sequential mission playback, 5-domain readiness drilldowns, and cryptographic Merkle provenance.
              </div>
            </div>
          </div>

          {/* Sequential Playback Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="play-mission-pipeline-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/60 text-amber-200 ring-1 ring-amber-400/40 animate-pulse'
                  : 'bg-cyan-950/90 hover:bg-cyan-900 border-cyan-400/50 text-cyan-200 hover:border-cyan-300'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Mission Pipeline</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Mission Pipeline</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                const nextIdx = (currentIndex + 1) % stageList.length;
                handleAdvanceStage(stageList[nextIdx]);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0d1b33] hover:bg-[#14284b] border border-cyan-500/30 text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Advance one stage"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                handleAdvanceStage('ACQUIRE');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0d1b33] hover:bg-[#14284b] border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset timeline to ACQUIRE"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            {/* Playback speed selector */}
            <select
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="bg-[#0b1426] border border-cyan-500/25 rounded-lg px-2 py-1 text-[11px] text-cyan-300 outline-none"
            >
              <option value={3600}>0.7x (3.6s)</option>
              <option value={2400}>1.0x (2.4s)</option>
              <option value={1500}>1.5x (1.5s)</option>
              <option value={800}>2.5x (0.8s)</option>
            </select>
          </div>
        </div>

        {/* Linear Stepper Across All 11 Stages */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1 min-w-[860px]">
            {stageList.map((stId, i) => {
              const def = LIFECYCLE_STAGES.find((s) => s.id === stId)!;
              const isCurrent = stId === activeStage;
              const isPast = i < currentIndex;
              const isDestination = def.category === 'DESTINATION_OBSERVED';

              return (
                <React.Fragment key={stId}>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      handleAdvanceStage(stId);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-left transition-all relative cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50 shadow-lg'
                        : isPast
                        ? 'bg-[#081224] border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-[#030712] border-slate-900 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span className={isPast ? 'text-emerald-400 font-bold' : isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                        {isPast ? '✓' : `0${i + 1}`}
                      </span>
                      {isDestination && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-purple-950/80 text-purple-400 border border-purple-900">
                          EXT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold tracking-tight truncate">
                      {def.shortLabel}
                    </div>
                  </button>
                  {i < stageList.length - 1 && (
                    <div className={`w-2 h-0.5 shrink-0 ${isPast ? 'bg-emerald-500/60' : 'bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. SUB-VIEW SELECTOR TABS */}
      <div className="px-4 pt-2 bg-[#050b18] border-b border-cyan-500/15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-3 py-1.5 rounded-t font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-[#071124] text-cyan-300 border-t border-x border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mission Timeline Playback</span>
          </button>

          <button
            onClick={() => setActiveTab('COCKPIT')}
            className={`px-3 py-1.5 rounded-t font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'COCKPIT'
                ? 'bg-[#071124] text-cyan-300 border-t border-x border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Anchor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Readiness Cockpit (5 Domains)</span>
          </button>

          <button
            onClick={() => setActiveTab('OISS_HANDOFF')}
            className={`px-3 py-1.5 rounded-t font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'OISS_HANDOFF'
                ? 'bg-[#071124] text-cyan-300 border-t border-x border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>OISS Hand-off Profile</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              PREFLIGHT
            </span>
          </button>

          <button
            onClick={() => setActiveTab('FLOW')}
            className={`px-3 py-1.5 rounded-t font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'FLOW'
                ? 'bg-[#071124] text-cyan-300 border-t border-x border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Operational Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3 py-1.5 rounded-t font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LEDGER'
                ? 'bg-[#071124] text-cyan-300 border-t border-x border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Merkle Ledger & Keys</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              {mission.lifecycleTransitions?.length || 3}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
          <span>Active State:</span>
          <span className="font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
            {activeStage}
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="p-4 flex-1 space-y-4">
        {/* VIEW 1: MISSION TIMELINE PLAYBACK */}
        {activeTab === 'TIMELINE' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-[#07162c] to-blue-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
                <div className="text-xs text-slate-200 font-sans">
                  <strong>Sequential Mission Playback:</strong> Walks through state transitions from platform acquisition to OISS handoff, showing how identity resolution, signal evaluation, and projection generation events are logged in the canonical ledger.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
                </button>
              </div>
            </div>

            {/* Sequential Transition Step Cards */}
            <div className="space-y-3">
              {PLAYBACK_PIPELINE_SEQUENCE.map((step, idx) => {
                const isStepActive = step.stage === activeStage;
                const isStepPast = stageList.indexOf(step.stage) < currentIndex;

                return (
                  <div
                    key={step.stage}
                    className={`p-4 rounded-xl border transition-all ${
                      isStepActive
                        ? 'bg-[#081730] border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-xl'
                        : isStepPast
                        ? 'bg-[#060e1d] border-emerald-500/30 text-slate-300'
                        : 'bg-[#040914] border-slate-800/80 text-slate-500 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isStepActive
                            ? 'bg-cyan-500 text-[#040813]'
                            : isStepPast
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isStepPast ? '✓' : idx + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm font-sans">{step.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              isStepActive
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {step.stage}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans">
                            Actor: <strong className="text-slate-200">{step.actor}</strong> · Source: <span className="text-cyan-300">{step.triggerSource}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.highlightCategory === 'identity' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                            Identity Resolution
                          </span>
                        )}
                        {step.highlightCategory === 'signal' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                            Signal Evaluation
                          </span>
                        )}
                        {step.highlightCategory === 'projection' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                            Projection Generation
                          </span>
                        )}
                        {step.highlightCategory === 'handoff' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            OISS Handoff
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setIsPlaying(false);
                            handleAdvanceStage(step.stage);
                          }}
                          className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                            isStepActive
                              ? 'bg-cyan-500 text-black font-bold'
                              : 'bg-[#0d1d3a] hover:bg-[#142b54] text-cyan-200 border border-cyan-500/30'
                          }`}
                        >
                          {isStepActive ? 'Active Stage' : 'Jump Here'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-slate-300 font-sans flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{step.ledgerSummary}</span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 shrink-0">
                        {isStepPast ? (
                          <span className="text-emerald-400">✓ Transition Verified in Ledger</span>
                        ) : isStepActive ? (
                          <span className="text-cyan-300 animate-pulse">● Currently Active Execution</span>
                        ) : (
                          <span>Pending Execution</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: READINESS COCKPIT (THE 5 DOMAINS + DRILLDOWNS + GATES) */}
        {activeTab === 'COCKPIT' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center justify-between gap-2 font-sans">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-cyan-400" />
                <div>
                  <strong>5-Domain Readiness Cockpit:</strong> Evaluates <strong>Vehicle</strong>, <strong>Payload</strong>, <strong>Mission</strong>, <strong>Data</strong>, and <strong>Metadata</strong>.
                  Status indicators differentiate between <strong>Ready</strong>, <strong>Partial</strong>, <strong>Not Evaluated</strong>, and <strong>Review</strong>. Click any item to drill down into the underlying Signal finding or Claim.
                </div>
              </div>
            </div>

            {/* 1. The Five Operational & Metadata Domains */}
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Five Readiness Domains</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(cockpit.domains).map(([key, dom]) => {
                  const badge = getDomainStatusBadge(dom.status);
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-[#060e1d] border border-cyan-500/20 hover:border-cyan-500/40 transition-colors space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100 uppercase">{dom.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {dom.details}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        {dom.items.map((it, idx) => {
                          const itemBadge = getDomainStatusBadge(it.status);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleItemClick(key, dom.label, it)}
                              className="w-full flex items-center justify-between text-[10px] p-1 rounded hover:bg-[#0c1a33] text-left transition-colors cursor-pointer group"
                            >
                              <span className="text-slate-300 truncate max-w-[130px] group-hover:text-cyan-200">
                                {it.label}
                              </span>
                              <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${itemBadge.pillBg}`}>
                                {itemBadge.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drilldown Finding / Claim Inspector Drawer if an item is selected */}
            {selectedDrilldown && (
              <div className="p-4 rounded-xl bg-[#09152b] border border-cyan-400/50 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase font-mono">
                      Domain Drilldown: {selectedDrilldown.domain}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getDomainStatusBadge(selectedDrilldown.status).bg}`}>
                      {getDomainStatusBadge(selectedDrilldown.status).label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-mono">
                      {selectedDrilldown.findingType} FINDING
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedDrilldown(null)}
                    className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 font-sans">
                  <div className="text-sm font-bold text-slate-100">
                    {selectedDrilldown.itemLabel}
                  </div>
                  {selectedDrilldown.detail && (
                    <div className="text-xs text-slate-300">
                      <strong>Detail:</strong> {selectedDrilldown.detail}
                    </div>
                  )}
                  <div className="text-xs text-cyan-200/90 font-mono bg-[#050c1a] p-2.5 rounded-lg border border-cyan-500/20">
                    <strong>Evidence & Reasoning Finding:</strong> {selectedDrilldown.sourceEvidence}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-sans">
                    Responsible for indicator status: <strong className="text-slate-200">{selectedDrilldown.status}</strong>
                  </span>

                  {onNavigateTab && selectedDrilldown.targetTab && (
                    <button
                      onClick={() => onNavigateTab(selectedDrilldown.targetTab)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{selectedDrilldown.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. Destination Readiness Gates */}
            <div className="pt-3">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <span>Destination Readiness Gates & Authority Boundaries</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(cockpit.destinations).map(([key, dest]) => {
                  const badge = getDomainStatusBadge(dest.status);
                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-xl bg-[#060d1b] border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100 font-sans">{dest.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {dest.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {dest.description}
                      </div>
                      <div className="text-[10px] text-cyan-400/80 font-mono pt-1 border-t border-slate-800/60">
                        Authority Scope: <strong>{dest.authorityScope}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: OPERATIONAL ARCHITECTURE & TOPOLOGY */}
        {activeTab === 'FLOW' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-[#071224] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-100 text-sm">Physical Autonomous Underwater Mission Topology</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  REMUS 620 · HULL #6401
                </span>
              </div>

              {/* Topology Block Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                {/* 1. Physical Platform Block */}
                <div className="p-3 rounded-lg bg-[#040914] border border-cyan-500/20 space-y-2">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <Anchor className="w-3 h-3" />
                    <span>Physical Hull</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-100 font-bold text-xs">REMUS 620 UUV</div>
                    <div className="text-[10px] text-slate-400">Physical Serial: #6401</div>
                    <div className="text-[10px] text-slate-400">Callsign: NOAA-UXS-6401</div>
                    <div className="text-[10px] text-slate-400">Depth Rating: 600m</div>
                  </div>
                </div>

                {/* 2. Payload Configuration */}
                <div className="p-3 rounded-lg bg-[#040914] border border-purple-500/20 space-y-2">
                  <div className="text-[10px] text-purple-400 uppercase font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    <span>Acoustic & Optical Payload</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-100 font-bold text-xs">Kraken MINSAS-120</div>
                    <div className="text-[10px] text-slate-400">Voyis Insight Pro Laser</div>
                    <div className="text-[10px] text-slate-400">Seabird FastCAT CTD</div>
                    <div className="text-[10px] text-slate-400">USBL Acoustic Beacon</div>
                  </div>
                </div>

                {/* 3. Deployment Track */}
                <div className="p-3 rounded-lg bg-[#040914] border border-emerald-500/20 space-y-2">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    <span>Geodesic Track Bounds</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-100 font-bold text-xs">Kaiwi Channel / Penguin Bank</div>
                    <div className="text-[10px] text-slate-400">Lat: 20.85°N to 21.65°N</div>
                    <div className="text-[10px] text-slate-400">Lon: 158.45°W to 156.95°W</div>
                    <div className="text-[10px] text-slate-400">Fixes: 1,420 USBL points</div>
                  </div>
                </div>

                {/* 4. Downstream Package */}
                <div className="p-3 rounded-lg bg-[#040914] border border-amber-500/20 space-y-2">
                  <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    <span>Ingest Target Gate</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-100 font-bold text-xs">NOAA OISS SIP Ingest</div>
                    <div className="text-[10px] text-slate-400">ISO 19115-2 NOAA UxS XML</div>
                    <div className="text-[10px] text-slate-400">STAC 1.0.0 GeoJSON Catalog</div>
                    <div className="text-[10px] text-slate-400">DocuComp Slot Conformance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Stage Inspector Card */}
            <div className="p-4 rounded-xl bg-[#071224] border border-cyan-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                    Active Stage Inspector · {currentStageDef.category}
                  </div>
                  <div className="text-base font-bold text-slate-100 font-sans flex items-center gap-2">
                    <span>Stage {currentIndex + 1}: {currentStageDef.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                      {currentStageDef.id}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <div>Operational Actor:</div>
                  <div className="text-slate-200 font-bold">{currentStageDef.operationalActor}</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-sans leading-relaxed">
                {currentStageDef.description}
              </div>

              {/* Stage Transition Guards */}
              <div className="pt-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>State Transition Guards</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {currentStageDef.guards.map((guard) => (
                    <div
                      key={guard.id}
                      className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                        guard.satisfied
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${guard.satisfied ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold">{guard.label}</div>
                        <div className="text-[9px] text-slate-400">
                          {guard.satisfied ? 'Requirement passed' : 'Pending observation verification'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typical Artifacts */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-500">Typical Stage Artifacts:</span>
                {currentStageDef.typicalArtifacts.map((art, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#030814] text-slate-300 border border-slate-800">
                    {art}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MERKLE LEDGER & CANONICAL KNOWLEDGE KEYS */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-[#060e1d] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-100 text-sm">Active Canonical Knowledge Keys</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  PROVENANCE SECURED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#040914] border border-slate-800 space-y-1">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">Physical Asset Key</div>
                  <div className="text-slate-200 font-bold">KK:asset:remus620:6401</div>
                  <div className="text-[10px] text-slate-500">Mints hull #6401 serial binding</div>
                </div>

                <div className="p-3 rounded-lg bg-[#040914] border border-purple-400 uppercase font-bold">Instrument Instance Key</div>
                <div className="text-slate-200 font-bold">KK:instrument:kraken:minsas:120</div>
                <div className="text-[10px] text-slate-500">Mints acoustic payload instance</div>
              </div>

              <div className="p-3 rounded-lg bg-[#040914] border border-slate-800 space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Deployment Key</div>
                <div className="text-slate-200 font-bold">KK:deployment:en2501:dive01</div>
                <div className="text-[10px] text-slate-500">Mints geodetic cruise track</div>
              </div>
            </div>

            {/* Merkle Ledger History */}
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Canonical Merkle Ledger · UxSLifecycleTransition Events</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Immutable Cryptographic Hash Chain
                </span>
              </div>

              <div className="space-y-2.5">
                {(mission.lifecycleTransitions && mission.lifecycleTransitions.length > 0
                  ? mission.lifecycleTransitions
                  : []
                ).map((trans, idx) => (
                  <div
                    key={trans.id || idx}
                    className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 hover:border-cyan-500/30 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{trans.fromState}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="font-bold text-emerald-400">{trans.toState}</span>
                        {trans.triggerSource && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            {trans.triggerSource.toUpperCase()}
                          </span>
                        )}
                        {trans.ledgerBlockId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            {trans.ledgerBlockId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{trans.timestamp}</span>
                    </div>

                    <div className="text-xs text-slate-300 font-sans">
                      {trans.summary}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px] font-mono border-t border-slate-800/80">
                      <div>Actor: <strong className="text-slate-200">{trans.actor}</strong></div>
                      {trans.canonicalHash && (
                        <div>State Hash: <code className="text-amber-300">{trans.canonicalHash}</code></div>
                      )}
                      {trans.rulesHash && (
                        <div>Rules Hash: <code className="text-emerald-300">{trans.rulesHash}</code></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: OISS HAND-OFF PREFLIGHT PROFILE */}
        {activeTab === 'OISS_HANDOFF' && (() => {
          const handoff = evaluateOissHandoffProfile(mission);
          const fileComps = compareFileInventories();

          return (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Profile Summary & Invariant Gate */}
              <div className="p-4 bg-[#081224] border border-cyan-500/30 rounded-xl space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-xs font-bold font-mono text-cyan-200 uppercase tracking-wider">
                        OISS Hand-off Profile Preflight Evaluation
                      </h3>
                      <span className="text-[11px] text-slate-400 font-sans">
                        Package: <code className="text-slate-200">{handoff.packageId}</code>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {handoff.overallState}
                    </span>
                  </div>
                </div>

                {/* Explicit Truth Boundary Notice */}
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-200/90 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>STRICT OPERATIONAL JURISDICTION INVARIANT</span>
                  </div>
                  <p className="font-sans text-[11px] leading-relaxed">
                    OISS hand-off readiness proves that MANTAS preflight criteria are satisfied for hand-off transmission. It does <strong>NOT</strong> prove or assert OISS pipeline execution, OISS acceptance, or final archiving.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                    <span className="text-slate-400">Boundary - Does NOT Prove:</span>
                    {handoff.doesNotProve.map((dnp, idx) => (
                      <span key={idx} className="px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
                        ✕ {dnp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preflight Rules Table */}
              <div className="bg-[#081224] border border-cyan-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Authoritative Preflight Rules ({handoff.rules.length})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    All rules evaluated against canonical state & package manifest
                  </span>
                </div>

                <div className="space-y-2">
                  {handoff.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 rounded-lg bg-[#040813] border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40">
                            {rule.id}
                          </span>
                          <span className="text-xs font-bold text-slate-100 font-sans">{rule.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          rule.status === 'PASS'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border-rose-500/40'
                        }`}>
                          {rule.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 font-sans">{rule.description}</p>

                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300 border-t border-slate-800/60">
                        <span>Rationale: {rule.rationale}</span>
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                          <span>Evidence:</span>
                          {rule.evidenceRefs.map((ref, idx) => (
                            <code key={idx} className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                              {ref}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical File Inventory Verification (Expected ↔ Observed) */}
              <div className="bg-[#081224] border border-cyan-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                      Physical File Inventory Verification ({fileComps.length} Assets)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Cryptographic fixity (SHA-256) & size audit across package manifest files
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    EXPECTED ↔ OBSERVED
                  </span>
                </div>

                <div className="space-y-2">
                  {fileComps.map((fc) => (
                    <div
                      key={fc.filename}
                      className="p-3 rounded-lg bg-[#040813] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-bold text-slate-200">{fc.filename}</span>
                          {fc.expected?.mandatory && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                              MANDATORY
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">({fc.expected?.logicalFileKey})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-3">
                          <span>Media: {fc.expected?.mediaType || 'application/octet-stream'}</span>
                          <span>Size: {((fc.observed?.sizeBytes || fc.expected?.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB</span>
                          <span className="text-slate-300">
                            SHA-256: <code className="text-amber-300">{(fc.observed?.checksum || fc.expected?.expectedChecksum || '').substring(0, 16)}...</code>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400">{fc.notes}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                          {fc.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
