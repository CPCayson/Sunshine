import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Play,
  Wrench,
  X,
} from 'lucide-react';
import { SignalFinding, SignalSeverity, UxSMission } from '../types';
import { SEED_SIGNAL_FINDINGS } from '../data/evidenceAndClaims';
import {
  executeTransversalProofMatrix,
  verifyDocuCompSemanticPlacement,
} from '../services/semanticPlacementModule';

interface SignalAssuranceProps {
  mission: UxSMission;
  onApplyRemediation: (finding: SignalFinding) => void;
  onSwitchTab: (tab: any) => void;
}

const severityClass = (severity: SignalSeverity) => {
  switch (severity) {
    case 'ERROR': return 'text-rose-300 border-rose-800/70 bg-rose-950/20';
    case 'WARNING': return 'text-amber-300 border-amber-800/70 bg-amber-950/20';
    case 'INFO': return 'text-blue-300 border-blue-800/70 bg-blue-950/20';
    case 'SUGGESTION': return 'text-purple-300 border-purple-800/70 bg-purple-950/20';
    default: return 'text-slate-400 border-slate-800 bg-slate-950/20';
  }
};

export const SignalAssurance: React.FC<SignalAssuranceProps> = ({
  mission,
  onApplyRemediation,
  onSwitchTab,
}) => {
  const semanticAudit = useMemo(() => verifyDocuCompSemanticPlacement(mission), [mission]);
  const [findings, setFindings] = useState<SignalFinding[]>(() => {
    const dynamic = verifyDocuCompSemanticPlacement(mission).findings;
    const existing = new Set(SEED_SIGNAL_FINDINGS.map((finding) => finding.id));
    return [...SEED_SIGNAL_FINDINGS, ...dynamic.filter((finding) => !existing.has(finding.id))];
  });
  const initial = findings.find((finding) => finding.severity === 'ERROR') || findings[0] || null;
  const [activeFindingId, setActiveFindingId] = useState(initial?.id || '');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [proofMatrix, setProofMatrix] = useState<any | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [liveDocucompState, setLiveDocucompState] = useState<{ testing: boolean; result: any | null }>({ testing: false, result: null });

  const activeFinding = findings.find((finding) => finding.id === activeFindingId) || findings[0] || null;
  const filteredFindings = useMemo(() => findings.filter((finding) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'PLACEMENT') return finding.id.includes('SEMANTIC-PLACEMENT') || finding.ruleName.includes('SEMANTIC_PLACEMENT');
    return finding.severity === severityFilter;
  }), [findings, severityFilter]);

  const unresolvedCount = findings.filter((finding) => !finding.resolved && finding.severity !== 'INFO').length;
  const resolvedCount = findings.filter((finding) => finding.resolved).length;

  const activeSemanticAuditItem: any = useMemo(() => {
    if (!activeFinding) return null;
    return semanticAudit.items.find((item: any) => item.finding?.id === activeFinding.id || activeFinding.id.includes(item.componentId));
  }, [activeFinding, semanticAudit]);

  const handleFix = (finding: SignalFinding) => {
    onApplyRemediation(finding);
    setFindings((current) => current.map((item) => item.id === finding.id ? { ...item, resolved: true } : item));
  };

  const handleRunProofMatrix = () => {
    setProofMatrix(executeTransversalProofMatrix());
    setProofOpen(true);
  };

  const handleTestLiveDocucomp = async (uuid: string) => {
    setLiveDocucompState({ testing: true, result: null });
    try {
      const response = await fetch(`/api/docucomp/dereference?url=${encodeURIComponent(uuid)}`);
      const data = await response.json();
      setLiveDocucompState({ testing: false, result: data });
    } catch (error: any) {
      setLiveDocucompState({ testing: false, result: { error: error?.message || String(error) } });
    }
  };

  return (
    <div id="signal-assurance-workspace" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      <header className="px-7 py-5 border-b border-slate-800 bg-[#07101c] flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Signal</h2>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Show only what needs attention, why it matters, and what action would resolve it. Technical proof stays available on demand.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">
            <span className="text-slate-200 font-medium">{unresolvedCount}</span> open · <span className="text-slate-200 font-medium">{resolvedCount}</span> resolved
          </div>
          <button onClick={handleRunProofMatrix} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-700/60 hover:text-amber-200 flex items-center gap-2 text-sm">
            <Play className="w-3.5 h-3.5" /> Proof matrix
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r border-slate-800 bg-[#050a13] min-h-0 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="bg-transparent text-xs text-slate-400 border border-slate-800 rounded-lg px-2.5 py-1.5 outline-none">
              <option value="ALL">All findings</option>
              <option value="ERROR">Errors</option>
              <option value="WARNING">Warnings</option>
              <option value="PLACEMENT">DocuComp placement</option>
              <option value="SUGGESTION">Suggestions</option>
              <option value="INFO">Info</option>
            </select>
            <span className="text-xs text-slate-600">{filteredFindings.length}</span>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {filteredFindings.map((finding) => {
              const selected = activeFinding?.id === finding.id;
              return (
                <button
                  key={finding.id}
                  onClick={() => setActiveFindingId(finding.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${selected ? 'border-cyan-700/60 bg-cyan-950/15' : 'border-slate-800 bg-[#07101c] hover:border-slate-700'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">{finding.canonicalField}</div>
                      <div className="mt-1 text-xs text-slate-500 line-clamp-2">{finding.ruleName}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${severityClass(finding.severity)}`}>{finding.severity}</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
                    <span>{finding.affectedProjections.length} projection{finding.affectedProjections.length === 1 ? '' : 's'}</span>
                    {finding.resolved && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> resolved</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="overflow-auto">
          {activeFinding ? (
            <div className="max-w-4xl mx-auto px-8 py-8 lg:px-12 lg:py-10 space-y-8">
              <section>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded border ${severityClass(activeFinding.severity)}`}>{activeFinding.severity}</span>
                  {activeFinding.resolved && <span className="text-xs text-emerald-400">Resolved</span>}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-100">{activeFinding.canonicalField}</h3>
                <div className="mt-2 text-sm text-cyan-300">{activeFinding.ruleName}</div>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">{activeFinding.ruleDescription}</p>
              </section>

              <section className="border-t border-slate-800 pt-7">
                <div className="text-xs uppercase tracking-wider text-slate-600">Why Signal raised it</div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{activeFinding.evidenceSummary}</p>
              </section>

              <section className="border-t border-slate-800 pt-7 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-8 text-sm">
                <div className="text-slate-600">Affected outputs</div>
                <div className="text-slate-300">{activeFinding.affectedProjections.join(' · ') || 'None'}</div>
                <div className="text-slate-600">Recommended action</div>
                <div className="text-slate-300">{activeFinding.remediationAction?.label || activeFinding.recommendedAction || 'Review evidence and rule scope.'}</div>
              </section>

              <section className="border-t border-slate-800 pt-7 flex flex-wrap gap-3">
                {activeFinding.remediationAction && !activeFinding.resolved && (
                  <button onClick={() => handleFix(activeFinding)} className="px-4 py-2 rounded-lg bg-cyan-600 text-slate-950 font-semibold hover:bg-cyan-500 flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Apply remediation
                  </button>
                )}
                <button onClick={() => onSwitchTab('projections')} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900">
                  View affected projections
                </button>
              </section>

              <details className="border-t border-slate-800 pt-6 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-sm text-slate-300">
                  <div>
                    <div>Technical rule and proof context</div>
                    <div className="mt-1 text-xs text-slate-600">Rule IDs, semantic placement audit, and live dereference evidence</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-2 md:gap-6 text-xs">
                    <div className="text-slate-600">Finding ID</div><div className="text-slate-300 font-mono break-all">{activeFinding.id}</div>
                    <div className="text-slate-600">Rule ID</div><div className="text-slate-300 font-mono break-all">{activeFinding.ruleId || 'UNSPECIFIED'}</div>
                    <div className="text-slate-600">Canonical field</div><div className="text-slate-300 font-mono break-all">{activeFinding.canonicalField}</div>
                  </div>

                  {activeSemanticAuditItem && (
                    <div className="rounded-xl border border-amber-800/40 bg-amber-950/10 p-4">
                      <div className="flex items-center gap-2 text-amber-300"><AlertTriangle className="w-4 h-4" /><span className="font-medium">DocuComp semantic placement context</span></div>
                      <pre className="mt-4 text-[11px] leading-5 text-slate-400 whitespace-pre-wrap break-words overflow-auto max-h-72">{JSON.stringify(activeSemanticAuditItem, null, 2)}</pre>
                      {activeSemanticAuditItem.componentUuid && (
                        <button onClick={() => handleTestLiveDocucomp(activeSemanticAuditItem.componentUuid)} disabled={liveDocucompState.testing} className="mt-4 px-3 py-2 rounded-lg border border-amber-800/60 text-amber-200 disabled:opacity-50">
                          {liveDocucompState.testing ? 'Checking…' : 'Dereference component'}
                        </button>
                      )}
                      {liveDocucompState.result && <pre className="mt-3 text-[11px] leading-5 text-slate-500 whitespace-pre-wrap break-words">{JSON.stringify(liveDocucompState.result, null, 2)}</pre>}
                    </div>
                  )}
                </div>
              </details>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600">No Signal finding selected.</div>
          )}
        </main>
      </div>

      {proofOpen && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setProofOpen(false)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-slate-700 bg-[#07101c] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Transversal proof matrix</h3>
                <p className="mt-1 text-sm text-slate-500">Diagnostic output is kept separate from the main assurance surface.</p>
              </div>
              <button onClick={() => setProofOpen(false)} className="p-1.5 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <details className="mt-6 border border-slate-800 rounded-xl group" open>
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm text-slate-300">
                Raw proof result
                <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
              </summary>
              <pre className="border-t border-slate-800 p-4 text-[11px] leading-5 text-slate-400 whitespace-pre-wrap break-words">{JSON.stringify(proofMatrix, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};
