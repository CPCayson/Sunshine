import {
  Claim,
  SourceObservation,
  ObservedComponentReference,
  FederatedSearchResult,
  SignalFinding,
  RosettaFieldMapping,
  ExpectedVsObservedDiff
} from '../types';

// =========================================================================
// REAL-WORLD NOAA / NCEI SOURCE OBSERVATIONS
// =========================================================================
export const SEED_SOURCE_OBSERVATIONS: SourceObservation[] = [
  {
    id: 'OBS-CR-EX2503',
    authority: 'Cruise Report',
    sourceUri: 'https://oceanexplorer.noaa.gov/okeanos/explorations/ex2503/logs/cruise_report.pdf',
    sourceTitle: 'Okeanos Explorer EX-25-03 Expedition Operations & Science Report',
    documentExcerpt: 'Dive 04 executed on Corner Rise Seamount with ROV Deep Discoverer to depth 2,480m. Acoustic multibeam EM304 underway mapping concurrent.',
    observedAt: '2025-03-24T14:30:00Z',
    observedBy: 'Expedition Science Lead',
    reliabilityScore: 0.96,
  },
  {
    id: 'OBS-REG-UXS6401',
    authority: 'UxS Registry',
    sourceUri: 'https://data.noaa.gov/uxs/fleet/inventory/remus-620-6401',
    sourceTitle: 'NOAA UxS Fleet Asset Registry — REMUS 620 Tail #6401',
    documentExcerpt: 'Asset ID #6401 configured with payload bay: Kraken MINSAS Synthetic Aperture Sonar (SN: 204), EdgeTech 2200-M sub-bottom profiler.',
    observedAt: '2025-01-15T09:00:00Z',
    observedBy: 'NOAA UxSO Fleet Manager',
    reliabilityScore: 0.99,
  },
  {
    id: 'OBS-COMET-831648',
    authority: 'CoMET',
    sourceUri: 'https://data.noaa.gov/cedit/view/831648426048686',
    sourceTitle: 'CoMET ISO Record gov.noaa.ncei:831648426048686 (DRAFT)',
    documentExcerpt: 'Platform registered as "REMUS" (generalized name), instruments contain multibeam sonar, date range 2024-05-01 to 2024-05-14.',
    rawFragment: '<gmi:MI_Platform><gmi:identifier><gco:CharacterString>REMUS</gco:CharacterString></gmi:identifier></gmi:MI_Platform>',
    observedAt: '2024-06-02T11:22:00Z',
    observedBy: 'CoMET Metadata Editor (lori.hager@noaa.gov)',
    reliabilityScore: 0.88,
  },
  {
    id: 'OBS-DOCUCOMP-CONTACT',
    authority: 'DocuComp',
    sourceUri: 'https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644',
    sourceTitle: 'DocuComp Component: NCEI Official Archive Branch ResponsibleParty',
    documentExcerpt: 'Shared authority component for NCEI Asheville archive branch contact and distribution responsibilities.',
    rawFragment: '<gmd:CI_ResponsibleParty uuid="440b3ac2-64a5-46e2-9846-38305718b644"><gmd:organisationName><gco:CharacterString>National Centers for Environmental Information</gco:CharacterString></gmd:organisationName></gmd:CI_ResponsibleParty>',
    observedAt: '2025-06-10T15:00:00Z',
    observedBy: 'DocuComp Master Admin',
    reliabilityScore: 1.0,
  },
  {
    id: 'OBS-STAC-DIVE401',
    authority: 'STAC',
    sourceUri: 'https://ocean-stac.noaa.gov/collections/dive-401/items/remus-minsas-20250703',
    sourceTitle: 'NOAA Ocean STAC API — Dive 401 Item Asset',
    documentExcerpt: 'Item id: remus-minsas-20250703, platform: REMUS 620, instruments: ["Kraken SAS"], properties: { "proj:epsg": 4326, "datetime": "2025-07-03T12:00:00Z" }',
    observedAt: '2025-07-04T08:00:00Z',
    reliabilityScore: 0.94,
  },
  {
    id: 'OBS-ONESTOP-DSMM',
    authority: 'OneStop',
    sourceUri: 'https://data.noaa.gov/onestop/#/collections/details?id=gov.noaa.ncei:EX2503',
    sourceTitle: 'OneStop Discovery & Access — Collection DSMM Score',
    documentExcerpt: 'Overall Data Stewardship Maturity Matrix score: 3.8/5.0 (Advanced Preservability, Intermediate Data Quality, Advanced Accessibility).',
    observedAt: '2025-08-01T12:00:00Z',
    reliabilityScore: 0.95,
  },
];

