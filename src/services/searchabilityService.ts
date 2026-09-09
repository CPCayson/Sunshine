import { FederatedSearchResult } from '../types';

export type SearchabilityPathway = 'TEXT' | 'BOTH' | 'STRUCTURED' | 'UNKNOWN';

export type SearchabilityEvidenceState =
  | 'OBSERVED'
  | 'DOCUMENTED'
  | 'HYPOTHESIS'
  | 'NOT_RUN';

export type SearchabilityDimension =
  | 'IDENTITY'
  | 'LITERAL'
  | 'CONTROLLED_VOCABULARY'
  | 'SYNONYM'
  | 'HIERARCHY'
  | 'RELATIONSHIP'
  | 'NATURAL_LANGUAGE';

export interface SearchabilityProbe {
  id: string;
  dimension: SearchabilityDimension;
  label: string;
  query: string;
  state: SearchabilityEvidenceState;
  observedPathway: SearchabilityPathway;
  facetField?: string;
  evidence?: string;
  note?: string;
}

export interface SearchabilitySummary {
  totalKeywords: number;
  textOnly: number;
  both: number;
  structuredOnly: number;
}

export interface SearchabilityContract {
  caseId: string;
  collectionId: string;
  authority: 'OneStop';
  measuredAt: string;
  summary: SearchabilitySummary;
  probes: SearchabilityProbe[];
  doctrine: string[];
}

/**
 * Measured fixture from the EX2102 discoverability harness.
 *
 * Important: these values describe an observed corpus result, not a claim that
 * every ISO keyword with a similar shape will follow the same pathway.
 */
export const EX2102_ONESTOP_SEARCHABILITY: SearchabilityContract = {
  caseId: 'EX2102_DISCOVERABILITY',
  collectionId: 'collection-332ffe20-d444-11eb-9345-0800200c9a66',
  authority: 'OneStop',
  measuredAt: '2026-08-29',
  summary: {
    totalKeywords: 58,
    textOnly: 44,
    both: 14,
    structuredOnly: 0,
  },
  probes: [
    {
      id: 'ex2102-platform-okeanos',
      dimension: 'CONTROLLED_VOCABULARY',
      label: 'Platform concept',
      query: 'NOAA Ship Okeanos Explorer',
      state: 'OBSERVED',
      observedPathway: 'BOTH',
      facetField: 'gcmdPlatforms',
      evidence: 'EX2102 corpus classification',
      note: 'Recognized GCMD value also remained present in generic keywords.',
    },
    {
      id: 'ex2102-instrument-mbes',
      dimension: 'CONTROLLED_VOCABULARY',
      label: 'Instrument concept',
      query: 'MBES > Multibeam Mapping System',
      state: 'OBSERVED',
      observedPathway: 'BOTH',
      facetField: 'gcmdInstruments',
      evidence: 'EX2102 corpus classification',
    },
    {
      id: 'ex2102-science-aquatic',
      dimension: 'CONTROLLED_VOCABULARY',
      label: 'Science concept',
      query: 'Earth Science > Oceans > Aquatic Sciences',
      state: 'OBSERVED',
      observedPathway: 'BOTH',
      facetField: 'gcmdScience',
      evidence: 'EX2102 corpus classification',
    },
    {
      id: 'ex2102-provider-ocean-education',
      dimension: 'LITERAL',
      label: 'Provider keyword',
      query: 'ocean education',
      state: 'OBSERVED',
      observedPathway: 'TEXT',
      evidence: 'EX2102 corpus classification',
    },
    {
      id: 'ex2102-provider-telepresence',
      dimension: 'LITERAL',
      label: 'Provider keyword',
      query: 'telepresence',
      state: 'OBSERVED',
      observedPathway: 'TEXT',
      evidence: 'EX2102 corpus classification',
    },
    {
      id: 'ex2102-provider-oer',
      dimension: 'LITERAL',
      label: 'Provider acronym',
      query: 'OER',
      state: 'OBSERVED',
      observedPathway: 'TEXT',
      evidence: 'EX2102 corpus classification',
    },
    {
      id: 'ex2102-semantic-multibeam-sonar',
      dimension: 'SYNONYM',
      label: 'Human-language synonym',
      query: 'multibeam sonar',
      state: 'NOT_RUN',
      observedPathway: 'UNKNOWN',
      note: 'Semantic expansion probe. Do not infer a pass from the controlled term.',
    },
    {
      id: 'ex2102-semantic-seafloor-mapping',
      dimension: 'HIERARCHY',
      label: 'Broader scientific intent',
      query: 'seafloor mapping',
      state: 'NOT_RUN',
      observedPathway: 'UNKNOWN',
      note: 'Tests whether broader meaning is recoverable without the literal keyword.',
    },
  ],
  doctrine: [
    'Schema says where.',
    'Topology says how things connect.',
    'Ontology says what a source term means.',
    'OneStop tells us what became discoverable.',
    'Searchability is measured; it is never inferred from XML validity alone.',
  ],
};

export const buildSelectedRecordSearchIntents = (
  record: FederatedSearchResult
): SearchabilityProbe[] => {
  const probes: SearchabilityProbe[] = [
    {
      id: `${record.id}-identity-title`,
      dimension: 'IDENTITY',
      label: 'Record title',
      query: record.title,
      state: 'NOT_RUN',
      observedPathway: 'UNKNOWN',
      note: 'Candidate query generated from the selected record. No OneStop result has been measured yet.',
    },
  ];

  if (record.identifier) {
    probes.push({
      id: `${record.id}-identity-id`,
      dimension: 'IDENTITY',
      label: 'Identifier',
      query: record.identifier,
      state: 'NOT_RUN',
      observedPathway: 'UNKNOWN',
      note: 'Identity probe generated from the selected authority record.',
    });
  }

  if (record.metadataSummary.platform) {
    probes.push({
      id: `${record.id}-platform`,
      dimension: 'LITERAL',
      label: 'Platform literal',
      query: record.metadataSummary.platform,
      state: 'NOT_RUN',
      observedPathway: 'UNKNOWN',
      note: 'A platform value is not assumed to be a recognized GCMD platform until measured.',
    });
  }

  for (const sensor of record.metadataSummary.sensors || []) {
    probes.push({
      id: `${record.id}-sensor-${sensor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      dimension: 'LITERAL',
      label: 'Sensor / instrument literal',
      query: sensor,
      state: 'NOT_RUN',
      observedPathway: 'UNKNOWN',
      note: 'Candidate instrument intent. Authority binding remains unresolved until measured.',
    });
  }

  return probes;
};
