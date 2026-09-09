import React, { useMemo, useState } from 'react';
import { Boxes, Layers3, Network, Search, ShieldCheck, Workflow } from 'lucide-react';
import { ActiveWorkspaceTab, KnowledgeNode, UxSMission } from '../types';
import { buildStableKnowledgeGraph } from '../services/knowledgeGraphBuilder';
import {
  classifySystemTopologyDomain,
  classifySystemTopologyRelation,
  computeSystemTopologyLayout,
  isSystemTopologyNode,
  SYSTEM_TOPOLOGY_DOMAIN_CONFIG,
  SYSTEM_TOPOLOGY_RELATION_CONFIG,
  SystemTopologyDomain,
  SystemTopologyLayoutMode,
} from '../services/systemTopologyMapping';
import { NodeInspector } from './graph/NodeInspector';
import { EdgeInspector } from './graph/EdgeInspector';

interface SystemTopologyGraphProps {
  mission: UxSMission;
  onSelectNodeInLens?: (node: KnowledgeNode) => void;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
}

const layoutOptions: Array<{
  id: SystemTopologyLayoutMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: 'radial',
    label: 'System Radial',
    icon: <Network className="w-3.5 h-3.5" />,
    description: 'Platform-centered architecture with system domains arranged around the mission.',
  },
  {
    id: 'domain_cluster',
    label: 'Domain Clusters',
    icon: <Boxes className="w-3.5 h-3.5" />,
    description: 'Groups nodes by engineering, science, mission, and assurance domain.',
  },
  {
    id: 'layered_architecture',
    label: 'Layered Architecture',
    icon: <Layers3 className="w-3.5 h-3.5" />,
    description: 'Mission-to-sensor-to-platform-to-evidence architecture layers.',
  },
];

