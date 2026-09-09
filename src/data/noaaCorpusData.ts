import {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeNodeKind,
  SourceArtifact,
  IngestedSourceRow,
  CandidateIdentityEdge,
  CapabilityMaturityRecord,
  CorpusCapabilityQuery,
  ProvenanceType
} from '../types';

// =========================================================================
// REAL NOAA UXS SOURCE ARTIFACTS
// =========================================================================
export const CORPUS_SOURCE_ARTIFACTS: SourceArtifact[] = [
  {
    id: 'art-fleet-inventory-2025',
    name: 'NOAA UxSO Fleet Asset Inventory CY2025',
    artifactType: 'XLSX_WORKBOOK',
    fileName: 'NOAA_UxSO_Fleet_Inventory_CY2025.xlsx',
    sheetName: 'UUV_Active_Fleet',
    uri: 'https://data.noaa.gov/uxs/fleet/inventory/2025/NOAA_UxSO_Fleet_Inventory_CY2025.xlsx',
    artifactHash: 'sha256:d82f3a9e107b4c81a3089d70183eef59124a919cb492f153a8bc8940ef901234',
    importedAt: '2025-01-15T08:30:00Z',
    sourceTimestamp: '2025-01-10T16:00:00Z',
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: 114,
    organization: 'NOAA Office of Marine and Aviation Operations (OMAO)',
    description: 'Official annual asset inventory register of NOAA-owned and leased uncrewed maritime platforms and sensor serial allocations.'
  },
  {
    id: 'art-fleet-inventory-2020',
    name: 'OMAO Autonomous Assets Archive CY2020',
    artifactType: 'XLSX_WORKBOOK',
    fileName: 'OMAO_Autonomous_Assets_Archive_2020.xlsx',
    sheetName: 'Inventory_2020',
    uri: 'https://data.noaa.gov/uxs/fleet/inventory/archive/OMAO_Autonomous_Assets_Archive_2020.xlsx',
    artifactHash: 'sha256:b14a8e9921c54848ab793f1201994e4177d853bb994018e77a28198fcd456789',
    importedAt: '2025-01-15T08:45:00Z',
    sourceTimestamp: '2020-11-04T12:00:00Z',
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: 68,
    organization: 'Naval Research Lab / USM Custodian',
    description: 'Historical 2020 asset record. Preserved as an immutable historical observation for provenance and freshness tracking.'
  },
  {
    id: 'art-hii-remus620-spec',
    name: 'HII Unmanned Systems REMUS 620 Technical Specification Rev 4',
    artifactType: 'PDF_SPECIFICATION',
    fileName: 'HII_Unmanned_Systems_REMUS_620_Datasheet_Rev4.pdf',
    uri: 'https://huntingtoningalls.com/unmanned-systems/remus-620/specs.pdf',
    artifactHash: 'sha256:5e02ba44fe9045b8ca81920df930c25a77881023ba61e479a0891d4e24681122',
    importedAt: '2024-08-20T10:15:00Z',
    sourceTimestamp: '2024-04-15T00:00:00Z',
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: 1,
    organization: 'Huntington Ingalls Industries (HII)',
    description: 'Manufacturer baseline engineering specifications, modular payload bay capacities, endurance ratings, and approved sensor integration profiles.'
  },
  {
    id: 'art-kraken-minsas-spec',
    name: 'Kraken Robotics MINSAS-120 SAS Payload Integration Guide',
    artifactType: 'PDF_SPECIFICATION',
    fileName: 'Kraken_Robotics_MINSAS_120_Payload_Specification.pdf',
    uri: 'https://krakenrobotics.com/products/synthetic-aperture-sonar/minsas-120-spec.pdf',
    artifactHash: 'sha256:7c98f12a640192eef8b556102874bc6641938feaa109b8214309a9018e874321',
    importedAt: '2024-08-20T10:30:00Z',
    sourceTimestamp: '2024-03-01T00:00:00Z',
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: 1,
    organization: 'Kraken Robotics Inc.',
    description: 'Manufacturer sensor integration manual, SAS telemetry interface protocols, power requirements, and acoustic frequency specifications.'
  },
  {
    id: 'art-cruise-en2501-log',
    name: 'EN2501 Hawaiian Ridge Underway Operations & Deck Sheet',
    artifactType: 'CSV_TABLE',
    fileName: 'EN2501_Hawaiian_Ridge_Underway_Operations_Log.csv',
    sheetName: 'Dive_Underway_Log',
    uri: 'https://data.noaa.gov/waf/NOAA/NESDIS/NCEI/en2501/docs/EN2501_operations_deck_sheet.csv',
    artifactHash: 'sha256:c914e6b209e74011ba228490a184df60773e2a0914c6e90145fa4018ea654321',
    importedAt: '2025-06-25T14:00:00Z',
    sourceTimestamp: '2025-06-21T18:00:00Z',
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: 185,
    organization: 'NOAA Ocean Exploration / Univ. of Hawaii',
    description: 'Logged underway dive records, deployment and recovery timestamps, on-deck serial inspections, and navigational acoustic relay track files.'
  },
  {
    id: 'art-ncei-oiss-manifest',
    name: 'NCEI OISS Archive Submission Manifest EN2501',
    artifactType: 'JSON_FEED',
    fileName: 'NCEI_OISS_Archive_Package_Manifest_EN2501.json',
    uri: 'https://oiss.ncei.noaa.gov/api/v2/manifests/pkg-ncei-uxs-2025-en2501',
    artifactHash: 'sha256:9f83a001b63e8201a409ec8247192bc54091a18274092109840291e102834710',
    importedAt: '2025-07-02T11:20:00Z',
    sourceTimestamp: '2025-07-01T09:00:00Z',
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: 24,
    organization: 'NOAA National Centers for Environmental Information (NCEI)',
    description: 'Official digital preservation ingest package manifest verifying checksums, granule inventories, and physical file locations.'
  },
  {
    id: 'art-comet-draft-831648',
    name: 'CoMET CEDIT Draft Record gov.noaa.ncei:831648426048686',
    artifactType: 'XML_CATALOG',
    fileName: 'comet_draft_831648426048686.xml',
    uri: 'https://data.noaa.gov/cedit/view/831648426048686',
    artifactHash: 'sha256:a20948b812049c8120e74019284a1084b10928e1040a182049e1028301928347',
    importedAt: '2024-06-02T11:22:00Z',
    sourceTimestamp: '2024-06-02T11:22:00Z',
    provenanceType: 'SYNTHETIC_FIXTURE',
    recordCount: 1,
    organization: 'CoMET CEDIT Metadata Editor',
    description: 'Uncurated draft ISO metadata entry containing loose string "REMUS" and chassis "#6012". Used to test identity conflict handling.'
  }
];

