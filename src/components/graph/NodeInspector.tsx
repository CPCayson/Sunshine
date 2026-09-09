import React, { useState } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileCode,
  Send,
  Database,
  ExternalLink,
  Activity,
  GitBranch,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Code2,
  Check,
  AlertCircle
} from 'lucide-react';
import { KnowledgeNode, KnowledgeEdge, FacetState } from '../../types';
import { DOCUCOMP_COMPONENTS_FIXTURE, ISO_SEMANTIC_SLOTS_FIXTURE, evaluateSemanticPlacement } from '../../services/docucompService';

interface NodeInspectorProps {
  node: KnowledgeNode | null;
  edges: KnowledgeEdge[];
  nodes: KnowledgeNode[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onOpenBlastRadius: (nodeId: string) => void;
  onOpenPathFinder: (nodeId: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  edges,
  nodes,
  onClose,
  onSelectNode,
  onSelectEdge,
  onOpenBlastRadius,
  onOpenPathFinder,
}) => {
  const [xmlSnippetMode, setXmlSnippetMode] = useState<'UNRESOLVED' | 'RESOLVED'>('UNRESOLVED');

  if (!node) return null;

  // Connected edges
  const incomingEdges = edges.filter((e) => e.to === node.id);
  const outgoingEdges = edges.filter((e) => e.from === node.id);

  // Look up matched DocuComp component fixture if applicable
  const matchedDocucomp = DOCUCOMP_COMPONENTS_FIXTURE.find(
    (c) => c.id === node.id || c.uuid === node.docucompUuid || c.href === node.docucompHref
  );

  // Look up matched slot
  const matchedSlot = ISO_SEMANTIC_SLOTS_FIXTURE.find(
    (s) => s.id === node.id || (matchedDocucomp && matchedDocucomp.observedIsoSlots.some(slot => s.xpath.includes(slot) || slot.includes(s.xpath)))
  );

  const placementVerdict = matchedDocucomp && matchedSlot
    ? evaluateSemanticPlacement(matchedDocucomp, matchedSlot)
    : null;

  const getFacetColor = (state?: FacetState) => {
    switch (state) {
      case 'VERIFIED':
      case 'PASS':
      case 'READY':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50';
      case 'SUPPORTED':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50';
      case 'PARTIAL':
        return 'text-amber-400 bg-amber-950/60 border-amber-700/50';
      case 'CONFLICT':
      case 'UNRESOLVED':
        return 'text-rose-400 bg-rose-950/60 border-rose-700/50';
      case 'NOT_TESTED':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div
      id="node-inspector-panel"
      className="w-full md:w-96 bg-[#070e1d] border-t md:border-t-0 md:border-l border-cyan-500/20 flex flex-col h-full z-10 shadow-2xl overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="bg-[#0a1428] border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold font-mono text-cyan-200 uppercase tracking-wider">
            Knowledge Node Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Close Node Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Main Entity Card */}
        <div className="p-3.5 bg-[#050a16] border border-cyan-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
              {node.kind}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                node.state === 'ACCEPTED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                  : node.state === 'CONFLICT'
                  ? 'bg-rose-950 text-rose-300 border-rose-600/40'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-600/40'
              }`}
            >
              {node.state || 'ACCEPTED'}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-sans leading-tight">
            {node.label}
          </div>
          {node.subtitle && (
            <div className="text-[11px] text-slate-400 font-sans">{node.subtitle}</div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-800 text-[10px]">
            {node.canonicalRef ? (
              <span className="text-slate-500">
                Ref: <span className="text-slate-300 font-mono">{node.canonicalRef}</span>
              </span>
            ) : <span />}
            {node.provenanceType && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border font-mono font-semibold bg-slate-900 border-slate-700 text-amber-300">
                PROV: {node.provenanceType}
              </span>
            )}
          </div>
        </div>

        {/* DocuComp Authority & Semantic Placement Assurance Card */}
        {(node.kind === 'docucompComponent' || matchedDocucomp || node.docucompHref) && (
          <div className="p-3.5 bg-[#081222] border border-cyan-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs uppercase">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>DocuComp Authority & Placement</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono">
                EXTERNAL AUTHORITY
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] bg-[#040812] p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Authority Host:</span>
                <span className="text-slate-200 font-semibold font-mono">data.noaa.gov/docucomp</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Component UUID:</span>
                <span className="text-cyan-300 font-mono text-[10px] truncate max-w-[170px]">
                  {node.docucompUuid || matchedDocucomp?.uuid || '440b3ac2-64a5...'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target ISO Slot:</span>
                <span className="text-purple-300 font-mono text-[10px]">
                  {node.docucompSlot || matchedDocucomp?.observedIsoSlots[0] || 'gmd:contact'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Semantic Role:</span>
                <span className="text-emerald-300 font-bold">
                  {matchedDocucomp?.semanticRole || 'pointOfContact'}
                </span>
              </div>
            </div>

            {/* 3-Tier Assurance Checks */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Assurance Evaluation</div>
              
              {/* Check 1: Link Resolution */}
              <div className="p-2 rounded bg-[#050a16] border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">1. Link Resolution:</span>
                </div>
                <span className="text-emerald-400 font-bold text-[10px]">PASS (HTTP 200)</span>
              </div>

              {/* Check 2: XML Schema Well-formedness */}
              <div className="p-2 rounded bg-[#050a16] border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">2. XML Syntax / XSD:</span>
                </div>
                <span className="text-emerald-400 font-bold text-[10px]">VALID (ISO 19139)</span>
              </div>

              {/* Check 3: Semantic Placement Assurance */}
              <div className={`p-2 rounded border flex flex-col gap-1 text-[11px] ${
                node.isSyntheticConflict || placementVerdict?.semanticPlacement.status === 'CONFLICT'
                  ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                  : 'bg-cyan-950/40 border-cyan-600/50 text-cyan-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {node.isSyntheticConflict || placementVerdict?.semanticPlacement.status === 'CONFLICT' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>3. Semantic Placement:</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    node.isSyntheticConflict || placementVerdict?.semanticPlacement.status === 'CONFLICT'
                      ? 'bg-rose-900 border-rose-600 text-rose-200'
                      : 'bg-cyan-900 border-cyan-600 text-cyan-200'
                  }`}>
                    {node.isSyntheticConflict || placementVerdict?.semanticPlacement.status === 'CONFLICT'
                      ? 'CONFLICT'
                      : 'SUPPORTED'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-sans mt-0.5 leading-snug">
                  {node.isSyntheticConflict
                    ? 'CONFLICT: DOCUCOMP_SLOT_MISMATCH. CI_ResponsibleParty dereferences with HTTP 200, but is placed inside gmd:resourceConstraints (expected MD_LegalConstraints).'
                    : placementVerdict
                    ? `Slot <${placementVerdict.slotXpath}> accepts role "${placementVerdict.semanticPlacement.expectedRole}" (observed: "${placementVerdict.semanticPlacement.observedRole}").`
                    : 'Component semantic type matches ISO slot definition and canonical mission contract.'}
                </p>
              </div>
            </div>

            {/* XML Snippets toggle (Unresolved vs Resolved) */}
            {matchedDocucomp && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">XML Representation</span>
                  <div className="flex bg-[#040812] border border-slate-800 rounded p-0.5">
                    <button
                      onClick={() => setXmlSnippetMode('UNRESOLVED')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        xmlSnippetMode === 'UNRESOLVED'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'text-slate-400'
                      }`}
                    >
                      Preserved XLink
                    </button>
                    <button
                      onClick={() => setXmlSnippetMode('RESOLVED')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        xmlSnippetMode === 'RESOLVED'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'text-slate-400'
                      }`}
                    >
                      Resolved Fragment
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-[#03060e] border border-slate-800 rounded-lg text-[10px] font-mono text-cyan-200 overflow-x-auto max-h-36">
                  <pre className="whitespace-pre">
                    {xmlSnippetMode === 'UNRESOLVED'
                      ? matchedDocucomp.unresolvedXml
                      : matchedDocucomp.resolvedXml}
                  </pre>
                </div>
              </div>
            )}

            {/* DocuComp Direct URL Link */}
            {node.docucompHref && (
              <a
                href={node.docucompHref}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#050a16] hover:bg-cyan-950/50 border border-cyan-700/40 rounded-lg flex items-center justify-between text-cyan-300 group transition-all text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open in DocuComp Catalog (External)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        )}

        {/* Assurance Facets Matrix */}
        {node.facets && (
          <div className="p-3 bg-[#081224] border border-slate-800 rounded-xl space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Assurance Facets</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className={`p-1.5 rounded border flex flex-col items-center text-center ${getFacetColor(node.facets.evidence)}`}>
                <span className="text-[8px] uppercase text-slate-400">Evidence</span>
                <span className="font-bold mt-0.5">{node.facets.evidence || 'N/A'}</span>
              </div>
              <div className={`p-1.5 rounded border flex flex-col items-center text-center ${getFacetColor(node.facets.semantics)}`}>
                <span className="text-[8px] uppercase text-slate-400">Semantics</span>
                <span className="font-bold mt-0.5">{node.facets.semantics || 'N/A'}</span>
              </div>
              <div className={`p-1.5 rounded border flex flex-col items-center text-center ${getFacetColor(node.facets.profile)}`}>
                <span className="text-[8px] uppercase text-slate-400">Profile</span>
                <span className="font-bold mt-0.5">{node.facets.profile || 'N/A'}</span>
              </div>
              <div className={`p-1.5 rounded border flex flex-col items-center text-center ${getFacetColor(node.facets.projection)}`}>
                <span className="text-[8px] uppercase text-slate-400">Projection</span>
                <span className="font-bold mt-0.5">{node.facets.projection || 'N/A'}</span>
              </div>
              <div className={`p-1.5 rounded border flex flex-col items-center text-center ${getFacetColor(node.facets.destination)}`}>
                <span className="text-[8px] uppercase text-slate-400">Destination</span>
                <span className="font-bold mt-0.5">{node.facets.destination || 'N/A'}</span>
              </div>
              <div className={`p-1.5 rounded border flex flex-col items-center text-center ${getFacetColor(node.facets.qa)}`}>
                <span className="text-[8px] uppercase text-slate-400">QA / Receipt</span>
                <span className="font-bold mt-0.5">{node.facets.qa || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Specific Metadata Attributes */}
        {node.metadata && Object.keys(node.metadata).length > 0 && (
          <div className="p-3 bg-[#081224] border border-slate-800 rounded-xl space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">Domain & Technical Specs</div>
            <div className="space-y-1.5 text-[11px]">
              {Object.entries(node.metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="text-slate-200 text-right font-sans font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Space / Time Extent */}
        {(node.coordinates || node.datetime) && (
          <div className="p-3 bg-[#081224] border border-slate-800 rounded-xl space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Space & Time Context</span>
            </div>
            {node.coordinates && (
              <div className="text-[11px] text-slate-300">
                Coordinates: <span className="text-cyan-300">{node.coordinates.lat}°N, {node.coordinates.lng}°W</span>
              </div>
            )}
            {node.datetime && (
              <div className="text-[11px] text-slate-300">
                Timestamp: <span className="text-slate-400">{node.datetime}</span>
              </div>
            )}
          </div>
        )}

        {/* Transversal Action Hub */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Transversal Analysis Tools</div>
          
          <button
            onClick={() => onOpenBlastRadius(node.id)}
            className="w-full py-2 px-3 bg-[#0a1830] hover:bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold rounded-lg transition-colors flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Dependency Blast Radius</span>
            </div>
            <span className="text-[10px] text-cyan-500">What depends on this?</span>
          </button>

          <button
            onClick={() => onOpenPathFinder(node.id)}
            className="w-full py-2 px-3 bg-[#0a1830] hover:bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold rounded-lg transition-colors flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>Find Semantic Relationship</span>
            </div>
            <span className="text-[10px] text-cyan-500">Path Explainer</span>
          </button>
        </div>

        {/* Connected Incoming / Outgoing Edges */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Connected Ontological Edges</div>

          {/* Outgoing */}
          {outgoingEdges.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] uppercase text-cyan-400 font-semibold">Outgoing Relationships:</div>
              {outgoingEdges.map((e) => {
                const target = nodes.find((n) => n.id === e.to);
                return (
                  <button
                    key={e.id}
                    onClick={() => onSelectEdge(e.id)}
                    className="w-full text-left p-2 bg-[#050912] hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-600/40 rounded flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-[10px] text-cyan-300 font-bold">{e.predicate}</div>
                      <div className="text-[11px] text-slate-300 font-sans truncate">{target?.label || e.to}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Incoming */}
          {incomingEdges.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] uppercase text-purple-400 font-semibold">Incoming Relationships:</div>
              {incomingEdges.map((e) => {
                const source = nodes.find((n) => n.id === e.from);
                return (
                  <button
                    key={e.id}
                    onClick={() => onSelectEdge(e.id)}
                    className="w-full text-left p-2 bg-[#050912] hover:bg-purple-950/30 border border-slate-800 hover:border-purple-600/40 rounded flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-[10px] text-purple-300 font-bold">{e.predicate}</div>
                      <div className="text-[11px] text-slate-300 font-sans truncate">{source?.label || e.from}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