export const SystemTopologyGraph: React.FC<SystemTopologyGraphProps> = ({
  mission,
  onSelectNodeInLens,
  onNavigateTab,
}) => {
  const [layoutMode, setLayoutMode] = useState<SystemTopologyLayoutMode>('radial');
  const [includeAssurance, setIncludeAssurance] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('plat-model-remus620');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const graph = useMemo(() => buildStableKnowledgeGraph(mission), [mission]);
  const positions = useMemo(
    () => computeSystemTopologyLayout(graph, layoutMode, includeAssurance, selectedNodeId),
    [graph, layoutMode, includeAssurance, selectedNodeId]
  );

  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedNodeId) || null,
    [graph, selectedNodeId]
  );
  const selectedEdge = useMemo(
    () => graph.edges.find((edge) => edge.id === selectedEdgeId) || null,
    [graph, selectedEdgeId]
  );

  const visibleNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return graph.nodes.filter((node) => {
      const position = positions.get(node.id);
      if (!position?.visible) return false;
      if (!query) return true;
      return [node.label, node.subtitle, node.kind, node.canonicalRef]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [graph.nodes, positions, searchQuery]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const domainCounts = useMemo(() => {
    const counts = new Map<SystemTopologyDomain, number>();
    visibleNodes.forEach((node) => {
      const domain = classifySystemTopologyDomain(node);
      counts.set(domain, (counts.get(domain) || 0) + 1);
    });
    return [...counts.entries()].sort(
      ([a], [b]) => SYSTEM_TOPOLOGY_DOMAIN_CONFIG[a].order - SYSTEM_TOPOLOGY_DOMAIN_CONFIG[b].order
    );
  }, [visibleNodes]);

  const handleSelectNode = (node: KnowledgeNode) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    onSelectNodeInLens?.(node);
  };

  return (
    <div className="h-full w-full bg-[#030712] text-slate-100 flex flex-col overflow-hidden">
      <div className="border-b border-slate-800/90 bg-[#07101f] px-5 py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center">
              <Workflow className="w-4.5 h-4.5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold tracking-wide">System topology graph</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-700/50 bg-emerald-950/30 text-emerald-300">
                  SAME MANTAS GRAPH · BETTER PROJECTION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                APH-22-inspired domain mapping over the existing evidence-backed graph. View changes never mutate Zen meaning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find platform, sensor, domain..."
                className="w-56 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-[#030812] text-xs text-slate-200 outline-none focus:border-cyan-600 placeholder:text-slate-600"
              />
            </label>
            <button
              type="button"
              onClick={() => setIncludeAssurance((value) => !value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${
                includeAssurance
                  ? 'border-purple-500/60 bg-purple-950/35 text-purple-200'
                  : 'border-slate-800 bg-[#030812] text-slate-400 hover:text-slate-200'
              }`}
              title="Include evidence, projection, destination, and authority nodes"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Assurance {includeAssurance ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {layoutOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLayoutMode(option.id)}
              title={option.description}
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                layoutMode === option.id
                  ? 'border-cyan-500/70 bg-cyan-950/45 text-cyan-200'
                  : 'border-slate-800 bg-[#030812] text-slate-500 hover:text-slate-200'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
          <div className="h-5 w-px bg-slate-800 mx-1" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600 font-mono">
            {visibleNodes.filter(isSystemTopologyNode).length} system nodes · {graph.edges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)).length} visible relations
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {domainCounts.map(([domain, count]) => {
            const visual = SYSTEM_TOPOLOGY_DOMAIN_CONFIG[domain];
            return (
              <span
                key={domain}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-800 bg-[#030812] text-[10px] font-mono whitespace-nowrap"
                title={visual.description}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.accent }} />
                <span className="text-slate-300">{visual.shortName}</span>
                <span className="text-slate-600">{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 960 620" role="img" aria-label="MANTAS system topology graph">
            <rect width="960" height="620" fill="#030712" />
            <defs>
              <marker id="system-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b" />
              </marker>
              <filter id="system-node-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {graph.edges.map((edge) => {
              if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) return null;
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from?.visible || !to?.visible) return null;
              const channel = classifySystemTopologyRelation(edge);
              const visual = SYSTEM_TOPOLOGY_RELATION_CONFIG[channel];
              const selected = edge.id === selectedEdgeId;
              const connectedToSelection = edge.from === selectedNodeId || edge.to === selectedNodeId;
              const dimmed = selectedNodeId && !connectedToSelection && !selected;
              return (
                <g key={edge.id} className="cursor-pointer" onClick={() => setSelectedEdgeId(edge.id)}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth="14" />
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={edge.status === 'CONFLICT' ? '#fb7185' : visual.accent}
                    strokeWidth={selected ? 3 : connectedToSelection ? 2.2 : 1.25}
                    strokeDasharray={edge.status === 'CONFLICT' ? '4 3' : visual.dash}
                    opacity={dimmed ? 0.16 : selected ? 1 : 0.62}
                    markerEnd="url(#system-arrow)"
                  />
                </g>
              );
            })}

            {visibleNodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos?.visible) return null;
              const domain = classifySystemTopologyDomain(node);
              const visual = SYSTEM_TOPOLOGY_DOMAIN_CONFIG[domain];
              const selected = node.id === selectedNodeId;
              const cardWidth = selected ? 156 : 142;
              const cardHeight = selected ? 68 : 60;
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x - cardWidth / 2}, ${pos.y - cardHeight / 2})`}
                  className="cursor-pointer"
                  onClick={() => handleSelectNode(node)}
                >
                  {selected && (
                    <rect
                      x="-5"
                      y="-5"
                      width={cardWidth + 10}
                      height={cardHeight + 10}
                      rx="14"
                      fill="none"
                      stroke={visual.accent}
                      strokeWidth="1.5"
                      filter="url(#system-node-glow)"
                    />
                  )}
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="11"
                    fill={visual.fill}
                    stroke={node.state === 'CONFLICT' ? '#fb7185' : visual.accent}
                    strokeWidth={selected ? 2 : 1.05}
                    opacity="0.97"
                  />
                  <rect width="4" height={cardHeight} rx="2" fill={visual.accent} />
                  <text x="12" y="15" fill={visual.accent} fontSize="7.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                    {visual.shortName.toUpperCase()}
                  </text>
                  <text x="12" y="33" fill="#f1f5f9" fontSize="10" fontWeight="700">
                    {node.label.length > 23 ? `${node.label.slice(0, 22)}…` : node.label}
                  </text>
                  <text x="12" y="48" fill="#94a3b8" fontSize="7.8">
                    {(node.subtitle || node.kind).length > 27 ? `${(node.subtitle || node.kind).slice(0, 26)}…` : node.subtitle || node.kind}
                  </text>
                  {node.state && (
                    <text x={cardWidth - 9} y={cardHeight - 8} textAnchor="end" fill={node.state === 'CONFLICT' ? '#fda4af' : '#64748b'} fontSize="6.8" fontFamily="monospace">
                      {node.state}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none">
            {(Object.entries(SYSTEM_TOPOLOGY_RELATION_CONFIG) as Array<[keyof typeof SYSTEM_TOPOLOGY_RELATION_CONFIG, (typeof SYSTEM_TOPOLOGY_RELATION_CONFIG)[keyof typeof SYSTEM_TOPOLOGY_RELATION_CONFIG]]>).map(([channel, visual]) => (
              <span key={channel} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#050b16]/90 border border-slate-800 text-[9px] font-mono text-slate-400 backdrop-blur-sm">
                <span className="w-4 h-px" style={{ backgroundColor: visual.accent }} />
                {visual.label}
              </span>
            ))}
          </div>
        </div>

        {selectedEdge ? (
          <EdgeInspector
            edge={selectedEdge}
            nodes={graph.nodes}
            onClose={() => setSelectedEdgeId(null)}
            onSelectNode={(id) => {
              const node = graph.nodes.find((candidate) => candidate.id === id);
              if (node) handleSelectNode(node);
            }}
            onReconcileDrift={() => onNavigateTab?.('evidence')}
          />
        ) : selectedNode ? (
          <NodeInspector
            node={selectedNode}
            edges={graph.edges}
            nodes={graph.nodes}
            onClose={() => setSelectedNodeId('')}
            onSelectNode={(id) => {
              const node = graph.nodes.find((candidate) => candidate.id === id);
              if (node) handleSelectNode(node);
            }}
            onSelectEdge={(id) => setSelectedEdgeId(id)}
            onOpenBlastRadius={() => undefined}
            onOpenPathFinder={() => undefined}
          />
        ) : null}
      </div>
    </div>
  );
};
