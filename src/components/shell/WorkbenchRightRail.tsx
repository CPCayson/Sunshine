import React from 'react';
import { ActiveWorkspaceTab } from '../../types';
import { ProjectionFormat } from '../ProjectionsWorkspace';

interface WorkbenchRightRailProps {
  activeWorkspace: ActiveWorkspaceTab;
  activeProjectionFormat: ProjectionFormat;
  onOpenProjection: (format: ProjectionFormat) => void;
  onOpenWorkspace: (tab: ActiveWorkspaceTab) => void;
}

interface RailItem {
  id: string;
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
}

const RailButton: React.FC<{ item: RailItem }> = ({ item }) => (
  <button
    type="button"
    onClick={item.onClick}
    className={`w-full px-2 py-3 text-left border-l transition-colors ${
      item.active
        ? 'border-cyan-300 bg-cyan-950/20 text-slate-100'
        : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-900/40'
    }`}
    aria-current={item.active ? 'page' : undefined}
  >
    <div className="text-[11px] font-medium leading-none">{item.label}</div>
    {item.sublabel && <div className="mt-1 text-[9px] leading-tight text-slate-600">{item.sublabel}</div>}
  </button>
);

export const WorkbenchRightRail: React.FC<WorkbenchRightRailProps> = ({
  activeWorkspace,
  activeProjectionFormat,
  onOpenProjection,
  onOpenWorkspace,
}) => {
  const transformItems: RailItem[] = [
    {
      id: 'iso',
      label: 'ISO XML',
      sublabel: '19115-2',
      active: activeWorkspace === 'projections' && activeProjectionFormat === 'ISO',
      onClick: () => onOpenProjection('ISO'),
    },
    {
      id: 'stac',
      label: 'STAC',
      sublabel: 'Item',
      active: activeWorkspace === 'projections' && activeProjectionFormat === 'STAC',
      onClick: () => onOpenProjection('STAC'),
    },
    {
      id: 'dcat',
      label: 'DCAT',
      sublabel: 'US 3.0',
      active: activeWorkspace === 'projections' && activeProjectionFormat === 'DCAT',
      onClick: () => onOpenProjection('DCAT'),
    },
    {
      id: 'oiss',
      label: 'OISS',
      sublabel: 'handoff',
      active: activeWorkspace === 'projections' && activeProjectionFormat === 'OISS',
      onClick: () => onOpenProjection('OISS'),
    },
  ];

  const authorityItems: RailItem[] = [
    {
      id: 'comet',
      label: 'CoMET',
      sublabel: 'companion',
      active: activeWorkspace === 'comet',
      onClick: () => onOpenWorkspace('comet'),
    },
    {
      id: 'compare',
      label: 'Compare',
      sublabel: 'destinations',
      active: activeWorkspace === 'destination-compare',
      onClick: () => onOpenWorkspace('destination-compare'),
    },
  ];

  const exploreItems: RailItem[] = [
    {
      id: 'constellation',
      label: 'Constellation',
      sublabel: 'similarity',
      active: activeWorkspace === 'constellation',
      onClick: () => onOpenWorkspace('constellation'),
    },
    {
      id: 'graph',
      label: 'Graph',
      sublabel: 'relationships',
      active: activeWorkspace === 'graph',
      onClick: () => onOpenWorkspace('graph'),
    },
  ];

  return (
    <aside
      id="workbench-right-rail"
      className="w-[92px] shrink-0 border-l border-slate-900 bg-[#050a12] overflow-y-auto no-scrollbar"
      aria-label="Workbench transformer rail"
    >
      <div className="py-4">
        <div className="px-2 pb-2 text-[9px] uppercase tracking-[0.16em] text-slate-700">Transform</div>
        {transformItems.map((item) => <RailButton key={item.id} item={item} />)}
      </div>

      <div className="border-t border-slate-900 py-4">
        <div className="px-2 pb-2 text-[9px] uppercase tracking-[0.16em] text-slate-700">Authority</div>
        {authorityItems.map((item) => <RailButton key={item.id} item={item} />)}
      </div>

      <div className="border-t border-slate-900 py-4">
        <div className="px-2 pb-2 text-[9px] uppercase tracking-[0.16em] text-slate-700">Explore</div>
        {exploreItems.map((item) => <RailButton key={item.id} item={item} />)}
      </div>
    </aside>
  );
};
