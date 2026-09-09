import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, Layers, ShieldCheck } from 'lucide-react';
import { VERIFIED_NOAA_UXS_CORPUS } from '../../data/verifiedNoaaCorpus';
import { getSourceBackedRelationshipAssessment } from '../../services/verifiedCorpusAdapter';

const stateClass = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'border-emerald-800/40 bg-emerald-950/10';
  if (state === 'SOURCE_MENTION_ONLY') return 'border-amber-800/40 bg-amber-950/10';
  return 'border-slate-800 bg-[#07101c]';
};

const stateText = (state: string) => {
  if (state === 'SUPPORTED_BY_SOURCE_ROW') return 'text-emerald-300';
  if (state === 'SOURCE_MENTION_ONLY') return 'text-amber-300';
  return 'text-slate-500';
};

export const CapabilityMaturityMatrixPanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState(VERIFIED_NOAA_UXS_CORPUS[0]?.id || '');
  const selected = VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === selectedId) || VERIFIED_NOAA_UXS_CORPUS[0];
  const assessments = useMemo(() => selected ? getSourceBackedRelationshipAssessment(selected) : [], [selected]);
  const maturity = assessments.filter((item) => ['CAN_CARRY', 'CONFIGURED_WITH', 'CARRIED', 'PRODUCED'].includes(item.predicate));

  if (!selected) return <div className="p-8 text-slate-500">No verified corpus records are loaded.</div>;

  return (
    <div id="capability-maturity-matrix-panel" className="flex-1 overflow-y-auto bg-[#060b14] text-slate-200">
      <div className="max-w-5xl mx-auto px-8 py-9 space-y-8">
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Layers className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.16em]">Capability evidence</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-100 mt-2">Could it? Did it? Did it produce data?</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">Each stage is independently evidence-backed. A green result in one stage never carries forward automatically.</p>
          </div>

          <label className="min-w-[300px] space-y-1.5 shrink-0">
            <span className="text-xs text-slate-500">Source-backed asset</span>
            <select value={selected.id} onChange={(e) => setSelectedId(e.target.value)} className="w-full p-2.5 bg-[#050a14] border border-slate-700 rounded-xl text-sm text-slate-200">
              {VERIFIED_NOAA_UXS_CORPUS.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.manufacturer} {record.model} {record.serialOrIdentifier ? `#${record.serialOrIdentifier}` : record.cdNumber || ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-5 flex gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
          <div>
            <div className="text-sm font-medium text-amber-200">Legacy DATA_PROVEN demo quarantined</div>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">The old seeded provider spec, EN2501 dive log and archive-manifest fixtures are no longer treated as real operational evidence here.</p>
          </div>
        </div>

        <div className="space-y-4">
          {maturity.map((assessment, index) => {
            const labels = ['Potential capability', 'Physical configuration', 'Bounded deployment', 'Dataset lineage'];
            const questions = ['Could this platform support it?', 'Was this asset configured with it?', 'Did a specific deployment carry it?', 'Did the instrument instance produce data?'];
            const supported = assessment.state === 'SUPPORTED_BY_SOURCE_ROW';
            const mentioned = assessment.state === 'SOURCE_MENTION_ONLY';

            return (
              <div key={assessment.predicate} className={`rounded-2xl border p-5 ${stateClass(assessment.state)}`}>
                <div className="grid grid-cols-[44px_220px_1fr_auto] gap-5 items-start">
                  <div className="w-11 h-11 rounded-xl border border-slate-700 bg-[#050a14] flex items-center justify-center text-sm text-slate-500">{index + 1}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">{labels[index]}</div>
                    <div className="mt-1 text-xs font-mono text-cyan-300">{assessment.predicate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-300">{questions[index]}</div>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{assessment.explanation}</p>
                    <div className="mt-3 text-xs text-slate-600">Evidence: {assessment.evidenceRefs.join(', ')}</div>
                  </div>
                  <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${stateText(assessment.state)}`}>
                    {supported ? <CheckCircle2 className="w-4 h-4" /> : <CircleDashed className={`w-4 h-4 ${mentioned ? 'text-amber-400' : 'text-slate-600'}`} />}
                    <span>{assessment.state.replaceAll('_', ' ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <details className="rounded-2xl border border-slate-800 bg-[#07101c] group">
          <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-200">Source context and evidence gaps</div>
              <div className="text-xs text-slate-500 mt-1">Open only when you need provenance detail.</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t border-slate-800 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wider text-slate-600">Source-observed context</div>
              <div><span className="text-slate-500">Asset:</span> <span className="text-slate-200">{selected.manufacturer} {selected.model} {selected.serialOrIdentifier || selected.cdNumber || ''}</span></div>
              <div><span className="text-slate-500">Use context:</span> <span className="text-slate-300">{selected.missionContext || 'UNKNOWN'}</span></div>
              <div><span className="text-slate-500">Payload text:</span> <span className="text-slate-300">{selected.payloadEvidence || 'NONE IN SOURCE ROW'}</span></div>
              <div><span className="text-slate-500">Provenance:</span> <span className="text-amber-300">{selected.provenanceType}</span></div>
            </div>
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wider text-slate-600">What is still needed</div>
              <p className="text-slate-400 leading-relaxed"><strong className="text-slate-200">CAN_CARRY</strong> needs provider/manufacturer specification evidence.</p>
              <p className="text-slate-400 leading-relaxed"><strong className="text-slate-200">CONFIGURED_WITH</strong> needs a physical configuration record tied to an instrument instance.</p>
              <p className="text-slate-400 leading-relaxed"><strong className="text-slate-200">CARRIED</strong> needs bounded mission/deployment evidence.</p>
              <p className="text-slate-400 leading-relaxed"><strong className="text-slate-200">PRODUCED</strong> needs dataset lineage from an instrument instance.</p>
            </div>
          </div>
        </details>

        <div className="p-4 rounded-xl border border-emerald-800/25 bg-emerald-950/8 flex gap-3 text-sm text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>No stage becomes green because another stage is green. Capability, configuration, deployment and data lineage stay independently scoped.</span>
        </div>
      </div>
    </div>
  );
};
