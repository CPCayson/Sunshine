export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  type: ValidationSeverity;
  field: string;
  message: string;
  path: string;
  autoFixable?: boolean;
  fixAction?: {
    field: string;
    value: any;
    description: string;
  };
}

export interface SpatialExtent {
  west: number;
  south: number;
  east: number;
  north: number;
  placeName?: string;
  polygon?: [number, number][];
}

export type SourceAuthority =
  | 'CoMET'
  | 'OneStop'
  | 'ERDDAP'
  | 'DocuComp'
  | 'STAC'
  | 'UxS Registry'
  | 'Cruise Report'
  | 'Ship Sensor Log'
  | 'OISS Harvest'
  | 'Charlie Form';

export interface SourceObservation {
  id: string;
  authority: SourceAuthority;
  sourceUri?: string;
  sourceTitle: string;
  documentExcerpt?: string;
  rawFragment?: string;
  observedAt: string;
  observedBy?: string;
  reliabilityScore: number;
}

export type ClaimState =
  | 'OBSERVED'
  | 'INFERRED'
  | 'CONFLICT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'UNRESOLVED';

export type RelationshipPredicate =
  | 'CAN_CARRY'
  | 'CONFIGURED_WITH'
  | 'CARRIED'
  | 'PRODUCED'
  | 'OBSERVES'
  | 'SUPPORTED_BY'
  | 'OBSERVABLE_BY'
  | 'IMPLEMENTED_BY'
  | 'MANUFACTURES'
  | 'PROVIDES'
  | 'OPERATES'
  | 'OWNS'
  | 'MAINTAINS'
  | 'ASSERTS_CAPABILITY'
  | 'PUBLISHED_SPECIFICATION'
  | 'REQUIRES_OR_BENEFITS_FROM'
  | 'CAN_BE_CARRIED_BY'
  | 'FUNCTIONAL_ALTERNATIVE'
  | 'CAPABILITY_OVERLAP'
  | 'CAN_SATISFY'
  | 'RELATED_CAPABILITY'
  | 'INSTANCE_OF_MODEL'
  | 'EMPLOYED_ASSET'
  | 'INCLUDES_LEG'
  | 'EXECUTED_DEPLOYMENT'
  | 'HAS_ASSET';

export interface ClaimDecision {
  decisionType: 'ACCEPT' | 'REJECT' | 'MODIFY' | 'DEFER';
  decidedBy: string;
  decidedAt: string;
  rationale?: string;
  modifiedValue?: any;
}

export interface Claim {
  id: string;
  subject: string;
  predicate: RelationshipPredicate | string;
  objectValue: any;
  sources: SourceObservation[];
  confidence: number;
  state: ClaimState;
  decision?: ClaimDecision;
  acceptedBy?: string;
  acceptedAt?: string;
  whyExplanation?: string;
  conflictDetails?: {
    conflictingValues: Array<{
      value: any;
      source: SourceAuthority;
      excerpt?: string;
    }>;
  };
}

export interface DocuCompComponent {
  id: string;
  kind: 'docucompComponent';
  title?: string;
  href: string;
  uuid?: string;
  authority: 'DocuComp';
  semanticRole?:
    | 'thesaurus'
    | 'contact'
    | 'pointOfContact'
    | 'constraint'
    | 'distributionContact'
    | 'graphicOverview'
    | 'other';
  observedIsoSlots: string[];
  sourceRecordRefs: string[];
  resolutionState: 'NOT_RESOLVED' | 'RESOLVED' | 'RESOLUTION_ERROR';
  unresolvedXml?: string;
  resolvedXml?: string;
  provenanceRefs: string[];
  isSyntheticConflict?: boolean;
}

export interface IsoSemanticSlot {
  id: string;
  kind: 'isoSemanticSlot';
  xpath: string;
  semanticRole: string;
  canonicalRefs: string[];
  expectedComponentType?: string;
}

export interface ResolverObservation {
  id: string;
  kind: 'resolverObservation';
  componentRef?: string;
  sourceRecordRef: string;
  observedAt: string;
  service: string;
  status: 'PASS' | 'ERROR' | 'NOT_RUN';
  payloadHash?: string;
  rawPayload?: string;
  resolvedXml?: string;
  errorMessage?: string;
  receiptId?: string;
}

