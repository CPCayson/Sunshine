import React, { useState } from 'react';
import {
  X,
  GitBranch,
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { KnowledgeNode, KnowledgeEdge } from '../../types';
import { BuiltGraph, findSemanticPath } from '../../services/knowledgeGraphBuilder';

interface PathExplainerModalProps {
  graph: BuiltGraph;
  initialStartNodeId?: string;
  initialEndNodeId?: string;
  onClose: () => void;
  onHighlightPath: (nodeIds: string[], edgeIds: string[]) => void;
}

export const PathExplainerModal: React.FC<PathExplainerModalProps> = ({
  graph,
  initialStartNodeId,
  initialEndNodeId,
  onClose,
  onHighlightPath,
}) => {
  const [startId, setStartId] = useState<string>(initialStartNodeId || 'inst-model-minsas');
  const [endId, setEndId] = useState<string>(initialEndNodeId || 'domain-seafloor-mapping');

  const presets = [
    {
      label: 'Kraken MINSAS ↔ Seafloor Mapping',
      from: 'inst-model-minsas',
      to: 'domain-seafloor-mapping',
    },
    {
      label: 'Fleet Registry #6401 ↔ CoMET Ingest Destination',
      from: 'art-fleet-inventory',
      to: 'auth-comet-dest',
    },
    {
      label: 'Dive 01 ↔ Acoustic Backscatter GeoTIFF',
      from: 'dep-dive-01',
      to: 'dataset-backscatter-mosaic',
    },
    {
      label: 'REMUS 620 Model ↔ Ocean STAC Collection',
      from: 'plat-model-remus620',
      to: 'proj-stac-collection',
    },
    {
      label: 'DocuComp Contact ↔ CoMET Validation Pass',
      from: 'comp-docucomp-contact',
      to: 'rec-val-comet-pass',
    },
  ];

  const pathResult = findSemanticPath(graph, startId, endId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="path-explainer-modal"
        className="w-full max-w-2xl bg-[#070e1d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#0a1428] border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                SEMANTIC PATH & RELATIONSHIP EXPLAINER
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Calculates and explains the exact ontological chain connecting any two entities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-mono">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Recommended Transversal Inquiries:</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setStartId(preset.from);
                    setEndId(preset.to);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    startId === preset.from && endId === preset.to
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500 font-semibold'
                      : 'bg-[#050a14] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Node Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#050a16] border border-slate-800 rounded-xl">
            <div>
              <label className="block text-[10px] uppercase font-bold text-cyan-400 mb-1.5">
                Starting Entity (Origin)
              </label>
              <select
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                className="w-full bg-[#081224] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.kind}] {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-purple-400 mb-1.5">
                Target Entity (Destination)
              </label>
              <select
                value={endId}
                onChange={(e) => setEndId(e.target.value)}
                className="w-full bg-[#081224] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.kind}] {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Path Results */}
          {pathResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Discovered Path ({pathResult.pathNodeIds.length - 1} Hops)</span>
                </span>
                <button
                  onClick={() => {
                    onHighlightPath(
                      pathResult.pathNodeIds,
                      pathResult.pathEdges.map((e) => e.id)
                    );
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-cyan-950"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Highlight on Graph Canvas</span>
                </button>
              </div>

              {/* Step by step chain */}
              <div className="space-y-2 p-4 bg-[#050a16] border border-cyan-500/20 rounded-xl">
                {pathResult.explanation.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#081224] border border-slate-800 rounded-lg text-slate-200 text-xs flex items-center gap-2 font-mono leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-cyan-200">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-slate-300 font-bold text-sm">No Direct Ontological Path Found</div>
              <p className="text-slate-500 text-xs font-sans">
                These two entities belong to isolated or disjointed semantic subgraphs. Try selecting a broader domain or platform node.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
