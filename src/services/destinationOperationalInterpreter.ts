import {
  DestinationCompareResult,
  DestinationObservation,
  UxSMission,
} from '../types';
import { compareDestinationWithCanonical } from './destinationReconciliationService';

const RECORD_LEVEL_STATES = new Set([
  'MISSING',
  'EXTRA',
  'NOT_TESTED',
  'UNVERIFIABLE',
]);

/**
 * Apply record-level destination states before semantic field comparison.
 *
 * MATCH/MISMATCH are computed from comparable observed content. MISSING, EXTRA,
 * NOT_TESTED, UNVERIFIABLE, and STALE describe the observation itself and must
 * not be collapsed into a generic mismatch.
 */
export function compareOperationalDestinationWithCanonical(
  mission: UxSMission,
  observation: DestinationObservation | null,
  destination: 'OneStop' | 'CMR'
): DestinationCompareResult {
  if (!observation) {
    return compareDestinationWithCanonical(mission, null, destination);
  }

  if (observation.freshness === 'STALE' || observation.state === 'STALE') {
    return {
      destination,
      sourceSystem: observation.sourceSystem,
      recordIdentifier: observation.recordIdentifier,
      state: 'STALE',
      freshness: 'STALE',
      observedAt: observation.observedAt,
      responseHash: observation.responseHash,
      differences: [],
      testedFieldsCount: 0,
      matchedFieldsCount: 0,
      provenanceType: observation.provenanceType,
    };
  }

  if (RECORD_LEVEL_STATES.has(observation.state)) {
    return {
      destination,
      sourceSystem: observation.sourceSystem,
      recordIdentifier: observation.recordIdentifier,
      state: observation.state,
      freshness: observation.freshness,
      observedAt: observation.observedAt,
      responseHash: observation.responseHash,
      differences: [],
      testedFieldsCount: 0,
      matchedFieldsCount: 0,
      provenanceType: observation.provenanceType,
    };
  }

  return compareDestinationWithCanonical(mission, observation, destination);
}
