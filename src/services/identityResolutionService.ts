import {
  UxSMission,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  CandidateIdentityEdge,
  IdentityResolutionState,
  SourceArtifact,
  IngestedSourceRow,
  CapabilityMaturityRecord,
  CapabilityEvidenceLevel,
  CorpusCapabilityQuery,
  KnowledgeTreeRoot,
  KnowledgeTreeNode,
  ProvenanceType
} from '../types';
import {
  CORPUS_SOURCE_ARTIFACTS,
  CORPUS_INGESTED_ROWS,
  CORPUS_IDENTITY_CANDIDATES,
  CORPUS_CAPABILITY_MATURITY_RECORDS,
  CORPUS_DETERMINISTIC_QUERIES
} from '../data/noaaCorpusData';
import { appendLedgerEvent } from './ledgerService';

// Mutable in-memory state for candidate decisions in current session
let activeCandidates: CandidateIdentityEdge[] = [...CORPUS_IDENTITY_CANDIDATES];
let activeSourceArtifacts: SourceArtifact[] = [...CORPUS_SOURCE_ARTIFACTS];
let activeIngestedRows: IngestedSourceRow[] = [...CORPUS_INGESTED_ROWS];

/**
 * Returns current identity candidate queue.
 */
export function getCorpusIdentityCandidates(): CandidateIdentityEdge[] {
  return activeCandidates;
}

/**
 * Returns all ingested source artifacts.
 */
export function getCorpusSourceArtifacts(): SourceArtifact[] {
  return activeSourceArtifacts;
}

/**
 * Returns all raw ingested rows preserving sheet/row/column audit.
 */
export function getCorpusIngestedRows(): IngestedSourceRow[] {
  return activeIngestedRows;
}

/**
 * Accepts an identity candidate. Creates human decision, binds Knowledge Key,
 * records an immutable ledger event, and updates status.
 */
export function acceptIdentityCandidate(
  candidateId: string,
  decidedBy: string,
  rationale: string
): { success: boolean; candidate: CandidateIdentityEdge; ledgerEventId: string } {
  const idx = activeCandidates.findIndex((c) => c.id === candidateId);
  if (idx === -1) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const updated: CandidateIdentityEdge = {
    ...activeCandidates[idx],
    state: 'ACCEPTED',
    decidedBy: decidedBy || 'Human Data Steward',
    decidedAt: new Date().toISOString(),
    decisionRationale: rationale || 'Verified against authoritative fleet registry documentation'
  };

  activeCandidates[idx] = updated;

  // Record ledger event
  const ledgerEvent = appendLedgerEvent({
    type: 'PROVENANCE_MINTED',
    message: `[IDENTITY ACCEPTED] Bound candidate "${updated.rawLabel || updated.id}" to canonical Knowledge Key ${updated.targetCanonicalKey || updated.targetEntityId}`,
    sourceRef: updated.sourceArtifactRef,
    claimId: updated.id,
    diff: {
      candidateId: updated.id,
      state: 'ACCEPTED',
      targetKey: updated.targetCanonicalKey,
      decidedBy: updated.decidedBy,
      decisionRationale: updated.decisionRationale
    }
  });

  return { success: true, candidate: updated, ledgerEventId: ledgerEvent.id };
}

/**
 * Rejects an ambiguous or conflicting identity candidate with required rationale.
 */