// =========================================================================
// FIRST-CLASS CLAIMS WITH DISTINCT RELATIONSHIP PREDICATES
// =========================================================================
export const SEED_CLAIMS: Claim[] = [
  {
    id: 'CLM-01-PLAT-CARRY',
    subject: 'PlatformModel:REMUS-620',
    predicate: 'CAN_CARRY',
    objectValue: 'InstrumentModel:Kraken-MINSAS-SAS',
    sources: [SEED_SOURCE_OBSERVATIONS[1]],
    confidence: 0.98,
    state: 'OBSERVED',
    whyExplanation: 'Fleet capability spec confirms REMUS 620 payload bay accommodates Kraken MINSAS sonar payload.',
  },
  {
    id: 'CLM-02-ASSET-CFG',
    subject: 'PhysicalAsset:REMUS-620-#6401',
    predicate: 'CONFIGURED_WITH',
    objectValue: 'InstrumentInstance:Kraken-MINSAS-SN204',
    sources: [SEED_SOURCE_OBSERVATIONS[1]],
    confidence: 0.99,
    state: 'OBSERVED',
    whyExplanation: 'Physical asset maintenance log records SN-204 installed on chassis #6401.',
  },
  {
    id: 'CLM-03-DEP-CARRIED',
    subject: 'Deployment:PS2418-Dive01',
    predicate: 'CARRIED',
    objectValue: 'InstrumentInstance:Kraken-MINSAS-SN204',
    sources: [SEED_SOURCE_OBSERVATIONS[0], SEED_SOURCE_OBSERVATIONS[1]],
    confidence: 0.95,
    state: 'ACCEPTED',
    acceptedBy: 'Lead Data Steward (G. Peng)',
    acceptedAt: '2026-09-01T14:10:00Z',
    whyExplanation: 'Cruise operations deck sheet and sensor data stream corroborate Kraken MINSAS was carried during dive.',
  },
  {
    id: 'CLM-04-INST-PRODUCED',
    subject: 'InstrumentInstance:Kraken-MINSAS-SN204',
    predicate: 'PRODUCED',
    objectValue: 'Dataset:Acoustic-Backscatter-Mosaic',
    sources: [SEED_SOURCE_OBSERVATIONS[4]],
    confidence: 0.94,
    state: 'ACCEPTED',
    acceptedBy: 'Lead Data Steward',
    acceptedAt: '2026-09-02T10:00:00Z',
    whyExplanation: 'STAC asset collection points directly to processed GeoTIFF backscatter mosaics produced by SN-204.',
  },
  {
    id: 'CLM-05-CONFLICT-PLAT',
    subject: 'Mission:PointSur_2024_Leg18.platform',
    predicate: 'CARRIED',
    objectValue: 'REMUS 620 #6401',
    sources: [SEED_SOURCE_OBSERVATIONS[1], SEED_SOURCE_OBSERVATIONS[2]],
    confidence: 0.72,
    state: 'CONFLICT',
    whyExplanation: 'Specificity Drift Conflict: Fleet inventory specifies "REMUS 620 #6401", whereas legacy CoMET record contains generalized string "REMUS".',
    conflictDetails: {
      conflictingValues: [
        {
          value: 'REMUS 620 #6401',
          source: 'UxS Registry',
          excerpt: 'Asset ID #6401 configured with Kraken MINSAS',
        },
        {
          value: 'REMUS (generalized)',
          source: 'CoMET',
          excerpt: 'Original XML contains <gco:CharacterString>REMUS</gco:CharacterString>',
        },
        {
          value: 'Eagle Ray UUV',
          source: 'Cruise Report',
          excerpt: 'Cruise report notes Eagle Ray UUV host mission',
        },
      ],
    },
  },
  {
    id: 'CLM-06-INFERRED-BACKSCATTER',
    subject: 'ScienceDomain:Seafloor-Mapping',
    predicate: 'SUPPORTED_BY',
    objectValue: 'ObservedProperty:Acoustic-Backscatter',
    sources: [SEED_SOURCE_OBSERVATIONS[0]],
    confidence: 0.89,
    state: 'INFERRED',
    whyExplanation: 'Inferred from presence of Kraken Synthetic Aperture Sonar: high-frequency SAS implies acoustic backscatter data collection.',
  },
  {
    id: 'CLM-07-OBSPROP-SENSOR',
    subject: 'ObservedProperty:Acoustic-Backscatter',
    predicate: 'OBSERVABLE_BY',
    objectValue: 'SensorCapability:Synthetic-Aperture-Sonar',
    sources: [SEED_SOURCE_OBSERVATIONS[0]],
    confidence: 0.96,
    state: 'ACCEPTED',
    acceptedBy: 'Science Coordinator',
    acceptedAt: '2026-08-20T09:30:00Z',
    whyExplanation: 'Standard sensor ontology mapping for ocean hydrographic surveys.',
  },
];

