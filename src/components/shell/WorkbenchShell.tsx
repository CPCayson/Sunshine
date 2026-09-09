import React, { useState } from 'react';
import {
  UxSMission,
  ActiveWorkspaceTab,
  ChatMessage,
  FederatedSearchResult,
  WorkspaceSelection,
} from '../../types';
import { CompactCommandHeader } from './CompactCommandHeader';
import { FocusPane } from './FocusPane';
import { GlobalLens } from './GlobalLens';
import { MantaScriptCanvas, MantasScriptMode } from './MantaScriptCanvas';
import { WorkbenchRightRail } from './WorkbenchRightRail';
import { CometOperationMode } from '../../services/cometAdapter';

import { MantasSearch } from '../MantasSearch';
import { CharlieIntakeWorkspace } from '../CharlieIntakeWorkspace';
import { MetadataForm } from '../MetadataForm';
import { EvidenceWorkspace } from '../EvidenceWorkspace';
import { MissionGraph } from '../MissionGraph';
import { SignalAssurance } from '../SignalAssurance';
import { RosettaViewer } from '../RosettaViewer';
import { ProjectionFormat, ProjectionsWorkspace } from '../ProjectionsWorkspace';
import { CometAdapterWorkspace } from '../CometAdapterWorkspace';
import { DestinationCompare } from '../DestinationCompare';
import { InteractiveOceanMap } from '../InteractiveOceanMap';
import { UxSDataLifecycle } from '../UxSDataLifecycle';
import { KnowledgeTreeProjection } from '../KnowledgeTreeProjection';
import { ConstellationWorkspace } from '../ConstellationWorkspace';
import { buildKnowledgeKeyCandidate, VerifiedUxSAssetRecord } from '../../data/verifiedNoaaCorpus';
import { CheckCircle2 } from 'lucide-react';

interface WorkbenchShellProps {
  mission: UxSMission;
  setMission: React.Dispatch<React.SetStateAction<UxSMission>>;
  cometMode: CometOperationMode;
  setCometMode: (mode: CometOperationMode) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, model: string) => Promise<void>;
  isChatLoading: boolean;
  onApplySuggestedUpdates: (updates: any) => void;
  onApplySignalRemediation: (finding: any) => void;
  onAcceptClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string) => void;
  onPullAsEvidence: (result: FederatedSearchResult) => void;
  toast: { message: string; type: 'success' | 'info' } | null;
  showToast: (msg: string) => void;
}

interface CorpusSelectionEventDetail {
  selection: WorkspaceSelection;
  openGraph?: boolean;
}

