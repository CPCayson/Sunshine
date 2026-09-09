import React, { useState } from 'react';
import { X, Layers, Compass, ChevronRight, MessageSquare } from 'lucide-react';
import {
  ActiveWorkspaceTab,
  ChatMessage,
  UxSMission,
  WorkspaceSelection,
} from '../../types';
import { ChatbotCompanion } from '../ChatbotCompanion';
import { LiveXmlPreview } from '../LiveXmlPreview';
import { CometOperationMode } from '../../services/cometAdapter';
import { generateIso19115Xml } from '../../utils/xmlGenerator';
import { KnowledgePassport } from './KnowledgePassport';

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

type LensTab = 'overview' | 'passport' | 'inspect' | 'ask';
type InspectMode = 'evidence' | 'signal' | 'rosetta' | 'xml';

export const GlobalLens: React.FC<GlobalLensProps> = ({
  isOpen,
  onClose,
  mission,
  selection,
  chatMessages,
  onSendMessage,
  isChatLoading,
  onApplySuggestedUpdates,
  onSwitchWorkspaceTab,
}) => {
  const [activeTab, setActiveTab] = useState<LensTab>('overview');
  const [inspectMode, setInspectMode] = useState<InspectMode>('evidence');

  if (!isOpen) return null;

  const entityName = selection.entityName || mission.title;
  const canonicalRef = selection.canonicalRef || mission.id;
  const claims = mission.claims || [];
  const unresolvedClaims = claims.filter((claim) => claim.state !== 'ACCEPTED' && claim.state !== 'REJECTED');

  const tabs: Array<{ id: LensTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'passport', label: 'Passport' },
    { id: 'inspect', label: 'Inspect' },
    { id: 'ask', label: 'Ask' },
  ];

  const openWorkspace = (tab: ActiveWorkspaceTab) => {
    onSwitchWorkspaceTab(tab);
    onClose();
  };

  return (
    <aside
      id="global-workbench-lens-slideover"
      className="fixed top-12 right-0 bottom-0 w-full sm:w-[430px] bg-[#060b14]/98 border-l border-slate-800 flex flex-col z-50 shadow-xl font-sans animate-in slide-in-from-right duration-150"
    >
      <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lens</span>
          </div>
          <div className="mt-0.5 text-sm font-medium text-slate-100 truncate max-w-[330px]" title={entityName}>
            {entityName}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-900/70"
          title="Close Lens"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 border-b border-slate-900 flex items-center gap-5 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-xs transition-colors border-b ${
              activeTab === tab.id
                ? 'text-cyan-200 border-cyan-400'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-[#050a12]">
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto px-6 py-7">
            <div className="max-w-sm space-y-7">
              <section>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Selected</div>
                <div className="mt-2 text-xl font-medium text-slate-100 leading-snug">{entityName}</div>
                <div className="mt-2 text-xs font-mono text-slate-500 break-all">{canonicalRef}</div>
              </section>

              <section className="space-y-4 border-t border-slate-900 pt-6">
                <CalmRow label="Mission" value={mission.alternateTitle || mission.id} />
                <CalmRow label="Platform" value={mission.platform.name} />
                <CalmRow label="Time" value={`${mission.dateStart} – ${mission.dateEnd}`} />
                <CalmRow label="Place" value={mission.spatialExtent.placeName || 'Spatial extent available'} />
                <CalmRow label="Claims needing review" value={String(unresolvedClaims.length)} />
              </section>

              <section className="border-t border-slate-900 pt-6">
                <button
                  onClick={() => setActiveTab('passport')}
                  className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
                >
                  <Compass className="w-4 h-4" />
                  Open knowledge passport
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'passport' && (
          <div className="h-full overflow-y-auto p-5">
            <KnowledgePassport
              selection={selection}
              mission={mission}
              onNavigateTab={(tab) => openWorkspace(tab)}
            />
          </div>
        )}

        {activeTab === 'inspect' && (
          <div className="h-full flex flex-col min-h-0">
            <div className="px-5 py-4 border-b border-slate-900 shrink-0">
              <label className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Inspect</label>
              <select
                value={inspectMode}
                onChange={(e) => setInspectMode(e.target.value as InspectMode)}
                className="mt-2 w-full bg-[#09111d] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-800"
              >
                <option value="evidence">Evidence</option>
                <option value="signal">Signal</option>
                <option value="rosetta">Rosetta</option>
                <option value="xml">ISO XML</option>
              </select>
            </div>

            {inspectMode === 'evidence' && (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div>
                  <div className="text-lg font-medium text-slate-100">{claims.length} claims</div>
                  <div className="mt-1 text-sm text-slate-500">{unresolvedClaims.length} still need review.</div>
                </div>
                <div className="space-y-4">
                  {unresolvedClaims.slice(0, 4).map((claim) => (
                    <div key={claim.id} className="border-t border-slate-900 pt-4 first:border-t-0 first:pt-0">
                      <div className="text-xs text-slate-500">{claim.predicate} · {claim.state}</div>
                      <div className="mt-1 text-sm text-slate-200 leading-relaxed">
                        {claim.subject} → {String(claim.objectValue)}
                      </div>
                    </div>
                  ))}
                </div>
                <TextAction label="Open Evidence" onClick={() => openWorkspace('evidence')} />
              </div>
            )}

            {inspectMode === 'signal' && (
              <div className="flex-1 overflow-y-auto px-6 py-7">
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Local assurance</div>
                <div className="mt-2 text-3xl font-medium text-slate-100">{mission.conformanceScore ?? '—'}%</div>
                <div className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Open Signal for rule-level evidence, impact, and remediation.
                </div>
                <div className="mt-7"><TextAction label="Open Signal" onClick={() => openWorkspace('signal')} /></div>
              </div>
            )}

            {inspectMode === 'rosetta' && (
              <div className="flex-1 overflow-y-auto px-6 py-7">
                <div className="text-lg font-medium text-slate-100">Cross-authority mapping</div>
                <div className="mt-5 space-y-4 text-sm">
                  <CalmRow label="Mission title" value="Canonical → ISO title → discovery title" />
                  <CalmRow label="Platform" value="Canonical platform → ISO platform → projected fields" />
                  <CalmRow label="Extent" value="Canonical geometry → ISO / STAC / DCAT" />
                </div>
                <div className="mt-7"><TextAction label="Open Rosetta" onClick={() => openWorkspace('rosetta')} /></div>
              </div>
            )}

            {inspectMode === 'xml' && (
              <div className="flex-1 min-h-0 flex flex-col">
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
          </div>
        )}

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

const CalmRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="grid grid-cols-[110px_1fr] gap-4 items-start">
    <div className="text-xs text-slate-600">{label}</div>
    <div className="text-sm text-slate-300 leading-relaxed break-words">{value}</div>
  </div>
);

const TextAction: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-200">
    {label}
    <ChevronRight className="w-3.5 h-3.5" />
  </button>
);
