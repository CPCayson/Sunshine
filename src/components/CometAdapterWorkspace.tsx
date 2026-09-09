import React, { useState, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  FileCode,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  RefreshCw,
  Lock,
  Search,
  Database,
  Globe,
  Radio,
  Clock,
  KeyRound,
  FileCheck2
} from 'lucide-react';
import { UxSMission, ExternalServiceObservation, ProvenanceType } from '../types';
import { cometAdapter, CometOperationMode, OFFICIAL_COMET_CONTRACT } from '../services/cometAdapter';
import { generateIso19115Xml } from '../utils/xmlGenerator';
import { DOCUCOMP_SLOT_PROFILE } from '../data/docucompSlotProfile';

interface CometAdapterWorkspaceProps {
  mission: UxSMission;
  mode?: CometOperationMode;
  onChangeMode?: (mode: CometOperationMode) => void;
}

export const CometAdapterWorkspace: React.FC<CometAdapterWorkspaceProps> = ({
  mission,
  mode: propMode,
  onChangeMode: propOnChangeMode,
}) => {
  const [internalMode, setInternalMode] = useState<CometOperationMode>(propMode || 'LIVE_OBSERVED_MODE');
  const mode = propMode || internalMode;
  const [observations, setObservations] = useState<ExternalServiceObservation[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [activeTab, setActiveTab] = useState<'SERVICES_OBSERVATION' | 'EXPECTED_VS_OBSERVED' | 'DOCUCOMP_READER' | 'OFFICIAL_CONTRACT'>('SERVICES_OBSERVATION');

  // Custom DocuComp UUID probe state
  const [docucompInputUuid, setDocucompInputUuid] = useState('440b3ac2-64a5-46e2-9846-38305718b644');
  const [docucompProbeResult, setDocucompProbeResult] = useState<{
    obs: ExternalServiceObservation | null;
    xml: string | null;
    loading: boolean;
  }>({ obs: null, xml: null, loading: false });

  const isoXml = generateIso19115Xml(mission);

  // Sync mode with adapter
  const handleToggleMode = (newMode: CometOperationMode) => {
    setInternalMode(newMode);
    cometAdapter.setMode(newMode);
    if (propOnChangeMode) propOnChangeMode(newMode);
  };

  // Run full observation suite
  const handleRunFullSuite = async () => {
    setIsProbing(true);
    try {
      const results = await cometAdapter.runFullServicesObservationSuite(isoXml);
      setObservations(results);
    } catch (err) {
      console.error('Failed running suite', err);
    } finally {
      setIsProbing(false);
    }
  };

  // Probe single record service
  const handleProbeService = async (service: 'validate' | 'resolver' | 'rubricV2' | 'linkcheck') => {
    setIsProbing(true);
    try {
      const result = await cometAdapter.probeRecordService(service, isoXml);
      setObservations((prev) => [result, ...prev.filter((o) => !o.service.includes(service))]);
    } catch (err) {
      console.error('Failed probing service', err);
    } finally {
      setIsProbing(false);
    }
  };

  // Dereference single DocuComp UUID
  const handleProbeDocucomp = async () => {
    if (!docucompInputUuid.trim()) return;
    setDocucompProbeResult((prev) => ({ ...prev, loading: true }));
    try {
      const res = await cometAdapter.probeDocucompDereference(docucompInputUuid.trim());
      setDocucompProbeResult({ obs: res.observation, xml: res.xml, loading: false });
      setObservations((prev) => [res.observation, ...prev.filter((o) => o.id !== res.observation.id)]);
    } catch (err) {
      console.error('Failed probing docucomp', err);
      setDocucompProbeResult((prev) => ({ ...prev, loading: false }));
    }
  };

  // Auto-run single observation on mount if empty
  useEffect(() => {
    if (observations.length === 0) {
      handleRunFullSuite();
    }
  }, [mode]);

  const diffs = cometAdapter.generateExpectedVsServicesObservedDiffs(mission, observations);

  const getProvenanceBadge = (type: ProvenanceType, authStatus?: string) => {
    if (authStatus === 'AUTH_REQUIRED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
          <KeyRound className="w-2.5 h-2.5" />
          AUTH REQUIRED
        </span>
      );
    }
    switch (type) {
      case 'LIVE_OBSERVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            LIVE
          </span>
        );
      case 'LOCAL_DERIVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50">
            LOCAL
          </span>
        );
      case 'IMPORTED_ARTIFACT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/50">
            IMPORTED
          </span>
        );
      case 'SYNTHETIC_FIXTURE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-purple-950/80 text-purple-300 border border-purple-500/50">
            FIXTURE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700">
            NOT RUN
          </span>
        );
    }
  };

  return (
    <div id="comet-services-observation-workspace" className="flex-1 flex flex-col bg-[#050912] text-slate-200 overflow-hidden font-sans">
      {/* Top Banner & Mode Controller */}
      <div className="bg-[#091122] border-b border-cyan-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
              NOAA CoMET & DOCUCOMP SERVICES OBSERVATION
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Contract: https://data.noaa.gov/cedit
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Permission-free external verification gateway. Probes real NOAA endpoints and reports authentic HTTP & authentication states.
          </p>
        </div>

        {/* Operational Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#03060c] border border-cyan-500/30 rounded-lg p-1 text-xs font-mono">
            <button
              id="mode-toggle-live"
              onClick={() => handleToggleMode('LIVE_OBSERVED_MODE')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 font-bold ${
                mode === 'LIVE_OBSERVED_MODE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE MODE (Real NOAA Services)</span>
            </button>
            <button
              id="mode-toggle-demo"
              onClick={() => handleToggleMode('SYNTHETIC_DEMO_MODE')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 font-bold ${
                mode === 'SYNTHETIC_DEMO_MODE'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>DEMO MODE (Synthetic Fixtures)</span>
            </button>
          </div>

          <button
            id="run-all-probes-btn"
            onClick={handleRunFullSuite}
            disabled={isProbing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            <span>{isProbing ? 'Probing NOAA...' : 'Run Observation Suite'}</span>
          </button>
        </div>
      </div>

      {/* Scope Doctrine Notice */}
      <div className="bg-[#0c1628] border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-amber-200/90">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            <strong className="text-amber-300">NO-WRITE VERIFICATION DOCTRINE:</strong> Writes (import / update / delete) are strictly OUT OF SCOPE. No catalog mutation endpoints are called or stubbed.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Provenance states:</span>
          {getProvenanceBadge('LIVE_OBSERVED')}
          {getProvenanceBadge('LOCAL_DERIVED')}
          {getProvenanceBadge('SYNTHETIC_FIXTURE')}
          {getProvenanceBadge('LOCAL_DERIVED', 'AUTH_REQUIRED')}
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-[#080d18] border-b border-slate-800 px-6 flex gap-2">
        <button
          onClick={() => setActiveTab('SERVICES_OBSERVATION')}
          className={`px-4 py-3 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'SERVICES_OBSERVATION'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>CoMET Services Observation ({observations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPECTED_VS_OBSERVED')}
          className={`px-4 py-3 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'EXPECTED_VS_OBSERVED'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Expected ↔ Services-Observed Reconciliation</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCUCOMP_READER')}
          className={`px-4 py-3 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'DOCUCOMP_READER'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>DocuComp Public HTTP Dereferencer</span>
        </button>

        <button
          onClick={() => setActiveTab('OFFICIAL_CONTRACT')}
          className={`px-4 py-3 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'OFFICIAL_CONTRACT'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Official OpenAPI Surface ({OFFICIAL_COMET_CONTRACT.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: SERVICES OBSERVATION */}
        {activeTab === 'SERVICES_OBSERVATION' && (
          <div className="space-y-6">
            {/* Action Bar for Individual Service Probes */}
            <div className="bg-[#081120] border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold font-mono text-cyan-200 uppercase tracking-wider">
                  Probe Documented Stateless Record Services
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Target: <code>https://data.noaa.gov/cedit/recordServices/*</code>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleProbeService('validate')}
                  disabled={isProbing}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-[#050912] hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-200 transition-colors cursor-pointer"
                >
                  POST /recordServices/validate
                </button>
                <button
                  onClick={() => handleProbeService('resolver')}
                  disabled={isProbing}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-[#050912] hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-200 transition-colors cursor-pointer"
                >
                  POST /recordServices/resolver
                </button>
                <button
                  onClick={() => handleProbeService('rubricV2')}
                  disabled={isProbing}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-[#050912] hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-200 transition-colors cursor-pointer"
                >
                  POST /recordServices/rubricV2
                </button>
                <button
                  onClick={() => handleProbeService('linkcheck')}
                  disabled={isProbing}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-[#050912] hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-200 transition-colors cursor-pointer"
                >
                  POST /recordServices/linkcheck
                </button>
              </div>
            </div>

            {/* Observations List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Audited External Service Observations</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {mode === 'LIVE_OBSERVED_MODE' ? 'Authentic HTTP Results from NOAA' : 'Deterministic Synthetic Fixtures'}
                </span>
              </h3>

              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-[#08101e] border border-slate-800/80 rounded-xl p-4 space-y-3 font-mono text-xs hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{obs.service}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {obs.authority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getProvenanceBadge(obs.provenanceType, obs.authStatus)}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        obs.httpStatus === 200
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : obs.httpStatus === 302
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : obs.httpStatus === 500
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        HTTP {obs.httpStatus || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500">Upstream URL:</span>
                      <div className="text-cyan-300 truncate">{obs.upstreamEndpoint}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Timestamp:</span>
                      <div className="text-slate-300">{new Date(obs.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Request Payload Hash:</span>
                      <div className="text-slate-400">{obs.requestArtifactHash}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Response Payload Hash:</span>
                      <div className="text-slate-400">{obs.responseArtifactHash || 'none'}</div>
                    </div>
                  </div>

                  <div className="bg-[#03060c] p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-slate-500 block mb-1 font-bold">Observation Verdict:</span>
                    <div>{obs.result}</div>
                  </div>

                  {obs.rawResponseSnippet && (
                    <div className="text-[10px] bg-[#020408] p-2 rounded text-slate-400 border border-slate-800/60 font-mono truncate">
                      <span className="text-slate-600">Raw snippet: </span>
                      {obs.rawResponseSnippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EXPECTED VS OBSERVED RECONCILIATION */}
        {activeTab === 'EXPECTED_VS_OBSERVED' && (
          <div className="space-y-6">
            <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-cyan-200 uppercase tracking-wider font-mono mb-2">
                Expected vs Services-Observed Evidence Matrix
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                MANTAS models canonical marine UxS missions into an <strong>EXPECTED</strong> ISO 19115-2 projection. 
                When piped to NOAA external endpoints, returned HTTP receipts constitute <strong>OBSERVED</strong> verification evidence.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-[#091122] text-cyan-200 text-left border-b border-slate-800">
                    <th className="p-3">Target Capability</th>
                    <th className="p-3">MANTAS Expected</th>
                    <th className="p-3">NOAA Services Observed</th>
                    <th className="p-3">Upstream Contract</th>
                    <th className="p-3">Provenance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {diffs.map((diff, idx) => (
                    <tr key={idx} className="bg-[#060b16] hover:bg-[#08101e] transition-colors">
                      <td className="p-3 font-bold text-slate-100">{diff.targetCapability}</td>
                      <td className="p-3 text-cyan-300">{diff.expectedFromMantas}</td>
                      <td className="p-3 text-slate-300 max-w-xs">{diff.observedFromNoaa}</td>
                      <td className="p-3 text-slate-400 text-[11px] truncate max-w-[200px]" title={diff.upstreamService}>
                        {diff.upstreamService}
                      </td>
                      <td className="p-3">{getProvenanceBadge(diff.provenance)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          diff.statusBadge === 'PASS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : diff.statusBadge === 'AUTH_REQUIRED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {diff.statusBadge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DOCUCOMP PUBLIC HTTP DEREFERENCER */}
        {activeTab === 'DOCUCOMP_READER' && (
          <div className="space-y-6">
            <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-200 uppercase tracking-wider font-mono">
                  Authoritative NOAA DocuComp Public XML Reader
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Public GET (No ICAM Auth Required)
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                NOAA DocuComp components are publicly accessible at <code>https://data.noaa.gov/docucomp/{'{uuid}'}</code>.
                Dereferencing valid UUIDs returns authoritative XML fragments directly from the NOAA registry.
              </p>

              {/* Sample UUID Buttons */}
              <div className="flex flex-wrap gap-2 text-xs font-mono pt-2">
                <span className="text-slate-400 text-[11px] self-center">Known UUIDs:</span>
                <button
                  onClick={() => setDocucompInputUuid('440b3ac2-64a5-46e2-9846-38305718b644')}
                  className="px-2 py-1 rounded bg-[#050912] hover:bg-cyan-950 border border-slate-800 text-cyan-300 text-[11px] cursor-pointer"
                >
                  NCEI Contact (200 OK)
                </button>
                <button
                  onClick={() => setDocucompInputUuid('25eba8fb-22f1-4b30-a262-f84238369d75')}
                  className="px-2 py-1 rounded bg-[#050912] hover:bg-cyan-950 border border-slate-800 text-cyan-300 text-[11px] cursor-pointer"
                >
                  Archival Contact (200 OK)
                </button>
                <button
                  onClick={() => setDocucompInputUuid('1b594b29-e856-4318-912e-9d2bc7a3f3b1')}
                  className="px-2 py-1 rounded bg-[#050912] hover:bg-rose-950 border border-slate-800 text-rose-300 text-[11px] cursor-pointer"
                >
                  Missing UUID (500 Error)
                </button>
              </div>

              {/* Input Form */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={docucompInputUuid}
                  onChange={(e) => setDocucompInputUuid(e.target.value)}
                  placeholder="Enter NOAA DocuComp UUID or URL..."
                  className="flex-1 bg-[#03060c] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleProbeDocucomp}
                  disabled={docucompProbeResult.loading}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{docucompProbeResult.loading ? 'Dereferencing...' : 'Dereference Live'}</span>
                </button>
              </div>
            </div>

            {/* Probe Result Display */}
            {docucompProbeResult.obs && (
              <div className="bg-[#08101e] border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">DocuComp Dereference Receipt</span>
                    {getProvenanceBadge(docucompProbeResult.obs.provenanceType)}
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    docucompProbeResult.obs.httpStatus === 200
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    HTTP {docucompProbeResult.obs.httpStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500">Upstream Endpoint:</span>
                    <div className="text-cyan-300 truncate">{docucompProbeResult.obs.upstreamEndpoint}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Response Payload Hash:</span>
                    <div className="text-slate-300">{docucompProbeResult.obs.responseArtifactHash}</div>
                  </div>
                </div>

                <div className="p-3 bg-[#03060c] rounded border border-slate-800">
                  <span className="text-slate-500 block mb-1">Result:</span>
                  <div className="text-slate-200">{docucompProbeResult.obs.result}</div>
                </div>

                {docucompProbeResult.xml && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-bold text-[11px]">
                      Authoritative XML Retrieved from NOAA DocuComp:
                    </span>
                    <pre className="bg-[#03060c] p-3 rounded-lg border border-slate-800 text-[11px] text-cyan-200 overflow-x-auto max-h-72 whitespace-pre">
                      {docucompProbeResult.xml}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OFFICIAL OPENAPI CONTRACT */}
        {activeTab === 'OFFICIAL_CONTRACT' && (
          <div className="space-y-6">
            <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-cyan-200 uppercase tracking-wider font-mono">
                  Official NOAA CEDIT OpenAPI Contract Specification
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Server: <code>https://data.noaa.gov/cedit</code> | Documentation: <code>/cedit/openApiDoc.html</code>
                </p>
              </div>
              <a
                href="https://data.noaa.gov/cedit/openApiDoc.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>openApiDoc.html</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-[#091122] text-cyan-200 text-left border-b border-slate-800">
                    <th className="p-3">HTTP Method</th>
                    <th className="p-3">Path</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Scope Boundary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {OFFICIAL_COMET_CONTRACT.map((ep, idx) => (
                    <tr key={idx} className="bg-[#060b16] hover:bg-[#08101e] transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ep.method === 'GET'
                            ? 'bg-emerald-950 text-emerald-300'
                            : ep.method === 'POST'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}>
                          {ep.method}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-100">{ep.path}</td>
                      <td className="p-3 text-slate-400">{ep.category}</td>
                      <td className="p-3 text-slate-300">{ep.description}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ep.scopeStatus === 'IN_SCOPE_OBSERVATION'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {ep.scopeStatus === 'IN_SCOPE_OBSERVATION' ? 'IN SCOPE (OBSERVATION)' : 'OUT OF SCOPE (MUTATION)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Externalized Policy Profile Summary */}
            <div className="bg-[#08101e] border border-cyan-500/20 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-cyan-200 uppercase">
                  {DOCUCOMP_SLOT_PROFILE.profileMetadata.title}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {DOCUCOMP_SLOT_PROFILE.profileMetadata.authority}: {DOCUCOMP_SLOT_PROFILE.profileMetadata.reviewStatus}
                </span>
              </div>
              <p className="text-slate-400">
                Version {DOCUCOMP_SLOT_PROFILE.profileMetadata.version} | {DOCUCOMP_SLOT_PROFILE.rules.length} policy rules. Rules with verifiable NOAA documentation are Authoritative; unverified or working-group rules are Provisional.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {DOCUCOMP_SLOT_PROFILE.rules.map((rule) => (
                  <div key={rule.ruleId} className="p-2.5 bg-[#050912] rounded border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{rule.componentRole}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        rule.status === 'AUTHORITATIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : rule.status === 'PROVISIONAL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rule.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px]">Authority: {rule.authority} ({rule.source})</div>
                    <div className="text-cyan-300/80 text-[10px] truncate">
                      Allowed: {rule.allowedSlots.join(', ') || 'None (Curator required)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
