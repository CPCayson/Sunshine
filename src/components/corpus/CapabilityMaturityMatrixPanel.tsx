import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, Layers, ShieldCheck } from 'lucide-react';
import { VERIFIED_NOAA_UXS_CORPUS } from '../../data/verifiedNoaaCorpus';
import { getSourceBackedRelationshipAssessment } from '../../services/verifiedCorpusAdapter';

const stateClass = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300';
  if (state === 'SOURCE_MENTION_ONLY') return 'border-amber-700/40 bg-amber-950/20 text-amber-300';
  return 'border-slate-700 bg-[#060c18] text-slate-400';
};

export const CapabilityMaturityMatrixPanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState(VERIFIED_NOAA_UXS_CORPUS[0]?.id || '');
  const selected = VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === selectedId) || VERIFIED_NOAA_UXS_CORPUS[0];
  const assessments = useMemo(() => selected ? getSourceBackedRelationshipAssessment(selected) : [], [selected]);
  const maturity = assessments.filter((item) => ['CAN_CARRY', 'CONFIGURED_WITH', 'CARRIED', 'PRODUCED'].includes(item.predicate));

  if (!selected) return <div className="p-6 text-slate-500">No verified corpus records are loaded.</div>;

  return (
    <div id="capability-maturity-matrix-panel" className="flex-1 overflow-y-auto p-6 bg-[#060b14] font-mono text-xs text-slate-200 space-y-5">
      <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/15 flex gap-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
        <div>
          <div className="font-bold text-amber-200">LEGACY DATA_PROVEN DEMO QUARANTINED</div>
          <p className="mt-1 text-slate-400 leading-relaxed">
            This surface no longer uses the old seeded provider specification, EN2501 dive log, or archive-manifest fixtures as real evidence. Maturity is now limited to what the imported fused-registry row actually establishes.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#081224] flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-wider">CAPABILITY EVIDENCE MATURITY</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">COULD ≠ CONFIGURED ≠ DEPLOYED ≠ PRODUCED</div>
        </div>
        <label className="space-y-1 min-w-[280px]">
          <span className="text-slate-500">Source-backed asset</span>
          <select value={selected.id} onChange={(e) => setSelectedId(e.target.value)} className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200">
            {VERIFIED_NOAA_UXS_CORPUS.map((record) => (
              <option key={record.id} value={record.id}>
                {record.manufacturer} {record.model} {record.serialOrIdentifier ? `#${record.serialOrIdentifier}` : record.cdNumber || ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {maturity.map((assessment, index) => {
          const labels = ['POTENTIAL', 'CONFIGURED', 'DEPLOYED', 'DATA_PROVEN'];
          const supported = assessment.state === 'SUPPORTED_BY_SOURCE_ROW';
          const mentioned = assessment.state === 'SOURCE_MENTION_ONLY';
          return (
            <div key={assessment.predicate} className={`rounded-xl border p-4 ${stateClass(assessment.state)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">STAGE {index + 1}</span>
                {supported ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <CircleDashed className={`w-4 h-4 ${mentioned ? 'text-amber-400' : 'text-slate-600'}`} />}
              </div>
              <div className="mt-2 text-sm font-bold text-slate-100">{labels[index]}</div>
              <div className="mt-1 text-cyan-300 font-bold">{assessment.predicate}</div>
              <div className="mt-3 text-[10px] font-bold">{assessment.state}</div>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{assessment.explanation}</p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 break-all">
                Evidence: {assessment.evidenceRefs.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c] space-y-2">
          <div className="font-bold text-slate-100">SOURCE-OBSERVED CONTEXT</div>
          <div><span className="text-slate-500">Asset:</span> {selected.manufacturer} {selected.model} {selected.serialOrIdentifier || selected.cdNumber || ''}</div>
          <div><span className="text-slate-500">Use context:</span> {selected.missionContext || 'UNKNOWN'}</div>
          <div><span className="text-slate-500">Payload text:</span> {selected.payloadEvidence || 'NONE IN SOURCE ROW'}</div>
          <div><span className="text-slate-500">Provenance:</span> <span className="text-amber-300">{selected.provenanceType}</span></div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c] space-y-2">
          <div className="font-bold text-slate-100">WHAT IS STILL NEEDED</div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">CAN_CARRY</strong> needs provider/manufacturer specification evidence. <strong className="text-slate-200">CONFIGURED_WITH</strong> needs a physical configuration record tied to an instrument instance. <strong className="text-slate-200">CARRIED</strong> needs bounded mission/deployment evidence. <strong className="text-slate-200">PRODUCED</strong> needs dataset lineage from an instrument instance.
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-emerald-800/30 bg-emerald-950/10 flex gap-2 text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>No stage becomes green because another stage is green. Provider capability, configuration, deployment, and data lineage remain independently scoped.</span>
      </div>
    </div>
  );
};
