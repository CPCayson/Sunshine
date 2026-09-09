import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Database,
  GitBranch,
  Network,
  Search,
  ShieldCheck,
  X,
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
  if (normalized.includes('in use')) return 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30';
  if (normalized.includes('not operational') || normalized.includes('excessed')) return 'text-amber-300 border-amber-500/30 bg-amber-950/30';
  return 'text-slate-300 border-slate-700 bg-slate-900/30';
};

const maturityLabel = (record: VerifiedUxSAssetRecord) => {
  if (record.payloadEvidence) return 'Payload mention observed';
  if (record.missionContext) return 'Use context observed';
  return 'Identity evidence observed';
};

const relationshipStateClass = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'border-emerald-800/40 bg-emerald-950/10';
  if (state === 'SOURCE_MENTION_ONLY') return 'border-amber-800/40 bg-amber-950/10';
  return 'border-slate-800 bg-[#07101c]';
};

const relationshipStateText = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'text-emerald-300';
  if (state === 'SOURCE_MENTION_ONLY') return 'text-amber-300';
  return 'text-slate-400';
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

  const selected = VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === selectedId) || filtered[0];
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
      <header className="h-16 shrink-0 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#050b16]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl border border-cyan-500/20 bg-cyan-950/25 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100">UxS Evidence Corpus</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">Source-backed assets known to this corpus — not a complete NOAA fleet registry</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden md:inline-flex px-2.5 py-1 rounded-full border text-[10px] ${corpusAudit.passed ? 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300' : 'border-rose-700/40 bg-rose-950/20 text-rose-300'}`}>
            Truth audit {corpusAudit.passed ? 'pass' : 'review'}
          </span>
          {selected && (
            <button
              onClick={openSelectedInGraph}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-cyan-200 text-xs hover:bg-cyan-900/30 transition-colors"
            >
              <Network className="w-3.5 h-3.5" />
              Open in graph
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900" title="Close corpus workspace">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="h-12 shrink-0 border-b border-slate-800 px-6 flex items-center gap-1 bg-[#060d18]">
        {(['CATALOG', 'PASSPORT', 'EVIDENCE', 'RELATIONSHIPS'] as CorpusView[]).map((item) => (
          <button
            key={item}
            onClick={() => setView(item)}
            className={`px-4 py-2 rounded-lg text-xs transition-colors ${
              view === item
                ? 'bg-slate-800/80 text-white'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {item === 'RELATIONSHIPS' ? 'Relationships' : item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
        <div className="ml-auto text-xs text-slate-600">{VERIFIED_NOAA_UXS_CORPUS.length} source-backed records</div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr]">
        <aside className="border-r border-slate-800 bg-[#050a13] flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets"
                className="w-full bg-[#08111f] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-cyan-700 text-slate-200 placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'UUV', 'USV', 'Glider'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setClassFilter(value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] ${
                    classFilter === value
                      ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-700/30'
                      : 'text-slate-500 border border-transparent hover:text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {filtered.map((record) => (
              <button
                key={record.id}
                onClick={() => selectRecord(record)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.id === record.id
                    ? 'border-cyan-700/40 bg-cyan-950/15'
                    : 'border-transparent bg-[#07101c] hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-medium text-slate-100 leading-snug">{record.manufacturer} {record.model}</div>
                <div className="mt-1.5 text-xs text-slate-500">
                  {record.platformClass} · {record.serialOrIdentifier ? `#${record.serialOrIdentifier}` : record.cdNumber || 'identity pending'}
                </div>
                <span className={`inline-flex mt-3 px-2 py-0.5 rounded-full border text-[10px] ${statusClass(record.status)}`}>
                  {record.status || 'UNKNOWN'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 overflow-auto bg-[#030812]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm">No corpus record selected.</div>
          ) : (
            <div className="px-8 py-9 max-w-5xl mx-auto">
              {view === 'CATALOG' && <CatalogView record={selected} />}
              {view === 'PASSPORT' && <PassportView record={selected} />}
              {view === 'EVIDENCE' && <EvidenceView record={selected} />}
              {view === 'RELATIONSHIPS' && (
                <RelationshipsView record={selected} assessments={relationshipAssessment} audit={corpusAudit} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const PageHeading: React.FC<{ eyebrow: string; title: string; subtitle?: string; aside?: React.ReactNode }> = ({ eyebrow, title, subtitle, aside }) => (
  <div className="flex items-start justify-between gap-8 mb-8">
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-500">{eyebrow}</div>
      <h1 className="text-3xl font-semibold text-slate-100 mt-2 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">{subtitle}</p>}
    </div>
    {aside && <div className="shrink-0">{aside}</div>}
  </div>
);

const CatalogView: React.FC<{ record: VerifiedUxSAssetRecord }> = ({ record }) => (
  <div className="space-y-8">
    <PageHeading
      eyebrow="Source observation"
      title={`${record.manufacturer} ${record.model}`}
      subtitle={`${record.platformClass} · ${record.serialOrIdentifier ? `Asset ${record.serialOrIdentifier}` : record.cdNumber || 'No serial in source'}`}
      aside={<span className="inline-flex px-3 py-1.5 rounded-full border border-cyan-800/40 bg-cyan-950/15 text-cyan-300 text-xs">{maturityLabel(record)}</span>}
    />

    <section className="rounded-2xl border border-slate-800 bg-[#07101c] overflow-hidden">
      <SectionTitle title="Key facts" subtitle="Identity and source context kept separate from deployment claims." />
      <div className="divide-y divide-slate-800/80">
        <FactRow label="Identity basis" value={record.identityBasis} />
        <FactRow label="Source confidence" value={`${Math.round(record.confidence * 100)}%`} />
        <FactRow label="Source years" value={record.sourceYears.join(', ')} />
        <FactRow label="Physical location" value={record.physicalLocation || 'UNKNOWN'} />
        <FactRow label="CD number" value={record.cdNumber || 'UNKNOWN'} />
        <FactRow label="Acquisition" value={record.acquisitionYear || 'UNKNOWN'} />
      </div>
    </section>

    <section className="rounded-2xl border border-slate-800 bg-[#07101c] p-6 space-y-6">
      <div>
        <div className="text-xs text-slate-500">Mission / use context</div>
        <div className="text-base text-slate-200 mt-2 leading-relaxed">{record.missionContext || 'UNKNOWN'}</div>
      </div>
      <div className="border-t border-slate-800 pt-6">
        <div className="text-xs text-slate-500">Payload / version evidence</div>
        <div className="text-base text-slate-200 mt-2 leading-relaxed">{record.payloadEvidence || 'No payload value in imported source row'}</div>
      </div>
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <TruthPanel title="What this source supports" items={record.supports} positive />
      <TruthPanel title="What this source does not prove" items={record.doesNotProve} />
    </section>
  </div>
);

const PassportView: React.FC<{ record: VerifiedUxSAssetRecord }> = ({ record }) => (
  <div className="space-y-8">
    <PageHeading
      eyebrow="Knowledge passport"
      title={`${record.manufacturer} ${record.model}${record.serialOrIdentifier ? ` #${record.serialOrIdentifier}` : ''}`}
      subtitle="A candidate semantic identity backed by an imported source observation."
    />

    <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/10 p-6">
      <div className="text-xs text-slate-500">Knowledge Key candidate</div>
      <div className="mt-3 font-mono text-base text-cyan-300 break-all">{buildKnowledgeKeyCandidate(record)}</div>
      <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-3xl">
        This semantic address remains a candidate until reconciliation or a HumanDecision accepts the binding. The external source identity is preserved separately.
      </p>
    </section>

    <section className="rounded-2xl border border-slate-800 bg-[#07101c] overflow-hidden">
      <SectionTitle title="Identity" />
      <div className="divide-y divide-slate-800/80">
        <FactRow label="Source identity state" value={record.identityState} />
        <FactRow label="Source reference" value={record.sourceRef} mono />
        <FactRow label="Manufacturer" value={record.manufacturer} />
        <FactRow label="Model" value={record.model} />
        <FactRow label="Serial / identifying number" value={record.serialOrIdentifier || 'UNKNOWN'} />
        <FactRow label="Provenance" value={record.provenanceType} />
      </div>
    </section>

    <div className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-5 flex gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-medium text-amber-200">Identity is not a deployment claim</div>
        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">The imported registry can support asset/model identity and recorded context. It cannot by itself establish a specific dive, serialized sensor use, or dataset production.</p>
      </div>
    </div>
  </div>
);

const EvidenceView: React.FC<{ record: VerifiedUxSAssetRecord }> = ({ record }) => (
  <div className="space-y-8">
    <PageHeading eyebrow="Evidence tree" title="Why this record exists" subtitle="The path from imported artifact to candidate semantic identity." />
    <div className="space-y-4 max-w-3xl">
      <EvidenceStep icon={<Database className="w-4 h-4" />} title="Imported source artifact" value={record.sourceArtifact} detail="The workbook remains evidence; it is not a second canonical database." />
      <EvidenceStep icon={<Anchor className="w-4 h-4" />} title="Source row identity" value={record.sourceRef} detail={`Identity basis: ${record.identityBasis} · confidence ${Math.round(record.confidence * 100)}%`} />
      <EvidenceStep icon={<GitBranch className="w-4 h-4" />} title="Candidate semantic binding" value={buildKnowledgeKeyCandidate(record)} detail="Candidate Knowledge Key. Existing HumanDecision / claim machinery owns acceptance." />
      <EvidenceStep icon={<ShieldCheck className="w-4 h-4" />} title="Authority boundary" value="IMPORTED_ARTIFACT" detail="This observation supports only the fields present in the source. OISS, archive, CoMET, OneStop and CMR remain separate authorities." />
    </div>
  </div>
);

const RelationshipsView: React.FC<{
  record: VerifiedUxSAssetRecord;
  assessments: ReturnType<typeof getSourceBackedRelationshipAssessment>;
  audit: ReturnType<typeof runVerifiedCorpusInvariantAudit>;
}> = ({ record, assessments, audit }) => (
  <div className="space-y-8">
    <PageHeading
      eyebrow="Relationship evidence"
      title="What this row can establish"
      subtitle={`${record.sourceRef} · No transitive green lights.`}
    />

    <div className="space-y-3 max-w-4xl">
      {assessments.map((assessment) => (
        <div key={assessment.predicate} className={`rounded-2xl border p-5 ${relationshipStateClass(assessment.state)}`}>
          <div className="flex items-center justify-between gap-6">
            <div className="font-mono text-sm font-semibold text-slate-100">{assessment.predicate}</div>
            <span className={`text-[10px] uppercase tracking-wider ${relationshipStateText(assessment.state)}`}>{assessment.state.replaceAll('_', ' ')}</span>
          </div>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-3xl">{assessment.explanation}</p>
          <div className="mt-4 text-xs text-slate-600">Evidence: {assessment.evidenceRefs.join(', ')}</div>
        </div>
      ))}
    </div>

    <details className="max-w-4xl rounded-2xl border border-slate-800 bg-[#07101c] group">
      <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-200">Corpus truth audit</div>
          <div className="text-xs text-slate-500 mt-1">{audit.checks.filter((check) => check.passed).length}/{audit.checks.length} checks passing</div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-90" />
      </summary>
      <div className="border-t border-slate-800 p-5 space-y-3">
        {audit.checks.map((check) => (
          <div key={check.id} className="flex items-start gap-3 py-2">
            {check.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
            <div>
              <div className="text-xs font-medium text-slate-300">{check.id}</div>
              <div className="text-sm text-slate-500 mt-1 leading-relaxed">{check.explanation}</div>
            </div>
          </div>
        ))}
      </div>
    </details>
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="p-5 border-b border-slate-800">
    <div className="text-sm font-medium text-slate-200">{title}</div>
    {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
  </div>
);

const FactRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="grid grid-cols-[180px_1fr] gap-6 px-5 py-4 items-start">
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`text-sm text-slate-200 break-words ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
  </div>
);

const TruthPanel: React.FC<{ title: string; items: string[]; positive?: boolean }> = ({ title, items, positive }) => (
  <div className={`p-6 rounded-2xl border ${positive ? 'border-emerald-800/25 bg-emerald-950/8' : 'border-amber-800/25 bg-amber-950/8'}`}>
    <div className={`text-sm font-medium ${positive ? 'text-emerald-300' : 'text-amber-300'}`}>{title}</div>
    <div className="mt-5 space-y-4">
      {items.map((item) => (
        <div key={item} className="flex gap-3 text-sm text-slate-400 leading-relaxed">
          {positive ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> : <CircleDashed className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />}
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

const EvidenceStep: React.FC<{ icon: React.ReactNode; title: string; value: string; detail: string }> = ({ icon, title, value, detail }) => (
  <div className="grid grid-cols-[44px_1fr] gap-4 items-start p-5 rounded-2xl border border-slate-800 bg-[#07101c]">
    <div className="w-11 h-11 rounded-xl border border-cyan-800/25 bg-cyan-950/15 flex items-center justify-center text-cyan-300">{icon}</div>
    <div className="min-w-0 pt-0.5">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1.5 text-sm text-slate-100 break-all leading-relaxed">{value}</div>
      <div className="mt-2 text-sm text-slate-500 leading-relaxed">{detail}</div>
    </div>
  </div>
);
