import React, { useState } from 'react';
import {
  UxSMission,
  SpatialExtent
} from '../types';
import { InteractiveOceanMap } from './InteractiveOceanMap';
import {
  Check,
  Sparkles,
  HelpCircle,
  Plus,
  X,
  Compass,
  Ship,
  Layers,
  FileText,
  Calendar,
  Building,
  KeyRound,
  Eye,
  ExternalLink,
  Maximize2
} from 'lucide-react';

interface MetadataFormProps {
  mission: UxSMission;
  onChangeMission: (updated: UxSMission) => void;
  onAskAiAboutField: (fieldName: string, currentVal: string) => void;
  onValidateNow: () => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({
  mission,
  onChangeMission,
  onAskAiAboutField,
  onValidateNow,
}) => {
  const [newInstrument, setNewInstrument] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'extent' | 'spatialExtent' | 'platform' | 'keywords' | 'contact'>('overview');

  const handleUpdate = <K extends keyof UxSMission>(key: K, value: UxSMission[K]) => {
    onChangeMission({
      ...mission,
      [key]: value,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  };

  const addInstrument = () => {
    if (!newInstrument.trim()) return;
    handleUpdate('instruments', [...mission.instruments, newInstrument.trim()]);
    setNewInstrument('');
  };

  const removeInstrument = (index: number) => {
    handleUpdate(
      'instruments',
      mission.instruments.filter((_, i) => i !== index)
    );
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    handleUpdate('keywords', {
      ...mission.keywords,
      gcmdScience: [...mission.keywords.gcmdScience, newKeyword.trim()],
    });
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    handleUpdate('keywords', {
      ...mission.keywords,
      gcmdScience: mission.keywords.gcmdScience.filter((_, i) => i !== index),
    });
  };

  return (
    <div id="metadata-form-container" className="flex-1 flex flex-col bg-[#070d18] overflow-y-auto">
      {/* Form Tabs matching Image 3 (Overview, Extent, Platform, Keywords, Contact) */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1 border-b border-cyan-500/20 bg-[#0a1220] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium font-mono transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#0e192c] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          id="tab-spatial-extent-btn"
          onClick={() => setActiveTab('spatialExtent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium font-mono transition-colors ${
            activeTab === 'extent' || activeTab === 'spatialExtent'
              ? 'bg-[#0e192c] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Spatial &amp; Temporal Extent</span>
        </button>

        <button
          onClick={() => setActiveTab('platform')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium font-mono transition-colors ${
            activeTab === 'platform'
              ? 'bg-[#0e192c] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ship className="w-3.5 h-3.5" />
          <span>Platform & Sensors</span>
        </button>

        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium font-mono transition-colors ${
            activeTab === 'keywords'
              ? 'bg-[#0e192c] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>GCMD Keywords</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium font-mono transition-colors ${
            activeTab === 'contact'
              ? 'bg-[#0e192c] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Contact & DOI</span>
        </button>
      </div>

      {/* Form Content Area */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Title Field */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                  <span>Title *</span>
                  <span className="text-[10px] text-cyan-500 font-normal">(ISO Citation Title)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-mono">
                    <Check className="w-3 h-3" /> Detected
                  </span>
                  <button
                    onClick={() => onAskAiAboutField('Title', mission.title)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 hover:text-purple-100 border border-purple-700/50 font-mono transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Ask me more
                  </button>
                </div>
              </div>
              <input
                id="mission-title-input"
                type="text"
                value={mission.title}
                onChange={(e) => handleUpdate('title', e.target.value)}
                placeholder="e.g. EX2503: Seamount Ecosystem Exploration – Atlantic Ocean"
                className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            {/* Alternate Title */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-semibold uppercase text-slate-300">
                  Alternate Title / Cruise Code
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Optional</span>
              </div>
              <input
                id="mission-alt-title-input"
                type="text"
                value={mission.alternateTitle}
                onChange={(e) => handleUpdate('alternateTitle', e.target.value)}
                placeholder="e.g. Okeanos Explorer EX-25-03 New England & Corner Rise Seamounts"
                className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Abstract */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                  <span>Abstract *</span>
                  <span className="text-[10px] text-cyan-500 font-normal">(Scientific Summary)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-mono">
                    ✓ Good length ({mission.abstract.length} chars)
                  </span>
                  <button
                    onClick={() => onAskAiAboutField('Abstract', mission.abstract)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 hover:text-purple-100 border border-purple-700/50 font-mono transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Ask me more
                  </button>
                </div>
              </div>
              <textarea
                id="mission-abstract-input"
                rows={4}
                value={mission.abstract}
                onChange={(e) => handleUpdate('abstract', e.target.value)}
                placeholder="Describe mission objectives, platform, sensor, area, dates, and data product..."
                className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
              />
            </div>

            {/* Purpose */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-semibold uppercase text-slate-300">
                  Purpose (Dataset / Mission Statement)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-mono">
                    ✓ Looks good
                  </span>
                  <button
                    onClick={() => onAskAiAboutField('Purpose', mission.purpose)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 hover:text-purple-100 border border-purple-700/50 font-mono transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Refine
                  </button>
                </div>
              </div>
              <textarea
                id="mission-purpose-input"
                rows={2}
                value={mission.purpose}
                onChange={(e) => handleUpdate('purpose', e.target.value)}
                placeholder="High-resolution seafloor mapping and autonomous reconnaissance..."
                className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Status & Resource Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4">
                <label className="text-xs font-mono font-semibold uppercase text-slate-300 block mb-1.5">
                  Progress Status
                </label>
                <select
                  id="mission-status-select"
                  value={mission.status}
                  onChange={(e) => handleUpdate('status', e.target.value as any)}
                  className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-200 outline-none focus:border-cyan-400"
                >
                  <option value="completed">completed (Data Archived)</option>
                  <option value="onGoing">onGoing (Active Expedition)</option>
                  <option value="planned">planned (Scheduled Cruise)</option>
                  <option value="underDevelopment">underDevelopment (Pre-deployment)</option>
                </select>
              </div>

              <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4">
                <label className="text-xs font-mono font-semibold uppercase text-slate-300 block mb-1.5">
                  Resource Hierarchy Level
                </label>
                <select
                  id="mission-resourcetype-select"
                  value={mission.resourceType}
                  onChange={(e) => handleUpdate('resourceType', e.target.value as any)}
                  className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-200 outline-none focus:border-cyan-400"
                >
                  <option value="dataset">dataset (Oceanographic Data Set)</option>
                  <option value="mission">mission (Full UxS Cruise)</option>
                  <option value="series">series (Multi-leg Expedition Series)</option>
                  <option value="collection">collection (NCEI CoMET Collection)</option>
                </select>
              </div>
            </div>

            {/* Quick Spatial Extent Verification Card in Overview */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold uppercase text-cyan-200">
                      Geographic Spatial Extent
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-mono border border-cyan-800/40">
                      {mission.spatialExtent.placeName || 'Ocean Sector'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Bounding Box: [{mission.spatialExtent.west.toFixed(2)}°W, {mission.spatialExtent.south.toFixed(2)}°S] to [{mission.spatialExtent.east.toFixed(2)}°E, {mission.spatialExtent.north.toFixed(2)}°N]
                  </div>
                </div>
              </div>
              <button
                id="overview-verify-spatial-extent-btn"
                type="button"
                onClick={() => setActiveTab('spatialExtent')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 text-xs font-mono transition-colors whitespace-nowrap cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Verify &amp; Adjust on Leaflet Map</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Spatial & Temporal Extent with Interactive Ocean Map */}
        {(activeTab === 'extent' || activeTab === 'spatialExtent') && (
          <div id="spatialExtent" className="space-y-4">
            {/* Interactive Map Component */}
            <InteractiveOceanMap
              extent={mission.spatialExtent}
              onChangeExtent={(newExt) => handleUpdate('spatialExtent', newExt)}
              missionTitle={mission.title}
              instruments={mission.instruments}
            />

            {/* Location Place Name & Coordinates Summary */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Geographic Place Name Description</span>
                </label>
                <button
                  onClick={() => onAskAiAboutField('Bounding Box & Location', mission.spatialExtent.placeName || '')}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 hover:text-purple-100 border border-purple-700/50 font-mono transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Infer bounds from name
                </button>
              </div>
              <input
                id="place-name-input"
                type="text"
                value={mission.spatialExtent.placeName || ''}
                onChange={(e) =>
                  handleUpdate('spatialExtent', {
                    ...mission.spatialExtent,
                    placeName: e.target.value,
                  })
                }
                placeholder="e.g. North Atlantic Ocean, Corner Rise Seamounts"
                className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Temporal Extent Grid */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4">
              <label className="text-xs font-mono font-semibold uppercase text-cyan-200 block mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Temporal Extent (ISO 8601 YYYY-MM-DD)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Start Date / Mission Launch
                  </label>
                  <input
                    id="date-start-input"
                    type="date"
                    value={mission.dateStart}
                    onChange={(e) => handleUpdate('dateStart', e.target.value)}
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    End Date / Recovery
                  </label>
                  <input
                    id="date-end-input"
                    type="date"
                    value={mission.dateEnd}
                    onChange={(e) => handleUpdate('dateEnd', e.target.value)}
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Publication / Release Date
                  </label>
                  <input
                    id="date-publication-input"
                    type="date"
                    value={mission.publicationDate}
                    onChange={(e) => handleUpdate('publicationDate', e.target.value)}
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Platform & Sensor Instrumentation */}
        {activeTab === 'platform' && (
          <div className="space-y-4">
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Host Vessel & Platform Details</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  UxS Registry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Platform / Vessel Name
                  </label>
                  <input
                    id="platform-name-input"
                    type="text"
                    value={mission.platform.name}
                    onChange={(e) =>
                      handleUpdate('platform', {
                        ...mission.platform,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. NOAA Ship Okeanos Explorer"
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Call Sign / IMO Number
                  </label>
                  <input
                    id="platform-callsign-input"
                    type="text"
                    value={mission.platform.callSign}
                    onChange={(e) =>
                      handleUpdate('platform', {
                        ...mission.platform,
                        callSign: e.target.value,
                      })
                    }
                    placeholder="e.g. WDE7525"
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Platform Type
                  </label>
                  <input
                    id="platform-type-input"
                    type="text"
                    value={mission.platform.type}
                    onChange={(e) =>
                      handleUpdate('platform', {
                        ...mission.platform,
                        type: e.target.value,
                      })
                    }
                    placeholder="research vessel"
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    UxS System Category
                  </label>
                  <select
                    id="platform-uxs-category"
                    value={mission.platform.uxsCategory}
                    onChange={(e) =>
                      handleUpdate('platform', {
                        ...mission.platform,
                        uxsCategory: e.target.value,
                      })
                    }
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-200 outline-none focus:border-cyan-400"
                  >
                    <option value="ROV">ROV (Remotely Operated Vehicle, e.g. Deep Discoverer)</option>
                    <option value="UUV">UUV (Autonomous Underwater Vehicle, e.g. Eagle Ray)</option>
                    <option value="USV">USV (Uncrewed Surface Vehicle, e.g. Saildrone, DriX)</option>
                    <option value="Glider">Glider (Ocean Slocum / Seaglider)</option>
                    <option value="Host Vessel">Host Research Vessel (Mothership)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Instruments / Sensors List */}
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Payload Sensors & Instrumentation ({mission.instruments.length})</span>
                </label>
                <button
                  onClick={() => onAskAiAboutField('Sensors', mission.instruments.join(', '))}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 hover:text-purple-100 border border-purple-700/50 font-mono transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Suggest sensors
                </button>
              </div>

              {/* Sensor Chips */}
              <div className="flex flex-wrap gap-2">
                {mission.instruments.map((inst, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#112038] text-xs text-cyan-200 border border-cyan-500/30 shadow-sm"
                  >
                    <span>{inst}</span>
                    <button
                      onClick={() => removeInstrument(idx)}
                      className="text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove instrument"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Sensor */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="add-instrument-input"
                  type="text"
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addInstrument()}
                  placeholder="Add sensor (e.g. Edgetech 2200-M, CTD Carousel, eDNA Sampler)..."
                  className="flex-1 bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-cyan-100 outline-none focus:border-cyan-400"
                />
                <button
                  onClick={addInstrument}
                  className="px-3 py-1.5 rounded-lg bg-[#142846] hover:bg-[#1c3863] text-xs text-cyan-200 border border-cyan-500/30 flex items-center gap-1 font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sensor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: GCMD Keywords */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GCMD Science Keywords (v18.4)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Required for NOAA CoMET and NASA Earth Science taxonomy catalog discovery.
                  </p>
                </div>
                <button
                  onClick={() => onAskAiAboutField('GCMD Keywords', mission.keywords.gcmdScience.join('; '))}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 hover:text-purple-100 border border-purple-700/50 font-mono transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Suggest GCMD
                </button>
              </div>

              {/* Keyword Badges */}
              <div className="space-y-2">
                {mission.keywords.gcmdScience.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#101d33] border border-cyan-500/25 text-xs font-mono text-cyan-200"
                  >
                    <span className="truncate pr-2">{kw}</span>
                    <button
                      onClick={() => removeKeyword(idx)}
                      className="text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom GCMD Keyword */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="add-gcmd-keyword-input"
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="e.g. Oceans > Ocean Acoustics > Acoustic Backscatter"
                  className="flex-1 bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-cyan-100 outline-none focus:border-cyan-400 font-mono"
                />
                <button
                  onClick={addKeyword}
                  className="px-3 py-1.5 rounded-lg bg-[#142846] hover:bg-[#1c3863] text-xs text-cyan-200 border border-cyan-500/30 flex items-center gap-1 font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Keyword
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Contact & Governance */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="bg-[#0b1322] border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <label className="text-xs font-mono font-semibold uppercase text-cyan-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>Data Steward & Point of Contact (CI_ResponsibleParty)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Contact Name / Office
                  </label>
                  <input
                    id="contact-name-input"
                    type="text"
                    value={mission.contact.name}
                    onChange={(e) =>
                      handleUpdate('contact', {
                        ...mission.contact,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    id="contact-email-input"
                    type="email"
                    value={mission.contact.email}
                    onChange={(e) =>
                      handleUpdate('contact', {
                        ...mission.contact,
                        email: e.target.value,
                      })
                    }
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Organization
                  </label>
                  <input
                    id="contact-org-input"
                    type="text"
                    value={mission.contact.organization}
                    onChange={(e) =>
                      handleUpdate('contact', {
                        ...mission.contact,
                        organization: e.target.value,
                      })
                    }
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    ROR Identifier (Research Organization Registry)
                  </label>
                  <input
                    id="contact-ror-input"
                    type="text"
                    value={mission.contact.rorId || ''}
                    onChange={(e) =>
                      handleUpdate('contact', {
                        ...mission.contact,
                        rorId: e.target.value,
                      })
                    }
                    placeholder="https://ror.org/02z5n2526"
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Digital Object Identifier (DOI)
                  </label>
                  <input
                    id="contact-doi-input"
                    type="text"
                    value={mission.doi || ''}
                    onChange={(e) => handleUpdate('doi', e.target.value)}
                    placeholder="10.25921/ex25-03-oceans"
                    className="w-full bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Form Actions Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-cyan-500/20">
          <span className="text-[11px] text-slate-400 font-mono">
            Last saved: <span className="text-cyan-300">{mission.lastUpdated}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              id="validate-now-bottom-btn"
              onClick={onValidateNow}
              className="px-3.5 py-1.5 rounded-lg bg-[#12243d] hover:bg-[#1a3458] text-xs font-mono text-cyan-200 border border-cyan-500/40 transition-colors cursor-pointer"
            >
              Validate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