export interface ExternalServiceObservation {
  id: string;
  service: string;
  authority: 'NOAA CoMET' | 'NOAA DocuComp';
  upstreamEndpoint: string;
  requestArtifactHash: string;
  responseArtifactHash?: string;
  timestamp: string;
  httpStatus: number | null;
  result: string;
  provenanceType: ProvenanceType;
  authStatus?: 'AUTH_REQUIRED' | 'AUTHENTICATED' | 'NOT_REQUIRED' | 'UNAVAILABLE_FROM_RUNTIME';
  rawResponseSnippet?: string;
  contentType?: string;
}

export type PolicyRuleStatus = 'AUTHORITATIVE' | 'PROVISIONAL' | 'UNRESOLVED';

export interface DocuCompSlotRule {
  ruleId: string;
  componentRole: string;
  allowedSlots: string[];
  authority: string;
  source: string;
  version: string;
  status: PolicyRuleStatus;
  description?: string;
}

export interface DocuCompSlotProfile {
  profileMetadata: {
    profileId: string;
    version: string;
    title: string;
    authority: 'PROVISIONAL' | 'AUTHORITATIVE';
    source: string;
    reviewStatus: 'NEEDS_NOAA_REVIEW' | 'REVIEWED' | 'ADOPTED';
    lastUpdated: string;
    description: string;
  };
  rules: DocuCompSlotRule[];
}

export interface ObservedComponentReference {
  authority: 'DocuComp';
  id: string;
  name: string;
  href: string;
  uuid: string;
  isoSlot: string;
  semanticRole: string;
  sourceRecord?: string;
  lastUpdated?: string;
  componentGroup?: string;
  resolvedXmlSnippet?: string;
}

export interface ScopedAuthorityStatus {
  missionCoverage: number;
  isoState: 'READY' | 'INVALID' | 'UNVERIFIED';
  isoErrorsCount: number;
  cometState: 'NOT VALIDATED' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'WAF_PUBLISH_PASS' | 'UNAVAILABLE';
  stacState: 'READY' | 'NOT TESTED' | 'INVALID';
  oissState: 'NOT TESTED' | 'INGEST_READY' | 'BLOCKED';
  mode: 'READ_ONLY' | 'DEV_DRAFT_AUTHORIZED' | 'PRODUCTION_WRITE_DISABLED';
}

export interface UxSMission {
  id: string;
  title: string;
  alternateTitle: string;
  abstract: string;
  purpose: string;
  supplementalInfo: string;
  status: 'completed' | 'onGoing' | 'planned' | 'underDevelopment';
  resourceType: 'dataset' | 'mission' | 'series' | 'collection';
  dateStart: string;
  dateEnd: string;
  publicationDate: string;
  language: string;
  topicCategory: string[];
  platform: {
    name: string;
    callSign: string;
    type: string;
    uxsCategory: string;
    modelId?: string;
    physicalAssetId?: string;
  };
  instruments: string[];
  instrumentDetails?: Array<{
    model: string;
    serialNumber?: string;
    capability?: string;
    observedProperty?: string;
  }>;
  spatialExtent: SpatialExtent;
  keywords: {
    gcmdScience: string[];
    gcmdPlatforms: string[];
    freeKeywords: string[];
  };
  contact: {
    name: string;
    email: string;
    role: string;
    organization: string;
    rorId?: string;
    docucompRefId?: string;
  };
  doi?: string;
  ceditRecordId?: string;
  ceditStatus?: 'draft' | 'validated' | 'pushed_to_comet' | 'published';
  conformanceScore: number;
  lastUpdated: string;
  docucompReferences?: ObservedComponentReference[];
  claims?: Claim[];
  sourceObservations?: SourceObservation[];
  authorityStatuses?: ScopedAuthorityStatus;
  lifecycleState?: UxSLifecycleState;
  lifecycleTransitions?: LifecycleTransitionHistory[];
}

export interface FederatedSearchResult {
  id: string;
  authority: SourceAuthority;
  title: string;
  subtitle?: string;
  uuid?: string;
  identifier?: string;
  status?: string;
  timestamp?: string;
  dsmmScore?: number;
  metadataSummary: {
    platform?: string;
    sensors?: string[];
    bbox?: [number, number, number, number];
    temporal?: string;
  };
  rawFragment?: string;
  candidateUxsMission?: Partial<UxSMission>;
  claimsCount?: number;
}

export type SignalSeverity = 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION' | 'UNRESOLVED';

