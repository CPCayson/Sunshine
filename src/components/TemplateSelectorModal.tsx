import React from 'react';
import { INITIAL_MISSIONS } from '../data/missions';
import { UxSMission } from '../types';
import { X, Ship, Compass, Calendar, Check, Plus } from 'lucide-react';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMission: (mission: UxSMission) => void;
  currentMissionId: string;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMission,
  currentMissionId,
}) => {
  if (!isOpen) return null;

  const handleCreateBlank = () => {
    const blank: UxSMission = {
      id: `NOAA_UxS_Mission_${Date.now().toString().slice(-4)}`,
      title: 'New NOAA Uncrewed Systems (UxS) Marine Survey',
      alternateTitle: '',
      abstract: 'Autonomous survey conducting oceanographic environmental sampling, acoustic bathymetry, and hydrographic data collection.',
      purpose: 'Baseline environmental monitoring and geospatial mapping.',
      supplementalInfo: '',
      status: 'planned',
      resourceType: 'dataset',
      dateStart: new Date().toISOString().split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      publicationDate: new Date().toISOString().split('T')[0],
      language: 'eng - English',
      topicCategory: ['oceans'],
      platform: {
        name: 'NOAA Survey Platform',
        callSign: 'W-NEW',
        type: 'uncrewed system',
        uxsCategory: 'UUV',
      },
      instruments: ['MultiBeam Sonar', 'CTD Sensor'],
      spatialExtent: {
        west: -70.0,
        south: 35.0,
        east: -65.0,
        north: 40.0,
        placeName: 'North Atlantic Survey Sector',
      },
      keywords: {
        gcmdScience: ['Oceans > Bathymetry/Seafloor Topography > Bathymetry'],
        gcmdPlatforms: ['In Situ Ocean-based Platforms > UNCREWED UNDERWATER VEHICLES'],
        freeKeywords: ['UxS', 'Seafloor Mapping'],
      },
      contact: {
        name: 'Chief Scientist',
        email: 'ncei.info@noaa.gov',
        role: 'pointOfContact',
        organization: 'NOAA NCEI',
        rorId: 'https://ror.org/02z5n2526',
      },
      conformanceScore: 78,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    onSelectMission(blank);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#09111e] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0d182b] border-b border-cyan-500/20 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-cyan-100 font-sans">
              NOAA NCEI UxS Mission Templates
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an authentic expedition record to load into the CoMET companion workbench.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-200 hover:bg-[#13233c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Templates List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {INITIAL_MISSIONS.map((mission) => {
            const isSelected = mission.id === currentMissionId;
            return (
              <div
                key={mission.id}
                onClick={() => {
                  onSelectMission(mission);
                  onClose();
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/50'
                    : 'bg-[#0c1626] border-cyan-500/20 hover:border-cyan-500/50 hover:bg-[#101d32]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                        {mission.platform.uxsCategory}
                      </span>
                      <span className="text-xs font-semibold text-cyan-100">
                        {mission.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {mission.abstract}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Ship className="w-3 h-3" />
                        {mission.platform.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        {mission.spatialExtent.placeName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {mission.dateStart} to {mission.dateEnd}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500 text-slate-950 shrink-0 mt-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#0d182b] border-t border-cyan-500/20 flex items-center justify-between">
          <button
            onClick={handleCreateBlank}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12233c] hover:bg-[#1a3357] text-xs font-mono text-cyan-200 border border-cyan-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Blank Record</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#101c30] hover:bg-[#162742] text-xs text-slate-300 border border-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
