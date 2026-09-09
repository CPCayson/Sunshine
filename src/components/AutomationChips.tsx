import React from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Building,
  Tag,
  Ship,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface AutomationChipsProps {
  onRunAutomation: (type: 'suggest_gcmd' | 'normalize_dates' | 'infer_bbox' | 'resolve_ror' | 'validate_doi') => void;
  isLoading: boolean;
}

export const AutomationChips: React.FC<AutomationChipsProps> = ({
  onRunAutomation,
  isLoading,
}) => {
  return (
    <div className="bg-[#09111e] border-y border-cyan-500/20 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
          Automations (Contextual Actions):
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          id="chip-suggest-gcmd"
          disabled={isLoading}
          onClick={() => onRunAutomation('suggest_gcmd')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1d33] hover:bg-[#162a4a] text-xs font-mono text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <Tag className="w-3 h-3 text-cyan-400" />
          <span>Suggest GCMD</span>
        </button>

        <button
          id="chip-normalize-dates"
          disabled={isLoading}
          onClick={() => onRunAutomation('normalize_dates')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1d33] hover:bg-[#162a4a] text-xs font-mono text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <Calendar className="w-3 h-3 text-cyan-400" />
          <span>Normalize Dates</span>
        </button>

        <button
          id="chip-infer-bbox"
          disabled={isLoading}
          onClick={() => onRunAutomation('infer_bbox')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1d33] hover:bg-[#162a4a] text-xs font-mono text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <MapPin className="w-3 h-3 text-cyan-400" />
          <span>Infer BBox</span>
        </button>

        <button
          id="chip-resolve-ror"
          disabled={isLoading}
          onClick={() => onRunAutomation('resolve_ror')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1d33] hover:bg-[#162a4a] text-xs font-mono text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <Building className="w-3 h-3 text-cyan-400" />
          <span>Resolve ROR</span>
        </button>

        <button
          id="chip-validate-doi"
          disabled={isLoading}
          onClick={() => onRunAutomation('validate_doi')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1d33] hover:bg-[#162a4a] text-xs font-mono text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <CheckCircle className="w-3 h-3 text-cyan-400" />
          <span>Validate DOI</span>
        </button>
      </div>
    </div>
  );
};
