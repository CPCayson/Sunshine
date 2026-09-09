import { KnowledgeEdge, KnowledgeNode, UxSMission } from '../types';
import { buildStableKnowledgeGraph } from './knowledgeGraphBuilder';

export type AcceptedConstellationMode = 'MISSION' | 'PLATFORM' | 'INSTRUMENT';

export interface AcceptedPathFeature {
  id: string;
  depth: number;
  endNodeId: string;
  endNodeLabel: string;
  endNodeKind: string;
  predicates: string[];
  nodeIds: string[];
  label: string;
}

export interface AcceptedSimilarityResult {
  node: KnowledgeNode;
  score: number;
  sharedFeatures: AcceptedPathFeature[];
  focalOnlyCount: number;
  candidateOnlyCount: number;
  comparableFeatureCount: number;
}

export interface AcceptedConstellationModel {
  mode: AcceptedConstellationMode;
  nodes: KnowledgeNode[];
  focal: KnowledgeNode | null;
  results: AcceptedSimilarityResult[];
  acceptedEdgeCount: number;
  availableComparables: number;
  note?: string;
}

export interface ScienceQuestionPathResult {
  anchor: KnowledgeNode;
  target: KnowledgeNode;
  score: number;
  pathNodes: KnowledgeNode[];
  pathEdges: KnowledgeEdge[];
  explanation: string;
}

export interface ScienceQuestionModel {
  query: string;
  anchors: KnowledgeNode[];
  results: ScienceQuestionPathResult[];
  acceptedEdgeCount: number;
  note?: string;
}

const SIMILARITY_PREDICATES = new Set([
  'INCLUDES_LEG',
  'EXECUTED_DEPLOYMENT',
  'INSTANCE_OF_MODEL',
  'EMPLOYED_ASSET',
  'CARRIED',
  'PRODUCED',
  'HAS_ASSET',
  'REQUIRES_OR_BENEFITS_FROM',
  'OBSERVABLE_BY',
  'IMPLEMENTED_BY',
  'DOMAIN_OF',
  'OBSERVES',
  'COMPLEMENTARY_TO',
]);

const SCIENCE_PATH_PREDICATES = new Set([
  'REQUIRES_OR_BENEFITS_FROM',
  'OBSERVABLE_BY',
  'IMPLEMENTED_BY',
  'DOMAIN_OF',
  'OBSERVES',
]);

const normalize = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (value?: string) =>
  new Set(
    normalize(value)
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );

const tokenOverlap = (query: string, text: string) => {
  const left = tokens(query);
  const right = tokens(text);
  if (!left.size || !right.size) return 0;
  const matched = [...left].filter((token) => right.has(token)).length;
  return matched / left.size;
};

const isSyntheticNode = (node: KnowledgeNode) => {
  if (node.provenanceType === 'SYNTHETIC_FIXTURE' || node.isSyntheticConflict) return true;
  const warning = String(node.metadata?.warning || '');
  const text = `${node.label} ${node.subtitle || ''} ${warning}`;
  return /synthetic|demo fixture/i.test(text);
};

const buildAcceptedGraph = (mission: UxSMission) => {
  const graph = buildStableKnowledgeGraph(mission);
  const nodes = graph.nodes.filter((node) => node.state === 'ACCEPTED' && !isSyntheticNode(node));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter(
    (edge) =>
      edge.status === 'ACCEPTED' &&
      edge.provenance?.provenanceType !== 'SYNTHETIC_FIXTURE' &&
      nodeIds.has(edge.from) &&
      nodeIds.has(edge.to)
  );
  return { nodes, edges };
};

const getModeNodes = (nodes: KnowledgeNode[], mode: AcceptedConstellationMode) => {
  switch (mode) {
    case 'MISSION':
      return nodes.filter((node) => node.kind === 'mission');
    case 'PLATFORM':
      return nodes.filter((node) => node.kind === 'platformModel' || node.kind === 'physicalAsset');
    case 'INSTRUMENT':
      return nodes.filter((node) => node.kind === 'instrumentModel' || node.kind === 'instrumentInstance');
  }
};

