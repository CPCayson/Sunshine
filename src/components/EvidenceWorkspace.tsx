import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Layers,
  Link,
  XCircle,
} from 'lucide-react';
import {
  Claim,
  ObservedComponentReference,
  UxSMission,
  WorkspaceSelection,
} from '../types';
import { SourceFirstIngestionPanel } from './corpus/SourceFirstIngestionPanel';
import { CandidateIdentityQueuePanel } from './corpus/CandidateIdentityQueuePanel';
import { CapabilityMaturityMatrixPanel } from './corpus/CapabilityMaturityMatrixPanel';
import { CorpusAuditHarnessPanel } from './corpus/CorpusAuditHarnessPanel';

interface EvidenceWorkspaceProps {
  mission: UxSMission;
  selection?: WorkspaceSelection;
  onAcceptClaim: (claimId: string, acceptedValue?: any) => void;
  onRejectClaim: (claimId: string, reason?: string) => void;
  onSelectDocucompRef: (ref: ObservedComponentReference) => void;
}

type EvidenceView =
  | 'claims'
  | 'sources'
  | 'predicates'
  | 'docucomp'
  | 'source-first'
  | 'candidates'
  | 'maturity'
  | 'audit-harness';

const secondaryViews: Array<{ id: EvidenceView; label: string }> = [
  { id: 'predicates', label: 'Relationship boundaries' },
  { id: 'source-first', label: 'Source-first ingestion' },
  { id: 'candidates', label: 'Identity candidates' },
  { id: 'maturity', label: 'Capability maturity' },
  { id: 'audit-harness', label: 'Audit harness' },
  { id: 'docucomp', label: 'DocuComp references' },
];

