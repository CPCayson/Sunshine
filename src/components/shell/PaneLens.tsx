import React from 'react';
import { ChevronRight, Database, GitBranch, History, Layers, X } from 'lucide-react';
import { ActiveWorkspaceTab, UxSMission, WorkspaceSelection } from '../../types';
import { KnowledgePassport } from './KnowledgePassport';

interface PaneLensProps {
  isOpen: boolean;
  onClose: () => void;
  paneView: ActiveWorkspaceTab;
  selection: WorkspaceSelection;
  mission: UxSMission;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
}

type LensTab = 'Passport' | 'Context' | 'Inspect';

const labelForPane = (paneView: ActiveWorkspaceTab) => {
  switch (paneView) {
    case 'destination-compare':
      return 'Destination Compare';
    case 'charlie-intake':
      return 'Charlie Intake';
    case 'knowledge-tree':
      return 'Knowledge Tree';
    default:
      return paneView.charAt(0).toUpperCase() + paneView.slice(1);
  }
};

export const PaneLens: React.FC<PaneLensProps> = ({
  isOpen,
  onClose,
  paneView,
  selection,
  mission,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = React.useState<LensTab>('Passport');

  React.useEffect(() => {
    setActiveTab('Passport');
  }, [paneView, selection.canonicalRef, selection.entityName, selection.graphNodeId]);

  if (!isOpen) return null;

  const entityName = selection.entityName || mission.platform.name || mission.title;
  const reference =
    selection.canonicalRef ||
    selection.graphNodeId ||
    mission.platform.physicalAssetId ||
    mission.platform.modelId ||
    mission.id;
  const claims = mission.claims || [];

  const navigate = (tab: ActiveWorkspaceTab) => onNavigateTab?.(tab);

  return (
    <aside
      id="pane-local-lens-slideover"
      className="absolute top-0 right-0 bottom-0 w-[360px] max-w-[92vw] bg-[#060b14] border-l border-slate-800 flex flex-col z-30 font-sans"
    >
      <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{labelForPane(paneView)} lens</div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-100" title={entityName}>{entityName}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          title="Close local lens"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 border-b border-slate-800 flex items-center gap-5 text-xs">
        {(['Passport', 'Context', 'Inspect'] as LensTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 border-b transition-colors ${
              activeTab === tab
                ? 'border-cyan-300 text-cyan-200'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'Passport' && (
          <KnowledgePassport
            selection={selection}
            mission={mission}
            onNavigateTab={onNavigateTab}
          />
        )}

        {activeTab === 'Context' && (
          <div className="space-y-8">
            <section>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Selected object</div>
              <h2 className="mt-2 text-lg font-semibold text-slate-100">{entityName}</h2>
              <div className="mt-1 text-xs text-slate-500">{selection.entityType || 'Workspace selection'}</div>
              <div className="mt-4 rounded-lg border border-slate-800 bg-[#050a12] px-3 py-2 font-mono text-[11px] text-cyan-300 break-all">
                {reference}
              </div>
            </section>

            <section className="border-t border-slate-800 pt-5 space-y-4 text-sm">
              <div>
                <div className="text-xs text-slate-600">Mission</div>
                <div className="mt-1 text-slate-200">{mission.title}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Platform</div>
                <div className="mt-1 text-slate-300">{mission.platform.name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Time</div>
                <div className="mt-1 text-slate-300">{mission.dateStart} → {mission.dateEnd}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Place</div>
                <div className="mt-1 text-slate-300">{mission.spatialExtent.placeName || 'Spatial extent available'}</div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Inspect' && (
          <div className="space-y-8">
            <section>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Evidence at a glance</div>
              <div className="mt-3 text-3xl font-semibold text-slate-100">{claims.length}</div>
              <div className="mt-1 text-xs text-slate-500">mission claims available for inspection</div>
            </section>

            {claims.length > 0 && (
              <section className="border-t border-slate-800 pt-5 space-y-4">
                {claims.slice(0, 3).map((claim) => (
                  <div key={claim.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-slate-300">{claim.predicate}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">{claim.state}</span>
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {claim.subject} → {String(claim.objectValue)}
                    </div>
                  </div>
                ))}
                {claims.length > 3 && (
                  <div className="text-xs text-slate-600">+ {claims.length - 3} more claims</div>
                )}
              </section>
            )}

            <section className="border-t border-slate-800 pt-5 space-y-1">
              <button
                onClick={() => navigate('evidence')}
                className="w-full py-3 flex items-center justify-between text-left text-sm text-slate-300 hover:text-cyan-200"
              >
                <span className="flex items-center gap-2"><Database className="h-4 w-4 text-slate-500" />Evidence</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => navigate('graph')}
                className="w-full py-3 flex items-center justify-between text-left text-sm text-slate-300 hover:text-cyan-200"
              >
                <span className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-slate-500" />Relationships</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => navigate('lifecycle')}
                className="w-full py-3 flex items-center justify-between text-left text-sm text-slate-300 hover:text-cyan-200"
              >
                <span className="flex items-center gap-2"><History className="h-4 w-4 text-slate-500" />History</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => navigate(paneView)}
                className="w-full py-3 flex items-center justify-between text-left text-sm text-slate-300 hover:text-cyan-200"
              >
                <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-slate-500" />Open full {labelForPane(paneView)}</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
};
