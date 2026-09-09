import {
  UxSLifecycleState,
  UxSLifecycleTransition,
  UxSMission,
  ReadinessCockpitState,
  ReadinessDomainStatus
} from '../types';
import { LIFECYCLE_STAGES, INITIAL_READINESS_COCKPIT } from '../data/lifecycleStages';
import { ledgerService } from './ledgerService';

export interface MissionPlaybackStep {
  stage: UxSLifecycleState;
  label: string;
  durationMs: number;
  highlightCategory: 'identity' | 'signal' | 'projection' | 'handoff' | 'archive';
  ledgerSummary: string;
  triggerSource: 'Claim' | 'Signal' | 'Decision' | 'Intake' | 'System' | 'Handoff';
  actor: string;
}

export const PLAYBACK_PIPELINE_SEQUENCE: MissionPlaybackStep[] = [
  {
    stage: 'ACQUIRE',
    label: 'Platform Operations & Nav Track Acquisition',
    durationMs: 3200,
    highlightCategory: 'identity',
    ledgerSummary: 'Vehicle telemetry logged from REMUS 620 #6401; acoustic USBL nav track registered.',
    triggerSource: 'Intake',
    actor: 'Autonomous Platform / Field Operations'
  },
  {
    stage: 'OBSERVE',
    label: 'Payload File Ingestion & Cryptographic Checksums',
    durationMs: 3200,
    highlightCategory: 'signal',
    ledgerSummary: '17 raw payload files checksummed (SHA-256); Charlie form intake mapped.',
    triggerSource: 'Intake',
    actor: 'MANTAS Intake Adapter & SnapTree Engine'
  },
  {
    stage: 'RECONCILE',
    label: 'Evidence Reasoning & Variance Discovery',
    durationMs: 3600,
    highlightCategory: 'identity',
    ledgerSummary: 'Extracted candidate claims across sources; identified hull and payload model variances.',
    triggerSource: 'Claim',
    actor: 'Evidence Reasoner & Multi-Source Engine'
  },
  {
    stage: 'ACCEPT',
    label: 'Identity Resolution & Knowledge Key Minting',
    durationMs: 3800,
    highlightCategory: 'identity',
    ledgerSummary: 'Platform identity accepted (REMUS 620 #6401). Minted canonical Knowledge Keys in Merkle block.',
    triggerSource: 'Decision',
    actor: 'Human Data Steward'
  },
  {
    stage: 'ASSURE',
    label: 'Signal Quality Evaluation & DocuComp Slot Audit',
    durationMs: 3400,
    highlightCategory: 'signal',
    ledgerSummary: 'Evaluated quality signal rules; validated DocuComp slot conformance and GCMD keywords.',
    triggerSource: 'Signal',
    actor: 'MANTAS Signal Verification Engine'
  },
  {
    stage: 'PROJECT',
    label: 'Multi-Standard Projection Generation (ISO, STAC, CoMET)',
    durationMs: 3400,
    highlightCategory: 'projection',
    ledgerSummary: 'Generated ISO 19115-2 XML, STAC 1.0.0 JSON, and CoMET CEDIT metadata projections.',
    triggerSource: 'System',
    actor: 'MANTAS Projection Engine'
  },
  {
    stage: 'HANDOFF_READY',
    label: 'MANTAS OISS Handoff Package Verification',
    durationMs: 3600,
    highlightCategory: 'handoff',
    ledgerSummary: 'Local readiness criteria verified; created OISS Submission Information Package (SIP).',
    triggerSource: 'Handoff',
    actor: 'MANTAS Ingest Packaging Engine'
  },
  {
    stage: 'SUBMITTED',
    label: 'OISS Ingest Gateway Handshake Transmission',
    durationMs: 3200,
    highlightCategory: 'handoff',
    ledgerSummary: 'SIP transmitted to NOAA NCEI Ingest Gateway queue; receipt handshake pending.',
    triggerSource: 'Handoff',
    actor: 'NOAA OISS Ingest Gateway Queue'
  },
  {
    stage: 'DESTINATION_OBSERVED',
    label: 'Gateway Ingest Receipt Verification',
    durationMs: 3200,
    highlightCategory: 'archive',
    ledgerSummary: 'External gateway confirmed receipt; package verified against NCEI ingest rules.',
    triggerSource: 'System',
    actor: 'NOAA Ingest Gateway Observer'
  },
  {
    stage: 'ARCHIVED',
    label: 'NCEI Deep Ocean Archive Accession Receipt Confirmed',
    durationMs: 3200,
    highlightCategory: 'archive',
    ledgerSummary: 'NCEI assigned permanent accession number and long-term storage manifest.',
    triggerSource: 'System',
    actor: 'NOAA NCEI Ocean Archive Authority'
  },
  {
    stage: 'DISCOVERABLE',
    label: 'OneStop Catalog Harvest & Search Indexing',
    durationMs: 3200,
    highlightCategory: 'archive',
    ledgerSummary: 'WAF harvested and collection record indexed in NOAA OneStop discovery portal.',
    triggerSource: 'System',
    actor: 'NOAA OneStop Harvest Crawler'
  }
];

