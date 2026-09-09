import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Info,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { FederatedSearchResult, UxSMission } from '../types';
import {
  RankedDiscoveryHit,
  SearchabilityResponse,
  buildDiscoveryIntakeDraft,
  discoveryHitToFederatedResult,
  saveDiscoveryIntakeDraft,
  searchSearchability,
} from '../services/searchabilityService';

interface MantasSearchProps {
  currentMission: UxSMission;
  onPullAsEvidence: (result: FederatedSearchResult) => void;
  onSelectAsMission: (mission: Partial<UxSMission>) => void;
  onSwitchTab: (tab: any) => void;
}

const tierLabel: Record<RankedDiscoveryHit['matchTier'], string> = {
  EXACT_ID: 'EXACT ID',
  EXACT_PLATFORM: 'EXACT PLATFORM',
  EXACT_TITLE: 'EXACT TITLE',
  GCMD_EXACT: 'GCMD EXACT',
  GCMD_RELATED: 'GCMD RELATED',
  LOCAL_SEMANTIC: 'LOCAL SEMANTIC',
  SUMMARY_ONLY: 'SUMMARY',
};

const sourceClass = (source: RankedDiscoveryHit['source']) => {
  if (source === 'OneStop') return 'border-emerald-800/60 bg-emerald-950/20 text-emerald-300';
  if (source === 'ERDDAP') return 'border-sky-800/60 bg-sky-950/20 text-sky-300';
  return 'border-blue-800/60 bg-blue-950/20 text-blue-300';
};

