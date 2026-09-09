import React, { useState } from 'react';
import {
  Search,
  Database,
  ExternalLink,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  Info,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { FederatedSearchResult, SourceAuthority, UxSMission } from '../types';
import { SEED_FEDERATED_SEARCH_RESULTS } from '../data/evidenceAndClaims';

interface MantasSearchProps {
  currentMission: UxSMission;
  onPullAsEvidence: (result: FederatedSearchResult) => void;
  onSelectAsMission: (mission: Partial<UxSMission>) => void;
  onSwitchTab: (tab: any) => void;
}

export const MantasSearch: React.FC<MantasSearchProps> = ({
  currentMission,
  onPullAsEvidence,
  onSelectAsMission,
  onSwitchTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<FederatedSearchResult | null>(
    SEED_FEDERATED_SEARCH_RESULTS[0]
  );
  const [showRawModal, setShowRawModal] = useState(false);
  const [pulledNotification, setPulledNotification] = useState<string | null>(null);

  const authorities: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Sources' },
    { id: 'CoMET', label: 'NOAA CoMET' },
    { id: 'OneStop', label: 'OneStop' },
    { id: 'STAC', label: 'Ocean STAC' },
    { id: 'UxS Registry', label: 'UxS Fleet' },
    { id: 'DocuComp', label: 'DocuComp' },
  ];

  const filteredResults = SEED_FEDERATED_SEARCH_RESULTS.filter((item) => {
    const matchesAuth =
      selectedAuthority === 'ALL' || item.authority === selectedAuthority;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.identifier && item.identifier.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.metadataSummary.platform &&
        item.metadataSummary.platform.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAuth && matchesQuery;
  });

  const handlePullEvidence = (result: FederatedSearchResult) => {
    onPullAsEvidence(result);
    setPulledNotification(`Imported candidate claims from ${result.authority} into Evidence workspace for human review.`);
    setTimeout(() => setPulledNotification(null), 4500);
  };

  const getAuthorityBadge = (authority: SourceAuthority) => {
    switch (authority) {
      case 'CoMET':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/50';
      case 'OneStop':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
      case 'STAC':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/50';
      case 'UxS Registry':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/50';
      case 'DocuComp':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="mantas-search-shell" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden">
      {/* Top Banner: "What are you working on?" */}
      <div className="bg-[#091120] border-b border-cyan-500/20 px-6 py-6 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-wide">
            What are you working on?
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
            Search federated NOAA mission registries, CoMET records, OneStop collections, STAC catalogs, and UxS fleet asset databases to pull evidence into the canonical mission model.
          </p>
        </div>

        {/* Big Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="mantas-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NOAA missions, cruises, platforms (e.g. REMUS 620, Okeanos Explorer, EX2503, Saildrone)..."
              className="w-full bg-[#050912] border border-cyan-500/30 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-sans shadow-inner"
            />
          </div>

          {/* Source Authority Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {authorities.map((auth) => (
              <button
                key={auth.id}
                id={`filter-auth-${auth.id}`}
                onClick={() => setSelectedAuthority(auth.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  selectedAuthority === auth.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'bg-[#080f1d] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {auth.label}
              </button>
            ))}
          </div>
        </div>

        {/* Doctrine Notice: No silent overwrites */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300/80 bg-cyan-950/30 border border-cyan-500/20 rounded-lg px-3 py-1.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Architectural Rule:</strong> Pulling search results creates <em>observed evidence</em> and candidate claims. Only explicit human acceptance mutates canonical mission meaning.
          </span>
        </div>
      </div>

      {/* Pulled Notification Banner */}
      {pulledNotification && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 flex items-center justify-between text-xs font-mono text-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{pulledNotification}</span>
          </div>
          <button
            onClick={() => onSwitchTab('evidence')}
            className="text-xs text-emerald-300 underline font-semibold hover:text-emerald-100 ml-4 cursor-pointer"
          >
            Go to Evidence Workspace →
          </button>
        </div>
      )}

      {/* Main Split: Results List on Left, Selected Result Inspector on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Results List */}
        <div className="w-full md:w-1/2 lg:w-3/5 border-r border-slate-800/80 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pb-1">
            <span>Showing {filteredResults.length} federated records</span>
            <span className="text-[11px] text-cyan-400">Sources: CoMET • OneStop • STAC • UxS Fleet</span>
          </div>

          {filteredResults.map((result) => {
            const isSelected = selectedResult?.id === result.id;
            return (
              <div
                key={result.id}
                id={`search-result-card-${result.id}`}
                onClick={() => setSelectedResult(result)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0a1426] border-cyan-500/50 shadow-md shadow-cyan-950/50'
                    : 'bg-[#080e1b] border-slate-800/80 hover:border-cyan-500/30 hover:bg-[#091122]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getAuthorityBadge(result.authority)}`}>
                        {result.authority}
                      </span>
                      {result.status && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {result.status}
                        </span>
                      )}
                      {result.dsmmScore && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                          DSMM: {result.dsmmScore}/5.0 ★
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 font-sans leading-snug">
                      {result.title}
                    </h3>
                    {result.subtitle && (
                      <p className="text-xs text-slate-400 font-mono">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata summary chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs font-mono bg-[#050912]/70 p-2.5 rounded-lg border border-slate-800/60">
                  {result.metadataSummary.platform && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-slate-500">Platform:</span>
                      <span className="text-cyan-300 truncate">{result.metadataSummary.platform}</span>
                    </div>
                  )}
                  {result.metadataSummary.temporal && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-slate-500">Temporal:</span>
                      <span className="text-slate-300">{result.metadataSummary.temporal}</span>
                    </div>
                  )}
                  {result.metadataSummary.sensors && result.metadataSummary.sensors.length > 0 && (
                    <div className="sm:col-span-2 flex items-center gap-1.5 text-slate-300 truncate">
                      <span className="text-slate-500">Sensors:</span>
                      <span className="text-cyan-400">{result.metadataSummary.sensors.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Card footer action buttons */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-mono text-slate-400">
                    {result.claimsCount || 1} candidate claims
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      id={`pull-btn-${result.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePullEvidence(result);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 text-xs font-mono font-medium transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Pull as Evidence</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Result Deep Inspector */}
        <div className="w-full md:w-1/2 lg:w-2/5 overflow-y-auto p-5 bg-[#050a14] space-y-4">
          {selectedResult ? (
            <>
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getAuthorityBadge(selectedResult.authority)}`}>
                    {selectedResult.authority} Record
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ID: {selectedResult.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 font-sans mt-2">
                  {selectedResult.title}
                </h3>
                {selectedResult.subtitle && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedResult.subtitle}
                  </p>
                )}
              </div>

              {/* Source Provenance Info Box */}
              <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                <h4 className="text-xs font-semibold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Authority Source Metadata</span>
                </h4>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authority System:</span>
                    <span className="text-cyan-300 font-semibold">{selectedResult.authority}</span>
                  </div>
                  {selectedResult.identifier && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Identifier / DOI:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{selectedResult.identifier}</span>
                    </div>
                  )}
                  {selectedResult.uuid && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">CoMET UUID:</span>
                      <span className="text-cyan-400 truncate max-w-[200px]">{selectedResult.uuid}</span>
                    </div>
                  )}
                  {selectedResult.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recorded Timestamp:</span>
                      <span className="text-slate-400">{selectedResult.timestamp}</span>
                    </div>
                  )}
                  {selectedResult.dsmmScore && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">NOAA DSMM Maturity:</span>
                      <span className="text-amber-300 font-bold">{selectedResult.dsmmScore} / 5.0</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw fragment preview */}
              {selectedResult.rawFragment && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Raw Observed Fragment</span>
                    <span className="text-[10px] text-cyan-400">XML/JSON</span>
                  </div>
                  <pre className="bg-[#04070d] border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-36">
                    {selectedResult.rawFragment}
                  </pre>
                </div>
              )}

              {/* Actions Box */}
              <div className="bg-[#091224] border border-cyan-500/30 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                  Integration Actions
                </h4>
                <p className="text-xs text-slate-400">
                  Importing extracts claims from this record into your active Evidence workspace for reconciliation against other observations.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    id="inspector-pull-evidence-btn"
                    onClick={() => handlePullEvidence(selectedResult)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pull as Evidence to Claims Workspace</span>
                  </button>

                  <button
                    id="inspector-set-base-btn"
                    onClick={() => {
                      if (selectedResult.candidateUxsMission) {
                        onSelectAsMission(selectedResult.candidateUxsMission);
                        onSwitchTab('mission');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0d1b32] hover:bg-[#122442] text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors"
                  >
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Adopt Candidate Values into Mission View</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 font-mono text-xs">
              <Search className="w-8 h-8 text-slate-600 mb-2" />
              <span>Select a federated record to inspect evidence details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
