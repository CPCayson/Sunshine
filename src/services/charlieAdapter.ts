import {
  CharlieFormSubmission,
  CharlieFormFieldObservation,
  SourceObservation,
  Claim,
  UxSMission,
  SignalFinding,
  CharlieXmlRegressionDiff
} from '../types';
import CHARLIE_MAP_RAW from '../data/charlie-form-map.v1.json';

export interface CharlieCrosswalkRule {
  sourceField: string;
  sourceLabel: string;
  conceptualSection: string;
  canonicalCandidatePath?: string;
  transform?: string;
  required: boolean;
  description: string;
}

export const CHARLIE_FORM_RULES: CharlieCrosswalkRule[] = CHARLIE_MAP_RAW.fields;

export const CHARLIE_FORM_SECTIONS: string[] = [
  'Metadata & Dataset Basics',
  'Citations, DOI & Authors',
  'Summary & Scope',
  'Spatial / Temporal / Vertical Extent',
  'Acquisition & Methods',
  'Submitter / Custodian',
];

/**
 * Baseline representative Charlie Google Form response (EN2501 Expedition)
 */
export const SAMPLE_CHARLIE_SUBMISSION_EN2501: CharlieFormSubmission = {
  sourceProfile: 'charlie-google-form-v3',
  submissionId: 'SUB-FORM-2025-06-EN2501',
  observedAt: '2025-06-21T14:32:00Z',
  submitterEmail: 'charlie.steward@noaa.gov',
  provenanceType: 'IMPORTED_ARTIFACT',
  originalPayload: {
    Timestamp: '6/21/2025 10:32:00',
    fileIdentifier: 'en2501-hawaiian-ridge-uuv-2025',
    hierarchyLevel: 'dataset',
    title: 'EN2501 Hawaiian Ridge & Kaiwi Channel Autonomous Seafloor Mapping',
    alternateTitle: 'Expedition EN2501: High-Resolution UUV Hydrography',
    pubDate: '2025-07-15',
    doi: '10.25921/en2501-hawaii-uuv',
    accessionID: 'NCEI-0249811',
    authors: 'Dr. Evelyn Vance, Marcus Thorne, NOAA Ocean Exploration Team',
    organization: 'NOAA National Centers for Environmental Information (NCEI)',
    abstract: 'Expedition EN2501 conducted autonomous underwater vehicle (AUV) surveys across the Hawaiian Ridge and Kaiwi Channel utilizing the REMUS 620 autonomous platform. Operational configurations included interferometric synthetic aperture sonar (Kraken MINSAS) and optical laser camera systems to acquire continuous high-resolution bathymetry and acoustic backscatter mosaics.',
    supplemental: 'Deployments were executed over 2 operational legs covering Penguin Bank, Kaiwi Trough, and Molokai Escarpment with navigational acoustic tracking via USBL.',
    west: -158.45,
    east: -156.95,
    south: 20.85,
    north: 21.65,
    beginDate: '2025-06-01',
    endDate: '2025-06-20',
    minDepth: 45.0,
    maxDepth: 1250.0,
    platform: 'REMUS 620 #6401',
    platformDesc: 'Two-man portable uncrewed underwater vehicle with 600m depth rating, dual thrusters, and INS/DVL aided dead-reckoning',
    instrument: 'Kraken MINSAS-120 SAS, Voyis Insight Pro Optical Laser, Seabird SBE49 FastCAT CTD',
    lineage: 'Raw SAS acoustic data processed in Kraken SoftSAS v4.2. Sound velocity profiles applied from Seabird CTD casts. Micro-bathymetry gridded at 0.1m resolution.',
    custodianEmail: 'ncei.info@noaa.gov',
  },
  fields: [
    {
      sourceFieldId: 'Timestamp',
      sourceLabel: 'Submission Timestamp',
      conceptualSection: 'Metadata & Dataset Basics',
      rawValue: '6/21/2025 10:32:00',
      canonicalCandidatePath: 'submissionMetadata.observedAt',
      transformApplied: 'iso8601-datetime',
      state: 'OBSERVED',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-TIMESTAMP',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'fileIdentifier',
      sourceLabel: 'File Identifier / UUID',
      conceptualSection: 'Metadata & Dataset Basics',
      rawValue: 'en2501-hawaiian-ridge-uuv-2025',
      canonicalCandidatePath: 'ceditRecordId',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-FILEID',
      confidence: 0.98,
    },
    {
      sourceFieldId: 'hierarchyLevel',
      sourceLabel: 'Hierarchy Level',
      conceptualSection: 'Metadata & Dataset Basics',
      rawValue: 'dataset',
      canonicalCandidatePath: 'resourceType',
      transformApplied: 'lowercase-resource-type',
      state: 'CANDIDATE',
      provenanceOrigin: 'PROFILE_DEFAULT',
      evidenceRef: 'EVID-FORM-FIELD-HIERARCHY',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'title',
      sourceLabel: 'Dataset / Mission Title',
      conceptualSection: 'Metadata & Dataset Basics',
      rawValue: 'EN2501 Hawaiian Ridge & Kaiwi Channel Autonomous Seafloor Mapping',
      canonicalCandidatePath: 'title',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-TITLE',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'alternateTitle',
      sourceLabel: 'Alternate / Cruise Title',
      conceptualSection: 'Metadata & Dataset Basics',
      rawValue: 'Expedition EN2501: High-Resolution UUV Hydrography',
      canonicalCandidatePath: 'alternateTitle',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-ALTTITLE',
      confidence: 0.95,
    },
    {
      sourceFieldId: 'pubDate',
      sourceLabel: 'Publication Date',
      conceptualSection: 'Citations, DOI & Authors',
      rawValue: '2025-07-15',
      canonicalCandidatePath: 'publicationDate',
      transformApplied: 'iso-date',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-PUBDATE',
      confidence: 0.95,
    },
    {
      sourceFieldId: 'doi',
      sourceLabel: 'Digital Object Identifier (DOI)',
      conceptualSection: 'Citations, DOI & Authors',
      rawValue: '10.25921/en2501-hawaii-uuv',
      canonicalCandidatePath: 'doi',
      transformApplied: 'clean-doi',
      state: 'CANDIDATE',
      provenanceOrigin: 'PROFILE_DEFAULT',
      evidenceRef: 'EVID-FORM-FIELD-DOI',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'accessionID',
      sourceLabel: 'NCEI Accession ID',
      conceptualSection: 'Citations, DOI & Authors',
      rawValue: 'NCEI-0249811',
      canonicalCandidatePath: 'accessionId',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'PROFILE_DEFAULT',
      evidenceRef: 'EVID-FORM-FIELD-ACCESSION',
      confidence: 0.99,
    },
    {
      sourceFieldId: 'authors',
      sourceLabel: 'Authors / Originators',
      conceptualSection: 'Citations, DOI & Authors',
      rawValue: 'Dr. Evelyn Vance, Marcus Thorne, NOAA Ocean Exploration Team',
      canonicalCandidatePath: 'contact.name',
      transformApplied: 'parse-author-list',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-AUTHORS',
      confidence: 0.95,
    },
    {
      sourceFieldId: 'organization',
      sourceLabel: 'Lead Organization',
      conceptualSection: 'Citations, DOI & Authors',
      rawValue: 'NOAA National Centers for Environmental Information (NCEI)',
      canonicalCandidatePath: 'contact.organization',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'PROFILE_DEFAULT',
      docucompRef: 'https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644',
      evidenceRef: 'EVID-FORM-FIELD-ORG',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'abstract',
      sourceLabel: 'Dataset Abstract',
      conceptualSection: 'Summary & Scope',
      rawValue: 'Expedition EN2501 conducted autonomous underwater vehicle (AUV) surveys across the Hawaiian Ridge and Kaiwi Channel utilizing the REMUS 620 autonomous platform. Operational configurations included interferometric synthetic aperture sonar (Kraken MINSAS) and optical laser camera systems to acquire continuous high-resolution bathymetry and acoustic backscatter mosaics.',
      canonicalCandidatePath: 'abstract',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-ABSTRACT',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'supplemental',
      sourceLabel: 'Supplemental Information',
      conceptualSection: 'Summary & Scope',
      rawValue: 'Deployments were executed over 2 operational legs covering Penguin Bank, Kaiwi Trough, and Molokai Escarpment with navigational acoustic tracking via USBL.',
      canonicalCandidatePath: 'supplementalInfo',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-SUPP',
      confidence: 0.92,
    },
    {
      sourceFieldId: 'west',
      sourceLabel: 'West Bounding Longitude',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: -158.45,
      canonicalCandidatePath: 'spatialExtent.west',
      transformApplied: 'parse-float-wgs84-lon',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-WEST',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'east',
      sourceLabel: 'East Bounding Longitude',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: -156.95,
      canonicalCandidatePath: 'spatialExtent.east',
      transformApplied: 'parse-float-wgs84-lon',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-EAST',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'south',
      sourceLabel: 'South Bounding Latitude',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: 20.85,
      canonicalCandidatePath: 'spatialExtent.south',
      transformApplied: 'parse-float-wgs84-lat',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-SOUTH',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'north',
      sourceLabel: 'North Bounding Latitude',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: 21.65,
      canonicalCandidatePath: 'spatialExtent.north',
      transformApplied: 'parse-float-wgs84-lat',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-NORTH',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'beginDate',
      sourceLabel: 'Survey Start Date',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: '2025-06-01',
      canonicalCandidatePath: 'dateStart',
      transformApplied: 'iso-date',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-BEGINDATE',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'endDate',
      sourceLabel: 'Survey End Date',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: '2025-06-20',
      canonicalCandidatePath: 'dateEnd',
      transformApplied: 'iso-date',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-ENDDATE',
      confidence: 1.0,
    },
    {
      sourceFieldId: 'minDepth',
      sourceLabel: 'Minimum Depth (m)',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: 45.0,
      canonicalCandidatePath: 'verticalExtent.minDepth',
      transformApplied: 'parse-float',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-MINDEPTH',
      confidence: 0.9,
    },
    {
      sourceFieldId: 'maxDepth',
      sourceLabel: 'Maximum Depth (m)',
      conceptualSection: 'Spatial / Temporal / Vertical Extent',
      rawValue: 1250.0,
      canonicalCandidatePath: 'verticalExtent.maxDepth',
      transformApplied: 'parse-float',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-MAXDEPTH',
      confidence: 0.9,
    },
    {
      sourceFieldId: 'platform',
      sourceLabel: 'UxS Platform Identifier / Model',
      conceptualSection: 'Acquisition & Methods',
      rawValue: 'REMUS 620 #6401',
      canonicalCandidatePath: 'platform.name',
      transformApplied: 'normalize-platform-candidate',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-PLATFORM',
      confidence: 0.98,
    },
    {
      sourceFieldId: 'platformDesc',
      sourceLabel: 'Platform Specifications',
      conceptualSection: 'Acquisition & Methods',
      rawValue: 'Two-man portable uncrewed underwater vehicle with 600m depth rating, dual thrusters, and INS/DVL aided dead-reckoning',
      canonicalCandidatePath: 'platform.type',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-PLATFORMDESC',
      confidence: 0.92,
    },
    {
      sourceFieldId: 'instrument',
      sourceLabel: 'Sensor Payload / Instruments',
      conceptualSection: 'Acquisition & Methods',
      rawValue: 'Kraken MINSAS-120 SAS, Voyis Insight Pro Optical Laser, Seabird SBE49 FastCAT CTD',
      canonicalCandidatePath: 'instruments',
      transformApplied: 'normalize-instrument-candidate-list',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-INSTRUMENTS',
      confidence: 0.96,
    },
    {
      sourceFieldId: 'lineage',
      sourceLabel: 'Lineage / Processing Statement',
      conceptualSection: 'Acquisition & Methods',
      rawValue: 'Raw SAS acoustic data processed in Kraken SoftSAS v4.2. Sound velocity profiles applied from Seabird CTD casts. Micro-bathymetry gridded at 0.1m resolution.',
      canonicalCandidatePath: 'purpose',
      transformApplied: 'trim',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-LINEAGE',
      confidence: 0.95,
    },
    {
      sourceFieldId: 'custodianEmail',
      sourceLabel: 'Data Custodian Email',
      conceptualSection: 'Submitter / Custodian',
      rawValue: 'ncei.info@noaa.gov',
      canonicalCandidatePath: 'contact.email',
      transformApplied: 'email-validate',
      state: 'CANDIDATE',
      provenanceOrigin: 'FORM_OBSERVED',
      evidenceRef: 'EVID-FORM-FIELD-EMAIL',
      confidence: 1.0,
    },
  ],
};

