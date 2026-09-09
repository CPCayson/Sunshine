import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, Database, GitBranch, Key, ShieldCheck, X } from 'lucide-react';
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
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'text-emerald-300 border-emerald-800 bg-emerald-950/20';
  if (state === 'SOURCE_MENTION_ONLY') return 'text-amber-300 border-amber-800 bg-amber-950/20';
  return 'text-slate-400 border-slate-800 bg-[#050a14]';
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
      <aside className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#060c18]/95 border-l border-cyan-500/30 z-30 p-4 text-xs text-slate-400">
        <button onClick={onClose} className="float-right p-1"><X className="w-4 h-4" /></button>
        No source-backed corpus record resolved for this selection.
      </aside>
    );
  }

  const key = buildKnowledgeKeyCandidate(record);
  const assessments = getSourceBackedRelationshipAssessment(record);

  return (
    <aside className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#060c18]/95 border-l border-cyan-500/30 backdrop-blur-md flex flex-col z-30 shadow-2xl font-sans">
      <div className="p-3 bg-[#081224] border-b border-cyan-500/20 flex items-center justify-between font-mono">
        <div>
          <div className="text-xs font-bold text-slate-100 tracking-wider">CORPUS KNOWLEDGE PASSPORT</div>
          <div className="text-[10px] text-slate-500 mt-0.5">source-backed selection · no canonical mutation</div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        <div className="p-3 rounded-xl border border-cyan-500/20 bg-[#081224] space-y-2">
          <div className="text-[10px] text-cyan-400">PHYSICAL ASSET OBSERVATION</div>
          <div className="text-base font-bold text-slate-100">{record.manufacturer} {record.model} {record.serialOrIdentifier ? `#${record.serialOrIdentifier}` : ''}</div>
          <div className="text-slate-400">{record.platformClass} · {record.status || 'status unknown'}</div>
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[9px] text-slate-500">KNOWLEDGE KEY CANDIDATE</div>
            <div className="mt-1 text-cyan-300 break-all">{key}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Info label="Source ref" value={record.sourceRef} />
          <Info label="Identity" value={record.identityState} />
          <Info label="Location" value={record.physicalLocation || 'UNKNOWN'} />
          <Info label="Source years" value={record.sourceYears.join(', ')} />
        </div>

        <div className="p-3 rounded-lg border border-amber-700/30 bg-amber-950/10 flex gap-2 text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Imported inventory evidence is not a deployment claim. The candidate Knowledge Key remains separate from acceptance into canonical mission knowledge.</span>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Relationship evidence</div>
          {assessments.map((assessment) => (
            <div key={assessment.predicate} className={`p-3 rounded-lg border ${stateClass(assessment.state)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{assessment.predicate}</span>
                {assessment.state === 'SUPPORTED_BY_SOURCE_ROW' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <CircleDashed className="w-3.5 h-3.5" />}
              </div>
              <div className="mt-1 text-[9px] font-bold">{assessment.state}</div>
              <div className="mt-1 text-[10px] text-slate-400 leading-relaxed">{assessment.explanation}</div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#050a14] space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold"><Database className="w-3.5 h-3.5 text-cyan-400" />SOURCE EVIDENCE</div>
          <div className="text-slate-400">Artifact: {record.sourceArtifact}</div>
          <div className="text-slate-400">Use context: {record.missionContext || 'UNKNOWN'}</div>
          <div className="text-slate-400">Payload text: {record.payloadEvidence || 'NONE'}</div>
          <div className="text-amber-300">Provenance: {record.provenanceType}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onNavigateTab?.('evidence')} className="p-2 rounded border border-emerald-800 bg-emerald-950/20 text-emerald-300 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />EVIDENCE</button>
          <button onClick={() => onNavigateTab?.('graph')} className="p-2 rounded border border-cyan-800 bg-cyan-950/20 text-cyan-300 flex items-center justify-center gap-1"><GitBranch className="w-3.5 h-3.5" />GRAPH</button>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 text-[10px] text-slate-500 flex gap-2">
          <Key className="w-3.5 h-3.5 shrink-0" />
          <span>This lens intentionally does not show legacy fixture serials, provider capability specs, EN2501 dive claims, DATA_PROVEN status, or archive outcomes unless separate source-backed evidence is added.</span>
        </div>
      </div>
    </aside>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-2.5 rounded-lg border border-slate-800 bg-[#050a14] min-w-0">
    <div className="text-[9px] text-slate-500 uppercase">{label}</div>
    <div className="mt-1 text-[10px] text-slate-200 break-all">{value}</div>
  </div>
);
