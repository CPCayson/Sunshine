import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Fingerprint, Key, ShieldAlert, XCircle } from 'lucide-react';
import { VERIFIED_NOAA_UXS_CORPUS, buildKnowledgeKeyCandidate } from '../../data/verifiedNoaaCorpus';
import { appendLedgerEvent } from '../../services/ledgerService';

interface LocalDecision {
  state: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  steward?: string;
  rationale?: string;
  ledgerEventId?: string;
}

export const CandidateIdentityQueuePanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState(VERIFIED_NOAA_UXS_CORPUS[0]?.id || '');
  const [decisions, setDecisions] = useState<Record<string, LocalDecision>>({});
  const [steward, setSteward] = useState('Human Data Steward');
  const [rationale, setRationale] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');

  const selected = VERIFIED_NOAA_UXS_CORPUS.find((record) => record.id === selectedId) || VERIFIED_NOAA_UXS_CORPUS[0];
  const visible = useMemo(() => VERIFIED_NOAA_UXS_CORPUS.filter((record) => {
    const state = decisions[record.id]?.state || 'PENDING';
    return filter === 'ALL' || state === filter;
  }), [decisions, filter]);

  const recordDecision = (state: 'ACCEPTED' | 'REJECTED') => {
    if (!selected || !rationale.trim()) return;
    const key = buildKnowledgeKeyCandidate(selected);
    const event = appendLedgerEvent({
      type: state === 'ACCEPTED' ? 'PROVENANCE_MINTED' : 'CLAIM_RESOLVED',
      message: `[CORPUS IDENTITY ${state}] ${selected.sourceRef} → ${key}. This decision does not mutate UxsMission automatically.`,
      sourceRef: selected.sourceRef,
      claimId: `identity:${selected.id}`,
      diff: {
        sourceRecord: selected.sourceRef,
        candidateKnowledgeKey: key,
        state,
        steward,
        rationale,
        provenanceType: selected.provenanceType,
      },
    });
    setDecisions((prev) => ({
      ...prev,
      [selected.id]: { state, steward, rationale, ledgerEventId: event.id },
    }));
  };

  if (!selected) return <div className="p-6 text-slate-500">No source-backed identity candidates loaded.</div>;
  const selectedDecision = decisions[selected.id] || { state: 'PENDING' as const };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#060b14] text-slate-200 font-mono text-xs">
      <aside className="w-full md:w-96 border-r border-slate-800 bg-[#08101e] flex flex-col">
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-wider">SOURCE-BACKED IDENTITY CANDIDATES</span>
          </div>
          <div className="flex gap-1">
            {(['PENDING', 'ALL', 'ACCEPTED', 'REJECTED'] as const).map((state) => (
              <button key={state} onClick={() => setFilter(state)} className={`px-2 py-1 rounded border text-[10px] ${filter === state ? 'border-cyan-600 bg-cyan-950/40 text-cyan-300' : 'border-slate-800 text-slate-500'}`}>
                {state}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-2">
          {visible.map((record) => {
            const decision = decisions[record.id]?.state || 'PENDING';
            return (
              <button key={record.id} onClick={() => setSelectedId(record.id)} className={`w-full text-left p-3 rounded-lg border ${selected.id === record.id ? 'border-cyan-600/60 bg-cyan-950/20' : 'border-slate-800 bg-[#060c18]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-100">{record.manufacturer} {record.model}</div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${decision === 'ACCEPTED' ? 'text-emerald-300 border-emerald-700' : decision === 'REJECTED' ? 'text-rose-300 border-rose-700' : 'text-amber-300 border-amber-700'}`}>{decision}</span>
                </div>
                <div className="mt-1 text-slate-500">{record.serialOrIdentifier || record.cdNumber || 'identifier pending'} · {record.sourceRef}</div>
                <div className="mt-2 text-[10px] text-cyan-300 break-all">{buildKnowledgeKeyCandidate(record)}</div>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 flex gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Legacy seeded identity candidates are quarantined. Similar names never auto-merge.</span>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#081224] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-500">SOURCE OBSERVATION</div>
              <div className="text-lg font-bold text-slate-100">{selected.manufacturer} {selected.model} {selected.serialOrIdentifier ? `#${selected.serialOrIdentifier}` : ''}</div>
              <div className="mt-1 text-slate-400">{selected.sourceRef} · {selected.provenanceType}</div>
            </div>
            <span className="px-2 py-1 rounded border border-slate-700 text-slate-300">{selected.identityState}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Detail label="Identity basis" value={selected.identityBasis} />
            <Detail label="Source confidence" value={`${Math.round(selected.confidence * 100)}%`} />
            <Detail label="External identifier" value={selected.serialOrIdentifier || selected.cdNumber || 'UNKNOWN'} />
            <Detail label="Candidate Knowledge Key" value={buildKnowledgeKeyCandidate(selected)} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-700/30 bg-amber-950/10 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <div className="text-slate-400 leading-relaxed">
            Accepting this candidate records a human identity-binding decision and ledger event. It does <strong className="text-slate-200">not</strong> create deployment, payload, dataset, OISS, archive, or discovery claims, and it does not silently mutate the current mission.
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c] space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-100"><Key className="w-4 h-4 text-cyan-400" />HUMAN DECISION</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-slate-500">Steward</span>
              <input value={steward} onChange={(e) => setSteward(e.target.value)} className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200" />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">Rationale (required)</span>
              <input value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Why should these identities be bound or kept separate?" className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200" />
            </label>
          </div>
          <div className="flex gap-2">
            <button disabled={!rationale.trim()} onClick={() => recordDecision('ACCEPTED')} className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center gap-2 font-bold"><CheckCircle2 className="w-4 h-4" />ACCEPT BINDING</button>
            <button disabled={!rationale.trim()} onClick={() => recordDecision('REJECTED')} className="px-3 py-2 rounded bg-rose-800 hover:bg-rose-700 disabled:opacity-40 text-white flex items-center gap-2 font-bold"><XCircle className="w-4 h-4" />KEEP SEPARATE</button>
          </div>
          {selectedDecision.ledgerEventId && (
            <div className="text-[10px] text-slate-400">Decision: <span className="text-cyan-300">{selectedDecision.state}</span> · Ledger event: <span className="text-purple-300">{selectedDecision.ledgerEventId}</span></div>
          )}
        </div>
      </main>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-lg border border-slate-800 bg-[#050a14] min-w-0">
    <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className="mt-1 text-slate-200 break-all">{value}</div>
  </div>
);
