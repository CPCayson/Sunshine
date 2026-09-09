import React, { useEffect, useMemo, useState } from 'react';
import { KnowledgeNode, UxSMission, WorkspaceSelection } from '../types';
import {
  VERIFIED_NOAA_UXS_CORPUS,
  VerifiedUxSAssetRecord,
  buildKnowledgeKeyCandidate,
} from '../data/verifiedNoaaCorpus';
import {
  AcceptedConstellationMode,
  buildAcceptedConstellation,
  buildScienceQuestionConstellation,
} from '../services/constellationPathService';

interface ConstellationWorkspaceProps {
  mission: UxSMission;
  selection: WorkspaceSelection;
  onSelectRecord: (record: VerifiedUxSAssetRecord) => void;
  onSelectGraphNode?: (node: KnowledgeNode) => void;
  onOpenGraph?: () => void;
}

type ConstellationMode = 'OBSERVED' | AcceptedConstellationMode | 'SCIENCE';

interface ObservedSimilarityResult {
  record: VerifiedUxSAssetRecord;
  score: number;
  explanations: string[];
}

const normalize = (value?: string) => (value || '').toLowerCase().trim();

const tokenize = (value?: string) =>
  new Set(
    normalize(value)
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );

const jaccard = (a?: string, b?: string) => {
  const left = tokenize(a);
  const right = tokenize(b);
  if (!left.size || !right.size) return null;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
};

const findDirectRecord = (selection: WorkspaceSelection) => {
  const values = [
    selection.graphNodeId,
    selection.sourceObservationId,
    selection.canonicalRef,
    selection.entityName,
  ]
    .filter(Boolean)
    .map((value) => normalize(String(value)));

  return VERIFIED_NOAA_UXS_CORPUS.find((record) => {
    const directIds = [record.id, record.sourceRef, record.cdNumber]
      .filter(Boolean)
      .map((value) => normalize(String(value)));
    const modelSerial = normalize(
      `${record.manufacturer} ${record.model}${record.serialOrIdentifier ? ` ${record.serialOrIdentifier}` : ''}`
    );
    return (
      directIds.some((id) => values.some((value) => value.includes(id))) ||
      (record.serialOrIdentifier && values.some((value) => value.includes(modelSerial)))
    );
  });
};

const compareObservedRecords = (
  focal: VerifiedUxSAssetRecord,
  candidate: VerifiedUxSAssetRecord
): ObservedSimilarityResult => {
  const missionUse = jaccard(focal.missionContext, candidate.missionContext);
  const payload = jaccard(focal.payloadEvidence, candidate.payloadEvidence);
  const dimensions = [
    { score: normalize(focal.model) === normalize(candidate.model) ? 1 : 0, weight: 0.28, available: true, explanation: `Model: ${focal.model} ↔ ${candidate.model}` },
    { score: normalize(focal.manufacturer) === normalize(candidate.manufacturer) ? 1 : 0, weight: 0.2, available: true, explanation: `Manufacturer: ${focal.manufacturer} ↔ ${candidate.manufacturer}` },
    { score: focal.platformClass === candidate.platformClass ? 1 : 0, weight: 0.17, available: true, explanation: `Class: ${focal.platformClass} ↔ ${candidate.platformClass}` },
    { score: missionUse ?? 0, weight: 0.15, available: missionUse !== null, explanation: missionUse === null ? 'Mission/use text unavailable on one record' : `Mission/use text overlap: ${Math.round(missionUse * 100)}%` },
    { score: payload ?? 0, weight: 0.15, available: payload !== null, explanation: payload === null ? 'Payload text unavailable on one record' : `Payload mention overlap: ${Math.round(payload * 100)}%` },
    { score: focal.status && candidate.status && normalize(focal.status) === normalize(candidate.status) ? 1 : 0, weight: 0.05, available: Boolean(focal.status && candidate.status), explanation: `Observed status: ${focal.status || 'n/a'} ↔ ${candidate.status || 'n/a'}` },
  ];
  const available = dimensions.filter((dimension) => dimension.available);
  const availableWeight = available.reduce((sum, dimension) => sum + dimension.weight, 0);
  const weighted = available.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0);
  return {
    record: candidate,
    score: availableWeight ? weighted / availableWeight : 0,
    explanations: available.map((dimension) => dimension.explanation),
  };
};

const radialPositions = (count: number, radius = 34) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius,
    };
  });

const MODE_LABELS: Array<{ id: ConstellationMode; label: string }> = [
  { id: 'OBSERVED', label: 'Observed assets' },
  { id: 'MISSION', label: 'Mission' },
  { id: 'PLATFORM', label: 'Platform' },
  { id: 'INSTRUMENT', label: 'Instrument' },
  { id: 'SCIENCE', label: 'Science' },
];