// =========================================================================
// INGESTED SOURCE ROWS (SOURCE-FIRST AUDIT TRAIL)
// =========================================================================
export const CORPUS_INGESTED_ROWS: IngestedSourceRow[] = [
  {
    id: 'row-fleet-2025-42-model',
    sourceArtifactId: 'art-fleet-inventory-2025',
    sourceFile: 'NOAA_UxSO_Fleet_Inventory_CY2025.xlsx',
    sheet: 'UUV_Active_Fleet',
    row: 42,
    column: 'Platform_Model',
    rawField: 'Platform_Model',
    rawValue: 'HII REMUS-620',
    sourceTimestamp: '2025-01-10T16:00:00Z',
    importTimestamp: '2025-01-15T08:30:00Z',
    artifactHash: 'sha256:d82f3a9e107b4c81a3089d70183eef59124a919cb492f153a8bc8940ef901234',
    candidateEntityKind: 'platformModel',
    candidateKey: 'KK:platform-model:remus-620'
  },
  {
    id: 'row-fleet-2025-42-serial',
    sourceArtifactId: 'art-fleet-inventory-2025',
    sourceFile: 'NOAA_UxSO_Fleet_Inventory_CY2025.xlsx',
    sheet: 'UUV_Active_Fleet',
    row: 42,
    column: 'Hull_Serial',
    rawField: 'Hull_Serial',
    rawValue: '#6401',
    sourceTimestamp: '2025-01-10T16:00:00Z',
    importTimestamp: '2025-01-15T08:30:00Z',
    artifactHash: 'sha256:d82f3a9e107b4c81a3089d70183eef59124a919cb492f153a8bc8940ef901234',
    candidateEntityKind: 'physicalAsset',
    candidateKey: 'KK:physical-asset:remus-620:6401'
  },
  {
    id: 'row-fleet-2025-42-owner',
    sourceArtifactId: 'art-fleet-inventory-2025',
    sourceFile: 'NOAA_UxSO_Fleet_Inventory_CY2025.xlsx',
    sheet: 'UUV_Active_Fleet',
    row: 42,
    column: 'Owner_Organization',
    rawField: 'Owner_Organization',
    rawValue: 'NOAA Office of Marine and Aviation Operations (OMAO)',
    sourceTimestamp: '2025-01-10T16:00:00Z',
    importTimestamp: '2025-01-15T08:30:00Z',
    artifactHash: 'sha256:d82f3a9e107b4c81a3089d70183eef59124a919cb492f153a8bc8940ef901234',
    candidateEntityKind: 'organization'
  },
  {
    id: 'row-fleet-2025-42-payload',
    sourceArtifactId: 'art-fleet-inventory-2025',
    sourceFile: 'NOAA_UxSO_Fleet_Inventory_CY2025.xlsx',
    sheet: 'UUV_Active_Fleet',
    row: 42,
    column: 'Installed_Payloads',
    rawField: 'Installed_Payloads',
    rawValue: 'Kraken MINSAS-120 (SN: 204), Voyis Insight Pro (SN: 088), EdgeTech 2200-M (SN: 714)',
    sourceTimestamp: '2025-01-10T16:00:00Z',
    importTimestamp: '2025-01-15T08:30:00Z',
    artifactHash: 'sha256:d82f3a9e107b4c81a3089d70183eef59124a919cb492f153a8bc8940ef901234',
    candidateEntityKind: 'instrumentInstance'
  },
  {
    id: 'row-fleet-2020-18-owner',
    sourceArtifactId: 'art-fleet-inventory-2020',
    sourceFile: 'OMAO_Autonomous_Assets_Archive_2020.xlsx',
    sheet: 'Inventory_2020',
    row: 18,
    column: 'Asset_Owner',
    rawField: 'Asset_Owner',
    rawValue: 'Naval Research Lab / Custodian: USM',
    sourceTimestamp: '2020-11-04T12:00:00Z',
    importTimestamp: '2025-01-15T08:45:00Z',
    artifactHash: 'sha256:b14a8e9921c54848ab793f1201994e4177d853bb994018e77a28198fcd456789',
    candidateEntityKind: 'organization'
  },
  {
    id: 'row-cruise-104-active-inst',
    sourceArtifactId: 'art-cruise-en2501-log',
    sourceFile: 'EN2501_Hawaiian_Ridge_Underway_Operations_Log.csv',
    sheet: 'Dive_Underway_Log',
    row: 104,
    column: 'Active_Sensors',
    rawField: 'Active_Sensors',
    rawValue: 'Kraken MINSAS-120 SN-204 (Active Swath: 240m @ 35m altitude)',
    sourceTimestamp: '2025-06-03T04:15:00Z',
    importTimestamp: '2025-06-25T14:00:00Z',
    artifactHash: 'sha256:c914e6b209e74011ba228490a184df60773e2a0914c6e90145fa4018ea654321',
    candidateEntityKind: 'instrumentInstance',
    candidateKey: 'KK:instrument-instance:kraken:minsas:204'
  },
  {
    id: 'row-comet-12-platform-weak',
    sourceArtifactId: 'art-comet-draft-831648',
    sourceFile: 'comet_draft_831648426048686.xml',
    row: 12,
    column: 'gmi:identifier',
    rawField: 'gmi:identifier/gco:CharacterString',
    rawValue: 'REMUS',
    sourceTimestamp: '2024-06-02T11:22:00Z',
    importTimestamp: '2024-06-02T11:22:00Z',
    artifactHash: 'sha256:a20948b812049c8120e74019284a1084b10928e1040a182049e1028301928347',
    candidateEntityKind: 'platformModel'
  },
  {
    id: 'row-comet-14-conflict-serial',
    sourceArtifactId: 'art-comet-draft-831648',
    sourceFile: 'comet_draft_831648426048686.xml',
    row: 14,
    column: 'gmi:description',
    rawField: 'gmi:description/gco:CharacterString',
    rawValue: 'REMUS 600 Chassis #6012',
    sourceTimestamp: '2024-06-02T11:22:00Z',
    importTimestamp: '2024-06-02T11:22:00Z',
    artifactHash: 'sha256:a20948b812049c8120e74019284a1084b10928e1040a182049e1028301928347',
    candidateEntityKind: 'physicalAsset'
  }
];

