import React from 'react';
import {
  X,
  Activity,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  FileCode,
  Database
} from 'lucide-react';
import { KnowledgeNode } from '../../types';
import { BuiltGraph, computeDependencyBlastRadius } from '../../services/knowledgeGraphBuilder';

interface BlastRadiusModalProps {
  graph: BuiltGraph;
  nodeId: string;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const BlastRadiusModal: React.FC<BlastRadiusModalProps> = ({
  graph,
  nodeId,
  onClose,
  onSelectNode,
}) => {
  const centralNode = graph.nodes.find((n) => n.id === nodeId);
  const impacts = computeDependencyBlastRadius(graph, nodeId);

  const getImpactBadge = (status: string) => {
    switch (status) {
      case 'REPROJECT_REQUIRED':
        return 'bg-amber-950 text-amber-300 border-amber-600/50';
      case 'REVALIDATE_REQUIRED':
        return 'bg-rose-950 text-rose-300 border-rose-600/50';
      case 'STALE':
        return 'bg-purple-950 text-purple-300 border-purple-600/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="blast-radius-modal"
        className="w-full max-w-2xl bg-[#070e1d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#0a1428] border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                DEPENDENCY & BLAST RADIUS INSPECTOR
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Evaluates which downstream projections, validation states, and datasets depend on this canonical fact.
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
          {/* Central Fact Card */}
          <div className="p-4 bg-[#050a16] border border-cyan-500/40 rounded-xl space-y-1">
            <div className="text-[10px] text-cyan-400 uppercase font-bold">Focal Canonical Entity</div>
            <div className="text-base font-bold text-slate-100 font-sans">
              {centralNode?.label || nodeId}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Kind: [{centralNode?.kind}] | State: {centralNode?.state || 'ACCEPTED'}
            </div>
          </div>

          {/* Impact Breakdown List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-300">
                Direct & Downstream Blast Radius ({impacts.length} Impacted Entities)
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                Cascade Trigger Ready
              </span>
            </div>

            {impacts.length > 0 ? (
              <div className="space-y-2.5">
                {impacts.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#081224] border border-slate-800 rounded-xl space-y-2 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">
                          [{imp.node.kind}]
                        </span>
                        <span className="text-slate-100 font-bold font-sans text-xs">
                          {imp.node.label}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${getImpactBadge(imp.impactStatus)}`}>
                        {imp.impactStatus}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {imp.reason}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Connected via: <strong className="text-cyan-400">{imp.relationship}</strong>
                      </span>
                      <button
                        onClick={() => {
                          onSelectNode(imp.node.id);
                          onClose();
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-200 font-bold flex items-center gap-1"
                      >
                        <span>Focus Node</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-400 font-sans text-xs">
                No active external projections or downstream datasets depend directly on this node.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
