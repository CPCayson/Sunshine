import React, { useEffect, useMemo, useState } from 'react';
import { WorkspaceSelection } from '../types';
import {
  VERIFIED_NOAA_UXS_CORPUS,
  VerifiedUxSAssetRecord,
  buildKnowledgeKeyCandidate,
} from '../data/verifiedNoaaCorpus';

interface ConstellationWorkspaceProps {
  selection: WorkspaceSelection;
  onSelectRecord: (record: VerifiedUxSAssetRecord) => void;
  onOpenGraph?: () => void;
}

interface SimilarityDimension {
  id: string;
  label: string;
  score: number;
  weight: number;
  available: boolean;
  explanation: string;
}

interface SimilarityResult {
  record: VerifiedUxSAssetRecord;
  score: number;
  dimensions: SimilarityDimension[];
  shared: string[];
  different: string[];
  availableWeight: number;
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

const compareRecords = (
  focal: VerifiedUxSAssetRecord,
  candidate: VerifiedUxSAssetRecord
): SimilarityResult => {
  const missionUse = jaccard(focal.missionContext, candidate.missionContext);
  const payload = jaccard(focal.payloadEvidence, candidate.payloadEvidence);

  const dimensions: SimilarityDimension[] = [
    {
      id: 'model',
      label: 'Platform model',
      score: normalize(focal.model) === normalize(candidate.model) ? 1 : 0,
      weight: 0.28,
      available: Boolean(focal.model && candidate.model),
      explanation:
        normalize(focal.model) === normalize(candidate.model)
          ? `Same observed model: ${focal.model}`
          : `${focal.model} vs ${candidate.model}`,
    },
    {
      id: 'manufacturer',
      label: 'Manufacturer',
      score: normalize(focal.manufacturer) === normalize(candidate.manufacturer) ? 1 : 0,
      weight: 0.2,
      available: Boolean(focal.manufacturer && candidate.manufacturer),
      explanation:
        normalize(focal.manufacturer) === normalize(candidate.manufacturer)
          ? `Same observed manufacturer: ${focal.manufacturer}`
          : `${focal.manufacturer} vs ${candidate.manufacturer}`,
    },
    {
      id: 'class',
      label: 'Platform class',
      score: focal.platformClass === candidate.platformClass ? 1 : 0,
      weight: 0.17,
      available: true,
      explanation:
        focal.platformClass === candidate.platformClass
          ? `Same platform class: ${focal.platformClass}`
          : `${focal.platformClass} vs ${candidate.platformClass}`,
    },
    {
      id: 'missionContext',
      label: 'Mission/use context',
      score: missionUse ?? 0,
      weight: 0.15,
      available: missionUse !== null,
      explanation:
        missionUse === null
          ? 'Not enough source text on both records'
          : `Token overlap in source-recorded use context: ${Math.round(missionUse * 100)}%`,
    },
    {
      id: 'payload',
      label: 'Payload mention',
      score: payload ?? 0,
      weight: 0.15,
      available: payload !== null,
      explanation:
        payload === null
          ? 'Not enough payload text on both records'
          : `Token overlap in source-recorded payload text: ${Math.round(payload * 100)}%`,
    },
    {
      id: 'status',
      label: 'Observed status',
      score: focal.status && candidate.status && normalize(focal.status) === normalize(candidate.status) ? 1 : 0,
      weight: 0.05,
      available: Boolean(focal.status && candidate.status),
      explanation:
        focal.status && candidate.status
          ? normalize(focal.status) === normalize(candidate.status)
            ? `Same observed status: ${focal.status}`
            : `${focal.status} vs ${candidate.status}`
          : 'Status unavailable on one record',
    },
  ];

  const available = dimensions.filter((dimension) => dimension.available);
  const availableWeight = available.reduce((sum, dimension) => sum + dimension.weight, 0);
  const weighted = available.reduce(
    (sum, dimension) => sum + dimension.score * dimension.weight,
    0
  );
  const score = availableWeight ? weighted / availableWeight : 0;

  const shared = dimensions
    .filter((dimension) => dimension.available && dimension.score >= 0.7)
    .map((dimension) => dimension.explanation);
  const different = dimensions
    .filter((dimension) => dimension.available && dimension.score < 0.4)
    .map((dimension) => dimension.explanation);

  return { record: candidate, score, dimensions, shared, different, availableWeight };
};

export const ConstellationWorkspace: React.FC<ConstellationWorkspaceProps> = ({
  selection,
  onSelectRecord,
  onOpenGraph,
}) => {
  const directRecord = useMemo(() => findDirectRecord(selection), [selection]);
  const defaultRecord =
    VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === 'uxsa-remus620-6401') ||
    VERIFIED_NOAA_UXS_CORPUS[0];
  const [focalId, setFocalId] = useState((directRecord || defaultRecord).id);
  const [selectedNeighborId, setSelectedNeighborId] = useState<string | null>(null);

  useEffect(() => {
    if (directRecord) setFocalId(directRecord.id);
  }, [directRecord?.id]);

