import { UxSMission } from '../types';
import {
  SEED_CLAIMS,
  SEED_SOURCE_OBSERVATIONS,
  SEED_DOCUCOMP_REFERENCES
} from './evidenceAndClaims';

export const EN2501_MISSION: UxSMission = {
  id: 'EN2501',
  title: 'EN2501 Hawaiian Ridge & Kaiwi Channel Autonomous Seafloor Mapping',
  alternateTitle: 'Expedition EN2501: High-Resolution UUV Hydrography & Benthic Characterization',
  abstract: 'Expedition EN2501 conducted autonomous underwater vehicle (AUV) surveys across the Hawaiian Ridge and Kaiwi Channel utilizing the REMUS 620 autonomous platform. Operational configurations included interferometric synthetic aperture sonar (Kraken MINSAS) and optical laser camera systems to acquire continuous high-resolution bathymetry and acoustic backscatter mosaics.',
  purpose: 'Acquire high-resolution seabed acoustic and optical baseline characterization along submarine banks to evaluate deep benthic habitats and volcanic morphology in the Hawaiian Archipelago.',
  supplementalInfo: 'Deployments were executed over 2 operational legs covering Penguin Bank, Kaiwi Trough, and Molokai Escarpment with navigational acoustic tracking via USBL.',
  status: 'completed',
  resourceType: 'mission',
  dateStart: '2025-06-01',
  dateEnd: '2025-06-20',
  publicationDate: '2025-07-15',
  language: 'eng - English',
  topicCategory: ['oceans', 'elevation', 'imageryBaseMapsEarthCover', 'geoscientificInformation'],
  platform: {
    name: 'REMUS 620 Autonomous Underwater Vehicle',
    callSign: 'NOAA-UXS-6401',
    type: 'uncrewed underwater vehicle',
    uxsCategory: 'UUV',
    modelId: 'REMUS-620',
    physicalAssetId: '#6401',
  },
  instruments: ['REMUS 620 #6401', 'Kraken MINSAS SAS', 'Voyis Optical Camera & Laser', 'Seabird FastCAT CTD', 'EdgeTech Sub-Bottom'],
  instrumentDetails: [
    { model: 'Kraken MINSAS-120', serialNumber: 'SN-204', capability: 'Synthetic Aperture Sonar', observedProperty: 'Acoustic Backscatter' },
    { model: 'Voyis Insight Pro', serialNumber: 'SN-088', capability: 'Optical Laser Imaging', observedProperty: 'Seafloor Micro-bathymetry' },
    { model: 'Seabird SBE49 FastCAT', serialNumber: 'SN-1102', capability: 'Conductivity Temperature Depth Profiling', observedProperty: 'Water Temperature & Salinity' }
  ],
  spatialExtent: {
    west: -158.4500,
    south: 20.8500,
    east: -156.9500,
    north: 21.6500,
    placeName: 'Hawaiian Ridge, Kaiwi Channel & Penguin Bank',
    polygon: [
      [21.6500, -158.4500],
      [21.6500, -156.9500],
      [20.8500, -156.9500],
      [20.8500, -158.4500]
    ]
  },
  keywords: {
    gcmdScience: [
      'Oceans > Bathymetry/Seafloor Topography > Seafloor Topography',
      'Oceans > Ocean Acoustics > Acoustic Backscatter',
      'Biosphere > Aquatic Ecosystems > Benthic Habitat',
      'Oceans > Ocean Temperature > Water Temperature'
    ],
    gcmdPlatforms: ['In Situ Ocean-based Platforms > UNCREWED UNDERWATER VEHICLES > REMUS 620'],
    freeKeywords: ['EN2501', 'REMUS 620', 'Kraken MINSAS', 'Hawaiian Ridge', 'Kaiwi Channel', 'Benthic Habitat']
  },
  contact: {
    name: 'NOAA Ocean Exploration Data Steward',
    email: 'ncei.info@noaa.gov',
    role: 'custodian',
    organization: 'NOAA National Centers for Environmental Information (NCEI)',
    rorId: 'https://ror.org/02z5n2526',
    docucompRefId: '440b3ac2-64a5-46e2-9846-38305718b644',
  },
  doi: '10.25921/en2501-hawaii-uuv',
  ceditRecordId: 'CED-2025-0441-UXS',
  ceditStatus: 'validated',
  conformanceScore: 95,
  lastUpdated: '2026-09-08',
  docucompReferences: SEED_DOCUCOMP_REFERENCES,
  claims: SEED_CLAIMS,
  sourceObservations: SEED_SOURCE_OBSERVATIONS,
  authorityStatuses: {
    missionCoverage: 95,
    isoState: 'READY',
    isoErrorsCount: 0,
    cometState: 'DRAFT',
    stacState: 'READY',
    oissState: 'NOT TESTED',
    mode: 'READ_ONLY',
  }
};