export const MantasSearch: React.FC<MantasSearchProps> = ({
  currentMission,
  onPullAsEvidence,
  onSwitchTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('remus');
  const [response, setResponse] = useState<SearchabilityResponse | null>(null);
  const [selected, setSelected] = useState<RankedDiscoveryHit | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setNotice(null);
    try {
      const result = await searchSearchability(q);
      setResponse(result);
      setSelected(result.hits[0] || result.cometContext[0] || null);
    } catch (error: any) {
      setNotice(error?.message || 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    void runSearch();
    // Initial pilot search intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedDiscovery = useMemo(() => {
    return {
      oneStop: response?.hits.filter((hit) => hit.source === 'OneStop') || [],
      erddap: response?.hits.filter((hit) => hit.source === 'ERDDAP') || [],
      cometPrimary: response?.cometContext.filter((hit) => hit.recordGroupScope === 'MANTAS_PRIMARY') || [],
      cometOther: response?.cometContext.filter((hit) => hit.recordGroupScope !== 'MANTAS_PRIMARY') || [],
    };
  }, [response]);

  const importHit = (hit: RankedDiscoveryHit) => {
    const draft = buildDiscoveryIntakeDraft(hit);
    saveDiscoveryIntakeDraft(draft);
    onPullAsEvidence(discoveryHitToFederatedResult(hit));
    setNotice(`Imported ${hit.source} result into a reconciliation draft. Canonical mission was not changed.`);
    onSwitchTab('discovery-intake');
  };

  const pullEvidence = (hit: RankedDiscoveryHit) => {
    onPullAsEvidence(discoveryHitToFederatedResult(hit));
    setNotice(`Pulled ${hit.source} observation into Evidence. Canonical mission was not changed.`);
  };

  const renderHit = (hit: RankedDiscoveryHit, mode: 'DISCOVERY' | 'CONTEXT') => (
    <button
      key={hit.id}
      onClick={() => setSelected(hit)}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${selected?.id === hit.id ? 'border-cyan-600/60 bg-cyan-950/10' : 'border-slate-800 bg-[#08101d] hover:border-slate-700'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${sourceClass(hit.source)}`}>{hit.source}</span>
            {mode === 'DISCOVERY' && <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-800/60 text-cyan-300">#{hit.rankInSource}</span>}
            {mode === 'DISCOVERY' && <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700 text-slate-400">{tierLabel[hit.matchTier]}</span>}
            {mode === 'CONTEXT' && <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700 text-slate-400">READ ONLY CONTEXT</span>}
          </div>
          <div className="mt-2 font-medium text-slate-100">{hit.title}</div>
          {hit.subtitle && <div className="mt-1 text-xs font-mono text-slate-500">{hit.subtitle}</div>}
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
            {hit.platform && <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300">Platform: {hit.platform}</span>}
            {hit.gcmdPlatforms.slice(0, 2).map((term) => <span key={term} className="px-2 py-0.5 rounded bg-emerald-950/20 text-emerald-300">GCMD · {term}</span>)}
            {hit.gcmdInstruments.slice(0, 2).map((term) => <span key={term} className="px-2 py-0.5 rounded bg-emerald-950/20 text-emerald-300">GCMD · {term}</span>)}
          </div>
          {mode === 'DISCOVERY' && hit.rankReasons.length > 0 && (
            <div className="mt-3 text-xs text-slate-500">
              Why #{hit.rankInSource}: {hit.rankReasons.slice(0, 3).map((reason) => reason.label).join(' · ')}
            </div>
          )}
        </div>
        {mode === 'DISCOVERY' && <div className="text-xl font-semibold text-cyan-300 tabular-nums">{hit.localScore}</div>}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-mono text-slate-600">{hit.provenanceType}</div>
        <div className="flex gap-2">
          <span
            onClick={(event) => { event.stopPropagation(); pullEvidence(hit); }}
            className="px-2.5 py-1.5 rounded border border-slate-700 text-xs text-slate-300 hover:border-cyan-700 cursor-pointer"
          >
            Pull evidence
          </span>
          <span
            onClick={(event) => { event.stopPropagation(); importHit(hit); }}
            className="px-2.5 py-1.5 rounded bg-cyan-600 text-slate-950 text-xs font-semibold hover:bg-cyan-500 cursor-pointer"
          >
            {mode === 'CONTEXT' ? 'Use as evidence draft' : 'Import'}
          </span>
        </div>
      </div>
    </button>
  );

  const oneStopLane = response?.lanes.find((lane) => lane.source === 'OneStop');
  const erddapLane = response?.lanes.find((lane) => lane.source === 'ERDDAP');
  const cometLane = response?.lanes.find((lane) => lane.source === 'CoMET');
  const threddsLane = response?.lanes.find((lane) => lane.source === 'THREDDS');

  return (
    <div id="mantas-search-shell" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden">
      <header className="px-6 py-5 border-b border-slate-800 bg-[#07101c] space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider"><Search className="w-4 h-4" /> Searchability</div>
          <h2 className="mt-2 text-xl font-semibold">Find evidence. Rank it. Reconcile before acceptance.</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-3xl">OneStop and PMEL ERDDAP are discovery lanes. CoMET is workspace context. STAC below is a local projection of the accepted mission. DocuComp/GCMD enrich meaning; they are not discovery authorities.</p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void runSearch(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="REMUS, TPOS, EX2102, Saildrone..."
              className="w-full rounded-xl border border-slate-700 bg-[#050a13] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-600"
            />
          </div>
          <button disabled={isSearching} className="px-4 py-2.5 rounded-xl bg-cyan-600 text-slate-950 font-semibold disabled:opacity-50">{isSearching ? 'Searching…' : 'Search'}</button>
        </form>

        {response?.queryCrosswalk.length ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-500">LOCAL semantic expansion:</span>
            {response.queryCrosswalk.map((item) => <span key={item.label} className="px-2 py-0.5 rounded border border-purple-800/60 text-purple-300">{item.label}</span>)}
            <span className="text-slate-600">Not GCMD unless explicitly labeled GCMD.</span>
          </div>
        ) : null}

        <div className="rounded-lg border border-cyan-900/50 bg-cyan-950/10 px-3 py-2 text-[11px] font-mono text-cyan-200 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Import creates a <strong>DRAFT_RECONCILE</strong> intake and source evidence. It does not silently write canonical mission meaning.</span>
        </div>
        {notice && <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/10 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}
      </header>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] overflow-hidden">
        <main className="overflow-auto p-5 space-y-7">
          <section>
            <div className="flex items-center justify-between mb-3">
              <div><h3 className="font-semibold">OneStop · discovery</h3><div className="text-xs text-slate-600 mt-1">{oneStopLane?.message || 'Not searched yet.'}</div></div>
              <span className="text-xs font-mono text-slate-500">{groupedDiscovery.oneStop.length} hits</span>
            </div>
            <div className="space-y-2">{groupedDiscovery.oneStop.map((hit) => renderHit(hit, 'DISCOVERY'))}</div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <div><h3 className="font-semibold">PMEL ERDDAP · discovery</h3><div className="text-xs text-slate-600 mt-1">{erddapLane?.message || 'Not searched yet.'}</div></div>
              <span className="text-xs font-mono text-slate-500">{groupedDiscovery.erddap.length} hits</span>
            </div>
            {groupedDiscovery.erddap.length === 0 ? <div className="rounded-xl border border-slate-800 bg-[#08101d] p-4 text-sm text-slate-500">Honest empty is valid. No generic UxS result is inserted when ERDDAP has no match.</div> : <div className="space-y-2">{groupedDiscovery.erddap.map((hit) => renderHit(hit, 'DISCOVERY'))}</div>}
          </section>

          <section>
            <div className="mb-3"><h3 className="font-semibold">CoMET · workspace context</h3><div className="text-xs text-slate-600 mt-1">{cometLane?.message || 'Not searched yet.'}</div></div>
            {groupedDiscovery.cometPrimary.length > 0 && <div className="mb-4"><div className="text-xs font-mono text-cyan-400 mb-2">MY MANTA / UxS RECORD GROUP</div><div className="space-y-2">{groupedDiscovery.cometPrimary.map((hit) => renderHit(hit, 'CONTEXT'))}</div></div>}
            {groupedDiscovery.cometOther.length > 0 && <div><div className="text-xs font-mono text-slate-500 mb-2">OTHER RECORD GROUPS · READ ONLY</div><div className="space-y-2">{groupedDiscovery.cometOther.map((hit) => renderHit(hit, 'CONTEXT'))}</div></div>}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-purple-900/50 bg-purple-950/10 p-4">
              <div className="text-xs font-mono text-purple-300">LOCAL STAC PROJECTION</div>
              <div className="mt-2 font-medium">{currentMission.title}</div>
              <div className="mt-1 text-xs text-slate-500">Projected from the accepted working mission. This is not an external STAC API hit.</div>
              <button onClick={() => onSwitchTab('projections')} className="mt-3 text-xs text-purple-300 underline">Inspect projection</button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#08101d] p-4">
              <div className="text-xs font-mono text-slate-400">THREDDS · COMPARE ONLY</div>
              <div className="mt-2 text-sm text-slate-500">{threddsLane?.message || 'No catalog configured.'}</div>
            </div>
          </section>
        </main>

        <aside className="border-l border-slate-800 bg-[#050a13] overflow-auto p-5">
          {selected ? (
            <div className="space-y-5">
              <section>
                <div className="flex items-center gap-2"><span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${sourceClass(selected.source)}`}>{selected.source}</span><span className="text-[9px] font-mono text-slate-600">{selected.provenanceType}</span></div>
                <h3 className="mt-3 text-lg font-semibold">{selected.title}</h3>
                {selected.description && <p className="mt-3 text-sm leading-6 text-slate-400">{selected.description}</p>}
              </section>

              <section className="border-t border-slate-800 pt-5">
                <div className="text-xs uppercase tracking-wider text-slate-600">Why this rank</div>
                <div className="mt-3 space-y-2">
                  {selected.rankReasons.map((reason) => <div key={reason.code} className="flex justify-between gap-3 text-xs"><span className={reason.authority === 'GCMD' ? 'text-emerald-300' : reason.authority === 'LOCAL' ? 'text-purple-300' : 'text-slate-300'}>{reason.label}</span><span className="font-mono text-slate-500">+{reason.points}</span></div>)}
                </div>
              </section>

              <section className="border-t border-slate-800 pt-5">
                <div className="text-xs uppercase tracking-wider text-slate-600">Crosswalk evidence</div>
                <div className="mt-3 space-y-2">
                  {selected.crosswalkEvidence.length === 0 && <div className="text-sm text-slate-600">No crosswalk evidence used.</div>}
                  {selected.crosswalkEvidence.map((item, index) => <div key={`${item.label}-${index}`} className="rounded-lg border border-slate-800 p-3"><div className="flex justify-between gap-2"><span className="text-sm text-slate-300">{item.label}</span><span className={item.authority === 'GCMD' ? 'text-emerald-300 text-[10px]' : 'text-purple-300 text-[10px]'}>{item.authority}</span></div><div className="mt-1 text-[10px] font-mono text-slate-600">{item.kind} · {item.relation}</div></div>)}
                </div>
              </section>

              <section className="border-t border-slate-800 pt-5 flex gap-2">
                <button onClick={() => pullEvidence(selected)} className="flex-1 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Evidence</button>
                <button onClick={() => importHit(selected)} className="flex-1 px-3 py-2 rounded-lg bg-cyan-600 text-slate-950 text-sm font-semibold flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Import draft</button>
              </section>

              {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 flex items-center gap-1">Open source <ExternalLink className="w-3 h-3" /></a>}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-slate-600"><div><Database className="w-8 h-8 mx-auto" /><div className="mt-3 text-sm">Select a discovery result to inspect ranking and source evidence.</div></div></div>
          )}
        </aside>
      </div>
    </div>
  );
};