  const focal =
    VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === focalId) || defaultRecord;

  const neighbors = useMemo(
    () =>
      VERIFIED_NOAA_UXS_CORPUS.filter((record) => record.id !== focal.id)
        .map((record) => compareRecords(focal, record))
        .sort((a, b) => b.score - a.score)
        .slice(0, 7),
    [focal.id]
  );

  const selected =
    neighbors.find((neighbor) => neighbor.record.id === selectedNeighborId) || neighbors[0];

  const nodePositions = neighbors.map((neighbor, index) => {
    const angle = (index / Math.max(neighbors.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = 34;
    return {
      neighbor,
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius,
    };
  });

  const focusRecord = (record: VerifiedUxSAssetRecord) => {
    setFocalId(record.id);
    setSelectedNeighborId(null);
    onSelectRecord(record);
  };

  return (
    <div className="h-full w-full bg-[#050a12] text-slate-200 overflow-hidden font-sans flex flex-col">
      <div className="px-7 py-5 border-b border-slate-900 shrink-0 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-600">Evidence corpus</div>
          <h2 className="mt-1 text-xl font-medium text-slate-100">Constellation</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Deterministic similarity across source-backed asset observations. Similarity does not imply identity,
            equivalence, deployment, or dataset lineage.
          </p>
        </div>
        {onOpenGraph && (
          <button
            onClick={onOpenGraph}
            className="text-xs text-slate-400 hover:text-cyan-200"
          >
            Open relationship graph →
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[560px] overflow-hidden border-r border-slate-900">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30,41,59,.35) 0, rgba(5,10,18,0) 55%)' }} />

          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {nodePositions.map(({ neighbor, left, top }) => (
              <line
                key={neighbor.record.id}
                x1="50"
                y1="50"
                x2={left}
                y2={top}
                stroke="rgba(71,85,105,.35)"
                strokeWidth={neighbor.record.id === selected?.record.id ? 0.35 : 0.18}
              />
            ))}
          </svg>

          <button
            onClick={() => focusRecord(focal)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 rounded-2xl border border-cyan-500/35 bg-[#08111e] px-4 py-4 text-center"
          >
            <div className="text-[10px] uppercase tracking-wider text-cyan-400">Focal observation</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {focal.model}{focal.serialOrIdentifier ? ` #${focal.serialOrIdentifier}` : ''}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">{focal.manufacturer} · {focal.platformClass}</div>
          </button>

          {nodePositions.map(({ neighbor, left, top }) => {
            const isSelected = neighbor.record.id === selected?.record.id;
            return (
              <button
                key={neighbor.record.id}
                onClick={() => {
                  setSelectedNeighborId(neighbor.record.id);
                  onSelectRecord(neighbor.record);
                }}
                onDoubleClick={() => focusRecord(neighbor.record)}
                style={{ left: `${left}%`, top: `${top}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-36 rounded-xl border px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-cyan-500/50 bg-cyan-950/20 text-slate-100'
                    : 'border-slate-800 bg-[#07101b] text-slate-300 hover:border-slate-700'
                }`}
                title="Click to inspect. Double-click to make focal."
              >
                <div className="text-xs font-medium truncate">{neighbor.record.model}{neighbor.record.serialOrIdentifier ? ` #${neighbor.record.serialOrIdentifier}` : ''}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600">
                  <span>{neighbor.record.platformClass}</span>
                  <span className="text-cyan-300">{Math.round(neighbor.score * 100)}%</span>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="overflow-y-auto p-6">
          {selected ? (
            <div className="space-y-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Selected neighbor</div>
                <div className="mt-1 text-base font-semibold text-slate-100">
                  {selected.record.manufacturer} {selected.record.model}{selected.record.serialOrIdentifier ? ` #${selected.record.serialOrIdentifier}` : ''}
                </div>
                <div className="mt-2 text-3xl font-light text-cyan-300">{Math.round(selected.score * 100)}%</div>
                <div className="text-[10px] text-slate-600">normalized across available evidence dimensions</div>
              </div>

              <div className="space-y-3 border-t border-slate-900 pt-5">
                {selected.dimensions.map((dimension) => (
                  <div key={dimension.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={dimension.available ? 'text-slate-400' : 'text-slate-700'}>{dimension.label}</span>
                      <span className={dimension.available ? 'text-slate-300' : 'text-slate-700'}>
                        {dimension.available ? `${Math.round(dimension.score * 100)}%` : 'n/a'}
                      </span>
                    </div>
                    <div className="text-[10px] leading-relaxed text-slate-600">{dimension.explanation}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-900 pt-5 text-xs">
                <div className="text-slate-500">Candidate key</div>
                <div className="mt-1 break-all font-mono text-[10px] text-cyan-300">{buildKnowledgeKeyCandidate(selected.record)}</div>
                <div className="mt-3 text-slate-500">Source</div>
                <div className="mt-1 text-slate-300">{selected.record.sourceArtifact}</div>
                <div className="font-mono text-[10px] text-slate-600">{selected.record.sourceRef}</div>
              </div>

              <button
                onClick={() => focusRecord(selected.record)}
                className="text-xs text-cyan-300 hover:text-cyan-200"
              >
                Make this the focal observation →
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-600">No neighboring corpus observations are available.</div>
          )}
        </aside>
      </div>
    </div>
  );
};