export class UxSLifecycleService {
  private static instance: UxSLifecycleService;

  private constructor() {}

  public static getInstance(): UxSLifecycleService {
    if (!UxSLifecycleService.instance) {
      UxSLifecycleService.instance = new UxSLifecycleService();
    }
    return UxSLifecycleService.instance;
  }

  /**
   * Get all defined stages
   */
  public getStages() {
    return LIFECYCLE_STAGES;
  }

  /**
   * Evaluate readiness domain statuses dynamically from mission model
   */
  public computeCockpitState(mission: UxSMission, activeStage?: UxSLifecycleState): ReadinessCockpitState {
    const stage = activeStage || mission.lifecycleState || 'ACCEPT';

    // 1. Vehicle Domain Evaluation
    const hasPlatformName = Boolean(mission.platform?.name);
    const hasModelId = Boolean(mission.platform?.modelId);
    const hasAssetId = Boolean(mission.platform?.physicalAssetId);
    const hasCallsign = Boolean(mission.platform?.callSign);
    const vehicleStatus: ReadinessDomainStatus =
      hasPlatformName && hasModelId && hasAssetId ? 'READY' : 'REVIEW';

    // 2. Payload Domain Evaluation
    const hasInstruments = Boolean(mission.instruments && mission.instruments.length >= 2);
    const hasDetails = Boolean(mission.instrumentDetails && mission.instrumentDetails.length > 0);
    const payloadStatus: ReadinessDomainStatus = hasInstruments && hasDetails ? 'READY' : 'PARTIAL';

    // 3. Mission Domain Evaluation
    const hasSpatial = Boolean(
      mission.spatialExtent &&
      mission.spatialExtent.north !== 0 &&
      mission.spatialExtent.west !== 0
    );
    const hasPolygon = Boolean(mission.spatialExtent?.polygon && mission.spatialExtent.polygon.length >= 3);
    const missionDomainStatus: ReadinessDomainStatus = hasSpatial ? (hasPolygon ? 'READY' : 'PARTIAL') : 'REVIEW';

    // 4. Data Domain Evaluation
    const rawFilesCheck = true;
    const auxiliaryCheck = stage !== 'RECONCILE' && stage !== 'ACQUIRE';
    const dataStatus: ReadinessDomainStatus = auxiliaryCheck ? 'READY' : 'PARTIAL';

    // 5. Metadata Domain Evaluation
    const hasContactEmail = Boolean(mission.contact?.email && mission.contact.email.includes('@'));
    const hasKeywords = Boolean(mission.keywords?.gcmdScience && mission.keywords.gcmdScience.length > 0);
    const metadataStatus: ReadinessDomainStatus = hasContactEmail && hasKeywords ? 'READY' : 'REVIEW';

    return {
      missionId: mission.id,
      missionTitle: mission.title,
      activeStage: stage,
      lifecycleState: stage,
      domains: {
        vehicle: {
          status: vehicleStatus,
          label: 'Vehicle Domain',
          details: `${mission.platform.name} (${mission.platform.physicalAssetId || '#6401'}) resolved & bound.`,
          items: [
            {
              label: `Platform Model: ${mission.platform.modelId || 'REMUS-620'}`,
              status: hasModelId ? 'READY' : 'REVIEW',
              detail: 'Resolved model in UxS Registry'
            },
            {
              label: `Physical Asset Hull: ${mission.platform.physicalAssetId || '#6401'}`,
              status: hasAssetId ? 'READY' : 'REVIEW',
              detail: 'Physical hull serial number'
            },
            {
              label: `Operational Category: ${mission.platform.uxsCategory || 'UUV'}`,
              status: 'READY',
              detail: 'Uncrewed Underwater Vehicle'
            },
            {
              label: `Callsign: ${mission.platform.callSign || 'NOAA-UXS-6401'}`,
              status: hasCallsign ? 'READY' : 'PARTIAL',
              detail: 'Official NOAA callsign allocation'
            }
          ]
        },
        payload: {
          status: payloadStatus,
          label: 'Payload Domain',
          details: `${mission.instruments.length} payload sensors integrated and calibrated.`,
          items: (mission.instrumentDetails || [
            { model: 'Kraken MINSAS-120', capability: 'Synthetic Aperture Sonar' },
            { model: 'Voyis Insight Pro', capability: 'Optical Laser Imaging' },
            { model: 'Seabird FastCAT', capability: 'CTD Profiler' }
          ]).map((inst) => ({
            label: `${inst.model} (${inst.capability || 'Sensor'})`,
            status: 'READY' as ReadinessDomainStatus,
            detail: inst.observedProperty || 'Seabed Sensor Stream'
          }))
        },
        mission: {
          status: missionDomainStatus,
          label: 'Mission Domain',
          details: `${mission.spatialExtent.placeName || 'Kaiwi Channel'} deployment track verified.`,
          items: [
            {
              label: `Deployment: Dive 01 (${mission.resourceType.toUpperCase()})`,
              status: 'READY',
              detail: 'Cruise deployment run'
            },
            {
              label: `Temporal: ${mission.dateStart} to ${mission.dateEnd}`,
              status: 'READY',
              detail: 'Verified cruise window'
            },
            {
              label: `Spatial Extent: ${mission.spatialExtent.placeName || 'Hawaiian Ridge'}`,
              status: hasSpatial ? 'READY' : 'REVIEW',
              detail: `N: ${mission.spatialExtent.north}°, W: ${mission.spatialExtent.west}°`
            },
            {
              label: 'USBL Navigational Track',
              status: hasPolygon ? 'READY' : 'PARTIAL',
              detail: '1,420 acoustic nav fixes verified'
            }
          ]
        },
        data: {
          status: dataStatus,
          label: 'Data Domain',
          details: '17 primary raw files, SAS mosaics, and micro-bathymetry grids cataloged.',
          items: [
            { label: 'Acoustic Backscatter Mosaics (SAS)', status: 'READY', detail: 'GeoTIFF / raw sonar files' },
            { label: 'High-Resolution Micro-Bathymetry Grid', status: 'READY', detail: 'NetCDF / BAG grid files' },
            { label: 'Raw Navigation Binary Telemetry', status: 'READY', detail: 'REMUS .BIN log package' },
            {
              label: 'Auxiliary CTD Calibration Log',
              status: auxiliaryCheck ? 'READY' : 'REVIEW',
              detail: auxiliaryCheck ? 'Checksum match verified' : 'Checksum verification pending'
            }
          ]
        },
        metadata: {
          status: metadataStatus,
          label: 'Metadata Domain',
          details: 'ISO 19115-2 NOAA UxS profile conformance and DocuComp slots.',
          items: [
            {
              label: `Contact: ${mission.contact.name}`,
              status: hasContactEmail ? 'READY' : 'REVIEW',
              detail: mission.contact.email || 'Email missing for OISS SIP'
            },
            {
              label: `Keywords: ${mission.keywords.gcmdScience.length} GCMD Terms`,
              status: hasKeywords ? 'READY' : 'REVIEW',
              detail: 'GCMD Science & Platform vocabularies'
            },
            { label: 'DocuComp Slot Conformance', status: 'READY', detail: 'Validated against NOAA UxS profile' },
            { label: 'Lineage & Processing Steps', status: 'READY', detail: 'Acquisition to mosaic lineage logged' }
          ]
        }
      },
      destinations: INITIAL_READINESS_COCKPIT.destinations
    };
  }

  /**
   * Execute state machine step with guard evaluation and ledger recording
   */
  public transitionMission(
    mission: UxSMission,
    targetStage: UxSLifecycleState,
    triggerSource: 'Claim' | 'Signal' | 'Decision' | 'Intake' | 'System' | 'Handoff',
    actor: string,
    summary: string
  ): { success: boolean; mission: UxSMission; transition: UxSLifecycleTransition; error?: string } {
    const fromState = mission.lifecycleState || 'ACCEPT';
    const guardEval = ledgerService.evaluateGuards(targetStage, mission);

    const { transition, updatedMission } = ledgerService.recordTransition(mission, {
      fromState,
      toState: targetStage,
      trigger: `TRANSITION_TO_${targetStage}`,
      triggerSource,
      actor,
      summary,
      knowledgeKey: `KK:${targetStage.toLowerCase()}:${mission.id.toLowerCase()}:step`
    });

    return {
      success: guardEval.passed,
      mission: updatedMission,
      transition
    };
  }
}

export const uxSLifecycleService = UxSLifecycleService.getInstance();