// =========================================================================
// PRESERVED DOCUCOMP REUSABLE EXTERNAL COMPONENTS (XLinks Preserved)
// Reference: Docucomp User Guide Production Version 4.9.0
// =========================================================================
export const SEED_DOCUCOMP_REFERENCES: ObservedComponentReference[] = [
  {
    authority: 'DocuComp',
    id: 'DOCUCOMP-CONTACT-NCEI',
    name: 'Citation NCEI Official Archive Branch, ResponsibleParty',
    uuid: '440b3ac2-64a5-46e2-9846-38305718b644',
    href: 'https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644',
    isoSlot: 'gmd:contact',
    semanticRole: 'pointOfContact',
    componentGroup: 'NOAA Master Component Group',
    lastUpdated: '2025-03-31T14:38:07Z',
    resolvedXmlSnippet: `<gmd:CI_ResponsibleParty xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="440b3ac2-64a5-46e2-9846-38305718b644">
  <gmd:organisationName>
    <gco:CharacterString>NOAA National Centers for Environmental Information</gco:CharacterString>
  </gmd:organisationName>
  <gmd:contactInfo>
    <gmd:CI_Contact>
      <gmd:address>
        <gmd:CI_Address>
          <gmd:electronicMailAddress>
            <gco:CharacterString>ncei.info@noaa.gov</gco:CharacterString>
          </gmd:electronicMailAddress>
        </gmd:CI_Address>
      </gmd:address>
      <gmd:onlineResource>
        <gmd:CI_OnlineResource>
          <gmd:linkage><gmd:URL>https://www.ncei.noaa.gov/contact</gmd:URL></gmd:linkage>
        </gmd:CI_OnlineResource>
      </gmd:onlineResource>
    </gmd:CI_Contact>
  </gmd:contactInfo>
  <gmd:role>
    <gmd:CI_RoleCode codeList="http://www.isotc211.org/2005/resources/Codelist/gmxCodelists.xml#CI_RoleCode" codeListValue="pointOfContact">pointOfContact</gmd:CI_RoleCode>
  </gmd:role>
</gmd:CI_ResponsibleParty>`,
  },
  {
    authority: 'DocuComp',
    id: 'DOCUCOMP-LEGAL-DISTRIB',
    name: 'Distribution Liability: NOAA and NCEI Standard Disclaimer',
    uuid: 'dadd4ac3-2b9f-4db5-8603-71285b94c3d7',
    href: 'https://data.noaa.gov/docucomp/dadd4ac3-2b9f-4db5-8603-71285b94c3d7',
    isoSlot: 'gmd:resourceConstraints',
    semanticRole: 'distributionLiability',
    componentGroup: 'NOAA Master Component Group',
    lastUpdated: '2024-11-04T17:28:17Z',
    resolvedXmlSnippet: `<gmd:resourceConstraints xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="dadd4ac3-2b9f-4db5-8603-71285b94c3d7">
  <gmd:MD_LegalConstraints>
    <gmd:useLimitation>
      <gco:CharacterString>Distribution liability: NOAA and NCEI make no warranty, expressed or implied, regarding these data.</gco:CharacterString>
    </gmd:useLimitation>
    <gmd:accessConstraints>
      <gmd:MD_RestrictionCode codeList="http://www.isotc211.org/2005/resources/Codelist/gmxCodelists.xml#MD_RestrictionCode" codeListValue="otherRestrictions">otherRestrictions</gmd:MD_RestrictionCode>
    </gmd:accessConstraints>
  </gmd:MD_LegalConstraints>
</gmd:resourceConstraints>`,
  },
  {
    authority: 'DocuComp',
    id: 'DOCUCOMP-LEGAL-USE',
    name: 'Use Liability: User Responsibility Disclaimer',
    uuid: 'e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b',
    href: 'https://data.noaa.gov/docucomp/e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b',
    isoSlot: 'gmd:resourceConstraints',
    semanticRole: 'useLiability',
    componentGroup: 'NOAA Master Component Group',
    lastUpdated: '2024-11-04T17:28:17Z',
    resolvedXmlSnippet: `<gmd:resourceConstraints xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b">
  <gmd:MD_LegalConstraints>
    <gmd:useLimitation>
      <gco:CharacterString>Use liability: NOAA and NCEI cannot provide any warranty as to the accuracy, reliability, or completeness of furnished data.</gco:CharacterString>
    </gmd:useLimitation>
  </gmd:MD_LegalConstraints>
</gmd:resourceConstraints>`,
  },
  {
    authority: 'DocuComp',
    id: 'DOCUCOMP-PLAT-OKEANOS',
    name: 'RV Okeanos Explorer MI_Platform Definition',
    uuid: 'c307df20-7326-11e9-b475-0800200c9a66',
    href: 'https://data.noaa.gov/docucomp/c307df20-7326-11e9-b475-0800200c9a66',
    isoSlot: 'gmi:platform',
    semanticRole: 'platformDefinition',
    componentGroup: 'OER Component Group',
    lastUpdated: '2024-07-21T14:14:04Z',
    resolvedXmlSnippet: `<gmi:MI_Platform xmlns:gmi="http://standards.iso.org/iso/19115/-2/gmi/1.0" xmlns:gco="http://standards.iso.org/iso/19115/-2/gco/1.0" uuid="c307df20-7326-11e9-b475-0800200c9a66">
  <gmi:citation>
    <gmd:CI_Citation xmlns:gmd="http://www.isotc211.org/2005/gmd">
      <gmd:title><gco:CharacterString>NOAA Ship Okeanos Explorer</gco:CharacterString></gmd:title>
      <gmd:date><gmd:CI_Date><gmd:date><gco:Date>2010-08-13</gco:Date></gmd:date><gmd:dateType><gmd:CI_DateTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_DateTypeCode" codeListValue="creation">creation</gmd:CI_DateTypeCode></gmd:dateType></gmd:CI_Date></gmd:date>
    </gmd:CI_Citation>
  </gmi:citation>
  <gmi:identifier><gmd:MD_Identifier xmlns:gmd="http://www.isotc211.org/2005/gmd"><gmd:code><gco:CharacterString>Okeanos Explorer</gco:CharacterString></gmd:code></gmd:MD_Identifier></gmi:identifier>
  <gmi:description><gco:CharacterString>NOAA dedicated ocean exploration platform with ROV systems Deep Discoverer and Seirios.</gco:CharacterString></gmi:description>
</gmi:MI_Platform>`,
  },
];

