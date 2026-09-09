import {
  KnowledgeEdge,
  KnowledgeGraph,
  KnowledgeNode,
  ProvenanceType,
} from '../types';
import {
  VERIFIED_NOAA_UXS_CORPUS,
  VerifiedUxSAssetRecord,
  buildKnowledgeKeyCandidate,
} from '../data/verifiedNoaaCorpus';

export type CorpusRelationshipEvidenceState =
  | 'SUPPORTED_BY_SOURCE_ROW'
  | 'SOURCE_MENTION_ONLY'
  | 'NOT_ESTABLISHED';

export interface SourceBackedRelationshipAssessment {
  predicate:
    | 'MANUFACTURES'
    | 'INSTANCE_OF_MODEL'
    | 'CAN_CARRY'
    | 'CONFIGURED_WITH'
    | 'CARRIED'
    | 'PRODUCED';
  state: CorpusRelationshipEvidenceState;
  explanation: string;
  evidenceRefs: string[];
}

export interface VerifiedCorpusInvariantAudit {
  passed: boolean;
  checks: Array<{
    id: string;
    passed: boolean;
    explanation: string;
  }>;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const SOURCE_ARTIFACT_NODE_ID = 'corpus-source-fused-evidence-registry';

export const corpusGraphNodeIdForRecord = (record: VerifiedUxSAssetRecord) =>
  `corpus-asset-${record.id}`;

export const corpusObservationNodeIdForRecord = (record: VerifiedUxSAssetRecord) =>
  `corpus-observation-${record.id}`;

export function getSourceBackedRelationshipAssessment(
  record: VerifiedUxSAssetRecord
): SourceBackedRelationshipAssessment[] {
  const evidenceRefs = [record.sourceRef];

  return [
    {
      predicate: 'MANUFACTURES',
      state: 'SUPPORTED_BY_SOURCE_ROW',
      explanation:
        'The imported inventory row explicitly records manufacturer and model together. This supports a source-observed manufacturer/model relationship.',
      evidenceRefs,
    },
    {
      predicate: 'INSTANCE_OF_MODEL',
      state: 'SUPPORTED_BY_SOURCE_ROW',
      explanation:
        'The imported row records the asset identifier with manufacturer/model context, supporting an observed physical-asset to model association.',
      evidenceRefs,
    },
    {
      predicate: 'CAN_CARRY',
      state: 'NOT_ESTABLISHED',
      explanation:
        'An inventory payload/version string is not manufacturer capability documentation. CAN_CARRY requires a separate provider/specification authority.',
      evidenceRefs,
    },
    {
      predicate: 'CONFIGURED_WITH',
      state: record.payloadEvidence ? 'SOURCE_MENTION_ONLY' : 'NOT_ESTABLISHED',
      explanation: record.payloadEvidence
        ? `The source row contains payload/version text ("${record.payloadEvidence}"), but the row does not establish a serialized instrument instance or a bounded physical configuration event. Keep this as a candidate observation until corroborated.`
        : 'No payload/configuration value is present in this source record.',
      evidenceRefs,
    },
    {
      predicate: 'CARRIED',
      state: 'NOT_ESTABLISHED',
      explanation:
        'The inventory row does not identify a bounded deployment/dive carrying a serialized instrument instance.',
      evidenceRefs,
    },
    {
      predicate: 'PRODUCED',
      state: 'NOT_ESTABLISHED',
      explanation:
        'The inventory row does not provide dataset lineage from a serialized instrument instance to a produced dataset.',
      evidenceRefs,
    },
  ];
}

/**
 * Convert the verified inventory seed into an evidence-only graph overlay.
 *
 * Important: this graph intentionally does NOT emit CAN_CARRY,
 * CONFIGURED_WITH, CARRIED, or PRODUCED edges from the inventory workbook.
 * Those predicates require separate authorities and evidence scopes.
 */
export function buildVerifiedCorpusKnowledgeGraph(): KnowledgeGraph {
  const nodes: KnowledgeNode[] = [
    {
      id: SOURCE_ARTIFACT_NODE_ID,
      kind: 'sourceArtifact',
      label: 'MANTAS UxS Fused Evidence Registry',
      subtitle: 'Imported source artifact · evidence, not canonical truth',
      state: 'OBSERVED',
      provenanceType: 'IMPORTED_ARTIFACT',
      metadata: {
        sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
        completenessClaim: 'NOT_ASSERTED',
        doesNotProve: [
          'complete NOAA fleet coverage',
          'bounded deployment relationships',
          'dataset lineage',
          'destination-system outcomes',
        ],
      },
    },
  ];
  const edges: KnowledgeEdge[] = [];

  const seenNodeIds = new Set(nodes.map((node) => node.id));
  const seenEdgeIds = new Set<string>();

  const pushNode = (node: KnowledgeNode) => {
    if (!seenNodeIds.has(node.id)) {
      seenNodeIds.add(node.id);
      nodes.push(node);
    }
  };

  const pushEdge = (edge: KnowledgeEdge) => {
    if (!seenEdgeIds.has(edge.id)) {
      seenEdgeIds.add(edge.id);
      edges.push(edge);
    }
  };

  VERIFIED_NOAA_UXS_CORPUS.forEach((record) => {
    const manufacturerId = `corpus-manufacturer-${slugify(record.manufacturer)}`;
    const modelId = `corpus-platform-model-${slugify(`${record.manufacturer}-${record.model}`)}`;
    const assetId = corpusGraphNodeIdForRecord(record);
    const observationId = corpusObservationNodeIdForRecord(record);
    const knowledgeKeyCandidate = buildKnowledgeKeyCandidate(record);

    pushNode({
      id: manufacturerId,
      kind: 'manufacturer',
      label: record.manufacturer,
      subtitle: 'Manufacturer name observed in imported inventory rows',
      state: 'OBSERVED',
      provenanceType: 'IMPORTED_ARTIFACT',
      evidenceRefs: [record.sourceRef],
    });

    pushNode({
      id: modelId,
      kind: 'platformModel',
      label: `${record.manufacturer} ${record.model}`,
      subtitle: `${record.platformClass} model observed in imported inventory`,
      state: 'OBSERVED',
      provenanceType: 'IMPORTED_ARTIFACT',
      evidenceRefs: [record.sourceRef],
      metadata: {
        platformClass: record.platformClass,
        sourceYears: record.sourceYears,
      },
    });

    pushNode({
      id: assetId,
      kind: 'physicalAsset',
      label: `${record.model}${record.serialOrIdentifier ? ` #${record.serialOrIdentifier}` : ''}`,
      subtitle: record.cdNumber || record.physicalLocation || 'Source-observed asset record',
      state: 'OBSERVED',
      knowledgeKey: knowledgeKeyCandidate,
      provenanceType: 'IMPORTED_ARTIFACT',
      evidenceRefs: [record.sourceRef],
      metadata: {
        knowledgeKeyState: 'CANDIDATE',
        manufacturer: record.manufacturer,
        model: record.model,
        serialOrIdentifier: record.serialOrIdentifier,
        cdNumber: record.cdNumber,
        physicalLocation: record.physicalLocation,
        acquisitionYear: record.acquisitionYear,
        operationalStatus: record.status,
        identityState: record.identityState,
        identityBasis: record.identityBasis,
        confidence: record.confidence,
        missionContext: record.missionContext,
        payloadEvidence: record.payloadEvidence,
        doesNotProve: record.doesNotProve,
      },
    });

    pushNode({
      id: observationId,
      kind: 'observation',
      label: `${record.sourceRef} · inventory observation`,
      subtitle: `${record.manufacturer} ${record.model}${record.serialOrIdentifier ? ` / ${record.serialOrIdentifier}` : ''}`,
      state: 'OBSERVED',
      provenanceType: 'IMPORTED_ARTIFACT',
      evidenceRefs: [record.sourceRef],
      sourceRefs: [record.sourceArtifact],
      metadata: {
        missionContext: record.missionContext,
        payloadEvidence: record.payloadEvidence,
        sourceYears: record.sourceYears,
        supports: record.supports,
        doesNotProve: record.doesNotProve,
      },
    });

    pushEdge({
      id: `edge-${SOURCE_ARTIFACT_NODE_ID}-${observationId}`,
      from: SOURCE_ARTIFACT_NODE_ID,
      to: observationId,
      predicate: 'CONTAINS_OBSERVATION',
      family: 'EVIDENCE',
      direction: 'FORWARD',
      status: 'OBSERVED',
      confidence: record.confidence,
      evidenceRefs: [record.sourceRef],
      provenance: {
        sourceSystem: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
        sourceRecordId: record.sourceRef,
        provenanceType: 'IMPORTED_ARTIFACT',
      },
      explanation: 'The imported workbook contains this source observation.',
    });

    pushEdge({
      id: `edge-${observationId}-${assetId}-identity`,
      from: observationId,
      to: assetId,
      predicate: 'SUPPORTS_IDENTITY_OF',
      family: 'EVIDENCE',
      direction: 'FORWARD',
      status: 'OBSERVED',
      confidence: record.confidence,
      evidenceRefs: [record.sourceRef],
      provenance: {
        sourceSystem: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
        sourceRecordId: record.sourceRef,
        provenanceType: 'IMPORTED_ARTIFACT',
      },
      explanation:
        'Source row supports an asset identity observation. It does not by itself create an accepted canonical asset binding.',
    });

    pushEdge({
      id: `edge-${assetId}-${modelId}-instance`,
      from: assetId,
      to: modelId,
      predicate: 'INSTANCE_OF_MODEL',
      family: 'HIERARCHY',
      direction: 'FORWARD',
      status: 'OBSERVED',
      confidence: record.confidence,
      evidenceRefs: [record.sourceRef],
      provenance: {
        sourceSystem: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
        sourceRecordId: record.sourceRef,
        provenanceType: 'IMPORTED_ARTIFACT',
      },
      explanation:
        'Manufacturer/model/asset identifier are co-observed in the imported source record.',
    });

    pushEdge({
      id: `edge-${manufacturerId}-${modelId}-manufactures`,
      from: manufacturerId,
      to: modelId,
      predicate: 'MANUFACTURES',
      family: 'DOMAIN',
      direction: 'FORWARD',
      status: 'OBSERVED',
      confidence: record.confidence,
      evidenceRefs: [record.sourceRef],
      provenance: {
        sourceSystem: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
        sourceRecordId: record.sourceRef,
        provenanceType: 'IMPORTED_ARTIFACT',
      },
      explanation:
        'The imported inventory row records the manufacturer and platform model together.',
    });

    if (record.missionContext) {
      const contextNodeId = `corpus-use-context-${record.id}`;
      pushNode({
        id: contextNodeId,
        kind: 'claim',
        label: `Use context: ${record.missionContext}`,
        subtitle: 'Source-observed context · not a bounded deployment',
        state: 'OBSERVED',
        provenanceType: 'IMPORTED_ARTIFACT',
        evidenceRefs: [record.sourceRef],
      });
      pushEdge({
        id: `edge-${observationId}-${contextNodeId}`,
        from: observationId,
        to: contextNodeId,
        predicate: 'SUPPORTS',
        family: 'EVIDENCE',
        direction: 'FORWARD',
        status: 'OBSERVED',
        evidenceRefs: [record.sourceRef],
        explanation: 'The source row explicitly contains this use/mission-context text.',
      });
      pushEdge({
        id: `edge-${contextNodeId}-${assetId}`,
        from: contextNodeId,
        to: assetId,
        predicate: 'DESCRIBES_USE_CONTEXT_OF',
        family: 'EVIDENCE',
        direction: 'FORWARD',
        status: 'OBSERVED',
        evidenceRefs: [record.sourceRef],
        explanation:
          'Use context is attached to the source-observed asset record. It is not promoted to a Mission or Deployment entity.',
      });
    }

    if (record.payloadEvidence) {
      const payloadMentionNodeId = `corpus-payload-mention-${record.id}`;
      pushNode({
        id: payloadMentionNodeId,
        kind: 'claim',
        label: `Payload mention: ${record.payloadEvidence}`,
        subtitle: 'Raw inventory payload/version evidence · reconciliation required',
        state: 'OBSERVED',
        provenanceType: 'IMPORTED_ARTIFACT',
        evidenceRefs: [record.sourceRef],
        metadata: {
          relationshipBoundary: {
            canCarry: 'NOT_ESTABLISHED',
            configuredWith: 'SOURCE_MENTION_ONLY',
            carried: 'NOT_ESTABLISHED',
            produced: 'NOT_ESTABLISHED',
          },
        },
      });
      pushEdge({
        id: `edge-${observationId}-${payloadMentionNodeId}`,
        from: observationId,
        to: payloadMentionNodeId,
        predicate: 'SUPPORTS',
        family: 'EVIDENCE',
        direction: 'FORWARD',
        status: 'OBSERVED',
        evidenceRefs: [record.sourceRef],
        explanation: 'The source row explicitly contains this payload/version text.',
      });
      pushEdge({
        id: `edge-${payloadMentionNodeId}-${assetId}`,
        from: payloadMentionNodeId,
        to: assetId,
        predicate: 'MENTIONS_POSSIBLE_PAYLOAD_FOR',
        family: 'EVIDENCE',
        direction: 'FORWARD',
        status: 'UNRESOLVED',
        confidence: 0.6,
        evidenceRefs: [record.sourceRef],
        explanation:
          'The payload string is retained as candidate evidence only. It is deliberately not emitted as CONFIGURED_WITH, CARRIED, or PRODUCED.',
      });
    }
  });

  return { nodes, edges };
}

export function queryVerifiedCorpus(term: string): VerifiedUxSAssetRecord[] {
  const q = term.trim().toLowerCase();
  if (!q) return VERIFIED_NOAA_UXS_CORPUS;

  return VERIFIED_NOAA_UXS_CORPUS.filter((record) =>
    [
      record.platformClass,
      record.manufacturer,
      record.model,
      record.serialOrIdentifier,
      record.cdNumber,
      record.missionContext,
      record.payloadEvidence,
      record.physicalLocation,
      record.status,
      record.sourceRef,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  );
}

export function runVerifiedCorpusInvariantAudit(): VerifiedCorpusInvariantAudit {
  const graph = buildVerifiedCorpusKnowledgeGraph();
  const forbiddenPredicates = new Set(['CAN_CARRY', 'CONFIGURED_WITH', 'CARRIED', 'PRODUCED']);
  const emittedForbidden = graph.edges.filter((edge) => forbiddenPredicates.has(edge.predicate));
  const nonImportedNodes = graph.nodes.filter(
    (node) => node.provenanceType && node.provenanceType !== ('IMPORTED_ARTIFACT' as ProvenanceType)
  );
  const acceptedAssetNodes = graph.nodes.filter(
    (node) => node.kind === 'physicalAsset' && node.state === 'ACCEPTED'
  );
  const assetNodes = graph.nodes.filter((node) => node.kind === 'physicalAsset');
  const allCandidates = assetNodes.every(
    (node) => node.metadata?.knowledgeKeyState === 'CANDIDATE'
  );

  const checks = [
    {
      id: 'NO_UNSUPPORTED_OPERATIONAL_PREDICATES',
      passed: emittedForbidden.length === 0,
      explanation:
        emittedForbidden.length === 0
          ? 'Inventory evidence emits no CAN_CARRY, CONFIGURED_WITH, CARRIED, or PRODUCED edges.'
          : `Unexpected predicates emitted: ${emittedForbidden.map((edge) => edge.predicate).join(', ')}`,
    },
    {
      id: 'NO_AUTO_ACCEPTED_ASSETS',
      passed: acceptedAssetNodes.length === 0,
      explanation:
        acceptedAssetNodes.length === 0
          ? 'Imported asset observations remain OBSERVED and do not auto-promote to accepted canonical truth.'
          : `${acceptedAssetNodes.length} physical asset nodes were incorrectly auto-accepted.`,
    },
    {
      id: 'KNOWLEDGE_KEYS_REMAIN_CANDIDATES',
      passed: allCandidates,
      explanation: allCandidates
        ? 'All imported physical-asset Knowledge Keys are explicitly candidate bindings.'
        : 'At least one imported physical asset lacks candidate-binding state.',
    },
    {
      id: 'PROVENANCE_IS_IMPORTED_ARTIFACT',
      passed: nonImportedNodes.length === 0,
      explanation:
        nonImportedNodes.length === 0
          ? 'Corpus graph nodes retain IMPORTED_ARTIFACT provenance.'
          : `${nonImportedNodes.length} nodes have unexpected provenance.`,
    },
  ];

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
}