const valueText = (value: any) => {
  if (value === null || value === undefined || value === '') return 'UNKNOWN';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const stateClass = (state: Claim['state']) => {
  switch (state) {
    case 'CONFLICT': return 'text-rose-300 border-rose-800/70 bg-rose-950/20';
    case 'ACCEPTED': return 'text-emerald-300 border-emerald-800/70 bg-emerald-950/20';
    case 'INFERRED': return 'text-purple-300 border-purple-800/70 bg-purple-950/20';
    case 'OBSERVED': return 'text-cyan-300 border-cyan-800/70 bg-cyan-950/20';
    case 'REJECTED': return 'text-slate-500 border-slate-800 bg-slate-950/20';
    default: return 'text-amber-300 border-amber-800/70 bg-amber-950/20';
  }
};

export const EvidenceWorkspace: React.FC<EvidenceWorkspaceProps> = ({
  mission,
  onAcceptClaim,
  onRejectClaim,
  onSelectDocucompRef,
}) => {
  const [activeView, setActiveView] = useState<EvidenceView>('claims');
  const [filterState, setFilterState] = useState<string>('ALL');
  const claims = mission.claims || [];
  const sources = mission.sourceObservations || [];
  const docucompRefs = mission.docucompReferences || [];
  const initialClaim = claims.find((claim) => claim.state === 'CONFLICT') || claims[0] || null;
  const [selectedClaimId, setSelectedClaimId] = useState<string>(initialClaim?.id || '');

  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId) || claims[0] || null;
  const filteredClaims = useMemo(
    () => claims.filter((claim) => filterState === 'ALL' || claim.state === filterState),
    [claims, filterState]
  );

  const isAdvanced = !['claims', 'sources'].includes(activeView);

  return (
    <div id="evidence-workspace-container" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      <header className="px-7 py-5 border-b border-slate-800 bg-[#07101c] flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Evidence</h2>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Follow one fact from source observation to claim, decision, and accepted mission meaning.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setActiveView('claims')}
            className={`px-3 py-1.5 rounded-lg border ${activeView === 'claims' ? 'border-cyan-600/50 bg-cyan-950/30 text-cyan-200' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Claims
          </button>
          <button
            onClick={() => setActiveView('sources')}
            className={`px-3 py-1.5 rounded-lg border ${activeView === 'sources' ? 'border-cyan-600/50 bg-cyan-950/30 text-cyan-200' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Sources
          </button>
          <label className="relative">
            <select
              value={isAdvanced ? activeView : ''}
              onChange={(event) => event.target.value && setActiveView(event.target.value as EvidenceView)}
              className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg border bg-[#050b16] outline-none ${isAdvanced ? 'border-cyan-600/50 text-cyan-200' : 'border-slate-800 text-slate-400'}`}
            >
              <option value="">More</option>
              {secondaryViews.map((view) => <option key={view.id} value={view.id}>{view.label}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-slate-500" />
          </label>
        </div>
      </header>

      {activeView === 'claims' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] overflow-hidden">
          <aside className="border-r border-slate-800 bg-[#050a13] min-h-0 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <select
                value={filterState}
                onChange={(event) => setFilterState(event.target.value)}
                className="bg-transparent text-xs text-slate-400 border border-slate-800 rounded-lg px-2.5 py-1.5 outline-none"
              >
                {['ALL', 'CONFLICT', 'OBSERVED', 'INFERRED', 'ACCEPTED', 'REJECTED'].map((state) => <option key={state}>{state}</option>)}
              </select>
              <span className="text-xs text-slate-600">{filteredClaims.length} claims</span>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-2">
              {filteredClaims.map((claim) => {
                const selected = claim.id === selectedClaim?.id;
                return (
                  <button
                    key={claim.id}
                    onClick={() => setSelectedClaimId(claim.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${selected ? 'border-cyan-700/60 bg-cyan-950/15' : 'border-slate-800 bg-[#07101c] hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100 truncate">{claim.subject}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${stateClass(claim.state)}`}>{claim.state}</span>
                    </div>
                    <div className="mt-1.5 text-xs text-cyan-300">{claim.predicate}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{claim.sources.length} source{claim.sources.length === 1 ? '' : 's'}</span>
                      <span>{Math.round(claim.confidence * 100)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="overflow-auto">
            {selectedClaim ? (
              <div className="max-w-4xl mx-auto px-8 py-8 lg:px-12 lg:py-10 space-y-8">
                <section>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded border ${stateClass(selectedClaim.state)}`}>{selectedClaim.state}</span>
                    <span className="text-xs text-slate-500">{Math.round(selectedClaim.confidence * 100)}% confidence</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-100">{selectedClaim.subject}</h3>
                  <div className="mt-2 text-sm text-cyan-300">{selectedClaim.predicate}</div>
                  <div className="mt-5 text-lg text-slate-200 break-words">{valueText(selectedClaim.objectValue)}</div>
                  {selectedClaim.whyExplanation && (
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">{selectedClaim.whyExplanation}</p>
                  )}
                </section>

                {selectedClaim.conflictDetails && (
                  <section className="border-t border-slate-800 pt-7">
                    <div className="flex items-center gap-2 text-rose-300">
                      <AlertCircle className="w-4 h-4" />
                      <h4 className="font-semibold">Decision required</h4>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Choose the observation that should become accepted mission meaning. No option is accepted automatically.</p>
                    <div className="mt-5 space-y-3">
                      {selectedClaim.conflictDetails.conflictingValues.map((option, index) => (
                        <div key={`${option.source}-${index}`} className="rounded-xl border border-slate-800 bg-[#07101c] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="text-sm text-slate-200">{valueText(option.value)}</div>
                            <div className="mt-1 text-xs text-slate-500">Observed by {option.source}</div>
                            {option.excerpt && <div className="mt-2 text-xs text-slate-500 leading-relaxed">{option.excerpt}</div>}
                          </div>
                          <button onClick={() => onAcceptClaim(selectedClaim.id, option.value)} className="shrink-0 px-3 py-2 rounded-lg border border-emerald-700/50 text-emerald-300 hover:bg-emerald-950/20">
                            Accept this value
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="border-t border-slate-800 pt-7 flex flex-wrap items-center gap-3">
                  {selectedClaim.state !== 'ACCEPTED' && (
                    <button onClick={() => onAcceptClaim(selectedClaim.id)} className="px-4 py-2 rounded-lg bg-cyan-600 text-slate-950 font-semibold hover:bg-cyan-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Accept claim
                    </button>
                  )}
                  {selectedClaim.state !== 'REJECTED' && (
                    <button onClick={() => onRejectClaim(selectedClaim.id, 'Rejected from Evidence workspace')} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900 flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                </section>

                <details className="border-t border-slate-800 pt-6 group">
                  <summary className="cursor-pointer list-none flex items-center justify-between text-sm text-slate-300">
                    <span>Source evidence ({selectedClaim.sources.length})</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-5 space-y-3">
                    {selectedClaim.sources.map((source) => (
                      <div key={source.id} className="rounded-lg border border-slate-800 px-4 py-3">
                        <div className="text-sm text-slate-200">{source.sourceTitle}</div>
                        <div className="mt-1 text-xs text-slate-500">{source.authority} · {source.observedAt}</div>
                        {source.documentExcerpt && <p className="mt-2 text-xs leading-6 text-slate-400">{source.documentExcerpt}</p>}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600">No claim selected.</div>
            )}
          </main>
        </div>
      )}

      {activeView === 'sources' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-8 lg:px-12 lg:py-10">
            <h3 className="text-xl font-semibold text-slate-100">Source observations</h3>
            <p className="mt-2 text-sm text-slate-500">Evidence stays inspectable without competing with the accepted mission model.</p>
            <div className="mt-7 divide-y divide-slate-800 border-y border-slate-800">
              {sources.map((source) => (
                <div key={source.id} className="py-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 md:gap-8">
                  <div>
                    <div className="text-xs text-cyan-300">{source.authority}</div>
                    <div className="mt-1 text-xs text-slate-600">{source.observedAt}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">{source.sourceTitle}</div>
                    {source.documentExcerpt && <p className="mt-2 text-sm text-slate-400 leading-7">{source.documentExcerpt}</p>}
                    <div className="mt-2 text-xs text-slate-600">Reliability {Math.round(source.reliabilityScore * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'predicates' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-8 lg:px-12 lg:py-10">
            <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400" /><h3 className="text-xl font-semibold">Relationship boundaries</h3></div>
            <p className="mt-2 text-sm text-slate-500">Capability and operational evidence remain separate. One relationship never implies the next.</p>
            <div className="mt-8 space-y-1 border-y border-slate-800 divide-y divide-slate-800">
              {[
                ['CAN_CARRY', 'Platform model → instrument model', 'Provider or specification authority'],
                ['CONFIGURED_WITH', 'Physical asset → instrument instance', 'Physical configuration evidence'],
                ['CARRIED', 'Deployment → instrument instance', 'Bounded mission or deployment evidence'],
                ['PRODUCED', 'Instrument instance → dataset', 'Dataset lineage evidence'],
              ].map(([predicate, relationship, authority]) => (
                <div key={predicate} className="py-5 grid grid-cols-1 md:grid-cols-[160px_1fr_220px] gap-2 md:gap-8 items-start">
                  <div className="text-sm font-semibold text-cyan-300">{predicate}</div>
                  <div className="text-sm text-slate-300">{relationship}</div>
                  <div className="text-xs text-slate-500">{authority}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'docucomp' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-8 lg:px-12 lg:py-10">
            <div className="flex items-center gap-2"><Link className="w-4 h-4 text-purple-400" /><h3 className="text-xl font-semibold">DocuComp references</h3></div>
            <p className="mt-2 text-sm text-slate-500">Reusable component references remain external authority evidence.</p>
            <div className="mt-7 divide-y divide-slate-800 border-y border-slate-800">
              {docucompRefs.map((ref) => (
                <button key={ref.id} onClick={() => onSelectDocucompRef(ref)} className="w-full text-left py-5 flex items-center justify-between gap-6 group">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-100">{ref.name}</div>
                    <div className="mt-1 text-xs text-slate-500 break-all">{ref.semanticRole} · {ref.isoSlot}</div>
                  </div>
                  <span className="text-xs text-purple-300 group-hover:text-purple-200">Inspect</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'source-first' && <SourceFirstIngestionPanel />}
      {activeView === 'candidates' && <CandidateIdentityQueuePanel />}
      {activeView === 'maturity' && <CapabilityMaturityMatrixPanel />}
      {activeView === 'audit-harness' && <CorpusAuditHarnessPanel mission={mission} />}
    </div>
  );
};