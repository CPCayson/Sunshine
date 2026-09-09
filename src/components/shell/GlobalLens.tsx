import React, { useState } from 'react';
import { X, Layers, ChevronRight } from 'lucide-react';
import {
  ActiveWorkspaceTab,
  ChatMessage,
  UxSMission,
  WorkspaceSelection,
} from '../../types';
import { CometOperationMode } from '../../services/cometAdapter';

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

type LensTab = 'what' | 'why' | 'trace' | 'prove';

export const GlobalLens: React.FC<GlobalLensProps> = ({
  isOpen,
  onClose,
  mission,
  selection,
  cometMode,
  onSwitchWorkspaceTab,
}) => {
  const [activeTab, setActiveTab] = useState<LensTab>('what');

  if (!isOpen) return null;

  const entityName = selection.entityName || mission.title;
  const canonicalRef = selection.canonicalRef || mission.id;
  const claims = mission.claims || [];
  const unresolvedClaims = claims.filter((claim) => claim.state !== 'ACCEPTED' && claim.state !== 'REJECTED');
  const sourceObservations = mission.sourceObservations || [];

  const tabs: Array<{ id: LensTab; label: string }> = [
    { id: 'what', label: 'WHAT' },
    { id: 'why', label: 'WHY' },
    { id: 'trace', label: 'TRACE' },
    { id: 'prove', label: 'PROVE IT' },
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
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-600">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>MANTA Lens · visual companion</span>
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
            className={`py-3 text-[11px] tracking-[0.08em] transition-colors border-b ${
              activeTab === tab.id
                ? 'text-cyan-200 border-cyan-400'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-[#050a12] overflow-y-auto">
        {activeTab === 'what' && (
          <div className="px-6 py-7">
            <div className="max-w-sm space-y-7">
              <section>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Selected meaning</div>
                <div className="mt-2 text-xl font-medium text-slate-100 leading-snug">{entityName}</div>
                <div className="mt-2 text-xs font-mono text-slate-500 break-all">{canonicalRef}</div>
              </section>

              <section className="space-y-4 border-t border-slate-900 pt-6">
                <CalmRow label="Mission" value={mission.alternateTitle || mission.id} />
                <CalmRow label="Platform" value={mission.platform.name} />
                <CalmRow label="Time" value={`${mission.dateStart} – ${mission.dateEnd}`} />
                <CalmRow label="Place" value={mission.spatialExtent.placeName || 'Spatial extent available'} />
              </section>

              <section className="border-t border-slate-900 pt-6 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">State boundary</div>
                <TruthRow label="Sunshine" value="LOCAL PROTOTYPE" />
                <TruthRow label="Zen" value="NOT CONNECTED" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  This view is a visual exploration surface. It does not establish canonical NOAA metadata truth.
                </p>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'why' && (
          <div className="px-6 py-7 space-y-7">
            <section>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">How meaning got here</div>
              <div className="mt-2 text-lg font-medium text-slate-100">Evidence → candidate → decision</div>
              <div className="mt-2 text-sm text-slate-500">
                {sourceObservations.length} observed source{sourceObservations.length === 1 ? '' : 's'} · {unresolvedClaims.length} claim{unresolvedClaims.length === 1 ? '' : 's'} needing review
              </div>
            </section>

            <section className="space-y-4 border-t border-slate-900 pt-6">
              {unresolvedClaims.length === 0 && (
                <div className="text-sm text-slate-600">No unresolved candidate claims are currently attached to this local mission snapshot.</div>
              )}
              {unresolvedClaims.slice(0, 5).map((claim) => (
                <div key={claim.id} className="relative pl-5">
                  <div className="absolute left-[3px] top-1 bottom-[-16px] border-l border-slate-800 last:hidden" />
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border border-amber-500/50 bg-[#090e16]" />
                  <div className="text-[10px] uppercase tracking-[0.12em] text-amber-400/80">{claim.state}</div>
                  <div className="mt-1 text-sm text-slate-200 leading-relaxed">
                    {claim.subject} → {String(claim.objectValue)}
                  </div>
                  {claim.whyExplanation && <div className="mt-1 text-xs text-slate-600 leading-relaxed">{claim.whyExplanation}</div>}
                </div>
              ))}
            </section>

            <TextAction label="Open Evidence" onClick={() => openWorkspace('evidence')} />
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="px-6 py-7 space-y-8">
            <section>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Inward</div>
              <div className="mt-3 space-y-3">
                <TraceStep label="SOURCE" value={sourceObservations[0]?.sourceTitle || 'No selected source observation'} />
                <TraceStep label="OBSERVED" value={sourceObservations.length ? `${sourceObservations.length} source observation(s)` : 'No observed evidence selected'} />
                <TraceStep label="CANDIDATE" value={unresolvedClaims.length ? `${unresolvedClaims.length} relationship / field candidate(s)` : 'No unresolved candidates'} />
                <TraceStep label="LOCAL MISSION" value={mission.id} />
              </div>
            </section>

            <section className="border-t border-slate-900 pt-6">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Outward</div>
              <div className="mt-3 space-y-3">
                <TraceStep label="ISO" value="LOCAL PROJECTION" />
                <TraceStep label="STAC" value="LOCAL PROJECTION" />
                <TraceStep label="CoMET" value={cometMode.replace(/_/g, ' ')} />
                <TraceStep label="OISS" value="NOT_TESTED" />
              </div>
            </section>

            <div className="flex flex-wrap gap-4">
              <TextAction label="Open Rosetta" onClick={() => openWorkspace('rosetta')} />
              <TextAction label="Open Projections" onClick={() => openWorkspace('projections')} />
              <TextAction label="Open CoMET" onClick={() => openWorkspace('comet')} />
            </div>
          </div>
        )}

        {activeTab === 'prove' && (
          <div className="px-6 py-7 space-y-8">
            <section>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Scoped assurance</div>
              <div className="mt-2 text-lg font-medium text-slate-100">What can this surface actually prove?</div>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Local checks can describe this prototype snapshot and its generated artifacts. They do not establish CoMET acceptance or OISS archive acceptance.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-900 pt-6">
              <TruthRow label="Local rules" value="LOCAL DERIVED" />
              <TruthRow label="ISO projection" value="LOCAL PROJECTION" />
              <TruthRow label="CoMET" value="NOT_TESTED" />
              <TruthRow label="OISS" value="NOT_TESTED" />
              <TruthRow label="Zen authority" value="NOT CONNECTED" />
            </section>

            <section className="border-t border-slate-900 pt-6">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Does not prove</div>
              <div className="mt-3 text-sm text-slate-500 leading-relaxed">
                A local score, generated XML, hash, or AI suggestion is not an external authority receipt and is not equivalent to a destination PASS.
              </div>
            </section>

            <TextAction label="Open Signal details" onClick={() => openWorkspace('signal')} />
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-slate-900 text-[9px] uppercase tracking-[0.14em] text-slate-700 shrink-0">
        Sunshine · visual companion · not a system of record
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

const TruthRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-900/80 last:border-b-0">
    <span className="text-xs text-slate-600">{label}</span>
    <span className="text-[10px] font-mono tracking-[0.08em] text-slate-300">{value}</span>
  </div>
);

const TraceStep: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="grid grid-cols-[86px_1fr] gap-4 items-start">
    <div className="text-[10px] font-mono tracking-[0.12em] text-cyan-500/70">{label}</div>
    <div className="text-sm text-slate-300 leading-relaxed break-words">{value}</div>
  </div>
);

const TextAction: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-200">
    {label}
    <ChevronRight className="w-3.5 h-3.5" />
  </button>
);