export interface SignalFinding {
  id: string;
  severity: SignalSeverity;
  canonicalField: string;
  ruleName: string;
  ruleDescription: string;
  evidenceSummary: string;
  affectedProjections: Array<'ISO' | 'STAC' | 'DCAT' | 'OISS' | 'CoMET'>;
  remediationAction: {
    label: string;
    applyValue?: any;
  };
  resolved?: boolean;
  ruleId?: string;
  componentId?: string;
  message?: string;
  recommendedAction?: string;
  threeTierVerdict?: ThreeTierPlacementVerdict;
  technicalXmlResolves?: boolean;
  isSemanticallyAppropriate?: boolean;
  sourceProfile?: string;
  submissionId?: string;
  sourceFieldId?: string;
  canonicalCandidatePath?: string;
  observedValue?: any;
  explanation?: string;
  evidenceRef?: string;
}

export interface RosettaFieldMapping {
  canonicalKey: string;
  displayName: string;
  canonicalValue: any;
  sidProfileRequirement: string;
  isoXPath: string;
  docucompSlot?: string;
  cometFormField: string;
  stacExtensionKey?: string;
  dcatProperty?: string;
  evidenceSourceCount: number;
  status: 'SYNCHRONIZED' | 'DRIFT_DETECTED' | 'MISSING_SOURCE' | 'PROJECTION_READY';
}

export interface CometRecordServicesInput {
  serviceType:
    | 'Check XML Format'
    | 'Resolve'
    | 'ISO Validate'
    | 'Link Check (slow)'
    | 'NCEI Landing Page'
    | 'ISO to Rubric V2'
    | 'ISO to Rubric V1'
    | 'NCML to ISO'
    | 'FGDC To ISO';
  xmlPayload: string;
}

