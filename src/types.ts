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
  polygon?: [number, number][]; // [lat, lng] pairs for dive tracks / boundary
}

// ----------------------------------------------------
// FIRST-CLASS EVIDENCE & SOURCE OBSERVATION MODEL
// ----------------------------------------------------
export type SourceAuthority =
  | 'CoMET'
  | 'OneStop'
  | 'DocuComp'
  | 'STAC'
  | 'UxS Registry'
  | 'Cruise Report'
  | 'Ship Sensor Log'
  | 'OISS Harvest';

export interface SourceObservation {
  id: string;
  authority: SourceAuthority;
  sourceUri?: string;
  sourceTitle: string;
  documentExcerpt?: string;
  rawFragment?: string;
  observedAt: string;
  observedBy?: string;
  reliabilityScore: number; // 0.0 - 1.0
}

export type ClaimState =
  | 'OBSERVED'
  | 'INFERRED'
  | 'CONFLICT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'UNRESOLVED';

// Distinct, non-collapsible platform-sensor-science predicates
export type RelationshipPredicate =
  | 'CAN_CARRY'         // PlatformModel -> InstrumentModel
  | 'CONFIGURED_WITH'   // PhysicalAsset -> InstrumentInstance
  | 'CARRIED'           // Deployment -> InstrumentInstance
  | 'PRODUCED'          // InstrumentInstance -> Dataset
  | 'SUPPORTED_BY'      // ScienceDomain -> ObservedProperty
  | 'OBSERVABLE_BY'     // ObservedProperty -> SensorCapability
  | 'IMPLEMENTED_BY';   // SensorCapability -> InstrumentModel

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
  confidence: number; // 0.0 - 1.0
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

// ----------------------------------------------------
// DOCUCOMP COMPONENT REFERENCE PRESERVATION
// ----------------------------------------------------
// ----------------------------------------------------
// FIRST-CLASS DOCUCOMP & SEMANTIC AUTHORITY TYPES
// ----------------------------------------------------
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
  service: string; // e.g. 'POST /recordServices/validate'
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
  href: string; // e.g. https://data.noaa.gov/docucomp/25eba8fb-22f1-4b30-a262-f84238369d75
  uuid: string;
  isoSlot: string; // e.g. gmd:resourceConstraints, gmd:contact, gmi:platform
  semanticRole: string; // e.g. distributionLiability, pointOfContact, platformDefinition
  sourceRecord?: string;
  lastUpdated?: string;
  componentGroup?: string;
  resolvedXmlSnippet?: string;
}

// ----------------------------------------------------
// SCOPED SYSTEM AUTHORITY STATUSES (NEVER A GLOBAL GREEN)
// ----------------------------------------------------
export interface ScopedAuthorityStatus {
  missionCoverage: number; // e.g. 86% profile coverage
  isoState: 'READY' | 'INVALID' | 'UNVERIFIED';
  isoErrorsCount: number;
  cometState: 'NOT VALIDATED' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'WAF_PUBLISH_PASS' | 'UNAVAILABLE';
  stacState: 'READY' | 'NOT TESTED' | 'INVALID';
  oissState: 'NOT TESTED' | 'INGEST_READY' | 'BLOCKED';
  mode: 'READ_ONLY' | 'DEV_DRAFT_AUTHORIZED' | 'PRODUCTION_WRITE_DISABLED';
}

// ----------------------------------------------------
// CANONICAL UXSMISSION (THE CENTRAL TRUTH)
// ----------------------------------------------------
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
    uxsCategory: string; // e.g. 'UUV' | 'ROV' | 'USV' | 'Glider' | 'Host Vessel'
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

  // New first-class evidence & component references
  docucompReferences?: ObservedComponentReference[];
  claims?: Claim[];
  sourceObservations?: SourceObservation[];
  authorityStatuses?: ScopedAuthorityStatus;
}

// ----------------------------------------------------
// FEDERATED SEARCH TYPES
// ----------------------------------------------------
export interface FederatedSearchResult {
  id: string;
  authority: SourceAuthority;
  title: string;
  subtitle?: string;
  uuid?: string;
  identifier?: string;
  status?: string;
  timestamp?: string;
  dsmmScore?: number; // OneStop DSMM score e.g. 3.8
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

// ----------------------------------------------------
// SIGNAL ASSURANCE TYPES
// ----------------------------------------------------
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
}

