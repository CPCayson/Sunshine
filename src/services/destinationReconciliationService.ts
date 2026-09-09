import {
  UxSMission,
  DestinationObservation,
  DestinationCompareResult,
  SemanticDifference,
  DifferenceClass,
  ComparisonState,
  FreshnessState,
  ScopedReceipt
} from '../types';

/**
 * Fixture & live observation storage for OneStop/OSIM and NOAA CMR.
 * Maintains strict provenance: authority, observedAt, freshness, responseHash.
 */
export const SEED_ONESTOP_OBSERVATION: DestinationObservation = {
  id: 'DEST-OBS-ONESTOP-001',
  authority: 'OneStop',
  sourceSystem: 'NOAA OneStop / OSIM Elasticsearch API v2',
  observedAt: '2026-09-08T14:32:00Z',
  recordIdentifier: 'gov.noaa.ncei:EN2501-HAWAIIAN-RIDGE',
  canonicalRef: 'mission:EN2501',
  projectionRef: 'proj:iso19115:en2501',
  evidenceRefs: ['onestop:query:doi:10.25921/en2501-hawaii-uuv', 'es-doc-uuid:a782b1c4-9102'],
  responseHash: '6d91f82e5b41029a8c7b',
  freshness: 'CURRENT',
  provenanceType: 'SYNTHETIC_FIXTURE',
  state: 'MATCH',
  data: {
    title: 'EN250Hawaiian Ridge & Kaiwi Channel Autonomous Seafloor Mapping',
    platform: 'REMUS 620 Autonomous Underwater Vehicle',
    instruments: ['Kraken MINSAS SAS', 'Voyis Optical Camera & Laser', 'Seabird FastCAT CTD'],
    spatialBbox: [-158.45, 20.85, -156.95, 21.65],
    temporalRange: { start: '2025-06-01', end: '2025-06-20' },
    distributionLinks: ['https://data.noaa.gov/waf/NOAA/NESDIS/ncei/oer/iso/xml/EN2501.xml'],
    accessConstraints: 'None. Public Domain.'
  },
  observedSummary: {
    title: 'EN2501 Hawaiian Ridge & Kaiwi Channel Autonomous Seafloor Mapping',
    platform: 'REMUS 620 Autonomous Underwater Vehicle',
    instruments: ['Kraken MINSAS SAS', 'Voyis Optical Camera & Laser', 'Seabird FastCAT CTD'],
    spatialBbox: [-158.45, 20.85, -156.95, 21.65],
    temporalRange: { start: '2025-06-01', end: '2025-06-20' },
    distributionLinks: ['https://data.noaa.gov/waf/NOAA/NESDIS/ncei/oer/iso/xml/EN2501.xml'],
    accessConstraints: 'None. Public Domain.'
  }
};

export const SEED_CMR_OBSERVATION: DestinationObservation = {
  id: 'DEST-OBS-CMR-001',
  authority: 'CMR',
  sourceSystem: 'NASA/NOAA Common Metadata Repository (CMR) GraphQL Ingest Endpoint',
  observedAt: '2026-09-08T14:35:10Z',
  recordIdentifier: 'C1258902144-NOAA_NCEI',
  canonicalRef: 'mission:EN2501',
  projectionRef: 'proj:echo10:en2501',
  evidenceRefs: ['cmr:concept:C1258902144-NOAA_NCEI', 'cmr:granule-count:18'],
  responseHash: 'e4810a9cf29188d3170a',
  freshness: 'CURRENT',
  provenanceType: 'SYNTHETIC_FIXTURE',
  state: 'MISMATCH',
  data: {
    title: 'EN2501: High-Resolution UUV Hydrography & Benthic Characterization (Alternate Title Profile)',
    platform: 'REMUS 620',
    instruments: ['Kraken MINSAS SAS'], // Missing Voyis & Seabird keywords in CMR ECHO-10 payload
    spatialBbox: [-158.45, 20.85, -156.95, 21.65],
    temporalRange: { start: '2025-06-01', end: '2025-06-20' },
    distributionLinks: ['https://cmr.earthdata.nasa.gov/search/concepts/C1258902144-NOAA_NCEI'],
    accessConstraints: 'In Work / Preliminary Metadata'
  },
  observedSummary: {
    title: 'EN2501: High-Resolution UUV Hydrography & Benthic Characterization (Alternate Title Profile)',
    platform: 'REMUS 620',
    instruments: ['Kraken MINSAS SAS'],
    spatialBbox: [-158.45, 20.85, -156.95, 21.65],
    temporalRange: { start: '2025-06-01', end: '2025-06-20' },
    distributionLinks: ['https://cmr.earthdata.nasa.gov/search/concepts/C1258902144-NOAA_NCEI'],
    accessConstraints: 'In Work / Preliminary Metadata'
  }
};

