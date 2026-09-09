import {
  UxSLifecycleState,
  LifecycleTransitionHistory,
  ReadinessCockpitState,
  LifecycleStageDefinition
} from '../types';

export const LIFECYCLE_STAGES: LifecycleStageDefinition[] = [
  {
    id: 'ACQUIRE',
    name: 'Acquisition',
    shortLabel: 'ACQUIRE',
    category: 'PHYSICAL_OPS',
    description: 'Vehicle mission operations, physical dives, sensor track capture, and preliminary raw files.',
    operationalActor: 'Autonomous Platform / Operations Team',
    typicalArtifacts: ['Vehicle Telemetry', 'USBL Nav Track', 'Raw Sonar/Optical Payloads', 'Field Logs'],
    guards: [
      { id: 'g-acq-1', label: 'Platform telemetry captured', satisfied: true },
      { id: 'g-acq-2', label: 'Geodesic boundary track logged', satisfied: true },
      { id: 'g-acq-3', label: 'Raw data files cataloged', satisfied: true },
    ]
  },
  {
    id: 'OBSERVE',
    name: 'Observation & Ingestion',
    shortLabel: 'OBSERVE',
    category: 'PHYSICAL_OPS',
    description: 'Adapters and SnapTree ingest raw documents, inventories, and Charlie form submissions with cryptographic checksums.',
    operationalActor: 'MANTAS Intake Adapters & Source Checksumming',
    typicalArtifacts: ['Charlie Form', 'NCEI Ingest Manifest', 'Source Document Hashes', 'Inventory Row'],
    guards: [
      { id: 'g-obs-1', label: 'Source artifact cryptographic hashes computed', satisfied: true },
      { id: 'g-obs-2', label: 'Physical file inventory verified', satisfied: true },
      { id: 'g-obs-3', label: 'Intake document excerpts linked', satisfied: true },
    ]
  },
  {
    id: 'RECONCILE',
    name: 'Reconciliation & Claims',
    shortLabel: 'RECONCILE',
    category: 'EVIDENCE_REASONING',
    description: 'Extract multi-source candidate claims, identify hull/sensor identity variances, and highlight conflicting values.',
    operationalActor: 'Evidence Reasoner & Cross-Source Matcher',
    typicalArtifacts: ['Candidate Claims', 'Conflict Graph', 'Identity Variance Matrix', 'Source Citations'],
    guards: [
      { id: 'g-rec-1', label: 'Platform identity claim extracted', satisfied: true },
      { id: 'g-rec-2', label: 'Sensor payload claims paired with models', satisfied: true },
      { id: 'g-rec-3', label: 'Blocking claim conflicts flagged for review', satisfied: true },
    ]
  },
  {
    id: 'ACCEPT',
    name: 'Human Decision & Acceptance',
    shortLabel: 'ACCEPT',
    category: 'EVIDENCE_REASONING',
    description: 'Data steward resolves identity ambiguities, mints Knowledge Keys, and commits canonical mission meaning to the Merkle ledger.',
    operationalActor: 'Human Data Steward (Active Session)',
    typicalArtifacts: ['Decision Records', 'Minted Knowledge Keys', 'Canonical State Revision', 'Ledger Block'],
    guards: [
      { id: 'g-acc-1', label: 'Platform identity explicitly accepted', satisfied: true },
      { id: 'g-acc-2', label: 'Physical asset hull and serials bound to Knowledge Keys', satisfied: true },
      { id: 'g-acc-3', label: 'Human decision recorded with actor citation', satisfied: true },
    ]
  },
  {
    id: 'ASSURE',
    name: 'Signal Profile Assurance',
    shortLabel: 'ASSURE',
    category: 'METADATA_GOVERNANCE',
    description: 'Evaluate multi-tier Signal rules, DocuComp provisional slot rules, vocabulary bindings, and profile completeness.',
    operationalActor: 'Signal Conformance Engine',
    typicalArtifacts: ['Signal Evaluation Receipt', 'DocuComp Slot Ruleset', 'GCMD Vocabulary Check', 'Conformance Score'],
    guards: [
      { id: 'g-ass-1', label: 'Required UxS metadata fields populated', satisfied: true },
      { id: 'g-ass-2', label: 'DocuComp slot placement rules validated (provisional)', satisfied: true },
      { id: 'g-ass-3', label: 'Zero blocking fatal schema errors', satisfied: true },
    ]
  },
  {
    id: 'PROJECT',
    name: 'Multi-Format Projection',
    shortLabel: 'PROJECT',
    category: 'METADATA_GOVERNANCE',
    description: 'Synchronously generate ISO 19115-2 XML, STAC 1.0.0 Collection/Item JSON, DCAT catalog RDF, and OISS metadata fragments.',
    operationalActor: 'Rosetta Crosswalk & Projection Generators',
    typicalArtifacts: ['ISO 19115-2 XML', 'STAC Catalog Item', 'DCAT-US JSON', 'CoMET Staging Payload'],
    guards: [
      { id: 'g-prj-1', label: 'ISO 19115-2 XML syntactically valid', satisfied: true },
      { id: 'g-prj-2', label: 'STAC GeoJSON geometry and asset projections aligned', satisfied: true },
      { id: 'g-prj-3', label: 'Projection hashes sealed into ledger entry', satisfied: true },
    ]
  },
  {
    id: 'HANDOFF_READY',
    name: 'Package Handoff Preparation',
    shortLabel: 'HANDOFF',
    category: 'METADATA_GOVERNANCE',
    description: 'MANTAS asserts packaging completeness: files, checksums, and ISO projections meet NOAA NCEI submission specifications.',
    operationalActor: 'MANTAS Package Bundler (Local Assertion)',
    typicalArtifacts: ['Submission Information Package (SIP)', 'SHA-256 Manifest', 'Routing Slip', 'MANTAS Handoff Cert'],
    guards: [
      { id: 'g-hnd-1', label: 'All 17 data files present and matched to SHA-256 hashes', satisfied: true },
      { id: 'g-hnd-2', label: 'Metadata projection sealed in archive bundle', satisfied: true },
      { id: 'g-hnd-3', label: 'Destination routing endpoints determined', satisfied: true },
    ]
  },
  {
    id: 'SUBMITTED',
    name: 'Submitted to Ingest',
    shortLabel: 'SUBMITTED',
    category: 'DESTINATION_OBSERVED',
    description: 'Package transmitted to NOAA OISS/NCEI Ingest pipeline. Awaiting automated ingest pipeline execution.',
    operationalActor: 'NOAA NCEI Ingest Gateway',
    typicalArtifacts: ['Ingest Receipt ID', 'Transmission Log', 'OISS Queue Ticket'],
    guards: [
      { id: 'g-sub-1', label: 'Transmission receipt confirmed by receiving gateway', satisfied: false },
    ]
  },
  {
    id: 'DESTINATION_OBSERVED',
    name: 'Destination Verified (OISS)',
    shortLabel: 'OISS OBSERVED',
    category: 'DESTINATION_OBSERVED',
    description: 'NOAA OISS system returns validation receipt and confirmation that structural verification passed upstream.',
    operationalActor: 'Upstream NOAA OISS Service',
    typicalArtifacts: ['OISS Validation Receipt', 'Upstream Ingest Pass Hash'],
    guards: [
      { id: 'g-dest-1', label: 'Upstream OISS validation returned HTTP 200 / PASS', satisfied: false },
    ]
  },
  {
    id: 'ARCHIVED',
    name: 'Archived in NCEI Deep Storage',
    shortLabel: 'ARCHIVED',
    category: 'DESTINATION_OBSERVED',
    description: 'Data accessioned into official NOAA NCEI oceanographic archives with assigned accession identifier.',
    operationalActor: 'NCEI Archive Repository',
    typicalArtifacts: ['Accession Number (e.g., NCEI-0284918)', 'Preservation BagIt Bag'],
    guards: [
      { id: 'g-arc-1', label: 'Official NCEI accession number minted and verified', satisfied: false },
    ]
  },
  {
    id: 'DISCOVERABLE',
    name: 'Discoverable in OneStop & CoMET',
    shortLabel: 'DISCOVERABLE',
    category: 'DESTINATION_OBSERVED',
    description: 'Record indexed and published on NOAA OneStop Search, CoMET CEDIT Public WAF, and STAC API endpoints.',
    operationalActor: 'NOAA OneStop / CoMET WAF Ingestion',
    typicalArtifacts: ['OneStop Catalog Entry', 'WAF Published URL', 'STAC Search Endpoint'],
    guards: [
      { id: 'g-dis-1', label: 'Search crawler observed published record in OneStop index', satisfied: false },
    ]
  }
];