// ----------------------------------------------------
// ROSETTA CONCEPT MAPPING TYPES
// ----------------------------------------------------
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

// ----------------------------------------------------
// COMET ADAPTER API CONTRACT (data.noaa.gov/cedit/openApiDoc.html)
// ----------------------------------------------------
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

export type ActiveWorkspaceTab =
  | 'search'
  | 'mission'
  | 'evidence'
  | 'graph'
  | 'signal'
  | 'rosetta'
  | 'projections'
  | 'comet';

export interface CeditProfile {
  id: string;
  name: string;
  schemaVersion: string;
  description: string;
  badge: string;
}

// ----------------------------------------------------
// MULTIDIMENSIONAL KNOWLEDGE GRAPH CONTRACTS
// ----------------------------------------------------

export type KnowledgeNodeKind =
  | 'mission'
  | 'leg'
  | 'deployment'
  | 'platformModel'
  | 'physicalAsset'
  | 'instrumentModel'
  | 'instrumentInstance'
  | 'dataset'
  | 'asset'
  | 'scienceDomain'
  | 'observedProperty'
  | 'sensorCapability'
  | 'sourceArtifact'
  | 'observation'
  | 'claim'
  | 'decision'
  | 'canonicalFact'
  | 'projection'
  | 'authority'
  | 'receipt'
  | 'componentReference'
  | 'docucompComponent'
  | 'isoSemanticSlot'
  | 'resolverObservation'
  | 'stacCollection'
  | 'stacItem'
  | 'validationResult'
  | 'driftFinding';

export type FacetState =
  | 'VERIFIED'
  | 'SUPPORTED'
  | 'ACCEPTED'
  | 'PARTIAL'
  | 'NOT_TESTED'
  | 'CONFLICT'
  | 'UNRESOLVED'
  | 'PASS'
  | 'READY';

export type EdgeFamily =
  | 'HIERARCHY'
  | 'DOMAIN'
  | 'CAPABILITY'
  | 'EVIDENCE'
  | 'DECISION'
  | 'PROJECTION'
  | 'EXTERNAL_REFERENCE'
  | 'VALIDATION'
  | 'VERIFICATION'
  | 'DEPENDENCY'
  | 'SIMILARITY';

export type ProvenanceType =
  | 'LIVE_OBSERVED'
  | 'IMPORTED_ARTIFACT'
  | 'LOCAL_DERIVED'
  | 'SYNTHETIC_FIXTURE'
  | 'NOT_IMPLEMENTED';

export interface AssuranceFacets {
  evidence?: FacetState;
  semantics?: FacetState;
  profile?: FacetState;
  projection?: FacetState;
  destination?: FacetState;
  qa?: FacetState;
}

export interface KnowledgeNode {
  id: string;
  kind: KnowledgeNodeKind;
  label: string;
  subtitle?: string;
  canonicalRef?: string;
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
  provenance?: {
    sourceSystem?: string;
    sourceRecordId?: string;
    observedAt?: string;
    provenanceType?: ProvenanceType;
    serviceEndpoint?: string;
  };
  driftDetails?: {
    expected?: any;
    observed?: any;
    driftType?: string;
    impact?: string;
    suggestedAction?: string;
  };
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

export type GraphViewAxis =
  | 'MISSION'
  | 'DOMAIN'
  | 'CAPABILITY'
  | 'EVIDENCE'
  | 'VERIFICATION'
  | 'PROJECTION'
  | 'AUTHORITY'
  | 'SIMILARITY'
  | 'SPACE_TIME';

export interface NodePosition {
  x: number;
  y: number;
  cluster?: string;
  layer?: number;
  visible?: boolean;
}

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
  components: {
    semantic: number;
    topology: number;
    controlledVocabulary: number;
    instrument: number;
    platform: number;
    spatial: number;
    temporal: number;
    provenance: number;
  };
  sharedFeatures: string[];
  differentFeatures: string[];
}

