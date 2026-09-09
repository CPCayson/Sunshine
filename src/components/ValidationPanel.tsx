import React, { useState } from 'react';
import { ValidationIssue } from '../types';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ValidationPanelProps {
  issues: ValidationIssue[];
  score: number;
  onApplyFix: (issue: ValidationIssue) => void;
  onAutoFixAll: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  score,
  onApplyFix,
  onAutoFixAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');
  const infos = issues.filter((i) => i.type === 'info');
  const fixableCount = issues.filter((i) => i.autoFixable).length;

  const filteredIssues =
    filter === 'all'
      ? issues
      : issues.filter((i) => i.type === filter);

  return (
    <div id="validation-panel-container" className="flex-1 flex flex-col bg-[#070c17] text-slate-200 overflow-y-auto p-4 space-y-4 font-sans">
      {/* Score Summary Donut / Header matching Image 3 */}
      <div className="bg-[#0c1526] border border-cyan-500/25 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          {/* Circular Score Badge */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#080e1b] border-2 border-cyan-500/40 shadow-inner">
            <span className="text-xl font-bold font-mono text-cyan-200">{score}%</span>
            <span className="absolute -bottom-1 text-[9px] font-mono uppercase bg-cyan-950 px-1 rounded text-cyan-400 border border-cyan-700/50">
              Quality
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-cyan-100 flex items-center gap-1.5">
              <span>Validation Summary</span>
              <span className="text-xs font-mono text-slate-400">({issues.length} total issues)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated against <span className="text-cyan-300 font-mono">ISO 19115-2:2019</span> + NOAA UxS Marine Core rules.
            </p>
          </div>
        </div>

        {fixableCount > 0 && (
          <button
            id="auto-fix-all-btn"
            onClick={onAutoFixAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-semibold text-xs font-mono transition-transform active:scale-95 shadow cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Fix ({fixableCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
            filter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({issues.length})
        </button>

        <button
          onClick={() => setFilter('error')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
            filter === 'error'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>Errors ({errors.length})</span>
        </button>

        <button
          onClick={() => setFilter('warning')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
            filter === 'warning'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Warnings ({warnings.length})</span>
        </button>

        <button
          onClick={() => setFilter('info')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
            filter === 'info'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3 h-3 text-blue-400" />
          <span>Info ({infos.length})</span>
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-10 bg-[#0a1220] border border-cyan-500/20 rounded-xl p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-200">No issues found in this category!</p>
            <p className="text-xs text-slate-400 mt-1">Record conforms to standard metadata requirements.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isError = issue.type === 'error';
            const isWarning = issue.type === 'warning';

            return (
              <div
                key={issue.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isError
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                    : 'bg-blue-950/20 border-blue-500/30 text-blue-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium leading-snug">{issue.message}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-sm">
                        XPath: {issue.path}
                      </p>
                    </div>
                  </div>

                  {issue.autoFixable && issue.fixAction && (
                    <button
                      onClick={() => onApplyFix(issue)}
                      title={issue.fixAction.description}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#10223d] hover:bg-[#18345c] text-[11px] font-mono text-cyan-300 border border-cyan-500/30 transition-colors shrink-0 cursor-pointer"
                    >
                      <Wrench className="w-3 h-3 text-cyan-400" />
                      <span>Fix</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
