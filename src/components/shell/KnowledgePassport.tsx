import React, { useMemo } from 'react';
import { AlertTriangle, ChevronRight, Database, GitBranch, History, ShieldCheck } from 'lucide-react';
import { ActiveWorkspaceTab, UxSMission, WorkspaceSelection } from '../../types';
import {
  VERIFIED_NOAA_UXS_CORPUS,
  VerifiedUxSAssetRecord,
  buildKnowledgeKeyCandidate,
} from '../../data/verifiedNoaaCorpus';
import { getSourceBackedRelationshipAssessment } from '../../services/verifiedCorpusAdapter';
import { CompactAccordion } from './CompactAccordion';

export interface KnowledgePassportProps {
  selection: WorkspaceSelection;
  mission: UxSMission;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
  onSelectEntity?: (entityKey: string) => void;
}

const normalize = (value?: string) => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const findVerifiedCorpusRecord = (
  selection: WorkspaceSelection,
  mission: UxSMission
): VerifiedUxSAssetRecord | null => {
  const terms = [
    selection.entityName,
    selection.canonicalRef,
    selection.graphNodeId,
    mission.platform.physicalAssetId,
    mission.platform.name,
    mission.platform.modelId,
  ]
    .filter(Boolean)
    .map((value) => normalize(String(value)));

  if (!terms.length) return null;

  const exactIdentifier = VERIFIED_NOAA_UXS_CORPUS.find((record) => {
    const candidates = [record.id, record.serialOrIdentifier, record.cdNumber, record.sourceRef]
      .filter(Boolean)
      .map((value) => normalize(String(value)));
    return candidates.some((candidate) => candidate && terms.some((term) => term.includes(candidate)));
  });

  if (exactIdentifier) return exactIdentifier;

  return (
    VERIFIED_NOAA_UXS_CORPUS.find((record) => {
      const model = normalize(record.model);
      return model && terms.some((term) => term.includes(model));
    }) || null
  );
};

const stateLabel = (state: ReturnType<typeof getSourceBackedRelationshipAssessment>[number]['state']) => {
  switch (state) {
    case 'SUPPORTED_BY_SOURCE_ROW':
      return 'supported';
    case 'SOURCE_MENTION_ONLY':
      return 'mentioned';
    default:
      return 'unresolved';
  }
};

