import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, GitCompare, Lock, RefreshCw } from 'lucide-react';
import {
  ComparisonState,
  DestinationObservation,
  FreshnessState,
  SemanticDifference,
  UxSMission,
  WorkspaceSelection,
} from '../types';
import {
  SEED_CMR_OBSERVATION,
  SEED_ONESTOP_OBSERVATION,
} from '../services/destinationReconciliationService';
import { compareOperationalDestinationWithCanonical } from '../services/destinationOperationalInterpreter';
import { runQaJurisdictionTests } from '../services/qaJurisdictionTest';
import {
  buildUniversalExpectedObserved,
  deriveOperationalEvidenceMode,
  invalidateDestinationObservationAfterCanonicalChange,
} from '../services/nceiOperationalContractService';

interface DestinationCompareProps {
  mission: UxSMission;
  selection?: WorkspaceSelection;
  onSelectDifference?: (diff: SemanticDifference) => void;
  onNavigateTab?: (tab: string) => void;
}

const canonicalFingerprint = (mission: UxSMission) =>
  JSON.stringify({
    id: mission.id,
    title: mission.title,
    platform: mission.platform,
    instruments: mission.instruments,
    dateStart: mission.dateStart,
    dateEnd: mission.dateEnd,
    spatialExtent: mission.spatialExtent,
    keywords: mission.keywords,
    contact: mission.contact,
    doi: mission.doi,
  });