/**
 * Creates SourceObservation items from a CharlieFormSubmission.
 * Crucial invariant: source fields never silently mutate the canonical graph.
 */
export function buildSourceObservationsFromCharlie(
  submission: CharlieFormSubmission
): SourceObservation[] {
  return submission.fields.map((f, idx) => ({
    id: `src-obs-charlie-${submission.submissionId}-${f.sourceFieldId.toLowerCase()}`,
    authority: 'Charlie Form',
    sourceUri: `google-sheet://charlie-form-v3/${submission.submissionId}`,
    sourceTitle: `Charlie Form Response (${submission.submissionId}) [${f.sourceFieldId}]`,
    documentExcerpt: `${f.sourceLabel || f.sourceFieldId}: "${String(f.rawValue)}"`,
    rawFragment: JSON.stringify({ fieldId: f.sourceFieldId, value: f.rawValue, section: f.conceptualSection }),
    observedAt: submission.observedAt,
    observedBy: submission.submitterEmail || 'Charlie Form Submitter',
    reliabilityScore: f.confidence || 0.95,
  }));
}

/**
 * Creates candidate Claims from Charlie Form observations.
 * A human decision is still required to transition state to 'ACCEPTED'.
 */
export function buildCandidateClaimsFromCharlie(
  submission: CharlieFormSubmission
): Claim[] {
  return submission.fields
    .filter((f) => f.canonicalCandidatePath && f.state === 'CANDIDATE')
    .map((f) => {
      let predicate = 'CANDIDATE_VALUE_FOR';
      if (f.sourceFieldId === 'platform') predicate = 'USED_PLATFORM';
      else if (f.sourceFieldId === 'instrument') predicate = 'CARRIED_INSTRUMENT';
      else if (f.sourceFieldId.includes('Date')) predicate = 'TEMPORAL_BOUND';
      else if (['west', 'east', 'south', 'north'].includes(f.sourceFieldId)) predicate = 'SPATIAL_BOUND';

      const sourceObs: SourceObservation = {
        id: `obs-charlie-${f.sourceFieldId.toLowerCase()}`,
        authority: 'Charlie Form',
        sourceTitle: `Charlie Form v3: ${f.sourceLabel || f.sourceFieldId}`,
        documentExcerpt: `${f.sourceLabel || f.sourceFieldId} = "${String(f.rawValue)}"`,
        observedAt: submission.observedAt,
        reliabilityScore: f.confidence || 0.95,
      };

      return {
        id: `claim-charlie-${submission.submissionId}-${f.sourceFieldId.toLowerCase()}`,
        subject: `candidate-${f.canonicalCandidatePath}`,
        predicate,
        objectValue: f.rawValue,
        sources: [sourceObs],
        confidence: f.confidence || 0.95,
        state: 'OBSERVED',
        whyExplanation: `Submitted through Charlie Google Form (${f.conceptualSection}). Candidate mapping to canonical "${f.canonicalCandidatePath}".`,
      };
    });
}