export const KnowledgePassport: React.FC<KnowledgePassportProps> = ({
  selection,
  mission,
  onNavigateTab,
}) => {
  const record = useMemo(
    () => findVerifiedCorpusRecord(selection, mission),
    [selection.entityName, selection.canonicalRef, selection.graphNodeId, mission.platform.physicalAssetId, mission.platform.name, mission.platform.modelId]
  );

  const relationships = useMemo(
    () => (record ? getSourceBackedRelationshipAssessment(record) : []),
    [record]
  );

  const relationshipCounts = relationships.reduce(
    (acc, relationship) => {
      const label = stateLabel(relationship.state);
      acc[label] += 1;
      return acc;
    },
    { supported: 0, mentioned: 0, unresolved: 0 }
  );

  const entityName =
    selection.entityName ||
    (record
      ? `${record.manufacturer} ${record.model}${record.serialOrIdentifier ? ` #${record.serialOrIdentifier}` : ''}`
      : mission.platform.name || mission.title);

  const entityType = selection.entityType || (record ? 'PHYSICAL ASSET CANDIDATE' : 'MISSION CONTEXT');
  const identityRef = record
    ? buildKnowledgeKeyCandidate(record)
    : selection.canonicalRef || mission.platform.physicalAssetId || mission.platform.modelId || mission.id;

  return (
    <div id="knowledge-passport-calm" className="space-y-5 font-sans text-slate-300">
      <section className="space-y-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
          {record ? 'Source-backed candidate' : 'Selected context'}
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-tight text-slate-100">{entityName}</h2>
          <div className="mt-1 text-xs text-slate-500">{entityType}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#050b15] px-3 py-2 font-mono text-[11px] text-slate-400 break-all">
          {record ? 'Candidate key' : 'Reference'}: <span className="text-cyan-300">{identityRef}</span>
        </div>
      </section>

      {record ? (
        <section className="grid grid-cols-3 gap-4 border-y border-slate-800 py-4 text-center">
          <div>
            <div className="text-lg font-semibold text-slate-100">1</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-600">source row</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-100">{record.supports.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-600">observations</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-100">
              {relationshipCounts.supported}/{relationshipCounts.mentioned}/{relationshipCounts.unresolved}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-600">support / mention / open</div>
          </div>
        </section>
      ) : (
        <section className="border-y border-slate-800 py-4 text-sm text-slate-500">
          No verified corpus row is bound to this selection. The passport is showing mission context only.
        </section>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <button
          onClick={() => onNavigateTab?.('evidence')}
          className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200"
        >
          <Database className="h-3.5 w-3.5" /> Evidence <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => onNavigateTab?.('graph')}
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
        >
          <GitBranch className="h-3.5 w-3.5" /> Relationships <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => onNavigateTab?.('lifecycle')}
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
        >
          <History className="h-3.5 w-3.5" /> History <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="border-t border-slate-800">
        <CompactAccordion
          title="Identity"
          primaryValue={record ? record.identityState.replaceAll('_', ' ') : 'mission context'}
        >
          {record ? (
            <div className="space-y-2 text-xs text-slate-400">
              <div><span className="text-slate-500">Manufacturer</span><div className="text-slate-200">{record.manufacturer}</div></div>
              <div><span className="text-slate-500">Model / identifier</span><div className="text-slate-200">{record.model}{record.serialOrIdentifier ? ` / ${record.serialOrIdentifier}` : ''}</div></div>
              {record.cdNumber && <div><span className="text-slate-500">CD number</span><div className="font-mono text-slate-300">{record.cdNumber}</div></div>}
              <div><span className="text-slate-500">Identity basis</span><div className="text-slate-300">{record.identityBasis}</div></div>
              <div><span className="text-slate-500">Source years</span><div className="text-slate-300">{record.sourceYears.join(', ')}</div></div>
              {record.physicalLocation && <div><span className="text-slate-500">Observed location</span><div className="text-slate-300">{record.physicalLocation}</div></div>}
              {record.status && <div><span className="text-slate-500">Observed status</span><div className="text-slate-300">{record.status}</div></div>}
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-400">
              <div><span className="text-slate-500">Mission</span><div className="text-slate-200">{mission.title}</div></div>
              <div><span className="text-slate-500">Platform</span><div className="text-slate-200">{mission.platform.name}</div></div>
              <div><span className="text-slate-500">Model</span><div className="text-slate-300">{mission.platform.modelId || 'Not stated'}</div></div>
            </div>
          )}
        </CompactAccordion>

        <CompactAccordion
          title="Evidence"
          count={record ? record.supports.length : 0}
          primaryValue={record ? 'imported source' : 'not bound'}
        >
          {record ? (
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-600">Source</div>
                <div className="mt-1 text-slate-200">{record.sourceArtifact}</div>
                <div className="font-mono text-[11px] text-cyan-300">{record.sourceRef}</div>
                <div className="mt-1 text-[11px] text-slate-500">Provenance: {record.provenanceType}</div>
              </div>
              <div className="space-y-2">
                {record.supports.map((support, index) => (
                  <div key={index} className="flex gap-2 text-slate-300">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" />
                    <span>{support}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Open Evidence to inspect observations and claims for the current mission selection.</div>
          )}
        </CompactAccordion>

        <CompactAccordion
          title="Relationships"
          count={relationships.length}
          primaryValue={record ? `${relationshipCounts.unresolved} open` : 'not evaluated'}
        >
          {record ? (
            <div className="divide-y divide-slate-800/80 text-xs">
              {relationships.map((relationship) => (
                <div key={relationship.predicate} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-slate-200">{relationship.predicate}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      {stateLabel(relationship.state)}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{relationship.explanation}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">No source-backed relationship assessment is available for this selection.</div>
          )}
        </CompactAccordion>

        <CompactAccordion
          title="Limits of evidence"
          count={record ? record.doesNotProve.length : 0}
          primaryValue={record ? 'does not prove' : 'scope'}
        >
          {record ? (
            <div className="space-y-2 text-xs text-slate-400">
              {record.doesNotProve.map((boundary, index) => (
                <div key={index} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                  <span>{boundary}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              This view does not assert external validation, execution, archival, or discovery outcomes without named authority evidence.
            </div>
          )}
        </CompactAccordion>
      </div>
    </div>
  );
};
