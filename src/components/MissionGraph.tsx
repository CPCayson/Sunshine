import React, { useState, useMemo, useRef } from 'react';
import {
  GitFork,
  Database,
  Compass,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  RotateCcw,
  Activity,
  GitBranch,
  ShieldCheck,
  Scale,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  UxSMission,
  KnowledgeNode,
  KnowledgeEdge,
  GraphViewAxis,
  FacetState,
  ActiveWorkspaceTab
} from '../types';
import {
  buildStableKnowledgeGraph,
  computeAxisLayout,
  BuiltGraph,
  classifyKnowledgeEdge
} from '../services/knowledgeGraphBuilder';
import { NodeInspector } from './graph/NodeInspector';
import { EdgeInspector } from './graph/EdgeInspector';
import { PathExplainerModal } from './graph/PathExplainerModal';
import { BlastRadiusModal } from './graph/BlastRadiusModal';
import { SimilarityPanel } from './graph/SimilarityPanel';
import { SpaceTimeSyncView } from './graph/SpaceTimeSyncView';

interface MissionGraphProps {
  mission: UxSMission;
  onSelectNodeInLens?: (node: KnowledgeNode) => void;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
}

export const MissionGraph: React.FC<MissionGraphProps> = ({
  mission,
  onSelectNodeInLens,
  onNavigateTab,
}) => {
  // Primary & Secondary Axes
  const [axis, setAxis] = useState<GraphViewAxis>('MISSION');
  const [secondaryAxis, setSecondaryAxis] = useState<GraphViewAxis | 'NONE'>('NONE');

  // Filters & Focus
  const [filterState, setFilterState] = useState<'ALL' | 'ACCEPTED_OBSERVED' | 'CONFLICTS_ONLY' | 'VERIFIED_ONLY'>('ALL');
  const [focusNeighborhood, setFocusNeighborhood] = useState<
    | 'GLOBAL'
    | 'SELECTED_1_HOP'
    | 'SELECTED_2_HOP'
    | 'TRANSVERSAL_CHAIN'
    | 'HIERARCHY_ONLY'
    | 'DOCUCOMP_CROSSWALK'
    | 'DOMAIN_ONLY'
    | 'EVIDENCE_LINEAGE'
  >('GLOBAL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selections
  const [selectedNodeId, setSelectedNodeId] = useState<string>('plat-model-remus620');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Active Modals
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);
  const [isBlastRadiusOpen, setIsBlastRadiusOpen] = useState(false);
  const [blastRadiusNodeId, setBlastRadiusNodeId] = useState<string>('fact-canon-platform');

  // Highlighted Path (from Path Explainer)
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);

  // Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Build ONE stable Knowledge Graph (identity remains completely stable across rotations)
  const stableGraph = useMemo(() => {
    return buildStableKnowledgeGraph(mission);
  }, [mission]);

  // 2. Compute 2D Optical Layout for the current View Axis
  const layoutPositions = useMemo(() => {
    return computeAxisLayout(stableGraph, axis, selectedNodeId, filterState);
  }, [stableGraph, axis, selectedNodeId, filterState]);

  // Find selected objects
  const selectedNode = useMemo(() => {
    return stableGraph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [stableGraph, selectedNodeId]);

  const selectedEdge = useMemo(() => {
    return stableGraph.edges.find((e) => e.id === selectedEdgeId) || null;
  }, [stableGraph, selectedEdgeId]);

  // Determine neighborhood visibility
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();

    stableGraph.nodes.forEach((node) => {
      const pos = layoutPositions.get(node.id);
      if (!pos || !pos.visible) return;

      // Text search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          node.label.toLowerCase().includes(query) ||
          node.kind.toLowerCase().includes(query) ||
          (node.subtitle && node.subtitle.toLowerCase().includes(query));
        if (!match) return;
      }

      // Neighborhood constraints & graph traversal logic
      if (focusNeighborhood === 'GLOBAL') {
        ids.add(node.id);
      } else if (focusNeighborhood === 'SELECTED_1_HOP') {
        if (node.id === selectedNodeId) {
          ids.add(node.id);
        } else {
          const isNeighbor = stableGraph.edges.some(
            (e) => (e.from === selectedNodeId && e.to === node.id) || (e.to === selectedNodeId && e.from === node.id)
          );
          if (isNeighbor) ids.add(node.id);
        }
      } else if (focusNeighborhood === 'SELECTED_2_HOP') {
        // Multi-tier 2-hop neighborhood traversal
        const hop1 = new Set<string>([selectedNodeId]);
        stableGraph.edges.forEach((e) => {
          if (e.from === selectedNodeId) hop1.add(e.to);
          if (e.to === selectedNodeId) hop1.add(e.from);
        });
        const hop2 = new Set<string>(hop1);
        stableGraph.edges.forEach((e) => {
          if (hop1.has(e.from)) hop2.add(e.to);
          if (hop1.has(e.to)) hop2.add(e.from);
        });
        if (hop2.has(node.id)) ids.add(node.id);
      } else if (focusNeighborhood === 'TRANSVERSAL_CHAIN') {
        // Traversal along formal transversal edges (MAPS_TO, REFERENCES_COMPONENT, RESOLVES, etc.)
        const transversalVisited = new Set<string>([selectedNodeId]);
        let frontier = [selectedNodeId];
        for (let step = 0; step < 3; step++) {
          const nextFrontier: string[] = [];
          frontier.forEach((currId) => {
            stableGraph.edges.forEach((e) => {
              const classification = classifyKnowledgeEdge(e);
              if (classification.isFormalTransversal) {
                if (e.from === currId && !transversalVisited.has(e.to)) {
                  transversalVisited.add(e.to);
                  nextFrontier.push(e.to);
                }
                if (e.to === currId && !transversalVisited.has(e.from)) {
                  transversalVisited.add(e.from);
                  nextFrontier.push(e.from);
                }
              }
            });
          });
          frontier = nextFrontier;
        }
        if (transversalVisited.has(node.id)) ids.add(node.id);
      } else if (focusNeighborhood === 'HIERARCHY_ONLY') {
        // Traversal along standard hierarchy containment edges (INCLUDES_LEG, EXECUTED_DEPLOYMENT, etc.)
        const hierarchyVisited = new Set<string>([selectedNodeId]);
        let frontier = [selectedNodeId];
        for (let step = 0; step < 4; step++) {
          const nextFrontier: string[] = [];
          frontier.forEach((currId) => {
            stableGraph.edges.forEach((e) => {
              const classification = classifyKnowledgeEdge(e);
              if (classification.isStandardHierarchy) {
                if (e.from === currId && !hierarchyVisited.has(e.to)) {
                  hierarchyVisited.add(e.to);
                  nextFrontier.push(e.to);
                }
                if (e.to === currId && !hierarchyVisited.has(e.from)) {
                  hierarchyVisited.add(e.from);
                  nextFrontier.push(e.from);
                }
              }
            });
          });
          frontier = nextFrontier;
        }
        const spineKinds = ['mission', 'leg', 'deployment', 'asset'];
        if (hierarchyVisited.has(node.id) || spineKinds.includes(node.kind)) {
          ids.add(node.id);
        }
      } else if (focusNeighborhood === 'DOCUCOMP_CROSSWALK') {
        // Explicitly isolate the 3-tier DocuComp crosswalk:
        // Canonical Mission/Fact -> MAPS_TO -> ISO Slot -> REFERENCES_COMPONENT -> DocuComp Component -> RESOLVES -> Resolver Obs
        const crosswalkKinds = [
          'mission',
          'canonicalFact',
          'isoSemanticSlot',
          'docucompComponent',
          'resolverObservation',
          'authority',
          'driftFinding',
          'isoProjection',
        ];
        if (crosswalkKinds.includes(node.kind)) ids.add(node.id);
      } else if (focusNeighborhood === 'DOMAIN_ONLY') {
        if (
          node.kind === 'scienceDomain' ||
          node.kind === 'observedProperty' ||
          node.kind === 'sensorCapability' ||
          node.kind === 'instrumentModel'
        ) {
          ids.add(node.id);
        }
      } else if (focusNeighborhood === 'EVIDENCE_LINEAGE') {
        if (
          node.kind === 'sourceArtifact' ||
          node.kind === 'claim' ||
          node.kind === 'decision' ||
          node.kind === 'canonicalFact'
        ) {
          ids.add(node.id);
        }
      } else {
        ids.add(node.id);
      }
    });

    return ids;
  }, [stableGraph, layoutPositions, searchQuery, focusNeighborhood, selectedNodeId]);

  // Handle node selection
  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    const node = stableGraph.nodes.find((n) => n.id === id);
    if (node && onSelectNodeInLens) {
      onSelectNodeInLens(node);
    }
  };

  // Handle edge selection
  const handleSelectEdge = (id: string) => {
    setSelectedEdgeId(id);
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-background') {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setSearchQuery('');
  };

  const axisOptions: Array<{ id: GraphViewAxis; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'MISSION', label: 'Mission Spine', icon: <GitFork className="w-3.5 h-3.5" />, desc: 'Expedition, Legs, Dives & Assets' },
    { id: 'DOMAIN', label: 'Science Domain', icon: <Compass className="w-3.5 h-3.5" />, desc: 'Seafloor Science & Properties' },
    { id: 'CAPABILITY', label: 'Capabilities', icon: <Layers className="w-3.5 h-3.5" />, desc: 'Sensors & Engineering Envelopes' },
    { id: 'EVIDENCE', label: 'Evidence Lineage', icon: <Database className="w-3.5 h-3.5" />, desc: 'Source -> Claim -> Decision -> Fact' },
    { id: 'VERIFICATION', label: 'Verification Facets', icon: <ShieldCheck className="w-3.5 h-3.5" />, desc: 'Expected ↔ Observed & Receipts' },
    { id: 'PROJECTION', label: 'Projections', icon: <Sparkles className="w-3.5 h-3.5" />, desc: 'ISO 19115, DocuComp, STAC & DCAT' },
    { id: 'AUTHORITY', label: 'Authorities', icon: <ShieldCheck className="w-3.5 h-3.5" />, desc: 'NCEI, CoMET & OISS Governance' },
    { id: 'SIMILARITY', label: 'Similarity Constellation', icon: <Scale className="w-3.5 h-3.5" />, desc: 'Multi-Vector Neighbor Breakdown' },
    { id: 'SPACE_TIME', label: 'Space & Time', icon: <Calendar className="w-3.5 h-3.5" />, desc: 'Spatiotemporal Trajectory Sync' },
  ];

  const getFacetIndicator = (state?: FacetState) => {
    switch (state) {
      case 'VERIFIED':
      case 'PASS':
      case 'READY':
        return 'bg-emerald-400';
      case 'SUPPORTED':
        return 'bg-cyan-400';
      case 'PARTIAL':
        return 'bg-amber-400';
      case 'CONFLICT':
      case 'UNRESOLVED':
        return 'bg-rose-500 animate-pulse';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div id="mission-graph-workspace" className="flex-1 flex flex-col bg-[#050a14] text-slate-100 overflow-hidden font-sans select-none">
      {/* ---------------------------------------------------- */}
      {/* 1. GRAPH AXIS CONTROLLER & TOOLBAR                   */}
      {/* ---------------------------------------------------- */}
      <div className="bg-[#081224] border-b border-cyan-500/20 px-5 py-3 flex flex-col gap-2.5">
        {/* Top Row: Title & Primary Axis Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 tracking-wide font-mono">
                  MULTIDIMENSIONAL KNOWLEDGE GRAPH
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                  Stable Canonical Graph • Rotatable Axes
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Current View Basis: <strong className="text-cyan-300 uppercase">{axis}</strong> — Rotating the projection of the same canonical knowledge.
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2">
            <button
              id="graph-path-explainer-btn"
              onClick={() => setIsPathFinderOpen(true)}
              className="px-3 py-1.5 bg-[#0b172e] hover:bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Find Relationship</span>
            </button>

            <button
              id="graph-blast-radius-btn"
              onClick={() => {
                setBlastRadiusNodeId(selectedNodeId || 'fact-canon-platform');
                setIsBlastRadiusOpen(true);
              }}
              className="px-3 py-1.5 bg-[#0b172e] hover:bg-purple-950/70 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/40"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Blast Radius</span>
            </button>
          </div>
        </div>

        {/* Primary Axis Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {axisOptions.map((opt) => {
            const isActive = axis === opt.id;
            return (
              <button
                key={opt.id}
                id={`axis-btn-${opt.id.toLowerCase()}`}
                onClick={() => setAxis(opt.id)}
                title={opt.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-950/80 border border-cyan-400'
                    : 'bg-[#050a16] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub Toolbar: Filter, Search, Focus, Secondary Axis, Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search filter input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Spotlight nodes..."
                className="pl-8 pr-3 py-1 bg-[#050914] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-44 placeholder:text-slate-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter mode */}
            <div className="flex items-center gap-1 bg-[#050914] border border-slate-800 px-2 py-1 rounded-lg">
              <Filter className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">Filter:</span>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#081224]">All Nodes</option>
                <option value="ACCEPTED_OBSERVED" className="bg-[#081224]">Accepted + Observed</option>
                <option value="CONFLICTS_ONLY" className="bg-[#081224]">Conflicts / Drift Only</option>
                <option value="VERIFIED_ONLY" className="bg-[#081224]">Verified Pass Only</option>
              </select>
            </div>

            {/* Neighborhood focus */}
            <div className="flex items-center gap-1 bg-[#050914] border border-slate-800 px-2 py-1 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Focus:</span>
              <select
                value={focusNeighborhood}
                onChange={(e) => setFocusNeighborhood(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="GLOBAL" className="bg-[#081224]">Global (Full Graph)</option>
                <option value="SELECTED_1_HOP" className="bg-[#081224]">Selected 1-Hop Neighbors</option>
                <option value="SELECTED_2_HOP" className="bg-[#081224]">Selected 2-Hop Neighborhood</option>
                <option value="TRANSVERSAL_CHAIN" className="bg-[#081224]">Transversal Chain (MAPS_TO / REFS / RESOLVES)</option>
                <option value="HIERARCHY_ONLY" className="bg-[#081224]">Standard Hierarchy Only (Spine & Dives)</option>
                <option value="DOCUCOMP_CROSSWALK" className="bg-[#081224]">DocuComp Authority Crosswalk</option>
                <option value="DOMAIN_ONLY" className="bg-[#081224]">Domain Layer Only</option>
                <option value="EVIDENCE_LINEAGE" className="bg-[#081224]">Evidence Lineage Only</option>
              </select>
            </div>
          </div>

          {/* Canvas View Controls */}
          <div className="flex items-center gap-1 bg-[#050914] border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.2))}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.5))}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE CANVAS & INSPECTORS               */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* SVG Interactive Canvas */}
        <div className="flex-1 bg-[#030712] relative overflow-hidden flex flex-col">
          {/* Highlight Path Banner */}
          {highlightedNodeIds.length > 0 && (
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/90 border border-cyan-500/50 text-xs font-mono text-cyan-200 shadow-xl backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Highlighting Semantic Path ({highlightedNodeIds.length} Nodes)</span>
              <button
                onClick={() => {
                  setHighlightedNodeIds([]);
                  setHighlightedEdgeIds([]);
                }}
                className="ml-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <svg
            className="w-full h-full cursor-grab active:cursor-grabbing"
            viewBox="0 0 960 620"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <rect id="canvas-background" width="100%" height="100%" fill="#030712" />

            <defs>
              {/* Glow Filter */}
              <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="pulseGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Directional Markers for Formal Transversal and Standard Hierarchy Edges */}
              <marker id="marker-transversal-maps" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
              </marker>
              <marker id="marker-transversal-refs" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#c084fc" />
              </marker>
              <marker id="marker-transversal-resolves" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker id="marker-hierarchy" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
              </marker>
              <marker id="marker-conflict" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
              </marker>
              <marker id="marker-generic" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
              </marker>
            </defs>

            {/* Transform Group for Pan & Zoom */}
            <g
              transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
              style={{ transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
            >
              {/* ---------------------------------------------------- */}
              {/* EDGES LAYER                                          */}
              {/* ---------------------------------------------------- */}
              <g id="graph-edges-layer">
                {stableGraph.edges.map((edge) => {
                  const fromPos = layoutPositions.get(edge.from);
                  const toPos = layoutPositions.get(edge.to);

                  if (!fromPos || !toPos || !fromPos.visible || !toPos.visible) return null;
                  if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) return null;

                  const isSelected = selectedEdgeId === edge.id;
                  const isHighlighted = highlightedEdgeIds.includes(edge.id);
                  const isDimmed =
                    (highlightedEdgeIds.length > 0 && !isHighlighted) ||
                    (selectedNodeId && edge.from !== selectedNodeId && edge.to !== selectedNodeId && !isSelected);

                  // Calculate curve midpoint
                  const dx = toPos.x - fromPos.x;
                  const dy = toPos.y - fromPos.y;
                  const midX = (fromPos.x + toPos.x) / 2;
                  const midY = (fromPos.y + toPos.y) / 2;

                  // Semantic Classification
                  const classification = classifyKnowledgeEdge(edge);

                  // Stroke styling by status / predicate / category
                  let strokeColor = '#64748b';
                  let strokeWidth = isSelected ? 3.2 : isHighlighted ? 3.2 : 1.8;
                  let strokeDash = '';
                  let markerEnd = 'url(#marker-generic)';
                  let badgeBg = '#050c18';
                  let badgeBorder = strokeColor;
                  let badgeTextColor = '#94a3b8';
                  let badgeLabel = classification.badgeLabel;

                  if (edge.status === 'CONFLICT' || edge.predicate === 'COMPARED_WITH') {
                    strokeColor = '#f43f5e';
                    strokeDash = '5 3';
                    markerEnd = 'url(#marker-conflict)';
                    badgeBg = '#270710';
                    badgeBorder = '#f43f5e';
                    badgeTextColor = '#fda4af';
                  } else if (edge.predicate === 'MAPS_TO') {
                    // Formal Transversal Mapping: Cross-walk canonical concepts into ISO slots
                    strokeColor = '#f59e0b'; // Amber
                    strokeDash = '6 3';
                    strokeWidth = isSelected ? 3.5 : isHighlighted ? 3.5 : 2.2;
                    markerEnd = 'url(#marker-transversal-maps)';
                    badgeBg = '#271704';
                    badgeBorder = '#f59e0b';
                    badgeTextColor = '#fcd34d';
                  } else if (edge.predicate === 'REFERENCES_COMPONENT') {
                    // Formal Transversal Component Delegation: Binds ISO slot to DocuComp component
                    strokeColor = '#c084fc'; // Purple/Violet
                    strokeDash = '5 2 2 2';
                    strokeWidth = isSelected ? 3.5 : isHighlighted ? 3.5 : 2.2;
                    markerEnd = 'url(#marker-transversal-refs)';
                    badgeBg = '#1e0a30';
                    badgeBorder = '#c084fc';
                    badgeTextColor = '#e9d5ff';
                  } else if (edge.predicate === 'RESOLVES') {
                    // Formal Transversal Resolution: Links audited resolver HTTP 200 receipt
                    strokeColor = '#10b981'; // Mint Emerald
                    strokeDash = '8 3';
                    strokeWidth = isSelected ? 3.5 : isHighlighted ? 3.5 : 2.2;
                    markerEnd = 'url(#marker-transversal-resolves)';
                    badgeBg = '#022319';
                    badgeBorder = '#10b981';
                    badgeTextColor = '#6ee7b7';
                  } else if (classification.isStandardHierarchy) {
                    // Standard Hierarchy Edge: Structural parent-child containment (Solid, unbroken line)
                    strokeColor = '#06b6d4'; // Cyan
                    strokeDash = '';
                    strokeWidth = isSelected ? 3.2 : isHighlighted ? 3.2 : 2.0;
                    markerEnd = 'url(#marker-hierarchy)';
                    badgeBg = '#051820';
                    badgeBorder = '#0891b2';
                    badgeTextColor = '#67e8f9';
                  } else if (classification.isFormalTransversal) {
                    // Other Formal Transversal Edges
                    strokeColor = '#38bdf8';
                    strokeDash = '4 3';
                    markerEnd = 'url(#marker-generic)';
                    badgeBg = '#041c2c';
                    badgeBorder = '#0284c7';
                    badgeTextColor = '#7dd3fc';
                  } else if (edge.predicate.includes('PROJECTS') || edge.predicate.includes('STAC')) {
                    strokeColor = '#3b82f6';
                    strokeDash = '6 2';
                    badgeBg = '#081a36';
                    badgeBorder = '#2563eb';
                    badgeTextColor = '#93c5fd';
                  } else if (edge.status === 'ACCEPTED') {
                    strokeColor = '#06b6d4';
                  }

                  if (isHighlighted) {
                    strokeColor = '#38bdf8';
                    strokeWidth = 3.5;
                    badgeBorder = '#38bdf8';
                    badgeTextColor = '#ffffff';
                  }

                  return (
                    <g key={edge.id} className="cursor-pointer group" onClick={() => handleSelectEdge(edge.id)}>
                      {/* Invisible wider hit line for easy clicking */}
                      <line
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="transparent"
                        strokeWidth="16"
                      />

                      {/* Visible Edge Line */}
                      <line
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                        markerEnd={markerEnd}
                        opacity={isDimmed ? 0.25 : isSelected ? 1 : 0.85}
                        style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                      />

                      {/* Predicate badge at midpoint */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-46"
                          y="-9"
                          width="92"
                          height="18"
                          rx="4"
                          fill={badgeBg}
                          stroke={isSelected ? '#38bdf8' : badgeBorder}
                          strokeWidth={isSelected ? 1.5 : 0.9}
                          opacity={isDimmed ? 0.3 : 0.95}
                          style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        />
                        <text
                          y="3.5"
                          fill={isSelected ? '#38bdf8' : badgeTextColor}
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          opacity={isDimmed ? 0.3 : 1}
                        >
                          {badgeLabel.length > 17 ? badgeLabel.slice(0, 16) + '…' : badgeLabel}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* ---------------------------------------------------- */}
              {/* NODES LAYER                                          */}
              {/* ---------------------------------------------------- */}
              <g id="graph-nodes-layer">
                {stableGraph.nodes.map((node) => {
                  const pos = layoutPositions.get(node.id);
                  if (!pos || !pos.visible) return null;
                  if (!visibleNodeIds.has(node.id)) return null;

                  const isSelected = selectedNodeId === node.id;
                  const isHighlighted = highlightedNodeIds.includes(node.id);
                  const isDimmed =
                    (highlightedNodeIds.length > 0 && !isHighlighted) ||
                    (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase()));

                  // Card styling by kind
                  let strokeColor = '#0e7490';
                  let fillColor = '#071120';
                  let headerColor = '#38bdf8';

                  if (node.kind === 'mission') {
                    strokeColor = '#06b6d4';
                    fillColor = '#08172c';
                    headerColor = '#67e8f9';
                  } else if (node.kind === 'platformModel' || node.kind === 'physicalAsset') {
                    strokeColor = node.state === 'CONFLICT' ? '#f43f5e' : '#f59e0b';
                    fillColor = '#101626';
                    headerColor = node.state === 'CONFLICT' ? '#fca5a5' : '#fde68a';
                  } else if (node.kind === 'instrumentModel' || node.kind === 'instrumentInstance') {
                    strokeColor = '#a855f7';
                    fillColor = '#120f26';
                    headerColor = '#d8b4fe';
                  } else if (node.kind === 'scienceDomain' || node.kind === 'observedProperty') {
                    strokeColor = '#10b981';
                    fillColor = '#0a1a1e';
                    headerColor = '#a7f3d0';
                  } else if (node.kind === 'sourceArtifact' || node.kind === 'claim') {
                    strokeColor = node.state === 'CONFLICT' ? '#f43f5e' : '#0ea5e9';
                    fillColor = '#091424';
                    headerColor = '#7dd3fc';
                  } else if (node.kind === 'projection' || node.kind === 'stacCollection' || node.kind === 'stacItem') {
                    strokeColor = '#3b82f6';
                    fillColor = '#0b162c';
                    headerColor = '#93c5fd';
                  } else if (node.kind === 'receipt' || node.kind === 'driftFinding') {
                    strokeColor = node.kind === 'driftFinding' ? '#f43f5e' : '#10b981';
                    fillColor = '#0c1626';
                    headerColor = node.kind === 'driftFinding' ? '#fca5a5' : '#86efac';
                  }

                  const cardWidth = 148;
                  const cardHeight = 64;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      transform={`translate(${pos.x - cardWidth / 2}, ${pos.y - cardHeight / 2})`}
                      onClick={() => handleSelectNode(node.id)}
                      style={{
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
                        opacity: isDimmed ? 0.25 : 1,
                      }}
                    >
                      {/* Selection Glow Box */}
                      {isSelected && (
                        <rect
                          x="-4"
                          y="-4"
                          width={cardWidth + 8}
                          height={cardHeight + 8}
                          rx="12"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2"
                          filter="url(#nodeGlow)"
                        />
                      )}

                      {/* Main Node Card */}
                      <rect
                        width={cardWidth}
                        height={cardHeight}
                        rx="9"
                        fill={fillColor}
                        stroke={isSelected ? '#38bdf8' : strokeColor}
                        strokeWidth={isSelected ? 2 : 1.2}
                      />

                      {/* Kind Header & Facet Indicators */}
                      <g transform="translate(8, 14)">
                        <text
                          fill={headerColor}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          letterSpacing="0.04em"
                        >
                          {node.kind.toUpperCase()}
                        </text>

                        {/* Facet Dots (Evidence, Semantics, Profile, Projection, Destination, QA) */}
                        {node.facets && (
                          <g transform="translate(94, -3)">
                            <circle cx="0" cy="0" r="2.5" className={getFacetIndicator(node.facets.evidence)} />
                            <circle cx="7" cy="0" r="2.5" className={getFacetIndicator(node.facets.semantics)} />
                            <circle cx="14" cy="0" r="2.5" className={getFacetIndicator(node.facets.profile)} />
                            <circle cx="21" cy="0" r="2.5" className={getFacetIndicator(node.facets.destination)} />
                          </g>
                        )}
                      </g>

                      {/* Node Label */}
                      <g transform="translate(8, 30)">
                        <text
                          fill="#f1f5f9"
                          fontSize="10"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                        >
                          {node.label.length > 20 ? node.label.slice(0, 19) + '…' : node.label}
                        </text>
                      </g>

                      {/* Subtitle / Spec */}
                      <g transform="translate(8, 44)">
                        <text
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="sans-serif"
                        >
                          {node.subtitle ? (node.subtitle.length > 24 ? node.subtitle.slice(0, 23) + '…' : node.subtitle) : node.id}
                        </text>
                      </g>

                      {/* State Tag at bottom right */}
                      {node.state && (
                        <g transform={`translate(${cardWidth - 8}, 56)`}>
                          <text
                            fill={node.state === 'CONFLICT' ? '#f87171' : node.state === 'ACCEPTED' ? '#34d399' : '#38bdf8'}
                            fontSize="7"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="end"
                          >
                            [{node.state}]
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Bottom Contextual Trays (SIMILARITY or SPACE_TIME) */}
          {axis === 'SIMILARITY' && (
            <div className="border-t border-cyan-500/20 max-h-64 overflow-y-auto">
              <SimilarityPanel mission={mission} />
            </div>
          )}

          {axis === 'SPACE_TIME' && (
            <div className="border-t border-cyan-500/20 max-h-80 overflow-y-auto">
              <SpaceTimeSyncView
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
              />
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* 3. RIGHT INSPECTOR DRAWER (NODE OR EDGE)            */}
        {/* ---------------------------------------------------- */}
        {selectedEdge ? (
          <EdgeInspector
            edge={selectedEdge}
            nodes={stableGraph.nodes}
            onClose={() => setSelectedEdgeId(null)}
            onSelectNode={handleSelectNode}
            onReconcileDrift={(e) => {
              handleSelectNode('fact-canon-platform');
            }}
          />
        ) : selectedNode ? (
          <NodeInspector
            node={selectedNode}
            edges={stableGraph.edges}
            nodes={stableGraph.nodes}
            onClose={() => setSelectedNodeId('')}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            onOpenBlastRadius={(id) => {
              setBlastRadiusNodeId(id);
              setIsBlastRadiusOpen(true);
            }}
            onOpenPathFinder={(id) => {
              setIsPathFinderOpen(true);
            }}
          />
        ) : (
          <div className="w-80 bg-[#070e1d] border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs">
            <Layers className="w-8 h-8 text-slate-600 mb-2" />
            <span className="font-bold text-slate-400">No Graph Element Selected</span>
            <p className="text-[11px] text-slate-500 mt-1 font-sans">
              Click any node or edge in the canvas to inspect its semantic properties.
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. MODALS & POPUPS                                   */}
      {/* ---------------------------------------------------- */}
      {isPathFinderOpen && (
        <PathExplainerModal
          graph={stableGraph}
          initialStartNodeId={selectedNodeId || 'inst-model-minsas'}
          initialEndNodeId="domain-seafloor-mapping"
          onClose={() => setIsPathFinderOpen(false)}
          onHighlightPath={(nodeIds, edgeIds) => {
            setHighlightedNodeIds(nodeIds);
            setHighlightedEdgeIds(edgeIds);
          }}
        />
      )}

      {isBlastRadiusOpen && (
        <BlastRadiusModal
          graph={stableGraph}
          nodeId={blastRadiusNodeId}
          onClose={() => setIsBlastRadiusOpen(false)}
          onSelectNode={handleSelectNode}
        />
      )}
    </div>
  );
};