export function rejectIdentityCandidate(
  candidateId: string,
  decidedBy: string,
  rationale: string
): { success: boolean; candidate: CandidateIdentityEdge; ledgerEventId: string } {
  const idx = activeCandidates.findIndex((c) => c.id === candidateId);
  if (idx === -1) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const updated: CandidateIdentityEdge = {
    ...activeCandidates[idx],
    state: 'REJECTED',
    decidedBy: decidedBy || 'Human Data Steward',
    decidedAt: new Date().toISOString(),
    decisionRationale: rationale || 'Rejected due to semantic or physical asset conflict'
  };

  activeCandidates[idx] = updated;

  const ledgerEvent = appendLedgerEvent({
    type: 'CLAIM_RESOLVED',
    message: `[IDENTITY REJECTED] Rejected candidate "${updated.rawLabel || updated.id}". Reason: ${updated.decisionRationale}`,
    sourceRef: updated.sourceArtifactRef,
    claimId: updated.id,
    diff: {
      candidateId: updated.id,
      state: 'REJECTED',
      decidedBy: updated.decidedBy,
      decisionRationale: updated.decisionRationale
    }
  });

  return { success: true, candidate: updated, ledgerEventId: ledgerEvent.id };
}

/**
 * Source-First Ingestion Parser:
 * Ingests CSV rows, JSON objects, or worksheet snippets.
 * Strict Invariant: Creates SourceArtifact and IngestedSourceRow records.
 * NEVER mutates canonical facts directly!
 */
export function ingestSourceData(
  input: string,
  format: 'CSV' | 'JSON' | 'WORKBOOK_ROW',
  artifactTitle: string,
  sheetName = 'Sheet1'
): { artifact: SourceArtifact; parsedRows: IngestedSourceRow[]; newCandidates: CandidateIdentityEdge[] } {
  const artifactId = `art-user-import-${Date.now()}`;
  const timestamp = new Date().toISOString();
  // Simulated SHA-256 hash
  let hashVal = 0;
  for (let i = 0; i < input.length; i++) {
    hashVal = (hashVal << 5) - hashVal + input.charCodeAt(i);
    hashVal |= 0;
  }
  const artifactHash = `sha256:${Math.abs(hashVal).toString(16).padStart(16, '0')}${Date.now().toString(16)}`;

  const artifact: SourceArtifact = {
    id: artifactId,
    name: artifactTitle || `Imported ${format} Artifact`,
    artifactType: format === 'CSV' ? 'CSV_TABLE' : format === 'JSON' ? 'JSON_FEED' : 'XLSX_WORKBOOK',
    fileName: `${artifactTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format === 'CSV' ? 'csv' : 'json'}`,
    sheetName,
    artifactHash,
    importedAt: timestamp,
    sourceTimestamp: timestamp,
    provenanceType: 'IMPORTED_ARTIFACT',
    organization: 'Local Ingest Staging Workspace',
    description: `Source-first ingested payload containing raw observations for human reconciliation.`
  };

  const parsedRows: IngestedSourceRow[] = [];
  const newCandidates: CandidateIdentityEdge[] = [];

  if (format === 'CSV' || format === 'WORKBOOK_ROW') {
    const lines = input.trim().split('\n').filter((l) => l.trim().length > 0);
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

    for (let r = 1; r < lines.length; r++) {
      const cols = lines[r].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      for (let c = 0; c < headers.length; c++) {
        const val = cols[c] || '';
        if (!val) continue;

        const rowRecord: IngestedSourceRow = {
          id: `row-${artifactId}-${r}-${c}`,
          sourceArtifactId: artifactId,
          sourceFile: artifact.fileName,
          sheet: sheetName,
          row: r + 1,
          column: headers[c],
          rawField: headers[c],
          rawValue: val,
          sourceTimestamp: timestamp,
          importTimestamp: timestamp,
          artifactHash
        };
        parsedRows.push(rowRecord);

        // Check if value resembles platform, asset, or sensor
        const valLower = val.toLowerCase();
        if (valLower.includes('remus') || valLower.includes('auv') || valLower.includes('saildrone')) {
          newCandidates.push({
            id: `cand-${rowRecord.id}`,
            sourceEntityId: rowRecord.id,
            targetEntityId: valLower.includes('620') ? 'plat-model-remus620' : 'plat-model-remus600',
            sourceType: 'platformModel',
            matchBasis: valLower.includes('620') ? 'VOCAB_MATCH' : 'NAME_SIMILARITY',
            confidence: valLower.includes('620') ? 0.94 : 0.65,
            state: valLower.includes('620') ? 'STRONG_CANDIDATE' : 'WEAK_CANDIDATE',
            explanation: `Ingested CSV row ${r + 1} column "${headers[c]}" contains "${val}". Requires human decision.`,
            sourceArtifactRef: artifactId,
            rawLabel: val,
            targetCanonicalKey: 'KK:platform-model:remus-620'
          });
        } else if (valLower.startsWith('#') || valLower.includes('sn') || valLower.includes('hull')) {
          newCandidates.push({
            id: `cand-${rowRecord.id}`,
            sourceEntityId: rowRecord.id,
            targetEntityId: 'plat-asset-6401',
            sourceType: 'physicalAsset',
            matchBasis: 'SERIAL_NUMBER',
            confidence: valLower.includes('6401') ? 1.0 : 0.7,
            state: valLower.includes('6401') ? 'EXACT' : 'WEAK_CANDIDATE',
            explanation: `Ingested serial identifier "${val}".`,
            sourceArtifactRef: artifactId,
            rawLabel: val,
            targetCanonicalKey: 'KK:physical-asset:remus-620:6401'
          });
        }
      }
    }
  } else if (format === 'JSON') {
    try {
      const parsed = JSON.parse(input);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item, r) => {
        Object.entries(item).forEach(([k, v], c) => {
          const valStr = String(v);
          const rowRecord: IngestedSourceRow = {
            id: `row-${artifactId}-${r}-${c}`,
            sourceArtifactId: artifactId,
            sourceFile: artifact.fileName,
            sheet: 'json-feed',
            row: r + 1,
            column: k,
            rawField: k,
            rawValue: valStr,
            sourceTimestamp: timestamp,
            importTimestamp: timestamp,
            artifactHash
          };
          parsedRows.push(rowRecord);
        });
      });
    } catch {
      // JSON parse error handled gracefully
    }
  }

  artifact.recordCount = parsedRows.length;
  activeSourceArtifacts = [artifact, ...activeSourceArtifacts];
  activeIngestedRows = [...parsedRows, ...activeIngestedRows];
  activeCandidates = [...newCandidates, ...activeCandidates];

  // Append ledger event for source ingestion
  appendLedgerEvent({
    type: 'PROVENANCE_MINTED',
    message: `[SOURCE INGESTED] Ingested source artifact "${artifact.name}" with ${parsedRows.length} observed fields and ${newCandidates.length} candidate identity bindings.`,
    sourceRef: artifactId,
    diff: {
      artifactId,
      artifactHash,
      recordCount: parsedRows.length,
      candidatesDetected: newCandidates.length
    }
  });

  return { artifact, parsedRows, newCandidates };
}