// =========================================================================
// FEDERATED SEARCH PROVIDER RECORDS
// Search Providers: CoMET, OneStop, external STAC, UxS Registry, DocuComp
// =========================================================================
export const SEED_FEDERATED_SEARCH_RESULTS: FederatedSearchResult[] = [
  {
    id: 'FED-COMET-01',
    authority: 'CoMET',
    title: 'Point Sur / REMUS Survey 2024 (gov.noaa.ncei:831648426048686)',
    subtitle: 'CoMET Record Group: ea_demo/ • Edit State: DRAFT',
    uuid: '83164842-6048-4686-a219-c000118844aa',
    identifier: 'gov.noaa.ncei:831648426048686',
    status: 'DRAFT',
    timestamp: '2024-05-18T14:22:00Z',
    metadataSummary: {
      platform: 'REMUS (generalized)',
      sensors: ['MultiBeam Sonar', 'EdgeTech 2200-M'],
      bbox: [-88.65, 28.52, -87.41, 29.35],
      temporal: '2024-05-01 to 2024-05-14',
    },
    rawFragment: `<gmd:title><gco:CharacterString>Point Sur 2024 Leg 18 Eagle Ray MultiBeam Sonar Data</gco:CharacterString></gmd:title>`,
    claimsCount: 4,
    candidateUxsMission: {
      id: 'PointSur_2024_Leg18',
      title: 'Point Sur 2024 Leg 18 Eagle Ray MultiBeam Sonar Data UUV Dive 01',
      platform: {
        name: 'R/V Point Sur',
        callSign: 'WCZ6236',
        type: 'research vessel',
        uxsCategory: 'UUV',
      },
      instruments: ['Eagle Ray UUV', 'MultiBeam Sonar Edgetech 2200-M'],
      spatialExtent: {
        west: -88.65,
        south: 28.52,
        east: -87.41,
        north: 29.35,
        placeName: 'Northern Gulf of Mexico, Mississippi Canyon',
      },
    },
  },
  {
    id: 'FED-UXS-02',
    authority: 'UxS Registry',
    title: 'REMUS 620 Tail #6401 Asset Record & Instrument Bay Log',
    subtitle: 'NOAA UxSO Fleet Asset Database • Operational Status: ACTIVE',
    identifier: 'UXS-FLEET-REMUS620-6401',
    status: 'ACTIVE',
    timestamp: '2025-01-15T09:00:00Z',
    metadataSummary: {
      platform: 'REMUS 620 #6401 (UUV)',
      sensors: ['Kraken MINSAS SAS', 'EdgeTech 2200-M SBP', 'DVL 600kHz'],
      temporal: 'Commissioned 2023-present',
    },
    claimsCount: 3,
    candidateUxsMission: {
      platform: {
        name: 'REMUS 620',
        callSign: 'UXS-6401',
        type: 'autonomous underwater vehicle',
        uxsCategory: 'UUV',
        physicalAssetId: '#6401',
      },
      instruments: ['REMUS 620 #6401', 'Kraken MINSAS Synthetic Aperture Sonar', 'EdgeTech 2200-M SBP'],
    },
  },
  {
    id: 'FED-STAC-03',
    authority: 'STAC',
    title: 'NOAA Ocean Exploration STAC Collection — Dive 401 Kraken SAS',
    subtitle: 'Endpoint: ocean-stac.noaa.gov • Item: remus-minsas-20250703',
    identifier: 'stac:collection:ocean-exp-dive-401',
    status: 'PUBLISHED',
    timestamp: '2025-07-04T08:00:00Z',
    metadataSummary: {
      platform: 'REMUS 620',
      sensors: ['Kraken MINSAS'],
      bbox: [-88.62, 28.54, -87.45, 29.32],
      temporal: '2025-07-03',
    },
    claimsCount: 2,
    candidateUxsMission: {
      spatialExtent: {
        west: -88.62,
        south: 28.54,
        east: -87.45,
        north: 29.32,
        placeName: 'Gulf of Mexico Dive 401 Corridor',
      },
    },
  },
  {
    id: 'FED-ONESTOP-04',
    authority: 'OneStop',
    title: 'Okeanos Explorer EX2503 Corner Rise Seamounts Baseline Collection',
    subtitle: 'OneStop Collection ID: gov.noaa.ncei:EX2503 • DSMM Score: 3.8/5.0 ★★★★☆',
    identifier: 'gov.noaa.ncei:EX2503',
    status: 'DISCOVERABLE',
    dsmmScore: 3.8,
    timestamp: '2025-08-01T12:00:00Z',
    metadataSummary: {
      platform: 'NOAA Ship Okeanos Explorer / ROV Deep Discoverer',
      sensors: ['EM304 Multibeam', 'CTD Carousel', 'ADCP 38kHz'],
      bbox: [-46.78, 31.20, -31.98, 37.87],
      temporal: '2025-03-10 to 2025-03-22',
    },
    claimsCount: 5,
  },
  {
    id: 'FED-DOCUCOMP-05',
    authority: 'DocuComp',
    title: 'DocuComp Component: NCEI Archive Branch (UUID 440b3ac2-64a5...)',
    subtitle: 'DocuComp Group: NOAA Master Component Group • Role: pointOfContact',
    uuid: '440b3ac2-64a5-46e2-9846-38305718b644',
    status: 'ACTIVE_COMPONENT',
    timestamp: '2025-03-31T14:38:07Z',
    metadataSummary: {
      platform: 'N/A (Reusable Component)',
      sensors: [],
      temporal: 'Version 4.9.0',
    },
    claimsCount: 1,
  },
];

