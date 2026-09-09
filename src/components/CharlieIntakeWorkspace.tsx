import React, { useState } from 'react';
import {
  CharlieFormSubmission,
  CharlieFormFieldObservation,
  UxSMission,
  SignalFinding,
  CharlieXmlRegressionDiff
} from '../types';
import {
  CHARLIE_FORM_SECTIONS,
  CHARLIE_FORM_RULES,
  SAMPLE_CHARLIE_SUBMISSION_EN2501,
  evaluateCharlieFormSignal,
  compareCharlieXmlWithMantas,
  buildCandidateClaimsFromCharlie
} from '../services/charlieAdapter';
import {
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  RefreshCw,
  UploadCloud,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  Split,
  ChevronRight,
  Database
} from 'lucide-react';

interface CharlieIntakeWorkspaceProps {
  mission: UxSMission;
  onAcceptCandidateClaim: (canonicalPath: string, value: any) => void;
  onAcceptAllCandidates: (updatedMission: Partial<UxSMission>) => void;
  onJumpToSignal?: (ruleId: string) => void;
  targetFieldToHighlight?: string | null;
}

export const CharlieIntakeWorkspace: React.FC<CharlieIntakeWorkspaceProps> = ({
  mission,
  onAcceptCandidateClaim,
  onAcceptAllCandidates,
  onJumpToSignal,
  targetFieldToHighlight
}) => {
  const [submission, setSubmission] = useState<CharlieFormSubmission>(SAMPLE_CHARLIE_SUBMISSION_EN2501);
  const [activeSection, setActiveSection] = useState<string>(CHARLIE_FORM_SECTIONS[0]);
  const [viewMode, setViewMode] = useState<'INTAKE_FORM' | 'XML_REGRESSION' | 'IMPORT_PASTE'>('INTAKE_FORM');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(targetFieldToHighlight || 'platform');
  const [rawPastedData, setRawPastedData] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Field-level Signal findings
  const signalFindings = React.useMemo(() => evaluateCharlieFormSignal(submission), [submission]);

  // XML Regression comparison
  const xmlDiffs = React.useMemo(() => compareCharlieXmlWithMantas(submission, mission), [submission, mission]);

  // Handle direct editing of a form field in MANTA Lens
  const handleFieldChange = (sourceFieldId: string, newValue: any) => {
    setSubmission((prev) => {
      const updatedFields = prev.fields.map((f) => {
        if (f.sourceFieldId === sourceFieldId) {
          return {
            ...f,
            rawValue: newValue,
            state: 'CANDIDATE' as const,
          };
        }
        return f;
      });

      return {
        ...prev,
        originalPayload: {
          ...prev.originalPayload,
          [sourceFieldId]: newValue,
        },
        fields: updatedFields,
      };
    });
  };

  // Import raw JSON/CSV row into Charlie submission
  const handleImportPayload = () => {
    try {
      const parsed = JSON.parse(rawPastedData);
      setSubmission((prev) => {
        const updatedFields = prev.fields.map((f) => {
          if (parsed[f.sourceFieldId] !== undefined) {
            return {
              ...f,
              rawValue: parsed[f.sourceFieldId],
              state: 'CANDIDATE' as const,
            };
          }
          return f;
        });

        return {
          ...prev,
          submissionId: parsed.submissionId || `SUB-IMPORTED-${Date.now().toString().slice(-6)}`,
          observedAt: new Date().toISOString(),
          originalPayload: { ...prev.originalPayload, ...parsed },
          fields: updatedFields,
        };
      });
      setImportStatus('Google Sheet row successfully imported into Charlie Form contract!');
      setViewMode('INTAKE_FORM');
    } catch (err: any) {
      setImportStatus(`Import parse error: ${err.message}`);
    }
  };

  // Apply candidate mapping to accepted UxsMission
  const handleAcceptField = (field: CharlieFormFieldObservation) => {
    if (!field.canonicalCandidatePath) return;

    if (field.canonicalCandidatePath === 'title') {
      onAcceptCandidateClaim('title', field.rawValue);
    } else if (field.canonicalCandidatePath === 'platform.name') {
      onAcceptCandidateClaim('platform.name', field.rawValue);
    } else if (field.canonicalCandidatePath === 'contact.email') {
      onAcceptCandidateClaim('contact.email', field.rawValue);
    } else if (field.canonicalCandidatePath.startsWith('spatialExtent.')) {
      const key = field.canonicalCandidatePath.split('.')[1];
      onAcceptCandidateClaim(`spatialExtent.${key}`, Number(field.rawValue));
    } else {
      onAcceptCandidateClaim(field.canonicalCandidatePath, field.rawValue);
    }
  };

  const currentSectionFields = submission.fields.filter((f) => {
    const rule = CHARLIE_FORM_RULES.find((r) => r.sourceField === f.sourceFieldId);
    return rule?.conceptualSection === activeSection;
  });

  const selectedObservation = submission.fields.find((f) => f.sourceFieldId === selectedFieldId);
  const selectedRule = CHARLIE_FORM_RULES.find((r) => r.sourceField === selectedFieldId);
  const fieldSignal = signalFindings.find((s) => s.sourceFieldId === selectedFieldId);

  return (
    <div id="charlie-intake-workspace" className="flex-1 flex flex-col bg-[#050b16] text-slate-200 overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="bg-[#0a1220] border-b border-cyan-500/25 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100 tracking-wide flex items-center gap-2">
              CHARLIE GOOGLE FORM INTAKE ADAPTER
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                SOURCE PROFILE: charlie-google-form-v3
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Preserves Charlie's 25-column Google Form contract as first-class SourceObservations. Nothing silently overwrites canonical mission truth without human review.
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex bg-[#0d182b] p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('INTAKE_FORM')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewMode === 'INTAKE_FORM'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Intake Workbench
            </button>
            <button
              onClick={() => setViewMode('XML_REGRESSION')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewMode === 'XML_REGRESSION'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Charlie ↔ MANTAS XML Regression
            </button>
            <button
              onClick={() => setViewMode('IMPORT_PASTE')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewMode === 'IMPORT_PASTE'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Import Sheet Row
            </button>
          </div>

          <button
            onClick={() => {
              // Batch accept candidate values
              onAcceptAllCandidates({
                title: submission.originalPayload.title,
                abstract: submission.originalPayload.abstract,
                dateStart: submission.originalPayload.beginDate,
                dateEnd: submission.originalPayload.endDate,
                platform: {
                  ...mission.platform,
                  name: submission.originalPayload.platform,
                },
                contact: {
                  ...mission.contact,
                  email: submission.originalPayload.custodianEmail,
                },
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accept All Candidates</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {viewMode === 'INTAKE_FORM' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Conceptual Sections & Field Matrix */}
          <div className="w-80 border-r border-slate-800/80 bg-[#070e1c] flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-[#091324] text-[11px] font-mono text-slate-400 font-semibold flex items-center justify-between">
              <span>CONCEPTUAL SECTIONS</span>
              <span className="text-emerald-400 font-bold">25 Contract Fields</span>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto">
              {CHARLIE_FORM_SECTIONS.map((sec) => {
                const secFields = submission.fields.filter((f) => {
                  const rule = CHARLIE_FORM_RULES.find((r) => r.sourceField === f.sourceFieldId);
                  return rule?.conceptualSection === sec;
                });
                const hasIssues = secFields.some((f) =>
                  signalFindings.some((sig) => sig.sourceFieldId === f.sourceFieldId)
                );

                return (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between ${
                      activeSection === sec
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/40 shadow-sm'
                        : 'text-slate-400 hover:bg-[#0c1830] hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{sec}</span>
                    <div className="flex items-center gap-1.5">
                      {hasIssues && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      <span className="text-[10px] text-slate-500">
                        {secFields.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Signal Summary for this submission */}
            <div className="mt-auto p-3 border-t border-slate-800 bg-[#060c18]">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Signal Field Verification</span>
                <span className="text-amber-400 font-bold">{signalFindings.length} findings</span>
              </div>
              <div className="space-y-1.5">
                {signalFindings.slice(0, 3).map((sig) => (
                  <div
                    key={sig.id}
                    onClick={() => {
                      if (sig.sourceFieldId) {
                        setSelectedFieldId(sig.sourceFieldId);
                        const rule = CHARLIE_FORM_RULES.find((r) => r.sourceField === sig.sourceFieldId);
                        if (rule) setActiveSection(rule.conceptualSection);
                      }
                    }}
                    className="p-1.5 rounded bg-amber-950/40 border border-amber-800/50 text-[11px] font-mono text-amber-200 cursor-pointer hover:bg-amber-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{sig.sourceFieldId}</span>
                      <span className="text-[9px] uppercase px-1 rounded bg-amber-900 text-amber-300">
                        {sig.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{sig.ruleName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: Field Inspection & Candidate Crosswalk */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#070e1a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <span>{activeSection}</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({currentSectionFields.length} observed fields)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Compare raw Charlie Form submissions with accepted MANTAS canonical truth.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Candidate Ready
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Profile Default
                </span>
              </div>
            </div>

            {/* Field Matrix Cards */}
            <div className="grid grid-cols-1 gap-3">
              {currentSectionFields.map((field) => {
                const rule = CHARLIE_FORM_RULES.find((r) => r.sourceField === field.sourceFieldId);
                const isSelected = selectedFieldId === field.sourceFieldId;
                const fieldSig = signalFindings.find((s) => s.sourceFieldId === field.sourceFieldId);

                return (
                  <div
                    key={field.sourceFieldId}
                    id={`field-card-${field.sourceFieldId}`}
                    onClick={() => setSelectedFieldId(field.sourceFieldId)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0d1930] border-emerald-500/70 shadow-lg'
                        : 'bg-[#091222] border-slate-800 hover:border-slate-700'
                    } ${fieldSig ? 'border-amber-500/50' : ''}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {rule?.sourceLabel || field.sourceFieldId}
                        </span>
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-[#070e1c] text-emerald-300 border border-slate-700">
                          {field.sourceFieldId}
                        </code>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {field.provenanceOrigin}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {fieldSig && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {fieldSig.severity}: {fieldSig.ruleName.slice(0, 22)}...
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptField(field);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Accept Candidate
                        </button>
                      </div>
                    </div>

                    {/* Dual View: Submitter Said vs Canonical Accepted */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 font-mono text-xs">
                      {/* Left: What the Submitter Said */}
                      <div className="p-2.5 rounded-lg bg-[#050b14] border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>CHARLIE INTAKE (OBSERVED)</span>
                          <span className="text-emerald-400">Raw Input</span>
                        </div>
                        <input
                          type="text"
                          value={String(field.rawValue ?? '')}
                          onChange={(e) => handleFieldChange(field.sourceFieldId, e.target.value)}
                          className="w-full bg-[#081220] border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Right: Canonical Candidate Path */}
                      <div className="p-2.5 rounded-lg bg-[#050b14] border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>MANTAS CANONICAL PATH</span>
                          <span className="text-cyan-400">Crosswalk</span>
                        </div>
                        <div className="flex items-center justify-between text-cyan-200">
                          <span className="font-semibold">{field.canonicalCandidatePath || 'UNMAPPED'}</span>
                          <span className="text-[10px] text-slate-400">
                            Transform: {rule?.transform || 'pass-through'}
                          </span>
                        </div>
                        {field.docucompRef && (
                          <div className="mt-1 text-[10px] text-purple-400 truncate flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>DocuComp XLink: {field.docucompRef}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Rosetta Field Inspection & Signal Detail */}
          <div className="w-88 border-l border-slate-800/80 bg-[#070e1c] flex flex-col p-4 font-mono overflow-y-auto">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>FIELD CROSSWALK &amp; SIGNAL</span>
            </div>

            {selectedObservation ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-[#091426] border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Source Field ID</div>
                  <div className="text-emerald-300 font-bold text-sm mt-0.5">{selectedObservation.sourceFieldId}</div>
                  <div className="text-slate-300 mt-1">{selectedRule?.description}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#091426] border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Provenance &amp; Origin</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Origin:</span>
                    <span className="text-slate-200 font-semibold">{selectedObservation.provenanceOrigin}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="text-emerald-400 font-semibold">{selectedObservation.confidence ?? 0.95}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Evidence Ref:</span>
                    <span className="text-slate-300 truncate">{selectedObservation.evidenceRef}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Canonical Target:</span>
                    <span className="text-cyan-300 font-semibold">{selectedObservation.canonicalCandidatePath || 'UNMAPPED'}</span>
                  </div>
                </div>

                {fieldSignal && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 space-y-2 text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{fieldSignal.ruleName}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{fieldSignal.explanation}</p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (fieldSignal.remediationAction?.applyValue) {
                            handleFieldChange(fieldSignal.sourceFieldId!, fieldSignal.remediationAction.applyValue);
                          }
                        }}
                        className="w-full py-1.5 rounded bg-amber-700/70 hover:bg-amber-600 text-white font-semibold text-[11px] transition-colors"
                      >
                        {fieldSignal.remediationAction?.label || 'Apply Remediation'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-[#091426] border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Downstream Projections Affected</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['ISO 19115-2', 'Ocean STAC', 'DCAT-US 3.0', 'OISS', 'CoMET'].map((proj) => (
                      <span key={proj} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {proj}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-10">
                Select a field to inspect its crosswalk mapping and Signal assurance rules.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Charlie XML vs MANTAS XML Regression */}
      {viewMode === 'XML_REGRESSION' && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <Split className="w-4 h-4 text-cyan-400" />
                CHARLIE PROJECTION vs MANTAS PROJECTION (XML REGRESSION)
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Semantic comparison between Charlie's Google Apps Script template output and MANTAS canonical ISO 19115-2 projection.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Same Meaning: 2
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Representation Diff: 2
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Profile Default Diff: 1
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {xmlDiffs.map((diff, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-[#081220] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{diff.elementPath}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      diff.classification === 'SAME_MEANING'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : diff.classification === 'REPRESENTATION_DIFFERENCE'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : diff.classification === 'PROFILE_DEFAULT_DIFFERENCE'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}
                  >
                    {diff.classification}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-[#050b14] border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Charlie Google Form / Apps Script Output
                    </div>
                    <div className="text-slate-200 break-words">{diff.charlieValue}</div>
                  </div>

                  <div className="p-3 rounded bg-[#050b14] border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      MANTAS Canonical Projection Output
                    </div>
                    <div className="text-emerald-300 break-words">{diff.mantasValue}</div>
                  </div>
                </div>

                <div className="text-slate-400 text-[11px] flex items-center justify-between pt-1">
                  <span>{diff.explanation}</span>
                  {diff.citedProfileRef && (
                    <span className="text-purple-400 text-[10px] font-semibold">
                      Cited: {diff.citedProfileRef}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Import Sheet Row */}
      {viewMode === 'IMPORT_PASTE' && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-purple-400" />
              IMPORT GOOGLE SHEET ROW / FORM EXPORT
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Paste a JSON row or export from Charlie's Google Sheet to populate the source intake adapter.
            </p>
          </div>

          <textarea
            value={rawPastedData}
            onChange={(e) => setRawPastedData(e.target.value)}
            placeholder={`{\n  "title": "EN2502 Deep Coral Survey",\n  "platform": "REMUS 620 #6402",\n  "west": -157.2,\n  "east": -156.4,\n  "south": 21.0,\n  "north": 21.8,\n  "custodianEmail": "ncei.info@noaa.gov"\n}`}
            className="w-full h-64 bg-[#070e1c] border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handleImportPayload}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow"
            >
              Parse and Load into Charlie Intake
            </button>

            {importStatus && (
              <span className="text-xs font-mono text-emerald-400 font-semibold">{importStatus}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