/**
 * Compare an observed destination record against the canonical UxSMission.
 * Categorizes differences into semantic difference classes and traces back through Rosetta / canonicalRef.
 */
export function compareDestinationWithCanonical(
  mission: UxSMission,
  observation: DestinationObservation | null,
  destination: 'OneStop' | 'CMR'
): DestinationCompareResult {
  if (!observation) {
    return {
      destination,
      sourceSystem: destination === 'OneStop' ? 'NOAA OneStop / OSIM' : 'NOAA/NASA CMR',
      recordIdentifier: 'NOT_QUERIED',
      state: 'NOT_TESTED',
      freshness: 'UNKNOWN',
      observedAt: 'Never',
      differences: [],
      testedFieldsCount: 0,
      matchedFieldsCount: 0,
      provenanceType: 'NOT_IMPLEMENTED'
    };
  }

  const diffs: SemanticDifference[] = [];
  let testedFields = 0;
  let matchedFields = 0;

  const destKey = (destination || 'dest').toLowerCase();

  // 1. Title comparison
  testedFields++;
  const obsTitle = observation.observedSummary?.title || observation.data.title;
  if (obsTitle === mission.title) {
    matchedFields++;
  } else {
    diffs.push({
      id: `diff-${destKey}-title`,
      field: 'title',
      diffClass: 'TITLE',
      expectedValue: mission.title,
      observedValue: obsTitle,
      explanation: destination === 'CMR'
        ? 'CMR catalog record ingested the alternateTitle instead of the canonical title.'
        : 'Title differs slightly due to whitespace/character normalization.',
      canonicalRef: 'mission:' + mission.id + ':title',
      projectionRef: destination === 'OneStop' ? 'iso19115:gmd:title' : 'echo10:DataSetId',
      rosettaMappingRef: 'rosetta:iso-to-echo10:title',
      claimRef: 'claim-accepted-mission-title',
      evidenceRef: 'source:charlie-intake:col-2'
    });
  }

  // 2. Platform comparison
  testedFields++;
  const obsPlatform = observation.observedSummary?.platform || observation.data.platform;
  if (obsPlatform === mission.platform.name || obsPlatform?.includes(mission.platform.modelId || 'REMUS')) {
    matchedFields++;
  } else {
    diffs.push({
      id: `diff-${destKey}-platform`,
      field: 'platform',
      diffClass: 'PLATFORM',
      expectedValue: mission.platform.name,
      observedValue: obsPlatform,
      explanation: `Expected '${mission.platform.name}' but observed '${obsPlatform}'.`,
      canonicalRef: 'platform:' + mission.platform.modelId,
      rosettaMappingRef: 'rosetta:iso-to-stac:platform',
      claimRef: 'claim-conflict-hull'
    });
  }

  // 3. Instrument comparison
  testedFields++;
  const obsInstruments: string[] = observation.observedSummary?.instruments || observation.data.instruments || [];
  const missingInstruments = (mission.instruments || []).filter(
    inst => !obsInstruments.some(oi => (typeof oi === 'string' && typeof inst === 'string') && (oi.toLowerCase().includes(inst.toLowerCase()) || inst.toLowerCase().includes(oi.toLowerCase())))
  );

  if (missingInstruments.length === 0) {
    matchedFields++;
  } else {
    diffs.push({
      id: `diff-${destKey}-instruments`,
      field: 'instruments',
      diffClass: 'INSTRUMENT',
      expectedValue: mission.instruments,
      observedValue: obsInstruments,
      explanation: `${destination} metadata payload is missing ${missingInstruments.length} payload sensor(s): ${missingInstruments.join(', ')}.`,
      canonicalRef: 'payload:instruments',
      rosettaMappingRef: 'rosetta:iso-to-gcmd:instrument',
      claimRef: 'claim-payload-kraken-fastcat'
    });
  }

  // 4. Temporal comparison
  testedFields++;
  const obsTemp = observation.observedSummary?.temporalRange || observation.data.temporalRange;
  if (obsTemp && obsTemp.start === mission.dateStart && obsTemp.end === mission.dateEnd) {
    matchedFields++;
  } else {
    diffs.push({
      id: `diff-${destKey}-temporal`,
      field: 'temporalRange',
      diffClass: 'TEMPORAL',
      expectedValue: { start: mission.dateStart, end: mission.dateEnd },
      observedValue: obsTemp,
      explanation: 'Temporal boundary mismatch in destination harvest index.',
      canonicalRef: 'temporal:extent'
    });
  }

  // 5. Spatial comparison
  testedFields++;
  const obsBbox = observation.observedSummary?.spatialBbox || observation.data.spatialBbox;
  if (
    obsBbox &&
    Math.abs(obsBbox[0] - mission.spatialExtent.west) < 0.01 &&
    Math.abs(obsBbox[1] - mission.spatialExtent.south) < 0.01 &&
    Math.abs(obsBbox[2] - mission.spatialExtent.east) < 0.01 &&
    Math.abs(obsBbox[3] - mission.spatialExtent.north) < 0.01
  ) {
    matchedFields++;
  } else {
    diffs.push({
      id: `diff-${destKey}-spatial`,
      field: 'spatialBbox',
      diffClass: 'SPATIAL',
      expectedValue: [mission.spatialExtent.west, mission.spatialExtent.south, mission.spatialExtent.east, mission.spatialExtent.north],
      observedValue: obsBbox,
      explanation: 'Spatial bounding box delta detected.',
      canonicalRef: 'spatial:extent'
    });
  }

  // Overall State Computation
  let state: ComparisonState = 'MATCH';
  if (diffs.length > 0) {
    state = 'MISMATCH';
  }

  // If observation is stale, override
  if (observation.freshness === 'STALE') {
    state = 'STALE';
  }

  return {
    destination,
    sourceSystem: observation.sourceSystem,
    recordIdentifier: observation.recordIdentifier,
    state,
    freshness: observation.freshness,
    observedAt: observation.observedAt,
    responseHash: observation.responseHash,
    differences: diffs,
    testedFieldsCount: testedFields,
    matchedFieldsCount: matchedFields,
    provenanceType: observation.provenanceType
  };
}