export interface ExpectedVsObservedDiff {
  field: string;
  expectedValue: any;
  observedValue: any;
  driftType: 'SPECIFICITY_DRIFT' | 'VALUE_MISMATCH' | 'VOCABULARY_TRANSLATION' | 'IDENTICAL';
  suggestedAction: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SuggestedAction {
  label: string;
  actionType: 'apply_field' | 'set_bbox' | 'add_keywords' | 'run_validation' | 'push_comet' | 'apply_batch';
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  suggestedActions?: SuggestedAction[];
  isThinking?: boolean;
}

export type MantaLensMode = 'off' | 'collapsed_strip' | 'wrapped_surface' | 'expanded_workspace';
export type PaneId = 'PRIMARY' | 'SECONDARY';
export type PaneFocusMode =
  | 'BALANCED'
  | 'PRIMARY_FOCUSED'
  | 'SECONDARY_FOCUSED'
  | 'PRIMARY_MAXIMIZED'
  | 'SECONDARY_MAXIMIZED';
export type WorkspaceFamily = 'DISCOVER' | 'UNDERSTAND' | 'DELIVER';

export interface WorkspaceSelection {
  canonicalRef?: string;
  graphNodeId?: string;
  graphEdgeId?: string;
  sourceObservationId?: string;
  claimId?: string;
  projectionRef?: string;
  mapFeatureRef?: string;
  fieldId?: string;
  entityName?: string;
  entityType?: string;
}

export type ActiveWorkspaceTab =
  | 'lifecycle'
  | 'search'
  | 'discovery-intake'
  | 'charlie-intake'
  | 'mission'
  | 'evidence'
  | 'graph'
  | 'constellation'
  | 'signal'
  | 'rosetta'
  | 'projections'
  | 'knowledge-tree'
  | 'comet'
  | 'destination-compare'
  | 'map';

export type UxSLifecycleState =
  | 'ACQUIRE'
  | 'OBSERVE'
  | 'RECONCILE'
  | 'ACCEPT'
  | 'ASSURE'
  | 'PROJECT'
  | 'HANDOFF_READY'
  | 'SUBMITTED'
  | 'DESTINATION_OBSERVED'
  | 'ARCHIVED'
  | 'DISCOVERABLE';

export type LifecycleStageCategory =
  | 'PHYSICAL_OPS'
  | 'EVIDENCE_REASONING'
  | 'METADATA_GOVERNANCE'
  | 'DESTINATION_OBSERVED';

export interface LifecycleGuard {
  id: string;
  label: string;
  satisfied: boolean;
  rationale?: string;
}

export interface LifecycleStageDefinition {
  id: UxSLifecycleState;
  name: string;
  shortLabel: string;
  category: LifecycleStageCategory;
  description: string;
  operationalActor: string;
  typicalArtifacts: string[];
  guards: LifecycleGuard[];
}

export type ReadinessDomainStatus = 'READY' | 'PARTIAL' | 'REVIEW' | 'NOT_EVALUATED' | 'BLOCKED';
export interface ReadinessDomainItem { label: string; status: ReadinessDomainStatus; detail?: string; }
export interface ReadinessDomain { status: ReadinessDomainStatus; label: string; details: string; items: ReadinessDomainItem[]; }

export type DestinationReadinessStatus =
  | 'PROJECTABLE'
  | 'READY_FOR_SERVICE'
  | 'HANDOFF_READY'
  | 'NOT_TESTED'
  | 'UNAVAILABLE'
  | 'NOT_OBSERVED'
  | 'OBSERVED_VERIFIED';
export interface DestinationReadinessGate { status: DestinationReadinessStatus; label: string; description: string; authorityScope: string; upstreamUrl?: string; }
export interface ReadinessCockpitState {
  missionId: string;
  missionTitle: string;
  activeStage: UxSLifecycleState;
  lifecycleState: UxSLifecycleState;
  domains: { vehicle: ReadinessDomain; payload: ReadinessDomain; mission: ReadinessDomain; data: ReadinessDomain; metadata: ReadinessDomain; };
  destinations: { iso: DestinationReadinessGate; stac: DestinationReadinessGate; comet: DestinationReadinessGate; oiss: DestinationReadinessGate; archive: DestinationReadinessGate; discovery: DestinationReadinessGate; };
}

export interface LifecycleTransitionHistory {
  id: string;
  timestamp: string;
  fromState: UxSLifecycleState;
  toState: UxSLifecycleState;
  trigger: string;
  triggerSource?: string;
  actor: string;
  summary: string;
  knowledgeKey?: string;
  knowledgeKeysMinted?: string[];
  canonicalHash?: string;
  rulesHash?: string;
  ledgerBlockId?: string;
  claimsDecided?: string[];
  signalsEvaluated?: string[];
  projectionsGenerated?: string[];
  guardsChecked: Array<{ name: string; passed: boolean; rationale?: string }>;
}
export type UxSLifecycleTransition = LifecycleTransitionHistory;
export interface CeditProfile { id: string; name: string; schemaVersion: string; description: string; badge: string; }

export type KnowledgeNodeKind =
  | 'mission' | 'leg' | 'deployment' | 'platformModel' | 'physicalAsset' | 'platformClass'
  | 'organization' | 'provider' | 'manufacturer' | 'instrumentModel' | 'instrumentInstance'
  | 'dataset' | 'asset' | 'scienceDomain' | 'observedProperty' | 'sensorCapability'
  | 'sourceArtifact' | 'observation' | 'claim' | 'decision' | 'canonicalFact' | 'projection'
  | 'authority' | 'receipt' | 'componentReference' | 'docucompComponent' | 'isoSemanticSlot'
  | 'resolverObservation' | 'stacCollection' | 'stacItem' | 'validationResult' | 'driftFinding'
  | 'destinationObservation';

export type FacetState = 'VERIFIED' | 'SUPPORTED' | 'ACCEPTED' | 'PARTIAL' | 'NOT_TESTED' | 'CONFLICT' | 'UNRESOLVED' | 'PASS' | 'READY';
export type EdgeFamily = 'HIERARCHY' | 'DOMAIN' | 'CAPABILITY' | 'EVIDENCE' | 'DECISION' | 'PROJECTION' | 'EXTERNAL_REFERENCE' | 'VALIDATION' | 'VERIFICATION' | 'DEPENDENCY' | 'SIMILARITY';
export type ProvenanceType = 'LIVE_OBSERVED' | 'IMPORTED_ARTIFACT' | 'LOCAL_DERIVED' | 'SYNTHETIC_FIXTURE' | 'NOT_IMPLEMENTED';
export interface AssuranceFacets { evidence?: FacetState; semantics?: FacetState; profile?: FacetState; projection?: FacetState; destination?: FacetState; qa?: FacetState; }
export interface KnowledgeNode {
  id: string;
  kind: KnowledgeNodeKind;
  label: string;
  subtitle?: string;
  canonicalRef?: string;
  knowledgeKey?: string;
  state?: 'OBSERVED' | 'INFERRED' | 'SUGGESTED' | 'CONFLICT' | 'ACCEPTED' | 'REJECTED' | 'UNRESOLVED';
  facets?: AssuranceFacets;
  evidenceRefs?: string[];
  sourceRefs?: string[];
  metadata?: Record<string, any>;
  coordinates?: { lat: number; lng: number };
  datetime?: string;
  stacItemRef?: string;
  docucompHref?: string;
  docucompUuid?: string;
  docucompSlot?: string;
  unresolvedXml?: string;
  resolvedXml?: string;
  resolutionState?: 'NOT_RESOLVED' | 'RESOLVED' | 'RESOLUTION_ERROR';
  isSyntheticConflict?: boolean;
  provenanceType?: ProvenanceType;
}
export interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  source?: string;
  target?: string;
  predicate: string;
  family?: EdgeFamily;
  direction?: 'FORWARD' | 'REVERSE' | 'BIDIRECTIONAL' | 'UNDIRECTED';
  status: 'OBSERVED' | 'INFERRED' | 'ACCEPTED' | 'REJECTED' | 'CONFLICT' | 'UNRESOLVED';
  confidence?: number;
  evidenceRefs?: string[];
  provenance?: { sourceSystem?: string; sourceRecordId?: string; observedAt?: string; provenanceType?: ProvenanceType; serviceEndpoint?: string; };
  driftDetails?: { expected?: any; observed?: any; driftType?: string; impact?: string; suggestedAction?: string; };
  rosettaMappingRef?: string;
  signalRuleRef?: string;
  affectedProjections?: string[];
  explanation?: string;
}