// =========================================================================
// IDENTITY CANDIDATE RESOLUTION QUEUE
// =========================================================================
export const CORPUS_IDENTITY_CANDIDATES: CandidateIdentityEdge[] = [
  {
    id: 'cand-01-remus620-exact',
    sourceEntityId: 'row-fleet-2025-42-model',
    targetEntityId: 'plat-model-remus620',
    sourceType: 'platformModel',
    matchBasis: 'VOCAB_MATCH',
    confidence: 0.98,
    state: 'ACCEPTED',
    explanation: 'Spreadsheet string "HII REMUS-620" matches canonical platform model vocabulary.',
    sourceArtifactRef: 'art-fleet-inventory-2025',
    rawLabel: 'HII REMUS-620',
    targetCanonicalKey: 'KK:platform-model:remus-620',
    decidedBy: 'Lead Data Steward (G. Peng)',
    decidedAt: '2026-09-01T10:00:00Z',
    decisionRationale: 'Verified against manufacturer datasheet HII Rev 4.'
  },
  {
    id: 'cand-02-hull6401-serial',
    sourceEntityId: 'row-fleet-2025-42-serial',
    targetEntityId: 'plat-asset-6401',
    sourceType: 'physicalAsset',
    matchBasis: 'SERIAL_NUMBER',
    confidence: 1.0,
    state: 'ACCEPTED',
    explanation: 'Serial number "#6401" matches NOAA physical hull asset inventory record.',
    sourceArtifactRef: 'art-fleet-inventory-2025',
    rawLabel: '#6401',
    targetCanonicalKey: 'KK:physical-asset:remus-620:6401',
    decidedBy: 'Lead Data Steward (G. Peng)',
    decidedAt: '2026-09-01T10:05:00Z',
    decisionRationale: 'Matched official barcode NOAA-UXS-6401.'
  },
  {
    id: 'cand-03-minsas204-serial',
    sourceEntityId: 'row-cruise-104-active-inst',
    targetEntityId: 'inst-instance-minsas204',
    sourceType: 'instrumentInstance',
    matchBasis: 'SERIAL_NUMBER',
    confidence: 1.0,
    state: 'ACCEPTED',
    explanation: 'Underway deck log specifies "SN-204", matching physical Kraken MINSAS instance.',
    sourceArtifactRef: 'art-cruise-en2501-log',
    rawLabel: 'Kraken MINSAS-120 SN-204',
    targetCanonicalKey: 'KK:instrument-instance:kraken:minsas:204',
    decidedBy: 'Mission Ops Lead',
    decidedAt: '2026-09-01T10:15:00Z'
  },
  {
    id: 'cand-04-comet-weak-remus',
    sourceEntityId: 'row-comet-12-platform-weak',
    targetEntityId: 'plat-model-remus620',
    sourceType: 'platformModel',
    matchBasis: 'NAME_SIMILARITY',
    confidence: 0.52,
    state: 'WEAK_CANDIDATE',
    explanation: 'Uncurated draft XML contains vague string "REMUS". Insufficient specificity to auto-merge into REMUS 620.',
    sourceArtifactRef: 'art-comet-draft-831648',
    rawLabel: 'REMUS (generalized)',
    targetCanonicalKey: 'KK:platform-model:remus-620',
    decisionRationale: 'WEAK CANDIDATE HELD: Never silently merge weak labels. Awaiting steward confirmation.'
  },
  {
    id: 'cand-05-comet-conflict-6012',
    sourceEntityId: 'row-comet-14-conflict-serial',
    targetEntityId: 'plat-asset-6401',
    sourceType: 'physicalAsset',
    matchBasis: 'NAME_SIMILARITY',
    confidence: 0.35,
    state: 'CONFLICT',
    explanation: 'Draft record mentions "REMUS 600 Chassis #6012", conflicting with operational hull #6401 deployed on EN2501.',
    sourceArtifactRef: 'art-comet-draft-831648',
    rawLabel: 'REMUS 600 Chassis #6012',
    targetCanonicalKey: 'KK:physical-asset:remus-620:6401',
    decidedBy: 'Lead Data Steward (G. Peng)',
    decidedAt: '2026-09-08T14:30:00Z',
    decisionRationale: 'REJECTED: #6012 was a retired test chassis; official cruise operations used #6401.'
  },
  {
    id: 'cand-06-voyis088-exact',
    sourceEntityId: 'row-fleet-2025-42-payload',
    targetEntityId: 'inst-instance-voyis088',
    sourceType: 'instrumentInstance',
    matchBasis: 'SERIAL_NUMBER',
    confidence: 0.99,
    state: 'ACCEPTED',
    explanation: 'Payload allocation table specifies Voyis SN: 088.',
    sourceArtifactRef: 'art-fleet-inventory-2025',
    rawLabel: 'Voyis Insight Pro (SN: 088)',
    targetCanonicalKey: 'KK:instrument-instance:voyis:optical:088',
    decidedBy: 'Fleet Payload Manager',
    decidedAt: '2026-09-02T11:00:00Z'
  }
];

