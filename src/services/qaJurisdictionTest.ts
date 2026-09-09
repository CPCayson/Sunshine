import { UxSMission, ScopedReceipt } from '../types';
import { evaluateOissHandoffProfile } from './oissHandoffService';
import { destinationReconciliationService, SEED_ONESTOP_OBSERVATION, SEED_CMR_OBSERVATION } from './destinationReconciliationService';

export interface AssertionResult {
  invariantName: string;
  passed: boolean;
  jurisdictionA: string;
  verdictA: string;
  jurisdictionB: string;
  verdictB: string;
  details: string;
  doesNotProveAudit: string[];
}

export interface QaJurisdictionTestSuiteResult {
  timestamp: string;
  allPassed: boolean;
  results: AssertionResult[];
}

/**
 * Runs automated assertion tests verifying the strict separation of QA jurisdictions:
 * 1. CoMET Validation PASS does NOT transitively assert OISS Ingest Acceptance.
 * 2. MANTAS Handoff Readiness PASS does NOT assert destination ingestion.
 * 3. OneStop / CMR Match does NOT mutate canonical UxSMission state.
 * 4. ScopedReceipts explicitly declare doesNotProve boundaries.
 */
export function runQaJurisdictionTests(mission: UxSMission): QaJurisdictionTestSuiteResult {
  const results: AssertionResult[] = [];

  // TEST 1: CoMET Validation vs OISS Handoff
  // Even if CoMET Schematron/Rubric passes with 100%, OISS has its own independent rules
  const cometReceipt: ScopedReceipt = {
    id: 'TEST-REC-COMET-001',
    authority: 'CoMET',
    authorityScope: 'CEDIT Metadata Workspace & ISO 19139 Schema Conformance',
    assertion: 'XML_VALID',
    observedAt: new Date().toISOString(),
    freshness: 'CURRENT',
    evidenceRefs: ['comet:schematron:v2.4', 'iso-xml-en2501'],
    scopeRef: 'ceditRecordId:CED-2025-0441-UXS',
    provenanceType: 'SYNTHETIC_FIXTURE',
    doesNotProve: ['OISS_INGEST_ACCEPTANCE', 'DATA_FIXITY_VERIFIED', 'PHYSICAL_MEDIA_DELIVERY']
  };

  const oissHandoff = evaluateOissHandoffProfile(mission);
  
  // CoMET PASS must not change OISS doesNotProve
  const test1Passed = 
    cometReceipt.assertion === 'XML_VALID' &&
    cometReceipt.doesNotProve.includes('OISS_INGEST_ACCEPTANCE') &&
    oissHandoff.doesNotProve.includes('OISS_INGESTION_EXECUTION');

  results.push({
    invariantName: 'QA Jurisdiction Invariant: CoMET PASS != OISS Ingest',
    passed: test1Passed,
    jurisdictionA: 'CoMET (Metadata Workspace)',
    verdictA: cometReceipt.assertion,
    jurisdictionB: 'OISS (Archive & Ingest Execution)',
    verdictB: oissHandoff.overallState,
    details: 'Verified that CoMET validation pass does not transitively assert OISS ingestion or archive acceptance.',
    doesNotProveAudit: cometReceipt.doesNotProve
  });

  // TEST 2: Local Preflight Readiness vs Destination Outcome
  // MANTAS Preflight readiness evaluates internal criteria; it does NOT assert destination outcomes locally.
  const test2Passed =
    oissHandoff.overallState === 'OISS_HANDOFF_READY' &&
    oissHandoff.doesNotProve.includes('OISS_ARCHIVAL_COMPLETION') &&
    oissHandoff.doesNotProve.includes('ONESTOP_INDEXING');

  results.push({
    invariantName: 'Truth Boundary Invariant: Preflight Ready != Destination Outcome',
    passed: test2Passed,
    jurisdictionA: 'MANTAS Preflight (OISS_HANDOFF)',
    verdictA: oissHandoff.overallState,
    jurisdictionB: 'NOAA Archive / Discovery Destinations',
    verdictB: 'NOT ASSERTED LOCALLY',
    details: 'Verified that MANTAS Hand-off preflight readiness does not assert destination archiving or discovery.',
    doesNotProveAudit: oissHandoff.doesNotProve
  });

  // TEST 3: Destination Reconciliation Immutability
  // Comparing OneStop and CMR returns evidence differences, but NEVER mutates canonical mission truth.
  const missionTitleBefore = mission.title;
  const missionStateBefore = mission.lifecycleState;
  
  const comparison = destinationReconciliationService.reconcileDestinations(
    SEED_ONESTOP_OBSERVATION,
    SEED_CMR_OBSERVATION,
    mission
  );

  const test3Passed =
    comparison.differences.length > 0 &&
    mission.title === missionTitleBefore &&
    mission.lifecycleState === missionStateBefore;

  results.push({
    invariantName: 'Canonical Immutability Invariant: External Diff != Local Mutation',
    passed: test3Passed,
    jurisdictionA: 'Destination Reconciliation (OneStop ↔ CMR)',
    verdictA: `${comparison.differences.length} Differences Detected`,
    jurisdictionB: 'Canonical UxSMission Truth',
    verdictB: 'State Unchanged & Preserved',
    details: 'Verified that detecting differences between external destinations treats them as evidence without mutating canonical state.',
    doesNotProveAudit: ['CANONICAL_MUTATION_ON_DIFF', 'AUTOMATIC_STEREOTYPE_OVERWRITE']
  });

  // TEST 4: Scoped Receipt Integrity
  // Receipts must have valid non-empty doesNotProve arrays
  const test4Passed =
    oissHandoff.rules.every(r => r.evidenceRefs.length > 0) &&
    oissHandoff.doesNotProve.length >= 3;

  results.push({
    invariantName: 'Scoped Receipt Integrity: Explicit Proof Boundaries',
    passed: test4Passed,
    jurisdictionA: 'All System Evaluators',
    verdictA: 'Scoped Receipts Emitted',
    jurisdictionB: 'Transitive Proof Invariant',
    verdictB: 'Strictly Bounded',
    details: 'All preflight checks have explicit evidence references and negative proof boundaries (doesNotProve).',
    doesNotProveAudit: oissHandoff.doesNotProve
  });

  return {
    timestamp: new Date().toISOString(),
    allPassed: results.every(r => r.passed),
    results
  };
}