const collectAcceptedPathFeatures = (
  focalId: string,
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[],
  maxDepth = 3
): AcceptedPathFeature[] => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Array<{ edge: KnowledgeEdge; nextId: string }>>();

  edges.forEach((edge) => {
    if (!SIMILARITY_PREDICATES.has(edge.predicate)) return;
    const from = adjacency.get(edge.from) || [];
    from.push({ edge, nextId: edge.to });
    adjacency.set(edge.from, from);

    const to = adjacency.get(edge.to) || [];
    to.push({ edge, nextId: edge.from });
    adjacency.set(edge.to, to);
  });

  const features: AcceptedPathFeature[] = [];
  const queue: Array<{ nodeId: string; depth: number; nodeIds: string[]; predicates: string[] }> = [
    { nodeId: focalId, depth: 0, nodeIds: [focalId], predicates: [] },
  ];

  while (queue.length) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    (adjacency.get(current.nodeId) || []).forEach(({ edge, nextId }) => {
      if (current.nodeIds.includes(nextId)) return;
      const nextNode = nodeById.get(nextId);
      if (!nextNode) return;

      const nextNodeIds = [...current.nodeIds, nextId];
      const nextPredicates = [...current.predicates, edge.predicate];
      const depth = current.depth + 1;
      const signature = `${nextPredicates.join('>')}|${nextNode.kind}|${normalize(
        nextNode.canonicalRef || nextNode.knowledgeKey || nextNode.label
      )}`;

      features.push({
        id: signature,
        depth,
        endNodeId: nextNode.id,
        endNodeLabel: nextNode.label,
        endNodeKind: nextNode.kind,
        predicates: nextPredicates,
        nodeIds: nextNodeIds,
        label: `${nextPredicates.join(' → ')} → ${nextNode.label}`,
      });

      queue.push({
        nodeId: nextId,
        depth,
        nodeIds: nextNodeIds,
        predicates: nextPredicates,
      });
    });
  }

  return Array.from(new Map(features.map((feature) => [feature.id, feature])).values());
};

const compareAcceptedNodes = (
  focal: KnowledgeNode,
  candidate: KnowledgeNode,
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[]
): AcceptedSimilarityResult => {
  const focalFeatures = collectAcceptedPathFeatures(focal.id, nodes, edges);
  const candidateFeatures = collectAcceptedPathFeatures(candidate.id, nodes, edges);
  const focalMap = new Map(focalFeatures.map((feature) => [feature.id, feature]));
  const candidateMap = new Map(candidateFeatures.map((feature) => [feature.id, feature]));
  const sharedIds = [...focalMap.keys()].filter((id) => candidateMap.has(id));
  const union = new Set([...focalMap.keys(), ...candidateMap.keys()]);

  return {
    node: candidate,
    score: union.size ? sharedIds.length / union.size : 0,
    sharedFeatures: sharedIds.slice(0, 8).map((id) => focalMap.get(id)!),
    focalOnlyCount: focalMap.size - sharedIds.length,
    candidateOnlyCount: candidateMap.size - sharedIds.length,
    comparableFeatureCount: union.size,
  };
};

export function buildAcceptedConstellation(
  mission: UxSMission,
  mode: AcceptedConstellationMode,
  focalId?: string
): AcceptedConstellationModel {
  const { nodes, edges } = buildAcceptedGraph(mission);
  const modeNodes = getModeNodes(nodes, mode);
  const requested = modeNodes.find((node) => node.id === focalId);
  const focal = requested || modeNodes[0] || null;

  if (!focal) {
    return {
      mode,
      nodes: modeNodes,
      focal: null,
      results: [],
      acceptedEdgeCount: edges.length,
      availableComparables: 0,
      note: `No accepted ${mode.toLowerCase()} nodes are available in the current MANTAS graph.`,
    };
  }

  // Preserve type boundaries: platform model is never compared as if it were a physical asset,
  // and instrument model is never compared as if it were an instrument instance.
  const comparable = modeNodes.filter((node) => node.id !== focal.id && node.kind === focal.kind);
  const results = comparable
    .map((node) => compareAcceptedNodes(focal, node, nodes, edges))
    .sort((a, b) => b.score - a.score);

  let note: string | undefined;
  if (!results.length) {
    note = `Only one accepted ${focal.kind} is present in the current graph. Constellation will not invent a cross-${mode.toLowerCase()} comparison.`;
  }

  return {
    mode,
    nodes: modeNodes,
    focal,
    results,
    acceptedEdgeCount: edges.length,
    availableComparables: results.length,
    note,
  };
}