/**
 * Authoritative receipts documenting the QA jurisdiction invariant:
 * One green light must NEVER transitively set another green light.
 */
export const OFFICIAL_AUTHORITY_RECEIPTS: ScopedReceipt[] = [
  {
    id: 'RCPT-COMET-001',
    authority: 'CoMET',
    authorityScope: 'CEDIT Metadata Workspace & ISO 19139 Schema Conformance',
    assertion: 'XML_VALID',
    observedAt: '2026-09-08T17:10:00Z',
    freshness: 'CURRENT',
    evidenceRefs: ['comet:record:CED-2025-0441-UXS', 'validator:schematron:v2'],
    scopeRef: 'ceditRecordId:CED-2025-0441-UXS',
    responseHash: 'a19b840e719c22e4',
    provenanceType: 'SYNTHETIC_FIXTURE',
    doesNotProve: [
      'OISS_ACCEPTED',
      'ARCHIVED',
      'DATA_QA_PASS',
      'ONESTOP_DISCOVERABLE',
      'CMR_HARVESTED'
    ]
  },
  {
    id: 'RCPT-R2R-001',
    authority: 'R2R',
    authorityScope: 'Rolling Deck to Repository (R2R) Data & File QA Pipeline',
    assertion: 'DATA_QA_SUPPORTED',
    observedAt: '2026-09-08T16:00:00Z',
    freshness: 'CURRENT',
    evidenceRefs: ['r2r:cruise:EN2501', 'r2r:qa-profile:sonar-raw'],
    scopeRef: 'packageRef:PKG:NCEI-OISS:EN2501-UUV-2025-01',
    responseHash: '772b11a9e883f019',
    provenanceType: 'SYNTHETIC_FIXTURE',
    doesNotProve: [
      'METADATA_SEMANTIC_CORRECTNESS',
      'COMET_VALIDATED',
      'OISS_ACCEPTED',
      'ARCHIVED'
    ]
  },
  {
    id: 'RCPT-OISS-001',
    authority: 'OISS',
    authorityScope: 'Ocean Ingest and Stewardship System (OISS) Package Processing',
    assertion: 'PROCESS_EXECUTED',
    observedAt: '2026-09-08T19:00:00Z',
    freshness: 'CURRENT',
    evidenceRefs: ['oiss:manifest:EN2501-2025-01', 'oiss:ingest-log:77189'],
    scopeRef: 'packageRef:PKG:NCEI-OISS:EN2501-UUV-2025-01',
    responseHash: '551e40a8319f072c',
    provenanceType: 'SYNTHETIC_FIXTURE',
    doesNotProve: [
      'ONESTOP_DISCOVERABLE',
      'CMR_HARVESTED',
      'DATA_QA_PASS',
      'METADATA_SEMANTIC_CORRECTNESS'
    ]
  }
];