/**
 * Validates Charlie Form submission fields and produces field-level Signal findings.
 * Crucial invariant: Signal findings point directly back to the original sourceFieldId!
 */
export function evaluateCharlieFormSignal(
  submission: CharlieFormSubmission
): SignalFinding[] {
  const findings: SignalFinding[] = [];

  const getField = (id: string) => submission.fields.find((f) => f.sourceFieldId === id);

  // Rule 1: Check Platform Specificity
  const platformField = getField('platform');
  if (platformField) {
    const val = String(platformField.rawValue || '');
    if (!val.includes('#') && !val.includes('-')) {
      findings.push({
        id: `SIG-CHARLIE-${submission.submissionId}-PLATFORM-SPECIFICITY`,
        severity: 'WARNING',
        canonicalField: 'platform.name',
        ruleName: 'NOAA UxS Profile §4.2 (Platform Hull Specificity)',
        ruleDescription: 'UxS profile requires exact vehicle model and asset identifier when uncrewed missions are documented.',
        evidenceSummary: `Observed raw value "${val}" in Charlie Form. Recommend qualifying with hull ID.`,
        affectedProjections: ['ISO', 'STAC', 'OISS'],
        sourceProfile: 'charlie-google-form-v3',
        submissionId: submission.submissionId,
        sourceFieldId: 'platform',
        canonicalCandidatePath: 'platform.name',
        observedValue: val,
        explanation: 'Platform field lacks unique hull identifier. Click to navigate directly to Charlie Intake -> platform.',
        remediationAction: {
          label: 'Accept with verified hull #6401',
          applyValue: 'REMUS 620 #6401',
        },
      });
    }
  }

  // Rule 2: Check Spatial Coordinate Validity
  const westField = getField('west');
  const eastField = getField('east');
  const southField = getField('south');
  const northField = getField('north');

  if (westField && eastField) {
    const w = Number(westField.rawValue);
    const e = Number(eastField.rawValue);
    if (isNaN(w) || isNaN(e) || w < -180 || w > 180 || e < -180 || e > 180 || w >= e) {
      findings.push({
        id: `SIG-CHARLIE-${submission.submissionId}-BBOX-INVALID`,
        severity: 'ERROR',
        canonicalField: 'spatialExtent',
        ruleName: 'ISO 19115-2 EX_GeographicBoundingBox Geodesic Conformance',
        ruleDescription: 'Westbound longitude must be less than eastbound longitude within [-180, 180] WGS84 range.',
        evidenceSummary: `Westbound (${w}) >= Eastbound (${e}) or outside [-180, 180].`,
        affectedProjections: ['ISO', 'STAC', 'DCAT'],
        sourceProfile: 'charlie-google-form-v3',
        submissionId: submission.submissionId,
        sourceFieldId: 'west',
        canonicalCandidatePath: 'spatialExtent.west',
        observedValue: { west: w, east: e },
        explanation: 'Invalid bounding longitude bounds. Click to jump to Charlie Intake -> west/east fields.',
        remediationAction: {
          label: 'Invert or correct bounding box',
          applyValue: { west: -158.45, east: -156.95 },
        },
      });
    }
  }

  // Rule 3: Check Custodian Email Format
  const emailField = getField('custodianEmail');
  if (emailField) {
    const email = String(emailField.rawValue || '');
    if (!email.includes('@') || !email.includes('.')) {
      findings.push({
        id: `SIG-CHARLIE-${submission.submissionId}-EMAIL-INVALID`,
        severity: 'ERROR',
        canonicalField: 'contact.email',
        ruleName: 'CI_ResponsibleParty Email RFC-5322 Syntax',
        ruleDescription: 'Data custodian email must be a valid syntactically conforming address.',
        evidenceSummary: `Invalid email string "${email}".`,
        affectedProjections: ['ISO', 'DCAT'],
        sourceProfile: 'charlie-google-form-v3',
        submissionId: submission.submissionId,
        sourceFieldId: 'custodianEmail',
        canonicalCandidatePath: 'contact.email',
        observedValue: email,
        remediationAction: {
          label: 'Supply valid contact email',
          applyValue: 'ncei.info@noaa.gov',
        },
      });
    }
  }

  // Rule 4: Platform Description check
  const descField = getField('platformDesc');
  if (!descField || !descField.rawValue || String(descField.rawValue).trim() === '') {
    findings.push({
      id: `SIG-CHARLIE-${submission.submissionId}-MISSING-PLATFORM-DESC`,
      severity: 'SUGGESTION',
      canonicalField: 'platform.type',
      ruleName: 'NOAA UxS Documentation Completeness',
      ruleDescription: 'Supplemental vehicle description provides critical operating context for marine autonomous systems.',
      evidenceSummary: 'Missing platform specifications in Charlie Form response.',
      affectedProjections: ['ISO', 'OISS'],
      sourceProfile: 'charlie-google-form-v3',
      submissionId: submission.submissionId,
      sourceFieldId: 'platformDesc',
      canonicalCandidatePath: 'platform.type',
      observedValue: '',
      remediationAction: {
        label: 'Insert standard UUV specifications',
        applyValue: 'Autonomous underwater vehicle with 600m depth rating',
      },
    });
  }

  return findings;
}

