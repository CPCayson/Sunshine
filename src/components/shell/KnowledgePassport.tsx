import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Key,
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  GitBranch,
  Cpu,
  Box,
  Binary,
  Anchor,
  AlertTriangle,
  FileSpreadsheet,
  Compass,
  FileText,
  Activity,
  Workflow
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  UxSMission,
  WorkspaceSelection,
  ProvenanceType
} from '../../types';
import { CompactAccordion } from './CompactAccordion';
import { getCapabilityMaturity } from '../../services/identityResolutionService';

export interface KnowledgePassportProps {
  selection: WorkspaceSelection;
  mission: UxSMission;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
  onSelectEntity?: (entityKey: string) => void;
}

interface PassportEntityData {
  id: string;
  name: string;
  kind: 'PLATFORM_MODEL' | 'PHYSICAL_ASSET' | 'INSTRUMENT_MODEL' | 'PHYSICAL_INSTRUMENT';
  knowledgeKey: string;
  provider: {
    name: string;
    rorId?: string;
    role: string;
  };
  provenanceType: ProvenanceType;
  provenanceAuthority: string;
  ledgerAnchor: string;
  operationalStatus: string;
  aliases: Array<{
    alias: string;
    authority: string;
    confidence: number;
    predicate: string;
    status: 'EXACT' | 'STRONG' | 'WEAK_HELD';
    notes?: string;
  }>;
  physicalAssets?: Array<{
    label: string;
    serial: string;
    barcode: string;
    owner: string;
    status: string;
    predicate: string;
    calibratedDate?: string;
    location?: string;
  }>;
  configurations: Array<{
    slotOrBay: string;
    targetEntity: string;
    targetKey: string;
    predicate: string;
    verificationSource: string;
    status: 'VERIFIED' | 'NOMINAL' | 'PENDING';
  }>;
  engineeringEnvelope?: Array<{
    instrumentModel: string;
    predicate: string;
    specs: string;
  }>;
  deployments: Array<{
    id: string;
    title: string;
    duration: string;
    depthRange: string;
    carriedOrHost: string;
    predicate: string;
    date: string;
  }>;
  producedDatasets: Array<{
    name: string;
    format: string;
    observedProperty: string;
    scienceDomain: string;
    predicate: string;
    stacAssetKey: string;
  }>;
  truthBoundaries: {
    positiveFacts: string[];
    negativeInvariants: string[];
  };
}

