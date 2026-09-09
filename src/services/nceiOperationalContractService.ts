import {
  DestinationObservation,
  DestinationCompareResult,
  ExpectedFile,
  ExternalServiceObservation,
  FileComparisonItem,
  ObservedFile,
  ScopedReceipt,
  UniversalExpectedObserved,
  UxSMission,
} from '../types';
import {
  compareDestinationWithCanonical,
  destinationReconciliationService,
  OFFICIAL_AUTHORITY_RECEIPTS,
} from './destinationReconciliationService';
import { OFFICIAL_COMET_CONTRACT } from './cometAdapter';
import {
  evaluateOissHandoffProfile,
  OissHandoffEvaluationContext,
} from './oissHandoffService';
import { compareFileInventories } from '../data/packageInventory';

export type OperationalEvidenceMode = 'LIVE' | 'FIXTURE' | 'NOT_TESTED';

export interface FileVersionIdentityTuple {
  logicalFileIdentity: string;
  physicalFileIdentity?: string;
  fileVersionIdentity?: string;
  semanticParentIdentity: string;
  missionIdentity: string;
  packageIdentity: string;
}

export interface CometObservationInterpretation {
  service: string;
  transportState: 'OBSERVED' | 'AUTH_REQUIRED' | 'UNAVAILABLE' | 'FIXTURE';
  resultState: 'NOT_ASSERTED' | 'FIXTURE_ONLY';
  explanation: string;
}

export interface NceiOperationalContractInputs {
  oneStopObservation?: DestinationObservation | null;
  cmrObservation?: DestinationObservation | null;
  cometObservations?: ExternalServiceObservation[];
  expectedFiles?: ExpectedFile[];
  observedFiles?: ObservedFile[];
  oissContext?: OissHandoffEvaluationContext;
}

export interface NceiOperationalContractGateReport {
  generatedAt: string;
  gates: {
    DESTINATION_COMPARE_IMPLEMENTED: boolean;
    COMET_COMPANION_BOUNDARY_PRESERVED: boolean;
    OISS_HANDOFF_RULE_BACKED: boolean;
    OISS_EXTERNAL_OUTCOMES_GATED: boolean;
    FILE_VERSION_IDENTITY_MODELED: boolean;
    EXPECTED_OBSERVED_UNIVERSAL: boolean;
    AUTHORITY_FIRST_CLASS: boolean;
    FRESHNESS_INVALIDATION_WORKS: boolean;
    DOES_NOT_PROVE_PERSISTS: boolean;
    DESTINATION_OBSERVATIONS_ARE_EVIDENCE: boolean;
    DESTINATION_OBSERVATIONS_ARE_CANONICAL: boolean;
  };
  modes: {
    ONESTOP_MODE: OperationalEvidenceMode;
    CMR_MODE: OperationalEvidenceMode;
    COMET_MODE: OperationalEvidenceMode;
  };
  counts: {
    universalComparisons: number;
    scopedReceipts: number;
    fileIdentityTuples: number;
    oissRules: number;
  };
  failures: string[];
}

export const COMET_COMPANION_FLOW = [
  'PULL',
  'INSPECT',
  'READINESS',
  'COMPARE',
  'REOBSERVE',
] as const;

const EXTERNAL_OISS_OUTCOMES = [
  'OISS_VALIDATED',
  'OISS_EXECUTED',
  'ARCHIVED',
  'ACCESSIBLE',
  'DISCOVERABLE',
];

export const deriveOperationalEvidenceMode = (
  observations: Array<{ provenanceType?: string } | null | undefined>
): OperationalEvidenceMode => {
  const provenance = observations
    .filter(Boolean)
    .map((observation) => observation?.provenanceType);

  if (provenance.some((value) => value === 'LIVE_OBSERVED')) return 'LIVE';
  if (provenance.some((value) => value === 'SYNTHETIC_FIXTURE')) return 'FIXTURE';
  return 'NOT_TESTED';
};

/**
 * A destination observation becomes stale when the canonical record changes
 * after the destination was observed. The observation is retained as evidence;
 * it is never deleted or rewritten into canonical truth.
 */
export function invalidateDestinationObservationAfterCanonicalChange(
  observation: DestinationObservation | null,
  canonicalChangedAt: string
): DestinationObservation | null {
  if (!observation) return null;

  const observedAt = Date.parse(observation.observedAt);
  const changedAt = Date.parse(canonicalChangedAt);

  if (!Number.isFinite(observedAt) || !Number.isFinite(changedAt)) {
    return {
      ...observation,
      freshness: 'UNKNOWN',
      state: observation.state === 'MATCH' ? 'UNVERIFIABLE' : observation.state,
    };
  }

  if (observedAt < changedAt) {
    return {
      ...observation,
      freshness: 'STALE',
      state: 'STALE',
    };
  }

  return observation;
}