export const INITIAL_READINESS_COCKPIT: ReadinessCockpitState = {
  missionId: 'EN2501',
  missionTitle: 'EN2501 Hawaiian Ridge & Kaiwi Channel Autonomous Seafloor Mapping',
  activeStage: 'ACCEPT',
  lifecycleState: 'ACCEPT',
  domains: {
    vehicle: {
      status: 'READY',
      label: 'Vehicle Domain',
      details: 'REMUS 620 UUV (#6401) platform model and hull serial accepted.',
      items: [
        { label: 'Platform Model: REMUS 620', status: 'READY' },
        { label: 'Physical Asset Hull: #6401', status: 'READY' },
        { label: 'Operational Category: UUV', status: 'READY' },
        { label: 'Callsign: NOAA-UXS-6401', status: 'READY' },
      ]
    },
    payload: {
      status: 'READY',
      label: 'Payload Domain',
      details: 'Payload configurations linked to sensor instances with capabilities.',
      items: [
        { label: 'Synthetic Aperture Sonar (Kraken MINSAS-120)', status: 'READY' },
        { label: 'Optical Laser Imaging (Voyis Insight Pro)', status: 'READY' },
        { label: 'CTD Profiler (Seabird FastCAT)', status: 'READY' },
        { label: 'Sub-Bottom Profiler (EdgeTech)', status: 'READY' },
      ]
    },
    mission: {
      status: 'READY',
      label: 'Mission Domain',
      details: 'Dive 01 bounds, geodetic coordinates, and temporal envelope verified.',
      items: [
        { label: 'Deployment Identity: Dive 01 / Leg 1', status: 'READY' },
        { label: 'Temporal Window: 2025-06-01 to 2025-06-20', status: 'READY' },
        { label: 'Geodetic Bounding Box: Kaiwi Channel & Penguin Bank', status: 'READY' },
        { label: 'USBL Navigational Track: Present (1,420 fixes)', status: 'READY' },
      ]
    },
    data: {
      status: 'PARTIAL',
      label: 'Data Domain',
      details: '17 expected data files located; 1 auxiliary log checksum pending verify.',
      items: [
        { label: 'Acoustic Backscatter Mosaics (SAS)', status: 'READY' },
        { label: 'High-Resolution Micro-Bathymetry Grid', status: 'READY' },
        { label: 'Raw Navigation Binary Telemetry', status: 'READY' },
        { label: 'Auxiliary CTD Calibration Log', status: 'REVIEW' },
      ]
    },
    metadata: {
      status: 'READY',
      label: 'Metadata Domain',
      details: 'Core ISO profile, DocuComp contacts, and GCMD keywords complete.',
      items: [
        { label: 'Contact & Responsible Party (gmd:contact)', status: 'READY' },
        { label: 'Temporal Extent Envelope', status: 'READY' },
        { label: 'Spatial Extent Polygon & Bounding Box', status: 'READY' },
        { label: 'GCMD Science & Platform Keywords', status: 'READY' },
        { label: 'Lineage & Processing Steps', status: 'READY' },
        { label: 'Distribution & Rights Constraints', status: 'READY' },
      ]
    }
  },
  destinations: {
    iso: {
      status: 'PROJECTABLE',
      label: 'ISO 19115-2 Schema',
      description: 'Canonical ISO 19115-2 XML generated; conforms to NOAA NCEI UxS profile.',
      authorityScope: 'MANTAS Projection Engine'
    },
    stac: {
      status: 'PROJECTABLE',
      label: 'STAC 1.0.0 Collection',
      description: 'SpatioTemporal Asset Catalog item with asset hrefs and bbox.',
      authorityScope: 'MANTAS Projection Engine'
    },
    comet: {
      status: 'NOT_TESTED',
      label: 'CoMET CEDIT Catalog',
      description: 'Upstream POST /recordServices/validate not yet invoked.',
      authorityScope: 'NOAA CoMET Endpoint (Simulated Boundary)'
    },
    oiss: {
      status: 'HANDOFF_READY',
      label: 'OISS / NCEI Ingest (MANTAS Assertion)',
      description: 'Package satisfies MANTAS handoff criteria. Upstream OISS validation not yet executed.',
      authorityScope: 'MANTAS Local Ingest Packaging'
    },
    archive: {
      status: 'NOT_OBSERVED',
      label: 'NCEI Deep Ocean Archive',
      description: 'Downstream accessioning requires confirmed archive ingestion receipt.',
      authorityScope: 'NOAA NCEI Ocean Archive'
    },
    discovery: {
      status: 'NOT_OBSERVED',
      label: 'OneStop Discovery Index',
      description: 'WAF crawl or catalog indexing not yet observed downstream.',
      authorityScope: 'NOAA OneStop Discovery Portal'
    }
  }
};

