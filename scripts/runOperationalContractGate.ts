import { EN2501_MISSION } from '../src/data/missions';
import {
  EN2501_EXPECTED_FILES,
  EN2501_OBSERVED_FILES,
} from '../src/data/packageInventory';
import {
  SEED_CMR_OBSERVATION,
  SEED_ONESTOP_OBSERVATION,
} from '../src/services/destinationReconciliationService';
import {
  buildNceiOperationalContractGateReport,
  interpretCometObservation,
} from '../src/services/nceiOperationalContractService';
import { compareOperationalDestinationWithCanonical } from '../src/services/destinationOperationalInterpreter';
import { evaluateOissHandoffProfile } from '../src/services/oissHandoffService';
import { runQaJurisdictionTests } from '../src/services/qaJurisdictionTest';
import { DestinationObservation, ExternalServiceObservation } from '../src/types';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const cometFixture: ExternalServiceObservation = {
  id: 'fixture:comet:validate',
  service: 'POST /recordServices/validate',
  authority: 'NOAA CoMET',
  upstreamEndpoint: 'https://data.noaa.gov/cedit/recordServices/validate',
  requestArtifactHash: 'sha256:fixture-request',
  responseArtifactHash: 'sha256:fixture-response',
  timestamp: '2026-09-09T00:00:00Z',
  httpStatus: 200,
  result: 'SYNTHETIC_FIXTURE: validation result intentionally not interpreted as live NOAA PASS',
  provenanceType: 'SYNTHETIC_FIXTURE',
  authStatus: 'AUTHENTICATED',
};

const oissFixtureContext = {
  packageId: 'PKG:FIXTURE:EN2501',
  expectedFiles: EN2501_EXPECTED_FILES,
  observedFiles: EN2501_OBSERVED_FILES,
  fileObservationPerformed: true,
  processTemplateIri: 'fixture:ppmt:uuv-process-template',
  routingPrefix: 'fixture:oiss/en2501',
  routingEvidenceRefs: ['fixture:routing-context'],
  routingGrounding: 'PROVISIONAL' as const,
  signalEvaluationPerformed: true,
  blockingSignalCount: 0,
  signalEvidenceRefs: ['fixture:signal-evaluation'],
  restrictionDispositionObserved: true,
  restrictionDisposition: 'PUBLIC' as const,
  restrictionEvidenceRefs: ['fixture:submission-disposition'],
  restrictionGrounding: 'PROVISIONAL' as const,
};

const report = buildNceiOperationalContractGateReport(EN2501_MISSION, {
  oneStopObservation: SEED_ONESTOP_OBSERVATION,
  cmrObservation: SEED_CMR_OBSERVATION,
  cometObservations: [cometFixture],
  expectedFiles: EN2501_EXPECTED_FILES,
  observedFiles: EN2501_OBSERVED_FILES,
  oissContext: oissFixtureContext,
});

Object.entries(report.gates).forEach(([gate, passed]) => {
  if (gate === 'DESTINATION_OBSERVATIONS_ARE_CANONICAL') {
    console.log(`${gate}=${passed ? 'YES' : 'NO'}`);
    assert(passed === false, `${gate} must remain NO`);
    return;
  }

  console.log(`${gate}=${passed ? 'YES' : 'NO'}`);
  assert(passed, `${gate} failed`);
});

console.log(`ONESTOP_MODE=${report.modes.ONESTOP_MODE}`);
console.log(`CMR_MODE=${report.modes.CMR_MODE}`);
console.log(`COMET_MODE=${report.modes.COMET_MODE}`);

assert(report.modes.ONESTOP_MODE === 'FIXTURE', 'OneStop fixture must be labeled FIXTURE');
assert(report.modes.CMR_MODE === 'FIXTURE', 'CMR fixture must be labeled FIXTURE');
assert(report.modes.COMET_MODE === 'FIXTURE', 'CoMET fixture must be labeled FIXTURE');

// Record-level Destination Compare state contract.
const recordStates: DestinationObservation['state'][] = [
  'MISSING',
  'EXTRA',
  'NOT_TESTED',
  'UNVERIFIABLE',
];