/**
 * Preserve the distinct identities involved in package handling. A file's
 * stable logical identity, physical storage identity, file-version identity,
 * semantic parent, mission identity, and package identity are separate axes.
 */
export function buildFileVersionIdentityTuples(
  mission: UxSMission,
  expectedFiles: ExpectedFile[] = [],
  observedFiles: ObservedFile[] = []
): FileVersionIdentityTuple[] {
  const observedByKey = new Map(
    observedFiles.map((file) => [file.logicalFileKey, file])
  );

  return expectedFiles.map((expected) => {
    const observed = observedByKey.get(expected.logicalFileKey);
    return {
      logicalFileIdentity: expected.logicalFileKey,
      physicalFileIdentity: observed?.physicalIdentity,
      fileVersionIdentity: observed?.fileVersionIdentity,
      semanticParentIdentity: expected.canonicalRef,
      missionIdentity: `mission:${mission.id}`,
      packageIdentity: expected.packageRef,
    };
  });
}

export function fileVersionIdentityModelIsSeparated(
  tuples: FileVersionIdentityTuple[]
): boolean {
  if (tuples.length === 0) return false;

  return tuples.every((tuple) => {
    if (!tuple.logicalFileIdentity || !tuple.semanticParentIdentity || !tuple.missionIdentity || !tuple.packageIdentity) {
      return false;
    }

    if (tuple.logicalFileIdentity === tuple.semanticParentIdentity) return false;
    if (tuple.logicalFileIdentity === tuple.missionIdentity) return false;
    if (tuple.fileVersionIdentity && tuple.fileVersionIdentity === tuple.logicalFileIdentity) return false;
    if (tuple.fileVersionIdentity && tuple.fileVersionIdentity === tuple.semanticParentIdentity) return false;
    if (tuple.physicalFileIdentity && tuple.physicalFileIdentity === tuple.fileVersionIdentity) return false;

    return true;
  });
}

export function interpretCometObservation(
  observation: ExternalServiceObservation
): CometObservationInterpretation {
  if (observation.provenanceType === 'SYNTHETIC_FIXTURE') {
    return {
      service: observation.service,
      transportState: 'FIXTURE',
      resultState: 'FIXTURE_ONLY',
      explanation: 'Synthetic fixture: no live NOAA result is asserted.',
    };
  }

  if (observation.authStatus === 'AUTH_REQUIRED' || observation.httpStatus === 302) {
    return {
      service: observation.service,
      transportState: 'AUTH_REQUIRED',
      resultState: 'NOT_ASSERTED',
      explanation:
        'A live protected endpoint was observed, but authentication is required. This is not a validation pass or failure.',
    };
  }

  if (observation.httpStatus === null || observation.authStatus === 'UNAVAILABLE_FROM_RUNTIME') {
    return {
      service: observation.service,
      transportState: 'UNAVAILABLE',
      resultState: 'NOT_ASSERTED',
      explanation: 'The service result was not observable from the current runtime.',
    };
  }

  return {
    service: observation.service,
    transportState: 'OBSERVED',
    resultState: 'NOT_ASSERTED',
    explanation:
      `HTTP ${observation.httpStatus} was observed. Transport success alone does not establish semantic validation, OISS acceptance, or archive outcome.`,
  };
}

export function cometCompanionBoundaryIsPreserved(): boolean {
  const mutationEndpoints = OFFICIAL_COMET_CONTRACT.filter(
    (endpoint) => endpoint.category === 'WRITE_OUT_OF_SCOPE'
  );
  const inScopeMutations = OFFICIAL_COMET_CONTRACT.filter(
    (endpoint) =>
      endpoint.scopeStatus === 'IN_SCOPE_OBSERVATION' &&
      (endpoint.path === '/metadata/import' || endpoint.method === 'PUT')
  );

  return (
    COMET_COMPANION_FLOW.join('>') === 'PULL>INSPECT>READINESS>COMPARE>REOBSERVE' &&
    mutationEndpoints.some((endpoint) => endpoint.path === '/metadata/import') &&
    mutationEndpoints.some((endpoint) => endpoint.method === 'PUT') &&
    mutationEndpoints.every((endpoint) => endpoint.scopeStatus === 'OUT_OF_SCOPE_MUTATION') &&
    inScopeMutations.length === 0
  );
}