export const SEED_LIFECYCLE_TRANSITIONS: LifecycleTransitionHistory[] = [
  {
    id: 'trans-001',
    timestamp: '2025-06-21 08:30:12Z',
    fromState: 'ACQUIRE',
    toState: 'OBSERVE',
    trigger: 'INGEST_MANIFEST_LOADED',
    actor: 'MANTAS Automated Ingestion Agent',
    summary: 'Captured 17 raw data files and USBL vehicle telemetry from R/V expedition storage.',
    canonicalHash: '3a19e8cf0b41',
    guardsChecked: [
      { name: 'Telemetry Logged', passed: true },
      { name: 'Raw File Count > 0', passed: true }
    ]
  },
  {
    id: 'trans-002',
    timestamp: '2025-06-22 14:15:00Z',
    fromState: 'OBSERVE',
    toState: 'RECONCILE',
    trigger: 'CLAIMS_REASONING_RUN',
    actor: 'MANTAS Evidence Extractor',
    summary: 'Extracted 16 candidate claims from Charlie Form, NCEI Inventory row, and cruise report.',
    canonicalHash: '8b7f21a0d33e',
    claimsDecided: ['claim-conflict-hull'],
    guardsChecked: [
      { name: 'Source Hashes Computed', passed: true },
      { name: 'Identity Matrix Built', passed: true }
    ]
  },
  {
    id: 'trans-003',
    timestamp: '2025-06-23 09:44:21Z',
    fromState: 'RECONCILE',
    toState: 'ACCEPT',
    trigger: 'HUMAN_DECISION_SUBMITTED',
    actor: 'Human Data Steward (Active Session)',
    summary: 'Accepted REMUS 620 (#6401) platform model and Kraken MINSAS-120 payload. Resolved hull label variance.',
    canonicalHash: 'c586116ea982',
    ledgerBlockId: 'L-000184',
    knowledgeKeysMinted: [
      'KK:physical-asset:remus620:6401',
      'KK:instrument-instance:kraken:minsas:120',
      'KK:deployment:en2501:dive01'
    ],
    guardsChecked: [
      { name: 'Platform Identity Resolved', passed: true },
      { name: 'Payload Linked to Asset', passed: true },
      { name: 'Blocking Conflict Decided', passed: true }
    ]
  }
];
