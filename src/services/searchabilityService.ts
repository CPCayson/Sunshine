import { FederatedSearchResult, UxSMission } from '../types';

/**
 * Searchability is an evidence/retrieval layer. It never accepts mission truth.
 * Live discovery hits may be ranked, inspected, and converted into an intake
 * draft, but human reconciliation remains the acceptance boundary.
 */
export type DiscoverySource = 'OneStop' | 'ERDDAP' | 'CoMET';
export type SearchLaneState = 'LIVE' | 'EMPTY' | 'AUTH_REQUIRED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
export type SearchMatchTier =
  | 'EXACT_ID'
  | 'EXACT_PLATFORM'
  | 'EXACT_TITLE'
  | 'GCMD_EXACT'
  | 'GCMD_RELATED'
  | 'LOCAL_SEMANTIC'
  | 'SUMMARY_ONLY';

export type CrosswalkAuthority = 'GCMD' | 'LOCAL';
export type CrosswalkKind = 'platform' | 'instrument' | 'science' | 'semantic';

export interface CrosswalkEvidence {
  authority: CrosswalkAuthority;
  kind: CrosswalkKind;
  label: string;
  conceptId?: string;
  relation: 'exact' | 'synonym' | 'broader' | 'narrower' | 'related' | 'semantic';
  source: 'QUERY' | 'RECORD';
}

export interface RankReason {
  code: string;
  label: string;
  points: number;
  authority: 'SOURCE' | 'GCMD' | 'LOCAL';
}

export interface DiscoveryHit {
  id: string;
  source: DiscoverySource;
  title: string;
  subtitle?: string;
  identifier?: string;
  sourceUrl?: string;
  recordType: 'collection' | 'dataset' | 'record';
  recordGroup?: string;
  recordGroupScope?: 'MANTAS_PRIMARY' | 'OTHER_READ_ONLY';
  description?: string;
  platform?: string;
  instruments: string[];
  gcmdPlatforms: string[];
  gcmdInstruments: string[];
  gcmdScience: string[];
  freeKeywords: string[];
  bbox?: [number, number, number, number];
  temporal?: { start?: string; end?: string };
  institution?: string;
  raw?: unknown;
  provenanceType: 'LIVE_OBSERVED' | 'READ_ONLY_CONTEXT';
}

export interface RankedDiscoveryHit extends DiscoveryHit {
  localScore: number;
  matchTier: SearchMatchTier;
  rankReasons: RankReason[];
  crosswalkEvidence: CrosswalkEvidence[];
  rankInSource: number;
}

export interface SearchLaneSummary {
  source: DiscoverySource | 'THREDDS';
  state: SearchLaneState;
  count: number;
  message: string;
}

export interface SearchabilityResponse {
  query: string;
  searchedAt: string;
  queryCrosswalk: CrosswalkEvidence[];
  hits: RankedDiscoveryHit[];
  lanes: SearchLaneSummary[];
  cometContext: RankedDiscoveryHit[];
}

export interface IntakeFieldEvidence {
  targetPath: string;
  sourcePath: string;
  observedValue: unknown;
  proposedValue?: unknown;
  transform: 'DIRECT' | 'NORMALIZED' | 'CROSSWALK' | 'INFERRED';
  authority: 'SOURCE' | 'GCMD' | 'LOCAL';
}

export type IntakeSuggestionKind =
  | 'GCMD_MAPPING'
  | 'KEYWORD_UPGRADE'
  | 'MISSING_FIELD'
  | 'LOCAL_SEMANTIC'
  | 'QA_REMEDIATION';

export interface IntakeSuggestion {
  id: string;
  kind: IntakeSuggestionKind;
  targetPath: string;
  observed?: unknown;
  proposed?: unknown;
  authority: 'GCMD' | 'LOCAL' | 'METASERVER';
  explanation: string;
  evidence: string[];
  requiresHumanAcceptance: true;
  qaFindingRef?: string;
}