export const WorkbenchShell: React.FC<WorkbenchShellProps> = ({
  mission,
  setMission,
  cometMode,
  setCometMode,
  chatMessages,
  onSendMessage,
  isChatLoading,
  onApplySuggestedUpdates,
  onApplySignalRemediation,
  onAcceptClaim,
  onRejectClaim,
  onPullAsEvidence,
  toast,
  showToast,
}) => {
  // One dominant canvas. The old bottom companion pane is intentionally retired.
  const [primaryTab, setPrimaryTab] = useState<ActiveWorkspaceTab>('graph');
  // Retained as lightweight context for MANTAScript and legacy pair actions, but never rendered below the canvas.
  const [companionTab, setCompanionTab] = useState<ActiveWorkspaceTab>('map');
  const [projectionFormat, setProjectionFormat] = useState<ProjectionFormat>('ISO');

  const [selection, setSelection] = useState<WorkspaceSelection>({
    canonicalRef: mission.id,
    entityName: mission.platform.name,
    entityType: 'PLATFORM',
  });

  const [isGlobalLensOpen, setIsGlobalLensOpen] = useState(false);
  const [isMantasScriptOpen, setIsMantasScriptOpen] = useState(false);
  const [mantasScriptInitialMode, setMantasScriptInitialMode] = useState<MantasScriptMode>('SCRIPT');

  React.useEffect(() => {
    const handleCorpusSelection = (event: Event) => {
      const detail = (event as CustomEvent<CorpusSelectionEventDetail>).detail;
      if (!detail?.selection) return;
      setSelection(detail.selection);
      showToast(`Corpus selection: ${detail.selection.entityName || detail.selection.graphNodeId || 'source-backed asset'}`);
      if (detail.openGraph) setPrimaryTab('graph');
    };

    window.addEventListener('manta:corpus-selection', handleCorpusSelection as EventListener);
    return () => window.removeEventListener('manta:corpus-selection', handleCorpusSelection as EventListener);
  }, [showToast]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) &&
        !((e.metaKey || e.ctrlKey) && e.key === 'k')
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMantasScriptInitialMode('SCRIPT');
        setIsMantasScriptOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setMantasScriptInitialMode('SEARCH');
        setIsMantasScriptOpen(true);
      } else if (e.key === 'Escape') {
        if (isMantasScriptOpen) setIsMantasScriptOpen(false);
        else if (isGlobalLensOpen) setIsGlobalLensOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMantasScriptOpen, isGlobalLensOpen]);

  const openWorkspace = (tab: ActiveWorkspaceTab) => {
    setPrimaryTab(tab);
  };

  const openProjection = (format: ProjectionFormat) => {
    setProjectionFormat(format);
    setPrimaryTab('projections');
  };

  const selectCorpusRecord = (record: VerifiedUxSAssetRecord) => {
    setSelection({
      graphNodeId: `corpus-asset-${record.id}`,
      sourceObservationId: `corpus-observation-${record.id}`,
      canonicalRef: buildKnowledgeKeyCandidate(record),
      entityName: `${record.manufacturer} ${record.model}${record.serialOrIdentifier ? ` #${record.serialOrIdentifier}` : ''}`,
      entityType: 'physicalAsset',
    });
  };

  const handleCleanView = () => {
    setIsGlobalLensOpen(false);
    showToast('Calm surface restored. Main canvas remains primary; technical companions stay in the right rail.');
  };

  const renderWorkspace = (tab: ActiveWorkspaceTab) => {
    switch (tab) {
      case 'lifecycle':
        return (
          <UxSDataLifecycle
            mission={mission}
            onUpdateMission={setMission}
            onNavigateTab={openWorkspace}
            onSelectNode={(sel) => setSelection(sel)}
          />
        );

      case 'search':
        return (
          <MantasSearch
            currentMission={mission}
            onPullAsEvidence={onPullAsEvidence}
            onSelectAsMission={(partial) => {
              setMission((prev) => ({ ...prev, ...partial }));
              showToast('Loaded candidate mission attributes into workspace.');
            }}
            onSwitchTab={openWorkspace}
          />
        );

      case 'charlie-intake':
        return (
          <CharlieIntakeWorkspace
            mission={mission}
            onAcceptCandidateClaim={(canonicalPath, value) => {
              if (canonicalPath === 'title') {
                setMission((prev) => ({ ...prev, title: value }));
              } else if (canonicalPath === 'platform.name') {
                setMission((prev) => ({ ...prev, platform: { ...prev.platform, name: value } }));
              } else if (canonicalPath === 'contact.email') {
                setMission((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }));
              } else if (canonicalPath.startsWith('spatialExtent.')) {
                const key = canonicalPath.split('.')[1] as keyof typeof mission.spatialExtent;
                setMission((prev) => ({
                  ...prev,
                  spatialExtent: { ...prev.spatialExtent, [key]: value },
                }));
              }
              showToast(`Accepted claim for canonical path: ${canonicalPath}`);
            }}
            onAcceptAllCandidates={(updatedPartial) => {
              setMission((prev) => ({ ...prev, ...updatedPartial }));
              showToast('Batch accepted candidate claims into UxsMission canonical model.');
            }}
            onJumpToSignal={() => openWorkspace('signal')}
          />
        );

      case 'mission':
        return (
          <MetadataForm
            mission={mission}
            onChangeMission={setMission}
            onAskAiAboutField={() => setIsGlobalLensOpen(true)}
            onValidateNow={() => openWorkspace('signal')}
          />
        );

      case 'evidence':
        return (
          <EvidenceWorkspace
            mission={mission}
            selection={selection}
            onAcceptClaim={onAcceptClaim}
            onRejectClaim={onRejectClaim}
            onSelectDocucompRef={(ref) => {
              showToast(`Inspecting DocuComp XLink: ${ref.href}`);
              setSelection({
                canonicalRef: ref.href,
                entityName: ref.name,
                entityType: 'DOCUCOMP_XLINK',
              });
            }}
          />
        );

      case 'graph':
        return (
          <MissionGraph
            mission={mission}
            onNavigateTab={openWorkspace}
            onSelectNodeInLens={(node) => {
              setSelection({
                graphNodeId: node.id,
                entityName: node.label,
                entityType: node.kind,
                canonicalRef: node.canonicalRef,
              });
            }}
          />
        );

      case 'constellation':
        return (
          <ConstellationWorkspace
            selection={selection}
            onSelectRecord={selectCorpusRecord}
            onOpenGraph={() => openWorkspace('graph')}
          />
        );

      case 'map':
        return (
          <div className="h-full w-full flex flex-col bg-[#02050c] relative">
            <InteractiveOceanMap
              extent={mission.spatialExtent}
              onChangeExtent={(newExtent) => {
                setMission((prev) => ({ ...prev, spatialExtent: newExtent }));
                setSelection((prev) => ({
                  ...prev,
                  entityName: newExtent.placeName || 'Bounding Box',
                  entityType: 'SPATIAL_EXTENT',
                }));
              }}
              missionTitle={mission.title}
              instruments={mission.instruments}
              diveTrackPolygon={mission.spatialExtent.polygon}
            />
          </div>
        );

      case 'signal':
        return (
          <SignalAssurance
            mission={mission}
            onApplyRemediation={onApplySignalRemediation}
            onSwitchTab={openWorkspace}
          />
        );

      case 'rosetta':
        return <RosettaViewer mission={mission} />;

      case 'knowledge-tree':
        return (
          <KnowledgeTreeProjection
            mission={mission}
            onSelectNodeInLens={(node) => {
              setSelection({
                entityName: node.label,
                entityType: node.kind.toUpperCase(),
                canonicalRef: node.knowledgeKey || node.canonicalRef,
                graphNodeId: node.id,
              });
              setIsGlobalLensOpen(true);
            }}
            onNavigateTab={openWorkspace}
          />
        );

      case 'projections':
        return (
          <ProjectionsWorkspace
            mission={mission}
            requestedFormat={projectionFormat}
            onFormatChange={setProjectionFormat}
          />
        );

      case 'destination-compare':
        return (
          <DestinationCompare
            mission={mission}
            selection={selection}
            onSelectDifference={(diff) => {
              setSelection({
                fieldId: diff.id,
                entityName: diff.field,
                entityType: 'RECONCILIATION_ITEM',
                canonicalRef: diff.canonicalRef,
              });
            }}
            onNavigateTab={(nextTab) => openWorkspace(nextTab as ActiveWorkspaceTab)}
          />
        );

      case 'comet':
        return (
          <CometAdapterWorkspace
            mission={mission}
            mode={cometMode}
            onChangeMode={setCometMode}
          />
        );

      default:
        return (
          <div className="h-full flex items-center justify-center font-mono text-slate-500 text-xs">
            Select a workspace
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050b16] text-slate-100 font-sans select-none">
      <CompactCommandHeader
        mission={mission}
        activePrimaryTab={primaryTab}
        activeSecondaryTab={companionTab}
        selection={selection}
        onOpenMantasScript={(mode) => {
          setMantasScriptInitialMode(mode || 'SCRIPT');
          setIsMantasScriptOpen(true);
        }}
        onToggleGlobalLens={() => setIsGlobalLensOpen((prev) => !prev)}
        isGlobalLensOpen={isGlobalLensOpen}
        onSelectTab={(tab, targetPane = 'PRIMARY') => {
          if (targetPane === 'SECONDARY') setCompanionTab(tab);
          openWorkspace(tab);
        }}
        onLaunchEn2501Demo={() => {
          setPrimaryTab('constellation');
          setCompanionTab('destination-compare');
          showToast('EN2501 flagship: opened evidence-backed Constellation. Destination Compare remains available from the right rail.');
        }}
      />

      {toast && (
        <div className="fixed top-14 right-28 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0e1c31] border border-cyan-400/50 text-xs font-mono text-cyan-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 overflow-hidden">
          <FocusPane
            id="PRIMARY"
            title={primaryTab.toUpperCase()}
            activeTab={primaryTab}
            isFocused
            isMaximized
            heightPercent={100}
            mission={mission}
            selection={selection}
            onActivate={() => undefined}
            onMaximizeToggle={() => undefined}
            onSwitchTab={openWorkspace}
          >
            {renderWorkspace(primaryTab)}
          </FocusPane>
        </div>

        <WorkbenchRightRail
          activeWorkspace={primaryTab}
          activeProjectionFormat={projectionFormat}
          onOpenProjection={openProjection}
          onOpenWorkspace={openWorkspace}
        />
      </main>

      <GlobalLens
        isOpen={isGlobalLensOpen}
        onClose={() => setIsGlobalLensOpen(false)}
        mission={mission}
        selection={selection}
        chatMessages={chatMessages}
        onSendMessage={onSendMessage}
        isChatLoading={isChatLoading}
        onApplySuggestedUpdates={onApplySuggestedUpdates}
        cometMode={cometMode}
        onSwitchWorkspaceTab={(dest) => {
          openWorkspace(dest);
          setIsGlobalLensOpen(false);
        }}
      />

      <MantaScriptCanvas
        isOpen={isMantasScriptOpen}
        onClose={() => setIsMantasScriptOpen(false)}
        initialMode={mantasScriptInitialMode}
        mission={mission}
        selection={selection}
        activePrimaryTab={primaryTab}
        activeSecondaryTab={companionTab}
        onExecuteCommand={(cmd) => {
          if (cmd === 'CLEAN') {
            handleCleanView();
          } else if (cmd === 'SWAP_PANES') {
            const current = primaryTab;
            setPrimaryTab(companionTab);
            setCompanionTab(current);
            showToast('Swapped main workspace with saved companion context.');
          } else if (cmd === 'FOCUS_PRIMARY' || cmd === 'FOCUS_SECONDARY') {
            showToast('Single-canvas mode is active. Open companions from the right rail.');
          } else {
            showToast(`Executed MANTAScript: ${cmd}`);
          }
        }}
        onSelectSearchResult={(res) => {
          showToast(`Selected from Search: ${res.title}`);
          setPrimaryTab('search');
        }}
        onOpenWorkspaceBelow={(tab) => {
          setCompanionTab(tab);
          setPrimaryTab(tab);
          showToast(`Opened ${tab.toUpperCase()} in the main canvas; bottom pane is retired.`);
        }}
        onSelectPrimaryWorkspace={(tab) => {
          setPrimaryTab(tab);
          showToast(`Focused ${tab.toUpperCase()} in main workspace`);
        }}
      />
    </div>
  );
};