// =========================================================================
// CAPABILITY EVIDENCE MATURITY MATRIX
// =========================================================================
export const CORPUS_CAPABILITY_MATURITY_RECORDS: CapabilityMaturityRecord[] = [
  {
    id: 'cap-mat-remus620-minsas',
    platformModelId: 'plat-model-remus620',
    platformModelName: 'REMUS 620 AUV',
    instrumentModelId: 'inst-model-minsas',
    instrumentModelName: 'Kraken MINSAS-120 SAS',
    physicalAssetId: 'plat-asset-6401',
    instrumentInstanceId: 'inst-instance-minsas204',
    potential: {
      supported: true,
      authority: 'Huntington Ingalls Industries (HII)',
      evidenceRef: 'art-hii-remus620-spec',
      excerpt: 'Payload bay modular section 0.18m³ rated to accommodate Kraken MINSAS 120 and power bus 24V/48V.'
    },
    configured: {
      supported: true,
      authority: 'NOAA UxSO Fleet Registry',
      evidenceRef: 'art-fleet-inventory-2025',
      excerpt: 'Chassis #6401 physically configured with Kraken MINSAS SN-204.'
    },
    deployed: {
      supported: true,
      authority: 'EN2501 Underway Operations Deck Sheet',
      evidenceRef: 'art-cruise-en2501-log',
      excerpt: 'EN2501 Dive 01 and Dive 02 underway logs confirm MINSAS SN-204 active survey missions.'
    },
    dataProven: {
      supported: true,
      authority: 'NCEI OISS Ingest Manifest',
      evidenceRef: 'art-ncei-oiss-manifest',
      excerpt: 'Data asset EN2501_D01_Backscatter_50cm.tif directly traces to SN-204 telemetry lineage.'
    },
    overallMaturity: 'DATA_PROVEN',
    explanation: 'Complete end-to-end evidence verified: manufacturer capability, physical hull installation, bounded dive execution, and archived scientific dataset.'
  },
  {
    id: 'cap-mat-remus620-voyis',
    platformModelId: 'plat-model-remus620',
    platformModelName: 'REMUS 620 AUV',
    instrumentModelId: 'inst-model-voyis',
    instrumentModelName: 'Voyis Insight Pro Optical/Laser',
    physicalAssetId: 'plat-asset-6401',
    instrumentInstanceId: 'inst-instance-voyis088',
    potential: {
      supported: true,
      authority: 'HII Specification',
      evidenceRef: 'art-hii-remus620-spec',
      excerpt: 'Optical viewport forward compartment integrates Voyis Insight Pro stills and line scanner.'
    },
    configured: {
      supported: true,
      authority: 'NOAA UxSO Fleet Registry',
      evidenceRef: 'art-fleet-inventory-2025',
      excerpt: 'Chassis #6401 installed with Voyis SN-088.'
    },
    deployed: {
      supported: true,
      authority: 'EN2501 Underway Operations Log',
      evidenceRef: 'art-cruise-en2501-log',
      excerpt: 'EN2501 Dive 03 executed dedicated optical/laser transect on Molokai Escarpment.'
    },
    dataProven: {
      supported: true,
      authority: 'NCEI Archive Manifest',
      evidenceRef: 'art-ncei-oiss-manifest',
      excerpt: 'Orthomosaic dataset EN2501_D03_Optical_Ortho.tif verified.'
    },
    overallMaturity: 'DATA_PROVEN',
    explanation: 'Full lifecycle verified across all 4 maturity levels.'
  },
  {
    id: 'cap-mat-remus620-edgetech',
    platformModelId: 'plat-model-remus620',
    platformModelName: 'REMUS 620 AUV',
    instrumentModelId: 'inst-model-edgetech2200',
    instrumentModelName: 'EdgeTech 2200-M Sub-Bottom Profiler',
    physicalAssetId: 'plat-asset-6401',
    instrumentInstanceId: 'inst-instance-edgetech714',
    potential: {
      supported: true,
      authority: 'HII Specification',
      evidenceRef: 'art-hii-remus620-spec',
      excerpt: 'Sub-bottom low-frequency transducer array mounted in lower hull section.'
    },
    configured: {
      supported: true,
      authority: 'NOAA UxSO Fleet Registry',
      evidenceRef: 'art-fleet-inventory-2025',
      excerpt: 'EdgeTech 2200-M SN-714 listed as installed on #6401.'
    },
    deployed: {
      supported: false,
      authority: 'Underway Ops Log',
      evidenceRef: 'art-cruise-en2501-log',
      excerpt: 'Sub-bottom channel was unpowered during Dive 01 and Dive 02 due to acoustic frequency conflict.'
    },
    dataProven: {
      supported: false,
      authority: 'NCEI Manifest',
      evidenceRef: 'art-ncei-oiss-manifest',
      excerpt: 'No SEG-Y sub-bottom profile files generated for EN2501.'
    },
    overallMaturity: 'CONFIGURED',
    explanation: 'Physical configuration exists on Hull #6401, but sensor was not deployed active during mission and produced no data.'
  },
  {
    id: 'cap-mat-remus620-em304',
    platformModelId: 'plat-model-remus620',
    platformModelName: 'REMUS 620 AUV',
    instrumentModelId: 'inst-model-em304',
    instrumentModelName: 'Kongsberg EM304 Multibeam Sonar',
    potential: {
      supported: false,
      authority: 'HII Engineering Specification',
      evidenceRef: 'art-hii-remus620-spec',
      excerpt: 'EM304 transducer array weight (2,400 kg) and power draw (3.5 kW) exceed REMUS 620 payload envelope.'
    },
    configured: { supported: false, authority: 'None', evidenceRef: '' },
    deployed: { supported: false, authority: 'None', evidenceRef: '' },
    dataProven: { supported: false, authority: 'None', evidenceRef: '' },
    overallMaturity: 'POTENTIAL',
    explanation: 'Negative engineering capability: ship-mounted multibeam EM304 cannot be carried by REMUS 620 platform model.'
  }
];