export const INITIAL_MISSIONS: UxSMission[] = [
  EN2501_MISSION,
  {
    id: 'PointSur_2024_Leg18',
    title: 'Point Sur 2024 Leg 18 Eagle Ray MultiBeam Sonar Data UUV Dive 01',
    alternateTitle: 'PS24-18 MDBC Habitat Restoration Seafloor Mapping',
    abstract: 'The MDBC Mapping, Groundtruthing and Modeling team along with USM conducted UUV acquisition of seafloor mapping data at Point Sur to support mesophotic and deep benthic community restoration in the northern Gulf of Mexico.',
    purpose: 'High-resolution acoustic backscatter and bathymetric reconnaissance for mesophotic coral bed boundaries following restoration initiatives.',
    supplementalInfo: 'Autonomous underwater vehicle Eagle Ray equipped with Edgetech 2200-M multibeam system operated at 40m altitude above seafloor.',
    status: 'onGoing',
    resourceType: 'dataset',
    dateStart: '2024-05-01',
    dateEnd: '2024-05-14',
    publicationDate: '2024-06-15',
    language: 'eng - English',
    topicCategory: ['oceans', 'imageryBaseMapsEarthCover'],
    platform: {
      name: 'R/V Point Sur',
      callSign: 'WCZ6236',
      type: 'research vessel',
      uxsCategory: 'UUV',
      modelId: 'REMUS-620',
      physicalAssetId: '#6401',
    },
    instruments: ['REMUS 620 #6401', 'MultiBeam Sonar Edgetech 2200-M', 'Kraken MINSAS Sonar', 'Sub-Bottom Profiler'],
    instrumentDetails: [
      { model: 'Kraken MINSAS', serialNumber: 'SN-204', capability: 'Synthetic Aperture Sonar', observedProperty: 'Acoustic Backscatter' },
      { model: 'EdgeTech 2200-M', capability: 'Sub-Bottom Profiling', observedProperty: 'Subsurface Stratigraphy' }
    ],
    spatialExtent: {
      west: -88.6500,
      south: 28.5200,
      east: -87.4100,
      north: 29.3500,
      placeName: 'Northern Gulf of Mexico, Mississippi Canyon',
      polygon: [
        [29.3500, -88.6500],
        [29.3500, -87.4100],
        [28.5200, -87.4100],
        [28.5200, -88.6500]
      ]
    },
    keywords: {
      gcmdScience: [
        'Oceans > Bathymetry/Seafloor Topography > Seafloor Topography',
        'Oceans > Ocean Acoustics > Acoustic Backscatter',
        'Biosphere > Aquatic Ecosystems > Benthic Habitat'
      ],
      gcmdPlatforms: ['In Situ Ocean-based Platforms > UNCREWED UNDERWATER VEHICLES > Eagle Ray UUV'],
      freeKeywords: ['MDBC', 'Eagle Ray UUV', 'Gulf of Mexico', 'Mesophotic reefs', 'REMUS 620']
    },
    contact: {
      name: 'Marine Data Steward',
      email: 'ncei.info@noaa.gov',
      role: 'originator',
      organization: 'University of Southern Mississippi / NOAA NCEI',
      rorId: 'https://ror.org/037x4hk74',
      docucompRefId: '440b3ac2-64a5-46e2-9846-38305718b644',
    },
    doi: '10.25921/mdbc-uuv-2024-01',
    ceditRecordId: 'CED-2024-8841-UXS',
    ceditStatus: 'draft',
    conformanceScore: 86,
    lastUpdated: '2026-09-08',
    docucompReferences: SEED_DOCUCOMP_REFERENCES,
    claims: SEED_CLAIMS,
    sourceObservations: SEED_SOURCE_OBSERVATIONS,
    authorityStatuses: {
      missionCoverage: 86,
      isoState: 'READY',
      isoErrorsCount: 0,
      cometState: 'NOT VALIDATED',
      stacState: 'READY',
      oissState: 'NOT TESTED',
      mode: 'READ_ONLY',
    },
  },
  {
    id: 'EX2503_Mission_PED',
    title: 'EX2503: Seamount Ecosystem Exploration – Atlantic Ocean',
    alternateTitle: 'Okeanos Explorer EX-25-03 New England & Corner Rise Seamounts Expedition',
    abstract: 'This expedition explored deep-sea ecosystems on seamounts in the North Atlantic using the Okeanos Explorer ROV system. Data collected include high-resolution bathymetric imagery, CTD casts, multibeam sonar surveys, and benthic habitat characterization for coral and sponge communities.',
    purpose: 'Provide critical baseline characterization of deep-sea habitats, vulnerable marine ecosystems (VMEs), and geological seafloor formations along the Corner Rise and New England Seamount chain in support of NOAA Ocean Exploration stewardship.',
    supplementalInfo: 'Operated under NOAA Office of Ocean Exploration and Research (OER) permit. All CTD data calibrated against salinity bottle samples. High-definition video captured via ROV Deep Discoverer and Camera Platform Seirios.',
    status: 'completed',
    resourceType: 'dataset',
    dateStart: '2025-03-10',
    dateEnd: '2025-03-22',
    publicationDate: '2025-04-01',
    language: 'eng - English',
    topicCategory: ['oceans', 'geoscientificInformation', 'biota', 'elevation'],
    platform: {
      name: 'NOAA Ship Okeanos Explorer',
      callSign: 'WDE7525',
      type: 'research vessel',
      uxsCategory: 'ROV',
      modelId: 'ROV-Deep-Discoverer',
    },
    instruments: ['ROV Deep Discoverer', 'Multibeam Sonar EM304', 'CTD Carousel', 'ADCP 38kHz'],
    spatialExtent: {
      west: -46.7820,
      south: 31.2040,
      east: -31.9820,
      north: 37.8720,
      placeName: 'North Atlantic Ocean, Corner Rise Seamounts',
      polygon: [
        [37.8720, -46.7820],
        [35.4500, -31.9820],
        [31.2040, -34.2100],
        [32.8900, -44.5600]
      ]
    },
    keywords: {
      gcmdScience: [
        'Oceans > Ocean Acoustics > Acoustic Backscatter',
        'Oceans > Bathymetry/Seafloor Topography > Bathymetry',
        'Biological Classification > Animals/Invertebrates > Cnidarians > Anthozoans > Corals',
        'Oceans > Ocean Temperature > Water Temperature',
        'Oceans > Salinity/Density > Salinity'
      ],
      gcmdPlatforms: ['In Situ Ocean-based Platforms > SHIPS > Okeanos Explorer', 'In Situ Ocean-based Platforms > ROV > Deep Discoverer'],
      freeKeywords: ['Deep-sea corals', 'Seamounts', 'ROV Dives', 'Corner Rise', 'NOAA OER']
    },
    contact: {
      name: 'Chief Scientist Office',
      email: 'data.manager@noaa.gov',
      role: 'pointOfContact',
      organization: 'NOAA National Centers for Environmental Information (NCEI)',
      rorId: 'https://ror.org/02z5n2526',
      docucompRefId: '440b3ac2-64a5-46e2-9846-38305718b644',
    },
    doi: '10.25921/ex25-03-oceans',
    ceditRecordId: 'CED-2025-0982-UXS',
    ceditStatus: 'validated',
    conformanceScore: 92,
    lastUpdated: '2026-09-08',
    docucompReferences: SEED_DOCUCOMP_REFERENCES,
    claims: SEED_CLAIMS,
    sourceObservations: SEED_SOURCE_OBSERVATIONS,
    authorityStatuses: {
      missionCoverage: 92,
      isoState: 'READY',
      isoErrorsCount: 0,
      cometState: 'DRAFT',
      stacState: 'READY',
      oissState: 'INGEST_READY',
      mode: 'READ_ONLY',
    },
  },
  {
    id: 'Saildrone_Arctic_2024',
    title: 'Saildrone USV Chukchi Sea Ocean Acidification & Hydrography Transect',
    alternateTitle: 'NOAA PMEL Arctic USV Mission SD-1033',
    abstract: 'Uncrewed Surface Vehicle (USV) survey measuring ocean acidification, pCO2 fluxes, sea surface temperature, salinity, and meteorological variables across the Chukchi and Beaufort Seas.',
    purpose: 'Monitor rapid climate changes, marine ecosystem vulnerability, and high-latitude air-sea gas exchange in Arctic coastal corridors.',
    supplementalInfo: 'Autonomous solar and wind-powered surface vehicle telemetry relayed via satellite. Calibrated against PMEL mooring arrays.',
    status: 'completed',
    resourceType: 'dataset',
    dateStart: '2024-07-01',
    dateEnd: '2024-09-25',
    publicationDate: '2024-10-15',
    language: 'eng - English',
    topicCategory: ['oceans', 'climatologyMeteorologyAtmosphere'],
    platform: {
      name: 'Saildrone USV SD-1033',
      callSign: 'USV-SD1033',
      type: 'uncrewed surface vehicle',
      uxsCategory: 'USV'
    },
    instruments: ['ASVCO2 Carbon Dioxide Sensor', 'Seabird SBE37 CTD', 'Airmar WeatherStation', 'Rotronic HC2-S3 Humidity Sensor'],
    spatialExtent: {
      west: -168.9000,
      south: 67.2000,
      east: -155.4000,
      north: 72.5000,
      placeName: 'Chukchi Sea & Bering Strait, Arctic Ocean',
      polygon: [
        [72.5000, -168.9000],
        [71.8000, -155.4000],
        [67.2000, -162.1000],
        [68.1000, -168.9000]
      ]
    },
    keywords: {
      gcmdScience: [
        'Oceans > Ocean Chemistry > Carbon Dioxide',
        'Oceans > Ocean Chemistry > Ocean Acidification',
        'Oceans > Ocean Temperature > Sea Surface Temperature',
        'Atmosphere > Atmospheric Water Vapor > Humidity'
      ],
      gcmdPlatforms: ['In Situ Ocean-based Platforms > UNCREWED SURFACE VEHICLES > Saildrone'],
      freeKeywords: ['Arctic Ocean', 'Saildrone', 'NOAA PMEL', 'Ocean Acidification', 'pCO2']
    },
    contact: {
      name: 'Ocean Carbon Data Lead',
      email: 'pmel.data@noaa.gov',
      role: 'principalInvestigator',
      organization: 'NOAA Pacific Marine Environmental Laboratory (PMEL)',
      rorId: 'https://ror.org/02z5n2526'
    },
    doi: '10.25921/pmel-sd1033-2024',
    ceditRecordId: 'CED-2024-9120-UXS',
    ceditStatus: 'published',
    conformanceScore: 94,
    lastUpdated: '2026-09-08'
  }
];

export const NOAA_PRESET_REGIONS: { name: string; extent: { west: number; south: number; east: number; north: number } }[] = [
  {
    name: 'North Atlantic Corner Rise (EX2503)',
    extent: { west: -46.7820, south: 31.2040, east: -31.9820, north: 37.8720 }
  },
  {
    name: 'Northern Gulf of Mexico (Point Sur)',
    extent: { west: -88.6500, south: 28.5200, east: -87.4100, north: 29.3500 }
  },
  {
    name: 'Chukchi & Arctic Sea (Saildrone)',
    extent: { west: -168.9000, south: 67.2000, east: -155.4000, north: 72.5000 }
  },
  {
    name: 'Cascadia Subduction Margin (Gliders)',
    extent: { west: -126.8000, south: 43.1000, east: -123.9000, north: 47.9000 }
  },
  {
    name: 'Marianas Trench & Ridge (Deep ROV)',
    extent: { west: 141.5000, south: 11.2000, east: 146.8000, north: 20.4000 }
  },
  {
    name: 'Blake Plateau Cold Water Corals',
    extent: { west: -79.8000, south: 29.5000, east: -76.2000, north: 32.8000 }
  }
];