export function buildUniversalExpectedObserved(
  mission: UxSMission,
  inputs: NceiOperationalContractInputs = {}
): UniversalExpectedObserved[] {
  const items: UniversalExpectedObserved[] = [];
  const oneStopResult = compareDestinationWithCanonical(
    mission,
    inputs.oneStopObservation || null,
    'OneStop'
  );
  const cmrResult = compareDestinationWithCanonical(
    mission,
    inputs.cmrObservation || null,
    'CMR'
  );

  const addDestination = (
    id: string,
    label: string,
    result: DestinationCompareResult,
    observation: DestinationObservation | null | undefined
  ) => {
    items.push({
      id,
      scope: 'DESTINATION',
      targetKey: result.destination,
      label,
      expected: {
        canonicalRef: `mission:${mission.id}`,
        title: mission.title,
        platform: mission.platform.name,
        temporalRange: { start: mission.dateStart, end: mission.dateEnd },
      },
      observed: observation?.observedSummary || observation?.data,
      state: result.state,
      authority: result.destination,
      observedAt: observation?.observedAt,
      freshness: result.freshness,
      rationale:
        'Destination state is an observation about an external system and is not a canonical mission update.',
      evidenceRefs: observation?.evidenceRefs,
      canonicalRef: `mission:${mission.id}`,
    });
  };

  addDestination('xo:onestop', 'Canonical ↔ OneStop / OSIM', oneStopResult, inputs.oneStopObservation);
  addDestination('xo:cmr', 'Canonical ↔ NOAA CMR', cmrResult, inputs.cmrObservation);

  const fileComparisons: FileComparisonItem[] = compareFileInventories(
    inputs.expectedFiles || [],
    inputs.observedFiles || []
  );

  fileComparisons.forEach((comparison) => {
    items.push({
      id: `xo:file:${comparison.logicalFileKey}`,
      scope: 'FILES',
      targetKey: comparison.logicalFileKey,
      label: comparison.filename,
      expected: comparison.expected
        ? {
            logicalFileKey: comparison.expected.logicalFileKey,
            filename: comparison.expected.filename,
            version: comparison.expected.version,
            checksum: comparison.expected.expectedChecksum,
            canonicalRef: comparison.expected.canonicalRef,
          }
        : undefined,
      observed: comparison.observed
        ? {
            logicalFileKey: comparison.observed.logicalFileKey,
            filename: comparison.observed.filename,
            physicalIdentity: comparison.observed.physicalIdentity,
            fileVersionIdentity: comparison.observed.fileVersionIdentity,
            version: comparison.observed.version,
            checksum: comparison.observed.checksum,
            canonicalRef: comparison.observed.canonicalRef,
          }
        : undefined,
      state: comparison.state,
      authority: comparison.observed?.observedBy || 'MANTAS package preflight',
      observedAt: comparison.observed?.observedAt,
      rationale: comparison.notes,
      sourceRef: comparison.observed?.sourceRef || comparison.expected?.sourceRef,
      canonicalRef: comparison.expected?.canonicalRef || comparison.observed?.canonicalRef,
    });
  });

  const oissReadiness = evaluateOissHandoffProfile(mission, inputs.oissContext);
  items.push({
    id: 'xo:oiss:external-outcome',
    scope: 'OISS_DEPLOYMENT',
    targetKey: oissReadiness.packageId,
    label: 'MANTAS OISS handoff readiness ↔ OISS external outcome',
    expected: oissReadiness.overallState,
    observed: undefined,
    state: 'NOT_TESTED',
    authority: 'OISS',
    freshness: 'UNKNOWN',
    rationale:
      'MANTAS may evaluate local OISS_HANDOFF readiness. OISS validation/execution and archive/discovery outcomes remain unobserved until evidence comes back from those authorities.',
    evidenceRefs: oissReadiness.rules.flatMap((rule) => rule.evidenceRefs),
    canonicalRef: `mission:${mission.id}`,
  });

  return items;
}

export function destinationComparisonIsEvidenceOnly(
  mission: UxSMission,
  oneStopObservation: DestinationObservation | null,
  cmrObservation: DestinationObservation | null
): boolean {
  const before = JSON.stringify(mission);

  if (oneStopObservation && cmrObservation) {
    destinationReconciliationService.reconcileDestinations(
      oneStopObservation,
      cmrObservation,
      mission
    );
  } else {
    compareDestinationWithCanonical(mission, oneStopObservation, 'OneStop');
    compareDestinationWithCanonical(mission, cmrObservation, 'CMR');
  }

  const after = JSON.stringify(mission);
  return before === after;
}

