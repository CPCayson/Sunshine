import React, { useState } from 'react';
import {
  X,
  Pin,
  PinOff,
  Layers,
  Activity,
  Languages,
  Database,
  Send,
  MessageSquare,
  FileCode,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  ChatMessage,
  UxSMission,
  WorkspaceSelection
} from '../../types';
import { ChatbotCompanion } from '../ChatbotCompanion';
import { LiveXmlPreview } from '../LiveXmlPreview';
import { CometOperationMode } from '../../services/cometAdapter';
import { generateIso19115Xml } from '../../utils/xmlGenerator';
import { CompactAccordion } from './CompactAccordion';

interface GlobalLensProps {
  isOpen: boolean;
  onClose: () => void;
  mission: UxSMission;
  selection: WorkspaceSelection;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, model: string) => Promise<void>;
  isChatLoading: boolean;
  onApplySuggestedUpdates: (updates: any) => void;
  cometMode: CometOperationMode;
  onSwitchWorkspaceTab: (tab: ActiveWorkspaceTab) => void;
}

export const GlobalLens: React.FC<GlobalLensProps> = ({
  isOpen,
  onClose,
  mission,
  selection,
  chatMessages,
  onSendMessage,
  isChatLoading,
  onApplySuggestedUpdates,
  cometMode,
  onSwitchWorkspaceTab,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<'context' | 'evidence' | 'signal' | 'rosetta' | 'xml' | 'ask'>('context');

  if (!isOpen) return null;

  const tabs = [
    { id: 'context', label: 'Context', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'evidence', label: 'Evidence', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'signal', label: 'Signal', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'rosetta', label: 'Rosetta', icon: <Languages className="w-3.5 h-3.5" /> },
    { id: 'xml', label: 'ISO XML', icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: 'ask', label: 'Ask AI', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <aside
      id="global-workbench-lens-slideover"
      className="fixed top-11 right-0 bottom-0 w-full sm:w-[480px] md:w-[540px] lg:w-[45vw] bg-[#070e1d]/95 border-l border-cyan-500/30 backdrop-blur-xl flex flex-col z-50 shadow-2xl font-sans animate-in slide-in-from-right duration-200"
    >
      {/* Global Lens Header */}
      <div className="bg-[#09152b] border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            GLOBAL CONTEXTUAL LENS
          </span>
          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-[#060c18] border border-slate-700">
            {isPinned ? 'PINNED' : 'SLIDEOVER'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 rounded transition-colors ${
              isPinned ? 'text-cyan-300 bg-[#0e244a]' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={isPinned ? 'Unpin Global Lens' : 'Pin Global Lens'}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close Global Lens"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-3 pt-2 border-b border-slate-800 bg-[#050b18] overflow-x-auto no-scrollbar font-mono text-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-t transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#070e1d] text-cyan-300 border-t border-x border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#060b16]">
        {/* TAB: CONTEXT / CROSS-PANE SELECTION */}
        {activeTab === 'context' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#09152b] border border-cyan-500/30 rounded-xl space-y-2">
              <div className="text-[10px] uppercase font-bold text-cyan-400">Current Cross-Pane Focus</div>
              <div className="text-sm font-sans font-bold text-slate-100">
                {selection.entityName || mission.title}
              </div>
              <div className="text-[11px] text-slate-400">
                Canonical Ref: <code className="text-cyan-300">{selection.canonicalRef || mission.id}</code>
              </div>
            </div>

            <div className="space-y-1">
              <CompactAccordion title="Canonical Platform" primaryValue={mission.platform.name} badge={{ label: 'PROVEN', variant: 'emerald' }} defaultExpanded>
                <div className="space-y-1 text-slate-400">
                  <div>Model ID: <strong className="text-slate-200">{mission.platform.modelId || 'REMUS-620'}</strong></div>
                  <div>Category: <strong className="text-slate-200">{mission.platform.uxsCategory}</strong></div>
                  <div>Callsign: <strong className="text-slate-200">{mission.platform.callSign}</strong></div>
                </div>
              </CompactAccordion>

              <CompactAccordion title="SpatioTemporal Coordinates" primaryValue={mission.spatialExtent.placeName} badge={{ label: 'CORRIDOR', variant: 'cyan' }}>
                <div className="space-y-1 text-slate-400">
                  <div>Dates: <span className="text-slate-200">{mission.dateStart} to {mission.dateEnd}</span></div>
                  <div>Coordinates: <span className="text-slate-200">[{mission.spatialExtent.west}°, {mission.spatialExtent.south}°] to [{mission.spatialExtent.east}°, {mission.spatialExtent.north}°]</span></div>
                </div>
              </CompactAccordion>

              <CompactAccordion title="Authority & Lineage" primaryValue={mission.contact.organization} badge={{ label: 'NOAA NCEI', variant: 'purple' }}>
                <div className="space-y-1 text-slate-400">
                  <div>Lead: <span className="text-slate-200">{mission.contact.name} ({mission.contact.email})</span></div>
                  <div>DocuComp Profile: <span className="text-cyan-300">MANTAS DocuComp Slot Profile — Provisional</span></div>
                </div>
              </CompactAccordion>
            </div>
          </div>
        )}

        {/* TAB: EVIDENCE */}
        {activeTab === 'evidence' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Candidate Claims ({(mission.claims || []).length})</span>
              <button
                onClick={() => onSwitchWorkspaceTab('evidence')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open Evidence Workspace</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {(mission.claims || []).map((claim) => (
              <div key={claim.id} className="p-3 bg-[#081122] border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-semibold text-[11px]">{claim.predicate}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${claim.state === 'CONFLICT' ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-300'}`}>
                    {claim.state}
                  </span>
                </div>
                <div className="text-slate-200 font-sans font-medium text-xs">
                  {claim.subject} → <strong className="text-emerald-300">{String(claim.objectValue)}</strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  Obs: {claim.sources?.[0]?.id || 'direct'} · Confidence: {Math.round((claim.confidence || 0.8) * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: SIGNAL */}
        {activeTab === 'signal' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Signal Assurance Engine</span>
              <button
                onClick={() => onSwitchWorkspaceTab('signal')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open Signal Tab</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Conformance Score: {mission.conformanceScore}%</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                ISO 19115-2 profile valid with 0 critical syntax errors. All provisional slot mappings evaluated.
              </p>
            </div>
          </div>
        )}

        {/* TAB: ROSETTA */}
        {activeTab === 'rosetta' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Rosetta Schema Crosswalk</span>
              <button
                onClick={() => onSwitchWorkspaceTab('rosetta')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Full Crosswalk Table</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 bg-[#081224] rounded-xl border border-slate-800 space-y-2 text-[11px]">
              <div><span className="text-slate-400">Mission Title:</span> <span className="text-cyan-300">gmd:identificationInfo//gmd:title</span></div>
              <div><span className="text-slate-400">Platform Model:</span> <span className="text-emerald-300">gmi:MI_Platform/gmi:description</span></div>
              <div><span className="text-slate-400">Instrument Array:</span> <span className="text-amber-300">gmi:MI_Instrument/gmi:type</span></div>
              <div><span className="text-slate-400">STAC Coordinates:</span> <span className="text-purple-300">geometry.coordinates [Polygon]</span></div>
            </div>
          </div>
        )}

        {/* TAB: ISO XML PREVIEW */}
        {activeTab === 'xml' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <LiveXmlPreview
              xmlContent={generateIso19115Xml(mission)}
              onExportXml={() => {
                const blob = new Blob([generateIso19115Xml(mission)], { type: 'application/xml;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${mission.id}_ISO19115.xml`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            />
          </div>
        )}

        {/* TAB: ASK AI */}
        {activeTab === 'ask' && (
          <ChatbotCompanion
            messages={chatMessages}
            onSendMessage={onSendMessage}
            isLoading={isChatLoading}
            mission={mission}
            onApplySuggestedUpdates={onApplySuggestedUpdates}
          />
        )}
      </div>
    </aside>
  );
};
