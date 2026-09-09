import { DestinationObservation, ScopedReceipt, UxSMission } from '../types';
import { evaluateOissHandoffProfile, OissHandoffEvaluationContext } from './oissHandoffService';
import {
  destinationReconciliationService,
  SEED_ONESTOP_OBSERVATION,
  SEED_CMR_OBSERVATION,
} from './destinationReconciliationService';

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

export interface QaJurisdictionTestOptions {
  oneStopObservation?: DestinationObservation;
  cmrObservation?: DestinationObservation;
  oissContext?: OissHandoffEvaluationContext;
}

const REQUIRED_EXTERNAL_OISS_BOUNDARIES = [
  'OISS_VALIDATED',
  'OISS_EXECUTED',
  'ARCHIVED',
  'ACCESSIBLE',
  'DISCOVERABLE',
];

/**
 * Automated contract assertions for QA jurisdiction separation.
 *
 * These tests are about proof boundaries, not about making a demo green:
 * - a CoMET result does not become an OISS result;
 * - a local handoff-ready state does not become destination execution;
 * - destination observations remain evidence and do not mutate canonical truth;
 * - every scoped receipt carries explicit negative proof boundaries.
 */
export function runQaJurisdictionTests(
  mission: UxSMission,
  options: QaJurisdictionTestOptions = {}
): QaJurisdictionTestSuiteResult {
  const results: AssertionResult[] = [];
  const oneStopObservation = options.oneStopObservation || SEED_ONESTOP_OBSERVATION;
  const cmrObservation = options.cmrObservation || SEED_CMR_OBSERVATION;
  const oissHandoff = evaluateOissHandoffProfile(mission, options.oissContext);

  // TEST 1: CoMET validation scope must not transitively assert OISS outcomes.
  const cometReceipt: ScopedReceipt = {
    id: 'TEST-REC-COMET-001',
    authority: 'CoMET',
    authorityScope: 'CEDIT Metadata Workspace / ISO validation scope',
    assertion: 'XML_VALID_FIXTURE',
    observedAt: new Date().toISOString(),
    freshness: 'CURRENT',
    evidenceRefs: ['fixture:comet:xml-validation'],
    scopeRef: 'fixture:cedit-record',
    provenanceType: 'SYNTHETIC_FIXTURE',
    doesNotProve: [
      'OISS_VALIDATED',
      'OISS_EXECUTED',
      'ARCHIVED',
      'ACCESSIBLE',
      'DISCOVERABLE',
    ],
  };

  const test1Passed =
    cometReceipt.doesNotProve.includes('OISS_VALIDATED') &&
    cometReceipt.doesNotProve.includes('OISS_EXECUTED') &&
    REQUIRED_EXTERNAL_OISS_BOUNDARIES.every((boundary) =>
      oissHandoff.doesNotProve.includes(boundary)
    );

  results.push({
    invariantName: 'QA Jurisdiction: CoMET result != OISS result',
    passed: test1Passed,
    jurisdictionA: 'CoMET metadata / validation scope',
    verdictA: cometReceipt.assertion,
    jurisdictionB: 'OISS execution / archive scope',
    verdictB: 'NOT ASSERTED BY COMET',
    details:
      'A CoMET result remains scoped to CoMET. It cannot establish OISS validation, execution, archive, access, or discovery.',
    doesNotProveAudit: cometReceipt.doesNotProve,
  });

  // TEST 2: Local readiness can be READY, BLOCKED, or NOT_TESTED; none of those
  // states grants external execution or outcome authority.
  const test2Passed =
    oissHandoff.externalExecutionAllowed === false &&
    REQUIRED_EXTERNAL_OISS_BOUNDARIES.every((boundary) =>
      oissHandoff.doesNotProve.includes(boundary)
    );

  results.push({
    invariantName: 'Truth Boundary: OISS_HANDOFF readiness != destination outcome',
    passed: test2Passed,
    jurisdictionA: 'MANTAS local OISS_HANDOFF preflight',
    verdictA: oissHandoff.overallState,
    jurisdictionB: 'OISS / archive / access / discovery authorities',
    verdictB: 'EXTERNAL OUTCOME NOT ASSERTED',
    details:
      'The local preflight result never enables or fabricates OISS execution or downstream destination outcomes.',
    doesNotProveAudit: oissHandoff.doesNotProve,
  });

  // TEST 3: Destination reconciliation must not mutate canonical UxSMission.
  const canonicalBefore = JSON.stringify(mission);
  const comparison = destinationReconciliationService.reconcileDestinations(
    oneStopObservation,
    cmrObservation,
    mission
  );
  const canonicalAfter = JSON.stringify(mission);
  const test3Passed = canonicalBefore === canonicalAfter;

  results.push({
    invariantName: 'Canonical Immutability: destination observation != canonical mutation',
    passed: test3Passed,
    jurisdictionA: 'OneStop / CMR observations',
    verdictA: `${comparison.differences.length} destination difference(s) observed`,
    jurisdictionB: 'Canonical UxSMission',
    verdictB: test3Passed ? 'UNCHANGED' : 'MUTATED',
    details:
      'Destination comparison is evidence-only. Differences may trigger review but cannot silently overwrite canonical mission meaning.',
    doesNotProveAudit: ['CANONICAL_MUTATION', 'AUTOMATIC_EXTERNAL_OVERWRITE'],
  });

  // TEST 4: Every local readiness rule is explicitly grounded and the readiness
  // receipt retains negative proof boundaries.
  const test4Passed =
    oissHandoff.rules.length > 0 &&
    oissHandoff.rules.every(
      (rule) =>
        Boolean(rule.authority) &&
        Boolean(rule.ruleGrounding) &&
        rule.evidenceRefs.some((ref) => ref.startsWith('contract:'))
    ) &&
    oissHandoff.doesNotProve.length >= REQUIRED_EXTERNAL_OISS_BOUNDARIES.length;

  results.push({
    invariantName: 'Scoped Receipt Integrity: rule grounding + doesNotProve',
    passed: test4Passed,
    jurisdictionA: 'MANTAS operational-contract evaluator',
    verdictA: `${oissHandoff.rules.length} explicit rule(s)`,
    jurisdictionB: 'Transitive proof boundary',
    verdictB: 'BOUNDED',
    details:
      'Every OISS_HANDOFF rule has explicit authority/grounding and the resulting receipt states what it does not prove.',
    doesNotProveAudit: oissHandoff.doesNotProve,
  });

  return {
    timestamp: new Date().toISOString(),
    allPassed: results.every((result) => result.passed),
    results,
  };
}
