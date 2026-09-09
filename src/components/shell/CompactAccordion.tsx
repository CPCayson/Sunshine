import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export interface CompactAccordionProps {
  id?: string;
  title: string;
  primaryValue?: React.ReactNode;
  badge?: {
    label: string;
    variant?: 'emerald' | 'cyan' | 'amber' | 'purple' | 'slate' | 'rose';
  };
  count?: number | string;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const CompactAccordion: React.FC<CompactAccordionProps> = ({
  id,
  title,
  primaryValue,
  badge,
  count,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
  children,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(next);
    }
    onToggle?.(next);
  };

  const getBadgeStyle = (variant: string = 'slate') => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50';
      case 'cyan':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50';
      case 'amber':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/50';
      case 'purple':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/50';
      case 'rose':
        return 'bg-rose-950/70 text-rose-300 border-rose-700/50';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      id={id}
      className={`border-b border-slate-800/80 transition-colors last:border-b-0 ${
        isExpanded ? 'bg-[#081120]/40' : 'hover:bg-[#070e1a]/50'
      } ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full py-2.5 px-3 flex items-center justify-between text-left font-mono select-none group"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
          <ChevronRight
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 group-hover:text-cyan-400 ${
              isExpanded ? 'rotate-90 text-cyan-400' : ''
            }`}
          />
          <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 truncate">
            {title}
          </span>
          {count !== undefined && (
            <span className="text-[10px] text-slate-500 font-normal">
              ({count})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {primaryValue && (
            <div className="text-xs text-slate-400 max-w-[200px] truncate text-right">
              {primaryValue}
            </div>
          )}
          {badge && (
            <span
              className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${getBadgeStyle(
                badge.variant
              )}`}
            >
              {badge.label}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 text-xs font-sans text-slate-300 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
