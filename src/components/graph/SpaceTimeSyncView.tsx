import React from 'react';
import {
  Compass,
  Calendar,
  Clock,
  Layers,
  MapPin,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { KnowledgeNode, SpatialExtent } from '../../types';
import { InteractiveOceanMap } from '../InteractiveOceanMap';

interface SpaceTimeSyncViewProps {
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}

export const SpaceTimeSyncView: React.FC<SpaceTimeSyncViewProps> = ({
  selectedNodeId,
  onSelectNode,
}) => {
  const dives = [
    {
      id: 'dep-dive-01',
      label: 'EN2501 Dive 01 (Penguin Bank SAS)',
      date: '2025-06-03 04:15 UTC',
      duration: '14.2 hours',
      coords: { lat: 21.05, lng: -157.55 },
      depth: '50m – 220m',
      sensor: 'Kraken MINSAS-120 SAS',
    },
    {
      id: 'dep-dive-02',
      label: 'EN2501 Dive 02 (Kaiwi Trough Deep Hydrography)',
      date: '2025-06-13 02:00 UTC',
      duration: '18.5 hours',
      coords: { lat: 21.28, lng: -157.32 },
      depth: '400m – 1,250m',
      sensor: 'Kraken MINSAS + FastCAT CTD',
    },
    {
      id: 'dep-dive-03',
      label: 'EN2501 Dive 03 (Molokai Optical Recon)',
      date: '2025-06-16 08:30 UTC',
      duration: '11.8 hours',
      coords: { lat: 21.18, lng: -157.10 },
      depth: '120m – 680m',
      sensor: 'Voyis Laser Camera',
    },
  ];

  const currentExtent: SpatialExtent = {
    west: -158.45,
    south: 20.85,
    east: -156.95,
    north: 21.65,
    placeName: 'Hawaiian Ridge & Kaiwi Channel Autonomous Survey Corridor',
    polygon: [
      [21.65, -158.45],
      [21.65, -156.95],
      [20.85, -156.95],
      [20.85, -158.45],
    ],
  };

  return (
    <div
      id="space-time-sync-view"
      className="p-4 bg-[#050a16] border border-cyan-500/20 rounded-xl space-y-4 text-xs font-mono text-slate-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">
            SpatioTemporal Trajectory & Chronology Sync
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
          Geographic Bounds: 20.85°N to 21.65°N
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dive Chronology List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">
            Sequential Operational Deployments
          </div>
          <div className="space-y-2">
            {dives.map((dive, idx) => {
              const isSelected = selectedNodeId === dive.id;
              return (
                <div
                  key={dive.id}
                  onClick={() => onSelectNode(dive.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 text-slate-100 shadow-lg shadow-cyan-950/50'
                      : 'bg-[#081224] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#0a162c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Dive 0{idx + 1}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{dive.duration}</span>
                  </div>

                  <div className="text-xs font-bold font-sans mt-1">{dive.label}</div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <div>
                      <span className="text-slate-500">Time:</span> {dive.date}
                    </div>
                    <div>
                      <span className="text-slate-500">Depth:</span> {dive.depth}
                    </div>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    <span className="text-slate-500">Payload:</span> <strong className="text-slate-200">{dive.sensor}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Embedded Interactive Map Preview */}
        <div className="lg:col-span-7 h-[280px] bg-[#02050c] border border-slate-800 rounded-xl overflow-hidden relative">
          <InteractiveOceanMap
            extent={currentExtent}
            onChangeExtent={() => {}}
            missionTitle="EN2501 Autonomous Survey Grid"
            diveTrackPolygon={currentExtent.polygon}
          />
        </div>
      </div>
    </div>
  );
};
