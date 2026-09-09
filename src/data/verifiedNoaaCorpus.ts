export type CorpusIdentityState = 'EXACT_SOURCE_MATCH' | 'STRONG_SOURCE_MATCH' | 'REVIEW';

export interface VerifiedUxSAssetRecord {
  id: string;
  platformClass: 'UUV' | 'USV' | 'Glider' | 'UAS' | 'Other';
  manufacturer: string;
  model: string;
  serialOrIdentifier?: string;
  cdNumber?: string;
  missionContext?: string;
  payloadEvidence?: string;
  physicalLocation?: string;
  acquisitionYear?: string;
  status?: string;
  identityState: CorpusIdentityState;
  identityBasis: string;
  confidence: number;
  sourceYears: number[];
  sourceArtifact: string;
  sourceRef: string;
  provenanceType: 'IMPORTED_ARTIFACT';
  supports: string[];
  doesNotProve: string[];
}

/**
 * Source-backed seed records from MANTAS_UxS_Fused_Evidence_Registry.xlsx.
 *
 * IMPORTANT:
 * - This is not a complete NOAA fleet inventory.
 * - Records are evidence observations, not automatic canonical truth.
 * - Mission/use and payload/version fields are preserved as source context.
 * - They do not establish a bounded deployment, actual sensor use on a dive,
 *   dataset production, OISS execution, archive acceptance, or discovery.
 */
