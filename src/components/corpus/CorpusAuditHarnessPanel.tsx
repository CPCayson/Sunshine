import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Search,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Code,
  Sparkles
} from 'lucide-react';
import { UxSMission, CorpusCapabilityQuery, CorpusCapabilityQueryResult } from '../../types';
import {
  runCorpusInvariantTestSuite,
  CorpusInvariantTestSuiteReport,
  InvariantTestResult
} from '../../services/corpusInvariantTests';
import {
  getCorpusDeterministicQueries,
  executeCorpusCapabilityQuery
} from '../../services/identityResolutionService';

interface CorpusAuditHarnessPanelProps {
  mission: UxSMission;
}

export const CorpusAuditHarnessPanel: React.FC<CorpusAuditHarnessPanelProps> = ({ mission }) => {
  const [activeTab, setActiveTab] = useState<'invariants' | 'queries'>('invariants');
  const [report, setReport] = useState<CorpusInvariantTestSuiteReport>(() => runCorpusInvariantTestSuite(mission));
  const [selectedInvariant, setSelectedInvariant] = useState<InvariantTestResult | null>(report.tests[0] || null);

  // Queries state
  const queries = getCorpusDeterministicQueries();
  const [selectedQueryId, setSelectedQueryId] = useState<string>(queries[0]?.id || '');
  const [lastExecutedTimestamp, setLastExecutedTimestamp] = useState<string>(new Date().toISOString());

  const handleRunInvariants = () => {
    const newReport = runCorpusInvariantTestSuite(mission);
    setReport(newReport);
    setSelectedInvariant(newReport.tests.find((t) => t.id === selectedInvariant?.id) || newReport.tests[0]);
  };

  const handleRunQueries = () => {
    setLastExecutedTimestamp(new Date().toISOString());
  };

  const selectedQuery = executeCorpusCapabilityQuery(selectedQueryId) || queries[0];

  return (
    <div id="corpus-audit-harness-panel" className="flex-1 flex flex-col overflow-hidden bg-[#060b14] font-mono text-xs">
      {/* Harness Control Header */}
      <div className="p-4 bg-[#081224] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              CORPUS AUDIT & INVARIANT VERIFICATION HARNESS
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic verification suite enforcing strict capability predicates, uncollapsible entity levels, and explainable query paths.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher: 15 Invariants vs 9 Capability Queries */}
          <div className="flex items-center bg-[#050912] border border-cyan-500/20 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('invariants')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'invariants'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              15 Invariants ({report.passCount}/{report.tests.length})
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'queries'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              9 Capability Queries ({queries.length})
            </button>
          </div>

          <button
            onClick={activeTab === 'invariants' ? handleRunInvariants : handleRunQueries}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Re-Run Suite</span>
          </button>
        </div>
      </div>

      {/* Main Suite Views */}
      {activeTab === 'invariants' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Invariant List */}
          <div className="w-full md:w-96 border-r border-cyan-500/20 bg-[#08101e] flex flex-col shrink-0">
            <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-bold uppercase">Suite Invariants</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {report.passCount} of {report.tests.length} Passed
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {report.tests.map((test) => {
                const isSelected = selectedInvariant?.id === test.id;
                return (
                  <div
                    key={test.id}
                    onClick={() => setSelectedInvariant(test)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100'
                        : 'bg-[#060c18] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200 truncate">{test.id}</span>
                      {test.passed ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-400" /> FAIL
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {test.statement}
                    </div>
                    <div className="text-[10px] text-cyan-400 mt-1">Category: {test.category}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Invariant Inspection */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#060b14]">
            {selectedInvariant ? (
              <div className="p-4 bg-[#081224] rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <div className="text-[10px] text-slate-500">INVARIANT IDENTIFIER:</div>
                    <div className="text-base font-bold text-slate-100">{selectedInvariant.id}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs border font-bold flex items-center gap-1 ${
                    selectedInvariant.passed
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}>
                    {selectedInvariant.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {selectedInvariant.passed ? 'VERIFIED PASSED' : 'ASSERTION FAILED'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Formal Rule Statement:</span>
                  <div className="p-2.5 bg-[#050b16] rounded border border-slate-800 text-slate-200 text-xs">
                    {selectedInvariant.statement}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Explanation / Architectural Invariant:</span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedInvariant.explanation}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Observed Graph State / Boundary Assertions:</span>
                  <pre className="p-3 bg-black/50 rounded-lg border border-slate-800 text-cyan-300 text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedInvariant.observedData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Select an invariant test to inspect details.</div>
            )}
          </div>
        </div>
      ) : (
        /* 9 CAPABILITY QUERIES RUNNER */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Queries List */}
          <div className="w-full md:w-96 border-r border-cyan-500/20 bg-[#08101e] flex flex-col shrink-0">
            <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-bold uppercase">Deterministic Capability Queries</span>
              <span className="text-cyan-400 font-mono">9 Tests</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {queries.map((q) => {
                const isSelected = selectedQueryId === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQueryId(q.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100'
                        : 'bg-[#060c18] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200">{q.id}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        RESOLVED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {q.question}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
                      Category: <span className="text-cyan-400">{q.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Query Execution Inspection */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#060b14]">
            {selectedQuery ? (
              <div className="p-4 bg-[#081224] rounded-xl border border-cyan-500/30 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <div className="text-[10px] text-slate-500 uppercase">Deterministic Query Definition:</div>
                  <div className="text-base font-bold text-slate-100">{selectedQuery.question}</div>
                  <div className="text-[11px] text-cyan-400 mt-1">Category: {selectedQuery.category}</div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Traversal Rationale & Multi-Hop Rule:</span>
                  <div className="p-2.5 bg-[#050b16] rounded border border-slate-800 text-cyan-300 text-xs leading-relaxed">
                    {selectedQuery.rationale}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] mb-2">Resolved Grounded Results ({selectedQuery.results.length}):</span>
                  <div className="space-y-2">
                    {selectedQuery.results.map((res, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#050b16] rounded-lg border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-200">{res.title}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                              {res.maturity}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                              {res.provenanceType}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400">{res.subtitle}</div>

                        <div>
                          <div className="text-[10px] text-slate-500">Explainable Traversal Path:</div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {res.explanationPath.map((step, sIdx) => (
                              <React.Fragment key={sIdx}>
                                <span className="px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-800 text-[10px]">
                                  {step}
                                </span>
                                {sIdx < res.explanationPath.length - 1 && (
                                  <span className="text-cyan-500 text-[10px]">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500">Supporting Evidence References:</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {res.evidenceRefs.map((ref, rIdx) => (
                              <span key={rIdx} className="px-1.5 py-0.5 rounded bg-black/60 text-emerald-400 border border-slate-800 text-[10px]">
                                {ref}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Select a capability query to inspect its traversal.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
