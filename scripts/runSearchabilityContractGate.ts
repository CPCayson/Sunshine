import {
  DiscoveryHit,
  buildDiscoveryIntakeDraft,
  buildLocalQueryCrosswalk,
  rankDiscoveryHits,
} from '../src/services/searchabilityService';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const baseHit = (overrides: Partial<DiscoveryHit>): DiscoveryHit => ({
  id: 'fixture',
  source: 'OneStop',
  title: 'Fixture collection',
  recordType: 'collection',
  instruments: [],
  gcmdPlatforms: [],
  gcmdInstruments: [],
  gcmdScience: [],
  freeKeywords: [],
  provenanceType: 'LIVE_OBSERVED',
  ...overrides,
});

const literalRemus = baseHit({
  id: 'remus-literal',
  title: 'REMUS 620 Autonomous Survey',
  identifier: 'gov.noaa.ncei:remus-620',
  platform: 'REMUS 620',
  description: 'AUV survey mission.',
});

const genericAuv = baseHit({
  id: 'auv-generic',
  title: 'Autonomous Underwater Vehicle Survey Collection',
  identifier: 'gov.noaa.ncei:generic-auv',
  platform: 'Autonomous Underwater Vehicle',
  description: 'General AUV observations.',
});

const summaryOnly = baseHit({
  id: 'summary-only',
  title: 'Ocean Engineering Reports',
  description: 'A report set that mentions REMUS among many systems.',
});

const queryCrosswalk = buildLocalQueryCrosswalk('remus');
assert(queryCrosswalk.length > 0, 'REMUS should have LOCAL semantic neighbors for recall/rerank support.');
assert(queryCrosswalk.every((item) => item.authority === 'LOCAL'), 'LOCAL semantic neighbors must never be labeled GCMD.');

const ranked = rankDiscoveryHits('remus', [genericAuv, summaryOnly, literalRemus], queryCrosswalk);
const byId = new Map(ranked.map((hit) => [hit.id, hit]));
const literal = byId.get('remus-literal');
const generic = byId.get('auv-generic');
const summary = byId.get('summary-only');

assert(literal, 'Literal REMUS result missing from ranking.');
assert(generic, 'Generic AUV result missing from ranking.');
assert(summary, 'Summary-only result missing from ranking.');
assert(literal!.matchTier === 'EXACT_PLATFORM' || literal!.matchTier === 'EXACT_TITLE', 'Literal REMUS must receive an exact-match tier.');
assert(literal!.rankInSource < generic!.rankInSource, 'Literal REMUS must outrank generic AUV semantic relevance.');
assert(literal!.rankInSource < summary!.rankInSource, 'Literal REMUS must outrank summary-only mentions.');
assert(generic!.rankReasons.some((reason) => reason.authority === 'LOCAL'), 'Generic AUV recall should be explainable as LOCAL semantic evidence.');

const gcmdBacked = baseHit({
  id: 'gcmd-backed',
  title: 'Platform vocabulary record',
  gcmdPlatforms: ['Autonomous Underwater Vehicle'],
});
const gcmdRanked = rankDiscoveryHits('Autonomous Underwater Vehicle', [gcmdBacked], []);
assert(gcmdRanked[0].rankReasons.some((reason) => reason.authority === 'GCMD'), 'An observed GCMD source term should contribute GCMD ranking evidence.');
assert(gcmdRanked[0].crosswalkEvidence.some((item) => item.authority === 'GCMD'), 'Observed GCMD terms must remain provenance-labelled GCMD.');

const draft = buildDiscoveryIntakeDraft(literal!);
assert(draft.state === 'DRAFT_RECONCILE', 'Import must create DRAFT_RECONCILE state.');
assert(draft.canonicalChanged === false, 'Import must not mutate canonical state.');
assert(draft.candidate.platform?.name === 'REMUS 620', 'Literal source platform should map into a candidate field.');
assert(!('contact' in draft.candidate), 'Missing parties must not be invented during import.');
assert(draft.suggestions.some((suggestion) => suggestion.kind === 'MISSING_FIELD' && suggestion.targetPath === 'contact'), 'Missing parties should become review suggestions rather than fabricated values.');

const titleOnly = rankDiscoveryHits('remus', [baseHit({ id: 'title-no-platform', title: 'REMUS observations', description: 'No explicit platform field.' })], queryCrosswalk)[0];
const titleOnlyDraft = buildDiscoveryIntakeDraft(titleOnly);
assert(!titleOnlyDraft.candidate.platform, 'A title mention alone must not be promoted into platform truth during intake.');

console.log(`REMUS_LITERAL_RANK=${literal!.rankInSource}`);
console.log(`GENERIC_AUV_RANK=${generic!.rankInSource}`);
console.log(`SUMMARY_ONLY_RANK=${summary!.rankInSource}`);
console.log(`LOCAL_CROSSWALK_LABELS=${queryCrosswalk.length}`);
console.log(`INTAKE_STATE=${draft.state}`);
console.log(`CANONICAL_CHANGED=${draft.canonicalChanged ? 'YES' : 'NO'}`);
console.log('SEARCHABILITY_TEST=PASS');
