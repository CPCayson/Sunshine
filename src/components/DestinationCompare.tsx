import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Database,
  Search,
  RefreshCw,
  Eye,
  Lock,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  UxSMission,
  DestinationObservation,
  DestinationCompareResult,
  SemanticDifference,
  DifferenceClass,
  ComparisonState,
  FreshnessState,
  WorkspaceSelection
} from '../types';
import {
  SEED_ONESTOP_OBSERVATION,
  SEED_CMR_OBSERVATION,
  compareDestinationWithCanonical,
  OFFICIAL_AUTHORITY_RECEIPTS
} from '../services/destinationReconciliationService';
import { runQaJurisdictionTests } from '../services/qaJurisdictionTest';

interface DestinationCompareProps {
  mission: UxSMission;
  selection?: WorkspaceSelection;
  onSelectDifference?: (diff: SemanticDifference) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DestinationCompare: React.FC<DestinationCompareProps> = ({
  mission,
  selection,
  onSelectDifference,
  onNavigateTab
}) => {
  const [oneStopObs, setOneStopObs] = useState<DestinationObservation | null>(SEED_ONESTOP_OBSERVATION);
  const [cmrObs, setCmrObs] = useState<DestinationObservation | null>(SEED_CMR_OBSERVATION);
  const [selectedDiff, setSelectedDiff] = useState<SemanticDifference | null>(null);
  const [activeTab, setActiveTab] = useState<'COMPARISON' | 'RECEIPTS_INVARIANTS' | 'TRUTH_BOUNDARY' | 'QA_TESTS'>('COMPARISON');
  const [isReobserving, setIsReobserving] = useState(false);
  const [showRosettaTrace, setShowRosettaTrace] = useState(true);

  // Invariant test results
  const qaTestResults = runQaJurisdictionTests(mission);

  // Run dynamic comparison against canonical mission
  const oneStopResult = compareDestinationWithCanonical(mission, oneStopObs, 'OneStop');
  const cmrResult = compareDestinationWithCanonical(mission, cmrObs, 'CMR');

  // Trigger simulated re-observation
  const handleReobserve = () => {
    setIsReobserving(true);
    setTimeout(() => {
      if (oneStopObs) {
        setOneStopObs({
          ...oneStopObs,
          freshness: 'CURRENT',
          observedAt: new Date().toISOString()
        });
      }
      if (cmrObs) {
        setCmrObs({
          ...cmrObs,
          freshness: 'CURRENT',
          observedAt: new Date().toISOString()
        });
      }
      setIsReobserving(false);
    }, 600);
  };

  // Mark stale when canonical fact mutated
  const handleSimulateCanonicalEdit = () => {
    if (oneStopObs) {
      setOneStopObs({
        ...oneStopObs,
        freshness: 'STALE'
      });
    }
    if (cmrObs) {
      setCmrObs({
        ...cmrObs,
        freshness: 'STALE'
      });
    }
  };

  const renderStateBadge = (state: ComparisonState, freshness?: FreshnessState) => {
    if (freshness === 'STALE') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>STALE</span>
        </span>
      );
    }