recordStates.forEach((state) => {
  const observation: DestinationObservation = {
    ...SEED_ONESTOP_OBSERVATION,
    id: `fixture:state:${state}`,
    state,
  };
  const result = compareOperationalDestinationWithCanonical(
    EN2501_MISSION,
    observation,
    'OneStop'
  );
  assert(result.state === state, `Destination state ${state} was collapsed to ${result.state}`);
});

const staleObservation: DestinationObservation = {
  ...SEED_ONESTOP_OBSERVATION,
  id: 'fixture:state:STALE',
  freshness: 'STALE',
  state: 'STALE',
};
assert(
  compareOperationalDestinationWithCanonical(
    EN2501_MISSION,
    staleObservation,
    'OneStop'
  ).state === 'STALE',
  'STALE destination state must be preserved'
);

// A 302 is an authentication/transport observation, never a validation verdict.
const authRedirect: ExternalServiceObservation = {
  id: 'live:comet:302',
  service: 'POST /recordServices/validate',
  authority: 'NOAA CoMET',
  upstreamEndpoint: 'https://data.noaa.gov/cedit/recordServices/validate',
  requestArtifactHash: 'sha256:test',
  timestamp: '2026-09-09T00:00:00Z',
  httpStatus: 302,
  result: 'CAS redirect',
  provenanceType: 'LIVE_OBSERVED',
  authStatus: 'AUTH_REQUIRED',
};
const authInterpretation = interpretCometObservation(authRedirect);
assert(authInterpretation.transportState === 'AUTH_REQUIRED', 'HTTP 302 must mean AUTH_REQUIRED');
assert(authInterpretation.resultState === 'NOT_ASSERTED', 'HTTP 302 must not become PASS/FAIL');

const transport200: ExternalServiceObservation = {
  ...authRedirect,
  id: 'live:comet:200',
  httpStatus: 200,
  authStatus: 'AUTHENTICATED',
  result: 'HTTP 200 transport response',
};
const transportInterpretation = interpretCometObservation(transport200);
assert(transportInterpretation.transportState === 'OBSERVED', 'HTTP 200 transport should be OBSERVED');
assert(
  transportInterpretation.resultState === 'NOT_ASSERTED',
  'HTTP 200 transport alone must not become semantic validation PASS'
);

// Default OISS evaluation is intentionally incomplete when runtime evidence is absent.
const unobservedOiss = evaluateOissHandoffProfile(EN2501_MISSION);
assert(unobservedOiss.overallState === 'NOT_TESTED', 'OISS must be NOT_TESTED without runtime package context');
assert(unobservedOiss.externalExecutionAllowed === false, 'MANTAS must never locally authorize OISS execution');

// A fully supplied fixture can exercise the local readiness path, but external outcomes remain gated.
const fixtureOiss = evaluateOissHandoffProfile(EN2501_MISSION, oissFixtureContext);
assert(fixtureOiss.overallState === 'OISS_HANDOFF_READY', 'Fixture should exercise local OISS_HANDOFF_READY path');
assert(fixtureOiss.externalExecutionAllowed === false, 'Local readiness must not imply OISS execution');
['OISS_VALIDATED', 'OISS_EXECUTED', 'ARCHIVED', 'ACCESSIBLE', 'DISCOVERABLE'].forEach((boundary) => {
  assert(fixtureOiss.doesNotProve.includes(boundary), `Missing OISS doesNotProve boundary: ${boundary}`);
});

const qa = runQaJurisdictionTests(EN2501_MISSION, {
  oneStopObservation: SEED_ONESTOP_OBSERVATION,
  cmrObservation: SEED_CMR_OBSERVATION,
  oissContext: oissFixtureContext,
});
assert(qa.allPassed, `QA jurisdiction suite failed: ${qa.results.filter((result) => !result.passed).map((result) => result.invariantName).join(', ')}`);

console.log(`UNIVERSAL_COMPARISONS=${report.counts.universalComparisons}`);
console.log(`OISS_RULES=${report.counts.oissRules}`);
console.log('TEST=PASS');
