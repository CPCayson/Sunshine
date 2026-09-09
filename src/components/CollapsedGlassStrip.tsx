import React from 'react';
import { ChevronLeft, FileCode2, Sparkles, AlertTriangle } from 'lucide-react';

interface CollapsedGlassStripProps {
  onExpand: () => void;
  score: number;
  issueCount: number;
}

export const CollapsedGlassStrip: React.FC<CollapsedGlassStripProps> = ({
  onExpand,
  score,
  issueCount,
}) => {
  return (
    <div
      onClick={onExpand}
      title="Click to expand Live XML Validator and AI Assistant"
      className="w-12 bg-[#08101d] hover:bg-[#0c182c] border-l border-cyan-500/30 flex flex-col items-center justify-between py-4 cursor-pointer transition-colors shadow-lg group relative select-none"
    >
      {/* Top Expand Arrow */}
      <div className="flex flex-col items-center gap-2">
        <button
          id="expand-glass-strip-btn"
          className="w-8 h-8 rounded-lg bg-[#112038] group-hover:bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30 group-hover:border-cyan-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <FileCode2 className="w-4 h-4 text-cyan-400" />
      </div>

      {/* Vertical Text */}
      <div className="flex-1 flex items-center justify-center my-6">
        <span
          className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          LIVE XML VALIDATOR
        </span>
      </div>

      {/* Bottom Quality Gauge */}
      <div className="flex flex-col items-center gap-2">
        {issueCount > 0 && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
            {issueCount}
          </div>
        )}

        <div className="w-8 h-8 rounded-full bg-[#0d1c32] border border-cyan-500/50 flex items-center justify-center text-xs font-mono font-bold text-cyan-200">
          {score}
        </div>
      </div>
    </div>
  );
};
