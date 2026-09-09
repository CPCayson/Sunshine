import {
  ExpectedFile,
  ObservedFile,
  OissHandoffReadiness,
  OissHandoffRule,
  UxSMission,
} from '../types';
import { compareFileInventories } from '../data/packageInventory';

/**
 * Runtime evidence supplied to the local OISS_HANDOFF readiness evaluator.
 *
 * Important: none of these fields are inferred from a demo mission. If an
 * observation was not actually supplied, the corresponding rule is NOT_TESTED.
 */
export interface OissHandoffEvaluationContext {
  packageId?: string;

  expectedFiles?: ExpectedFile[];
  observedFiles?: ObservedFile[];
  fileObservationPerformed?: boolean;

  processTemplateIri?: string;
  routingPrefix?: string;
  routingEvidenceRefs?: string[];
  routingGrounding?: 'AUTHORITATIVE_DOCUMENTED' | 'PROVISIONAL' | 'UNRESOLVED' | 'NOT_TESTED';

  signalEvaluationPerformed?: boolean;
  blockingSignalCount?: number;
  signalEvidenceRefs?: string[];

  restrictionDispositionObserved?: boolean;
  restrictionDisposition?: 'PUBLIC' | 'RESTRICTED' | 'UNKNOWN';
  restrictionEvidenceRefs?: string[];
  restrictionGrounding?: 'AUTHORITATIVE_DOCUMENTED' | 'PROVISIONAL' | 'UNRESOLVED' | 'NOT_TESTED';
}

const CONTRACT_REF = 'contract:ncei-operational:oiss-handoff';

const notTestedRule = (
  id: string,
  name: string,
  authority: OissHandoffRule['authority'],
  ruleGrounding: OissHandoffRule['ruleGrounding'],
  description: string,
  rationale: string,
  evidenceRefs: string[] = []
): OissHandoffRule => ({
  id,
  name,
  authority,
  ruleGrounding,
  description,
  status: 'NOT_TESTED',
  rationale,
  evidenceRefs: [CONTRACT_REF, ...evidenceRefs],
});

/**
 * Evaluate the MANTAS-local OISS_HANDOFF readiness profile.
 *
 * This function may assert only a local preflight state:
 *   OISS_HANDOFF_READY | OISS_HANDOFF_BLOCKED | NOT_TESTED
 *
 * It MUST NOT locally assert OISS validation, execution, archive acceptance,
 * access availability, or discovery availability. Those are external outcomes
 * that require observations from the corresponding authority.
 */