const PASSPORT_REGISTRY: Record<string, PassportEntityData> = {
  'plat-model-remus620': {
    id: 'plat-model-remus620',
    name: 'REMUS 620 Autonomous Vehicle Model',
    kind: 'PLATFORM_MODEL',
    knowledgeKey: 'KK:platform-model:remus-620',
    provider: {
      name: 'Huntington Ingalls Industries (HII) / Hydroid',
      rorId: 'https://ror.org/05c2j9v74',
      role: 'Vehicle Prime Manufacturer & System Integrator'
    },
    provenanceType: 'IMPORTED_ARTIFACT',
    provenanceAuthority: 'NOAA OMAO UxSO Fleet Registry CY2025',
    ledgerAnchor: 'Block L-000184 (c586116ea982)',
    operationalStatus: 'PRODUCTION_PLATFORM',
    aliases: [
      {
        alias: 'HII REMUS-620',
        authority: 'NOAA UxSO Fleet Registry CY2025',
        confidence: 1.0,
        predicate: 'skos:exactMatch',
        status: 'EXACT',
        notes: 'Primary registry label matching contract specification'
      },
      {
        alias: 'REMUS620',
        authority: 'ISO-19115 Draft Template',
        confidence: 0.95,
        predicate: 'skos:closeMatch',
        status: 'STRONG',
        notes: 'Normalized camelcase without hyphen in legacy intake'
      },
      {
        alias: 'REMUS 620 UUV',
        authority: 'US Navy Operational Manual',
        confidence: 0.92,
        predicate: 'manta:hasAlias',
        status: 'STRONG'
      },
      {
        alias: '"REMUS"',
        authority: 'CoMET CEDIT Generic Registry',
        confidence: 0.62,
        predicate: 'manta:hasTentativeAlias',
        status: 'WEAK_HELD',
        notes: 'Ambiguous without hull or class model designator; held until resolved'
      }
    ],
    physicalAssets: [
      {
        label: 'REMUS 620 Hull #6401',
        serial: '6401',
        barcode: 'NOAA-UXS-6401',
        owner: 'NOAA OMAO / Ocean Exploration',
        status: 'ACTIVE DEPLOYED',
        predicate: 'manta:hasPhysicalAsset',
        location: 'NOAA MOC-P Newport, OR'
      },
      {
        label: 'REMUS 620 Hull #6402',
        serial: '6402',
        barcode: 'NOAA-UXS-6402',
        owner: 'Navy USM / Shared Custody',
        status: 'IN RESERVE (STAGING)',
        predicate: 'manta:hasPhysicalAsset',
        location: 'Stennis Space Center, MS'
      }
    ],
    configurations: [
      {
        slotOrBay: 'Mid-Section 0.18m³ Payload Bay',
        targetEntity: 'Kraken MINSAS SN #204',
        targetKey: 'KK:instrument-instance:kraken:minsas:204',
        predicate: 'manta:configuredWith',
        verificationSource: 'NOAA Deck Readiness Sheet CY25',
        status: 'VERIFIED'
      },
      {
        slotOrBay: 'Forward Optical Compartment',
        targetEntity: 'Voyis Insight Pro SN #088',
        targetKey: 'KK:instrument-instance:voyis:insight:088',
        predicate: 'manta:configuredWith',
        verificationSource: 'NOAA Deck Readiness Sheet CY25',
        status: 'VERIFIED'
      },
      {
        slotOrBay: 'Internal Mast Integration',
        targetEntity: 'Sea-Bird SBE49 FastCAT CTD',
        targetKey: 'KK:instrument-model:seabird:sbe49',
        predicate: 'manta:configuredWith',
        verificationSource: 'Standard OEM Avionics Manifest',
        status: 'VERIFIED'
      }
    ],
    engineeringEnvelope: [
      {
        instrumentModel: 'Kraken MINSAS-120 Synthetic Aperture Sonar',
        predicate: 'manta:canCarry',
        specs: 'Power envelope: 120W nominal, Ethernet interface, dry weight 38kg'
      },
      {
        instrumentModel: 'Voyis Insight Pro 3D Optical Scanner',
        predicate: 'manta:canCarry',
        specs: 'Dual-laser line projector + 12MP stills photogrammetry'
      },
      {
        instrumentModel: 'Sea-Bird SBE49 FastCAT CTD',
        predicate: 'manta:canCarry',
        specs: '16Hz sampling conductivity/temperature sensor'
      }
    ],
    deployments: [
      {
        id: 'EN2501-DIVE-01',
        title: 'EN2501 Dive 01 (Penguin Bank SAS Survey)',
        duration: '14.2h pinging',
        depthRange: '50m - 220m',
        carriedOrHost: 'Carried Kraken MINSAS SN #204, Voyis Insight Pro',
        predicate: 'manta:employedAsset',
        date: '2025-02-18'
      },
      {
        id: 'EN2501-DIVE-02',
        title: 'EN2501 Dive 02 (Kaiwi Trough Deep Survey)',
        duration: '18.5h duration',
        depthRange: '400m - 1,250m',
        carriedOrHost: 'Carried Kraken MINSAS SN #204',
        predicate: 'manta:employedAsset',
        date: '2025-02-21'
      }
    ],
    producedDatasets: [
      {
        name: 'Acoustic Backscatter GeoTIFF Mosaic (EN2501_D01_Backscatter_50cm.tif)',
        format: 'Cloud Optimized GeoTIFF (COG)',
        observedProperty: 'Acoustic Backscatter Intensity (dB)',
        scienceDomain: 'Seafloor Hydrography & Benthic Characterization',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'backscatter_mosaic'
      },
      {
        name: 'Bathymetry BAG Gridded Surface (EN2501_D01_Bathy_1m.bag)',
        format: 'Bathymetric Attributed Grid (BAG)',
        observedProperty: 'Seafloor Depth & Elevation (m)',
        scienceDomain: 'Navigation Safety & Marine Geology',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'bathymetry_bag'
      }
    ],
    truthBoundaries: {
      positiveFacts: [
        'Vehicle model is rated for up to 1,500m depth rating in standard syntactic foam packaging.',
        'Mid-section bay interface has verified 48V auxiliary power rail and gigabit Ethernet bus.',
        'Hull #6401 was verified as active NOAA OMAO inventory in CY2025.'
      ],
      negativeInvariants: [
        'Hull #6401 is NOT rated for full ocean depth (6,000m) abyssal missions.',
        'Vehicle model does NOT carry hull-mounted Kongsberg EM304 deepwater sonar (reserved for shipboard hulls).',
        'Cannot be operated without active acoustic transponder beacon (USBL track guard).'
      ]
    }
  },

  'asset-remus-6401': {
    id: 'asset-remus-6401',
    name: 'REMUS 620 Hull #6401 Physical Asset',
    kind: 'PHYSICAL_ASSET',
    knowledgeKey: 'KK:physical-asset:remus-620:6401',
    provider: {
      name: 'Huntington Ingalls Industries (HII) / Hydroid',
      rorId: 'https://ror.org/05c2j9v74',
      role: 'Asset Custodian: NOAA OMAO UxSO'
    },
    provenanceType: 'LIVE_OBSERVED',
    provenanceAuthority: 'NOAA OMAO Fleet Inventory & EN2501 Deck Log',
    ledgerAnchor: 'Block L-000184 (c586116ea982)',
    operationalStatus: 'ACTIVE DEPLOYED (MISSION READY)',
    aliases: [
      {
        alias: 'Hull #6401',
        authority: 'NOAA Cruise Log EN2501',
        confidence: 1.0,
        predicate: 'skos:exactMatch',
        status: 'EXACT'
      },
      {
        alias: 'REMUS-6401',
        authority: 'Navy Custody Record (2020)',
        confidence: 0.98,
        predicate: 'owl:sameAs',
        status: 'EXACT',
        notes: 'Prior custody tag preserved with provenance history'
      },
      {
        alias: 'NOAA-UXS-6401',
        authority: 'Barcode Asset Tag',
        confidence: 1.0,
        predicate: 'manta:hasBarcodeTag',
        status: 'EXACT'
      }
    ],
    physicalAssets: [
      {
        label: 'REMUS 620 Hull #6401',
        serial: '6401',
        barcode: 'NOAA-UXS-6401',
        owner: 'NOAA OMAO',
        status: 'ACTIVE ON MISSION',
        predicate: 'manta:isPhysicalInstanceOf',
        location: 'R/V Endeavor Aft Deck'
      }
    ],
    configurations: [
      {
        slotOrBay: 'Mid-Section 0.18m³ Bay',
        targetEntity: 'Kraken MINSAS SN #204',
        targetKey: 'KK:instrument-instance:kraken:minsas:204',
        predicate: 'manta:configuredWith',
        verificationSource: 'Deck Inspection Logbook 2025-02-17',
        status: 'VERIFIED'
      },
      {
        slotOrBay: 'Forward Bay',
        targetEntity: 'Voyis Insight Pro SN #088',
        targetKey: 'KK:instrument-instance:voyis:insight:088',
        predicate: 'manta:configuredWith',
        verificationSource: 'Pre-dive Checkout 2025-02-18',
        status: 'VERIFIED'
      }
    ],
    deployments: [
      {
        id: 'EN2501-DIVE-01',
        title: 'EN2501 Dive 01',
        duration: '14.2h underway',
        depthRange: '50m - 220m',
        carriedOrHost: 'Carried Kraken MINSAS SN #204',
        predicate: 'manta:deployedIn',
        date: '2025-02-18'
      },
      {
        id: 'EN2501-DIVE-02',
        title: 'EN2501 Dive 02',
        duration: '18.5h underway',
        depthRange: '400m - 1,250m',
        carriedOrHost: 'Carried Kraken MINSAS SN #204',
        predicate: 'manta:deployedIn',
        date: '2025-02-21'
      }
    ],
    producedDatasets: [
      {
        name: 'Acoustic Backscatter GeoTIFF Mosaic',
        format: 'Cloud Optimized GeoTIFF',
        observedProperty: 'Acoustic Backscatter',
        scienceDomain: 'Seafloor Mapping',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'backscatter_mosaic'
      },
      {
        name: 'Bathymetry BAG Gridded Surface (1m)',
        format: 'BAG',
        observedProperty: 'Bathymetry',
        scienceDomain: 'Hydrography',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'bathymetry_bag'
      }
    ],
    truthBoundaries: {
      positiveFacts: [
        'Hull #6401 was physically verified aboard R/V Endeavor during EN2501 cruise.',
        'Pre-dive ballasting was completed for 1,026 kg/m³ seawater density.',
        'Internal inertial navigation system (INS) calibrated against dockside RTK-GPS.'
      ],
      negativeInvariants: [
        'Hull #6401 has not undergone deep-submergence pressure recertification beyond 1,500m.',
        'Not cleared for autonomous surface transit in heavy shipping corridors without chase boat.'
      ]
    }
  },

  'inst-model-minsas': {
    id: 'inst-model-minsas',
    name: 'Kraken MINSAS-120 Synthetic Aperture Sonar Model',
    kind: 'INSTRUMENT_MODEL',
    knowledgeKey: 'KK:instrument-model:kraken:minsas-120',
    provider: {
      name: 'Kraken Robotics Inc.',
      rorId: 'https://ror.org/037m4bk91',
      role: 'Sensor Manufacturer'
    },
    provenanceType: 'IMPORTED_ARTIFACT',
    provenanceAuthority: 'Kraken Robotics Technical Specification Spec-MINSAS120-R4',
    ledgerAnchor: 'Block L-000184 (c586116ea982)',
    operationalStatus: 'ACTIVE SENSOR SPEC',
    aliases: [
      {
        alias: 'Kraken MINSAS-120',
        authority: 'Manufacturer Registry',
        confidence: 1.0,
        predicate: 'skos:exactMatch',
        status: 'EXACT'
      },
      {
        alias: 'MINSAS-120',
        authority: 'NOAA Dive Log EN2501',
        confidence: 0.98,
        predicate: 'skos:closeMatch',
        status: 'STRONG'
      },
      {
        alias: 'MINSAS',
        authority: 'Charlie Intake Deck Sheet',
        confidence: 0.88,
        predicate: 'manta:hasAlias',
        status: 'STRONG',
        notes: 'Model prefix without variant designator'
      },
      {
        alias: '337kHz SAS',
        authority: 'Payload Acoustic Description',
        confidence: 0.82,
        predicate: 'manta:hasAcousticDesignation',
        status: 'STRONG'
      }
    ],
    physicalAssets: [
      {
        label: 'Kraken MINSAS SN #204',
        serial: '204',
        barcode: 'KRK-SAS-0204',
        owner: 'NOAA Ocean Exploration / OMAO',
        status: 'INSTALLED & PINGING',
        predicate: 'manta:hasPhysicalInstance',
        calibratedDate: '2024-11-12',
        location: 'Installed in REMUS 620 Hull #6401 Mid-Bay'
      },
      {
        label: 'Kraken MINSAS SN #205',
        serial: '205',
        barcode: 'KRK-SAS-0205',
        owner: 'NOAA OMAO / MOC-P',
        status: 'BENCH RESERVE',
        predicate: 'manta:hasPhysicalInstance',
        calibratedDate: '2024-06-08',
        location: 'Newport Marine Facility Calibration Bay'
      }
    ],
    configurations: [
      {
        slotOrBay: 'Mid-Section 0.18m³ Bay Host',
        targetEntity: 'REMUS 620 Hull #6401',
        targetKey: 'KK:physical-asset:remus-620:6401',
        predicate: 'manta:configuredOn',
        verificationSource: 'NOAA Deck Readiness Sheet CY25',
        status: 'VERIFIED'
      },
      {
        slotOrBay: 'Vehicle Class Compatibility',
        targetEntity: 'REMUS 620 Autonomous Vehicle Model',
        targetKey: 'KK:platform-model:remus-620',
        predicate: 'manta:canBeCarriedBy',
        verificationSource: 'HII Integration Engineering Guide',
        status: 'VERIFIED'
      }
    ],
    engineeringEnvelope: [
      {
        instrumentModel: 'Acoustic Transducer Array (337 kHz)',
        predicate: 'manta:hasTransducerBand',
        specs: 'Center frequency: 337 kHz | Bandwidth: 30 kHz | Swath width: up to 300m total'
      },
      {
        instrumentModel: 'Real-Time SAS Beamformer (INS Integrated)',
        predicate: 'manta:requiresAvionics',
        specs: 'Requires sub-millimeter motion compensation from vehicle INS'
      }
    ],
    deployments: [
      {
        id: 'EN2501-DIVE-01',
        title: 'EN2501 Dive 01 (Penguin Bank)',
        duration: '14.2h continuous pinging',
        depthRange: '50m - 220m',
        carriedOrHost: 'Host Vehicle: REMUS 620 Hull #6401',
        predicate: 'manta:carriedInDeployment',
        date: '2025-02-18'
      },
      {
        id: 'EN2501-DIVE-02',
        title: 'EN2501 Dive 02 (Kaiwi Trough Deep)',
        duration: '18.5h continuous pinging',
        depthRange: '400m - 1,250m',
        carriedOrHost: 'Host Vehicle: REMUS 620 Hull #6401',
        predicate: 'manta:carriedInDeployment',
        date: '2025-02-21'
      }
    ],
    producedDatasets: [
      {
        name: 'Acoustic Backscatter GeoTIFF Mosaic (EN2501_D01_Backscatter_50cm.tif)',
        format: 'GeoTIFF',
        observedProperty: 'Synthetic Aperture Acoustic Backscatter',
        scienceDomain: 'High-Resolution Seafloor Habitat Mapping',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'backscatter_mosaic'
      },
      {
        name: 'Micro-Bathymetry BAG Surface (EN2501_D01_Bathy_1m.bag)',
        format: 'BAG',
        observedProperty: 'Interferometric SAS Micro-Bathymetry',
        scienceDomain: 'Seafloor Geomorphology',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'bathymetry_bag'
      }
    ],
    truthBoundaries: {
      positiveFacts: [
        'Delivers 3.0cm along-track and 3.0cm across-track resolution at 150m range per side.',
        'Compliant with IHO S-44 Exclusive Order hydrographic survey specifications.',
        'Integrated with subsea dry-mate high-speed optical link.'
      ],
      negativeInvariants: [
        'Does NOT operate in passive listening or low-frequency sub-bottom profiling mode.',
        'Requires minimum forward vehicle velocity of 2.5 knots to synthesize the synthetic aperture.'
      ]
    }
  },

  'inst-asset-minsas-204': {
    id: 'inst-asset-minsas-204',
    name: 'Kraken MINSAS SN #204 Physical Instrument Unit',
    kind: 'PHYSICAL_INSTRUMENT',
    knowledgeKey: 'KK:instrument-instance:kraken:minsas:204',
    provider: {
      name: 'Kraken Robotics Inc.',
      rorId: 'https://ror.org/037m4bk91',
      role: 'Owner: NOAA Ocean Exploration'
    },
    provenanceType: 'LIVE_OBSERVED',
    provenanceAuthority: 'EN2501 Pre-Dive Serial Inspection Log',
    ledgerAnchor: 'Block L-000184 (c586116ea982)',
    operationalStatus: 'ACTIVE IN SERVICE',
    aliases: [
      {
        alias: 'MINSAS SN-204',
        authority: 'Equipment Nameplate',
        confidence: 1.0,
        predicate: 'skos:exactMatch',
        status: 'EXACT'
      },
      {
        alias: 'KRK-SAS-0204',
        authority: 'NOAA Barcode System',
        confidence: 1.0,
        predicate: 'manta:hasBarcodeTag',
        status: 'EXACT'
      }
    ],
    physicalAssets: [
      {
        label: 'MINSAS Unit #204',
        serial: '204',
        barcode: 'KRK-SAS-0204',
        owner: 'NOAA Ocean Exploration',
        status: 'INSTALLED',
        predicate: 'manta:isPhysicalInstanceOf',
        calibratedDate: '2024-11-12'
      }
    ],
    configurations: [
      {
        slotOrBay: 'REMUS 620 Hull #6401 Mid-Body Bay',
        targetEntity: 'REMUS 620 Hull #6401',
        targetKey: 'KK:physical-asset:remus-620:6401',
        predicate: 'manta:configuredOn',
        verificationSource: 'EN2501 Pre-Dive Deck Log',
        status: 'VERIFIED'
      }
    ],
    deployments: [
      {
        id: 'EN2501-DIVE-01',
        title: 'EN2501 Dive 01',
        duration: '14.2h underway',
        depthRange: '50m - 220m',
        carriedOrHost: 'Carried by REMUS 620 Hull #6401',
        predicate: 'manta:carriedInDeployment',
        date: '2025-02-18'
      },
      {
        id: 'EN2501-DIVE-02',
        title: 'EN2501 Dive 02',
        duration: '18.5h underway',
        depthRange: '400m - 1,250m',
        carriedOrHost: 'Carried by REMUS 620 Hull #6401',
        predicate: 'manta:carriedInDeployment',
        date: '2025-02-21'
      }
    ],
    producedDatasets: [
      {
        name: 'EN2501_D01_Backscatter_50cm.tif',
        format: 'Cloud Optimized GeoTIFF',
        observedProperty: 'Acoustic Backscatter',
        scienceDomain: 'Seafloor Mapping',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'backscatter_mosaic'
      },
      {
        name: 'EN2501_D01_Bathy_1m.bag',
        format: 'BAG',
        observedProperty: 'Micro-Bathymetry',
        scienceDomain: 'Hydrography',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'bathymetry_bag'
      }
    ],
    truthBoundaries: {
      positiveFacts: [
        'Unit SN #204 passed wet pressure tank testing up to 200 bar (2,000m equivalent).',
        'Hydrophone array sensitivity verified within ±0.4 dB across 322-352 kHz band.'
      ],
      negativeInvariants: [
        'Transducer array face must not be exposed to direct acetone or petroleum solvents.'
      ]
    }
  },

  'inst-model-voyis': {
    id: 'inst-model-voyis',
    name: 'Voyis Insight Pro 3D Optical Laser System',
    kind: 'INSTRUMENT_MODEL',
    knowledgeKey: 'KK:instrument-model:voyis:insight-pro',
    provider: {
      name: 'Voyis Imaging Inc.',
      rorId: 'https://ror.org/02vwyq274',
      role: 'Underwater Optical Sensor Provider'
    },
    provenanceType: 'IMPORTED_ARTIFACT',
    provenanceAuthority: 'Voyis Imaging Technical Manual Rev 3.2',
    ledgerAnchor: 'Block L-000184 (c586116ea982)',
    operationalStatus: 'ACTIVE SENSOR SPEC',
    aliases: [
      {
        alias: 'Voyis Insight Pro',
        authority: 'Manufacturer Spec',
        confidence: 1.0,
        predicate: 'skos:exactMatch',
        status: 'EXACT'
      },
      {
        alias: 'InsightPro 3D Laser',
        authority: 'NOAA Sensor Registry',
        confidence: 0.94,
        predicate: 'skos:closeMatch',
        status: 'STRONG'
      }
    ],
    physicalAssets: [
      {
        label: 'Voyis Insight Pro SN #088',
        serial: '088',
        barcode: 'VOY-INS-0088',
        owner: 'NOAA OMAO',
        status: 'INSTALLED',
        predicate: 'manta:hasPhysicalInstance',
        location: 'REMUS 620 Forward Dome'
      }
    ],
    configurations: [
      {
        slotOrBay: 'Forward Optical Dome',
        targetEntity: 'REMUS 620 Hull #6401',
        targetKey: 'KK:physical-asset:remus-620:6401',
        predicate: 'manta:configuredOn',
        verificationSource: 'EN2501 Sensor Deck Checklist',
        status: 'VERIFIED'
      }
    ],
    deployments: [
      {
        id: 'EN2501-DIVE-01',
        title: 'EN2501 Dive 01',
        duration: '6.4h laser acquisition',
        depthRange: '50m - 120m',
        carriedOrHost: 'Host: REMUS 620 Hull #6401',
        predicate: 'manta:carriedInDeployment',
        date: '2025-02-18'
      }
    ],
    producedDatasets: [
      {
        name: 'EN2501_D01_Voyis_DenseCloud.las',
        format: 'LAS 1.4 Point Cloud',
        observedProperty: 'Sub-millimeter Seafloor Topography',
        scienceDomain: 'Marine Archaeology & Coral Reef Ecology',
        predicate: 'manta:producedDataset',
        stacAssetKey: 'optical_pointcloud'
      }
    ],
    truthBoundaries: {
      positiveFacts: [
        'Produces calibrated subsea true-color photogrammetry and structured laser scan.',
        'Synchronized LED strobe pulse rate up to 10 Hz.'
      ],
      negativeInvariants: [
        'Laser scanning range is optically constrained to ≤7m altitude in clear oceanic water.'
      ]
    }
  }
};

