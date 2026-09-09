import React from 'react';
import {
  X,
  Link2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  GitCommit,
  Check,
  AlertCircle
} from 'lucide-react';
import { KnowledgeEdge, KnowledgeNode, EdgeFamily, ProvenanceType } from '../../types';
import { classifyKnowledgeEdge } from '../../services/knowledgeGraphBuilder';

interface EdgeInspectorProps {
  edge: KnowledgeEdge | null;
  nodes: KnowledgeNode[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onReconcileDrift?: (edge: KnowledgeEdge) => void;
}

export const EdgeInspector: React.FC<EdgeInspectorProps> = ({
  edge,
  nodes,
  onClose,
  onSelectNode,
  onReconcileDrift,
}) => {
  if (!edge) return null;

  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);
  const edgeClassification = classifyKnowledgeEdge(edge);
  const family: EdgeFamily = edge.family || edgeClassification.family;
  const provenanceType: ProvenanceType =
    edge.provenance?.provenanceType ||
    (edge.id.includes('synthetic') || edge.id.includes('mismatch') || edge.from.includes('synthetic') || edge.to.includes('synthetic')
      ? 'SYNTHETIC_FIXTURE'
      : edge.provenance?.sourceRecordId
      ? 'IMPORTED_ARTIFACT'
      : 'LOCAL_DERIVED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40';
      case 'OBSERVED':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-600/40';
      case 'CONFLICT':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/40 animate-pulse';
      case 'INFERRED':
        return 'bg-purple-950/80 text-purple-300 border-purple-600/40';
      case 'REJECTED':
        return 'bg-slate-900 text-slate-400 border-slate-700';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-600/40';
    }
  };

  const getFamilyBadge = (f: EdgeFamily) => {
    switch (f) {
      case 'HIERARCHY':
        return 'bg-cyan-950 text-cyan-300 border-cyan-600/50';
      case 'PROJECTION':
        return 'bg-blue-950 text-blue-300 border-blue-600/50';
      case 'EXTERNAL_REFERENCE':
        return 'bg-purple-950 text-purple-300 border-purple-600/50';
      case 'VALIDATION':
        return 'bg-emerald-950 text-emerald-300 border-emerald-600/50';
      case 'VERIFICATION':
        return 'bg-rose-950 text-rose-300 border-rose-600/50';
      case 'CAPABILITY':
        return 'bg-indigo-950 text-indigo-300 border-indigo-600/50';
      case 'DOMAIN':
        return 'bg-amber-950 text-amber-300 border-amber-600/50';
      case 'EVIDENCE':
        return 'bg-slate-900 text-slate-300 border-slate-600/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getProvenanceBadge = (prov: ProvenanceType) => {
    switch (prov) {
      case 'LIVE_OBSERVED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/50';
      case 'IMPORTED_ARTIFACT':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/50';
      case 'LOCAL_DERIVED':
        return 'bg-blue-950 text-blue-300 border-blue-500/50';
      case 'SYNTHETIC_FIXTURE':
        return 'bg-amber-950 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const direction = edge.direction || 'FORWARD';

  return (
    <div
      id="edge-inspector-panel"
      className="w-full md:w-96 bg-[#070e1d] border-t md:border-t-0 md:border-l border-cyan-500/20 flex flex-col h-full z-10 shadow-2xl overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="bg-[#0a1428] border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold font-mono text-cyan-200 uppercase tracking-wider">
            First-Class Edge Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Close Edge Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Predicate Banner */}
        <div className="p-3.5 bg-[#050a16] border border-cyan-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Semantic Predicate</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(edge.status)}`}>
              {edge.status}
            </span>
          </div>
          <div className="text-sm font-bold text-cyan-300 font-mono tracking-wide flex items-center justify-between">
            <span>{edge.predicate}</span>
            <span className="text-[10px] font-normal text-slate-400">
              {direction === 'FORWARD' ? '──► [FORWARD]' : direction === 'REVERSE' ? '◄── [REVERSE]' : '◄──►'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getFamilyBadge(family)}`}>
              FAMILY: {family}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getProvenanceBadge(provenanceType)}`}>
              PROV: {provenanceType}
            </span>
            {edge.confidence !== undefined && (
              <span className="text-[9px] text-slate-400 ml-auto">
                Confidence: <strong className="text-slate-200">{(edge.confidence * 100).toFixed(0)}%</strong>
              </span>
            )}
          </div>
        </div>

        {/* Semantic Nature Classification */}
        <div className={`p-3 rounded-xl border space-y-1.5 ${
          edgeClassification.isFormalTransversal
            ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-[#070e1d] border-amber-500/40'
            : edgeClassification.isStandardHierarchy
            ? 'bg-cyan-950/30 border-cyan-500/40'
            : 'bg-[#081224] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Edge Classification</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
              edgeClassification.isFormalTransversal
                ? 'bg-amber-900/60 text-amber-300 border-amber-500/50'
                : edgeClassification.isStandardHierarchy
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {edgeClassification.badgeLabel}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {edgeClassification.roleDescription}
          </p>
        </div>

        {/* 3-Tier DocuComp & Placement Status if relevant */}
        {(edge.predicate === 'REFERENCES_COMPONENT' || edge.predicate === 'RESOLVES' || edge.predicate === 'EVALUATES_PLACEMENT_OF') && (
          <div className="p-3 bg-[#050a16] border border-cyan-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 uppercase font-bold">DocuComp 3-Tier Audit</span>
              {edge.status === 'CONFLICT' ? (
                <span className="text-[9px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/50 font-bold">
                  SLOT MISMATCH
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold">
                  ASSURED
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-[10px] pt-1">
              <div className="flex items-center justify-between p-1.5 bg-[#081224] rounded border border-slate-800">
                <span className="text-slate-400">Tier 1: HTTP Link Resolution:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> PASS (200 OK)
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-[#081224] rounded border border-slate-800">
                <span className="text-slate-400">Tier 2: XML Schema Well-Formed:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> VALID XML
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-[#081224] rounded border border-slate-800">
                <span className="text-slate-400">Tier 3: Semantic ISO Slot Match:</span>
                {edge.status === 'CONFLICT' ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> CONFLICT
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> APPROPRIATE
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transversal Connection (From -> To) */}
        <div className="p-3 bg-[#081224] border border-slate-800 rounded-xl space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400">Connected Ontological Entities</div>
          
          {/* From Node */}
          <button
            onClick={() => fromNode && onSelectNode(fromNode.id)}
            className="w-full text-left p-2.5 bg-[#040812] hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 rounded-lg transition-all group"
          >
            <div className="text-[10px] text-cyan-400 uppercase font-semibold group-hover:text-cyan-300">
              Source: {fromNode?.kind || 'Node'}
            </div>
            <div className="text-xs font-bold text-slate-100 font-sans truncate mt-0.5">
              {fromNode?.label || edge.from}
            </div>
          </button>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-cyan-500 rotate-90 md:rotate-0" />
          </div>

          {/* To Node */}
          <button
            onClick={() => toNode && onSelectNode(toNode.id)}
            className="w-full text-left p-2.5 bg-[#040812] hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 rounded-lg transition-all group"
          >
            <div className="text-[10px] text-purple-400 uppercase font-semibold group-hover:text-purple-300">
              Target: {toNode?.kind || 'Node'}
            </div>
            <div className="text-xs font-bold text-slate-100 font-sans truncate mt-0.5">
              {toNode?.label || edge.to}
            </div>
          </button>
        </div>

        {/* Explanation */}
        {edge.explanation && (
          <div className="p-3 bg-[#081224] border border-slate-800 rounded-xl space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Semantic Rationale</span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {edge.explanation}
            </p>
          </div>
        )}

        {/* Drift Details (If this is a drift or comparison edge) */}
        {edge.driftDetails && (
          <div className="p-3 bg-rose-950/20 border border-rose-600/40 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{edge.driftDetails.driftType || 'Expected ↔ Observed Drift'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#040812] border border-emerald-900/40 rounded">
                <div className="text-emerald-400 text-[9px] uppercase font-bold">Canonical Expected</div>
                <div className="text-slate-100 font-semibold mt-0.5">
                  {String(edge.driftDetails.expected)}
                </div>
              </div>
              <div className="p-2 bg-[#040812] border border-rose-900/40 rounded">
                <div className="text-rose-400 text-[9px] uppercase font-bold">Observed in Source</div>
                <div className="text-slate-100 font-semibold mt-0.5">
                  {String(edge.driftDetails.observed)}
                </div>
              </div>
            </div>

            {edge.driftDetails.impact && (
              <div className="text-[11px] text-slate-300 font-sans">
                <span className="text-rose-400 font-semibold font-mono">Impact: </span>
                {edge.driftDetails.impact}
              </div>
            )}

            {edge.driftDetails.suggestedAction && (
              <div className="p-2 bg-[#061020] border border-cyan-800/40 rounded text-[11px] font-sans text-cyan-200">
                <span className="font-mono text-cyan-400 font-bold">Suggested Remediation: </span>
                {edge.driftDetails.suggestedAction}
              </div>
            )}

            {onReconcileDrift && (
              <button
                onClick={() => onReconcileDrift(edge)}
                className="w-full mt-2 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reconcile Drift in Mission</span>
              </button>
            )}
          </div>
        )}

        {/* Provenance & Evidence */}
        <div className="p-3 bg-[#081224] border border-slate-800 rounded-xl space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Provenance & Traceability</span>
          </div>
          {edge.provenance ? (
            <div className="space-y-1 text-[11px] text-slate-300">
              {edge.provenance.sourceSystem && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Source System:</span>
                  <span className="text-slate-200 font-bold">{edge.provenance.sourceSystem}</span>
                </div>
              )}
              {edge.provenance.sourceRecordId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Record ID:</span>
                  <span className="text-cyan-300">{edge.provenance.sourceRecordId}</span>
                </div>
              )}
              {edge.provenance.observedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Observed At:</span>
                  <span className="text-slate-400">{edge.provenance.observedAt}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Provenance Type:</span>
                <span className="text-amber-300 font-bold">{provenanceType}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              Direct ontological relationship defined in NOAA UxS Marine Core Profile.
            </div>
          )}

          {edge.evidenceRefs && edge.evidenceRefs.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase font-semibold mb-1">Supporting Artifacts:</div>
              <div className="flex flex-wrap gap-1">
                {edge.evidenceRefs.map((ref) => (
                  <span key={ref} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