export interface ReconciliationComparisonResult {
  differences: Array<{
    dimension: string;
    diffClass: string;
    severity: 'INFO' | 'WARNING' | 'ERROR';
    impact: string;
    remediationRecommendation: string;
    leftValue: any;
    rightValue: any;
  }>;
}

export const destinationReconciliationService = {
  compareDestinationWithCanonical,
  reconcileDestinations: (
    oneStopObs: DestinationObservation,
    cmrObs: DestinationObservation,
    mission: UxSMission
  ): ReconciliationComparisonResult => {
    const oneStopRes = compareDestinationWithCanonical(mission, oneStopObs, 'OneStop');
    const cmrRes = compareDestinationWithCanonical(mission, cmrObs, 'CMR');

    const differences: ReconciliationComparisonResult['differences'] = [];

    // Title difference check
    const oneStopTitle = oneStopObs.observedSummary?.title || oneStopObs.data.title;
    const cmrTitle = cmrObs.observedSummary?.title || cmrObs.data.title;
    if (oneStopTitle !== cmrTitle) {
      differences.push({
        dimension: 'Title Discrepancy',
        diffClass: 'SEMANTIC_DISCREPANCY',
        severity: 'WARNING',
        impact: 'OneStop presents canonical cruise title while CMR indexes alternate title profile.',
        remediationRecommendation: 'Apply Rosetta title crosswalk to align ECHO-10 DataSetId with ISO title.',
        leftValue: oneStopTitle,
        rightValue: cmrTitle
      });
    }

    // Instruments difference check
    const oneStopInsts: string[] = oneStopObs.observedSummary?.instruments || oneStopObs.data.instruments || [];
    const cmrInsts: string[] = cmrObs.observedSummary?.instruments || cmrObs.data.instruments || [];
    if (oneStopInsts.length !== cmrInsts.length) {
      differences.push({
        dimension: 'Instrument Payload Coverage',
        diffClass: 'PARTIAL_HARVEST',
        severity: 'WARNING',
        impact: `OneStop indexes ${oneStopInsts.length} sensors; CMR harvested only ${cmrInsts.length} sensor(s).`,
        remediationRecommendation: 'Re-harvest ECHO-10 instrument keywords to include Voyis Laser and Seabird CTD.',
        leftValue: oneStopInsts,
        rightValue: cmrInsts
      });
    }

    return { differences };
  }
};