export interface ThreeTierPlacementVerdict {
  linkResolution: 'RESOLVED' | 'FAILED' | 'NOT_RUN';
  xmlValidation: 'VALID' | 'INVALID' | 'NOT_TESTED';
  semanticPlacement: 'SUPPORTED' | 'CONFLICT' | 'UNRESOLVED';
  componentRef: string;
  observedSlot: string;
  expectedRoles: string[];
  actualRole: string;
  ruleId: string;
  policyStatus?: PolicyRuleStatus;
  policyAuthority?: string;
  policySource?: string;
  details?: string;
}

export type GraphViewAxis = 'MISSION' | 'PROVIDER' | 'PLATFORM' | 'INSTRUMENT' | 'DOMAIN' | 'CAPABILITY' | 'EVIDENCE' | 'VERIFICATION' | 'PROJECTION' | 'AUTHORITY' | 'SIMILARITY' | 'SPACE_TIME';
export interface NodePosition { x: number; y: number; cluster?: string; layer?: number; visible?: boolean; }
export interface KnowledgeGraph { nodes: KnowledgeNode[]; edges: KnowledgeEdge[]; }
export interface GraphRotationState {
  axis: GraphViewAxis;
  secondaryAxis?: GraphViewAxis | 'NONE';
  filterState: 'ALL' | 'ACCEPTED_OBSERVED' | 'CONFLICTS_ONLY' | 'VERIFIED_ONLY';
  focusNeighborhood: 'GLOBAL' | 'SELECTED_1_HOP' | 'SELECTED_2_HOP' | 'DOMAIN_ONLY' | 'EVIDENCE_LINEAGE';
  selectedNodeId?: string;
  selectedEdgeId?: string;
  comparisonTargetNodeId?: string;
}
export interface SimilarityBreakdown {
  targetId: string;
  targetLabel: string;
  overallScore: number;
  components: { semantic: number; topology: number; controlledVocabulary: number; instrument: number; platform: number; spatial: number; temporal: number; provenance: number; };
  sharedFeatures: string[];
  differentFeatures: string[];
}

export type CharlieFieldProvenanceOrigin = 'FORM_OBSERVED' | 'PROFILE_DEFAULT' | 'PROFILE_DERIVED' | 'EXTERNAL_COMPONENT' | 'PROJECTION_DERIVED';
export type CharlieFieldState = 'OBSERVED' | 'UNMAPPED' | 'INVALID' | 'CANDIDATE';
export interface CharlieFormFieldObservation {
  sourceFieldId: string;
  sourceLabel?: string;
  conceptualSection?: string;
  rawValue: any;
  canonicalCandidatePath?: string;
  transformApplied?: string;
  state: CharlieFieldState;
  provenanceOrigin: CharlieFieldProvenanceOrigin;
  evidenceRef: string;
  confidence?: number;
  docucompRef?: string;
  notes?: string;
}
export interface CharlieFormSubmission {
  sourceProfile: 'charlie-google-form-v3';
  submissionId: string;
  observedAt: string;
  submitterEmail?: string;
  fields: CharlieFormFieldObservation[];
  originalPayload: Record<string, any>;
  provenanceType: 'LIVE_OBSERVED' | 'IMPORTED_ARTIFACT' | 'LOCAL_DERIVED' | 'SYNTHETIC_FIXTURE';
}
export type CharlieXmlDiffCategory = 'SAME_MEANING' | 'REPRESENTATION_DIFFERENCE' | 'PROFILE_DEFAULT_DIFFERENCE' | 'MISSING_IN_MANTAS' | 'MISSING_IN_CHARLIE' | 'SEMANTIC_DIFFERENCE' | 'UNRESOLVED';
export interface CharlieXmlRegressionDiff { elementPath: string; charlieValue: string; mantasValue: string; classification: CharlieXmlDiffCategory; explanation: string; citedProfileRef?: string; }