// =========================================================================
// SIGNAL ASSURANCE FINDINGS (Mission & Profile Verification Layer)
// =========================================================================
export const SEED_SIGNAL_FINDINGS: SignalFinding[] = [
  {
    id: 'SIG-01-SPECIFICITY',
    severity: 'WARNING',
    canonicalField: 'platform.name',
    ruleName: 'NOAA UxS Marine Core v3.2 §4.2 (Platform Model & Hull ID Specificity)',
    ruleDescription: 'UxS profile requires exact vehicle model and asset identifier when uncrewed missions are documented.',
    evidenceSummary: 'UxS Inventory asserts "REMUS 620 #6401" with 0.99 confidence. CoMET legacy record only states "REMUS".',
    affectedProjections: ['ISO', 'STAC', 'OISS'],
    remediationAction: {
      label: 'Accept "REMUS 620 #6401" from UxS Inventory',
      applyValue: {
        name: 'REMUS 620',
        callSign: 'UXS-6401',
        type: 'autonomous underwater vehicle',
        uxsCategory: 'UUV',
        modelId: 'REMUS-620',
        physicalAssetId: '#6401',
      },
    },
  },
  {
    id: 'SIG-02-BBOX-VALID',
    severity: 'INFO',
    canonicalField: 'spatialExtent',
    ruleName: 'ISO 19115-2 EX_GeographicBoundingBox Geodesic Conformance',
    ruleDescription: 'Westbound longitude must be less than eastbound longitude within [-180, 180] WGS84 range.',
    evidenceSummary: 'Bounding box [-88.65°W, 28.52°S] to [-87.41°E, 29.35°N] passes strict WGS84 mathematical envelope.',
    affectedProjections: ['ISO', 'STAC', 'DCAT'],
    remediationAction: {
      label: 'Spatial extent verified',
    },
    resolved: true,
  },
  {
    id: 'SIG-03-DOCUCOMP-XLINK',
    severity: 'SUGGESTION',
    canonicalField: 'contact',
    ruleName: 'Docucomp User Guide v4.9.0 §XLink Component Reusability',
    ruleDescription: 'Prefer referencing Docucomp components as XLinks rather than inlining plain text responsible parties to maintain enterprise synchrony.',
    evidenceSummary: 'Contact matches DocuComp UUID 440b3ac2-64a5-46e2-9846-38305718b644.',
    affectedProjections: ['ISO', 'CoMET'],
    remediationAction: {
      label: 'Attach DocuComp XLink Reference',
      applyValue: 'https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644',
    },
  },
  {
    id: 'SIG-04-GCMD-SCIENCE',
    severity: 'INFO',
    canonicalField: 'keywords.gcmdScience',
    ruleName: 'GCMD Science Keyword Directory v8.6 Compliance',
    ruleDescription: 'Requires at least 2 structured GCMD science keyword paths starting with standard category domains.',
    evidenceSummary: '5 GCMD keywords verified against NASA/NOAA Global Change Master Directory thesaurus.',
    affectedProjections: ['ISO', 'DCAT'],
    remediationAction: {
      label: 'Keywords compliant',
    },
    resolved: true,
  },
];