export const ConstellationWorkspace: React.FC<ConstellationWorkspaceProps> = ({
  mission,
  selection,
  onSelectRecord,
  onSelectGraphNode,
  onOpenGraph,
}) => {
  const [mode, setMode] = useState<ConstellationMode>('OBSERVED');

  const directRecord = useMemo(() => findDirectRecord(selection), [selection]);
  const defaultRecord =
    VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === 'uxsa-remus620-6401') ||
    VERIFIED_NOAA_UXS_CORPUS[0];
  const [observedFocalId, setObservedFocalId] = useState((directRecord || defaultRecord).id);
  const [selectedObservedId, setSelectedObservedId] = useState<string | null>(null);

  const [acceptedFocalId, setAcceptedFocalId] = useState<string | undefined>(selection.graphNodeId);
  const [selectedAcceptedId, setSelectedAcceptedId] = useState<string | null>(null);
  const [scienceQuery, setScienceQuery] = useState('seafloor mapping');
  const [selectedScienceTargetId, setSelectedScienceTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (directRecord) setObservedFocalId(directRecord.id);
  }, [directRecord?.id]);

  useEffect(() => {
    if (selection.graphNodeId) setAcceptedFocalId(selection.graphNodeId);
  }, [selection.graphNodeId]);

  const observedFocal =
    VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === observedFocalId) || defaultRecord;
  const observedNeighbors = useMemo(
    () =>
      VERIFIED_NOAA_UXS_CORPUS.filter((record) => record.id !== observedFocal.id)
        .map((record) => compareObservedRecords(observedFocal, record))
        .sort((a, b) => b.score - a.score)
        .slice(0, 7),
    [observedFocal.id]
  );
  const selectedObserved =
    observedNeighbors.find((neighbor) => neighbor.record.id === selectedObservedId) || observedNeighbors[0];

  const acceptedModel = useMemo(
    () =>
      mode === 'MISSION' || mode === 'PLATFORM' || mode === 'INSTRUMENT'
        ? buildAcceptedConstellation(mission, mode, acceptedFocalId)
        : null,
    [mission, mode, acceptedFocalId]
  );
  const acceptedResults = acceptedModel?.results.slice(0, 7) || [];
  const selectedAccepted =
    acceptedResults.find((result) => result.node.id === selectedAcceptedId) || acceptedResults[0];

  const scienceModel = useMemo(
    () => buildScienceQuestionConstellation(mission, scienceQuery),
    [mission, scienceQuery]
  );
  const scienceNeighbors = useMemo(
    () =>
      Array.from(new Map(scienceModel.results.map((result) => [result.target.id, result])).values()).slice(0, 7),
    [scienceModel]
  );
  const selectedScience =
    scienceNeighbors.find((result) => result.target.id === selectedScienceTargetId) || scienceNeighbors[0];

  const focusObserved = (record: VerifiedUxSAssetRecord) => {
    setObservedFocalId(record.id);
    setSelectedObservedId(null);
    onSelectRecord(record);
  };

  const focusAccepted = (node: KnowledgeNode) => {
    setAcceptedFocalId(node.id);
    setSelectedAcceptedId(null);
    onSelectGraphNode?.(node);
  };

  const currentDescription =
    mode === 'OBSERVED'
      ? 'Source-backed asset observations. Missing evidence is left missing.'
      : mode === 'SCIENCE'
      ? 'Question → accepted science-domain path → property → capability → instrument.'
      : 'Similarity is computed from shared accepted graph-path features of the same entity kind.';

  return (
    <div className="h-full w-full bg-[#050a12] text-slate-200 overflow-hidden font-sans flex flex-col">
      <div className="px-7 py-5 border-b border-slate-900 shrink-0">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-600">Knowledge space</div>
            <h2 className="mt-1 text-xl font-medium text-slate-100">Constellation</h2>
            <p className="mt-1 max-w-3xl text-xs text-slate-500">{currentDescription}</p>
          </div>
          {onOpenGraph && (
            <button onClick={onOpenGraph} className="text-xs text-slate-400 hover:text-cyan-200">
              Relationship graph →
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-xs">
          {MODE_LABELS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setSelectedAcceptedId(null);
                setSelectedScienceTargetId(null);
              }}
              className={`border-b pb-1 transition-colors ${
                mode === item.id
                  ? 'border-cyan-400 text-cyan-200'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'SCIENCE' && (
        <div className="px-7 py-3 border-b border-slate-900 shrink-0 flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-600">Question</span>
          <input
            value={scienceQuery}
            onChange={(event) => setScienceQuery(event.target.value)}
            placeholder="e.g. seafloor mapping"
            className="flex-1 max-w-xl bg-transparent border-b border-slate-800 px-1 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-700"
          />
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[560px] overflow-hidden border-r border-slate-900">
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30,41,59,.32) 0, rgba(5,10,18,0) 56%)' }}
          />

          {mode === 'OBSERVED' && (() => {
            const positions = radialPositions(observedNeighbors.length);
            return (
              <>
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {observedNeighbors.map((neighbor, index) => (
                    <line key={neighbor.record.id} x1="50" y1="50" x2={positions[index].left} y2={positions[index].top} stroke="rgba(71,85,105,.35)" strokeWidth="0.2" />
                  ))}
                </svg>
                <button
                  onClick={() => focusObserved(observedFocal)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 rounded-2xl border border-cyan-500/35 bg-[#08111e] px-4 py-4 text-center"
                >
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400">Observed focal</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {observedFocal.model}{observedFocal.serialOrIdentifier ? ` #${observedFocal.serialOrIdentifier}` : ''}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">{observedFocal.manufacturer} · {observedFocal.platformClass}</div>
                </button>
                {observedNeighbors.map((neighbor, index) => (
                  <button
                    key={neighbor.record.id}
                    onClick={() => {
                      setSelectedObservedId(neighbor.record.id);
                      onSelectRecord(neighbor.record);
                    }}
                    onDoubleClick={() => focusObserved(neighbor.record)}
                    style={{ left: `${positions[index].left}%`, top: `${positions[index].top}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-36 rounded-xl border px-3 py-3 text-left ${
                      neighbor.record.id === selectedObserved?.record.id
                        ? 'border-cyan-500/50 bg-cyan-950/20'
                        : 'border-slate-800 bg-[#07101b] hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{neighbor.record.model}{neighbor.record.serialOrIdentifier ? ` #${neighbor.record.serialOrIdentifier}` : ''}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600">
                      <span>{neighbor.record.platformClass}</span>
                      <span className="text-cyan-300">{Math.round(neighbor.score * 100)}%</span>
                    </div>
                  </button>
                ))}
              </>
            );
          })()}

          {(mode === 'MISSION' || mode === 'PLATFORM' || mode === 'INSTRUMENT') && acceptedModel && (() => {
            const positions = radialPositions(acceptedResults.length);
            return acceptedModel.focal ? (
              <>
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {acceptedResults.map((result, index) => (
                    <line key={result.node.id} x1="50" y1="50" x2={positions[index].left} y2={positions[index].top} stroke="rgba(71,85,105,.35)" strokeWidth="0.2" />
                  ))}
                </svg>
                <button
                  onClick={() => focusAccepted(acceptedModel.focal!)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 rounded-2xl border border-cyan-500/35 bg-[#08111e] px-4 py-4 text-center"
                >
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400">Accepted focal</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">{acceptedModel.focal.label}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{acceptedModel.focal.kind}</div>
                </button>
                {acceptedResults.map((result, index) => (
                  <button
                    key={result.node.id}
                    onClick={() => {
                      setSelectedAcceptedId(result.node.id);
                      onSelectGraphNode?.(result.node);
                    }}
                    onDoubleClick={() => focusAccepted(result.node)}
                    style={{ left: `${positions[index].left}%`, top: `${positions[index].top}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-40 rounded-xl border px-3 py-3 text-left ${
                      result.node.id === selectedAccepted?.node.id
                        ? 'border-cyan-500/50 bg-cyan-950/20'
                        : 'border-slate-800 bg-[#07101b] hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium line-clamp-2">{result.node.label}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600">
                      <span>{result.node.kind}</span>
                      <span className="text-cyan-300">{Math.round(result.score * 100)}%</span>
                    </div>
                  </button>
                ))}
                {!acceptedResults.length && (
                  <div className="absolute left-1/2 top-[67%] -translate-x-1/2 max-w-md text-center text-xs leading-relaxed text-slate-600">
                    {acceptedModel.note}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-600">{acceptedModel.note}</div>
            );
          })()}

          {mode === 'SCIENCE' && (() => {
            const positions = radialPositions(scienceNeighbors.length);
            return (
              <>
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {scienceNeighbors.map((result, index) => (
                    <line key={result.target.id} x1="50" y1="50" x2={positions[index].left} y2={positions[index].top} stroke="rgba(71,85,105,.35)" strokeWidth="0.2" />
                  ))}
                </svg>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 rounded-2xl border border-cyan-500/35 bg-[#08111e] px-4 py-4 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400">Science question</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">{scienceQuery || 'No question entered'}</div>
                  <div className="mt-1 text-[10px] text-slate-500">accepted graph paths only</div>
                </div>
                {scienceNeighbors.map((result, index) => (
                  <button
                    key={result.target.id}
                    onClick={() => {
                      setSelectedScienceTargetId(result.target.id);
                      onSelectGraphNode?.(result.target);
                    }}
                    style={{ left: `${positions[index].left}%`, top: `${positions[index].top}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-40 rounded-xl border px-3 py-3 text-left ${
                      result.target.id === selectedScience?.target.id
                        ? 'border-cyan-500/50 bg-cyan-950/20'
                        : 'border-slate-800 bg-[#07101b] hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium line-clamp-2">{result.target.label}</div>
                    <div className="mt-1 text-[10px] text-slate-600">{result.target.kind}</div>
                  </button>
                ))}
                {!scienceNeighbors.length && (
                  <div className="absolute left-1/2 top-[67%] -translate-x-1/2 max-w-md text-center text-xs leading-relaxed text-slate-600">
                    {scienceModel.note || 'No accepted science path matches the current question.'}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <aside className="overflow-y-auto p-6">
          {mode === 'OBSERVED' && selectedObserved && (
            <div className="space-y-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Observed neighbor</div>
                <div className="mt-1 text-base font-semibold text-slate-100">
                  {selectedObserved.record.manufacturer} {selectedObserved.record.model}{selectedObserved.record.serialOrIdentifier ? ` #${selectedObserved.record.serialOrIdentifier}` : ''}
                </div>
                <div className="mt-2 text-3xl font-light text-cyan-300">{Math.round(selectedObserved.score * 100)}%</div>
                <div className="text-[10px] text-slate-600">normalized only across available source fields</div>
              </div>
              <div className="space-y-2 border-t border-slate-900 pt-5 text-[11px] text-slate-500">
                {selectedObserved.explanations.map((explanation) => <div key={explanation}>{explanation}</div>)}
              </div>
              <div className="border-t border-slate-900 pt-5 text-xs">
                <div className="text-slate-500">Candidate key</div>
                <div className="mt-1 break-all font-mono text-[10px] text-cyan-300">{buildKnowledgeKeyCandidate(selectedObserved.record)}</div>
                <div className="mt-3 text-slate-500">Source</div>
                <div className="mt-1 text-slate-300">{selectedObserved.record.sourceArtifact}</div>
                <div className="font-mono text-[10px] text-slate-600">{selectedObserved.record.sourceRef}</div>
              </div>
            </div>
          )}

          {(mode === 'MISSION' || mode === 'PLATFORM' || mode === 'INSTRUMENT') && acceptedModel && (
            <div className="space-y-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Accepted path comparison</div>
                <div className="mt-1 text-base font-semibold text-slate-100">
                  {selectedAccepted?.node.label || acceptedModel.focal?.label || mode}
                </div>
                {selectedAccepted && (
                  <>
                    <div className="mt-2 text-3xl font-light text-cyan-300">{Math.round(selectedAccepted.score * 100)}%</div>
                    <div className="text-[10px] text-slate-600">Jaccard overlap of accepted path features</div>
                  </>
                )}
              </div>

              {selectedAccepted ? (
                <div className="border-t border-slate-900 pt-5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600">Shared accepted paths</div>
                  <div className="mt-3 space-y-3">
                    {selectedAccepted.sharedFeatures.length ? selectedAccepted.sharedFeatures.map((feature) => (
                      <div key={feature.id}>
                        <div className="text-[11px] leading-relaxed text-slate-300">{feature.label}</div>
                        <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-700">depth {feature.depth}</div>
                      </div>
                    )) : <div className="text-xs text-slate-600">No shared accepted path features.</div>}
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-900 pt-5 text-xs leading-relaxed text-slate-600">{acceptedModel.note}</div>
              )}

              <div className="border-t border-slate-900 pt-5 text-[11px] leading-relaxed text-slate-600">
                “Accepted” here means accepted in the current MANTAS graph state. It does not independently establish external NOAA validation or destination acceptance.
              </div>
            </div>
          )}

          {mode === 'SCIENCE' && (
            <div className="space-y-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Explainable science path</div>
                <div className="mt-1 text-base font-semibold text-slate-100">{selectedScience?.target.label || scienceQuery}</div>
              </div>
              {selectedScience ? (
                <div className="space-y-3 border-t border-slate-900 pt-5">
                  {selectedScience.pathEdges.map((edge, index) => (
                    <div key={edge.id} className="text-[11px] leading-relaxed">
                      <div className="text-slate-300">{selectedScience.pathNodes[index].label}</div>
                      <div className="my-1 font-mono text-[10px] text-cyan-400">↓ {edge.predicate}</div>
                    </div>
                  ))}
                  <div className="text-[11px] text-slate-300">{selectedScience.pathNodes[selectedScience.pathNodes.length - 1].label}</div>
                </div>
              ) : (
                <div className="border-t border-slate-900 pt-5 text-xs leading-relaxed text-slate-600">{scienceModel.note}</div>
              )}
              <div className="border-t border-slate-900 pt-5 text-[11px] leading-relaxed text-slate-600">
                Science results are path explanations, not claims of sensor equivalence or actual mission use. Actual use still requires deployment and lineage evidence.
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