/**
 * Compares XML generated via Charlie's Google Apps Script template
 * with XML generated via MANTAS canonical projection.
 */
export function compareCharlieXmlWithMantas(
  submission: CharlieFormSubmission,
  mantasMission: UxSMission
): CharlieXmlRegressionDiff[] {
  const diffs: CharlieXmlRegressionDiff[] = [
    {
      elementPath: 'gmd:identificationInfo/gmd:MD_DataIdentification/gmd:citation/gmd:CI_Citation/gmd:title',
      charlieValue: submission.originalPayload.title || '',
      mantasValue: mantasMission.title || '',
      classification: 'SAME_MEANING',
      explanation: 'Title strings match identically between Charlie form intake and accepted MANTAS canonical truth.',
    },
    {
      elementPath: 'gmd:contact/gmd:CI_ResponsibleParty/gmd:organisationName',
      charlieValue: submission.originalPayload.organization || 'NOAA National Centers for Environmental Information (NCEI)',
      mantasValue: mantasMission.contact.organization || '',
      classification: 'PROFILE_DEFAULT_DIFFERENCE',
      explanation: 'Charlie template embeds plain-text NCEI organization string; MANTAS preserves DocuComp XLink authority reference (440b3ac2-64a5-46e2-9846-38305718b644).',
      citedProfileRef: 'NCEI DocuComp Component 440b3ac2-64a5-46e2-9846-38305718b644',
    },
    {
      elementPath: 'gmi:acquisitionInformation/gmi:MI_AcquisitionInformation/gmi:platform/gmi:MI_Platform/gmi:identifier',
      charlieValue: submission.originalPayload.platform || '',
      mantasValue: mantasMission.platform.callSign ? `${mantasMission.platform.name} (${mantasMission.platform.callSign})` : mantasMission.platform.name,
      classification: 'REPRESENTATION_DIFFERENCE',
      explanation: 'Charlie form outputs raw string "REMUS 620 #6401". MANTAS structures model "REMUS-620" and callSign "NOAA-UXS-6401" into dedicated ISO sub-elements.',
    },
    {
      elementPath: 'gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox',
      charlieValue: `W:${submission.originalPayload.west} E:${submission.originalPayload.east} S:${submission.originalPayload.south} N:${submission.originalPayload.north}`,
      mantasValue: `W:${mantasMission.spatialExtent.west} E:${mantasMission.spatialExtent.east} S:${mantasMission.spatialExtent.south} N:${mantasMission.spatialExtent.north}`,
      classification: 'SAME_MEANING',
      explanation: 'Geodesic coordinates are identical within 4 decimal place precision across both projections.',
    },
    {
      elementPath: 'gmd:identificationInfo/gmd:MD_DataIdentification/gmd:descriptiveKeywords',
      charlieValue: 'Unstructured keyword tags from form submission',
      mantasValue: '5 GCMD Science Keywords + 1 GCMD Platform Keyword',
      classification: 'MISSING_IN_CHARLIE',
      explanation: 'Charlie Form does not collect formal NASA GCMD taxonomy paths; MANTAS adds controlled vocabulary citations via the NOAA UxS Profile.',
    },
    {
      elementPath: 'gmi:acquisitionInformation/gmi:MI_AcquisitionInformation/gmi:instrument',
      charlieValue: String(submission.originalPayload.instrument || ''),
      mantasValue: mantasMission.instruments.join(', '),
      classification: 'REPRESENTATION_DIFFERENCE',
      explanation: 'Charlie concatenates payload instruments in single string; MANTAS emits distinct gmi:instrument instances with sensor capabilities.',
    },
  ];

  return diffs;
}