export const KnowledgePassport: React.FC<KnowledgePassportProps> = ({
  selection,
  mission,
  onNavigateTab,
  onSelectEntity
}) => {
  // Determine active profile from selection or fallback
  const resolvedProfileKey = useMemo(() => {
    const selName = (selection.entityName || '').toLowerCase();
    const selType = (selection.entityType || '').toLowerCase();
    const selRef = (selection.canonicalRef || '').toLowerCase();

    if (selName.includes('204') || selRef.includes('204')) return 'inst-asset-minsas-204';
    if (selName.includes('minsas') || selName.includes('sas') || selRef.includes('minsas')) return 'inst-model-minsas';
    if (selName.includes('voyis') || selRef.includes('voyis')) return 'inst-model-voyis';
    if (selName.includes('6401') || selRef.includes('6401') || selType === 'physicalasset') return 'asset-remus-6401';
    return 'plat-model-remus620';
  }, [selection.entityName, selection.entityType, selection.canonicalRef]);

  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(resolvedProfileKey);

  // Sync if selection changes externally
  React.useEffect(() => {
    setSelectedEntityKey(resolvedProfileKey);
  }, [resolvedProfileKey]);

  const entity = PASSPORT_REGISTRY[selectedEntityKey] || PASSPORT_REGISTRY['plat-model-remus620'];
  const maturity = getCapabilityMaturity('plat-model-remus620', 'inst-model-minsas');

  const handleEntitySwitch = (key: string) => {
    setSelectedEntityKey(key);
    if (onSelectEntity) onSelectEntity(key);
  };

  const getKindColor = (kind: PassportEntityData['kind']) => {
    switch (kind) {
      case 'PLATFORM_MODEL':
        return 'bg-cyan-950 text-cyan-300 border-cyan-700';
      case 'PHYSICAL_ASSET':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'INSTRUMENT_MODEL':
        return 'bg-purple-950 text-purple-300 border-purple-700';
      case 'PHYSICAL_INSTRUMENT':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs text-slate-300">
      {/* Entity Switcher Toolbar */}
      <div className="p-2 bg-[#061022] rounded-lg border border-cyan-500/20 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
          <span>Entity Passport Catalog</span>
          <span className="text-cyan-400 text-[9px]">Click to Inspect</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.values(PASSPORT_REGISTRY).map((item) => (
            <button
              key={item.id}
              onClick={() => handleEntitySwitch(item.id)}
              className={`px-2 py-1 rounded text-[10px] font-sans font-semibold transition-all border ${
                selectedEntityKey === item.id
                  ? 'bg-cyan-900/60 text-cyan-200 border-cyan-400 shadow'
                  : 'bg-[#040914] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              {item.name.split(' ')[0]} {item.kind === 'PHYSICAL_ASSET' ? '#6401' : item.kind === 'PHYSICAL_INSTRUMENT' ? '#204' : item.name.includes('SAS') ? 'SAS' : item.name.includes('Voyis') ? 'Voyis' : '620'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Identity Card */}
      <div className="p-3.5 bg-[#071328] rounded-xl border-2 border-cyan-500/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getKindColor(entity.kind)}`}>
            {entity.kind}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
            {entity.operationalStatus}
          </span>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-100 font-sans leading-tight">
            {entity.name}
          </h2>
          <div className="text-[10px] text-cyan-300 break-all bg-black/40 p-1 rounded border border-cyan-900/50 mt-1 font-mono">
            {entity.knowledgeKey}
          </div>
        </div>

        <div className="space-y-1 text-[11px] pt-1 border-t border-slate-800/80">
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-400 shrink-0">Provider:</span>
            <span className="text-slate-200 font-sans font-semibold text-right">
              {entity.provider.name}
            </span>
          </div>
          {entity.provider.rorId && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">ROR Registry:</span>
              <a
                href={entity.provider.rorId}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-1 font-mono"
              >
                <span>{entity.provider.rorId.replace('https://', '')}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Authority:</span>
            <span className="text-slate-300">{entity.provenanceAuthority}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Ledger Block:</span>
            <span className="text-purple-300 font-mono text-[10px]">{entity.ledgerAnchor}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
        <button
          onClick={() => onNavigateTab && onNavigateTab('knowledge-tree')}
          className="p-2 rounded-lg bg-[#0b1b36] hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/60 text-center transition-colors flex items-center justify-center gap-1"
        >
          <GitBranch className="w-3 h-3" />
          <span>KNOWLEDGE TREE</span>
        </button>
        <button
          onClick={() => onNavigateTab && onNavigateTab('graph')}
          className="p-2 rounded-lg bg-[#0b1b36] hover:bg-cyan-900/40 text-emerald-300 border border-emerald-800/60 text-center transition-colors flex items-center justify-center gap-1"
        >
          <Compass className="w-3 h-3" />
          <span>TRACE GRAPH</span>
        </button>
        <button
          onClick={() => onNavigateTab && onNavigateTab('evidence')}
          className="p-2 rounded-lg bg-[#0b1b36] hover:bg-cyan-900/40 text-purple-300 border border-purple-800/60 text-center transition-colors flex items-center justify-center gap-1"
        >
          <Database className="w-3 h-3" />
          <span>EVIDENCE REFS</span>
        </button>
      </div>

      {/* 1. Aliases & Candidate Labels */}
      <CompactAccordion
        title="Aliases & Candidate Labels"
        count={entity.aliases.length}
        badge={{ label: 'MAPPED', variant: 'cyan' }}
        defaultExpanded
      >
        <div className="space-y-2 text-[11px]">
          {entity.aliases.map((al, idx) => (
            <div
              key={idx}
              className="p-2 rounded bg-[#050e1c] border border-slate-800/80 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 font-sans">{al.alias}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    al.status === 'EXACT'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : al.status === 'STRONG'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {al.status} ({Math.round(al.confidence * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Authority: <span className="text-slate-300">{al.authority}</span></span>
                <span className="text-cyan-400 font-mono">{al.predicate}</span>
              </div>
              {al.notes && (
                <div className="text-[10px] text-slate-400 italic pt-0.5 border-t border-slate-800/50">
                  {al.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CompactAccordion>

      {/* 2. Known Physical Assets / Serial Instances */}
      {entity.physicalAssets && entity.physicalAssets.length > 0 && (
        <CompactAccordion
          title={entity.kind.includes('INSTRUMENT') ? 'Physical Serial Units' : 'Known Physical Assets'}
          count={entity.physicalAssets.length}
          badge={{ label: 'VERIFIED', variant: 'emerald' }}
          defaultExpanded
        >
          <div className="space-y-2 text-[11px]">
            {entity.physicalAssets.map((pa, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#050e1c] rounded-lg border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{pa.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    {pa.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Serial: <code className="text-cyan-300">{pa.serial}</code> | Barcode: <code className="text-slate-300">{pa.barcode}</code>
                </div>
                <div className="text-[10px] text-slate-400">
                  Owner: <span className="text-slate-200">{pa.owner}</span>
                </div>
                {pa.location && (
                  <div className="text-[10px] text-slate-400">
                    Location: <span className="text-cyan-300">{pa.location}</span>
                  </div>
                )}
                {pa.calibratedDate && (
                  <div className="text-[10px] text-slate-400">
                    Calibration Date: <span className="text-amber-300">{pa.calibratedDate}</span>
                  </div>
                )}
                <div className="text-[9px] text-slate-500 font-mono pt-0.5">
                  Predicate: <code className="text-purple-300">{pa.predicate}</code>
                </div>
              </div>
            ))}
          </div>
        </CompactAccordion>
      )}

      {/* 3. Known Physical Configurations & Chassis Bays */}
      <CompactAccordion
        title="Known Configurations (Chassis & Bays)"
        count={entity.configurations.length}
        badge={{ label: 'CHASSIS', variant: 'amber' }}
        defaultExpanded
      >
        <div className="space-y-2 text-[11px]">
          {entity.configurations.map((cfg, idx) => (
            <div
              key={idx}
              className="p-2 bg-[#061022] rounded-lg border border-slate-800/80 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold">{cfg.slotOrBay}</span>
                <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {cfg.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="text-purple-300 text-[10px] font-mono">{cfg.predicate}</span>
                <span>→</span>
                <span className="font-bold">{cfg.targetEntity}</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                Key: <code className="text-slate-300">{cfg.targetKey}</code>
              </div>
              <div className="text-[9px] text-slate-500">
                Verified: {cfg.verificationSource}
              </div>
            </div>
          ))}
        </div>
      </CompactAccordion>

      {/* 4. Engineering Capabilities Envelope (if platform) */}
      {entity.engineeringEnvelope && entity.engineeringEnvelope.length > 0 && (
        <CompactAccordion
          title="Engineering Capabilities (CAN_CARRY)"
          count={entity.engineeringEnvelope.length}
          badge={{ label: 'SPEC', variant: 'purple' }}
        >
          <div className="space-y-1.5 text-[11px]">
            {entity.engineeringEnvelope.map((env, idx) => (
              <div key={idx} className="p-2 rounded bg-[#09152b] border border-slate-800 space-y-0.5">
                <div className="text-cyan-300 font-semibold">{env.instrumentModel}</div>
                <div className="text-[10px] text-purple-300 font-mono">Predicate: {env.predicate}</div>
                <div className="text-[10px] text-slate-400 font-sans">{env.specs}</div>
              </div>
            ))}
          </div>
        </CompactAccordion>
      )}

      {/* 5. Actual Deployment History */}
      <CompactAccordion
        title="Deployment History"
        count={entity.deployments.length}
        badge={{ label: 'CARRIED', variant: 'emerald' }}
        defaultExpanded
      >
        <div className="space-y-2 text-[11px]">
          {entity.deployments.map((dep, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#09152b] border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{dep.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{dep.date}</span>
              </div>
              <div className="text-[10px] text-slate-300">
                Duration: <strong className="text-emerald-300">{dep.duration}</strong> | Depth: <strong className="text-cyan-300">{dep.depthRange}</strong>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {dep.carriedOrHost}
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Predicate: <code className="text-cyan-400">{dep.predicate}</code>
              </div>
            </div>
          ))}
        </div>
      </CompactAccordion>

      {/* 6. Produced Datasets & Science Lineage */}
      <CompactAccordion
        title="Produced Datasets & Science Lineage"
        count={entity.producedDatasets.length}
        badge={{ label: 'PRODUCED', variant: 'cyan' }}
        defaultExpanded
      >
        <div className="space-y-2 text-[11px]">
          {entity.producedDatasets.map((ds, idx) => (
            <div key={idx} className="p-2 bg-[#061022] rounded-lg border border-slate-800 space-y-1">
              <div className="font-bold text-slate-100 font-sans truncate">{ds.name}</div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Format: <strong className="text-slate-200">{ds.format}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-[#040914] text-cyan-300 border border-slate-800 text-[9px] font-mono">
                  {ds.stacAssetKey}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Observed: <span className="text-emerald-300">{ds.observedProperty}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Science: <span className="text-purple-300">{ds.scienceDomain}</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Predicate: <code className="text-cyan-400">{ds.predicate}</code>
              </div>
            </div>
          ))}
        </div>
      </CompactAccordion>

      {/* 7. Capability Evidence Maturity */}
      <CompactAccordion
        title="Capability Evidence Maturity"
        badge={{ label: maturity?.overallMaturity || 'DATA_PROVEN', variant: 'emerald' }}
      >
        <div className="space-y-1.5 text-xs">
          <div className="p-2 rounded bg-[#050e1c] flex items-center justify-between">
            <span className="text-slate-300">POTENTIAL (Provider Spec):</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED</span>
            </span>
          </div>
          <div className="p-2 rounded bg-[#050e1c] flex items-center justify-between">
            <span className="text-slate-300">CONFIGURED (Deck Inventory):</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED</span>
            </span>
          </div>
          <div className="p-2 rounded bg-[#050e1c] flex items-center justify-between">
            <span className="text-slate-300">DEPLOYED (Underway Log):</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED</span>
            </span>
          </div>
          <div className="p-2 rounded bg-[#050e1c] flex items-center justify-between">
            <span className="text-slate-300">DATA_PROVEN (Archived Dataset):</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED</span>
            </span>
          </div>
        </div>
      </CompactAccordion>

      {/* 8. Provenance Metadata & Truth Boundaries */}
      <CompactAccordion
        title="Provenance Metadata & Truth Boundaries"
        badge={{ label: 'ANCHORED', variant: 'purple' }}
        defaultExpanded
      >
        <div className="space-y-3 text-[11px]">
          <div className="p-2 rounded bg-[#050e1c] space-y-1 text-[10px] text-slate-400">
            <div>Authority: <strong className="text-slate-200">{entity.provenanceAuthority}</strong></div>
            <div>Ledger Anchor: <span className="text-purple-300 font-mono">{entity.ledgerAnchor}</span></div>
            <div>Classification: <span className="text-emerald-300 font-bold">{entity.provenanceType}</span></div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Positive Verified Assertions</span>
            </div>
            <ul className="space-y-1 list-disc pl-4 text-slate-300 text-[10px]">
              {entity.truthBoundaries.positiveFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Explicit Negative Invariants (Guardrails)</span>
            </div>
            <ul className="space-y-1 list-disc pl-4 text-slate-400 text-[10px]">
              {entity.truthBoundaries.negativeInvariants.map((inv, idx) => (
                <li key={idx}>{inv}</li>
              ))}
            </ul>
          </div>
        </div>
      </CompactAccordion>
    </div>
  );
};
