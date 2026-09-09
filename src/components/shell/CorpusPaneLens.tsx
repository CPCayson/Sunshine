import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Database,
  GitBranch,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ActiveWorkspaceTab, UxSMission, WorkspaceSelection } from '../../types';
import { VERIFIED_NOAA_UXS_CORPUS, buildKnowledgeKeyCandidate } from '../../data/verifiedNoaaCorpus';
import {
  corpusGraphNodeIdForRecord,
  corpusObservationNodeIdForRecord,
  getSourceBackedRelationshipAssessment,
} from '../../services/verifiedCorpusAdapter';

interface CorpusPaneLensProps {
  isOpen: boolean;
  onClose: () => void;
  selection: WorkspaceSelection;
  mission: UxSMission;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
}

const stateClass = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'text-emerald-300';
  if (state === 'SOURCE_MENTION_ONLY') return 'text-amber-300';
  return 'text-slate-500';
};

export const CorpusPaneLens: React.FC<CorpusPaneLensProps> = ({
  isOpen,
  onClose,
  selection,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const record = VERIFIED_NOAA_UXS_CORPUS.find((candidate) =>
    selection.sourceObservationId === corpusObservationNodeIdForRecord(candidate) ||
    selection.graphNodeId === corpusGraphNodeIdForRecord(candidate) ||
    selection.canonicalRef === buildKnowledgeKeyCandidate(candidate)
  );

  if (!record) {
    return (
      <aside className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-[#060c18]/96 border-l border-slate-800 z-30 p-6 text-sm text-slate-500">
        <button onClick={onClose} className="float-right p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        No source-backed corpus record resolved for this selection.
      </aside>
    );
  }

  const key = buildKnowledgeKeyCandidate(record);
  const assessments = getSourceBackedRelationshipAssessment(record);

  return (
    <aside className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-[#060c18]/96 border-l border-slate-800 backdrop-blur-md flex flex-col z-30 shadow-2xl font-sans">
      <div className="px-5 py-4 bg-[#081224] border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-100">Knowledge passport</div>
          <div className="text-xs text-slate-600 mt-0.5">Source-backed corpus selection</div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <section>
          <div className="text-[11px] uppercase tracking-[0.14em] text-cyan-500">Physical asset observation</div>
          <h3 className="text-xl font-semibold text-slate-100 mt-2 leading-snug">{record.manufacturer} {record.model} {record.serialOrIdentifier ? `#${record.serialOrIdentifier}` : ''}</h3>
          <p className="text-sm text-slate-500 mt-2">{record.platformClass} · {record.status || 'status unknown'}</p>
        </section>

        <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/10 p-5">
          <div className="text-xs text-slate-500">Knowledge Key candidate</div>
          <div className="mt-2 font-mono text-sm text-cyan-300 break-all leading-relaxed">{key}</div>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">Candidate semantic address only. Acceptance remains a separate reconciliation decision.</p>
        </section>

        <section className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-4 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-500 leading-relaxed">Imported inventory evidence is not a deployment claim and does not mutate the accepted mission.</p>
        </section>

        <section className="space-y-3">
          <div className="text-xs text-slate-500">Relationship evidence</div>
          {assessments.map((assessment) => (
            <div key={assessment.predicate} className="py-3 border-b border-slate-800 last:border-b-0">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-sm text-slate-200">{assessment.predicate}</span>
                <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${stateClass(assessment.state)}`}>
                  {assessment.state === 'SUPPORTED_BY_SOURCE_ROW' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
                  <span>{assessment.state.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{assessment.explanation}</p>
            </div>
          ))}
        </section>

        <details className="rounded-2xl border border-slate-800 bg-[#07101c] group">
          <summary className="list-none cursor-pointer p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-200">Source detail</div>
              <div className="text-xs text-slate-600 mt-1">Provenance, context and raw evidence</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t border-slate-800 p-4 space-y-4 text-sm">
            <div><span className="text-slate-600">Source ref</span><div className="mt-1 text-slate-300 font-mono text-xs break-all">{record.sourceRef}</div></div>
            <div><span className="text-slate-600">Artifact</span><div className="mt-1 text-slate-300">{record.sourceArtifact}</div></div>
            <div><span className="text-slate-600">Use context</span><div className="mt-1 text-slate-300">{record.missionContext || 'UNKNOWN'}</div></div>
            <div><span className="text-slate-600">Payload text</span><div className="mt-1 text-slate-300">{record.payloadEvidence || 'NONE'}</div></div>
            <div><span className="text-slate-600">Provenance</span><div className="mt-1 text-amber-300">{record.provenanceType}</div></div>
          </div>
        </details>
      </div>

      <div className="p-4 border-t border-slate-800 grid grid-cols-2 gap-2 bg-[#050a14]">
        <button onClick={() => onNavigateTab?.('evidence')} className="p-2.5 rounded-xl border border-emerald-800/40 bg-emerald-950/15 text-emerald-300 flex items-center justify-center gap-2 text-xs"><ShieldCheck className="w-3.5 h-3.5" />Evidence</button>
        <button onClick={() => onNavigateTab?.('graph')} className="p-2.5 rounded-xl border border-cyan-800/40 bg-cyan-950/15 text-cyan-300 flex items-center justify-center gap-2 text-xs"><GitBranch className="w-3.5 h-3.5" />Graph</button>
      </div>
    </aside>
  );
};
