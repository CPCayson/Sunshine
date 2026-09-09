import React, { useState } from 'react';
import { AlertTriangle, Database, FileSpreadsheet, Hash, ShieldCheck, Upload } from 'lucide-react';
import { IngestedSourceRow, SourceArtifact } from '../../types';
import { ingestCorpusSource, SourceFirstIngestResult } from '../../services/sourceFirstCorpusService';

export const SourceFirstIngestionPanel: React.FC = () => {
  const [format, setFormat] = useState<'CSV' | 'JSON' | 'WORKBOOK_ROW'>('CSV');
  const [title, setTitle] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState<SourceFirstIngestResult | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleIngest = async () => {
    if (!payload.trim()) return;
    setIsWorking(true);
    try {
      setResult(await ingestCorpusSource(payload, format, title || `Imported ${format} source`, sheetName));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-[#060b14] text-slate-200 font-mono text-xs space-y-4">
      <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/15 flex gap-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
        <div>
          <div className="font-bold text-amber-200">LEGACY DEMO CORPUS QUARANTINED</div>
          <p className="mt-1 text-slate-400 leading-relaxed">
            The old seeded fleet/specification/EN2501 demo artifacts are no longer loaded into this surface as operational evidence. This panel starts empty and only shows sources ingested in the current session.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#081224] space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 tracking-wider">SOURCE-FIRST INGESTION</span>
          <span className="ml-auto px-2 py-0.5 rounded border border-cyan-700/50 text-cyan-300 text-[10px]">OBSERVATIONS ONLY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-slate-500">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200">
              <option value="CSV">CSV</option>
              <option value="WORKBOOK_ROW">Workbook-derived CSV</option>
              <option value="JSON">JSON</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-slate-500">Artifact title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2026 UxS inventory export" className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-500">Sheet / table</span>
            <input value={sheetName} onChange={(e) => setSheetName(e.target.value)} disabled={format === 'JSON'} className="w-full p-2 bg-[#050a14] border border-slate-700 rounded text-slate-200 disabled:opacity-40" />
          </label>
        </div>

        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={9}
          placeholder={format === 'JSON' ? '[{"manufacturer":"HII","model":"REMUS 620","serial":"6401"}]' : 'manufacturer,model,serial\nHII,REMUS 620,6401'}
          className="w-full p-3 bg-[#030812] border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] outline-none focus:border-cyan-600"
        />

        <button onClick={handleIngest} disabled={!payload.trim() || isWorking} className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white flex items-center gap-2 font-bold">
          <Upload className="w-4 h-4" />
          {isWorking ? 'INGESTING…' : 'INGEST AS EVIDENCE'}
        </button>
      </div>

      {result && <IngestResult artifact={result.artifact} rows={result.rows} hashStatus={result.hashStatus} warnings={result.warnings} />}

      <div className="p-3 rounded-lg border border-slate-800 bg-[#050a14] text-slate-400 flex gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Invariant: SourceArtifact → IngestedSourceRow. No fuzzy identity merge, no canonical mutation, and no CAN_CARRY / CONFIGURED_WITH / CARRIED / PRODUCED assertion occurs here.</span>
      </div>
    </div>
  );
};

const IngestResult: React.FC<{
  artifact: SourceArtifact;
  rows: IngestedSourceRow[];
  hashStatus: string;
  warnings: string[];
}> = ({ artifact, rows, hashStatus, warnings }) => (
  <div className="p-4 rounded-xl border border-slate-800 bg-[#07101c] space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-slate-500 text-[10px]">CURRENT SESSION SOURCE</div>
        <div className="text-sm font-bold text-slate-100">{artifact.name}</div>
        <div className="text-slate-400 mt-1">{rows.length} observed fields · {artifact.provenanceType}</div>
      </div>
      <div className="text-right text-[10px] text-slate-400">
        <div className="flex items-center gap-1 justify-end"><Hash className="w-3 h-3" />{hashStatus}</div>
        <div className="mt-1 break-all max-w-xs">{artifact.artifactHash || 'No hash asserted'}</div>
      </div>
    </div>

    {warnings.length > 0 && (
      <div className="space-y-1">
        {warnings.map((warning) => <div key={warning} className="text-amber-300 text-[11px]">{warning}</div>)}
      </div>
    )}

    <div className="max-h-56 overflow-auto border border-slate-800 rounded-lg">
      {rows.slice(0, 100).map((row) => (
        <div key={row.id} className="grid grid-cols-[70px_160px_1fr] gap-2 px-2 py-1.5 border-b border-slate-800/70 text-[10px]">
          <span className="text-slate-500">row {row.row}</span>
          <span className="text-cyan-300 truncate">{row.rawField}</span>
          <span className="text-slate-300 truncate">{row.rawValue}</span>
        </div>
      ))}
      {rows.length === 0 && <div className="p-4 text-slate-500">No observations parsed.</div>}
    </div>

    <div className="flex items-center gap-2 text-[10px] text-slate-500">
      <Database className="w-3 h-3" />
      <span>Evidence is staged only. Reconciliation and acceptance happen in a separate decision step.</span>
    </div>
  </div>
);
