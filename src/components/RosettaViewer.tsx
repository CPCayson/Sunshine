import React, { useMemo, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { RosettaFieldMapping, UxSMission } from '../types';
import { SEED_ROSETTA_MAPPINGS } from '../data/evidenceAndClaims';
import { DOCUCOMP_COMPONENTS_FIXTURE } from '../services/docucompService';

interface RosettaViewerProps {
  mission: UxSMission;
}

const statusClass = (status: RosettaFieldMapping['status']) => {
  switch (status) {
    case 'SYNCHRONIZED': return 'text-emerald-300 border-emerald-800/70 bg-emerald-950/20';
    case 'DRIFT_DETECTED': return 'text-amber-300 border-amber-800/70 bg-amber-950/20';
    case 'PROJECTION_READY': return 'text-cyan-300 border-cyan-800/70 bg-cyan-950/20';
    case 'MISSING_SOURCE': return 'text-rose-300 border-rose-800/70 bg-rose-950/20';
    default: return 'text-slate-400 border-slate-800 bg-slate-950/20';
  }
};

const valueText = (value: any) => typeof value === 'object' ? JSON.stringify(value) : String(value ?? 'UNKNOWN');

export const RosettaViewer: React.FC<RosettaViewerProps> = ({ mission }) => {
  const [selectedKey, setSelectedKey] = useState(SEED_ROSETTA_MAPPINGS[0]?.canonicalKey || '');
  const selectedMapping = SEED_ROSETTA_MAPPINGS.find((mapping) => mapping.canonicalKey === selectedKey) || SEED_ROSETTA_MAPPINGS[0];

  const matchedComp = useMemo(() => {
    if (!selectedMapping?.docucompSlot) return null;
    return DOCUCOMP_COMPONENTS_FIXTURE.find((component) =>
      component.observedIsoSlots.some((slot) =>
        selectedMapping.docucompSlot?.includes(slot) || slot.includes(selectedMapping.docucompSlot || '')
      )
    ) || null;
  }, [selectedMapping]);

  if (!selectedMapping) {
    return <div className="flex-1 flex items-center justify-center bg-[#060b14] text-slate-500">No Rosetta mappings loaded.</div>;
  }

  const translationRows = [
    { label: 'NOAA profile', value: selectedMapping.sidProfileRequirement, tone: 'text-cyan-300' },
    { label: 'ISO 19115-2', value: selectedMapping.isoXPath, tone: 'text-blue-300' },
    { label: 'DocuComp', value: selectedMapping.docucompSlot || 'No reusable component slot required', tone: 'text-purple-300' },
    { label: 'CoMET', value: selectedMapping.cometFormField, tone: 'text-amber-300' },
    { label: 'STAC', value: selectedMapping.stacExtensionKey || 'properties.custom', tone: 'text-emerald-300' },
    { label: 'DCAT', value: selectedMapping.dcatProperty || 'dcat:theme', tone: 'text-indigo-300' },
  ];

  return (
    <div id="rosetta-viewer-workspace" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      <header className="px-7 py-5 border-b border-slate-800 bg-[#07101c] flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Rosetta</h2>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            See how one accepted mission fact is expressed across each downstream contract without turning those contracts into competing truth.
          </p>
        </div>
        <div className="text-sm text-slate-500">{SEED_ROSETTA_MAPPINGS.length} mapped concepts</div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] overflow-hidden">
        <aside className="border-r border-slate-800 bg-[#050a13] min-h-0 overflow-auto p-3">
          <div className="px-2 py-2 text-xs text-slate-600">Canonical facts</div>
          <div className="space-y-1.5">
            {SEED_ROSETTA_MAPPINGS.map((mapping) => {
              const selected = mapping.canonicalKey === selectedMapping.canonicalKey;
              return (
                <button
                  key={mapping.canonicalKey}
                  onClick={() => setSelectedKey(mapping.canonicalKey)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${selected ? 'border-cyan-700/60 bg-cyan-950/15' : 'border-transparent hover:border-slate-800 hover:bg-[#07101c]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">{mapping.displayName}</div>
                      <div className="mt-1 text-xs text-slate-500 truncate">{valueText(mapping.canonicalValue)}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${statusClass(mapping.status)}`}>{mapping.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-8 lg:px-12 lg:py-10">
            <section>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded border ${statusClass(selectedMapping.status)}`}>{selectedMapping.status}</span>
                <span className="text-xs text-slate-600">{selectedMapping.evidenceSourceCount} evidence sources</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-100">{selectedMapping.displayName}</h3>
              <div className="mt-2 text-xs text-slate-500 font-mono break-all">{selectedMapping.canonicalKey}</div>
              <div className="mt-6 text-xl text-cyan-200 break-words">{valueText(selectedMapping.canonicalValue)}</div>
            </section>

            <section className="mt-10 border-t border-slate-800">
              {translationRows.map((row, index) => (
                <div key={row.label} className="py-5 grid grid-cols-1 md:grid-cols-[150px_28px_1fr] gap-2 md:gap-4 items-start border-b border-slate-800">
                  <div className={`text-sm font-medium ${row.tone}`}>{row.label}</div>
                  <div className="hidden md:block text-slate-700">→</div>
                  <div className={`text-sm leading-7 ${index === 1 ? 'font-mono text-xs break-all text-slate-300' : 'text-slate-300'}`}>{row.value}</div>
                </div>
              ))}
            </section>

            <details className="mt-8 border border-slate-800 rounded-xl bg-[#050a13] group">
              <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-200">Technical mapping details</div>
                  <div className="mt-1 text-xs text-slate-600">Exact slots, component IDs, and external-reference metadata</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 pt-1 space-y-5 border-t border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-2 md:gap-6 text-sm">
                  <div className="text-slate-500">Mission</div>
                  <div className="text-slate-300">{mission.id} · {mission.title}</div>
                  <div className="text-slate-500">ISO XPath</div>
                  <code className="text-xs text-cyan-300 break-all">{selectedMapping.isoXPath}</code>
                  <div className="text-slate-500">DocuComp slot</div>
                  <div className="text-slate-300 break-all">{selectedMapping.docucompSlot || 'N/A'}</div>
                </div>

                {matchedComp && (
                  <div className="rounded-lg border border-purple-900/40 bg-purple-950/10 p-4">
                    <div className="text-sm text-purple-300">Resolved fixture component</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 text-xs">
                      <div className="text-slate-600">Title</div><div className="text-slate-300">{matchedComp.title}</div>
                      <div className="text-slate-600">UUID</div><div className="text-slate-300 break-all">{matchedComp.uuid}</div>
                      <div className="text-slate-600">Href</div><div className="text-slate-300 break-all">{matchedComp.href}</div>
                      <div className="text-slate-600">State</div><div className="text-slate-300">{matchedComp.resolutionState}</div>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
        </main>
      </div>
    </div>
  );
};
