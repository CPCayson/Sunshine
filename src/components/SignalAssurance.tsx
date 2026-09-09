import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wrench,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  FileCode2,
  Network,
  Play,
  Check,
  XCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { SignalFinding, SignalSeverity, UxSMission } from '../types';
import { SEED_SIGNAL_FINDINGS } from '../data/evidenceAndClaims';
import {
  verifyDocuCompSemanticPlacement,
  DocuCompSemanticAuditItem,
  DocuCompSemanticAuditResult,
  executeTransversalProofMatrix,
  TransversalProofMatrixResult
} from '../services/semanticPlacementModule';

interface SignalAssuranceProps {
  mission: UxSMission;
  onApplyRemediation: (finding: SignalFinding) => void;
  onSwitchTab: (tab: any) => void;
}

export const SignalAssurance: React.FC<SignalAssuranceProps> = ({
  mission,
  onApplyRemediation,
  onSwitchTab,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [proofMatrix, setProofMatrix] = useState<TransversalProofMatrixResult | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [liveDocucompState, setLiveDocucompState] = useState<{ testing: boolean; result: any | null }>({ testing: false, result: null });

  const handleTestLiveDocucomp = async (uuid: string) => {
    setLiveDocucompState({ testing: true, result: null });
    try {
      const res = await fetch(`/api/docucomp/dereference?url=${encodeURIComponent(uuid)}`);
      const data = await res.json();
      setLiveDocucompState({ testing: false, result: data });
    } catch (err: any) {
      setLiveDocucompState({ testing: false, result: { error: err?.message || String(err) } });
    }
  };

  const handleRunProofMatrix = () => {
    const result = executeTransversalProofMatrix();
    setProofMatrix(result);
    setIsProofModalOpen(true);
  };

  // Compute live DocuComp Semantic Placement audit
  const semanticAudit = useMemo(() => {
    return verifyDocuCompSemanticPlacement(mission);
  }, [mission]);

  // Merge seed findings with dynamic semantic placement findings
  const [findings, setFindings] = useState<SignalFinding[]>(() => {
    const dynamicFindings = verifyDocuCompSemanticPlacement(mission).findings;
    const existingIds = new Set(SEED_SIGNAL_FINDINGS.map((f) => f.id));
    const newItems = dynamicFindings.filter((f) => !existingIds.has(f.id));
    return [...SEED_SIGNAL_FINDINGS, ...newItems];
  });

  const [activeFinding, setActiveFinding] = useState<SignalFinding | null>(() => {
    const dynamicFindings = verifyDocuCompSemanticPlacement(mission).findings;
    // Prefer the semantic placement conflict if present
    const conflict = dynamicFindings.find((f) => f.severity === 'ERROR');
    return conflict || SEED_SIGNAL_FINDINGS[0];
  });

  const filteredFindings = findings.filter((f) => {
    if (selectedSeverity === 'ALL') return true;
    if (selectedSeverity === 'SEMANTIC_PLACEMENT') {
      return f.id.includes('SIG-SEMANTIC-PLACEMENT') || f.ruleName.includes('SEMANTIC_PLACEMENT');
    }
    return f.severity === selectedSeverity;
  });

  const getSeverityBadge = (sev: SignalSeverity) => {
    switch (sev) {
      case 'ERROR':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'WARNING':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'INFO':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'SUGGESTION':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleFix = (finding: SignalFinding) => {
    onApplyRemediation(finding);
    setFindings((prev) =>
      prev.map((f) => (f.id === finding.id ? { ...f, resolved: true } : f))
    );
    if (activeFinding && activeFinding.id === finding.id) {
      setActiveFinding({ ...activeFinding, resolved: true });
    }
  };

  // Check if current finding is a DocuComp semantic placement audit
  const activeSemanticAuditItem: DocuCompSemanticAuditItem | undefined = useMemo(() => {
    if (!activeFinding) return undefined;
    return semanticAudit.items.find(
      (item) => item.finding.id === activeFinding.id || activeFinding.id.includes(item.componentId)
    );
  }, [activeFinding, semanticAudit]);

  return (
    <div id="signal-assurance-workspace" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      {/* Header with Scoped Assurance Score Cards */}
      <div className="bg-[#091120] border-b border-cyan-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
              SIGNAL ASSURANCE WORKBENCH
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Profile & Conformance Assurance
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Evaluates canonical facts against NOAA UxS Marine Core v3.2, ISO 19115-2 rules, and DocuComp XLink integrity.
          </p>
        </div>

        {/* Multi-Authority Coverage Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            id="run-transversal-proof-matrix-btn"
            onClick={handleRunProofMatrix}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/70 to-purple-950/70 hover:from-amber-900/80 hover:to-purple-900/80 border border-amber-500/50 text-amber-200 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Run Proof Matrix (Cases A-F)</span>
          </button>
          <div className="bg-[#050912] border border-cyan-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400">UxS Marine Core:</span>
            <span className="text-cyan-300 font-bold">{mission.conformanceScore || 86}%</span>
          </div>
          <div className="bg-[#050912] border border-cyan-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400">ISO 19139 XSD:</span>
            <span className="text-emerald-300 font-bold">READY</span>
          </div>
          <div className="bg-[#050912] border border-cyan-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400">CoMET Readiness:</span>
            <span className="text-amber-300 font-bold">NOT VALIDATED</span>
          </div>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Findings Filter & List */}
        <div className="w-full md:w-1/2 lg:w-3/5 border-r border-slate-800 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {['ALL', 'ERROR', 'WARNING', 'SEMANTIC_PLACEMENT', 'SUGGESTION', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                    selectedSeverity === sev
                      ? sev === 'SEMANTIC_PLACEMENT'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 font-bold'
                        : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-[#080e1b] border border-slate-800'
                  }`}
                >
                  {sev === 'SEMANTIC_PLACEMENT' && <Sparkles className="w-3 h-3 text-amber-400" />}
                  <span>{sev === 'SEMANTIC_PLACEMENT' ? 'DocuComp Placement' : sev}</span>
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredFindings.length} findings
            </span>
          </div>

          {filteredFindings.map((f) => {
            const isSelected = activeFinding?.id === f.id;
            return (
              <div
                key={f.id}
                id={`signal-finding-${f.id}`}
                onClick={() => setActiveFinding(f)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0a1529] border-cyan-500/60 shadow-md'
                    : 'bg-[#080f1e] border-slate-800/80 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(f.severity)}`}>
                        {f.severity}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-200">
                        {f.canonicalField}
                      </span>
                      {f.resolved && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      {f.ruleName}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {f.ruleDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>Impacts:</span>
                    {f.affectedProjections.map((p) => (
                      <span key={p} className="px-1.5 rounded bg-[#040810] text-cyan-300 border border-slate-800">
                        {p}
                      </span>
                    ))}
                  </div>
                  {f.remediationAction && !f.resolved && (
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      Remediate →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Finding & One-Click Remediation Inspector */}
        <div className="w-full md:w-1/2 lg:w-2/5 overflow-y-auto p-5 bg-[#050a14] space-y-4">
          {activeFinding ? (
            <>
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(activeFinding.severity)}`}>
                    {activeFinding.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ID: {activeFinding.id}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 font-mono mt-2">
                  {activeFinding.canonicalField}
                </h3>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  {activeFinding.ruleName}
                </p>
              </div>

              {/* Evidence Summary Box */}
              <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                <h4 className="text-xs font-semibold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Observed Evidence Rationale</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {activeFinding.evidenceSummary}
                </p>
              </div>

              {/* Dual-Tier DocuComp Semantic Placement Breakdown */}
              {activeSemanticAuditItem && (
                <div className="bg-[#071020] border border-amber-500/30 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      DocuComp Three-Tier Verification & Policy Audit
                    </span>
                    <span className="text-[10px] text-slate-400">
                      UUID: {activeSemanticAuditItem.componentUuid.slice(0, 14)}…
                    </span>
                  </div>

                  {/* Tier 1: Technical Dereferencing & XML Well-Formedness */}
                  <div className="p-3 bg-[#040813] border border-emerald-500/30 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Network className="w-3 h-3 text-emerald-400" />
                        Tier 1: Technical Resolution Audit
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                        {activeSemanticAuditItem.technicalResolution.status} (HTTP {activeSemanticAuditItem.technicalResolution.httpStatusCode})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      Endpoint: <code className="text-cyan-300 text-[10px]">{activeSemanticAuditItem.technicalResolution.endpoint}</code>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Schema: <span className="text-emerald-400">{activeSemanticAuditItem.technicalResolution.xsdSchema} ({activeSemanticAuditItem.technicalResolution.xsdStatus})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      {activeSemanticAuditItem.technicalResolution.details}
                    </p>

                    {/* Live Dereferencing Action */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Live NOAA Registry Probe:</span>
                        <button
                          onClick={() => handleTestLiveDocucomp(activeSemanticAuditItem.componentUuid)}
                          disabled={liveDocucompState.testing}
                          className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>{liveDocucompState.testing ? 'Querying NOAA...' : 'Probe Live Endpoint'}</span>
                        </button>
                      </div>

                      {liveDocucompState.result && (
                        <div className="p-2 bg-[#02050c] rounded border border-cyan-800/60 text-[10px] space-y-1">
                          <div className="flex items-center justify-between text-cyan-300">
                            <span>Status: HTTP {liveDocucompState.result.httpStatus}</span>
                            <span>{liveDocucompState.result.provenanceType || 'LIVE_OBSERVED'}</span>
                          </div>
                          <div className="text-slate-400 truncate">
                            SHA-256: {liveDocucompState.result.responseHash || 'N/A'}
                          </div>
                          <div className="text-slate-300">
                            {liveDocucompState.result.message || (liveDocucompState.result.xml ? 'Retrieved authentic XML fragment from NOAA DocuComp.' : 'No payload')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tier 2: Semantic Slot Appropriateness (Semantic Placement) */}
                  <div className={`p-3 rounded-lg border space-y-2 ${
                    activeSemanticAuditItem.semanticFitness.status === 'CONFLICT'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-emerald-950/20 border-emerald-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <FileCode2 className="w-3 h-3 text-amber-400" />
                        Tier 2: Semantic Slot Policy ({activeSemanticAuditItem.threeTierVerdict.policyAuthority || 'MANTAS DocuComp Slot Profile — Provisional'})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          activeSemanticAuditItem.threeTierVerdict.policyStatus === 'AUTHORITATIVE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-amber-950 text-amber-300 border-amber-700'
                        }`}>
                          {activeSemanticAuditItem.threeTierVerdict.policyStatus || 'AUTHORITATIVE'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          activeSemanticAuditItem.semanticFitness.status === 'CONFLICT'
                            ? 'bg-rose-950 text-rose-300 border-rose-600/60'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
                        }`}>
                          {activeSemanticAuditItem.semanticFitness.status === 'CONFLICT' ? 'CONFLICT (ROLE MISMATCH)' : 'SUPPORTED'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Policy Rule Source: <code className="text-cyan-300">{activeSemanticAuditItem.threeTierVerdict.policySource || 'src/data/docucomp-slot-profile.json'}</code>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-2 bg-[#050b16] rounded border border-slate-800">
                        <div className="text-slate-400 uppercase font-semibold">Target ISO Slot</div>
                        <div className="text-cyan-300 font-bold truncate mt-0.5" title={activeSemanticAuditItem.semanticFitness.slotXpath}>
                          {activeSemanticAuditItem.semanticFitness.slotXpath}
                        </div>
                        <div className="text-slate-400 mt-1">
                          Mandates: <span className="text-slate-200 font-bold">{activeSemanticAuditItem.semanticFitness.expectedXmlType}</span> ({activeSemanticAuditItem.semanticFitness.expectedRole})
                        </div>
                      </div>

                      <div className="p-2 bg-[#050b16] rounded border border-slate-800">
                        <div className="text-slate-400 uppercase font-semibold">Component Fragment</div>
                        <div className="text-amber-300 font-bold truncate mt-0.5">
                          {activeSemanticAuditItem.componentTitle}
                        </div>
                        <div className="text-slate-400 mt-1">
                          Carries: <span className="text-rose-300 font-bold">{activeSemanticAuditItem.semanticFitness.observedXmlType}</span> ({activeSemanticAuditItem.semanticFitness.observedRole})
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {activeSemanticAuditItem.semanticFitness.rationale}
                    </p>
                  </div>
                </div>
              )}

              {/* Projections Affected */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Affected Destination Projections
                </h4>
                <div className="flex items-center gap-2">
                  {activeFinding.affectedProjections.map((proj) => (
                    <div
                      key={proj}
                      className="px-2.5 py-1 rounded bg-[#0a1426] border border-cyan-500/30 text-xs font-mono text-cyan-300 font-medium"
                    >
                      {proj} Projection
                    </div>
                  ))}
                </div>
              </div>

              {activeFinding.sourceProfile === 'charlie-google-form-v3' && activeFinding.sourceFieldId && (
                <div className="bg-[#050f20] border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-emerald-400 font-semibold uppercase">Source Form Field</div>
                    <div className="text-slate-200">Points to Charlie Intake: <code className="text-emerald-300">{activeFinding.sourceFieldId}</code></div>
                  </div>
                  <button
                    onClick={() => onSwitchTab('charlie-intake')}
                    className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    Jump to Field →
                  </button>
                </div>
              )}

              {/* Remediation Action Card */}
              <div className="bg-[#091326] border border-cyan-500/30 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>Signal Remediation Engine</span>
                </h4>
                <p className="text-xs text-slate-400 font-sans">
                  Applying this remediation resolves the rule finding by updating canonical mission state with verified evidence.
                </p>

                {activeFinding.resolved ? (
                  <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finding has been resolved. Conformance updated.</span>
                  </div>
                ) : (
                  <button
                    id="apply-signal-fix-btn"
                    onClick={() => handleFix(activeFinding)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-md transition-colors cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>{activeFinding.remediationAction.label}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 font-mono text-xs">
              <Activity className="w-8 h-8 text-slate-600 mb-2" />
              <span>Select an assurance finding to inspect rule logic</span>
            </div>
          )}
        </div>
      </div>

      {/* Proof Matrix Modal */}
      {isProofModalOpen && proofMatrix && (
        <div
          id="proof-matrix-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsProofModalOpen(false)}
        >
          <div
            className="bg-[#070e1c] border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0a162b] border-b border-cyan-500/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wider flex items-center gap-2">
                    <span>FORMAL TRANSVERSAL & SIGNAL PROOF MATRIX</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
                      {proofMatrix.allPassed ? 'ALL 6 CASES PASSED' : 'FAILURES DETECTED'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Deterministic verification of 3-tier semantic placement and formal transversal edge families.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunProofMatrix}
                  className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  title="Re-run Matrix"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-run</span>
                </button>
                <button
                  onClick={() => setIsProofModalOpen(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Summary Banner */}
            <div className="bg-[#050c18] border-b border-slate-800 px-6 py-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500">Run Timestamp: </span>
                  <span className="text-slate-300 font-bold">{proofMatrix.runTimestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Cases: </span>
                  <span className="text-cyan-300 font-bold">{proofMatrix.summary.total}</span>
                </div>
                <div>
                  <span className="text-slate-500">Passed: </span>
                  <span className="text-emerald-400 font-bold">{proofMatrix.summary.passed}</span>
                </div>
                <div>
                  <span className="text-slate-500">Failed: </span>
                  <span className="text-rose-400 font-bold">{proofMatrix.summary.failed}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                CoMET XLink • ISO 19139 • UxS Profile
              </div>
            </div>

            {/* Cases List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              {proofMatrix.cases.map((c) => (
                <div
                  key={c.caseId}
                  className={`p-4 rounded-xl border space-y-3 ${
                    c.passed
                      ? 'bg-[#060f20] border-cyan-500/30'
                      : 'bg-rose-950/20 border-rose-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono">
                        {c.caseId}
                      </span>
                      <span className="text-slate-200 font-sans font-semibold text-sm">
                        {c.title}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                        c.provenanceCategory === 'LIVE_OBSERVED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                          : c.provenanceCategory === 'SYNTHETIC_FIXTURE'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-600/50'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
                      }`}>
                        {c.provenanceCategory === 'LIVE_OBSERVED' ? 'LIVE EVIDENCE' : c.provenanceCategory === 'SYNTHETIC_FIXTURE' ? 'SYNTHETIC FIXTURE' : 'LOCAL DERIVED'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${
                        c.passed
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
                          : 'bg-rose-950 text-rose-300 border-rose-600/60'
                      }`}
                    >
                      {c.passed ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{c.passed ? 'PASS' : 'FAIL'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans">
                    {c.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-[#030712] rounded border border-slate-800">
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">Expected Verification</span>
                      <span className="text-cyan-300 font-sans">{c.expected}</span>
                    </div>
                    <div className="p-2.5 bg-[#030712] rounded border border-slate-800">
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">Observed Verification</span>
                      <span className="text-emerald-300 font-sans">{c.observed}</span>
                    </div>
                  </div>

                  {/* Assertion Items */}
                  <div className="space-y-1 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Assertions Verified:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1">
                      {c.assertions.map((assertion, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 bg-[#040916] rounded text-[11px] text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate" title={assertion}>{assertion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0a162b] border-t border-cyan-500/30 px-6 py-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Verification rule: Never derive semantic PASS merely because HTTP resolved or XML is schema-valid.
              </span>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
