import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Database, ExternalLink, ShieldCheck } from 'lucide-react';
import { UxSMission } from '../types';
import {
  DiscoveryIntakeDraft,
  IntakeSuggestion,
  loadDiscoveryIntakeDraft,
} from '../services/searchabilityService';

interface DiscoveryIntakeWorkspaceProps {
  mission: UxSMission;
  onAcceptField: (path: string, value: any) => void;
  onAcceptAll: (candidate: DiscoveryIntakeDraft['candidate']) => void;
  onOpenSignal: () => void;
  onBackToSearch: () => void;
}

function pretty(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

const authorityClass = (authority: IntakeSuggestion['authority']) => {
  if (authority === 'GCMD') return 'border-emerald-800/60 bg-emerald-950/20 text-emerald-300';
  if (authority === 'METASERVER') return 'border-amber-800/60 bg-amber-950/20 text-amber-300';
  return 'border-purple-800/60 bg-purple-950/20 text-purple-300';
};

export const DiscoveryIntakeWorkspace: React.FC<DiscoveryIntakeWorkspaceProps> = ({
  mission,
  onAcceptField,
  onAcceptAll,
  onOpenSignal,
  onBackToSearch,
}) => {
  const [draft] = useState<DiscoveryIntakeDraft | null>(() => loadDiscoveryIntakeDraft());
  const [acceptedPaths, setAcceptedPaths] = useState<Set<string>>(() => new Set());

  const fieldRows = useMemo(() => {
    if (!draft) return [];
    return draft.evidence.filter((item, index, all) => all.findIndex((other) => other.targetPath === item.targetPath) === index);
  }, [draft]);

  if (!draft) {
    return (
      <div className="flex-1 bg-[#060b14] text-slate-200 flex items-center justify-center p-8">
        <div className="max-w-xl rounded-2xl border border-slate-800 bg-[#08101d] p-8 text-center">
          <Database className="w-8 h-8 text-slate-500 mx-auto" />
          <h2 className="mt-4 text-lg font-semibold">No discovery intake is open</h2>
          <p className="mt-2 text-sm text-slate-500">Import a OneStop, ERDDAP, or read-only CoMET context record from Search first.</p>
          <button onClick={onBackToSearch} className="mt-5 px-4 py-2 rounded-lg border border-cyan-700/60 text-cyan-300">Back to Search</button>
        </div>
      </div>
    );
  }

  const acceptPath = (path: string, value: any) => {
    onAcceptField(path, value);
    setAcceptedPaths((current) => new Set([...current, path]));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden">
      <header className="px-6 py-5 border-b border-slate-800 bg-[#07101c]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
              <ShieldCheck className="w-4 h-4" /> Discovery intake · DRAFT_RECONCILE
            </div>
            <h2 className="mt-2 text-xl font-semibold">{draft.sourceSnapshot.title}</h2>
            <div className="mt-1 text-xs font-mono text-slate-500">
              {draft.source.system} · {draft.source.identifier || draft.source.id}
              {draft.source.recordGroup ? ` · RG ${draft.source.recordGroup}` : ''}
            </div>
          </div>
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/15 px-4 py-3 max-w-md">
            <div className="flex items-start gap-2 text-amber-200 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Canonical unchanged.</strong> Import populated a reconciliation draft only. Accept fields explicitly before they modify the working UxsMission.</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] overflow-hidden">
        <main className="overflow-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Candidate fields</h3>
              <p className="text-xs text-slate-500 mt-1">Observed source values mapped into UxsMission-shaped candidates.</p>
            </div>
            <button
              onClick={() => onAcceptAll(draft.candidate)}
              className="px-3 py-2 rounded-lg bg-cyan-600 text-slate-950 text-sm font-semibold hover:bg-cyan-500"
            >
              Accept all candidate fields
            </button>
          </div>

          {fieldRows.map((row) => {
            const accepted = acceptedPaths.has(row.targetPath);
            return (
              <section key={row.targetPath} className="rounded-xl border border-slate-800 bg-[#08101d] p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono text-cyan-400">{row.targetPath}</div>
                    <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap break-words">{pretty(row.proposedValue)}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-400">{row.transform}</span>
                      <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-400">{row.authority}</span>
                      <span className="px-2 py-0.5 rounded border border-slate-800 text-slate-600">{row.sourcePath}</span>
                    </div>
                  </div>
                  <button
                    disabled={accepted}
                    onClick={() => acceptPath(row.targetPath, row.proposedValue)}
                    className="px-3 py-1.5 rounded-lg border border-cyan-700/60 text-cyan-300 text-xs disabled:opacity-50"
                  >
                    {accepted ? 'Accepted' : 'Accept field'}
                  </button>
                </div>
              </section>
            );
          })}
        </main>

        <aside className="border-l border-slate-800 bg-[#050a13] overflow-auto p-5 space-y-5">
          <section>
            <h3 className="font-semibold">Crosswalk suggestions</h3>
            <p className="text-xs text-slate-500 mt-1">Vocabulary and local semantic suggestions remain proposals until accepted.</p>
            <div className="mt-3 space-y-2">
              {draft.suggestions.length === 0 && <div className="text-sm text-slate-600">No suggestions were generated from this result.</div>}
              {draft.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-xl border border-slate-800 bg-[#08101d] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-slate-300">{suggestion.targetPath}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${authorityClass(suggestion.authority)}`}>{suggestion.authority}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-300">{suggestion.explanation}</div>
                  {suggestion.proposed != null && <div className="mt-2 text-xs font-mono text-cyan-300 whitespace-pre-wrap">{pretty(suggestion.proposed)}</div>}
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-800 pt-5">
            <h3 className="font-semibold">Validation doorway</h3>
            <p className="mt-1 text-xs text-slate-500">Signal combines local preflight with any real NOAA Record Services / MetaServer observations you explicitly run. It does not manufacture a PASS.</p>
            <button onClick={onOpenSignal} className="mt-3 w-full px-4 py-2.5 rounded-lg border border-amber-700/60 text-amber-200 flex items-center justify-center gap-2">
              Open Signal / QA <ArrowRight className="w-4 h-4" />
            </button>
          </section>

          <section className="border-t border-slate-800 pt-5 text-xs font-mono text-slate-500 space-y-2">
            <div className="flex justify-between"><span>Evidence rows</span><span className="text-slate-300">{draft.evidence.length}</span></div>
            <div className="flex justify-between"><span>Suggestions</span><span className="text-slate-300">{draft.suggestions.length}</span></div>
            <div className="flex justify-between"><span>Canonical changed on import</span><span className="text-emerald-400">NO</span></div>
            {draft.source.url && (
              <a href={draft.source.url} target="_blank" rel="noreferrer" className="mt-3 text-cyan-400 flex items-center gap-1 hover:text-cyan-300">
                Open source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
