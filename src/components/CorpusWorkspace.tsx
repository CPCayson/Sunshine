import React, { useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Database,
  GitBranch,
  X,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Anchor,
  Network,
} from 'lucide-react';
import {
  VERIFIED_NOAA_UXS_CORPUS,
  VerifiedUxSAssetRecord,
  buildKnowledgeKeyCandidate,
} from '../data/verifiedNoaaCorpus';
import {
  corpusGraphNodeIdForRecord,
  corpusObservationNodeIdForRecord,
  getSourceBackedRelationshipAssessment,
  runVerifiedCorpusInvariantAudit,
} from '../services/verifiedCorpusAdapter';

type CorpusView = 'CATALOG' | 'PASSPORT' | 'EVIDENCE' | 'RELATIONSHIPS';

interface CorpusWorkspaceProps {
  onClose?: () => void;
}

const statusClass = (status?: string) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('in use')) return 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40';
  if (normalized.includes('not operational') || normalized.includes('excessed')) return 'text-amber-300 border-amber-500/30 bg-amber-950/40';
  return 'text-slate-300 border-slate-700 bg-slate-900/40';
};

const maturityLabel = (record: VerifiedUxSAssetRecord) => {
  if (record.payloadEvidence) return 'PAYLOAD MENTION EVIDENCE';
  if (record.missionContext) return 'USE-CONTEXT EVIDENCE';
  return 'IDENTITY EVIDENCE';
};

const relationshipStateClass = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300';
  if (state === 'SOURCE_MENTION_ONLY') return 'border-amber-700/40 bg-amber-950/20 text-amber-300';
  return 'border-slate-700 bg-slate-900/30 text-slate-400';
};

const publishCorpusSelection = (record: VerifiedUxSAssetRecord, openGraph = false) => {
  window.dispatchEvent(
    new CustomEvent('manta:corpus-selection', {
      detail: {
        openGraph,
        selection: {
          canonicalRef: buildKnowledgeKeyCandidate(record),
          graphNodeId: corpusGraphNodeIdForRecord(record),
          sourceObservationId: corpusObservationNodeIdForRecord(record),
          entityName: `${record.manufacturer} ${record.model}${record.serialOrIdentifier ? ` #${record.serialOrIdentifier}` : ''}`,
          entityType: 'PHYSICAL_ASSET_CANDIDATE',
        },
      },
    })
  );
};

