import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Table,
  Upload,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Hash,
  Clock,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  SourceArtifact,
  IngestedSourceRow,
  CandidateIdentityEdge
} from '../../types';
import {
  getCorpusSourceArtifacts,
  getCorpusIngestedRows,
  getCorpusIdentityCandidates,
  ingestSourceData
} from '../../services/identityResolutionService';

export const SourceFirstIngestionPanel: React.FC = () => {
  const [artifacts, setArtifacts] = useState<SourceArtifact[]>(getCorpusSourceArtifacts());
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(artifacts[0]?.id || '');
  const [rows, setRows] = useState<IngestedSourceRow[]>(getCorpusIngestedRows());
  const [candidates, setCandidates] = useState<CandidateIdentityEdge[]>(getCorpusIdentityCandidates());
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Ingestion modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importTitle, setImportTitle] = useState('NOAA OER Spring 2025 Fleet Ingest');
  const [importFormat, setImportFormat] = useState<'CSV' | 'JSON' | 'WORKBOOK_ROW'>('CSV');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedArtifact = artifacts.find((a) => a.id === selectedArtifactId) || artifacts[0];
  const artifactRows = rows.filter((r) => r.sourceArtifactId === selectedArtifact?.id);

  // Get distinct columns
  const columns = Array.from(new Set(artifactRows.map((r) => r.column || r.rawField)));
  // Group rows by row number
  const rowNumbers = Array.from(new Set(artifactRows.map((r) => r.row))).sort((a, b) => a - b);

  const handleAction = (actionName: string, row?: IngestedSourceRow) => {
    setActionNotice(`Action executed: ${actionName} for cell "${row?.rawValue || 'selected'}"`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handlePerformImport = () => {
    if (!importInput.trim()) return;
    const res = ingestSourceData(importInput, importFormat, importTitle);
    setArtifacts(getCorpusSourceArtifacts());
    setRows(getCorpusIngestedRows());
    setCandidates(getCorpusIdentityCandidates());
    setSelectedArtifactId(res.artifact.id);
    setIsImportModalOpen(false);
    setImportInput('');
    setActionNotice(`Ingested ${res.parsedRows.length} source observations from "${res.artifact.name}".`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div id="source-first-ingestion-workspace" className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#060b14]">
      {/* Left Sidebar: Artifacts & Ingestion Controls */}
      <div className="w-full md:w-80 border-r border-cyan-500/20 bg-[#08101e] flex flex-col shrink-0">
        <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Source Artifacts ({artifacts.length})
            </span>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-2 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[11px] font-mono flex items-center gap-1 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Ingest Source</span>
          </button>
        </div>

        {/* Artifacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {artifacts.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArtifactId(art.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedArtifact?.id === art.id
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-slate-100'
                  : 'bg-[#060c18] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-slate-200 truncate">{art.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 text-[9px] border border-cyan-900/60">
                  {art.artifactType}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                File: <span className="text-slate-300">{art.fileName}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-1">
                <span>{art.sheetName || 'Sheet1'}</span>
                <span>•</span>
                <span>{art.recordCount || 0} records</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{art.provenanceType}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Source Ingestion Invariant Notice */}
        <div className="p-3 bg-[#050a14] border-t border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-1">
          <div className="text-cyan-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Source-First Invariant</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Raw rows produce isolated SourceObservations. Never converts spreadsheet strings into canonical entities without human decision.
          </p>
        </div>
      </div>

      {/* Main Panel: Raw Source Table View & Inspection */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#060b14]">
        {/* Artifact Metadata Banner */}
        {selectedArtifact && (
          <div className="p-3 bg-[#081224] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-slate-300">
            <div>
              <div className="font-bold text-sm text-slate-100">{selectedArtifact.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                <span>File: <strong className="text-slate-200">{selectedArtifact.fileName}</strong></span>
                <span>Sheet: <strong className="text-slate-200">{selectedArtifact.sheetName || 'N/A'}</strong></span>
                <span>Hash: <code className="text-cyan-300">{selectedArtifact.artifactHash}</code></span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {selectedArtifact.provenanceType}
              </span>
              <span className="text-slate-400">Imported: {new Date(selectedArtifact.importedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {actionNotice && (
          <div className="m-3 px-3 py-2 rounded bg-cyan-950/90 border border-cyan-500 text-cyan-200 font-mono text-xs flex items-center justify-between">
            <span>{actionNotice}</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
        )}

        {/* Action Toolbar for Selected Cell/Row */}
        <div className="px-4 py-2 bg-[#050c18] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="text-slate-400">
            {selectedRowId ? (
              <span>Selected Observation: <code className="text-cyan-300">{selectedRowId}</code></span>
            ) : (
              <span>Select any cell below to inspect observation metadata & trigger steward actions:</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => handleAction('CREATE OBSERVATION')}
              className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800"
            >
              CREATE OBSERVATION
            </button>
            <button
              onClick={() => handleAction('PROPOSE CANDIDATE IDENTITY')}
              className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900/60 text-purple-300 border border-purple-800"
            >
              PROPOSE CANDIDATE IDENTITY
            </button>
            <button
              onClick={() => handleAction('LINK TO CANONICAL ENTITY')}
              className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800"
            >
              LINK CANONICAL
            </button>
            <button
              onClick={() => handleAction('REJECT AS AMBIGUOUS')}
              className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900/60 text-rose-300 border border-rose-800"
            >
              REJECT AMBIGUOUS
            </button>
            <button
              onClick={() => handleAction('LEAVE AS RAW UNLINKED')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
            >
              LEAVE UNLINKED
            </button>
          </div>
        </div>

        {/* Spreadsheet Grid View */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#040812]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#081224] border-b border-slate-800 text-slate-300">
                  <th className="p-2 border-r border-slate-800 text-center w-12 text-slate-500">#</th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="p-2 border-r border-slate-800 font-semibold text-cyan-300">
                      {col}
                    </th>
                  ))}
                  <th className="p-2 text-slate-400">Extracted Status</th>
                </tr>
              </thead>
              <tbody>
                {rowNumbers.map((rNum) => {
                  const cellsInRow = artifactRows.filter((r) => r.row === rNum);
                  return (
                    <tr
                      key={rNum}
                      className="border-b border-slate-800/60 hover:bg-cyan-950/20 transition-colors"
                    >
                      <td className="p-2 border-r border-slate-800 text-center text-slate-500 bg-[#050b16]">
                        {rNum}
                      </td>
                      {columns.map((col, cIdx) => {
                        const cell = cellsInRow.find((c) => c.column === col || c.rawField === col);
                        const isSelected = selectedRowId === cell?.id;
                        const isCandidate = cell?.rawValue.includes('REMUS') || cell?.rawValue.includes('6401') || cell?.rawValue.includes('MINSAS');

                        return (
                          <td
                            key={cIdx}
                            onClick={() => cell && setSelectedRowId(cell.id)}
                            className={`p-2 border-r border-slate-800/80 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-cyan-900/40 text-cyan-100 font-bold ring-1 ring-cyan-400'
                                : isCandidate
                                ? 'text-cyan-200 bg-cyan-950/10'
                                : 'text-slate-300'
                            }`}
                          >
                            {cell?.rawValue || <span className="text-slate-700">—</span>}
                          </td>
                        );
                      })}
                      <td className="p-2 text-slate-400 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                          OBSERVED_RAW
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ingestion Modal Dialog */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#091224] border border-cyan-500/40 rounded-xl p-5 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-slate-100">SOURCE-FIRST INGESTION STAGING</span>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Artifact Title:</label>
                <input
                  type="text"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Payload Format:</label>
                <div className="flex gap-2">
                  {(['CSV', 'JSON', 'WORKBOOK_ROW'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setImportFormat(fmt)}
                      className={`px-3 py-1.5 rounded border text-xs ${
                        importFormat === fmt
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                          : 'bg-black/40 text-slate-400 border-slate-800'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Raw Content (paste CSV lines or JSON object):</label>
                <textarea
                  rows={6}
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder={`Platform_Name,Serial_Num,Sensor_Bay_Payload,Operator\nREMUS 620,6401,Kraken MINSAS-120,NOAA OMAO\nSaildrone Explorer,1033,ASV Carbon Package,PMEL`}
                  className="w-full p-2.5 bg-[#050a14] border border-slate-700 rounded text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300 space-y-1">
                <div className="font-bold">Provenance Assurance:</div>
                <div>
                  This import will compute a cryptographic SHA-256 hash, log in the audit ledger, and isolate raw values into unlinked SourceObservations.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformImport}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Ingest Source Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
