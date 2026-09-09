import React, { useState } from 'react';
import {
  Languages,
  ArrowRight,
  Database,
  Code2,
  FileCode,
  Link,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { RosettaFieldMapping, UxSMission } from '../types';
import { SEED_ROSETTA_MAPPINGS } from '../data/evidenceAndClaims';
import { DOCUCOMP_COMPONENTS_FIXTURE } from '../services/docucompService';

interface RosettaViewerProps {
  mission: UxSMission;
}

export const RosettaViewer: React.FC<RosettaViewerProps> = ({ mission }) => {
  const [selectedMapping, setSelectedMapping] = useState<RosettaFieldMapping>(
    SEED_ROSETTA_MAPPINGS[0]
  );

  const getStatusBadge = (status: RosettaFieldMapping['status']) => {
    switch (status) {
      case 'SYNCHRONIZED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'DRIFT_DETECTED':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'PROJECTION_READY':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'MISSING_SOURCE':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="rosetta-viewer-workspace" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="bg-[#091120] border-b border-cyan-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
              ROSETTA SEMANTIC MAPPING ENGINE
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Cross-Authority Translation
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Explains where every canonical fact lives across the UxS Marine Core Profile, ISO 19115-2 XPath, DocuComp XLinks, CoMET forms, and STAC/DCAT projections.
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-[#050912] border border-cyan-500/20 px-3 py-1.5 rounded-lg">
          Synchronized Concepts: {SEED_ROSETTA_MAPPINGS.length} Core Facts
        </div>
      </div>

      {/* Main Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Concept List */}
        <div className="w-full md:w-1/2 lg:w-2/5 border-r border-slate-800 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-mono text-slate-400 pb-1">
            Select a canonical mission fact:
          </div>

          {SEED_ROSETTA_MAPPINGS.map((mapping) => {
            const isSelected = selectedMapping.canonicalKey === mapping.canonicalKey;
            return (
              <div
                key={mapping.canonicalKey}
                id={`rosetta-item-${mapping.canonicalKey.replace('.', '-')}`}
                onClick={() => setSelectedMapping(mapping)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0a1529] border-cyan-500/60 shadow-md'
                    : 'bg-[#080f1e] border-slate-800/80 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-100 font-mono">
                    {mapping.displayName}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getStatusBadge(mapping.status)}`}>
                    {mapping.status}
                  </span>
                </div>

                <div className="text-xs font-mono text-cyan-300 mt-1 truncate">
                  {typeof mapping.canonicalValue === 'object'
                    ? JSON.stringify(mapping.canonicalValue)
                    : String(mapping.canonicalValue)}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span className="truncate max-w-[200px] text-slate-400">
                    XPath: {mapping.isoXPath.split('/').pop()}
                  </span>
                  <span className="text-cyan-400">
                    {mapping.evidenceSourceCount} sources →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Multi-Standard Rosetta Translation Matrix */}
        <div className="w-full md:w-1/2 lg:w-3/5 overflow-y-auto p-6 bg-[#050a14] space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                Canonical Key: <code>{selectedMapping.canonicalKey}</code>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getStatusBadge(selectedMapping.status)}`}>
                {selectedMapping.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-sans mt-1">
              {selectedMapping.displayName}
            </h3>
            <div className="p-2.5 bg-[#08101e] border border-cyan-500/30 rounded-lg text-cyan-300 font-mono text-sm mt-2">
              <span className="text-slate-500 text-xs mr-2">Canonical Value:</span>
              <strong>
                {typeof selectedMapping.canonicalValue === 'object'
                  ? JSON.stringify(selectedMapping.canonicalValue)
                  : String(selectedMapping.canonicalValue)}
              </strong>
            </div>
          </div>

          {/* Matrix of Representation across standard targets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Cross-Authority Representation Matrix
            </h4>

            {/* 1. NOAA UxS Marine Core Profile */}
            <div className="bg-[#08101e] border border-cyan-500/25 rounded-xl p-3.5 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-cyan-300 font-semibold">
                <span>1. NOAA UxS Marine Core Profile Requirement</span>
                <span className="text-[10px] px-1.5 rounded bg-cyan-950 border border-cyan-800">SID Spec</span>
              </div>
              <p className="text-slate-300 font-sans mt-1">
                {selectedMapping.sidProfileRequirement}
              </p>
            </div>

            {/* 2. ISO 19115-2 XPath Element */}
            <div className="bg-[#08101e] border border-blue-500/25 rounded-xl p-3.5 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-blue-300 font-semibold">
                <span>2. ISO 19115-2 Geographic Metadata XPath</span>
                <span className="text-[10px] px-1.5 rounded bg-blue-950 border border-blue-800">ISO 19139</span>
              </div>
              <code className="text-cyan-200 bg-[#040812] p-2 rounded block break-all text-[11px] border border-slate-800">
                {selectedMapping.isoXPath}
              </code>
            </div>

            {/* 3. DocuComp Component Slot */}
            {(() => {
              const matchedComp = selectedMapping.docucompSlot
                ? DOCUCOMP_COMPONENTS_FIXTURE.find(c => c.observedIsoSlots.some(slot => selectedMapping.docucompSlot?.includes(slot) || slot.includes(selectedMapping.docucompSlot || '')))
                : null;

              return (
                <div className="bg-[#08101e] border border-purple-500/25 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-purple-300 font-semibold">
                    <span>3. DocuComp Component Reusable Slot</span>
                    <span className="text-[10px] px-1.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                      Docucomp XLink
                    </span>
                  </div>
                  <p className="text-slate-300 font-mono text-xs">
                    {selectedMapping.docucompSlot || 'N/A (Dynamic Mission Extent)'}
                  </p>
                  {matchedComp && (
                    <div className="bg-[#040812] border border-purple-900/40 p-2.5 rounded-lg space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-500">Component:</span>
                        <span className="font-semibold text-purple-200">{matchedComp.title}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-500">UUID:</span>
                        <span className="text-cyan-300 font-mono text-[10px]">{matchedComp.uuid}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-500">Resolver State:</span>
                        <span className="text-emerald-400 font-bold text-[10px]">RESOLVED (HTTP 200)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 break-all">
                        <code>{matchedComp.href}</code>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 4. CoMET Form Binding */}
            <div className="bg-[#08101e] border border-amber-500/25 rounded-xl p-3.5 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-amber-300 font-semibold">
                <span>4. CoMET Editor UI Tab / Form Field</span>
                <span className="text-[10px] px-1.5 rounded bg-amber-950 border border-amber-800">CoMET UI</span>
              </div>
              <p className="text-slate-300 font-mono text-xs">
                {selectedMapping.cometFormField}
              </p>
            </div>

            {/* 5. STAC & DCAT Projections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#08101e] border border-emerald-500/25 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="text-emerald-300 font-semibold">5. STAC Property / Extension</div>
                <code className="text-slate-300 text-[11px] block mt-1">
                  {selectedMapping.stacExtensionKey || 'properties.custom'}
                </code>
              </div>

              <div className="bg-[#08101e] border border-indigo-500/25 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="text-indigo-300 font-semibold">6. DCAT-US 3.0 Property</div>
                <code className="text-slate-300 text-[11px] block mt-1">
                  {selectedMapping.dcatProperty || 'dcat:theme'}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