export function evaluateOissHandoffProfile(
  mission: UxSMission,
  context: OissHandoffEvaluationContext = {}
): OissHandoffReadiness {
  const packageId = context.packageId || `PKG:MANTAS:${mission.id}`;
  const rules: OissHandoffRule[] = [];

  // R1 — local canonical/package identity preflight.
  const stableIdentityPresent = Boolean(mission.id && (mission.doi || packageId));
  rules.push({
    id: 'OISS-R1-STABLE-IDENTITY',
    name: 'Stable Package & Dataset Object Identity',
    authority: 'PROVISIONAL_INTERNAL',
    ruleGrounding: 'PROVISIONAL',
    description:
      'MANTAS requires a stable mission/package identity before declaring a handoff package ready.',
    status: stableIdentityPresent ? 'PASS' : 'FAIL',
    rationale: stableIdentityPresent
      ? `Local identity is present: mission '${mission.id}', package '${packageId}'${mission.doi ? `, DOI '${mission.doi}'` : ''}.`
      : 'Mission/package identity is incomplete.',
    evidenceRefs: [CONTRACT_REF, `canonicalRef:mission:${mission.id || 'missing'}`, `packageRef:${packageId}`],
  });

  // R2 — expected vs observed package inventory. Never assume that fixture files
  // were observed unless the caller explicitly supplies them and marks the
  // observation step as performed.
  if (!context.fileObservationPerformed) {
    rules.push(
      notTestedRule(
        'OISS-R2-PACKAGE-INVENTORY',
        'Package File Inventory Verification',
        'PROVISIONAL_INTERNAL',
        'PROVISIONAL',
        'Compare the expected package inventory with an actually observed staging inventory.',
        'No package inventory observation was supplied.'
      )
    );
  } else {
    const comparisons = compareFileInventories(context.expectedFiles || [], context.observedFiles || []);
    const missingMandatoryFiles = comparisons.filter(
      (item) => item.state === 'MISSING' && item.expected?.mandatory
    );
    const mismatchedFiles = comparisons.filter((item) => item.state === 'MISMATCH');
    const hasExpectedInventory = (context.expectedFiles || []).length > 0;
    const passed = hasExpectedInventory && missingMandatoryFiles.length === 0 && mismatchedFiles.length === 0;

    rules.push({
      id: 'OISS-R2-PACKAGE-INVENTORY',
      name: 'Package File Inventory Verification',
      authority: 'PROVISIONAL_INTERNAL',
      ruleGrounding: 'PROVISIONAL',
      description:
        'Compare declared expected files with the observed staging inventory without treating either list as archive acceptance.',
      status: passed ? 'PASS' : 'FAIL',
      rationale: !hasExpectedInventory
        ? 'Package observation was performed but no expected inventory was supplied.'
        : passed
          ? `${comparisons.filter((item) => item.state === 'MATCH').length} declared file(s) matched the observed inventory; no mandatory file or version mismatch was detected.`
          : `Inventory differences remain: ${missingMandatoryFiles.length} missing mandatory file(s), ${mismatchedFiles.length} mismatch(es).`,
      evidenceRefs: [
        CONTRACT_REF,
        ...((context.expectedFiles || []).map((file) => file.sourceRef)),
        ...((context.observedFiles || []).map((file) => file.sourceRef)),
      ],
    });
  }

  // R3 — fixity. A syntactically plausible hash is not proof that it came from
  // a live source; provenance remains with the supplied observed file records.
  if (!context.fileObservationPerformed) {
    rules.push(
      notTestedRule(
        'OISS-R3-FIXITY-CHECKSUMS',
        'Cryptographic Fixity & Checksum Integrity',
        'PROVISIONAL_INTERNAL',
        'PROVISIONAL',
        'Observed package files must carry explicit checksum algorithm and checksum values.',
        'No observed file inventory was supplied.'
      )
    );
  } else {
    const observedFiles = context.observedFiles || [];
    const malformed = observedFiles.filter((file) => {
      if (file.algorithm === 'SHA-256') return !/^[a-f0-9]{64}$/i.test(file.checksum);
      if (file.algorithm === 'MD5') return !/^[a-f0-9]{32}$/i.test(file.checksum);
      return true;
    });
    const passed = observedFiles.length > 0 && malformed.length === 0;

    rules.push({
      id: 'OISS-R3-FIXITY-CHECKSUMS',
      name: 'Cryptographic Fixity & Checksum Integrity',
      authority: 'PROVISIONAL_INTERNAL',
      ruleGrounding: 'PROVISIONAL',
      description:
        'Every observed file must carry a checksum whose length matches the declared checksum algorithm.',
      status: passed ? 'PASS' : 'FAIL',
      rationale: passed
        ? `${observedFiles.length} observed file(s) carry syntactically valid checksum values.`
        : observedFiles.length === 0
          ? 'File observation was marked performed, but no observed files were supplied.'
          : `${malformed.length} observed file(s) have malformed checksum values.`,
      evidenceRefs: [CONTRACT_REF, ...observedFiles.map((file) => file.sourceRef)],
    });
  }

  // R4 — process-template/routing context. Do not invent a PPMT IRI or prefix.
  if (!context.processTemplateIri || !context.routingPrefix) {
    rules.push(
      notTestedRule(
        'OISS-R4-PROCESS-TEMPLATE-ROUTING',
        'Process-Template Routing Context',
        'PPMT_CONTEXT',
        context.routingGrounding || 'NOT_TESTED',
        'A process-template identifier and routing prefix must be supplied by the applicable operational context.',
        'Process-template and/or routing context has not been observed.',
        context.routingEvidenceRefs
      )
    );
  } else {
    rules.push({
      id: 'OISS-R4-PROCESS-TEMPLATE-ROUTING',
      name: 'Process-Template Routing Context',
      authority: 'PPMT_CONTEXT',
      ruleGrounding: context.routingGrounding || 'PROVISIONAL',
      description:
        'A process-template identifier and routing prefix are present for the local handoff package.',
      status: 'PASS',
      rationale: `Process template '${context.processTemplateIri}' and routing prefix '${context.routingPrefix}' were supplied to the evaluator.`,
      evidenceRefs: [CONTRACT_REF, ...(context.routingEvidenceRefs || [])],
    });
  }

  // R5 — projection readiness is a MANTAS-local state, not CoMET validation and
  // not OISS validation.
  const isoReady = mission.authorityStatuses?.isoState === 'READY';
  rules.push({
    id: 'OISS-R5-METADATA-PROJECTION-READY',
    name: 'Metadata Projection Ready',
    authority: 'PROVISIONAL_INTERNAL',
    ruleGrounding: 'PROVISIONAL',
    description:
      'The current MANTAS ISO projection must be locally ready before handoff. This does not assert CoMET or OISS validation.',
    status: isoReady ? 'PASS' : 'FAIL',
    rationale: isoReady
      ? 'MANTAS currently marks the ISO projection READY.'
      : `MANTAS ISO projection state is '${mission.authorityStatuses?.isoState || 'UNVERIFIED'}'.`,
    evidenceRefs: [CONTRACT_REF, `projectionRef:iso19115:${mission.id}`],
  });

  // R6 — Signal readiness. Never hard-code zero findings.
  if (!context.signalEvaluationPerformed || context.blockingSignalCount === undefined) {
    rules.push(
      notTestedRule(
        'OISS-R6-BLOCKING-SIGNALS',
        'Zero Blocking Signal Findings',
        'PROVISIONAL_INTERNAL',
        'PROVISIONAL',
        'No unresolved blocking Signal findings may remain in the local readiness scope.',
        'No current Signal evaluation result was supplied.',
        context.signalEvidenceRefs
      )
    );
  } else {
    rules.push({
      id: 'OISS-R6-BLOCKING-SIGNALS',
      name: 'Zero Blocking Signal Findings',
      authority: 'PROVISIONAL_INTERNAL',
      ruleGrounding: 'PROVISIONAL',
      description:
        'No unresolved blocking Signal findings may remain in the local readiness scope.',
      status: context.blockingSignalCount === 0 ? 'PASS' : 'FAIL',
      rationale:
        context.blockingSignalCount === 0
          ? 'The supplied Signal evaluation contains zero blocking findings.'
          : `${context.blockingSignalCount} blocking Signal finding(s) remain.`,
      evidenceRefs: [CONTRACT_REF, ...(context.signalEvidenceRefs || [])],
    });
  }

  // R7 — access/restriction disposition. Explicitly observed is sufficient for
  // the local package gate; it does not establish archive/publication outcome.
  if (!context.restrictionDispositionObserved || !context.restrictionDisposition || context.restrictionDisposition === 'UNKNOWN') {
    rules.push(
      notTestedRule(
        'OISS-R7-RESTRICTION-DISPOSITION',
        'Access / Restriction Disposition',
        'NCEI_SUBMISSION_AGREEMENT',
        context.restrictionGrounding || 'NOT_TESTED',
        'The handoff package must explicitly state its access/restriction disposition.',
        'No explicit access/restriction disposition was supplied.',
        context.restrictionEvidenceRefs
      )
    );
  } else {
    rules.push({
      id: 'OISS-R7-RESTRICTION-DISPOSITION',
      name: 'Access / Restriction Disposition',
      authority: 'NCEI_SUBMISSION_AGREEMENT',
      ruleGrounding: context.restrictionGrounding || 'PROVISIONAL',
      description:
        'The local package includes an explicit public/restricted disposition for routing and handling.',
      status: 'PASS',
      rationale: `Disposition supplied: ${context.restrictionDisposition}.`,
      evidenceRefs: [CONTRACT_REF, ...(context.restrictionEvidenceRefs || [])],
    });
  }

  const blockingReasons = rules
    .filter((rule) => rule.status === 'FAIL')
    .map((rule) => `${rule.name}: ${rule.rationale}`);
  const untestedRules = rules.filter((rule) => rule.status === 'NOT_TESTED');

  const overallState: OissHandoffReadiness['overallState'] =
    blockingReasons.length > 0
      ? 'OISS_HANDOFF_BLOCKED'
      : untestedRules.length > 0
        ? 'NOT_TESTED'
        : 'OISS_HANDOFF_READY';

  return {
    packageId,
    evaluationTimestamp: new Date().toISOString(),
    overallState,
    // Local readiness never authorizes or claims execution in OISS.
    externalExecutionAllowed: false,
    rules,
    blockingReasons,
    doesNotProve: [
      'OISS_VALIDATED',
      'OISS_EXECUTED',
      'ARCHIVED',
      'ACCESSIBLE',
      'DISCOVERABLE',
    ],
  };
}
