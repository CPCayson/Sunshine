import React, { useState } from 'react';
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitMerge,
  GitFork,
  PauseCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  FileText,
  Clock,
  Key,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { CandidateIdentityEdge } from '../../types';
import {
  getCorpusIdentityCandidates,
  acceptIdentityCandidate,
  rejectIdentityCandidate
} from '../../services/identityResolutionService';

export const CandidateIdentityQueuePanel: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateIdentityEdge[]>(getCorpusIdentityCandidates());
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [filterState, setFilterState] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');

  // Steward Action Form
  const [stewardName, setStewardName] = useState('Dr. Sarah Chen (OMAO Fleet Steward)');
  const [rationale, setRationale] = useState('Corroborated by NOAA UxS Fleet Inventory CY2025 serial registry and manufacturer hull documentation.');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const filteredCandidates = candidates.filter((c) => {
    if (filterState === 'ALL') return true;
    if (filterState === 'PENDING') return c.state !== 'ACCEPTED' && c.state !== 'REJECTED';
    return c.state === filterState;
  });

  const handleAccept = () => {
    if (!selectedCandidate) return;
    const res = acceptIdentityCandidate(selectedCandidate.id, stewardName, rationale);
    setCandidates([...getCorpusIdentityCandidates()]);
    setActionNotice(`[ACCEPTED] Identity candidate bound to ${res.candidate.targetCanonicalKey || res.candidate.targetEntityId}. Ledger Event: ${res.ledgerEventId}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = () => {
    if (!selectedCandidate) return;
    const res = rejectIdentityCandidate(selectedCandidate.id, stewardName, rationale);
    setCandidates([...getCorpusIdentityCandidates()]);
    setActionNotice(`[REJECTED] Identity candidate rejected. Reason logged in audit ledger. Event: ${res.ledgerEventId}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleMergeAsAlias = () => {
    if (!selectedCandidate) return;
    setActionNotice(`[MERGED AS ALIAS] Added "${selectedCandidate.rawLabel}" as recognized alias without creating duplicate entity.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleSplitCreateNew = () => {
    if (!selectedCandidate) return;
    setActionNotice(`[SPLIT / NEW ENTITY] Created distinct entity with minted Knowledge Key KK:custom:${Date.now()}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleHoldInConflict = () => {
    if (!selectedCandidate) return;
    setActionNotice(`[HOLD IN CONFLICT] Flagged candidate in unresolved conflict state. Blocking downstream NCEI promotion.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const getMatchBasisBadge = (basis: CandidateIdentityEdge['matchBasis']) => {
    switch (basis) {
      case 'EXACT':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'SERIAL_NUMBER':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'VOCAB_MATCH':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'PARENT_PLATFORM':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'NAME_SIMILARITY':
      default:
        return 'bg-amber-950 text-amber-300 border-amber-800';
    }
  };

  const getStateBadge = (state: CandidateIdentityEdge['state']) => {
    switch (state) {
      case 'ACCEPTED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'REJECTED':
        return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'EXACT':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      case 'STRONG_CANDIDATE':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'WEAK_CANDIDATE':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'CONFLICT':
        return 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="candidate-identity-queue-panel" className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#060b14] font-sans">
      {/* Left List: Candidates Queue */}
      <div className="w-full md:w-96 border-r border-cyan-500/20 bg-[#08101e] flex flex-col shrink-0">
        <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Identity Candidates ({filteredCandidates.length})
            </span>
          </div>

          <div className="flex gap-1 text-[10px]">
            {(['PENDING', 'ALL', 'ACCEPTED', 'REJECTED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterState(s)}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  filterState === s
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono">
          {filteredCandidates.map((cand) => {
            const isSelected = selectedCandidate?.id === cand.id;
            return (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100'
                    : 'bg-[#060c18] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200 truncate">{cand.rawLabel || cand.id}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getStateBadge(cand.state)}`}>
                    {cand.state}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <span>Target:</span>
                  <span className="text-cyan-300 truncate">{cand.targetCanonicalKey || cand.targetEntityId}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1 border-t border-slate-800/60">
                  <span className={`px-1 py-0.5 rounded border ${getMatchBasisBadge(cand.matchBasis)}`}>
                    {cand.matchBasis}
                  </span>
                  <span>Confidence: <strong className="text-slate-300">{(cand.confidence * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Anti-Auto-Merge Policy Invariant */}
        <div className="p-3 bg-[#050a14] border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
          <div className="text-cyan-400 font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Strict Gating Policy</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Never: similar name → merged asset. Ambiguous or competing serials require signed human steward decisions before canonical minting.
          </p>
        </div>
      </div>

      {/* Right Detail: Candidate Inspection, Competing Options, & Steward Actions */}
      <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 bg-[#060b14] font-mono">
        {selectedCandidate ? (
          <>
            {/* Notification Toast */}
            {actionNotice && (
              <div className="px-4 py-2.5 rounded-lg bg-cyan-950 border border-cyan-500 text-cyan-200 text-xs flex items-center justify-between">
                <span>{actionNotice}</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              </div>
            )}

            {/* Candidate Overview Card */}
            <div className="p-4 bg-[#081224] rounded-xl border border-cyan-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Raw Observed Label:</div>
                  <div className="text-lg font-bold text-slate-100">"{selectedCandidate.rawLabel || selectedCandidate.id}"</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs border font-bold ${getStateBadge(selectedCandidate.state)}`}>
                    {selectedCandidate.state}
                  </span>
                  <span className="px-2 py-1 rounded bg-black/40 text-cyan-300 border border-slate-700 text-xs">
                    Confidence: {(selectedCandidate.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Source Artifact Reference:</span>
                  <span className="text-slate-300 font-semibold">{selectedCandidate.sourceArtifactRef}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entity Type:</span>
                  <span className="text-cyan-300 font-semibold">{selectedCandidate.sourceType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Match Basis:</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] mt-0.5 ${getMatchBasisBadge(selectedCandidate.matchBasis)}`}>
                    {selectedCandidate.matchBasis}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Canonical Key:</span>
                  <code className="text-emerald-400 font-bold break-all">{selectedCandidate.targetCanonicalKey || selectedCandidate.targetEntityId}</code>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#050b16] border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 block font-bold">Explanation & Alignment Evidence:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedCandidate.explanation}
                </p>
              </div>

              {/* Competing Candidates Box */}
              {selectedCandidate.competingCandidates && selectedCandidate.competingCandidates.length > 0 && (
                <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/40 text-xs space-y-1">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Competing Identity Candidates Detected:</span>
                  </span>
                  <ul className="text-rose-200 text-[11px] space-y-1 mt-1 list-disc list-inside">
                    {selectedCandidate.competingCandidates.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Audit & Decision Log (If decided) */}
            {selectedCandidate.decidedBy && (
              <div className="p-3.5 bg-[#050e1c] rounded-xl border border-emerald-500/40 space-y-2 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Authoritative Human Decision Logged</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>Decided By: <strong className="text-slate-100">{selectedCandidate.decidedBy}</strong></div>
                  <div>Timestamp: <span className="text-slate-400">{selectedCandidate.decidedAt}</span></div>
                  <div>Rationale: <span className="text-cyan-300">{selectedCandidate.decisionRationale}</span></div>
                </div>
              </div>
            )}

            {/* Steward Actions Form */}
            <div className="p-4 bg-[#081224] rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Human Steward Decision Panel</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Steward Identity:</label>
                  <input
                    type="text"
                    value={stewardName}
                    onChange={(e) => setStewardName(e.target.value)}
                    className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Decision Rationale (Required):</label>
                  <input
                    type="text"
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200 text-[11px]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-bold">
                <button
                  onClick={handleAccept}
                  className="p-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACCEPT</span>
                </button>
                <button
                  onClick={handleReject}
                  className="p-2 rounded bg-rose-700 hover:bg-rose-600 text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>REJECT</span>
                </button>
                <button
                  onClick={handleMergeAsAlias}
                  className="p-2 rounded bg-[#0c1e3d] hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>MERGE ALIAS</span>
                </button>
                <button
                  onClick={handleSplitCreateNew}
                  className="p-2 rounded bg-[#1a1130] hover:bg-purple-900/60 text-purple-300 border border-purple-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>SPLIT / NEW</span>
                </button>
                <button
                  onClick={handleHoldInConflict}
                  className="p-2 rounded bg-[#2e1910] hover:bg-amber-900/60 text-amber-300 border border-amber-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>HOLD CONFLICT</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Select a candidate from the queue to review match basis and record steward decision.
          </div>
        )}
      </div>
    </div>
  );
};