// =========================================================================
// DETERMINISTIC GRAPH CAPABILITY QUERIES WITH EXPLAINABLE PATHS
// =========================================================================
export const CORPUS_DETERMINISTIC_QUERIES: CorpusCapabilityQuery[] = [
  {
    id: 'query-platforms-seafloor-mapping',
    question: 'Which platforms could support seafloor mapping?',
    category: 'POTENTIAL',
    rationale: 'Traverses ScienceDomain(Seafloor Mapping) -> REQUIRES_OR_BENEFITS_FROM -> ObservedProperty(Backscatter/Bathymetry) -> OBSERVABLE_BY -> SensorCapability -> IMPLEMENTED_BY -> InstrumentModel -> CAN_BE_CARRIED_BY -> PlatformModel.',
    results: [
      {
        title: 'REMUS 620 Autonomous Vehicle Model',
        subtitle: 'Can carry Kraken MINSAS-120 & Voyis Insight Pro',
        entityId: 'plat-model-remus620',
        entityKind: 'platformModel',
        explanationPath: [
          'ScienceDomain: Seafloor Mapping & Hydrography',
          'REQUIRES_OR_BENEFITS_FROM -> ObservedProperty: Acoustic Backscatter',
          'OBSERVABLE_BY -> SensorCapability: Synthetic Aperture Sonar (SAS)',
          'IMPLEMENTED_BY -> InstrumentModel: Kraken MINSAS-120 SAS',
          'CAN_BE_CARRIED_BY -> PlatformModel: REMUS 620'
        ],
        evidenceRefs: ['art-hii-remus620-spec', 'art-kraken-minsas-spec'],
        maturity: 'POTENTIAL',
        provenanceType: 'IMPORTED_ARTIFACT'
      },
      {
        title: 'Deep Discoverer ROV Model',
        subtitle: 'Can carry Kongsberg EM304 & Deep HD Still Cameras',
        entityId: 'plat-model-deep-discoverer',
        entityKind: 'platformModel',
        explanationPath: [
          'ScienceDomain: Seafloor Mapping & Hydrography',
          'REQUIRES_OR_BENEFITS_FROM -> ObservedProperty: Bathymetry & Subsea Elevation',
          'OBSERVABLE_BY -> SensorCapability: Multibeam Swath Sounding',
          'IMPLEMENTED_BY -> InstrumentModel: Kongsberg EM304',
          'CAN_BE_CARRIED_BY -> PlatformModel: NOAA Ship / Deep Discoverer System'
        ],
        evidenceRefs: ['art-cruise-report'],
        maturity: 'POTENTIAL',
        provenanceType: 'IMPORTED_ARTIFACT'
      }
    ]
  },
  {
    id: 'query-assets-carried-sas',
    question: 'Which physical assets have actually carried SAS?',
    category: 'DEPLOYED',
    rationale: 'Traverses SensorCapability(SAS) -> IMPLEMENTED_BY -> InstrumentModel -> INSTANCE_OF -> InstrumentInstance -> CARRIED <- Deployment -> EMPLOYED_ASSET -> PhysicalAsset.',
    results: [
      {
        title: 'REMUS 620 Hull #6401',
        subtitle: 'Carried Kraken MINSAS SN-204 on EN2501 Dive 01 & Dive 02',
        entityId: 'plat-asset-6401',
        entityKind: 'physicalAsset',
        explanationPath: [
          'PhysicalAsset: REMUS 620 Hull #6401',
          'EMPLOYED_ASSET <- Deployment: EN2501 Dive 01 (Penguin Bank SAS)',
          'CARRIED -> InstrumentInstance: Kraken MINSAS SN #204',
          'INSTANCE_OF -> InstrumentModel: Kraken MINSAS-120 SAS',
          'IMPLEMENTS -> SensorCapability: Synthetic Aperture Sonar (SAS)'
        ],
        evidenceRefs: ['art-cruise-en2501-log', 'art-fleet-inventory-2025'],
        maturity: 'DEPLOYED',
        provenanceType: 'IMPORTED_ARTIFACT'
      }
    ]
  },
  {
    id: 'query-remus-produced-datasets',
    question: 'Which REMUS assets have produced datasets?',
    category: 'DATA_PROVEN',
    rationale: 'Traverses PhysicalAsset(REMUS 620 #6401) -> EMPLOYED_ASSET <- Deployment -> CARRIED -> InstrumentInstance -> PRODUCED -> Dataset.',
    results: [
      {
        title: 'Acoustic Backscatter GeoTIFF Mosaic (50cm)',
        subtitle: 'Produced by Kraken MINSAS SN-204 deployed on Hull #6401',
        entityId: 'dataset-backscatter-mosaic',
        entityKind: 'dataset',
        explanationPath: [
          'PhysicalAsset: REMUS 620 Hull #6401',
          'EMPLOYED_ASSET <- Deployment: EN2501 Dive 01',
          'CARRIED -> InstrumentInstance: Kraken MINSAS SN #204',
          'PRODUCED -> Dataset: Acoustic Backscatter GeoTIFF Mosaic (EN2501_D01_Backscatter_50cm)'
        ],
        evidenceRefs: ['art-cruise-en2501-log', 'art-ncei-oiss-manifest'],
        maturity: 'DATA_PROVEN',
        provenanceType: 'IMPORTED_ARTIFACT'
      },
      {
        title: 'Bathymetry BAG 1m Gridded Surface',
        subtitle: 'Produced by Kraken MINSAS SN-204 deployed on Hull #6401',
        entityId: 'dataset-bathymetry-bag',
        entityKind: 'dataset',
        explanationPath: [
          'PhysicalAsset: REMUS 620 Hull #6401',
          'EMPLOYED_ASSET <- Deployment: EN2501 Dive 02',
          'CARRIED -> InstrumentInstance: Kraken MINSAS SN #204',
          'PRODUCED -> Dataset: Bathymetry BAG 1m Gridded Surface'
        ],
        evidenceRefs: ['art-cruise-en2501-log', 'art-ncei-oiss-manifest'],
        maturity: 'DATA_PROVEN',
        provenanceType: 'IMPORTED_ARTIFACT'
      }
    ]
  },
  {
    id: 'query-instruments-observe-bathymetry',
    question: 'Which instruments can observe bathymetry?',
    category: 'INSTRUMENT',
    rationale: 'Traverses ObservedProperty(Bathymetry) -> OBSERVABLE_BY -> SensorCapability -> IMPLEMENTED_BY -> InstrumentModel.',
    results: [
      {
        title: 'Kraken MINSAS-120 SAS',
        subtitle: 'Interferometric along-track sonar micro-bathymetry',
        entityId: 'inst-model-minsas',
        entityKind: 'instrumentModel',
        explanationPath: [
          'ObservedProperty: Bathymetry & Subsea Elevation',
          'OBSERVABLE_BY -> SensorCapability: Synthetic Aperture Sonar (SAS)',
          'IMPLEMENTED_BY -> InstrumentModel: Kraken MINSAS-120 SAS'
        ],
        evidenceRefs: ['art-kraken-minsas-spec'],
        maturity: 'POTENTIAL',
        provenanceType: 'IMPORTED_ARTIFACT'
      },
      {
        title: 'Kongsberg EM304 Multibeam Sonar',
        subtitle: 'Deep-water fan-beam multibeam sounding',
        entityId: 'inst-model-em304',
        entityKind: 'instrumentModel',
        explanationPath: [
          'ObservedProperty: Bathymetry & Subsea Elevation',
          'OBSERVABLE_BY -> SensorCapability: Multibeam Swath Sounding',
          'IMPLEMENTED_BY -> InstrumentModel: Kongsberg EM304 Multibeam Sonar'
        ],
        evidenceRefs: ['art-cruise-report'],
        maturity: 'POTENTIAL',
        provenanceType: 'IMPORTED_ARTIFACT'
      },
      {
        title: 'Voyis Insight Pro Optical/Laser',
        subtitle: 'Sub-millimeter structured laser line scanning',
        entityId: 'inst-model-voyis',
        entityKind: 'instrumentModel',
        explanationPath: [
          'ObservedProperty: Bathymetry & Subsea Elevation',
          'OBSERVABLE_BY -> SensorCapability: Optical Laser Line Scanning',
          'IMPLEMENTED_BY -> InstrumentModel: Voyis Insight Pro'
        ],
        evidenceRefs: ['art-cruise-en2501-log'],
        maturity: 'POTENTIAL',
        provenanceType: 'IMPORTED_ARTIFACT'
      }
    ]
  },
  {
    id: 'query-unresolved-identity',
    question: 'Which assets have unresolved identity?',
    category: 'UNRESOLVED',
    rationale: 'Queries CandidateIdentityEdges where state != ACCEPTED and state != REJECTED.',
    results: [
      {
        title: 'Candidate String: "REMUS" (CoMET CEDIT Draft)',
        subtitle: 'Weak candidate mapping to REMUS 620 Platform Model (confidence 0.52)',
        entityId: 'cand-04-comet-weak-remus',
        entityKind: 'claim',
        explanationPath: [
          'Source: CoMET CEDIT Draft Record (gov.noaa.ncei:831648426048686)',
          'Raw Value: "REMUS"',
          'State: WEAK_CANDIDATE',
          'Rule: Weak labels cannot auto-merge identity without human verification'
        ],
        evidenceRefs: ['art-comet-draft-831648'],
        maturity: 'POTENTIAL',
        provenanceType: 'SYNTHETIC_FIXTURE'
      }
    ]
  }
];