const buildScienceAdjacency = (edges: KnowledgeEdge[]) => {
  const adjacency = new Map<string, Array<{ edge: KnowledgeEdge; nextId: string }>>();
  edges.forEach((edge) => {
    if (!SCIENCE_PATH_PREDICATES.has(edge.predicate)) return;
    const forward = adjacency.get(edge.from) || [];
    forward.push({ edge, nextId: edge.to });
    adjacency.set(edge.from, forward);

    const reverse = adjacency.get(edge.to) || [];
    reverse.push({ edge, nextId: edge.from });
    adjacency.set(edge.to, reverse);
  });
  return adjacency;
};

const nodeSearchText = (node: KnowledgeNode) =>
  `${node.label} ${node.subtitle || ''} ${node.canonicalRef || ''} ${Object.values(node.metadata || {}).join(' ')}`;

export function buildScienceQuestionConstellation(
  mission: UxSMission,
  query: string
): ScienceQuestionModel {
  const { nodes, edges } = buildAcceptedGraph(mission);
  const scienceAnchors = nodes.filter((node) => node.kind === 'scienceDomain');
  const rankedAnchors = scienceAnchors
    .map((node) => ({ node, score: tokenOverlap(query, nodeSearchText(node)) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const anchors = rankedAnchors.length
    ? rankedAnchors.map((entry) => entry.node)
    : scienceAnchors.slice(0, 1);

  if (!anchors.length) {
    return {
      query,
      anchors: [],
      results: [],
      acceptedEdgeCount: edges.length,
      note: 'No accepted science-domain nodes are available in the current graph.',
    };
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = buildScienceAdjacency(edges);
  const results: ScienceQuestionPathResult[] = [];

  anchors.slice(0, 3).forEach((anchor) => {
    const anchorScore = Math.max(0.25, tokenOverlap(query, nodeSearchText(anchor)));
    const queue: Array<{ nodeId: string; nodeIds: string[]; edgeIds: string[]; depth: number }> = [
      { nodeId: anchor.id, nodeIds: [anchor.id], edgeIds: [], depth: 0 },
    ];

    while (queue.length) {
      const current = queue.shift()!;
      if (current.depth >= 4) continue;

      (adjacency.get(current.nodeId) || []).forEach(({ edge, nextId }) => {
        if (current.nodeIds.includes(nextId)) return;
        const nextNode = nodeById.get(nextId);
        if (!nextNode) return;

        const nodeIds = [...current.nodeIds, nextId];
        const edgeIds = [...current.edgeIds, edge.id];
        const depth = current.depth + 1;
        const pathNodes = nodeIds.map((id) => nodeById.get(id)!).filter(Boolean);
        const pathEdges = edgeIds
          .map((id) => edges.find((candidate) => candidate.id === id))
          .filter(Boolean) as KnowledgeEdge[];

        if (
          nextNode.kind === 'observedProperty' ||
          nextNode.kind === 'sensorCapability' ||
          nextNode.kind === 'instrumentModel'
        ) {
          const confidence = pathEdges.reduce(
            (product, pathEdge) => product * (pathEdge.confidence ?? 1),
            1
          );
          const depthPenalty = 1 / Math.max(1, depth);
          const score = Math.min(1, anchorScore * 0.7 + confidence * depthPenalty * 0.3);
          results.push({
            anchor,
            target: nextNode,
            score,
            pathNodes,
            pathEdges,
            explanation: pathEdges
              .map((pathEdge, index) => `${pathNodes[index].label} —${pathEdge.predicate}→ ${pathNodes[index + 1].label}`)
              .join(' · '),
          });
        }

        queue.push({ nodeId: nextId, nodeIds, edgeIds, depth });
      });
    }
  });

  const deduped = Array.from(
    new Map(
      results
        .sort((a, b) => b.score - a.score)
        .map((result) => [`${result.anchor.id}:${result.target.id}:${result.pathEdges.map((edge) => edge.id).join(':')}`, result])
    ).values()
  ).slice(0, 12);

  return {
    query,
    anchors,
    results: deduped,
    acceptedEdgeCount: edges.length,
    note: rankedAnchors.length
      ? undefined
      : `No science-domain label directly matched “${query}”; showing paths from the first accepted science domain without claiming a semantic match.`,
  };
}
