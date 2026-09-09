import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, GitCompare, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import {
  UxSMission,
  DestinationObservation,
  SemanticDifference,
  ComparisonState,
  FreshnessState,
  WorkspaceSelection,
} from '../types';
import {
  SEED_ONESTOP_OBSERVATION,
  SEED_CMR_OBSERVATION,
  compareDestinationWithCanonical,
  OFFICIAL_AUTHORITY_RECEIPTS,
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
  onSelectDifference,
  onNavigateTab,
}) => {
  const [oneStopObs, setOneStopObs] = useState<DestinationObservation | null>(SEED_ONESTOP_OBSERVATION);
  const [cmrObs, setCmrObs] = useState<DestinationObservation | null>(SEED_CMR_OBSERVATION);
  const [selectedDiff, setSelectedDiff] = useState<SemanticDifference | null>(null);
  const [isReobserving, setIsReobserving] = useState(false);

  const oneStopResult = compareDestinationWithCanonical(mission, oneStopObs, 'OneStop');
  const cmrResult = compareDestinationWithCanonical(mission, cmrObs, 'CMR');
  const qaTestResults = runQaJurisdictionTests(mission);

  const differences = useMemo(
    () => [
      ...oneStopResult.differences.map((diff) => ({ source: 'OneStop', diff })),
      ...cmrResult.differences.map((diff) => ({ source: 'CMR', diff })),
    ],
    [oneStopResult.differences, cmrResult.differences]
  );

  const handleReobserve = () => {
    setIsReobserving(true);
    setTimeout(() => {
      const observedAt = new Date().toISOString();
      if (oneStopObs) setOneStopObs({ ...oneStopObs, freshness: 'CURRENT', observedAt });
      if (cmrObs) setCmrObs({ ...cmrObs, freshness: 'CURRENT', observedAt });
      setIsReobserving(false);
    }, 600);
  };

  const markStale = () => {
    if (oneStopObs) setOneStopObs({ ...oneStopObs, freshness: 'STALE' });
    if (cmrObs) setCmrObs({ ...cmrObs, freshness: 'STALE' });
  };

  const selectDifference = (diff: SemanticDifference) => {
    setSelectedDiff(diff);
    onSelectDifference?.(diff);
  };

  return (
    <div id="destination-compare-surface" className="w-full h-full flex flex-col bg-[#050a12] text-slate-200 overflow-hidden font-sans">
      <header className="px-6 py-5 border-b border-slate-900 flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <span>Destination compare</span>
          </div>
          <h2 className="mt-1 text-lg font-medium text-slate-100">OneStop ↔ CMR</h2>
          <p className="mt-1 text-sm text-slate-500">Compare observed discovery records with the accepted mission meaning.</p>
        </div>

        <button
          onClick={handleReobserve}
          disabled={isReobserving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-cyan-300 hover:bg-cyan-950/25 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReobserving ? 'animate-spin' : ''}`} />
          {isReobserving ? 'Observing…' : 'Re-observe'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="space-y-3">
            <DestinationRow
              name="OneStop / OSIM"
              state={oneStopResult.state}
              freshness={oneStopResult.freshness}
              matched={oneStopResult.matchedFieldsCount}
              tested={oneStopResult.testedFieldsCount}
              differences={oneStopResult.differences.length}
              provenance={oneStopResult.provenanceType}
              recordIdentifier={oneStopResult.recordIdentifier}
            />
            <DestinationRow
              name="NOAA / NASA CMR"
              state={cmrResult.state}
              freshness={cmrResult.freshness}
              matched={cmrResult.matchedFieldsCount}
              tested={cmrResult.testedFieldsCount}
              differences={cmrResult.differences.length}
              provenance={cmrResult.provenanceType}
              recordIdentifier={cmrResult.recordIdentifier}
            />
          </section>

          <section className="border-t border-slate-900 pt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Differences</div>
                <h3 className="mt-1 text-lg font-medium text-slate-100">{differences.length} observed differences</h3>
              </div>
              <button
                onClick={() => onNavigateTab?.('rosetta')}
                className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
              >
                Rosetta
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {differences.length === 0 ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                No semantic differences in the fields tested.
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-900">
                {differences.map(({ source, diff }) => {
                  const isSelected = selectedDiff?.id === diff.id;
                  return (
                    <button
                      key={`${source}-${diff.id}`}
                      onClick={() => selectDifference(diff)}
                      className={`w-full text-left py-4 transition-colors ${isSelected ? 'text-slate-100' : 'text-slate-300 hover:text-slate-100'}`}
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                          <div className="text-xs text-slate-600">{source} · {diff.diffClass}</div>
                          <div className="mt-1 text-sm font-medium">{diff.field}</div>
                          <div className="mt-1 text-sm text-slate-500 leading-relaxed">{diff.explanation}</div>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                      </div>

                      {isSelected && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 pl-4 border-l border-slate-800">
                          <ValueBlock label="Expected" value={diff.expectedValue} />
                          <ValueBlock label="Observed" value={diff.observedValue} />
                          <div className="md:col-span-2 text-xs text-slate-600 font-mono break-all">
                            {diff.canonicalRef || 'canonical'} → {diff.rosettaMappingRef || 'mapping'} → {diff.projectionRef || 'destination'}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <details className="border-t border-slate-900 pt-6 text-sm text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300">Expected mission context</summary>
            <div className="mt-5 pl-4 border-l border-slate-800 space-y-3">
              <CalmRow label="Identifier" value={mission.doi || mission.id} />
              <CalmRow label="Title" value={mission.title} />
              <CalmRow label="Platform" value={mission.platform.name} />
              <CalmRow label="Time" value={`${mission.dateStart} – ${mission.dateEnd}`} />
            </div>
          </details>

          <details className="border-t border-slate-900 pt-6 text-sm text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300">Authority receipts and invariant tests</summary>
            <div className="mt-5 space-y-5 pl-4 border-l border-slate-800">
              <div className="text-sm text-slate-400 leading-relaxed">
                A positive result is scoped to the authority that issued it. CoMET, OISS, archive, data QA, and discovery outcomes do not transfer to one another.
              </div>
              <div className="space-y-3">
                {OFFICIAL_AUTHORITY_RECEIPTS.map((receipt) => (
                  <div key={receipt.id} className="grid grid-cols-[120px_1fr] gap-4 text-xs">
                    <div className="text-slate-600">{receipt.authority}</div>
                    <div>
                      <div className="text-slate-300">{receipt.assertion}</div>
                      <div className="mt-1 text-slate-600">Does not prove: {receipt.doesNotProve.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500">
                QA invariant suite: <span className={qaTestResults.allPassed ? 'text-emerald-300' : 'text-rose-300'}>{qaTestResults.allPassed ? 'PASS' : 'REVIEW'}</span>
              </div>
            </div>
          </details>

          <details className="border-t border-slate-900 pt-6 text-sm text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300">Demo freshness controls</summary>
            <div className="mt-4 pl-4 border-l border-slate-800">
              <button onClick={markStale} className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Mark observations stale after a canonical change
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

const DestinationRow: React.FC<{
  name: string;
  state: ComparisonState;
  freshness?: FreshnessState;
  matched: number;
  tested: number;
  differences: number;
  provenance: string;
  recordIdentifier?: string;
}> = ({ name, state, freshness, matched, tested, differences, provenance, recordIdentifier }) => {
  const stale = freshness === 'STALE';
  const stateClass = stale
    ? 'text-amber-300'
    : state === 'MATCH'
    ? 'text-emerald-300'
    : state === 'MISMATCH' || state === 'MISSING'
    ? 'text-rose-300'
    : 'text-slate-400';

  return (
    <div className="grid grid-cols-[1fr_auto] gap-5 items-center py-4 border-b border-slate-900 last:border-b-0">
      <div className="min-w-0">
        <div className="text-base font-medium text-slate-100">{name}</div>
        <div className="mt-1 text-xs text-slate-600 truncate" title={recordIdentifier}>{recordIdentifier || 'No record identifier observed'}</div>
        <div className="mt-2 text-xs text-slate-500">{matched}/{tested} fields matched · {differences} differences · {provenance}</div>
      </div>
      <div className={`text-xs font-medium ${stateClass}`}>{stale ? 'STALE' : state}</div>
    </div>
  );
};

const ValueBlock: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{label}</div>
    <div className="mt-1 text-sm text-slate-300 break-words leading-relaxed">
      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
    </div>
  </div>
);

const CalmRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="grid grid-cols-[100px_1fr] gap-4">
    <div className="text-xs text-slate-600">{label}</div>
    <div className="text-sm text-slate-300 leading-relaxed">{value}</div>
  </div>
);