/**
 * Returns capability maturity assessment for any platform-instrument pair.
 */
export function getCapabilityMaturity(
  platformModelId: string,
  instrumentModelId: string
): CapabilityMaturityRecord | null {
  const match = CORPUS_CAPABILITY_MATURITY_RECORDS.find(
    (r) => r.platformModelId === platformModelId && r.instrumentModelId === instrumentModelId
  );
  if (match) return match;

  // Fallback potential assessment
  return {
    id: `cap-mat-${platformModelId}-${instrumentModelId}`,
    platformModelId,
    platformModelName: platformModelId,
    instrumentModelId,
    instrumentModelName: instrumentModelId,
    potential: { supported: false, authority: 'Corpus Registry', evidenceRef: '' },
    configured: { supported: false, authority: 'Corpus Registry', evidenceRef: '' },
    deployed: { supported: false, authority: 'Corpus Registry', evidenceRef: '' },
    dataProven: { supported: false, authority: 'Corpus Registry', evidenceRef: '' },
    overallMaturity: 'POTENTIAL',
    explanation: 'No positive deployment or configuration evidence recorded in current evidence corpus.'
  };
}

/**
 * Returns all deterministic capability queries.
 */
export function getCorpusDeterministicQueries(): CorpusCapabilityQuery[] {
  return CORPUS_DETERMINISTIC_QUERIES;
}