export type ProjectionType = 'STAC_COLLECTION' | 'STAC_ITEM' | 'STAC_ASSET' | 'ISO_19115' | 'DCAT_DATASET' | 'COMET_RECORD' | 'OISS_MANIFEST';
export interface CanonicalProjectionReference { canonicalRef: string; projectionRef: string; projectionType: ProjectionType; label: string; metadata?: Record<string, any>; }

export type IdentityResolutionState = 'EXACT' | 'STRONG_CANDIDATE' | 'WEAK_CANDIDATE' | 'CONFLICT' | 'REJECTED' | 'ACCEPTED';
export interface CandidateIdentityEdge {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceType: KnowledgeNodeKind;
  matchBasis: 'SERIAL_NUMBER' | 'UUID' | 'DOI' | 'ACCESSION' | 'NAME_SIMILARITY' | 'VOCAB_MATCH' | 'EXACT' | 'PARENT_PLATFORM';
  confidence: number;
  state: IdentityResolutionState;
  explanation: string;
  sourceArtifactRef: string;
  rawLabel?: string;
  targetCanonicalKey?: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionRationale?: string;
  competingCandidates?: string[];
}
export interface SourceArtifact {
  id: string;
  name: string;
  artifactType: 'XLSX_WORKBOOK' | 'CSV_TABLE' | 'JSON_FEED' | 'PDF_SPECIFICATION' | 'XML_CATALOG' | 'OPERATIONS_LOG';
  fileName: string;
  sheetName?: string;
  uri?: string;
  artifactHash?: string;
  importedAt: string;
  sourceTimestamp?: string;
  provenanceType: ProvenanceType;
  recordCount?: number;
  description?: string;
  organization?: string;
}
export interface IngestedSourceRow {
  id: string;
  sourceArtifactId: string;
  sourceFile: string;
  sheet?: string;
  row: number;
  column?: string;
  rawField: string;
  rawValue: string;
  sourceTimestamp?: string;
  importTimestamp: string;
  artifactHash?: string;
  candidateEntityKind?: KnowledgeNodeKind;
  candidateKey?: string;
}
export type CapabilityEvidenceLevel = 'POTENTIAL' | 'CONFIGURED' | 'DEPLOYED' | 'DATA_PROVEN';
export interface CapabilityMaturityRecord {
  id: string;
  platformModelId: string;
  platformModelName: string;
  instrumentModelId: string;
  instrumentModelName: string;
  physicalAssetId?: string;
  instrumentInstanceId?: string;
  potential: { supported: boolean; authority: string; evidenceRef: string; excerpt?: string };
  configured: { supported: boolean; authority: string; evidenceRef: string; excerpt?: string };
  deployed: { supported: boolean; authority: string; evidenceRef: string; excerpt?: string };
  dataProven: { supported: boolean; authority: string; evidenceRef: string; excerpt?: string };
  overallMaturity: CapabilityEvidenceLevel;
  explanation: string;
}
export interface CorpusCapabilityQueryResult {
  title: string;
  subtitle: string;
  entityId: string;
  entityKind: KnowledgeNodeKind;
  explanationPath: string[];
  evidenceRefs: string[];
  maturity: CapabilityEvidenceLevel;
  provenanceType: ProvenanceType;
}
export interface CorpusCapabilityQuery { id: string; question: string; category: 'POTENTIAL' | 'DEPLOYED' | 'DATA_PROVEN' | 'IDENTITY' | 'INSTRUMENT' | 'UNRESOLVED'; rationale: string; results: CorpusCapabilityQueryResult[]; }