export interface DiscoveryIntakeDraft {
  intakeId: string;
  state: 'DRAFT_RECONCILE';
  createdAt: string;
  source: {
    system: DiscoverySource;
    id: string;
    identifier?: string;
    url?: string;
    recordGroup?: string;
    recordGroupScope?: 'MANTAS_PRIMARY' | 'OTHER_READ_ONLY';
  };
  candidate: {
    title?: string;
    abstract?: string;
    dateStart?: string;
    dateEnd?: string;
    spatialExtent?: Partial<UxSMission['spatialExtent']>;
    platform?: Partial<UxSMission['platform']>;
    instruments?: string[];
    keywords?: {
      gcmdScience?: string[];
      gcmdPlatforms?: string[];
      freeKeywords?: string[];
    };
    doi?: string;
  };
  evidence: IntakeFieldEvidence[];
  suggestions: IntakeSuggestion[];
  sourceSnapshot: DiscoveryHit;
  canonicalChanged: false;
}

const ONESTOP_COLLECTION_SEARCH = 'https://data.noaa.gov/onestop/api/search/search/collection';
const PMEL_ERDDAP_SEARCH = 'https://data.pmel.noaa.gov/pmel/erddap/search/index.json';
export const DISCOVERY_INTAKE_STORAGE_KEY = 'mantas.discoveryIntake.v1';

const TIER_ORDER: Record<SearchMatchTier, number> = {
  EXACT_ID: 0,
  EXACT_PLATFORM: 1,
  EXACT_TITLE: 2,
  GCMD_EXACT: 3,
  GCMD_RELATED: 4,
  LOCAL_SEMANTIC: 5,
  SUMMARY_ONLY: 6,
};

/**
 * These are explicitly LOCAL semantic aliases. They are not GCMD terms and
 * must never be displayed as authoritative vocabulary.
 */
const LOCAL_UXS_ALIASES: Record<string, string[]> = {
  remus: ['autonomous underwater vehicle', 'auv', 'uuv', 'uncrewed underwater vehicle'],
  auv: ['autonomous underwater vehicle', 'uuv', 'remus'],
  uuv: ['uncrewed underwater vehicle', 'autonomous underwater vehicle', 'auv', 'remus'],
  saildrone: ['uncrewed surface vehicle', 'usv', 'autonomous surface vehicle'],
  usv: ['uncrewed surface vehicle', 'autonomous surface vehicle', 'saildrone'],
  glider: ['ocean glider', 'underwater glider', 'autonomous underwater vehicle'],
};

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function uniqueStrings(values: unknown): string[] {
  const flattened = Array.isArray(values) ? values : values == null ? [] : [values];
  return Array.from(
    new Set(
      flattened
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
    )
  );
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim());
      if (typeof first === 'string') return first.trim();
    }
  }
  return undefined;
}

