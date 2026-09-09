import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UxSMission } from '../../types';
import { VERIFIED_NOAA_UXS_CORPUS } from '../../data/verifiedNoaaCorpus';
import {
  getSourceBackedRelationshipAssessment,
  runVerifiedCorpusInvariantAudit,
} from '../../services/verifiedCorpusAdapter';

interface CorpusAuditHarnessPanelProps {
  mission: UxSMission;
}

export const CorpusAuditHarnessPanel: React.FC<CorpusAuditHarnessPanelProps> = () => {
  const audit = useMemo(() => runVerifiedCorpusInvariantAudit(), []);
  const relationshipCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    VERIFIED_NOAA_UXS_CORPUS.forEach((record) => {
      getSourceBackedRelationshipAssessment(record).forEach((assessment) => {
        counts[assessment.predicate] ||= {};
        counts[assessment.predicate][assessment.state] = (counts[assessment.predicate][assessment.state] || 0) + 1;
      });
    });
    return counts;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#060b14] text-slate-200 font-mono text-xs space-y-5">
      <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/15 flex gap-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
        <div>
          <div className="font-bold text-amber-200">LEGACY 15-TEST FIXTURE HARNESS QUARANTINED</div>
          <p className="mt-1 text-slate-400 leading-relaxed">
            The old harness depended on seeded provider specs, EN2501 operations logs, archive manifests, and DATA_PROVEN demo relationships. This audit now evaluates only the source-backed fused-registry overlay.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#081224] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="font-bold text-slate-100 tracking-wider">CORPUS TRUTH AUDIT</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Source-backed evidence boundary · no transitive green lights</div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-lg border font-bold ${audit.passed ? 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300' : 'border-rose-700/50 bg-rose-950/30 text-rose-300'}`}>
          {audit.passed ? 'PASS' : 'REVIEW'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {audit.checks.map((check) => (
          <div key={check.id} className="p-4 rounded-xl border border-slate-800 bg-[#07101c] flex gap-3">
            {check.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
            <div>
              <div className="font-bold text-slate-200 text-[11px]">{check.id}</div>
              <div className="mt-1 text-slate-400 text-[11px] leading-relaxed">{check.explanation}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c] space-y-3">
        <div className="font-bold text-slate-100">RELATIONSHIP EVIDENCE STATES ACROSS {VERIFIED_NOAA_UXS_CORPUS.length} SOURCE-BACKED ASSET RECORDS</div>
        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-slate-500 text-[10px]">
              <tr>
                <th className="py-2 pr-3">Predicate</th>
                <th className="py-2 pr-3">Supported by row</th>
                <th className="py-2 pr-3">Mention only</th>
                <th className="py-2">Not established</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(relationshipCounts).map(([predicate, states]) => (
                <tr key={predicate} className="border-t border-slate-800">
                  <td className="py-2 pr-3 text-cyan-300 font-bold">{predicate}</td>
                  <td className="py-2 pr-3 text-emerald-300">{states.SUPPORTED_BY_SOURCE_ROW || 0}</td>
                  <td className="py-2 pr-3 text-amber-300">{states.SOURCE_MENTION_ONLY || 0}</td>
                  <td className="py-2 text-slate-400">{states.NOT_ESTABLISHED || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-[#050a14] text-[11px] text-slate-400 leading-relaxed">
        <strong className="text-slate-200">Audit scope:</strong> this proves only the behavior of the verified corpus overlay. It does not prove provider capability, physical instrument configuration, bounded deployment use, dataset production, OISS execution, archive acceptance, or discovery publication.
      </div>
    </div>
  );
};