export function buildNceiOperationalContractGateReport(
  mission: UxSMission,
  inputs: NceiOperationalContractInputs = {}
): NceiOperationalContractGateReport {
  const oneStop = inputs.oneStopObservation || null;
  const cmr = inputs.cmrObservation || null;
  const cometObservations = inputs.cometObservations || [];
  const expectedFiles = inputs.expectedFiles || [];
  const observedFiles = inputs.observedFiles || [];

  const oneStopResult = compareDestinationWithCanonical(mission, oneStop, 'OneStop');
  const cmrResult = compareDestinationWithCanonical(mission, cmr, 'CMR');
  const oiss = evaluateOissHandoffProfile(mission, inputs.oissContext);
  const universal = buildUniversalExpectedObserved(mission, inputs);
  const identityTuples = buildFileVersionIdentityTuples(mission, expectedFiles, observedFiles);

  const testObservation = oneStop || cmr;
  const freshnessInvalidationWorks = testObservation
    ? invalidateDestinationObservationAfterCanonicalChange(
        testObservation,
        new Date(Date.parse(testObservation.observedAt) + 1000).toISOString()
      )?.freshness === 'STALE'
    : true;

  const destinationCompareImplemented =
    Boolean(oneStopResult.destination) &&
    Boolean(cmrResult.destination) &&
    Array.isArray(oneStopResult.differences) &&
    Array.isArray(cmrResult.differences);

  const oissRuleBacked =
    oiss.rules.length > 0 &&
    oiss.rules.every(
      (rule) =>
        Boolean(rule.authority) &&
        Boolean(rule.ruleGrounding) &&
        Array.isArray(rule.evidenceRefs) &&
        rule.evidenceRefs.some((ref) => ref.startsWith('contract:'))
    );

  const oissExternalOutcomesGated =
    oiss.externalExecutionAllowed === false &&
    EXTERNAL_OISS_OUTCOMES.every((outcome) => oiss.doesNotProve.includes(outcome));

  const expectedObservedUniversal =
    universal.some((item) => item.scope === 'DESTINATION') &&
    universal.some((item) => item.scope === 'OISS_DEPLOYMENT') &&
    (expectedFiles.length === 0 || universal.some((item) => item.scope === 'FILES'));

  const authorityFirstClass =
    [oneStop, cmr].filter(Boolean).every((observation) => Boolean(observation?.authority)) &&
    OFFICIAL_AUTHORITY_RECEIPTS.every((receipt) => Boolean(receipt.authority));

  const doesNotProvePersists =
    oiss.doesNotProve.length >= EXTERNAL_OISS_OUTCOMES.length &&
    OFFICIAL_AUTHORITY_RECEIPTS.every(
      (receipt: ScopedReceipt) => Array.isArray(receipt.doesNotProve) && receipt.doesNotProve.length > 0
    );

  const evidenceOnly = destinationComparisonIsEvidenceOnly(mission, oneStop, cmr);

  const gates = {
    DESTINATION_COMPARE_IMPLEMENTED: destinationCompareImplemented,
    COMET_COMPANION_BOUNDARY_PRESERVED: cometCompanionBoundaryIsPreserved(),
    OISS_HANDOFF_RULE_BACKED: oissRuleBacked,
    OISS_EXTERNAL_OUTCOMES_GATED: oissExternalOutcomesGated,
    FILE_VERSION_IDENTITY_MODELED:
      expectedFiles.length > 0 && fileVersionIdentityModelIsSeparated(identityTuples),
    EXPECTED_OBSERVED_UNIVERSAL: expectedObservedUniversal,
    AUTHORITY_FIRST_CLASS: authorityFirstClass,
    FRESHNESS_INVALIDATION_WORKS: freshnessInvalidationWorks,
    DOES_NOT_PROVE_PERSISTS: doesNotProvePersists,
    DESTINATION_OBSERVATIONS_ARE_EVIDENCE: evidenceOnly,
    DESTINATION_OBSERVATIONS_ARE_CANONICAL: false,
  };

  const failures = Object.entries(gates)
    .filter(([name, passed]) => name !== 'DESTINATION_OBSERVATIONS_ARE_CANONICAL' && !passed)
    .map(([name]) => name);

  return {
    generatedAt: new Date().toISOString(),
    gates,
    modes: {
      ONESTOP_MODE: deriveOperationalEvidenceMode([oneStop]),
      CMR_MODE: deriveOperationalEvidenceMode([cmr]),
      COMET_MODE: deriveOperationalEvidenceMode(cometObservations),
    },
    counts: {
      universalComparisons: universal.length,
      scopedReceipts: OFFICIAL_AUTHORITY_RECEIPTS.length,
      fileIdentityTuples: identityTuples.length,
      oissRules: oiss.rules.length,
    },
    failures,
  };
}