function maybeIsoDate(value: unknown): string | undefined {
  const text = firstString(value);
  if (!text) return undefined;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

function bboxFromUnknown(value: any): [number, number, number, number] | undefined {
  if (Array.isArray(value) && value.length === 4 && value.every((item) => Number.isFinite(Number(item)))) {
    return value.map(Number) as [number, number, number, number];
  }
  if (value && typeof value === 'object') {
    const west = value.west ?? value.westBoundLongitude ?? value.minX;
    const south = value.south ?? value.southBoundLatitude ?? value.minY;
    const east = value.east ?? value.eastBoundLongitude ?? value.maxX;
    const north = value.north ?? value.northBoundLatitude ?? value.maxY;
    if ([west, south, east, north].every((item) => Number.isFinite(Number(item)))) {
      return [Number(west), Number(south), Number(east), Number(north)];
    }
  }
  return undefined;
}

export function buildLocalQueryCrosswalk(query: string): CrosswalkEvidence[] {
  const q = normalize(query);
  const aliases = LOCAL_UXS_ALIASES[q] || [];
  return aliases.map((label) => ({
    authority: 'LOCAL',
    kind: 'semantic',
    label,
    relation: 'semantic',
    source: 'QUERY',
  }));
}

function rankHit(query: string, hit: DiscoveryHit, queryCrosswalk: CrosswalkEvidence[]): Omit<RankedDiscoveryHit, 'rankInSource'> {
  const q = normalize(query);
  const queryTokens = q.split(' ').filter(Boolean);
  const id = normalize(hit.identifier || hit.id);
  const title = normalize(hit.title);
  const platform = normalize(hit.platform);
  const description = normalize([hit.subtitle, hit.description].filter(Boolean).join(' '));
  const gcmd = [...hit.gcmdPlatforms, ...hit.gcmdInstruments, ...hit.gcmdScience];
  const normalizedGcmd = gcmd.map(normalize);
  const reasons: RankReason[] = [];
  const crosswalkEvidence: CrosswalkEvidence[] = [];

  const add = (code: string, label: string, points: number, authority: RankReason['authority']) => {
    reasons.push({ code, label, points, authority });
  };

  let tier: SearchMatchTier = 'SUMMARY_ONLY';

  if (q && (id === q || id.split(' ').includes(q))) {
    add('EXACT_ID', 'Exact identifier match', 50, 'SOURCE');
    tier = 'EXACT_ID';
  } else if (q && platform && (platform === q || platform.includes(q))) {
    add('EXACT_PLATFORM', 'Literal query in platform metadata', 45, 'SOURCE');
    tier = 'EXACT_PLATFORM';
  } else if (q && title === q) {
    add('EXACT_TITLE_PHRASE', 'Exact title phrase', 40, 'SOURCE');
    tier = 'EXACT_TITLE';
  } else if (q && title.includes(q)) {
    add('EXACT_TITLE_TOKEN', 'Literal query in title', 32, 'SOURCE');
    tier = 'EXACT_TITLE';
  }

  const exactGcmd = normalizedGcmd.findIndex((label) => label === q || (q && label.includes(q)));
  if (exactGcmd >= 0) {
    add('GCMD_EXACT', `Authoritative GCMD record term: ${gcmd[exactGcmd]}`, 25, 'GCMD');
    crosswalkEvidence.push({
      authority: 'GCMD',
      kind: hit.gcmdPlatforms.includes(gcmd[exactGcmd])
        ? 'platform'
        : hit.gcmdInstruments.includes(gcmd[exactGcmd])
          ? 'instrument'
          : 'science',
      label: gcmd[exactGcmd],
      relation: 'exact',
      source: 'RECORD',
    });
    if (TIER_ORDER[tier] > TIER_ORDER.GCMD_EXACT) tier = 'GCMD_EXACT';
  }

  const semanticLabels = queryCrosswalk.map((item) => normalize(item.label));
  const semanticHaystack = [title, platform, description, ...normalizedGcmd].join(' ');
  const matchedAlias = semanticLabels.find((alias) => alias && semanticHaystack.includes(alias));
  if (matchedAlias) {
    const original = queryCrosswalk.find((item) => normalize(item.label) === matchedAlias);
    add('LOCAL_SEMANTIC', `LOCAL semantic relation: ${original?.label || matchedAlias}`, 8, 'LOCAL');
    if (original) crosswalkEvidence.push(original);
    if (TIER_ORDER[tier] > TIER_ORDER.LOCAL_SEMANTIC) tier = 'LOCAL_SEMANTIC';
  }

  const uxsText = [title, platform, description, ...normalizedGcmd].join(' ');
  if (/\b(remus|auv|uuv|usv|glider|saildrone|uncrewed|autonomous underwater|autonomous surface)\b/.test(uxsText)) {
    add('UXS_RELEVANCE', 'Explicit UxS platform/mission language', 12, 'SOURCE');
  }

  if (q && description.includes(q)) {
    add('SUMMARY_LITERAL', 'Literal query appears in summary/description', 8, 'SOURCE');
  } else if (queryTokens.some((token) => token.length > 2 && description.includes(token))) {
    add('SUMMARY_TOKEN', 'Query token appears in summary/description', 4, 'SOURCE');
  }

  if (hit.recordType === 'collection') {
    add('COLLECTION_CONTEXT', 'Collection-level discovery record', 5, 'SOURCE');
  }

  const localScore = reasons.reduce((sum, reason) => sum + reason.points, 0);
  return { ...hit, localScore, matchTier: tier, rankReasons: reasons, crosswalkEvidence };
}

export function rankDiscoveryHits(query: string, hits: DiscoveryHit[], queryCrosswalk = buildLocalQueryCrosswalk(query)): RankedDiscoveryHit[] {
  const bySource = new Map<DiscoverySource, Omit<RankedDiscoveryHit, 'rankInSource'>[]>();
  for (const hit of hits) {
    const ranked = rankHit(query, hit, queryCrosswalk);
    const list = bySource.get(hit.source) || [];
    list.push(ranked);
    bySource.set(hit.source, list);
  }

  const ranked: RankedDiscoveryHit[] = [];
  for (const [, list] of bySource) {
    list
      .sort((a, b) => {
        const tierDiff = TIER_ORDER[a.matchTier] - TIER_ORDER[b.matchTier];
        if (tierDiff !== 0) return tierDiff;
        return b.localScore - a.localScore || a.title.localeCompare(b.title);
      })
      .forEach((hit, index) => ranked.push({ ...hit, rankInSource: index + 1 }));
  }
  return ranked;
}

async function searchOneStop(query: string): Promise<DiscoveryHit[]> {
  const response = await fetch(ONESTOP_COLLECTION_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      queries: [{ type: 'queryText', value: query }],
      facets: true,
      page: { max: 30, offset: 0 },
      summary: false,
    }),
  });
  if (!response.ok) throw new Error(`OneStop returned HTTP ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((row: any): DiscoveryHit => {
    const attrs = row?.attributes || {};
    const identifier = firstString(attrs.fileIdentifier, attrs.doi, row?.id);
    const gcmdPlatforms = uniqueStrings(attrs.gcmdPlatforms);
    const gcmdInstruments = uniqueStrings(attrs.gcmdInstruments);
    const gcmdScience = uniqueStrings(attrs.gcmdScience);
    const freeKeywords = uniqueStrings(attrs.keywords);
    const explicitPlatform = firstString(attrs.platform, attrs.platformName);
    const bbox = bboxFromUnknown(attrs.spatialBounding || attrs.boundingBox || attrs.bbox);
    const start = maybeIsoDate(attrs.beginDate || attrs.startDate || attrs.temporalStart);
    const end = maybeIsoDate(attrs.endDate || attrs.stopDate || attrs.temporalEnd);
    return {
      id: `onestop:${row?.id || identifier || cryptoSafeId(attrs.title)}`,
      source: 'OneStop',
      title: firstString(attrs.title) || identifier || 'Untitled OneStop collection',
      subtitle: identifier ? `OneStop collection · ${identifier}` : 'OneStop collection',
      identifier,
      sourceUrl: row?.id ? `https://data.noaa.gov/onestop/collections/details/${encodeURIComponent(row.id)}` : undefined,
      recordType: 'collection',
      description: firstString(attrs.description, attrs.abstract),
      platform: explicitPlatform,
      instruments: uniqueStrings(attrs.instruments || attrs.instrumentNames),
      gcmdPlatforms,
      gcmdInstruments,
      gcmdScience,
      freeKeywords,
      bbox,
      temporal: start || end ? { start, end } : undefined,
      institution: firstString(attrs.organization, attrs.institution),
      raw: row,
      provenanceType: 'LIVE_OBSERVED',
    };
  });
}

