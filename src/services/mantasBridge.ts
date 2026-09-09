export type MantasBridgeState =
  | 'NOT_CONNECTED'
  | 'CONNECTED_READ_ONLY'
  | 'STALE'
  | 'ERROR';

export type MantasTruthState =
  | 'OBSERVED'
  | 'CANDIDATE'
  | 'HUMAN_DECISION'
  | 'ACCEPTED_INTO_ZEN'
  | 'LOCAL_PROJECTION'
  | 'RECEIPT'
  | 'NOT_TESTED';

export interface MantasReceiptSummary {
  id: string;
  authority: string;
  scope: string;
  result: string;
  observedAt?: string;
  reference?: string;
  doesNotProve?: string[];
}

export interface MantasProjectionSummary {
  format: 'ISO' | 'STAC' | 'DCAT' | 'ACDD' | 'GEOJSON' | string;
  state: 'LOCAL_PROJECTION' | 'NOT_AVAILABLE';
  artifactRef?: string;
}

export interface MantasEvidenceSummary {
  id: string;
  label: string;
  authority?: string;
  sourceRef?: string;
  state: 'OBSERVED';
}

export interface MantasRelationshipSummary {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  state: 'CANDIDATE' | 'ACCEPTED_INTO_ZEN' | 'REJECTED';
  supportLabel?: string;
  evidenceRefs?: string[];
}

export interface MantasTruthEnvelope {
  schema: 'mantas.sunshine.bridge.v0';
  generatedAt: string;
  source: {
    authority: 'MANTAS_ZEN';
    mode: 'READ_ONLY';
    canonicalMissionId: string;
    canonicalHash?: string;
  };
  mission: {
    id: string;
    title?: string;
    platform?: string;
    start?: string;
    end?: string;
    place?: string;
  };
  evidence: MantasEvidenceSummary[];
  relationships: MantasRelationshipSummary[];
  projections: MantasProjectionSummary[];
  receipts: MantasReceiptSummary[];
  destinationState: {
    comet: string;
    oiss: string;
  };
}

export interface MantasBridgeSnapshot {
  state: MantasBridgeState;
  envelope: MantasTruthEnvelope | null;
  message: string;
}

/**
 * Sunshine has no authoritative MANTAS runtime endpoint wired yet.
 * This default keeps the UI honest until a real read-only endpoint is supplied.
 */
export const disconnectedMantasBridge = (): MantasBridgeSnapshot => ({
  state: 'NOT_CONNECTED',
  envelope: null,
  message: 'Zen is not connected. Sunshine is rendering local prototype state.',
});

/**
 * Validate only the minimum bridge boundary needed by the visual companion.
 * This function does not decide whether the enclosed mission meaning is correct;
 * it only checks that the payload declares the expected read-only contract.
 */
export const inspectMantasTruthEnvelope = (value: unknown): MantasBridgeSnapshot => {
  if (!value || typeof value !== 'object') {
    return { state: 'ERROR', envelope: null, message: 'Invalid MANTAS bridge payload.' };
  }

  const candidate = value as Partial<MantasTruthEnvelope>;
  if (
    candidate.schema !== 'mantas.sunshine.bridge.v0' ||
    candidate.source?.authority !== 'MANTAS_ZEN' ||
    candidate.source?.mode !== 'READ_ONLY' ||
    !candidate.source?.canonicalMissionId
  ) {
    return {
      state: 'ERROR',
      envelope: null,
      message: 'Payload does not satisfy the Sunshine read-only MANTAS bridge contract.',
    };
  }

  return {
    state: 'CONNECTED_READ_ONLY',
    envelope: candidate as MantasTruthEnvelope,
    message: 'Read-only MANTAS truth envelope accepted for visualization.',
  };
};
