import React from 'react';
import {
  GripHorizontal,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  SplitSquareVertical
} from 'lucide-react';
import { PaneFocusMode } from '../../types';

interface FocusSeamProps {
  onDragStart: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onSwapPanes: () => void;
  onFocusPrimary: () => void;
  onFocusSecondary: () => void;
  focusMode: PaneFocusMode;
}

export const FocusSeam: React.FC<FocusSeamProps> = ({
  onDragStart,
  onDoubleClick,
  onSwapPanes,
  onFocusPrimary,
  onFocusSecondary,
  focusMode,
}) => {
  return (
    <div
      id="manta-focus-seam"
      onMouseDown={onDragStart}
      onDoubleClick={onDoubleClick}
      className="w-full h-2.5 bg-[#030711] hover:bg-[#071328] border-y border-cyan-500/20 hover:border-cyan-400/50 flex items-center justify-center cursor-row-resize select-none relative group transition-colors z-30"
      title="Drag to resize panes, double-click for balanced 55/45 layout"
    >
      {/* Seam Central Grip */}
      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1 rounded-full bg-cyan-400" />
        <div className="w-8 h-1 rounded-full bg-cyan-400" />
        <div className="w-1.5 h-1 rounded-full bg-cyan-400" />
      </div>

      {/* Floating Action Seam Controls (Visible on Hover) */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#09152b] border border-cyan-500/40 rounded-full px-2 py-0.5 shadow-xl text-slate-300 z-40 animate-in fade-in duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onSwapPanes}
          className="p-1 hover:text-cyan-300 hover:bg-[#0e2144] rounded-full transition-colors"
          title="Swap Top and Bottom Pane Workspaces"
        >
          <ArrowUpDown className="w-3 h-3" />
        </button>

        <button
          onClick={onDoubleClick}
          className="p-1 hover:text-cyan-300 hover:bg-[#0e2144] rounded-full transition-colors text-[9px] font-mono font-semibold px-1"
          title="Reset to Balanced 55/45 View"
        >
          55/45
        </button>

        <button
          onClick={focusMode === 'PRIMARY_FOCUSED' ? onFocusSecondary : onFocusPrimary}
          className="p-1 hover:text-cyan-300 hover:bg-[#0e2144] rounded-full transition-colors"
          title={focusMode === 'PRIMARY_FOCUSED' ? 'Focus Bottom' : 'Focus Top'}
        >
          <SplitSquareVertical className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
