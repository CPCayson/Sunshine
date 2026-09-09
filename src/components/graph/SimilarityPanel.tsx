import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  Compass
} from 'lucide-react';
import { UxSMission } from '../../types';
import { computeExplainableSimilarity } from '../../services/knowledgeGraphBuilder';

interface SimilarityPanelProps {
  mission: UxSMission;
  onClose?: () => void;
}

export const SimilarityPanel: React.FC<SimilarityPanelProps> = ({ mission }) => {
  const [targetComparison, setTargetComparison] = useState<'EX2503' | 'Dive02'>('EX2503');

  const similarity = computeExplainableSimilarity(
    mission,
    targetComparison === 'EX2503' ? 'EX2503_Mission_PED' : 'dep-dive-02'
  );

  return (
    <div
      id="similarity-breakdown-panel"
      className="p-4 bg-[#060c18] border border-cyan-500/20 rounded-xl space-y-4 text-xs font-mono text-slate-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">
            Explainable Multi-Vector Similarity Engine
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[#040812] border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setTargetComparison('EX2503')}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              targetComparison === 'EX2503'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            vs EX2503 Okeanos
          </button>
          <button
            onClick={() => setTargetComparison('Dive02')}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              targetComparison === 'Dive02'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            vs EN2501 Dive 02
          </button>
        </div>
      </div>

      {/* Target Heading & Overall Score */}
      <div className="p-3.5 bg-[#081224] border border-cyan-500/30 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-[10px] text-cyan-400 uppercase font-bold">Comparison Target</div>
          <div className="text-sm font-bold text-slate-100 font-sans mt-0.5">{similarity.targetLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Overall Match</div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {(similarity.overallScore * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 8-Dimensional Breakdown */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
          <span>Component Breakdown (Deterministic Vector Contribution)</span>
          <span className="text-[9px] text-slate-500">No fabricated percentages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(similarity.components).map(([key, val]) => (
            <div key={key} className="p-2 bg-[#040812] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-cyan-300 font-bold font-mono">{(val * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${val * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Features vs Divergent Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        <div className="space-y-2 p-3 bg-[#040916] border border-emerald-900/30 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Shared Ontological Features</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-300 font-sans">
            {similarity.sharedFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 p-3 bg-[#040916] border border-amber-900/30 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Divergent Dimensions</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-300 font-sans">
            {similarity.differentFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