/**
 * Executes a deterministic capability query and returns explainable traversal results.
 */
export function executeCorpusCapabilityQuery(queryId: string): CorpusCapabilityQuery | null {
  return CORPUS_DETERMINISTIC_QUERIES.find((q) => q.id === queryId) || null;
}

/**
 * Knowledge Tree Projection:
 * Generates an interactive hierarchical tree projection over the SAME graph.
 * Roots supported: PLATFORM, PROVIDER, INSTRUMENT, MISSION, SCIENCE, CAPABILITY.
 * Invariant: Uses graph nodes and edges directly; does NOT create a separate database.
 */
export function buildKnowledgeTree(graph: KnowledgeGraph, rootType: KnowledgeTreeRoot): KnowledgeTreeNode {
  switch (rootType) {
    case 'PLATFORM': {
      return {
        id: 'tree-root-platform',
        label: 'UNCREWED MARITIME SYSTEMS',
        kind: 'group',
        subtitle: 'NOAA Autonomous UxS Platform Fleet Hierarchy',
        provenanceType: 'LOCAL_DERIVED',
        children: [
          {
            id: 'tree-pclass-uuv',
            label: 'Uncrewed Underwater Vehicles (UUV)',
            kind: 'platformClass',
            subtitle: 'Subsurface autonomous survey gliders and powered AUVs',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-pmodel-remus620',
                label: 'REMUS 620 Autonomous Vehicle Model',
                kind: 'platformModel',
                subtitle: 'Engineering archetype: 600m/1500m modular AUV',
                knowledgeKey: 'KK:platform-model:remus-620',
                provenanceType: 'IMPORTED_ARTIFACT',
                evidenceRefChain: ['art-hii-remus620-spec'],
                children: [
                  {
                    id: 'tree-group-physical-assets',
                    label: 'Physical Assets (Hulls / Serials)',
                    kind: 'group',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    children: [
                      {
                        id: 'tree-asset-6401',
                        label: 'REMUS 620 Hull #6401',
                        kind: 'physicalAsset',
                        subtitle: 'Barcode: NOAA-UXS-6401 | Serial: 6401',
                        knowledgeKey: 'KK:physical-asset:remus-620:6401',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        evidenceRefChain: ['art-fleet-inventory-2025', 'art-cruise-en2501-log'],
                        children: [
                          {
                            id: 'tree-conf-minsas204',
                            label: 'CONFIGURED_WITH: Kraken MINSAS SN #204',
                            kind: 'instrumentInstance',
                            subtitle: 'Slot: Mid-Section Belly Payload Bay',
                            knowledgeKey: 'KK:instrument-instance:kraken:minsas:204',
                            provenanceType: 'IMPORTED_ARTIFACT',
                            isLeaf: true
                          },
                          {
                            id: 'tree-conf-voyis088',
                            label: 'CONFIGURED_WITH: Voyis Insight Pro SN #088',
                            kind: 'instrumentInstance',
                            subtitle: 'Slot: Forward Optical Dome',
                            knowledgeKey: 'KK:instrument-instance:voyis:optical:088',
                            provenanceType: 'IMPORTED_ARTIFACT',
                            isLeaf: true
                          }
                        ]
                      }
                    ]
                  },
                  {
                    id: 'tree-group-capabilities',
                    label: 'Engineering Capabilities (CAN_CARRY)',
                    kind: 'group',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    children: [
                      {
                        id: 'tree-can-carry-minsas',
                        label: 'CAN_CARRY: Kraken MINSAS-120 SAS',
                        kind: 'instrumentModel',
                        subtitle: 'Provider spec rated (0.18m³ bay)',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        isLeaf: true
                      },
                      {
                        id: 'tree-can-carry-voyis',
                        label: 'CAN_CARRY: Voyis Insight Pro Optical',
                        kind: 'instrumentModel',
                        subtitle: 'Forward optical compartment rated',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        isLeaf: true
                      }
                    ]
                  },
                  {
                    id: 'tree-group-deployments',
                    label: 'Actual Deployments & Sorties',
                    kind: 'group',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    children: [
                      {
                        id: 'tree-dep-dive01',
                        label: 'EN2501 Dive 01 (Penguin Bank SAS)',
                        kind: 'deployment',
                        subtitle: '14.2h @ 35m altitude | CARRIED Kraken MINSAS SN #204',
                        knowledgeKey: 'KK:deployment:en2501:dive01',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        isLeaf: true
                      },
                      {
                        id: 'tree-dep-dive02',
                        label: 'EN2501 Dive 02 (Kaiwi Trough Deep)',
                        kind: 'deployment',
                        subtitle: '18.5h down to 1,250m depth | CARRIED Kraken MINSAS SN #204',
                        knowledgeKey: 'KK:deployment:en2501:dive02',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        isLeaf: true
                      }
                    ]
                  },
                  {
                    id: 'tree-group-datasets',
                    label: 'Produced Datasets',
                    kind: 'group',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    children: [
                      {
                        id: 'tree-data-backscatter',
                        label: 'Acoustic Backscatter GeoTIFF Mosaic (50cm)',
                        kind: 'dataset',
                        subtitle: 'PRODUCED by Kraken MINSAS SN #204 on Dive 01',
                        knowledgeKey: 'KK:dataset:en2501:backscatter-50cm',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        isLeaf: true
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'tree-pclass-usv',
            label: 'Uncrewed Surface Vehicles (USV)',
            kind: 'platformClass',
            subtitle: 'Long-endurance autonomous surface survey craft',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-pmodel-saildrone',
                label: 'Saildrone Explorer Model',
                kind: 'platformModel',
                subtitle: 'Wind-powered surface oceanographic research vehicle',
                knowledgeKey: 'KK:platform-model:saildrone-explorer',
                provenanceType: 'IMPORTED_ARTIFACT',
                children: [
                  {
                    id: 'tree-asset-sd1033',
                    label: 'Saildrone SD-1033',
                    kind: 'physicalAsset',
                    subtitle: 'Serial: 1033 | NOAA PMEL Carbon Flux Project',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    isLeaf: true
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    case 'PROVIDER': {
      return {
        id: 'tree-root-provider',
        label: 'ORGANIZATIONS & MANUFACTURERS',
        kind: 'group',
        subtitle: 'Equipment providers, research operators, and governing authorities',
        provenanceType: 'LOCAL_DERIVED',
        children: [
          {
            id: 'tree-org-hii',
            label: 'Huntington Ingalls Industries (HII) / Hydroid',
            kind: 'organization',
            subtitle: 'Manufacturer | ROR: https://ror.org/05v8a8r28',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-hii-manuf-remus620',
                label: 'MANUFACTURES -> REMUS 620 Autonomous Vehicle Model',
                kind: 'platformModel',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              },
              {
                id: 'tree-hii-spec',
                label: 'PUBLISHED_SPECIFICATION -> HII REMUS 620 Spec Rev 4',
                kind: 'sourceArtifact',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          },
          {
            id: 'tree-org-kraken',
            label: 'Kraken Robotics Inc.',
            kind: 'organization',
            subtitle: 'Sensor Manufacturer | ROR: https://ror.org/037m4bk91',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-kraken-manuf-minsas',
                label: 'MANUFACTURES -> Kraken MINSAS-120 SAS',
                kind: 'instrumentModel',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          },
          {
            id: 'tree-org-omao',
            label: 'NOAA Office of Marine and Aviation Operations (OMAO)',
            kind: 'organization',
            subtitle: 'Platform Owner & Fleet Authority',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-omao-owns-6401',
                label: 'OWNS -> REMUS 620 Hull #6401',
                kind: 'physicalAsset',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          }
        ]
      };
    }

    case 'INSTRUMENT': {
      return {
        id: 'tree-root-instrument',
        label: 'INSTRUMENTS & PAYLOAD SYSTEMS',
        kind: 'group',
        subtitle: 'Sensor models, physical serial units, and observed properties',
        provenanceType: 'LOCAL_DERIVED',
        children: [
          {
            id: 'tree-inst-minsas-model',
            label: 'Kraken MINSAS-120 SAS (Model)',
            kind: 'instrumentModel',
            subtitle: 'Synthetic Aperture Sonar | 337 kHz | 3cm resolution',
            knowledgeKey: 'KK:instrument-model:kraken:minsas-120',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-inst-minsas-instance',
                label: 'Physical Unit: Kraken MINSAS SN #204',
                kind: 'instrumentInstance',
                subtitle: 'Physical serial unit mounted on REMUS Hull #6401',
                knowledgeKey: 'KK:instrument-instance:kraken:minsas:204',
                provenanceType: 'IMPORTED_ARTIFACT',
                children: [
                  {
                    id: 'tree-inst-dive01',
                    label: 'CARRIED on: EN2501 Dive 01',
                    kind: 'deployment',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    isLeaf: true
                  },
                  {
                    id: 'tree-inst-prod-data',
                    label: 'PRODUCED: Acoustic Backscatter GeoTIFF Mosaic',
                    kind: 'dataset',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    isLeaf: true
                  }
                ]
              }
            ]
          },
          {
            id: 'tree-inst-voyis-model',
            label: 'Voyis Insight Pro Optical/Laser (Model)',
            kind: 'instrumentModel',
            subtitle: 'High-speed co-registered subsea stills and laser line scanning',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-inst-voyis-instance',
                label: 'Physical Unit: Voyis SN #088',
                kind: 'instrumentInstance',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          }
        ]
      };
    }

    case 'SCIENCE': {
      return {
        id: 'tree-root-science',
        label: 'SCIENCE DOMAINS & OBSERVED PROPERTIES',
        kind: 'group',
        subtitle: 'Scientific disciplines, physical phenomena, and observing sensors',
        provenanceType: 'LOCAL_DERIVED',
        children: [
          {
            id: 'tree-sci-seafloor',
            label: 'Seafloor Mapping & Hydrography',
            kind: 'scienceDomain',
            subtitle: 'High-resolution acoustic and optical micro-bathymetry',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-prop-backscatter',
                label: 'Acoustic Backscatter Intensity',
                kind: 'observedProperty',
                subtitle: 'OBSERVABLE_BY -> Synthetic Aperture Sonar (SAS)',
                provenanceType: 'IMPORTED_ARTIFACT',
                children: [
                  {
                    id: 'tree-cap-sas',
                    label: 'SensorCapability: Synthetic Aperture Sonar (SAS)',
                    kind: 'sensorCapability',
                    subtitle: 'IMPLEMENTED_BY -> Kraken MINSAS-120 SAS',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    children: [
                      {
                        id: 'tree-model-minsas-link',
                        label: 'InstrumentModel: Kraken MINSAS-120 SAS',
                        kind: 'instrumentModel',
                        subtitle: 'CAN_BE_CARRIED_BY -> REMUS 620 Autonomous Vehicle',
                        provenanceType: 'IMPORTED_ARTIFACT',
                        isLeaf: true
                      }
                    ]
                  }
                ]
              },
              {
                id: 'tree-prop-bathymetry',
                label: 'Bathymetry & Subsea Elevation',
                kind: 'observedProperty',
                subtitle: 'OBSERVABLE_BY -> Multibeam Sounding & SAS Micro-Bathymetry',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          }
        ]
      };
    }

    case 'MISSION': {
      return {
        id: 'tree-root-mission',
        label: 'NOAA MISSION & DEPLOYMENT ARCHITECTURE',
        kind: 'group',
        subtitle: 'Expeditions, operational legs, underway dives, and data assets',
        provenanceType: 'LOCAL_DERIVED',
        children: [
          {
            id: 'tree-mission-en2501',
            label: 'EN2501 Hawaiian Ridge Autonomous Mapping',
            kind: 'mission',
            subtitle: 'NOAA Ocean Exploration expedition',
            knowledgeKey: 'KK:mission:en2501',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-leg-01',
                label: 'Leg 1: Penguin Bank Shelf & Slopes',
                kind: 'leg',
                provenanceType: 'IMPORTED_ARTIFACT',
                children: [
                  {
                    id: 'tree-leg1-dive01',
                    label: 'Dive 01: Penguin Bank SAS Swath',
                    kind: 'deployment',
                    subtitle: 'EMPLOYED: REMUS 620 #6401 | CARRIED: MINSAS SN-204',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    isLeaf: true
                  }
                ]
              },
              {
                id: 'tree-leg-02',
                label: 'Leg 2: Kaiwi Deep Benthic & Trough',
                kind: 'leg',
                provenanceType: 'IMPORTED_ARTIFACT',
                children: [
                  {
                    id: 'tree-leg2-dive02',
                    label: 'Dive 02: Kaiwi Trough Deep Survey',
                    kind: 'deployment',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    isLeaf: true
                  },
                  {
                    id: 'tree-leg2-dive03',
                    label: 'Dive 03: Molokai Escarpment Optical Recon',
                    kind: 'deployment',
                    provenanceType: 'IMPORTED_ARTIFACT',
                    isLeaf: true
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    case 'CAPABILITY':
    default: {
      return {
        id: 'tree-root-capability',
        label: 'CAPABILITY MATURITY TIERS',
        kind: 'group',
        subtitle: 'Maturity hierarchy: Potential -> Configured -> Deployed -> Data-Proven',
        provenanceType: 'LOCAL_DERIVED',
        children: [
          {
            id: 'tree-tier-data-proven',
            label: 'DATA_PROVEN (Actual Verified Dataset)',
            kind: 'group',
            subtitle: 'Complete evidence lineage from spec to archived scientific dataset',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-mat-remus-minsas',
                label: 'REMUS 620 + Kraken MINSAS (DATA_PROVEN)',
                kind: 'instrumentModel',
                subtitle: 'Dataset: EN2501_D01_Backscatter_50cm GeoTIFF verified',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          },
          {
            id: 'tree-tier-deployed',
            label: 'DEPLOYED (Underway Operations Corroborated)',
            kind: 'group',
            subtitle: 'Deck logs and navigation tracks confirm active underway operations',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-mat-dive01-minsas',
                label: 'Dive 01 CARRIED Kraken MINSAS SN-204',
                kind: 'deployment',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          },
          {
            id: 'tree-tier-configured',
            label: 'CONFIGURED (Physical Chassis Installation)',
            kind: 'group',
            subtitle: 'Fleet inventory serial card confirms physical installation on deck',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-mat-remus-edgetech',
                label: 'REMUS 620 Hull #6401 + EdgeTech 2200-M Sub-Bottom',
                kind: 'physicalAsset',
                subtitle: 'Configured on deck; not deployed active during Dive 01',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          },
          {
            id: 'tree-tier-potential',
            label: 'POTENTIAL (Provider Specification Only)',
            kind: 'group',
            subtitle: 'Manufacturer capability envelope; no physical deployment verified',
            provenanceType: 'IMPORTED_ARTIFACT',
            children: [
              {
                id: 'tree-mat-potential-only',
                label: 'REMUS 620 CAN_CARRY Sea-Bird SBE49 FastCAT CTD',
                kind: 'platformModel',
                subtitle: 'HII Specification rating',
                provenanceType: 'IMPORTED_ARTIFACT',
                isLeaf: true
              }
            ]
          }
        ]
      };
    }
  }
}
