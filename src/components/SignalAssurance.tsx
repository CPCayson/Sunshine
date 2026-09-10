import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Play,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { SignalFinding, SignalSeverity, UxSMission } from '../types';
import { SEED_SIGNAL_FINDINGS } from '../data/evidenceAndClaims';
import {
  executeTransversalProofMatrix,
  verifyDocuCompSemanticPlacement,
} from '../services/semanticPlacementModule';
import { loadDiscoveryIntakeDraft } from '../services/searchabilityService';
import { generateIso19115Xml } from '../utils/xmlGenerator';

interface SignalAssuranceProps {
  mission: UxSMission;
  onApplyRemediation: (finding: SignalFinding) => void;
  onSwitchTab: (tab: any) => void;
}

type QaService = 'validate' | 'rubricV2' | 'resolver' | 'linkcheck';

interface QaObservation {
  service: QaService;
  running: boolean;
  result: any | null;
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

function intakeSuggestionFindings(): SignalFinding[] {
  const draft = loadDiscoveryIntakeDraft();
  if (!draft) return [];
  return draft.suggestions.map((suggestion) => ({
    id: `SIG-INTAKE-${suggestion.id}`,
    severity: 'SUGGESTION' as const,
    canonicalField: suggestion.targetPath,
    ruleName: `${suggestion.authority} · ${suggestion.kind}`,
    ruleDescription: suggestion.explanation,
    evidenceSummary: `Discovery intake ${draft.intakeId}. Source: ${draft.source.system} ${draft.source.identifier || draft.source.id}. ${suggestion.evidence.join(' · ')}`,
    affectedProjections: ['ISO', 'STAC', 'OISS', 'CoMET'],
    remediationAction: { label: 'Review in discovery intake', applyValue: suggestion.proposed },
    sourceProfile: 'DISCOVERY_INTAKE',
    submissionId: draft.intakeId,
    canonicalCandidatePath: suggestion.targetPath,
    observedValue: suggestion.observed,
    explanation: suggestion.explanation,
    evidenceRef: suggestion.id,
  }));
}

function qaSeverity(data: any): SignalSeverity {
  const text = `${data?.result || ''} ${data?.rawResponseSnippet || ''}`.toLowerCase();
  if (data?.httpStatus == null || data?.authStatus === 'AUTH_REQUIRED') return 'WARNING';
  if (Number(data.httpStatus) >= 400) return 'ERROR';
  if (/\b(invalid|failed|failure|error)\b/.test(text) && !/0 errors?\b/.test(text)) return 'ERROR';
  return 'INFO';
}

function qaTarget(service: QaService, data: any): string {
  const text = `${data?.result || ''} ${data?.rawResponseSnippet || ''}`.toLowerCase();
  if (/responsibleparty|responsible party|contact/.test(text)) return 'contact';
  if (/keyword|gcmd|thesaurus/.test(text)) return 'keywords.gcmdScience';
  if (/xlink|resolver/.test(text)) return 'docucompReferences';
  if (service === 'linkcheck') return 'distribution.links';
  if (service === 'rubricV2') return 'metadataQuality';
  return 'ISO projection';
}

export const SignalAssurance: React.FC<SignalAssuranceProps> = ({
  mission,
  onApplyRemediation,
  onSwitchTab,
}) => {
  const semanticAudit = useMemo(() => verifyDocuCompSemanticPlacement(mission), [mission]);
  const [findings, setFindings] = useState<SignalFinding[]>(() => {
    const dynamic = verifyDocuCompSemanticPlacement(mission).findings;
    const imported = intakeSuggestionFindings();
    const existing = new Set(SEED_SIGNAL_FINDINGS.map((finding) => finding.id));
    return [
      ...SEED_SIGNAL_FINDINGS,
      ...dynamic.filter((finding) => !existing.has(finding.id)),
      ...imported,
    ];
  });
  const initial = findings.find((finding) => finding.severity === 'ERROR') || findings[0] || null;
  const [activeFindingId, setActiveFindingId] = useState(initial?.id || '');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [proofMatrix, setProofMatrix] = useState<any | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [liveDocucompState, setLiveDocucompState] = useState<{ testing: boolean; result: any | null }>({ testing: false, result: null });
  const [qa, setQa] = useState<Record<QaService, QaObservation>>({
    validate: { service: 'validate', running: false, result: null },
    rubricV2: { service: 'rubricV2', running: false, result: null },
    resolver: { service: 'resolver', running: false, result: null },
    linkcheck: { service: 'linkcheck', running: false, result: null },
  });

  const activeFinding = findings.find((finding) => finding.id === activeFindingId) || findings[0] || null;
  const filteredFindings = useMemo(() => findings.filter((finding) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'PLACEMENT') return finding.id.includes('SEMANTIC-PLACEMENT') || finding.ruleName.includes('SEMANTIC_PLACEMENT');
    if (severityFilter === 'INTAKE') return finding.sourceProfile === 'DISCOVERY_INTAKE';
    if (severityFilter === 'QA') return finding.sourceProfile === 'NOAA_RECORD_SERVICES';
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

  const runQa = async (service: QaService) => {
    setQa((current) => ({ ...current, [service]: { service, running: true, result: null } }));
    const xml = generateIso19115Xml(mission);
    try {
      const response = await fetch('/api/comet/recordServices/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, xml }),
      });
      const data = await response.json();
      setQa((current) => ({ ...current, [service]: { service, running: false, result: data } }));

      const target = qaTarget(service, data);
      const finding: SignalFinding = {
        id: `SIG-QA-${service}-${Date.now()}`,
        severity: qaSeverity(data),
        canonicalField: target,
        ruleName: `NOAA Record Services observation · ${service}`,
        ruleDescription: `Observed response from ${data?.upstreamEndpoint || `recordServices/${service}`}. This records what the remote service actually returned; it is not an OISS PASS or a global CoMET validation state.`,
        evidenceSummary: `${data?.result || 'No result text.'}${data?.rawResponseSnippet ? ` · ${data.rawResponseSnippet.slice(0, 220)}` : ''}`,
        affectedProjections: ['ISO', 'CoMET'],
        remediationAction: { label: 'Review the affected field and source evidence' },
        sourceProfile: 'NOAA_RECORD_SERVICES',
        canonicalCandidatePath: target,
        observedValue: data?.rawResponseSnippet || data?.result,
        evidenceRef: data?.id || `qa-${service}`,
      };
      setFindings((current) => [finding, ...current]);
      setActiveFindingId(finding.id);
    } catch (error: any) {
      const data = { result: `UNAVAILABLE_FROM_RUNTIME: ${error?.message || String(error)}`, httpStatus: null };
      setQa((current) => ({ ...current, [service]: { service, running: false, result: data } }));
      const finding: SignalFinding = {
        id: `SIG-QA-${service}-${Date.now()}`,
        severity: 'WARNING',
        canonicalField: qaTarget(service, data),
        ruleName: `NOAA Record Services unavailable · ${service}`,
        ruleDescription: 'The remote QA call did not complete. No PASS or FAIL has been inferred.',
        evidenceSummary: data.result,
        affectedProjections: ['ISO', 'CoMET'],
        remediationAction: { label: 'Review runtime connectivity/authentication' },
        sourceProfile: 'NOAA_RECORD_SERVICES',
      };
      setFindings((current) => [finding, ...current]);
      setActiveFindingId(finding.id);
    }
  };

  return (
    <div id="signal-assurance-workspace" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      <header className="px-7 py-5 border-b border-slate-800 bg-[#07101c] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-lg font-semibold text-slate-100">Signal</h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Local preflight, intake suggestions, and actual remote QA observations stay separate. A local rule never becomes a NOAA/OISS PASS.
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
        </div>

        <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-300 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> NOAA Record Services / MetaServer QA doorway</div>
              <div className="mt-1 text-xs text-slate-500">Runs the current ISO projection against the configured remote service endpoint. The exact endpoint/status is captured in the resulting observation.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['validate', 'rubricV2', 'resolver', 'linkcheck'] as QaService[]).map((service) => (
                <button
                  key={service}
                  disabled={qa[service].running}
                  onClick={() => void runQa(service)}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-800/60 text-amber-200 text-xs disabled:opacity-50"
                >
                  {qa[service].running ? `${service}…` : service}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[10px] font-mono">
            {(['validate', 'rubricV2', 'resolver', 'linkcheck'] as QaService[]).map((service) => {
              const result = qa[service].result;
              return (
                <div key={service} className="rounded-lg border border-slate-800 bg-[#050a13] p-2">
                  <div className="text-slate-400">{service}</div>
                  <div className={result ? 'mt-1 text-cyan-300' : 'mt-1 text-slate-600'}>
                    {result ? (result.httpStatus == null ? 'UNAVAILABLE' : `HTTP ${result.httpStatus}`) : 'NOT RUN'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r border-slate-800 bg-[#050a13] min-h-0 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="bg-transparent text-xs text-slate-400 border border-slate-800 rounded-lg px-2.5 py-1.5 outline-none">
              <option value="ALL">All findings</option>
              <option value="ERROR">Errors</option>
              <option value="WARNING">Warnings</option>
              <option value="INTAKE">Intake suggestions</option>
              <option value="QA">Remote QA observations</option>
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
                  {activeFinding.sourceProfile && <span className="text-[10px] font-mono text-slate-500">{activeFinding.sourceProfile}</span>}
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
                {activeFinding.sourceProfile === 'DISCOVERY_INTAKE' ? (
                  <button onClick={() => onSwitchTab('search')} className="px-4 py-2 rounded-lg border border-purple-700/60 text-purple-300">Return to Search / intake</button>
                ) : activeFinding.sourceProfile === 'NOAA_RECORD_SERVICES' ? (
                  <button onClick={() => onSwitchTab('mission')} className="px-4 py-2 rounded-lg border border-amber-700/60 text-amber-300">Review mission field</button>
                ) : activeFinding.remediationAction && !activeFinding.resolved ? (
                  <button onClick={() => handleFix(activeFinding)} className="px-4 py-2 rounded-lg bg-cyan-600 text-slate-950 font-semibold hover:bg-cyan-500 flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Apply remediation
                  </button>
                ) : null}
                <button onClick={() => onSwitchTab('projections')} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900">
                  View affected projections
                </button>
              </section>

              <details className="border-t border-slate-800 pt-6 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-sm text-slate-300">
                  <div>
                    <div>Technical rule and proof context</div>
                    <div className="mt-1 text-xs text-slate-600">Rule IDs, semantic placement audit, source evidence, and remote QA observations</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-2 md:gap-6 text-xs">
                    <div className="text-slate-600">Finding ID</div><div className="text-slate-300 font-mono break-all">{activeFinding.id}</div>
                    <div className="text-slate-600">Rule ID</div><div className="text-slate-300 font-mono break-all">{activeFinding.ruleId || 'UNSPECIFIED'}</div>
                    <div className="text-slate-600">Canonical field</div><div className="text-slate-300 font-mono break-all">{activeFinding.canonicalField}</div>
                    {activeFinding.evidenceRef && <><div className="text-slate-600">Evidence ref</div><div className="text-slate-300 font-mono break-all">{activeFinding.evidenceRef}</div></>}
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