export const DestinationCompare: React.FC<DestinationCompareProps> = ({
  mission,
  onSelectDifference,
  onNavigateTab,
}) => {
  // These are explicitly fixture observations until live OneStop / CMR adapters are connected.
  const [oneStopObs, setOneStopObs] = useState<DestinationObservation | null>(
    SEED_ONESTOP_OBSERVATION
  );
  const [cmrObs, setCmrObs] = useState<DestinationObservation | null>(SEED_CMR_OBSERVATION);
  const [selectedDiff, setSelectedDiff] = useState<SemanticDifference | null>(null);
  const [reobserveNote, setReobserveNote] = useState<string | null>(null);
  const previousCanonicalFingerprint = useRef(canonicalFingerprint(mission));

  const fingerprint = useMemo(() => canonicalFingerprint(mission), [mission]);

  // Freshness invalidation is automatic: if accepted canonical meaning changes after
  // an observation was captured, retain the observation but mark it STALE.
  useEffect(() => {
    if (previousCanonicalFingerprint.current !== fingerprint) {
      const changedAt = new Date().toISOString();
      setOneStopObs((current) =>
        invalidateDestinationObservationAfterCanonicalChange(current, changedAt)
      );
      setCmrObs((current) =>
        invalidateDestinationObservationAfterCanonicalChange(current, changedAt)
      );
      previousCanonicalFingerprint.current = fingerprint;
      setReobserveNote(
        'Canonical meaning changed. Existing destination observations were retained as evidence and marked stale.'
      );
    }
  }, [fingerprint]);

  const oneStopResult = compareOperationalDestinationWithCanonical(mission, oneStopObs, 'OneStop');
  const cmrResult = compareOperationalDestinationWithCanonical(mission, cmrObs, 'CMR');
  const qaTestResults = runQaJurisdictionTests(mission);
  const universalComparisons = buildUniversalExpectedObserved(mission, {
    oneStopObservation: oneStopObs,
    cmrObservation: cmrObs,
  });

  const oneStopMode = deriveOperationalEvidenceMode([oneStopObs]);
  const cmrMode = deriveOperationalEvidenceMode([cmrObs]);
  const hasLiveDestinationAdapter = oneStopMode === 'LIVE' || cmrMode === 'LIVE';

  const differences = useMemo(
    () => [
      ...oneStopResult.differences.map((diff) => ({ source: 'OneStop', diff })),
      ...cmrResult.differences.map((diff) => ({ source: 'CMR', diff })),
    ],
    [oneStopResult.differences, cmrResult.differences]
  );

  const handleReobserve = () => {
    if (!hasLiveDestinationAdapter) {
      setReobserveNote(
        'OneStop and CMR are currently fixture observations. A live re-observe is not performed or simulated.'
      );
      return;
    }

    setReobserveNote(
      'Live destination adapter hook is not connected in this surface yet; no observation was changed.'
    );
  };

  const selectDifference = (diff: SemanticDifference) => {
    setSelectedDiff(diff);
    onSelectDifference?.(diff);
  };

  return (
    <div
      id="destination-compare-surface"
      className="w-full h-full flex flex-col bg-[#050a12] text-slate-200 overflow-hidden font-sans"
    >
      <header className="px-7 py-6 border-b border-slate-900 flex items-center justify-between gap-5 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <span>Destination compare</span>
          </div>
          <h2 className="mt-1 text-xl font-medium text-slate-100">Canonical ↔ OneStop ↔ CMR</h2>
          <p className="mt-1 text-sm text-slate-500">
            External records are observations. They never overwrite accepted mission meaning.
          </p>
        </div>

        <button
          onClick={handleReobserve}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60"
          title={hasLiveDestinationAdapter ? 'Re-observe destinations' : 'Fixture mode: no live re-observe'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-observe
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-7">
        <div className="max-w-5xl mx-auto space-y-9">
          <section className="space-y-1">
            <DestinationRow
              name="OneStop / OSIM"
              mode={oneStopMode}
              state={oneStopResult.state}
              freshness={oneStopResult.freshness}
              matched={oneStopResult.matchedFieldsCount}
              tested={oneStopResult.testedFieldsCount}
              differences={oneStopResult.differences.length}
              recordIdentifier={oneStopResult.recordIdentifier}
            />
            <DestinationRow
              name="NOAA / NASA CMR"
              mode={cmrMode}
              state={cmrResult.state}
              freshness={cmrResult.freshness}
              matched={cmrResult.matchedFieldsCount}
              tested={cmrResult.testedFieldsCount}
              differences={cmrResult.differences.length}
              recordIdentifier={cmrResult.recordIdentifier}
            />
          </section>

          {reobserveNote && (
            <div className="flex items-start gap-2 border-l border-amber-700/50 pl-4 text-sm text-amber-200/80 leading-relaxed">
              <Lock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{reobserveNote}</span>
            </div>
          )}

          <section className="border-t border-slate-900 pt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Observed drift</div>
                <h3 className="mt-1 text-lg font-medium text-slate-100">
                  {differences.length} difference{differences.length === 1 ? '' : 's'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab?.('rosetta')}
                className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
              >
                Explain with Rosetta
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
                      className="w-full text-left py-4 text-slate-300 hover:text-slate-100 transition-colors"
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
            <summary className="cursor-pointer hover:text-slate-300">Operational contract</summary>
            <div className="mt-5 pl-4 border-l border-slate-800 space-y-3 leading-relaxed">
              <div>
                Universal Expected ↔ Observed entries: <span className="text-slate-300">{universalComparisons.length}</span>
              </div>
              <div>
                QA jurisdiction suite:{' '}
                <span className={qaTestResults.allPassed ? 'text-emerald-300' : 'text-rose-300'}>
                  {qaTestResults.allPassed ? 'PASS' : 'REVIEW'}
                </span>
              </div>
              <div>
                Freshness rule: accepted canonical changes invalidate older destination observations without deleting them.
              </div>
              <div>
                Current destination mode: OneStop {oneStopMode} · CMR {cmrMode}.
              </div>
              <div>
                Supported observation states: MATCH · MISMATCH · MISSING · EXTRA · NOT_TESTED · UNVERIFIABLE · STALE.
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

const DestinationRow: React.FC<{
  name: string;
  mode: string;
  state: ComparisonState;
  freshness?: FreshnessState;
  matched: number;
  tested: number;
  differences: number;
  recordIdentifier?: string;
}> = ({ name, mode, state, freshness, matched, tested, differences, recordIdentifier }) => {
  const stale = freshness === 'STALE';
  const stateClass = stale
    ? 'text-amber-300'
    : state === 'MATCH'
      ? 'text-emerald-300'
      : state === 'MISMATCH' || state === 'MISSING'
        ? 'text-rose-300'
        : 'text-slate-400';

  return (
    <div className="grid grid-cols-[1fr_auto] gap-5 items-center py-5 border-b border-slate-900 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-base font-medium text-slate-100">{name}</div>
          <span className="text-[9px] tracking-wider text-slate-500">{mode}</span>
        </div>
        <div className="mt-1 text-xs text-slate-600 truncate" title={recordIdentifier}>
          {recordIdentifier || 'No record identifier observed'}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {matched}/{tested} fields matched · {differences} differences
        </div>
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