// =========================================================================
// ROSETTA FIELD MAPPINGS (Explaining where a fact lives everywhere)
// =========================================================================
export const SEED_ROSETTA_MAPPINGS: RosettaFieldMapping[] = [
  {
    canonicalKey: 'platform.name',
    displayName: 'Platform Identity & Model',
    canonicalValue: 'REMUS 620 #6401',
    sidProfileRequirement: 'UxS Marine Core §4.1: Must distinguish platform model from physical deployment instance',
    isoXPath: 'gmi:MI_Metadata/gmi:acquisitionInformation/gmi:MI_AcquisitionInformation/gmi:platform/gmi:MI_Platform/gmi:identifier',
    docucompSlot: 'gmi:platform (DocuComp Group: OER, UUID c307df20...)',
    cometFormField: 'Identification > Resource Hierarchy > Platform [Name & CallSign]',
    stacExtensionKey: 'properties.platform (STAC Electro-Optical / Sonar Extension)',
    dcatProperty: 'dcat:theme / dct:spatial / prov:wasAssociatedWith',
    evidenceSourceCount: 3,
    status: 'DRIFT_DETECTED',
  },
  {
    canonicalKey: 'spatialExtent',
    displayName: 'Geographic Bounding Envelope',
    canonicalValue: 'West: -88.65°, South: 28.52°, East: -87.41°, North: 29.35°',
    sidProfileRequirement: 'ISO 19115-2 EX_GeographicBoundingBox: Required WGS84 bounding coordinates',
    isoXPath: 'gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox',
    docucompSlot: 'N/A (Dynamic per expedition)',
    cometFormField: 'Coverage > Spatial Extent [West, South, East, North Coordinates]',
    stacExtensionKey: 'bbox: [-88.65, 28.52, -87.41, 29.35], geometry: Polygon',
    dcatProperty: 'dcat:bbox / dct:spatial (WKT Polygon)',
    evidenceSourceCount: 2,
    status: 'SYNCHRONIZED',
  },
  {
    canonicalKey: 'instruments',
    displayName: 'Instrument Payload Bay',
    canonicalValue: ['Kraken MINSAS Synthetic Aperture Sonar', 'MultiBeam Sonar Edgetech 2200-M'],
    sidProfileRequirement: 'UxS Marine Core §5.2: Sensor specifications, model, and observable acoustic properties',
    isoXPath: 'gmi:MI_Platform/gmi:instrument/gmi:MI_Instrument/gmi:identifier',
    docucompSlot: 'gmi:instrument (DocuComp Instrument Group)',
    cometFormField: 'Identification > Keywords > Theme Keyword Descriptors / Instruments',
    stacExtensionKey: 'properties.instruments: ["minsas", "multibeam"]',
    dcatProperty: 'dcat:keyword / prov:used',
    evidenceSourceCount: 4,
    status: 'SYNCHRONIZED',
  },
  {
    canonicalKey: 'contact',
    displayName: 'Official Custodian / Responsible Party',
    canonicalValue: 'NOAA NCEI Archive Branch (UUID 440b3ac2...)',
    sidProfileRequirement: 'ISO 19115-2 CI_ResponsibleParty: Contact point for metadata and data distribution',
    isoXPath: 'gmd:MD_Metadata/gmd:contact/gmd:CI_ResponsibleParty',
    docucompSlot: 'gmd:contact (xlink:href="https://data.noaa.gov/docucomp/440b3ac2...")',
    cometFormField: 'Identification > Point of Contact > Use an Xlink',
    stacExtensionKey: 'properties.providers: [{ "name": "NOAA NCEI", "roles": ["producer", "host"] }]',
    dcatProperty: 'dct:publisher / dcat:contactPoint',
    evidenceSourceCount: 2,
    status: 'PROJECTION_READY',
  },
  {
    canonicalKey: 'keywords.gcmdScience',
    displayName: 'GCMD Science Keywords',
    canonicalValue: ['Oceans > Ocean Acoustics > Acoustic Backscatter', 'Oceans > Bathymetry/Seafloor Topography > Bathymetry'],
    sidProfileRequirement: 'NOAA Enterprise Metadata Policy: Controlled vocabulary from GCMD Science Keywords v8.6',
    isoXPath: 'gmd:MD_DataIdentification/gmd:descriptiveKeywords[gmd:MD_Keywords/gmd:thesaurusName/gmd:CI_Citation/gmd:title="Global Change Master Directory (GCMD)"]',
    docucompSlot: 'gmd:descriptiveKeywords (Thesaurus XML Snippet)',
    cometFormField: 'Keywords > Theme/Science Keyword Descriptors > Select GCMD Values',
    stacExtensionKey: 'properties.themes / keywords',
    dcatProperty: 'dcat:theme / dcat:keyword',
    evidenceSourceCount: 3,
    status: 'SYNCHRONIZED',
  },
];