export const VERIFIED_NOAA_UXS_CORPUS: VerifiedUxSAssetRecord[] = [
  {
    id: 'uxsa-remus620-6401',
    platformClass: 'UUV',
    manufacturer: 'HII',
    model: 'REMUS 620',
    serialOrIdentifier: '6401',
    missionContext: 'Ecosystem (DWH, NRDA, MDBC)',
    payloadEvidence: 'Kraken MINSAS (both), Voyis Recon LS (one)',
    physicalLocation: 'Panama City, FL',
    acquisitionYear: '2024',
    status: 'in use',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: '2026 current_source_row; 2025 manufacturer_model_serial',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-5E3066A8CDC1E2',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: [
      'A source-observed HII REMUS 620 physical asset identified as 6401',
      'A source-observed mission/use context for the asset',
      'Payload/version evidence mentioning Kraken MINSAS and Voyis Recon LS',
      'Current-source and historical identity evidence can be reconciled without erasing either observation',
    ],
    doesNotProve: [
      'A specific dive carried or operated either payload',
      'An instrument-instance serial number',
      'A dataset was produced by a named sensor instance',
      'OISS validation, archive acceptance, or discovery publication',
    ],
  },
  {
    id: 'uxsa-remus620-6402',
    platformClass: 'UUV',
    manufacturer: 'HII',
    model: 'REMUS 620',
    serialOrIdentifier: '6402',
    missionContext: 'Ecosystem (DWH, NRDA, MDBC)',
    payloadEvidence: 'Kraken MINSAS (both), Voyis Recon LS (one)',
    physicalLocation: 'Pocassett, MA',
    acquisitionYear: '2024',
    status: 'in use',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: '2026 current_source_row; 2025 manufacturer_model_serial',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-6C96F7D8CF13FF',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: [
      'A source-observed HII REMUS 620 physical asset identified as 6402',
      'A source-observed mission/use context for the asset',
      'Payload/version evidence mentioning Kraken MINSAS and Voyis Recon LS',
    ],
    doesNotProve: [
      'Which single Voyis Recon LS unit is associated with this hull',
      'A bounded mission deployment',
      'Actual sensor data lineage',
      'A destination-system outcome',
    ],
  },
  {
    id: 'uxsa-emily-2',
    platformClass: 'USV',
    manufacturer: 'Hydronalix',
    model: 'EMILY',
    serialOrIdentifier: '2',
    cdNumber: 'CD0004001623',
    missionContext: 'habitat mapping',
    physicalLocation: 'Honolulu, HI',
    acquisitionYear: '2012',
    status: 'not operational',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: 'exact_cd_number / current source row',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-88666EBA363436',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: ['Asset identity, model, manufacturer, CD number, status, location, and source-recorded mission/use context'],
    doesNotProve: ['A specific deployment', 'Payload configuration', 'Dataset production', 'Archive/discovery outcome'],
  },
  {
    id: 'uxsa-emily-5',
    platformClass: 'USV',
    manufacturer: 'Hydronalix',
    model: 'EMILY',
    serialOrIdentifier: '5',
    cdNumber: 'CD0004001626',
    missionContext: 'habitat mapping',
    physicalLocation: 'Honolulu, HI',
    acquisitionYear: '2012',
    status: 'not operational',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: 'exact_cd_number / current source row',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-1467ACB1F6EE20',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: ['Asset identity, model, manufacturer, CD number, status, location, and source-recorded mission/use context'],
    doesNotProve: ['A specific deployment', 'Payload configuration', 'Dataset production', 'Archive/discovery outcome'],
  },
  {
    id: 'uxsa-emily-9',
    platformClass: 'USV',
    manufacturer: 'Hydronalix',
    model: 'EMILY',
    serialOrIdentifier: '9',
    cdNumber: 'CD0004001630',
    missionContext: 'habitat mapping',
    physicalLocation: 'Honolulu, HI',
    acquisitionYear: '2012',
    status: 'not operational',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: 'exact_cd_number / current source row',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-D4E414D50DCCA4',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: ['Asset identity, model, manufacturer, CD number, status, location, and source-recorded mission/use context'],
    doesNotProve: ['A specific deployment', 'Payload configuration', 'Dataset production', 'Archive/discovery outcome'],
  },
  {
    id: 'uxsa-oceanscout-os1026',
    platformClass: 'Glider',
    manufacturer: 'Hefring',
    model: 'Oceanscout',
    serialOrIdentifier: 'OS1026',
    cdNumber: 'CD0004363476',
    missionContext: 'marine mammals, acoustics',
    physicalLocation: 'Woods Hole, MA',
    acquisitionYear: '2024',
    status: 'in use',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: 'exact_cd_number / current source row',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-6CF159962A4CA4',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: ['Asset identity and source-recorded mission/use context'],
    doesNotProve: ['A specific mission deployment', 'Instrument configuration', 'Dataset lineage'],
  },
  {
    id: 'uxsa-seabed-9',
    platformClass: 'UUV',
    manufacturer: 'SeaBED Tech',
    model: 'SeaBED',
    serialOrIdentifier: '9',
    missionContext: 'fisheries, untrawlable habitat',
    physicalLocation: 'Newport, OR',
    acquisitionYear: '2013',
    status: 'in use',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: '2026 current_source_row; 2025 manufacturer_model_serial',
    confidence: 1.0,
    sourceYears: [2025, 2026],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-5F6699FF50BE2C',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: ['Manufacturer/model/serial identity and source-recorded use context'],
    doesNotProve: ['A bounded deployment', 'Sensor instance relationships', 'Dataset lineage'],
  },
  {
    id: 'uxsa-iver2-580',
    platformClass: 'UUV',
    manufacturer: 'Iver',
    model: '2-580',
    cdNumber: 'CD0001718928',
    missionContext: 'habitat mapping',
    physicalLocation: 'Pascagoula, MS',
    status: 'in use',
    identityState: 'EXACT_SOURCE_MATCH',
    identityBasis: 'exact_cd_number',
    confidence: 1.0,
    sourceYears: [2025],
    sourceArtifact: 'MANTAS_UxS_Fused_Evidence_Registry.xlsx',
    sourceRef: 'UXSA-A591E1C1F12C92',
    provenanceType: 'IMPORTED_ARTIFACT',
    supports: ['A source-observed UUV asset record with CD-number identity and habitat-mapping context'],
    doesNotProve: ['Specific sensor payload', 'Specific deployment', 'Dataset production'],
  },
];

export const corpusSummary = {
  assetCount: VERIFIED_NOAA_UXS_CORPUS.length,
  classes: Array.from(new Set(VERIFIED_NOAA_UXS_CORPUS.map((r) => r.platformClass))),
  models: Array.from(new Set(VERIFIED_NOAA_UXS_CORPUS.map((r) => `${r.manufacturer} ${r.model}`))),
  sourceArtifacts: Array.from(new Set(VERIFIED_NOAA_UXS_CORPUS.map((r) => r.sourceArtifact))),
};

export const buildKnowledgeKeyCandidate = (record: VerifiedUxSAssetRecord): string => {
  const slug = `${record.manufacturer}-${record.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const id = (record.serialOrIdentifier || record.cdNumber || 'unresolved')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return `KK:physical-asset:${slug}:${id}`;
};
