import React, { useState, useCallback } from 'react';
import {
  UxSMission,
  ActiveWorkspaceTab,
  ChatMessage,
  FederatedSearchResult,
  PaneId,
  PaneFocusMode,
  WorkspaceSelection
} from '../../types';
import { CompactCommandHeader } from './CompactCommandHeader';
import { FocusPane } from './FocusPane';
import { FocusSeam } from './FocusSeam';
import { CollapsedPaneDock } from './CollapsedPaneDock';
import { GlobalLens } from './GlobalLens';
import { MantaScriptCanvas, MantasScriptMode } from './MantaScriptCanvas';
import { CometOperationMode } from '../../services/cometAdapter';

// Workspaces
import { MantasSearch } from '../MantasSearch';
import { CharlieIntakeWorkspace } from '../CharlieIntakeWorkspace';
import { MetadataForm } from '../MetadataForm';
import { EvidenceWorkspace } from '../EvidenceWorkspace';
import { MissionGraph } from '../MissionGraph';
import { SignalAssurance } from '../SignalAssurance';
import { RosettaViewer } from '../RosettaViewer';
import { ProjectionsWorkspace } from '../ProjectionsWorkspace';
import { CometAdapterWorkspace } from '../CometAdapterWorkspace';
import { DestinationCompare } from '../DestinationCompare';
import { InteractiveOceanMap } from '../InteractiveOceanMap';
import { UxSDataLifecycle } from '../UxSDataLifecycle';
import { KnowledgeTreeProjection } from '../KnowledgeTreeProjection';
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
  // Active Workspaces in Two Panes
  const [primaryTab, setPrimaryTab] = useState<ActiveWorkspaceTab>('graph');
  const [secondaryTab, setSecondaryTab] = useState<ActiveWorkspaceTab>('map');

  // Shared Workspace Selection State
  const [selection, setSelection] = useState<WorkspaceSelection>({
    canonicalRef: mission.id,
    entityName: mission.platform.name,
    entityType: 'PLATFORM',
  });

  // Pane Focus & Layout State
  const [focusMode, setFocusMode] = useState<PaneFocusMode>('BALANCED');
  const [activePane, setActivePane] = useState<PaneId>('PRIMARY');
  const [splitRatio, setSplitRatio] = useState<number>(55); // Primary % in balanced mode

  // Slide-over Stack State
  const [isGlobalLensOpen, setIsGlobalLensOpen] = useState(false);
  const [isMantasScriptOpen, setIsMantasScriptOpen] = useState(false);
  const [mantasScriptInitialMode, setMantasScriptInitialMode] = useState<MantasScriptMode>('SCRIPT');

  // Corpus selections use the same WorkspaceSelection contract as every other workbench surface.
  // The corpus remains a source-evidence overlay; selecting an imported record does not mutate UxsMission.
  React.useEffect(() => {
    const handleCorpusSelection = (event: Event) => {
      const detail = (event as CustomEvent<CorpusSelectionEventDetail>).detail;
      if (!detail?.selection) return;

      setSelection(detail.selection);
      showToast(`Corpus selection: ${detail.selection.entityName || detail.selection.graphNodeId || 'source-backed asset'}`);

      if (detail.openGraph) {
        setPrimaryTab('graph');
        setActivePane('PRIMARY');
        setFocusMode('PRIMARY_FOCUSED');
      }
    };

    window.addEventListener('manta:corpus-selection', handleCorpusSelection as EventListener);
    return () => window.removeEventListener('manta:corpus-selection', handleCorpusSelection as EventListener);
  }, [showToast]);

  // Keyboard Shortcuts (Cmd+K, Cmd+/, Shift+1, Shift+2, Esc)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
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
        if (isMantasScriptOpen) {
          setIsMantasScriptOpen(false);
        } else if (isGlobalLensOpen) {
          setIsGlobalLensOpen(false);
        }
      } else if (e.shiftKey && e.key === '!' && !isMantasScriptOpen) {
        // Shift + 1
        e.preventDefault();
        handleFocusPane('PRIMARY');
      } else if (e.shiftKey && e.key === '@' && !isMantasScriptOpen) {
        // Shift + 2
        e.preventDefault();
        handleFocusPane('SECONDARY');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMantasScriptOpen, isGlobalLensOpen]);

  // Meaningful Activation Handlers (NOT triggered on hover)
  const handleActivatePane = (id: PaneId) => {
    setActivePane(id);
    if (id === 'SECONDARY' && focusMode === 'PRIMARY_FOCUSED') {
      setFocusMode('SECONDARY_FOCUSED');
    } else if (id === 'PRIMARY' && focusMode === 'SECONDARY_FOCUSED') {
      setFocusMode('PRIMARY_FOCUSED');
    }
  };

  const handleFocusPane = (id: PaneId) => {
    setActivePane(id);
    if (id === 'PRIMARY') {
      setFocusMode('PRIMARY_FOCUSED');
    } else {
      setFocusMode('SECONDARY_FOCUSED');
    }
  };

  const handleMaximizeToggle = (id: PaneId) => {
    if (id === 'PRIMARY') {
      setFocusMode((prev) => (prev === 'PRIMARY_MAXIMIZED' ? 'BALANCED' : 'PRIMARY_MAXIMIZED'));
    } else {
      setFocusMode((prev) => (prev === 'SECONDARY_MAXIMIZED' ? 'BALANCED' : 'SECONDARY_MAXIMIZED'));
    }
  };

  const handleSwapPanes = () => {
    setPrimaryTab(secondaryTab);
    setSecondaryTab(primaryTab);
    showToast(`Swapped: ${secondaryTab.toUpperCase()} (Top) ↔ ${primaryTab.toUpperCase()} (Bottom)`);
  };

  // Seam Drag Resizing
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startRatio = splitRatio;
    const containerHeight = window.innerHeight - 44; // minus header

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = (deltaY / containerHeight) * 100;
      const newRatio = Math.max(20, Math.min(80, startRatio + deltaPercent));
      setSplitRatio(newRatio);
      setFocusMode('BALANCED');
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Calculate Pane Heights based on focusMode
  const getPaneHeights = (): { primary: number; secondary: number } => {
    switch (focusMode) {
      case 'PRIMARY_FOCUSED':
        return { primary: 88, secondary: 12 };
      case 'SECONDARY_FOCUSED':
        return { primary: 12, secondary: 88 };
      case 'PRIMARY_MAXIMIZED':
        return { primary: 100, secondary: 0 };
      case 'SECONDARY_MAXIMIZED':
        return { primary: 0, secondary: 100 };
      case 'BALANCED':
      default:
        return { primary: splitRatio, secondary: 100 - splitRatio };
    }
  };

  const heights = getPaneHeights();

  // Non-destructive CLEAN command executor
  const handleCleanView = () => {
    setFocusMode('BALANCED');
    setSplitRatio(55);
    showToast('Cleaned Surface: Collapsed resolved elements and normalized workbench layout.');
  };

  // Render individual workspace inside a given pane
  const renderWorkspace = (tab: ActiveWorkspaceTab, pane: PaneId) => {
    switch (tab) {
      case 'lifecycle':
        return (
          <UxSDataLifecycle
            mission={mission}
            onUpdateMission={setMission}
            onNavigateTab={(dest) => {
              if (pane === 'PRIMARY') setPrimaryTab(dest);
              else setSecondaryTab(dest);
            }}
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
            onSwitchTab={(newTab) => {
              if (pane === 'PRIMARY') setPrimaryTab(newTab);
              else setSecondaryTab(newTab);
            }}
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
              showToast('Batch accepted all candidate claims into UxsMission canonical model!');
            }}
            onJumpToSignal={() => {
              setSecondaryTab('signal');
              setFocusMode('SECONDARY_FOCUSED');
            }}
          />
        );

      case 'mission':
        return (
          <MetadataForm
            mission={mission}
            onChangeMission={setMission}
            onAskAiAboutField={(field, val) => {
              setIsGlobalLensOpen(true);
            }}
            onValidateNow={() => {
              setSecondaryTab('signal');
              setFocusMode('SECONDARY_FOCUSED');
            }}
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
            onNavigateTab={(dest) => {
              setSecondaryTab(dest);
              setFocusMode('BALANCED');
            }}
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
            onSwitchTab={(dest) => {
              if (pane === 'PRIMARY') setPrimaryTab(dest);
              else setSecondaryTab(dest);
            }}
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
            onNavigateTab={(dest) => {
              if (pane === 'PRIMARY') setPrimaryTab(dest);
              else setSecondaryTab(dest);
            }}
          />
        );

      case 'projections':
        return <ProjectionsWorkspace mission={mission} />;

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
            onNavigateTab={(tab) => {
              if (pane === 'PRIMARY') setPrimaryTab(tab as ActiveWorkspaceTab);
              else setSecondaryTab(tab as ActiveWorkspaceTab);
            }}
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
            Select a workspace for this pane
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050b16] text-slate-100 font-sans select-none">
      {/* 1. Compact Command Header */}
      <CompactCommandHeader
        mission={mission}
        activePrimaryTab={primaryTab}
        activeSecondaryTab={secondaryTab}
        selection={selection}
        onOpenMantasScript={(mode) => {
          setMantasScriptInitialMode(mode || 'SCRIPT');
          setIsMantasScriptOpen(true);
        }}
        onToggleGlobalLens={() => setIsGlobalLensOpen((prev) => !prev)}
        isGlobalLensOpen={isGlobalLensOpen}
        onSelectTab={(tab, targetPane = 'PRIMARY') => {
          if (targetPane === 'PRIMARY') {
            setPrimaryTab(tab);
          } else {
            setSecondaryTab(tab);
          }
        }}
        onLaunchEn2501Demo={() => {
          setPrimaryTab('destination-compare');
          setSecondaryTab('lifecycle');
          setFocusMode('BALANCED');
          setSplitRatio(52);
          showToast('EN2501 Flagship Demo: Paired Destination Compare with UxS Lifecycle & OISS Hand-off Profile.');
        }}
      />

      {/* Notification Toast */}
      {toast && (
        <div className="fixed top-14 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1c31] border border-cyan-400 text-xs font-mono text-cyan-200 shadow-2xl shadow-cyan-950/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 2. Main Spatial Workbench (Two Focus Panes + Seam) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* TOP PANE: Expanded or Collapsed Dock */}
        {focusMode === 'SECONDARY_FOCUSED' ? (
          <CollapsedPaneDock
            paneId="PRIMARY"
            viewName={primaryTab}
            selection={selection}
            position="TOP"
            findingCount={3}
            onRestore={() => setFocusMode('BALANCED')}
            onMaximize={() => setFocusMode('PRIMARY_MAXIMIZED')}
          />
        ) : heights.primary > 0 ? (
          <FocusPane
            id="PRIMARY"
            title={`Top Pane · ${primaryTab.toUpperCase()}`}
            activeTab={primaryTab}
            isFocused={activePane === 'PRIMARY'}
            isMaximized={focusMode === 'PRIMARY_MAXIMIZED'}
            heightPercent={heights.primary}
            mission={mission}
            selection={selection}
            onActivate={() => handleActivatePane('PRIMARY')}
            onMaximizeToggle={() => handleMaximizeToggle('PRIMARY')}
            onSwitchTab={setPrimaryTab}
            onSuggestCompanion={(companionTab) => {
              setSecondaryTab(companionTab);
              setFocusMode('BALANCED');
            }}
          >
            {renderWorkspace(primaryTab, 'PRIMARY')}
          </FocusPane>
        ) : null}

        {/* DRAGGABLE FOCUS SEAM (Visible when both panes exist) */}
        {heights.primary > 0 && heights.secondary > 0 && focusMode !== 'PRIMARY_FOCUSED' && focusMode !== 'SECONDARY_FOCUSED' && (
          <FocusSeam
            onDragStart={handleDragStart}
            onDoubleClick={() => {
              setSplitRatio(55);
              setFocusMode('BALANCED');
            }}
            onSwapPanes={handleSwapPanes}
            onFocusPrimary={() => handleFocusPane('PRIMARY')}
            onFocusSecondary={() => handleFocusPane('SECONDARY')}
            focusMode={focusMode}
          />
        )}

        {/* BOTTOM PANE: Expanded or Collapsed Dock */}
        {focusMode === 'PRIMARY_FOCUSED' ? (
          <CollapsedPaneDock
            paneId="SECONDARY"
            viewName={secondaryTab}
            selection={selection}
            position="BOTTOM"
            findingCount={0}
            onRestore={() => setFocusMode('BALANCED')}
            onMaximize={() => setFocusMode('SECONDARY_MAXIMIZED')}
          />
        ) : heights.secondary > 0 ? (
          <FocusPane
            id="SECONDARY"
            title={`Bottom Pane · ${secondaryTab.toUpperCase()}`}
            activeTab={secondaryTab}
            isFocused={activePane === 'SECONDARY'}
            isMaximized={focusMode === 'SECONDARY_MAXIMIZED'}
            heightPercent={heights.secondary}
            mission={mission}
            selection={selection}
            onActivate={() => handleActivatePane('SECONDARY')}
            onMaximizeToggle={() => handleMaximizeToggle('SECONDARY')}
            onSwitchTab={setSecondaryTab}
          >
            {renderWorkspace(secondaryTab, 'SECONDARY')}
          </FocusPane>
        ) : null}
      </main>

      {/* 3. Global Lens Slide-over (Covers 40-55% of Workbench, can be pinned) */}
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
          setPrimaryTab(dest);
          setIsGlobalLensOpen(false);
        }}
      />

      {/* 4. Full-Surface MANTAScript Canvas (Covers Entire Surface) */}
      <MantaScriptCanvas
        isOpen={isMantasScriptOpen}
        onClose={() => setIsMantasScriptOpen(false)}
        initialMode={mantasScriptInitialMode}
        mission={mission}
        selection={selection}
        activePrimaryTab={primaryTab}
        activeSecondaryTab={secondaryTab}
        onExecuteCommand={(cmd) => {
          if (cmd === 'CLEAN') {
            handleCleanView();
          } else if (cmd === 'SWAP_PANES') {
            handleSwapPanes();
          } else if (cmd === 'FOCUS_PRIMARY') {
            handleFocusPane('PRIMARY');
          } else if (cmd === 'FOCUS_SECONDARY') {
            handleFocusPane('SECONDARY');
          } else {
            showToast(`Executed MANTAScript: ${cmd}`);
          }
        }}
        onSelectSearchResult={(res) => {
          showToast(`Selected from Search: ${res.title}`);
          setPrimaryTab('search');
        }}
        onOpenWorkspaceBelow={(tab) => {
          setSecondaryTab(tab);
          setFocusMode('BALANCED');
          showToast(`Opened ${tab.toUpperCase()} in bottom companion surface`);
        }}
        onSelectPrimaryWorkspace={(tab) => {
          setPrimaryTab(tab);
          showToast(`Focused ${tab.toUpperCase()} in primary workspace`);
        }}
      />
    </div>
  );
};