// =========================================================================
// EXPECTED VS OBSERVED DRIFT COMPARISONS (For CoMET & Destination Ingest)
// =========================================================================
export const SEED_EXPECTED_VS_OBSERVED: ExpectedVsObservedDiff[] = [
  {
    field: 'Platform Name / Specificity',
    expectedValue: 'REMUS 620 #6401',
    observedValue: 'REMUS',
    driftType: 'SPECIFICITY_DRIFT',
    suggestedAction: 'Keep Canonical MANTAS value (REMUS 620 #6401) with inventory provenance link.',
  },
  {
    field: 'Instrument Naming',
    expectedValue: 'Kraken MINSAS Synthetic Aperture Sonar',
    observedValue: 'Kraken MINSAS',
    driftType: 'VOCABULARY_TRANSLATION',
    suggestedAction: 'Translate to standard GCMD instrument identifier upon CoMET submission.',
  },
  {
    field: 'Responsible Party Representation',
    expectedValue: 'DocuComp XLink (uuid: 440b3ac2-64a5-46e2-9846-38305718b644)',
    observedValue: 'Inlined text "<gmd:organisationName>National Centers for Environmental Information</gmd:organisationName>"',
    driftType: 'SPECIFICITY_DRIFT',
    suggestedAction: 'Inject DocuComp XLink reference to prevent redundant copy-paste text drift.',
  },
];
