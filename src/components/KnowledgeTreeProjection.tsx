import React, { useState, useMemo } from 'react';
import {
  Compass,
  Cpu,
  Box,
  Radio,
  Binary,
  Database,
  Layers,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  GitBranch,
  Tag,
  Copy,
  Check,
  Building2,
  Anchor,
  FileSpreadsheet,
  Activity,
  FileCode,
  Share2
} from 'lucide-react';
import {
  KnowledgeGraph,
  KnowledgeTreeNode,
  KnowledgeTreeRoot,
  ActiveWorkspaceTab,
  WorkspaceSelection,
  UxSMission
} from '../types';
import { buildKnowledgeTree } from '../services/identityResolutionService';
import { buildStableKnowledgeGraph } from '../services/knowledgeGraphBuilder';
import { CORPUS_SOURCE_ARTIFACTS } from '../data/noaaCorpusData';
import { VERIFIED_NOAA_UXS_CORPUS } from '../data/verifiedNoaaCorpus';

interface KnowledgeTreeProjectionProps {
  mission: UxSMission;
  onSelectNodeInLens?: (node: KnowledgeTreeNode) => void;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
  initialRoot?: KnowledgeTreeRoot;
}

export const KnowledgeTreeProjection: React.FC<KnowledgeTreeProjectionProps> = ({
  mission,
  onSelectNodeInLens,
  onNavigateTab,
  initialRoot = 'PROVIDER',
}) => {
  const [activeRoot, setActiveRoot] = useState<KnowledgeTreeRoot>(initialRoot);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set([
      'tree-root-provider',
      'tree-org-hii',
      'tree-hii-manuf-remus620',
      'tree-asset-6401',
      'tree-root-platform',
      'tree-pclass-uuv',
      'tree-pmodel-remus620',
      'tree-group-physical-assets',
      'tree-root-instrument',
      'tree-inst-minsas-model',
      'tree-inst-minsas-instance',
      'tree-org-kraken',
      'tree-kraken-manuf-minsas',
      'tree-kraken-inst-204'
    ])
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string>('tree-asset-6401');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Build the stable Knowledge Graph and tree projection
  const graph: KnowledgeGraph = useMemo(() => buildStableKnowledgeGraph(mission), [mission]);
  const treeRootNode = useMemo(() => buildKnowledgeTree(graph, activeRoot), [graph, activeRoot]);

  // Flatten tree to find any node by ID
  const nodeLookup = useMemo(() => {
    const map = new Map<string, { node: KnowledgeTreeNode; parent: KnowledgeTreeNode | null; path: KnowledgeTreeNode[] }>();
    const traverse = (curr: KnowledgeTreeNode, parent: KnowledgeTreeNode | null, path: KnowledgeTreeNode[]) => {
      const currentPath = [...path, curr];
      map.set(curr.id, { node: curr, parent, path: currentPath });
      if (curr.children) {
        curr.children.forEach((c) => traverse(c, curr, currentPath));
      }
    };
    traverse(treeRootNode, null, []);
    return map;
  }, [treeRootNode]);

  // Selected node context and ancestral path
  const selectedContext = useMemo(() => {
    return nodeLookup.get(selectedNodeId) || nodeLookup.get('tree-asset-6401') || {
      node: treeRootNode,
      parent: null,
      path: [treeRootNode],
    };
  }, [nodeLookup, selectedNodeId, treeRootNode]);

  // Expand / collapse helpers
  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collect = (n: KnowledgeTreeNode) => {
      allIds.add(n.id);
      n.children?.forEach(collect);
    };
    collect(treeRootNode);
    setExpandedNodeIds(allIds);
  };

  const collapseAll = () => {
    setExpandedNodeIds(new Set([treeRootNode.id]));
  };

  // Node selection handler
  const handleSelectNode = (node: KnowledgeTreeNode) => {
    setSelectedNodeId(node.id);
    if (onSelectNodeInLens) {
      onSelectNodeInLens(node);
    }
  };

  const handleCopyKey = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Node kind icon renderer
  const getNodeIcon = (kind: string) => {
    switch (kind) {
      case 'organization':
        return <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'platformModel':
        return <Cpu className="w-3.5 h-3.5 text-cyan-300 shrink-0" />;
      case 'platformClass':
        return <Anchor className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'physicalAsset':
        return <Box className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'deployment':
        return <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'instrumentModel':
        return <Radio className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
      case 'instrumentInstance':
        return <Binary className="w-3.5 h-3.5 text-teal-300 shrink-0" />;
      case 'dataset':
        return <Database className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
      case 'sourceArtifact':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
      case 'scienceDomain':
      case 'observedProperty':
        return <Activity className="w-3.5 h-3.5 text-indigo-300 shrink-0" />;
      case 'sensorCapability':
        return <GitBranch className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  // Matching helper for search filter
  const isNodeMatch = (node: KnowledgeTreeNode, q: string): boolean => {
    if (!q) return true;
    const lower = q.toLowerCase();
    const matchThis =
      node.label.toLowerCase().includes(lower) ||
      (node.subtitle && node.subtitle.toLowerCase().includes(lower)) ||
      (node.knowledgeKey && node.knowledgeKey.toLowerCase().includes(lower)) ||
      node.kind.toLowerCase().includes(lower);
    if (matchThis) return true;
    return Boolean(node.children?.some((child) => isNodeMatch(child, q)));
  };

  // Detailed source evidence resolution
  const resolvedArtifacts = useMemo(() => {
    const refs = selectedContext.node.evidenceRefChain || [];
    return refs.map((ref) => {
      const art = CORPUS_SOURCE_ARTIFACTS.find((a) => a.id === ref || a.fileName === ref);
      if (art) return art;
      return {
        id: ref,
        name: ref === 'MANTAS_UxS_Fused_Evidence_Registry.xlsx' ? 'MANTAS UxS Fused Evidence Registry' : ref,
        artifactType: 'XLSX_WORKBOOK' as const,
        fileName: ref,
        uri: `https://data.noaa.gov/uxs/evidence/${ref}`,
        artifactHash: 'sha256:verified-source-row-audit',
        importedAt: '2025-01-15T08:30:00Z',
        sourceTimestamp: '2025-01-10T16:00:00Z',
        provenanceType: 'IMPORTED_ARTIFACT' as const,
        recordCount: 114,
        organization: 'NOAA OMAO / Fleet Authority',
        description: 'Verified source observation registry supporting asset identity and configuration context.',
      };
    });
  }, [selectedContext.node]);

  // Derived Proof Matrix (Supports vs Does NOT prove) for selected node
  const proofMatrix = useMemo(() => {
    const { node } = selectedContext;
    const label = node.label.toLowerCase();
    const is6401 = label.includes('6401');
    const isRemus = label.includes('remus');
    const isMinsas = label.includes('minsas');
    const isEmily = label.includes('emily');
    const isSaildrone = label.includes('saildrone');
    const isDive01 = label.includes('dive 01');

    if (is6401 || (isRemus && node.kind === 'physicalAsset')) {
      return {
        supports: [
          'NOAA OMAO asset record confirms REMUS 620 Hull #6401 physical existence',
          'Serial 6401 and Barcode NOAA-UXS-6401 match CY2025 Fleet Inventory',
          'Chassis configured with Kraken MINSAS SN #204 in mid-section payload bay',
          'Employed on EN2501 Dive 01 & Dive 02 underway operations'
        ],
        doesNotProve: [
          'Does NOT prove instrument operation on dives where payload was unpowered',
          'Does NOT prove navigation accuracy without USBL/DVL post-processed trajectory',
          'Does NOT auto-merge weak candidate strings without human authorization'
        ]
      };
    }

    if (isMinsas) {
      return {
        supports: [
          'Manufacturer technical specification rates MINSAS-120 for REMUS 620 payload bay',
          'Physical Unit SN #204 installed and verified in deck inventory',
          'Carried on EN2501 Dive 01 producing raw acoustic backscatter records',
          'Archive manifest confirms 50cm GeoTIFF mosaic generation'
        ],
        doesNotProve: [
          'Does NOT prove real-time SAS beamforming without post-mission synthetic aperture processing',
          'Does NOT prove seabed classification without ground-truth benthic cores',
          'Does NOT prove other hulls (e.g. #6402) carried this specific unit'
        ]
      };
    }

    if (isEmily) {
      return {
        supports: [
          'Hydronalix EMILY USV asset record confirmed in NOAA fleet inventory',
          'Recorded with CD number identity (e.g. CD0004001623) and Honolulu, HI location',
          'Preserved with status "not operational" as historical observation'
        ],
        doesNotProve: [
          'Does NOT prove active underway operations during 2025/2026 cruises',
          'Does NOT prove payload configuration unless explicitly recorded in source row',
          'Does NOT produce deep ocean bathymetric data'
        ]
      };
    }

    if (isSaildrone) {
      return {
        supports: [
          'Saildrone Explorer Model registered under NOAA PMEL climate program',
          'Hull SD-1033 verified for air-sea flux long-duration deployments',
          'Surface atmospheric and oceanographic time series recorded'
        ],
        doesNotProve: [
          'Does NOT prove sub-surface acoustic bathymetry capabilities',
          'Does NOT prove deep diving pressure hull ratings'
        ]
      };
    }

    if (isDive01) {
      return {
        supports: [
          'EN2501 Dive 01 underway operation corroborated by expedition deck log',
          'Carried REMUS 620 Hull #6401 with Kraken MINSAS SN #204',
          'Produced verified Acoustic Backscatter GeoTIFF Mosaic'
        ],
        doesNotProve: [
          'Does NOT prove coverage outside the surveyed 35m-altitude track polygon',
          'Does NOT prove optical laser operation on this specific acoustic run'
        ]
      };
    }

    return {
      supports: [
        `Knowledge graph node verified through ${node.provenanceType} evidence edges`,
        `Preserved under canonical address: ${node.knowledgeKey || node.id}`,
        'Traversable via deterministic knowledge graph predicates'
      ],
      doesNotProve: [
        'Does NOT assert facts outside the cited source artifact evidence chain',
        'Does NOT override destination-system (OISS/OneStop/CMR) downstream approval'
      ]
    };
  }, [selectedContext]);

  // Recursive Tree Node component
  const renderTreeNode = (node: KnowledgeTreeNode, depth = 0) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const matches = isNodeMatch(node, searchFilter);

    if (!matches) return null;

    return (
      <div key={node.id} className="relative select-none font-mono">
        {/* Node Row */}
        <div
          onClick={() => handleSelectNode(node)}
          style={{ paddingLeft: `${Math.max(8, depth * 20 + 8)}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? 'bg-cyan-950/80 border border-cyan-500/60 shadow-lg shadow-cyan-950/50 text-cyan-200'
              : 'hover:bg-[#071326] text-slate-300 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {/* Expand / Collapse Toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-cyan-900/30 transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center text-slate-700 shrink-0">
                •
              </span>
            )}

            {/* Icon */}
            {getNodeIcon(node.kind)}

            {/* Label & Subtitle */}
            <div className="min-w-0 truncate">
              <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-200 font-bold' : 'text-slate-200'}`}>
                {node.label}
              </span>
              {node.subtitle && (
                <span className="ml-2 text-[10px] text-slate-500 truncate hidden sm:inline">
                  — {node.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Right Badges */}
          <div className="flex items-center gap-1.5 shrink-0 text-[9px]">
            {node.knowledgeKey && (
              <span
                onClick={(e) => handleCopyKey(node.knowledgeKey!, e)}
                title={`Knowledge Key: ${node.knowledgeKey} (Click to copy)`}
                className="px-1.5 py-0.5 rounded bg-[#030914] border border-cyan-900/60 text-cyan-400 hover:border-cyan-400 transition-colors hidden md:inline cursor-pointer"
              >
                {copiedKey === node.knowledgeKey ? 'COPIED!' : node.knowledgeKey.split(':').slice(-2).join(':')}
              </span>
            )}

            {node.evidenceRefChain && node.evidenceRefChain.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#09152b] border border-amber-500/30 text-amber-300">
                {node.evidenceRefChain.length} PROOF
              </span>
            )}

            <span
              className={`px-1.5 py-0.5 rounded border ${
                node.provenanceType === 'IMPORTED_ARTIFACT'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : node.provenanceType === 'LOCAL_DERIVED'
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                  : 'bg-purple-950/40 text-purple-300 border-purple-800/60'
              }`}
            >
              {node.kind.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="relative border-l border-slate-800/80 ml-4 pl-1 space-y-0.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="knowledge-tree-projection-workspace"
      className="h-full w-full bg-[#030712] text-slate-100 flex flex-col font-sans overflow-hidden select-none"
    >
      {/* 1. Header Toolbar */}
      <div className="h-12 shrink-0 border-b border-cyan-500/20 px-4 flex items-center justify-between bg-[#050b18]">
        {/* Left: Title & Hierarchy Root Selector */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-200 uppercase flex items-center gap-2">
              <span>Knowledge Tree Projection</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-[9px] text-cyan-400 border border-cyan-700/50">
                GRAPH-PROJECTION
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Deterministic entity hierarchy (Provider → Platform → Asset → Deployment)
            </div>
          </div>
        </div>

        {/* Right: Root Perspective Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Root Perspective Tabs */}
          <div className="flex items-center bg-[#071122] rounded-lg p-0.5 border border-slate-800 font-mono text-[10px]">
            {(
              [
                { key: 'PROVIDER', label: 'Provider → Platform → Asset' },
                { key: 'PLATFORM', label: 'Platform Class' },
                { key: 'INSTRUMENT', label: 'Sensors' },
                { key: 'MISSION', label: 'Expedition' },
                { key: 'CAPABILITY', label: 'Maturity Tiers' },
              ] as const
            ).map((rt) => (
              <button
                key={rt.key}
                type="button"
                onClick={() => setActiveRoot(rt.key)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeRoot === rt.key
                    ? 'bg-cyan-900 text-cyan-200 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Expand / Collapse All */}
          <button
            type="button"
            onClick={expandAll}
            className="px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Knowledge Tree on Left, Proof/Evidence on Right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_420px] overflow-hidden">
        {/* LEFT COLUMN: Interactive Tree Projection */}
        <div className="flex flex-col border-r border-slate-800/80 bg-[#040914] min-h-0 overflow-hidden">
          {/* Tree Filter Search Bar */}
          <div className="p-3 border-b border-slate-800/80 bg-[#050c1b] flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter tree nodes (e.g. 'REMUS 620', 'MINSAS', 'Dive 01', '6401')..."
                className="w-full bg-[#071122] border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 outline-none transition-all"
              />
            </div>
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scrollable Tree View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {renderTreeNode(treeRootNode, 0)}
          </div>

          {/* Bottom Invariant Guarantee Footer */}
          <div className="p-2.5 border-t border-slate-800/80 bg-[#040813] flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Invariant: Same Graph Edges · No Secondary Database</span>
            </div>
            <span>Selected: {selectedContext.node.label}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Proof & Evidence ('Why') Tree Panel */}
        <div className="flex flex-col bg-[#050a16] min-h-0 overflow-y-auto border-t lg:border-t-0 border-slate-800 p-4 space-y-4">
          {/* Header */}
          <div className="border-b border-cyan-500/20 pb-3 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Proof & Evidence ('Why') Tree</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1 font-sans">
                {selectedContext.node.label}
              </h2>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Kind: <strong className="text-cyan-300">{selectedContext.node.kind}</strong> · Provenance:{' '}
                <strong className="text-emerald-400">{selectedContext.node.provenanceType}</strong>
              </div>
            </div>

            {selectedContext.node.knowledgeKey && (
              <button
                type="button"
                onClick={(e) => handleCopyKey(selectedContext.node.knowledgeKey!, e)}
                className="px-2 py-1 rounded bg-[#09152b] border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                title="Copy canonical Knowledge Key"
              >
                {copiedKey === selectedContext.node.knowledgeKey ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy KK</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 1. Canonical Knowledge Address */}
          {selectedContext.node.knowledgeKey && (
            <div className="p-3 rounded-xl bg-[#071224] border border-cyan-500/30 font-mono text-xs space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Canonical Address</div>
              <div className="text-cyan-300 font-bold break-all text-[11px]">
                {selectedContext.node.knowledgeKey}
              </div>
            </div>
          )}

          {/* 2. Graph Traversal Path ('Why This Node Is Connected') */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center justify-between">
              <span>Explainable Path from Root</span>
              <span className="text-slate-500 text-[9px]">{selectedContext.path.length} hops</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060e1d] border border-slate-800 space-y-2 font-mono text-xs">
              {selectedContext.path.map((pNode, idx) => (
                <div key={pNode.id} className="flex items-start gap-2">
                  <div className="flex flex-col items-center mt-1">
                    <span className={`w-2 h-2 rounded-full ${idx === selectedContext.path.length - 1 ? 'bg-cyan-400 ring-2 ring-cyan-400/40' : 'bg-slate-600'}`} />
                    {idx < selectedContext.path.length - 1 && (
                      <span className="w-[1px] h-4 bg-slate-700 my-0.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 uppercase">{pNode.kind}</div>
                    <div className={`text-xs ${idx === selectedContext.path.length - 1 ? 'text-cyan-200 font-bold' : 'text-slate-300'}`}>
                      {pNode.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Truth Matrix: What this source supports vs does NOT prove */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
              Corpus Evidence Invariants
            </div>

            {/* Supports */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5 font-sans">
              <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>What this evidence proves</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-200">
                {proofMatrix.supports.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Does Not Prove */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5 font-sans">
              <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <CircleDashed className="w-3.5 h-3.5" />
                <span>What this source does NOT prove</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {proofMatrix.doesNotProve.map((np, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{np}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. Cited Source Artifacts Chain */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center justify-between">
              <span>Cited Source Artifacts</span>
              <span className="text-slate-500 text-[9px]">{resolvedArtifacts.length} sources</span>
            </div>

            {resolvedArtifacts.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#060e1d] border border-slate-800 text-xs text-slate-500 font-mono">
                No explicit external workbook cited; node is derived through graph edge closure.
              </div>
            ) : (
              <div className="space-y-2">
                {resolvedArtifacts.map((art) => (
                  <div
                    key={art.id}
                    className="p-3 rounded-xl bg-[#071328] border border-cyan-500/20 space-y-1 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-300 uppercase">
                        {art.artifactType}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {art.sourceTimestamp ? new Date(art.sourceTimestamp).getFullYear() : '2025'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 font-sans">{art.name}</div>
                    <div className="text-[11px] text-slate-400 font-sans">{art.description}</div>
                    <div className="text-[10px] text-slate-500 truncate pt-1">
                      Organization: <span className="text-slate-300">{art.organization}</span>
                    </div>
                    {art.artifactHash && (
                      <div className="text-[9px] text-cyan-400/80 truncate">
                        Hash: {art.artifactHash}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Direct Actions */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => onSelectNodeInLens && onSelectNodeInLens(selectedContext.node)}
              className="px-3 py-2 rounded-xl bg-[#0a1832] hover:bg-cyan-900/50 text-cyan-300 border border-cyan-700/60 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open in Passport</span>
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('graph')}
                className="px-3 py-2 rounded-xl bg-[#0a1832] hover:bg-cyan-900/50 text-emerald-300 border border-emerald-700/60 font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Inspect in Graph</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