function tableRows(payload: any): Record<string, any>[] {
  const columns = payload?.table?.columnNames;
  const rows = payload?.table?.rows;
  if (!Array.isArray(columns) || !Array.isArray(rows)) return [];
  return rows.map((row: any[]) => Object.fromEntries(columns.map((column: string, index: number) => [column, row[index]])));
}

async function searchErddap(query: string): Promise<DiscoveryHit[]> {
  const url = `${PMEL_ERDDAP_SEARCH}?page=1&itemsPerPage=50&searchFor=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`PMEL ERDDAP returned HTTP ${response.status}`);
  const payload = await response.json();

  return tableRows(payload)
    .map((row): DiscoveryHit | null => {
      const datasetId = firstString(row['Dataset ID'], row.datasetID, row.id);
      if (!datasetId) return null;
      const infoUrl = firstString(row.Info) || `https://data.pmel.noaa.gov/pmel/erddap/info/${encodeURIComponent(datasetId)}/index.html`;
      return {
        id: `erddap:${datasetId}`,
        source: 'ERDDAP',
        title: firstString(row.Title) || datasetId,
        subtitle: `PMEL ERDDAP dataset · ${datasetId}`,
        identifier: datasetId,
        sourceUrl: infoUrl,
        recordType: 'dataset',
        description: firstString(row.Summary),
        // Do not infer platform/instrument from title or summary. If the search
        // endpoint does not expose those fields they remain unknown.
        instruments: [],
        gcmdPlatforms: [],
        gcmdInstruments: [],
        gcmdScience: [],
        freeKeywords: [],
        institution: firstString(row.Institution),
        raw: row,
        provenanceType: 'LIVE_OBSERVED',
      };
    })
    .filter((hit): hit is DiscoveryHit => Boolean(hit));
}

