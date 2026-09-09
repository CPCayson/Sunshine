import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Database,
  Activity,
  Languages,
  Layers,
  Send,
  MessageSquare,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ActiveWorkspaceTab, ChatMessage, UxSMission } from '../types';
import { ChatbotCompanion } from './ChatbotCompanion';
import { LiveXmlPreview } from './LiveXmlPreview';
import { CometOperationMode } from '../services/cometAdapter';
import { generateIso19115Xml } from '../utils/xmlGenerator';

interface RightLensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mission: UxSMission;
  activeLensTab: 'evidence' | 'signal' | 'rosetta' | 'projections' | 'comet' | 'ask';
  onChangeLensTab: (tab: 'evidence' | 'signal' | 'rosetta' | 'projections' | 'comet' | 'ask') => void;
  onSwitchMainTab: (tab: ActiveWorkspaceTab) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, model: string) => Promise<void>;
  isChatLoading: boolean;
  onApplySuggestedUpdates: (updates: any) => void;
  cometMode: CometOperationMode;
}

export const RightLensPanel: React.FC<RightLensPanelProps> = ({
  isOpen,
  onClose,
  mission,
  activeLensTab,
  onChangeLensTab,
  onSwitchMainTab,
  chatMessages,
  onSendMessage,
  isChatLoading,
  onApplySuggestedUpdates,
  cometMode,
}) => {
  if (!isOpen) return null;

  const tabs: Array<{ id: 'evidence' | 'signal' | 'rosetta' | 'projections' | 'comet' | 'ask'; label: string; icon: React.ReactNode }> = [
    { id: 'evidence', label: 'Evidence', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'signal', label: 'Signal', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'rosetta', label: 'Rosetta', icon: <Languages className="w-3.5 h-3.5" /> },
    { id: 'projections', label: 'XML', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'comet', label: 'CoMET', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'ask', label: 'Ask AI', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside
      id="right-lens-drawer"
      className="w-full sm:w-96 md:w-[420px] bg-[#070d1a] border-l border-cyan-500/20 flex flex-col h-full z-20 shadow-2xl transition-all font-sans"
    >
      {/* Drawer Header */}
      <div className="bg-[#091224] border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-cyan-300 tracking-wider uppercase">
            MANTA Contextual Lens
          </span>
        </div>
        <button
          id="close-lens-panel-btn"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Close Lens"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Tabs */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 border-b border-slate-800 bg-[#050a14] overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeLensTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeLensTab(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-t text-xs font-mono transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#070d1a] text-cyan-300 border-t border-l border-r border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Drawer Body depending on active lens tab */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#060b16]">
        {/* TAB 1: EVIDENCE QUICK SUMMARY */}
        {activeLensTab === 'evidence' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Candidate Claims</span>
              <button
                onClick={() => onSwitchMainTab('evidence')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open Full Workspace</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {(mission.claims || []).map((claim) => (
              <div key={claim.id} className="p-2.5 bg-[#081122] border border-slate-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">{claim.predicate}</span>
                  <span className={`text-[10px] px-1 rounded ${claim.state === 'CONFLICT' ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-300'}`}>
                    {claim.state}
                  </span>
                </div>
                <div className="text-slate-200 font-semibold text-xs truncate">
                  {claim.subject} → {String(claim.objectValue)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SIGNAL QUICK ASSURANCE */}
        {activeLensTab === 'signal' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Profile Conformance</span>
              <button
                onClick={() => onSwitchMainTab('signal')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open Full Signal</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 bg-[#081122] border border-cyan-500/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Conformance Score:</span>
                <span className="text-cyan-300 font-bold text-sm">{mission.conformanceScore || 86}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">UxS Marine Profile:</span>
                <span className="text-emerald-300 font-semibold">v3.2 PASS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">DocuComp Integrity:</span>
                <span className="text-cyan-300 font-semibold">3 XLinks Intact</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROSETTA TRANSLATION */}
        {activeLensTab === 'rosetta' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Rosetta Mappings</span>
              <button
                onClick={() => onSwitchMainTab('rosetta')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Full Rosetta Matrix</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-[#081122] border border-slate-800 rounded-lg">
                <div className="text-slate-400 text-[10px]">Platform Identity</div>
                <div className="text-cyan-300 font-semibold">{mission.platform.name}</div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  gmi:platform/gmi:identifier/gmd:MD_Identifier
                </div>
              </div>
              <div className="p-2.5 bg-[#081122] border border-slate-800 rounded-lg">
                <div className="text-slate-400 text-[10px]">Spatial Bounding Box</div>
                <div className="text-cyan-300 font-semibold">
                  [{mission.spatialExtent.west}, {mission.spatialExtent.south}, {mission.spatialExtent.east}, {mission.spatialExtent.north}]
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  gmd:EX_GeographicBoundingBox
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE XML PROJECTION PREVIEW */}
        {activeLensTab === 'projections' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-[#08101e] text-xs font-mono">
              <span className="text-slate-300 font-bold">ISO 19115-2 XML</span>
              <button
                onClick={() => onSwitchMainTab('projections')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Projections Tab →
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
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
          </div>
        )}

        {/* TAB 5: COMET STATUS */}
        {activeLensTab === 'comet' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-slate-300 font-bold">CoMET Operational Status</span>
              <button
                onClick={() => onSwitchMainTab('comet')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open CoMET Adapter</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 bg-[#081122] border border-cyan-500/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Mode:</span>
                <span className="text-cyan-300 font-bold">{cometMode.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Record Group:</span>
                <span className="text-slate-200">ea_demo/</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">CoMET Online Probe:</span>
                <span className="text-amber-300 font-semibold">AUTH REQUIRED (302)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ISO 19139 Local:</span>
                <span className="text-emerald-300">SYNTAX READY (0 errors)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ASK AI (CHATBOT ADVISOR) */}
        {activeLensTab === 'ask' && (
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