    switch (state) {
      case 'MATCH':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>MATCH</span>
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>MISMATCH</span>
          </span>
        );
      case 'MISSING':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-red-950/80 text-red-300 border border-red-500/40 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>MISSING</span>
          </span>
        );
      case 'NOT_TESTED':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>NOT_TESTED</span>
          </span>
        );
      case 'EXTRA':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <span>EXTRA</span>
          </span>
        );
      case 'UNVERIFIABLE':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-600 flex items-center gap-1">
            <span>UNVERIFIABLE</span>
          </span>
        );
    }
  };

  const getDiffClassBadge = (diffClass: DifferenceClass) => {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
        {diffClass}
      </span>
    );
  };

  return (
    <div id="destination-compare-surface" className="w-full h-full flex flex-col bg-[#050914] text-slate-200 overflow-hidden font-sans">
      {/* Top Banner & Control Strip */}
      <div className="bg-[#070e1c] border-b border-cyan-500/20 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Destination Reconciliation: OneStop / OSIM ↔ NOAA CMR
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Target: {mission.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Discovery representation parity check. Answers: Does the same intended dataset appear in each required catalog?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateCanonicalEdit}
            title="Mark affected destination observations as STALE"
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-xs font-mono text-amber-200 transition-colors cursor-pointer"
          >
            Simulate Title Change (Trigger STALE)
          </button>
          <button
            onClick={handleReobserve}
            disabled={isReobserving}
            className="px-3 py-1.5 rounded-lg bg-[#0d1d36] hover:bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReobserving ? 'animate-spin' : ''}`} />
            <span>{isReobserving ? 'Querying Catalogs...' : 'Re-Observe Destinations'}</span>
          </button>
        </div>
      </div>

      {/* Sub-nav Tabs */}
      <div className="bg-[#040711] border-b border-cyan-500/20 px-6 flex items-center gap-3 text-xs font-mono">
        <button
          onClick={() => setActiveTab('COMPARISON')}
          className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'COMPARISON'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Catalog Surface Comparison
        </button>
        <button
          onClick={() => setActiveTab('RECEIPTS_INVARIANTS')}
          className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'RECEIPTS_INVARIANTS'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          QA Jurisdiction Invariant & Scoped Receipts ({OFFICIAL_AUTHORITY_RECEIPTS.length})
        </button>
        <button
          onClick={() => setActiveTab('TRUTH_BOUNDARY')}
          className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'TRUTH_BOUNDARY'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Truth Boundary Audit Report
        </button>
        <button
          onClick={() => setActiveTab('QA_TESTS')}
          className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'QA_TESTS'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>QA Jurisdiction Tests</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${qaTestResults.allPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300'}`}>
            {qaTestResults.allPassed ? 'ALL PASS' : 'FAILED'}
          </span>
        </button>
      </div>

      {/* Main Content Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'COMPARISON' && (
          <>
            {/* Primary 3-Column Reconciliation Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Col 1: Canonical Expected */}
              <div className="bg-[#081224] border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                        Canonical Expected
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/40">
                      MANTAS CENTRAL TRUTH
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Identifier / DOI:</span>
                      <span className="font-mono text-cyan-100 font-semibold">{mission.doi || mission.id}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Canonical Title:</span>
                      <span className="text-slate-200 font-sans leading-relaxed">{mission.title}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Platform Asset:</span>
                      <span className="font-mono text-slate-300">{mission.platform.name} ({mission.platform.physicalAssetId})</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Payload Instruments ({mission.instruments.length}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mission.instruments.map((inst, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Temporal Extent:</span>
                      <span className="font-mono text-slate-300">{mission.dateStart} → {mission.dateEnd}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-500/10 text-[11px] font-mono text-slate-400">
                  Authority: Accepted Human Decisions & Source Claims
                </div>
              </div>

              {/* Col 2: NOAA OneStop / OSIM */}
              <div className="bg-[#081224] border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                        NOAA OneStop / OSIM
                      </span>
                    </div>
                    {renderStateBadge(oneStopResult.state, oneStopResult.freshness)}
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Record Identifier:</span>
                      <span className="font-mono text-slate-300">{oneStopResult.recordIdentifier}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Observed Title:</span>
                      <span className="text-slate-200 font-sans leading-relaxed">
                        {oneStopObs?.observedSummary?.title || 'Not Observed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Observed Platform:</span>
                      <span className="font-mono text-slate-300">{oneStopObs?.observedSummary?.platform}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Observed Instruments:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {oneStopObs?.observedSummary?.instruments?.map((inst, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Tested Fields:</span>
                      <span className="font-mono text-slate-300">
                        {oneStopResult.matchedFieldsCount} / {oneStopResult.testedFieldsCount} Matched
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Source: {oneStopResult.sourceSystem}</span>
                  <span className="text-cyan-400">{oneStopResult.provenanceType}</span>
                </div>
              </div>

              {/* Col 3: NOAA / NASA CMR */}
              <div className="bg-[#081224] border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                        NOAA / NASA CMR
                      </span>
                    </div>
                    {renderStateBadge(cmrResult.state, cmrResult.freshness)}
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Record Identifier:</span>
                      <span className="font-mono text-slate-300">{cmrResult.recordIdentifier}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Observed Title:</span>
                      <span className="text-rose-200 font-sans leading-relaxed">
                        {cmrObs?.observedSummary?.title || 'Not Observed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Observed Platform:</span>
                      <span className="font-mono text-slate-300">{cmrObs?.observedSummary?.platform}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Observed Instruments:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cmrObs?.observedSummary?.instruments?.map((inst, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 border border-rose-500/30 text-rose-300">
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block font-mono">Tested Fields:</span>
                      <span className="font-mono text-rose-300">
                        {cmrResult.matchedFieldsCount} / {cmrResult.testedFieldsCount} Matched ({cmrResult.differences.length} diffs)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Source: {cmrResult.sourceSystem}</span>
                  <span className="text-purple-300">{cmrResult.provenanceType}</span>
                </div>
              </div>
            </div>

            {/* Semantic Differences Panel with Rosetta Trace */}
            <div className="bg-[#081224] border border-cyan-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                    Semantic Differences & Provenance Tracing ({oneStopResult.differences.length + cmrResult.differences.length})
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Select a difference to trace: Destination → Projection → Rosetta → Canonical → Claim → Evidence
                </div>
              </div>

              <div className="space-y-3">
                {[...oneStopResult.differences, ...cmrResult.differences].map((diff) => {
                  const isSelected = selectedDiff?.id === diff.id;
                  return (
                    <div
                      key={diff.id}
                      onClick={() => {
                        setSelectedDiff(diff);
                        if (onSelectDifference) onSelectDifference(diff);
                      }}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0f2142] border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                          : 'bg-[#060c18] border-slate-800 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDiffClassBadge(diff.diffClass)}
                          <span className="text-xs font-mono font-bold text-slate-100">{diff.field}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({diff.id})</span>
                        </div>
                        <span className="text-[11px] font-mono text-rose-400">MISMATCH</span>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 font-sans">{diff.explanation}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                        <div className="p-2.5 rounded bg-[#040813] border border-cyan-500/20">
                          <span className="text-[10px] text-cyan-400 font-bold block mb-1">CANONICAL EXPECTED:</span>
                          <span className="text-slate-200 break-words">
                            {typeof diff.expectedValue === 'object'
                              ? JSON.stringify(diff.expectedValue)
                              : String(diff.expectedValue)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-[#040813] border border-rose-500/20">
                          <span className="text-[10px] text-rose-400 font-bold block mb-1">DESTINATION OBSERVED:</span>
                          <span className="text-rose-200 break-words">
                            {typeof diff.observedValue === 'object'
                              ? JSON.stringify(diff.observedValue)
                              : String(diff.observedValue)}
                          </span>
                        </div>
                      </div>

                      {/* Rosetta & Provenance Trace Line */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-cyan-500/30 bg-[#06142a] p-3 rounded-lg text-xs font-mono space-y-2">
                          <div className="flex items-center justify-between text-cyan-300 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" />
                              <span>Rosetta Semantic Lineage Trace</span>
                            </span>
                            <span className="text-[10px] text-slate-400">VERIFIED CHAIN</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-1">
                            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                              Destination: {diff.projectionRef || 'echo10:payload'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                              Rosetta: {diff.rosettaMappingRef || 'rosetta:iso-to-echo10'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                              Canonical: {diff.canonicalRef || 'mission:en2501'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                              Accepted Claim: {diff.claimRef || 'claim-accepted'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                              Source Evidence: {diff.evidenceRef || 'charlie-form:col-2'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: QA Jurisdiction Invariant & Scoped Receipts */}
        {activeTab === 'RECEIPTS_INVARIANTS' && (
          <div className="space-y-6">
            <div className="bg-[#081224] border border-cyan-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                  The QA Jurisdiction Invariant
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Each authority operates within a strictly delimited domain. One green light must <strong>never</strong> transitively set another green light. A CoMET validation PASS guarantees ISO syntax compliance, but does <em>not</em> prove OISS acceptance, data QA, or catalog discoverability.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Audited Authoritative Scoped Receipts ({OFFICIAL_AUTHORITY_RECEIPTS.length})
              </h4>

              {OFFICIAL_AUTHORITY_RECEIPTS.map((receipt) => (
                <div key={receipt.id} className="bg-[#081224] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        {receipt.authority}
                      </span>
                      <span className="text-xs font-mono text-slate-200 font-bold">{receipt.authorityScope}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {receipt.assertion}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Observed At:</span>
                      <span className="text-slate-200">{receipt.observedAt}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Scope Ref:</span>
                      <span className="text-cyan-300">{receipt.scopeRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Response Cryptographic Hash:</span>
                      <span className="text-amber-300">{receipt.responseHash}</span>
                    </div>
                  </div>

                  {/* Explicit DOES NOT PROVE Boundary */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block mb-1.5">
                      Explicit Truth Boundary (Does NOT Prove):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {receipt.doesNotProve.map((dnp, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 text-rose-300 border border-rose-500/30">
                          ✕ {dnp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Truth Boundary Audit */}
        {activeTab === 'TRUTH_BOUNDARY' && (
          <div className="bg-[#081224] border border-cyan-500/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                NCEI Operational Contract Truth Boundary
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                AUDITED PHASE 2 SPECIFICATION
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded bg-[#040813] border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-slate-200 font-bold block">1. CoMET Live Read</span>
                  <span className="text-slate-400 text-[11px]">GET /metadata/{'{uuid}'} via CEDIT Gateway</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  LIVE_OBSERVED / PROVEN
                </span>
              </div>

              <div className="p-3 rounded bg-[#040813] border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-slate-200 font-bold block">2. CoMET Service Execution</span>
                  <span className="text-slate-400 text-[11px]">POST /recordServices/validate (ISO 19139 Schema validation)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  LIVE_OBSERVED / PROVEN
                </span>
              </div>

              <div className="p-3 rounded bg-[#040813] border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-slate-200 font-bold block">3. CoMET Production Writes</span>
                  <span className="text-slate-400 text-[11px]">WAF publishing / XML catalog overwrite</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30">
                  AUTH_REQUIRED / STRICTLY GATED
                </span>
              </div>

              <div className="p-3 rounded bg-[#040813] border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-slate-200 font-bold block">4. OneStop ↔ CMR Comparison</span>
                  <span className="text-slate-400 text-[11px]">Elasticsearch OSIM query & CMR Concept Search</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30">
                  SYNTHETIC_FIXTURE (STRICTLY LABELED)
                </span>
              </div>

              <div className="p-3 rounded bg-[#040813] border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-slate-200 font-bold block">5. OISS Hand-off Profile</span>
                  <span className="text-slate-400 text-[11px]">Preflight validation against documented submission rules</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  LOCAL_DERIVED / OISS_HANDOFF_READY
                </span>
              </div>

              <div className="p-3 rounded bg-[#040813] border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-slate-200 font-bold block">6. OISS Runtime Execution</span>
                  <span className="text-slate-400 text-[11px]">Automated backend pipeline ingestion execution</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-700">
                  UNPROVEN / EXTERNAL-ONLY
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QA Jurisdiction Invariant Tests */}
        {activeTab === 'QA_TESTS' && (
          <div className="bg-[#081224] border border-cyan-500/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  Separation of Concerns: QA Jurisdiction Invariant Test Suite
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded border ${
                qaTestResults.allPassed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950 text-rose-300 border-rose-500/40'
              }`}>
                {qaTestResults.allPassed ? '✓ 4/4 INVARIANTS PROVEN' : 'INVARIANT FAILURE'}
              </span>
            </div>

            <div className="p-3 bg-[#040813] border border-cyan-900/40 rounded-lg text-xs text-slate-300 leading-relaxed font-sans">
              <strong>Formal Verification Mandate:</strong> QA jurisdictions must remain strictly distinct. A positive verdict in one domain (such as a CoMET ISO 19139 schema pass or MANTAS preflight clearance) must <em>never</em> transitively assert acceptance in an external operational domain (such as OISS ingest or NOAA Archive preservation).
            </div>

            <div className="space-y-3">
              {qaTestResults.results.map((test, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300 font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200 font-mono">{test.invariantName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      test.passed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}>
                      {test.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#02050c] border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Jurisdiction Domain A:</span>
                      <span className="text-slate-200 font-bold">{test.jurisdictionA}</span>
                      <div className="mt-1 text-cyan-300 text-[11px]">Verdict: {test.verdictA}</div>
                    </div>
                    <div className="p-2.5 rounded bg-[#02050c] border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Independent Jurisdiction B:</span>
                      <span className="text-slate-200 font-bold">{test.jurisdictionB}</span>
                      <div className="mt-1 text-purple-300 text-[11px]">Verdict: {test.verdictB}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans">{test.details}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
                      Boundaries Checked (doesNotProve):
                    </span>
                    {test.doesNotProveAudit.map((dnp, dIdx) => (
                      <span key={dIdx} className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950/30 text-rose-300 border border-rose-800/40">
                        ✕ {dnp}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