async function probeCometContext(query: string): Promise<{ lane: SearchLaneSummary; hits: DiscoveryHit[] }> {
  try {
    const response = await fetch(`/api/comet/metadata/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Sunshine CoMET proxy returned HTTP ${response.status}`);
    const payload = await response.json();
    const rawHits = Array.isArray(payload?.hits) ? payload.hits : [];
    const hits: DiscoveryHit[] = rawHits.map((row: any, index: number) => ({
      id: `comet:${row.uuid || row.id || index}`,
      source: 'CoMET',
      title: firstString(row.title, row.name) || `CoMET record ${index + 1}`,
      subtitle: row.recordGroup ? `CoMET workspace · ${row.recordGroup}` : 'CoMET workspace context',
      identifier: firstString(row.uuid, row.id),
      sourceUrl: firstString(row.url),
      recordType: 'record',
      recordGroup: firstString(row.recordGroup),
      recordGroupScope: row.recordGroupScope === 'MANTAS_PRIMARY' ? 'MANTAS_PRIMARY' : 'OTHER_READ_ONLY',
      description: firstString(row.abstract, row.description),
      platform: firstString(row.platform),
      instruments: uniqueStrings(row.instruments),
      gcmdPlatforms: uniqueStrings(row.gcmdPlatforms),
      gcmdInstruments: uniqueStrings(row.gcmdInstruments),
      gcmdScience: uniqueStrings(row.gcmdScience),
      freeKeywords: uniqueStrings(row.keywords),
      bbox: bboxFromUnknown(row.bbox),
      temporal: row.start || row.end ? { start: maybeIsoDate(row.start), end: maybeIsoDate(row.end) } : undefined,
      raw: row,
      provenanceType: 'READ_ONLY_CONTEXT',
    }));

    if (payload?.authStatus === 'AUTH_REQUIRED') {
      return {
        lane: { source: 'CoMET', state: 'AUTH_REQUIRED', count: 0, message: 'CoMET workspace search requires an authenticated NOAA session.' },
        hits: [],
      };
    }
    if (payload?.configured === false) {
      return {
        lane: { source: 'CoMET', state: 'NOT_CONFIGURED', count: 0, message: 'MANTAS/other CoMET record groups are not configured in this runtime.' },
        hits: [],
      };
    }
    return {
      lane: {
        source: 'CoMET',
        state: hits.length ? 'LIVE' : 'EMPTY',
        count: hits.length,
        message: hits.length ? 'Read-only CoMET workspace context.' : 'No configured CoMET context matches.',
      },
      hits,
    };
  } catch (error: any) {
    return {
      lane: { source: 'CoMET', state: 'UNAVAILABLE', count: 0, message: error?.message || 'CoMET context unavailable.' },
      hits: [],
    };
  }
}

export async function searchSearchability(query: string): Promise<SearchabilityResponse> {
  const q = query.trim();
  if (!q) {
    return {
      query: '',
      searchedAt: new Date().toISOString(),
      queryCrosswalk: [],
      hits: [],
      cometContext: [],
      lanes: [
        { source: 'OneStop', state: 'EMPTY', count: 0, message: 'Enter a query.' },
        { source: 'ERDDAP', state: 'EMPTY', count: 0, message: 'Enter a query.' },
        { source: 'CoMET', state: 'NOT_CONFIGURED', count: 0, message: 'Workspace context is checked after search.' },
        { source: 'THREDDS', state: 'NOT_CONFIGURED', count: 0, message: 'Compare-only lane; no proven catalog URL configured.' },
      ],
    };
  }

  const queryCrosswalk = buildLocalQueryCrosswalk(q);
  const [oneStopResult, erddapResult, cometResult] = await Promise.allSettled([
    searchOneStop(q),
    searchErddap(q),
    probeCometContext(q),
  ]);

  const oneStopHits = oneStopResult.status === 'fulfilled' ? oneStopResult.value : [];
  const erddapHits = erddapResult.status === 'fulfilled' ? erddapResult.value : [];
  const comet = cometResult.status === 'fulfilled'
    ? cometResult.value
    : { lane: { source: 'CoMET' as const, state: 'UNAVAILABLE' as const, count: 0, message: 'CoMET context unavailable.' }, hits: [] };

  const rankedDiscovery = rankDiscoveryHits(q, [...oneStopHits, ...erddapHits], queryCrosswalk);
  const rankedComet = rankDiscoveryHits(q, comet.hits, queryCrosswalk);

  const lane = (source: 'OneStop' | 'ERDDAP', result: PromiseSettledResult<DiscoveryHit[]>, count: number): SearchLaneSummary => {
    if (result.status === 'rejected') {
      return { source, state: 'UNAVAILABLE', count: 0, message: result.reason?.message || `${source} unavailable.` };
    }
    return {
      source,
      state: count ? 'LIVE' : 'EMPTY',
      count,
      message: count ? `Live ${source} discovery results.` : `No ${source} matches. Honest empty result.`,
    };
  };

  return {
    query: q,
    searchedAt: new Date().toISOString(),
    queryCrosswalk,
    hits: rankedDiscovery,
    cometContext: rankedComet,
    lanes: [
      lane('OneStop', oneStopResult, oneStopHits.length),
      lane('ERDDAP', erddapResult, erddapHits.length),
      comet.lane,
      { source: 'THREDDS', state: 'NOT_CONFIGURED', count: 0, message: 'Compare-only lane; no proven catalog URL configured.' },
    ],
  };
}