export const CorpusWorkspace: React.FC<CorpusWorkspaceProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState<'ALL' | VerifiedUxSAssetRecord['platformClass']>('ALL');
  const [selectedId, setSelectedId] = useState(VERIFIED_NOAA_UXS_CORPUS[0]?.id || '');
  const [view, setView] = useState<CorpusView>('CATALOG');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VERIFIED_NOAA_UXS_CORPUS.filter((record) => {
      const matchesClass = classFilter === 'ALL' || record.platformClass === classFilter;
      const haystack = [
        record.manufacturer,
        record.model,
        record.serialOrIdentifier,
        record.cdNumber,
        record.missionContext,
        record.payloadEvidence,
        record.physicalLocation,
        record.sourceRef,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesClass && (!q || haystack.includes(q));
    });
  }, [query, classFilter]);

  const selected = VERIFIED_NOAA_UXS_CORPUS.find((r) => r.id === selectedId) || filtered[0];
  const relationshipAssessment = selected ? getSourceBackedRelationshipAssessment(selected) : [];
  const corpusAudit = useMemo(() => runVerifiedCorpusInvariantAudit(), []);

  const selectRecord = (record: VerifiedUxSAssetRecord) => {
    setSelectedId(record.id);
    publishCorpusSelection(record, false);
  };

  const openSelectedInGraph = () => {
    if (!selected) return;
    publishCorpusSelection(selected, true);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-[#02050b]/95 backdrop-blur-xl text-slate-100 flex flex-col">
      <header className="h-14 shrink-0 border-b border-cyan-500/20 px-5 flex items-center justify-between bg-[#050b16]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-cyan-500/30 bg-cyan-950/40 flex items-center justify-center">
            <Database className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-[0.18em] uppercase text-cyan-200">UxS Evidence Corpus</div>
            <div className="text-[10px] text-slate-500 font-mono">Known to imported evidence corpus · not a complete NOAA fleet registry</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              onClick={openSelectedInGraph}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 text-[10px] font-mono hover:bg-cyan-900/40"
              title="Send this source-backed asset selection to the shared workbench and focus the Knowledge Graph"
            >
              <Network className="w-3.5 h-3.5" />
              OPEN IN GRAPH
            </button>
          )}
          <span className={`px-2 py-1 rounded border text-[10px] font-mono ${corpusAudit.passed ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300' : 'border-rose-500/30 bg-rose-950/30 text-rose-300'}`}>
            CORPUS TRUTH AUDIT {corpusAudit.passed ? 'PASS' : 'REVIEW'}
          </span>
          <span className="px-2 py-1 rounded border border-amber-500/30 bg-amber-950/30 text-amber-300 text-[10px] font-mono">IMPORTED_ARTIFACT</span>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg border border-slate-800 hover:border-slate-600 hover:bg-slate-900" title="Close corpus workspace">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="h-11 shrink-0 border-b border-slate-800 px-5 flex items-center gap-2 bg-[#060d18]">
        {(['CATALOG', 'PASSPORT', 'EVIDENCE', 'RELATIONSHIPS'] as CorpusView[]).map((item) => (
          <button
            key={item}
            onClick={() => setView(item)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-bold tracking-wide transition-colors ${view === item ? 'bg-cyan-950/70 text-cyan-200 border border-cyan-700/40' : 'text-slate-500 hover:text-slate-200'}`}
          >
            {item}
          </button>
        ))}
        <div className="ml-auto text-[10px] font-mono text-slate-500">
          {VERIFIED_NOAA_UXS_CORPUS.length} source-backed seed records
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[360px_1fr]">
        <aside className="border-r border-slate-800 bg-[#050a13] flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search model, serial, CD number, mission context…"
                className="w-full bg-[#08111f] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-cyan-700 text-slate-200 placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['ALL', 'UUV', 'USV', 'Glider'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setClassFilter(value)}
                  className={`px-2 py-1 rounded border text-[10px] font-mono ${classFilter === value ? 'border-cyan-600/50 bg-cyan-950/50 text-cyan-300' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1.5">
            {filtered.map((record) => (
              <button
                key={record.id}
                onClick={() => selectRecord(record)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selected?.id === record.id ? 'border-cyan-600/50 bg-cyan-950/25' : 'border-slate-800/80 bg-[#07101c] hover:border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-100">{record.manufacturer} {record.model}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {record.platformClass} · {record.serialOrIdentifier ? `ID ${record.serialOrIdentifier}` : record.cdNumber || 'identity pending'}
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${statusClass(record.status)}`}>{record.status || 'UNKNOWN'}</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 line-clamp-2">{record.missionContext || 'No mission/use context in source row'}</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 overflow-auto bg-[#030812]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-slate-600 font-mono text-xs">No corpus record selected.</div>
          ) : view === 'CATALOG' ? (
            <div className="p-6 max-w-6xl mx-auto space-y-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">Known source observation</div>
                  <h1 className="text-2xl font-semibold mt-1">{selected.manufacturer} {selected.model}</h1>
                  <div className="text-sm text-slate-400 mt-1">{selected.platformClass} · {selected.serialOrIdentifier ? `Asset ${selected.serialOrIdentifier}` : selected.cdNumber || 'No serial in source'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Evidence maturity</div>
                  <div className="mt-1 px-2.5 py-1 rounded-lg border border-cyan-700/40 bg-cyan-950/30 text-cyan-300 text-xs font-mono">{maturityLabel(selected)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <InfoCell label="Identity basis" value={selected.identityBasis} />
                <InfoCell label="Source confidence" value={selected.confidence.toFixed(2)} />
                <InfoCell label="Source years" value={selected.sourceYears.join(', ')} />
                <InfoCell label="Location" value={selected.physicalLocation || 'UNKNOWN'} />
                <InfoCell label="CD number" value={selected.cdNumber || 'UNKNOWN'} />
                <InfoCell label="Acquisition" value={selected.acquisitionYear || 'UNKNOWN'} />
              </div>

              <section className="border-t border-slate-800 pt-4">
                <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500">Source-observed context</div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c]">
                    <div className="text-[10px] text-slate-500 font-mono">MISSION / USE CONTEXT</div>
                    <div className="mt-2 text-sm text-slate-200">{selected.missionContext || 'UNKNOWN'}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c]">
                    <div className="text-[10px] text-slate-500 font-mono">PAYLOAD / VERSION EVIDENCE</div>
                    <div className="mt-2 text-sm text-slate-200">{selected.payloadEvidence || 'No payload value in imported source row'}</div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <TruthPanel title="What this source supports" items={selected.supports} positive />
                <TruthPanel title="What this source does NOT prove" items={selected.doesNotProve} />
              </section>
            </div>
          ) : view === 'PASSPORT' ? (
            <div className="p-6 max-w-5xl mx-auto space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-500 font-mono">Knowledge Passport · candidate binding</div>
                <h2 className="text-xl font-semibold mt-1">{selected.manufacturer} {selected.model} {selected.serialOrIdentifier ? `#${selected.serialOrIdentifier}` : ''}</h2>
              </div>
              <div className="p-4 rounded-xl border border-cyan-800/40 bg-cyan-950/15">
                <div className="text-[10px] text-slate-500 font-mono">KNOWLEDGE KEY CANDIDATE</div>
                <div className="mt-2 font-mono text-sm text-cyan-300 break-all">{buildKnowledgeKeyCandidate(selected)}</div>
                <div className="mt-3 text-xs text-slate-400">This is a semantic address candidate derived from source-backed identity. It remains a candidate until the existing reconciliation / HumanDecision flow accepts it.</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoCell label="Source identity state" value={selected.identityState} />
                <InfoCell label="Source reference" value={selected.sourceRef} />
                <InfoCell label="Manufacturer" value={selected.manufacturer} />
                <InfoCell label="Model" value={selected.model} />
                <InfoCell label="Serial / identifying number" value={selected.serialOrIdentifier || 'UNKNOWN'} />
                <InfoCell label="Provenance" value={selected.provenanceType} />
              </div>
              <div className="p-4 rounded-xl border border-amber-700/30 bg-amber-950/15 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-200">Identity is not a deployment claim</div>
                  <div className="text-xs text-slate-400 mt-1">The imported registry supports asset/model identity and recorded context where present. It cannot by itself establish a specific dive, serialized sensor use, or dataset production.</div>
                </div>
              </div>
            </div>
          ) : view === 'EVIDENCE' ? (
            <div className="p-6 max-w-5xl mx-auto space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-500 font-mono">Evidence tree</div>
                <h2 className="text-xl font-semibold mt-1">Why this record exists</h2>
              </div>
              <div className="space-y-2">
                <EvidenceStep icon={<Database className="w-4 h-4" />} title="Imported source artifact" value={selected.sourceArtifact} detail="The workbook remains evidence; it is not a second canonical database." />
                <EvidenceStep icon={<Anchor className="w-4 h-4" />} title="Source row identity" value={selected.sourceRef} detail={`Identity basis: ${selected.identityBasis} · confidence ${selected.confidence.toFixed(2)}`} />
                <EvidenceStep icon={<GitBranch className="w-4 h-4" />} title="Candidate semantic binding" value={buildKnowledgeKeyCandidate(selected)} detail="Candidate Knowledge Key. Existing HumanDecision / claim machinery owns acceptance." />
                <EvidenceStep icon={<ShieldCheck className="w-4 h-4" />} title="Authority boundary" value="IMPORTED_ARTIFACT" detail="This observation can support only the fields actually present in the source row. OISS, archive, CoMET, OneStop and CMR outcomes remain separate authorities." />
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-6xl mx-auto space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500 font-mono">Relationship evidence boundary</div>
                  <h2 className="text-xl font-semibold mt-1">What this row can establish</h2>
                  <div className="text-xs text-slate-500 mt-1">{selected.sourceRef} · {selected.manufacturer} {selected.model}</div>
                </div>
                <span className="px-2 py-1 rounded border border-slate-700 bg-slate-900/40 text-[10px] font-mono text-slate-300">NO TRANSITIVE GREEN LIGHTS</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {relationshipAssessment.map((assessment) => (
                  <div key={assessment.predicate} className={`rounded-xl border p-4 ${relationshipStateClass(assessment.state)}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs font-bold">{assessment.predicate}</div>
                      <span className="text-[9px] font-mono opacity-80">{assessment.state}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-300 leading-relaxed">{assessment.explanation}</div>
                    <div className="mt-3 text-[10px] text-slate-500 font-mono">Evidence: {assessment.evidenceRefs.join(', ')}</div>
                  </div>
                ))}
              </div>

              <section className="border-t border-slate-800 pt-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Corpus invariant audit</div>
                <div className="mt-3 space-y-2">
                  {corpusAudit.checks.map((check) => (
                    <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-[#07101c]">
                      {check.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-300">{check.id}</div>
                        <div className="text-xs text-slate-400 mt-1">{check.explanation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const InfoCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-lg border border-slate-800 bg-[#07101c] min-w-0">
    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">{label}</div>
    <div className="mt-1 text-xs text-slate-200 break-words">{value}</div>
  </div>
);

const TruthPanel: React.FC<{ title: string; items: string[]; positive?: boolean }> = ({ title, items, positive }) => (
  <div className={`p-4 rounded-xl border ${positive ? 'border-emerald-800/30 bg-emerald-950/10' : 'border-amber-800/30 bg-amber-950/10'}`}>
    <div className={`text-[10px] uppercase tracking-widest font-mono ${positive ? 'text-emerald-400' : 'text-amber-400'}`}>{title}</div>
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div key={item} className="flex gap-2 text-xs text-slate-300">
          {positive ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" /> : <CircleDashed className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />}
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

const EvidenceStep: React.FC<{ icon: React.ReactNode; title: string; value: string; detail: string }> = ({ icon, title, value, detail }) => (
  <div className="grid grid-cols-[36px_1fr] gap-3 items-start p-4 rounded-xl border border-slate-800 bg-[#07101c]">
    <div className="w-9 h-9 rounded-lg border border-cyan-800/30 bg-cyan-950/20 flex items-center justify-center text-cyan-300">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">{title}</div>
      <div className="mt-1 text-sm text-slate-100 break-all">{value}</div>
      <div className="mt-1.5 text-xs text-slate-400">{detail}</div>
    </div>
  </div>
);