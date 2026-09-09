import React, { useMemo } from 'react';
import { Search, CheckCircle2, CircleHelp, Network, Tags, Waypoints } from 'lucide-react';
import { FederatedSearchResult } from '../types';
import {
  EX2102_ONESTOP_SEARCHABILITY,
  SearchabilityProbe,
  buildSelectedRecordSearchIntents,
} from '../services/searchabilityService';

interface SearchabilityLensProps {
  selectedResult: FederatedSearchResult;
}

const stateClass = (state: SearchabilityProbe['state']) => {
  switch (state) {
    case 'OBSERVED':
      return 'text-emerald-300 border-emerald-700/60 bg-emerald-950/40';
    case 'DOCUMENTED':
      return 'text-cyan-300 border-cyan-700/60 bg-cyan-950/40';
    case 'HYPOTHESIS':
      return 'text-amber-300 border-amber-700/60 bg-amber-950/40';
    default:
      return 'text-slate-400 border-slate-700 bg-slate-900/60';
  }
};

const pathwayLabel = (probe: SearchabilityProbe) => {
  if (probe.observedPathway === 'BOTH') return `TEXT + ${probe.facetField || 'gcmd*'}`;
  if (probe.observedPathway === 'TEXT') return 'TEXT';
  if (probe.observedPathway === 'STRUCTURED') return probe.facetField || 'STRUCTURED';
  return 'NOT MEASURED';
};

export const SearchabilityLens: React.FC<SearchabilityLensProps> = ({ selectedResult }) => {
  const selectedRecordProbes = useMemo(
    () => buildSelectedRecordSearchIntents(selectedResult),
    [selectedResult]
  );

  const ex = EX2102_ONESTOP_SEARCHABILITY;

  return (
    <section className="rounded-xl border border-violet-500/25 bg-[#080d18] overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-500/20 bg-violet-950/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-300" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-200 font-mono">
                Searchability Lens
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
              Tests whether metadata meaning survives into discovery. XML validity does not imply discoverability.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded border border-violet-700/50 text-violet-300 bg-violet-950/30 whitespace-nowrap">
            READ ONLY
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <Metric label="Keywords" value={ex.summary.totalKeywords} />
          <Metric label="Text only" value={ex.summary.textOnly} />
          <Metric label="Text + facet" value={ex.summary.both} />
          <Metric label="Structured only" value={ex.summary.structuredOnly} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#050912] p-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Measured reference — EX2102</span>
            <span className="ml-auto text-slate-500">{ex.measuredAt}</span>
          </div>
          <div className="space-y-2">
            {ex.probes.map((probe) => (
              <ProbeRow key={probe.id} probe={probe} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#050912] p-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 mb-2">
            <CircleHelp className="w-3.5 h-3.5 text-amber-400" />
            <span>Generated intents for selected record</span>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">
            These are test candidates only. They are not marked discoverable until OneStop is actually queried and the result is captured.
          </p>
          <div className="space-y-2">
            {selectedRecordProbes.map((probe) => (
              <ProbeRow key={probe.id} probe={probe} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
          <Doctrine icon={<Tags className="w-3.5 h-3.5" />} label="Schema" value="where" />
          <Doctrine icon={<Network className="w-3.5 h-3.5" />} label="Ontology" value="meaning" />
          <Doctrine icon={<Waypoints className="w-3.5 h-3.5" />} label="OneStop" value="what survived" />
        </div>
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2">
    <div className="text-base font-semibold text-slate-100 font-mono">{value}</div>
    <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
  </div>
);

const ProbeRow: React.FC<{ probe: SearchabilityProbe }> = ({ probe }) => (
  <div className="rounded-md border border-slate-800 bg-slate-950/50 px-2.5 py-2">
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            {probe.dimension}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${stateClass(probe.state)}`}>
            {probe.state}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 text-cyan-300 bg-cyan-950/20 font-mono">
            {pathwayLabel(probe)}
          </span>
        </div>
        <div className="text-[11px] text-slate-200 mt-1">{probe.label}</div>
        <div className="text-[11px] text-violet-300 font-mono truncate">“{probe.query}”</div>
        {probe.note && <div className="text-[9px] text-slate-500 mt-1">{probe.note}</div>}
      </div>
    </div>
  </div>
);

const Doctrine: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-2 text-slate-400">
    <span className="text-violet-300">{icon}</span>
    <span className="text-slate-300">{label}</span>
    <span className="text-slate-600">=</span>
    <span>{value}</span>
  </div>
);