function cryptoSafeId(value: unknown): string {
  return normalize(value).replace(/\s+/g, '-').slice(0, 80) || `record-${Date.now()}`;
}

export function buildDiscoveryIntakeDraft(hit: RankedDiscoveryHit): DiscoveryIntakeDraft {
  const evidence: IntakeFieldEvidence[] = [];
  const suggestions: IntakeSuggestion[] = [];
  const candidate: DiscoveryIntakeDraft['candidate'] = {};
  const addEvidence = (
    targetPath: string,
    sourcePath: string,
    observedValue: unknown,
    proposedValue: unknown,
    transform: IntakeFieldEvidence['transform'] = 'DIRECT',
    authority: IntakeFieldEvidence['authority'] = 'SOURCE'
  ) => evidence.push({ targetPath, sourcePath, observedValue, proposedValue, transform, authority });

  if (hit.title) {
    candidate.title = hit.title;
    addEvidence('title', `${hit.source}.title`, hit.title, hit.title);
  }
  if (hit.description) {
    candidate.abstract = hit.description;
    addEvidence('abstract', `${hit.source}.description`, hit.description, hit.description);
  }
  if (hit.temporal?.start) {
    candidate.dateStart = hit.temporal.start;
    addEvidence('dateStart', `${hit.source}.temporal.start`, hit.temporal.start, hit.temporal.start, 'NORMALIZED');
  }
  if (hit.temporal?.end) {
    candidate.dateEnd = hit.temporal.end;
    addEvidence('dateEnd', `${hit.source}.temporal.end`, hit.temporal.end, hit.temporal.end, 'NORMALIZED');
  }
  if (hit.bbox) {
    candidate.spatialExtent = { west: hit.bbox[0], south: hit.bbox[1], east: hit.bbox[2], north: hit.bbox[3] };
    addEvidence('spatialExtent', `${hit.source}.bbox`, hit.bbox, candidate.spatialExtent, 'NORMALIZED');
  }
  if (hit.platform) {
    candidate.platform = { name: hit.platform };
    addEvidence('platform.name', `${hit.source}.platform`, hit.platform, hit.platform);
  }
  if (hit.instruments.length) {
    candidate.instruments = hit.instruments;
    addEvidence('instruments', `${hit.source}.instruments`, hit.instruments, hit.instruments);
  }

  candidate.keywords = {};
  if (hit.gcmdScience.length) {
    candidate.keywords.gcmdScience = hit.gcmdScience;
    addEvidence('keywords.gcmdScience', `${hit.source}.gcmdScience`, hit.gcmdScience, hit.gcmdScience, 'DIRECT', 'GCMD');
  }
  if (hit.gcmdPlatforms.length) {
    candidate.keywords.gcmdPlatforms = hit.gcmdPlatforms;
    addEvidence('keywords.gcmdPlatforms', `${hit.source}.gcmdPlatforms`, hit.gcmdPlatforms, hit.gcmdPlatforms, 'DIRECT', 'GCMD');
  }
  if (hit.freeKeywords.length) {
    candidate.keywords.freeKeywords = hit.freeKeywords;
    addEvidence('keywords.freeKeywords', `${hit.source}.keywords`, hit.freeKeywords, hit.freeKeywords);
  }

  hit.gcmdPlatforms.forEach((label, index) => suggestions.push({
    id: `suggest-gcmd-platform-${index}-${cryptoSafeId(label)}`,
    kind: 'GCMD_MAPPING',
    targetPath: 'keywords.gcmdPlatforms',
    observed: label,
    proposed: label,
    authority: 'GCMD',
    explanation: 'Authoritative GCMD platform term observed on the source record. Review before accepting into the intake draft.',
    evidence: [`${hit.source}:${hit.identifier || hit.id}`],
    requiresHumanAcceptance: true,
  }));
  hit.gcmdInstruments.forEach((label, index) => suggestions.push({
    id: `suggest-gcmd-instrument-${index}-${cryptoSafeId(label)}`,
    kind: 'GCMD_MAPPING',
    targetPath: 'instruments',
    observed: label,
    proposed: label,
    authority: 'GCMD',
    explanation: 'Authoritative GCMD instrument term observed on the source record. It is a vocabulary mapping, not proof that a specific instrument instance was deployed.',
    evidence: [`${hit.source}:${hit.identifier || hit.id}`],
    requiresHumanAcceptance: true,
  }));
  hit.gcmdScience.forEach((label, index) => suggestions.push({
    id: `suggest-gcmd-science-${index}-${cryptoSafeId(label)}`,
    kind: 'KEYWORD_UPGRADE',
    targetPath: 'keywords.gcmdScience',
    observed: label,
    proposed: label,
    authority: 'GCMD',
    explanation: 'Authoritative GCMD science term observed on the source record.',
    evidence: [`${hit.source}:${hit.identifier || hit.id}`],
    requiresHumanAcceptance: true,
  }));

  hit.crosswalkEvidence
    .filter((item) => item.authority === 'LOCAL')
    .forEach((item, index) => suggestions.push({
      id: `suggest-local-${index}-${cryptoSafeId(item.label)}`,
      kind: 'LOCAL_SEMANTIC',
      targetPath: 'platform.name',
      observed: hit.platform || hit.title,
      proposed: item.label,
      authority: 'LOCAL',
      explanation: 'SnapDust/local semantic neighbor for review only. This is not a GCMD assertion and is not accepted automatically.',
      evidence: [`rank:${hit.matchTier}`, `source:${hit.source}`],
      requiresHumanAcceptance: true,
    }));

  if (!hit.raw || !(hit.raw as any)?.contact) {
    suggestions.push({
      id: `suggest-missing-party-${cryptoSafeId(hit.id)}`,
      kind: 'MISSING_FIELD',
      targetPath: 'contact',
      authority: 'LOCAL',
      explanation: 'No responsible-party contact was observed in the search result payload. Review source metadata before ISO/CoMET QA; do not invent a PI or role.',
      evidence: [`${hit.source}:${hit.identifier || hit.id}`],
      requiresHumanAcceptance: true,
    });
  }

  return {
    intakeId: `intake-${Date.now()}-${cryptoSafeId(hit.id)}`,
    state: 'DRAFT_RECONCILE',
    createdAt: new Date().toISOString(),
    source: {
      system: hit.source,
      id: hit.id,
      identifier: hit.identifier,
      url: hit.sourceUrl,
      recordGroup: hit.recordGroup,
      recordGroupScope: hit.recordGroupScope,
    },
    candidate,
    evidence,
    suggestions,
    sourceSnapshot: hit,
    canonicalChanged: false,
  };
}

export function saveDiscoveryIntakeDraft(draft: DiscoveryIntakeDraft): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(DISCOVERY_INTAKE_STORAGE_KEY, JSON.stringify(draft));
  }
}

export function loadDiscoveryIntakeDraft(): DiscoveryIntakeDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DISCOVERY_INTAKE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function discoveryHitToFederatedResult(hit: RankedDiscoveryHit): FederatedSearchResult {
  return {
    id: hit.id,
    authority: hit.source as any,
    title: hit.title,
    subtitle: hit.subtitle,
    identifier: hit.identifier,
    status: hit.provenanceType,
    timestamp: new Date().toISOString(),
    metadataSummary: {
      platform: hit.platform,
      sensors: hit.instruments.length ? hit.instruments : hit.gcmdInstruments,
      bbox: hit.bbox,
      temporal: hit.temporal ? [hit.temporal.start, hit.temporal.end].filter(Boolean).join(' → ') : undefined,
    },
    rawFragment: hit.raw ? JSON.stringify(hit.raw, null, 2) : undefined,
    claimsCount: Math.max(1, hit.rankReasons.length),
  };
}
