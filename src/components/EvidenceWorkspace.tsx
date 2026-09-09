import React, { useState } from 'react';
import {
  Database,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Link,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  GitCommit,
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';
import {
  Claim,
  SourceObservation,
  ObservedComponentReference,
  UxSMission,
  RelationshipPredicate
} from '../types';
import { SourceFirstIngestionPanel } from './corpus/SourceFirstIngestionPanel';
import { CandidateIdentityQueuePanel } from './corpus/CandidateIdentityQueuePanel';
import { CapabilityMaturityMatrixPanel } from './corpus/CapabilityMaturityMatrixPanel';
import { CorpusAuditHarnessPanel } from './corpus/CorpusAuditHarnessPanel';

interface EvidenceWorkspaceProps {
  mission: UxSMission;
  onAcceptClaim: (claimId: string, acceptedValue?: any) => void;
  onRejectClaim: (claimId: string, reason?: string) => void;
  onSelectDocucompRef: (ref: ObservedComponentReference) => void;
}

export const EvidenceWorkspace: React.FC<EvidenceWorkspaceProps> = ({
  mission,
  onAcceptClaim,
  onRejectClaim,
  onSelectDocucompRef,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'claims' | 'predicates' | 'docucomp' | 'sources' | 'source-first' | 'candidates' | 'maturity' | 'audit-harness'
  >('claims');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(
    mission.claims && mission.claims.length > 0 ? mission.claims[4] : null // Default to the conflict claim
  );
  const [resolvedDocucompId, setResolvedDocucompId] = useState<string | null>(null);

  const claims = mission.claims || [];
  const sources = mission.sourceObservations || [];
  const docucompRefs = mission.docucompReferences || [];

  const filteredClaims = claims.filter((c) => {
    if (filterState === 'ALL') return true;
    return c.state === filterState;
  });

  const getClaimStateBadge = (state: Claim['state']) => {
    switch (state) {
      case 'ACCEPTED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'CONFLICT':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60 animate-pulse';
      case 'INFERRED':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'OBSERVED':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'REJECTED':
        return 'bg-slate-900 text-slate-400 border-slate-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getPredicateBadge = (predicate: string) => {
    switch (predicate) {
      case 'CAN_CARRY':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'CONFIGURED_WITH':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'CARRIED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'PRODUCED':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'SUPPORTED_BY':
      case 'OBSERVABLE_BY':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="evidence-workspace-container" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      {/* Evidence Sub-Header Tabs */}
      <div className="bg-[#091120] border-b border-cyan-500/20 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
            EVIDENCE & CLAIMS RECONCILIATION
          </h2>
          <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
            Spine: SourceObservation → Claim → Decision → Canonical
          </span>
        </div>

        {/* View Switcher: Claims List | Platform-Sensor Predicates | DocuComp Components | Raw Sources | Source-First Ingest | Candidate Queue | Capability Maturity | Audit Harness */}
        <div className="flex flex-wrap items-center bg-[#050912] border border-cyan-500/20 rounded-lg p-0.5 text-xs font-mono gap-0.5">
          <button
            id="subtab-claims-btn"
            onClick={() => setActiveSubTab('claims')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeSubTab === 'claims'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Claims ({claims.length})
          </button>
          <button
            id="subtab-predicates-btn"
            onClick={() => setActiveSubTab('predicates')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeSubTab === 'predicates'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Platform & Sensor Graph
          </button>
          <button
            id="subtab-source-first-btn"
            onClick={() => setActiveSubTab('source-first')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeSubTab === 'source-first'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Source-First Ingestion
          </button>
          <button
            id="subtab-candidates-btn"
            onClick={() => setActiveSubTab('candidates')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeSubTab === 'candidates'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Identity Candidates
          </button>
          <button
            id="subtab-maturity-btn"
            onClick={() => setActiveSubTab('maturity')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeSubTab === 'maturity'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Capability Maturity
          </button>
          <button
            id="subtab-audit-harness-btn"
            onClick={() => setActiveSubTab('audit-harness')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeSubTab === 'audit-harness'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Harness (15 Tests)
          </button>
          <button
            id="subtab-docucomp-btn"
            onClick={() => setActiveSubTab('docucomp')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeSubTab === 'docucomp'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DocuComp ({docucompRefs.length})
          </button>
          <button
            id="subtab-sources-btn"
            onClick={() => setActiveSubTab('sources')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeSubTab === 'sources'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sources ({sources.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* SUBTAB 1: CLAIMS & CONFLICT RESOLVER */}
        {activeSubTab === 'claims' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Filterable Claims List */}
            <div className="w-full md:w-1/2 lg:w-3/5 border-r border-slate-800 overflow-y-auto p-4 space-y-3">
              {/* Filter pills */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  {['ALL', 'CONFLICT', 'OBSERVED', 'INFERRED', 'ACCEPTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterState(st)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        filterState === st
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 bg-[#080e1b] border border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {filteredClaims.length} claims
                </span>
              </div>

              {filteredClaims.map((claim) => {
                const isSelected = selectedClaim?.id === claim.id;
                return (
                  <div
                    key={claim.id}
                    id={`claim-card-${claim.id}`}
                    onClick={() => setSelectedClaim(claim)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0a1529] border-cyan-500/60 shadow-md'
                        : 'bg-[#080f1e] border-slate-800/80 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getClaimStateBadge(claim.state)}`}>
                          {claim.state}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getPredicateBadge(claim.predicate)}`}>
                          {claim.predicate}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {claim.id}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {Math.round(claim.confidence * 100)}% conf
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-mono">
                      <div className="text-slate-400">
                        <span className="text-slate-500">Subject:</span>{' '}
                        <strong className="text-slate-200">{claim.subject}</strong>
                      </div>
                      <div className="text-cyan-300 mt-0.5">
                        <span className="text-slate-500">Value / Object:</span>{' '}
                        <span className="font-semibold">{String(claim.objectValue)}</span>
                      </div>
                    </div>

                    {claim.whyExplanation && (
                      <p className="text-[11px] text-slate-400 font-sans mt-2 bg-[#050912]/80 p-2 rounded border border-slate-800/80">
                        {claim.whyExplanation}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                      <span>{claim.sources.length} supporting sources</span>
                      {claim.state === 'CONFLICT' ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Human Decision Required
                        </span>
                      ) : claim.state === 'ACCEPTED' ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Accepted by {claim.acceptedBy}
                        </span>
                      ) : (
                        <span className="text-cyan-400">Review Candidate →</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Detailed Decision & Explanation Inspector */}
            <div className="w-full md:w-1/2 lg:w-2/5 overflow-y-auto p-5 bg-[#050a14] space-y-4">
              {selectedClaim ? (
                <>
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getClaimStateBadge(selectedClaim.state)}`}>
                        {selectedClaim.state} CLAIM
                      </span>
                      <span className="text-xs font-mono text-cyan-300 font-bold">
                        Confidence: {Math.round(selectedClaim.confidence * 100)}%
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono mt-2">
                      {selectedClaim.subject}
                    </h3>
                    <div className="inline-block mt-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getPredicateBadge(selectedClaim.predicate)}`}>
                        {selectedClaim.predicate}
                      </span>
                    </div>
                  </div>

                  {/* Conflict Decision Interface */}
                  {selectedClaim.conflictDetails && (
                    <div className="bg-rose-950/30 border border-rose-600/40 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Reconciliation Required: Conflicting Observations</span>
                      </h4>
                      <p className="text-xs text-rose-200/80">
                        Different authoritative sources disagree on this entity. Select the canonical truth to adopt into the mission model.
                      </p>

                      <div className="space-y-2">
                        {selectedClaim.conflictDetails.conflictingValues.map((opt, idx) => (
                          <div
                            key={idx}
                            className="bg-[#080d1a] border border-slate-800 p-2.5 rounded-lg flex items-center justify-between gap-2"
                          >
                            <div className="text-xs font-mono">
                              <div className="font-semibold text-cyan-200">{opt.value}</div>
                              <div className="text-[11px] text-slate-400">
                                Source: <span className="text-amber-300">{opt.source}</span>
                                {opt.excerpt && ` — "${opt.excerpt}"`}
                              </div>
                            </div>
                            <button
                              id={`accept-conflict-option-${idx}`}
                              onClick={() => onAcceptClaim(selectedClaim.id, opt.value)}
                              className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-colors"
                            >
                              Accept
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candidate Value Box */}
                  <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                    <h4 className="text-xs font-semibold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Asserted Object Value</span>
                    </h4>
                    <div className="p-2.5 bg-[#040812] border border-slate-800 rounded-lg text-cyan-300 font-semibold text-sm">
                      {String(selectedClaim.objectValue)}
                    </div>
                  </div>

                  {/* Provenance Trail / Supporting Sources */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Observed Evidence Trail ({selectedClaim.sources.length})
                    </h4>
                    {selectedClaim.sources.map((src) => (
                      <div
                        key={src.id}
                        className="bg-[#070e1c] border border-slate-800 p-3 rounded-lg space-y-1.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 font-semibold">{src.sourceTitle}</span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                            {src.authority}
                          </span>
                        </div>
                        {src.documentExcerpt && (
                          <p className="text-[11px] text-slate-300 italic bg-[#040810] p-2 rounded border border-slate-800/80">
                            "{src.documentExcerpt}"
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Observed: {src.observedAt.split('T')[0]}</span>
                          <span>Reliability: {Math.round(src.reliabilityScore * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Decision Controls (Explicit Human Acceptance Rule) */}
                  <div className="bg-[#091326] border border-cyan-500/30 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      Human Data Steward Decision
                    </h4>
                    <p className="text-xs text-slate-400 font-sans">
                      Under the MANTAS doctrine, only explicit human acceptance transforms candidate claims into canonical truth.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        id="accept-canonical-claim-btn"
                        onClick={() => onAcceptClaim(selectedClaim.id, selectedClaim.objectValue)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept as Canonical Truth</span>
                      </button>

                      <button
                        id="reject-claim-btn"
                        onClick={() => onRejectClaim(selectedClaim.id, 'Steward declined assertion')}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 font-semibold text-xs font-mono transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 font-mono text-xs">
                  <Database className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Select a claim to review its evidence and make a canonical decision</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: DISTINCT PLATFORM-SENSOR-SCIENCE PREDICATES */}
        {activeSubTab === 'predicates' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-sans">
                Distinct Platform, Sensor & Science Predicate Hierarchy
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                The architecture distinguishes platform models from physical assets and deployments to prevent collapsing operational reality into generic text.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Predicate 1: CAN_CARRY */}
              <div className="bg-[#08101f] border border-cyan-500/25 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    CAN_CARRY (Model Compatibility)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">PlatformModel → InstrumentModel</span>
                </div>
                <p className="text-xs text-slate-300">
                  Defines engineering compatibility between vehicle design and sensor payload bay.
                </p>
                <div className="bg-[#050912] p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-200">
                  <code>PlatformModel:REMUS-620</code> <strong>CAN_CARRY</strong> <code>InstrumentModel:Kraken-MINSAS</code>
                </div>
              </div>

              {/* Predicate 2: CONFIGURED_WITH */}
              <div className="bg-[#08101f] border border-amber-500/25 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                    CONFIGURED_WITH (Asset Physical State)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">PhysicalAsset → InstrumentInstance</span>
                </div>
                <p className="text-xs text-slate-300">
                  Asserts specific serial numbers and hull identifiers as recorded in the UxS Fleet Inventory.
                </p>
                <div className="bg-[#050912] p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-amber-200">
                  <code>PhysicalAsset:REMUS-620-#6401</code> <strong>CONFIGURED_WITH</strong> <code>InstrumentInstance:Kraken-MINSAS-SN204</code>
                </div>
              </div>

              {/* Predicate 3: CARRIED */}
              <div className="bg-[#08101f] border border-emerald-500/25 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-300 uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                    CARRIED (Deployment Reality)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Deployment → InstrumentInstance</span>
                </div>
                <p className="text-xs text-slate-300">
                  Corroborated by cruise operations logs and actual underway telemetry packets.
                </p>
                <div className="bg-[#050912] p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-emerald-200">
                  <code>Deployment:PS2418-Dive01</code> <strong>CARRIED</strong> <code>InstrumentInstance:Kraken-MINSAS-SN204</code>
                </div>
              </div>

              {/* Predicate 4: PRODUCED */}
              <div className="bg-[#08101f] border border-indigo-500/25 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300 uppercase px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                    PRODUCED (Data Lineage)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">InstrumentInstance → Dataset</span>
                </div>
                <p className="text-xs text-slate-300">
                  Connects raw sensor streaming records to final archive packages and STAC assets.
                </p>
                <div className="bg-[#050912] p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-indigo-200">
                  <code>InstrumentInstance:Kraken-MINSAS-SN204</code> <strong>PRODUCED</strong> <code>Dataset:Acoustic-Backscatter-Mosaic</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: PRESERVED DOCUCOMP REUSABLE EXTERNAL COMPONENTS */}
        {activeSubTab === 'docucomp' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 font-sans">
                  DocuComp External Component Registry (XLinks Preserved)
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Docucomp v4.9.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Per user doctrine, DocuComp references <strong>must remain references</strong> (preserving href, source system, ISO slot, relationship, and observed timestamp), rather than flattening into inlined text pretending MANTAS owns it.
              </p>
            </div>

            <div className="space-y-4">
              {docucompRefs.map((ref) => {
                const isResolved = resolvedDocucompId === ref.id;
                return (
                  <div
                    key={ref.id}
                    id={`docucomp-card-${ref.id}`}
                    className="bg-[#08101e] border border-cyan-500/25 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-200 font-sans">
                            {ref.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                            {ref.isoSlot}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                          <Link className="w-3 h-3 text-cyan-400" />
                          <a
                            href={ref.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 underline hover:text-cyan-200 truncate max-w-[320px] sm:max-w-[480px]"
                          >
                            {ref.href}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setResolvedDocucompId(isResolved ? null : ref.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0d1b32] hover:bg-[#122544] text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isResolved ? 'Hide Resolved XML' : 'Resolve Preview'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-[#050912] p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500">Component UUID:</span>
                        <div className="text-slate-300 truncate">{ref.uuid}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Semantic Role:</span>
                        <div className="text-cyan-300">{ref.semanticRole}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Component Group:</span>
                        <div className="text-slate-300 truncate">{ref.componentGroup || 'Master Group'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Synchronized:</span>
                        <div className="text-slate-400">{ref.lastUpdated?.split('T')[0]}</div>
                      </div>
                    </div>

                    {/* Resolved XML View toggle */}
                    {isResolved && ref.resolvedXmlSnippet && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                          <span>Resolved Authority XML (from DocuComp Master Registry):</span>
                          <span className="text-[10px] text-cyan-400 font-mono">ISO 19139 snippet</span>
                        </div>
                        <pre className="bg-[#03060d] border border-cyan-900/50 rounded-lg p-3 text-[11px] font-mono text-cyan-200/90 overflow-x-auto">
                          {ref.resolvedXmlSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 4: RAW SOURCES INVENTORY */}
        {activeSubTab === 'sources' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-sans">
                Source Observations Catalog
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Observed evidence from scientific cruise reports, telemetry logs, fleet registries, and CoMET catalog XML records.
              </p>
            </div>

            <div className="space-y-3">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="bg-[#08101e] border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100 font-sans">{src.sourceTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {src.authority}
                    </span>
                  </div>
                  {src.sourceUri && (
                    <div className="text-[11px] text-cyan-400 truncate">
                      URI: <a href={src.sourceUri} target="_blank" rel="noopener noreferrer" className="underline">{src.sourceUri}</a>
                    </div>
                  )}
                  {src.documentExcerpt && (
                    <p className="text-slate-300 italic bg-[#050912] p-2.5 rounded-lg border border-slate-800/80">
                      "{src.documentExcerpt}"
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Recorded: {src.observedAt}</span>
                    <span>Reliability Score: {Math.round(src.reliabilityScore * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 5: SOURCE-FIRST INGESTION STAGING */}
        {activeSubTab === 'source-first' && <SourceFirstIngestionPanel />}

        {/* SUBTAB 6: CANDIDATE IDENTITY QUEUE */}
        {activeSubTab === 'candidates' && <CandidateIdentityQueuePanel />}

        {/* SUBTAB 7: CAPABILITY MATURITY MATRIX */}
        {activeSubTab === 'maturity' && <CapabilityMaturityMatrixPanel />}

        {/* SUBTAB 8: CORPUS AUDIT & INVARIANT HARNESS */}
        {activeSubTab === 'audit-harness' && <CorpusAuditHarnessPanel mission={mission} />}
      </div>
    </div>
  );
};
