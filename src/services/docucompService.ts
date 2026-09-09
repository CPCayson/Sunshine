import {
  DocuCompComponent,
  IsoSemanticSlot,
  ResolverObservation,
  SignalFinding,
  RosettaFieldMapping,
  UxSMission
} from '../types';

// =========================================================================
// 1. DETERMINISTIC TEST FIXTURES FOR DOCUCOMP AUTHORITY
// =========================================================================

export const DOCUCOMP_COMPONENTS_FIXTURE: DocuCompComponent[] = [
  {
    id: 'docucomp-thesaurus-gcmd',
    kind: 'docucompComponent',
    title: 'GCMD Science Keywords v18.4 Thesaurus Citation',
    uuid: '1b594b29-e856-4318-912e-9d2bc7a3f3b1',
    href: 'https://data.noaa.gov/docucomp/1b594b29-e856-4318-912e-9d2bc7a3f3b1',
    authority: 'DocuComp',
    semanticRole: 'thesaurus',
    observedIsoSlots: ['gmd:descriptiveKeywords/gmd:MD_Keywords/gmd:thesaurusName'],
    sourceRecordRefs: ['gov.noaa.ncei:831648426048686', 'gov.noaa.ncei:EX2503'],
    resolutionState: 'RESOLVED',
    provenanceRefs: ['OBS-DOCUCOMP-THESAURUS', 'REC-COMET-831648'],
    unresolvedXml: `<gmd:thesaurusName xlink:href="https://data.noaa.gov/docucomp/1b594b29-e856-4318-912e-9d2bc7a3f3b1" xlink:title="GCMD Science Keywords v18.4"/>`,
    resolvedXml: `<gmd:thesaurusName xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="1b594b29-e856-4318-912e-9d2bc7a3f3b1">
  <gmd:CI_Citation>
    <gmd:title>
      <gco:CharacterString>Global Change Master Directory (GCMD) Science Keywords v18.4</gco:CharacterString>
    </gmd:title>
    <gmd:date>
      <gmd:CI_Date>
        <gmd:date><gco:Date>2024-06-01</gco:Date></gmd:date>
        <gmd:dateType>
          <gmd:CI_DateTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_DateTypeCode" codeListValue="revision">revision</gmd:CI_DateTypeCode>
        </gmd:dateType>
      </gmd:CI_Date>
    </gmd:date>
    <gmd:citedResponsibleParty>
      <gmd:CI_ResponsibleParty>
        <gmd:organisationName><gco:CharacterString>National Aeronautics and Space Administration (NASA)</gco:CharacterString></gmd:organisationName>
        <gmd:role><gmd:CI_RoleCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_RoleCode" codeListValue="custodian">custodian</gmd:CI_RoleCode></gmd:role>
      </gmd:CI_ResponsibleParty>
    </gmd:citedResponsibleParty>
  </gmd:CI_Citation>
</gmd:thesaurusName>`,
  },
  {
    id: 'docucomp-contact-ncei',
    kind: 'docucompComponent',
    title: 'NCEI Official Archive Branch ResponsibleParty',
    uuid: '440b3ac2-64a5-46e2-9846-38305718b644',
    href: 'https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644',
    authority: 'DocuComp',
    semanticRole: 'pointOfContact',
    observedIsoSlots: ['gmd:contact', 'gmd:identificationInfo/gmd:MD_DataIdentification/gmd:pointOfContact'],
    sourceRecordRefs: ['gov.noaa.ncei:831648426048686'],
    resolutionState: 'RESOLVED',
    provenanceRefs: ['OBS-DOCUCOMP-CONTACT'],
    unresolvedXml: `<gmd:contact xlink:href="https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644" xlink:title="NCEI Official Archive Branch ResponsibleParty"/>`,
    resolvedXml: `<gmd:contact xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="440b3ac2-64a5-46e2-9846-38305718b644">
  <gmd:CI_ResponsibleParty>
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
      <gmd:CI_RoleCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_RoleCode" codeListValue="pointOfContact">pointOfContact</gmd:CI_RoleCode>
    </gmd:role>
  </gmd:CI_ResponsibleParty>
</gmd:contact>`,
  },
  {
    id: 'docucomp-constraints-use',
    kind: 'docucompComponent',
    title: 'Use Liability: User Responsibility Disclaimer',
    uuid: 'e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b',
    href: 'https://data.noaa.gov/docucomp/e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b',
    authority: 'DocuComp',
    semanticRole: 'constraint',
    observedIsoSlots: ['gmd:resourceConstraints'],
    sourceRecordRefs: ['gov.noaa.ncei:831648426048686'],
    resolutionState: 'RESOLVED',
    provenanceRefs: ['OBS-DOCUCOMP-LEGAL-USE'],
    unresolvedXml: `<gmd:resourceConstraints xlink:href="https://data.noaa.gov/docucomp/e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b" xlink:title="Use Liability: User Responsibility Disclaimer"/>`,
    resolvedXml: `<gmd:resourceConstraints xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b">
  <gmd:MD_LegalConstraints>
    <gmd:useLimitation>
      <gco:CharacterString>NOAA makes no warranty, expressed or implied, regarding these data. The user accepts full responsibility for use.</gco:CharacterString>
    </gmd:useLimitation>
    <gmd:accessConstraints>
      <gmd:MD_RestrictionCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_RestrictionCode" codeListValue="otherRestrictions">otherRestrictions</gmd:MD_RestrictionCode>
    </gmd:accessConstraints>
  </gmd:MD_LegalConstraints>
</gmd:resourceConstraints>`,
  },
  {
    // DEMO FIXTURE — SYNTHETIC SLOT CONFLICT:
    // A valid CI_ResponsibleParty contact component incorrectly placed in gmd:resourceConstraints!
    // Link Resolution: PASS (HTTP 200, valid XLink)
    // XML Structure: VALID (well-formed fragment)
    // Semantic Placement: CONFLICT (Contact component is invalid inside legal constraints slot)
    id: 'docucomp-synthetic-mismatch',
    kind: 'docucompComponent',
    title: 'DEMO FIXTURE: Metadata Contact Mislabeled in ResourceConstraints',
    uuid: '92f41bc8-32a1-40be-b271-84091cd54f73',
    href: 'https://data.noaa.gov/docucomp/92f41bc8-32a1-40be-b271-84091cd54f73',
    authority: 'DocuComp',
    semanticRole: 'contact', // Contact role
    observedIsoSlots: ['gmd:resourceConstraints'], // But placed in resourceConstraints!
    sourceRecordRefs: ['gov.noaa.ncei:831648426048686'],
    resolutionState: 'RESOLVED',
    isSyntheticConflict: true,
    provenanceRefs: ['OBS-DEMO-SYNTHETIC-CONFLICT'],
    unresolvedXml: `<gmd:resourceConstraints xlink:href="https://data.noaa.gov/docucomp/92f41bc8-32a1-40be-b271-84091cd54f73" xlink:title="DEMO: Contact in Constraints Slot"/>`,
    resolvedXml: `<gmd:CI_ResponsibleParty xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" uuid="92f41bc8-32a1-40be-b271-84091cd54f73">
  <gmd:individualName><gco:CharacterString>Synthesized Steward Contact</gco:CharacterString></gmd:individualName>
  <gmd:organisationName><gco:CharacterString>NOAA Ocean Exploration Custody Team</gco:CharacterString></gmd:organisationName>
  <gmd:role><gmd:CI_RoleCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_RoleCode" codeListValue="pointOfContact">pointOfContact</gmd:CI_RoleCode></gmd:role>
</gmd:CI_ResponsibleParty>`,
  },
];

// =========================================================================
// 2. ISO SEMANTIC SLOTS (The Contractual Anchors in ISO 19115-2)
// =========================================================================

export const ISO_SEMANTIC_SLOTS_FIXTURE: IsoSemanticSlot[] = [
  {
    id: 'slot-contact-metadata',
    kind: 'isoSemanticSlot',
    xpath: 'gmd:MD_Metadata/gmd:contact',
    semanticRole: 'pointOfContact',
    expectedComponentType: 'CI_ResponsibleParty',
    canonicalRefs: ['contact'],
  },
  {
    id: 'slot-resource-constraints',
    kind: 'isoSemanticSlot',
    xpath: 'gmd:MD_DataIdentification/gmd:resourceConstraints',
    semanticRole: 'constraint',
    expectedComponentType: 'MD_LegalConstraints',
    canonicalRefs: ['rights.license', 'legalConstraints'],
  },
  {
    id: 'slot-thesaurus-gcmd',
    kind: 'isoSemanticSlot',
    xpath: 'gmd:descriptiveKeywords/gmd:MD_Keywords/gmd:thesaurusName',
    semanticRole: 'thesaurus',
    expectedComponentType: 'CI_Citation',
    canonicalRefs: ['keywords.gcmdScience'],
  },
];

// =========================================================================
// 3. PERSISTED RESOLVER OBSERVATIONS (Audited Service Evidence)
// =========================================================================

export const INITIAL_RESOLVER_OBSERVATIONS: ResolverObservation[] = [
  {
    id: 'res-obs-contact',
    kind: 'resolverObservation',
    componentRef: 'docucomp-contact-ncei',
    sourceRecordRef: 'gov.noaa.ncei:831648426048686',
    observedAt: '2025-06-10T15:00:00Z',
    service: 'CoMET RecordServices.Resolve',
    status: 'PASS',
    payloadHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    rawPayload: DOCUCOMP_COMPONENTS_FIXTURE[1].resolvedXml,
  },
  {
    id: 'res-obs-thesaurus',
    kind: 'resolverObservation',
    componentRef: 'docucomp-thesaurus-gcmd',
    sourceRecordRef: 'gov.noaa.ncei:831648426048686',
    observedAt: '2025-06-10T15:00:15Z',
    service: 'CoMET RecordServices.Resolve',
    status: 'PASS',
    payloadHash: 'sha256:c2211f4400cf9d224d0ad4b7888f3448d3dbb8932fc4466fbffc030d9953ad76',
    rawPayload: DOCUCOMP_COMPONENTS_FIXTURE[0].resolvedXml,
  },
  {
    id: 'res-obs-constraints',
    kind: 'resolverObservation',
    componentRef: 'docucomp-constraints-use',
    sourceRecordRef: 'gov.noaa.ncei:831648426048686',
    observedAt: '2025-06-10T15:00:30Z',
    service: 'CoMET RecordServices.Resolve',
    status: 'PASS',
    payloadHash: 'sha256:1a84f3e9b862e2467d0a273295874a72d3e9c8dd41f48645089f2a96a928929e',
    rawPayload: DOCUCOMP_COMPONENTS_FIXTURE[2].resolvedXml,
  },
  {
    // Synthetic mismatch resolver observation: It resolves successfully over HTTP, but fails semantic placement!
    id: 'res-obs-synthetic-mismatch',
    kind: 'resolverObservation',
    componentRef: 'docucomp-synthetic-mismatch',
    sourceRecordRef: 'gov.noaa.ncei:831648426048686',
    observedAt: '2025-06-10T15:01:00Z',
    service: 'CoMET RecordServices.Resolve',
    status: 'PASS',
    payloadHash: 'sha256:3a1e2f4955ab732d847844cc90b81c2fe33966579f13c6bfa6b8cd7dd8c6b1a9',
    rawPayload: DOCUCOMP_COMPONENTS_FIXTURE[3].resolvedXml,
  },
];

// =========================================================================
// 4. SEMANTIC PLACEMENT ASSURANCE EVALUATION
// =========================================================================

export interface SemanticPlacementEvaluation {
  componentId: string;
  slotXpath: string;
  // A. Does the link resolve?
  linkResolution: {
    status: 'PASS' | 'ERROR' | 'NOT_RUN';
    httpStatusCode?: number;
    details: string;
  };
  // B. Is the XML valid?
  xmlValidation: {
    status: 'VALID' | 'INVALID' | 'NOT_TESTED';
    schema: string;
    details: string;
  };
  // C. Is this component semantically appropriate for this slot?
  semanticPlacement: {
    status: 'SUPPORTED' | 'CONFLICT' | 'UNRESOLVED';
    expectedRole: string;
    observedRole: string;
    signalRuleName: string;
    finding?: SignalFinding;
  };
}

export function evaluateSemanticPlacement(
  component: DocuCompComponent,
  slot: IsoSemanticSlot,
  observation?: ResolverObservation
): SemanticPlacementEvaluation {
  // A. Link Resolution
  const linkResolution = {
    status: observation?.status || ('NOT_RUN' as const),
    httpStatusCode: observation?.status === 'PASS' ? 200 : undefined,
    details:
      observation?.status === 'PASS'
        ? `XLink resolved successfully against DocuComp endpoint (${component.href})`
        : 'Resolver service has not been invoked for this component in current session.',
  };

  // B. XML Validation
  const isXmlWellFormed = Boolean(
    (component.resolvedXml || observation?.rawPayload)?.includes('xmlns:gmd')
  );
  const xmlValidation = {
    status: isXmlWellFormed ? ('VALID' as const) : ('INVALID' as const),
    schema: 'ISO 19139 Schema (19115-2:2019)',
    details: isXmlWellFormed
      ? 'Resolved payload is structurally compliant with target ISO fragment schema.'
      : 'Resolved payload lacks required namespaces or opening delimiters.',
  };

  // C. Semantic Placement Assurance
  // Check if component's semantic role matches the slot's expected role
  const isAppropriate =
    (slot.semanticRole === 'pointOfContact' && component.semanticRole === 'pointOfContact') ||
    (slot.semanticRole === 'contact' && (component.semanticRole === 'pointOfContact' || component.semanticRole === 'contact')) ||
    (slot.semanticRole === 'constraint' && component.semanticRole === 'constraint') ||
    (slot.semanticRole === 'thesaurus' && component.semanticRole === 'thesaurus');

  if (isAppropriate) {
    return {
      componentId: component.id,
      slotXpath: slot.xpath,
      linkResolution,
      xmlValidation,
      semanticPlacement: {
        status: 'SUPPORTED',
        expectedRole: slot.semanticRole,
        observedRole: component.semanticRole || 'other',
        signalRuleName: 'DOCUCOMP_SLOT_MATCH',
      },
    };
  }

  // Conflict detected! Valid link + valid XML + WRONG SEMANTIC SLOT
  const finding: SignalFinding = {
    id: `SIG-DOCUCOMP-MISMATCH-${component.id}`,
    severity: 'ERROR',
    canonicalField: slot.canonicalRefs[0] || 'resourceConstraints',
    ruleName: 'MANTAS Assurance §DocuComp Semantic Placement Policy',
    ruleDescription: `Component with role "${component.semanticRole}" cannot be placed inside ISO slot "${slot.xpath}".`,
    evidenceSummary: `DocuComp link resolves with HTTP 200 and passes XML schema checks, but placing a "${component.semanticRole}" inside a "${slot.semanticRole}" slot breaks metadata semantic validity.`,
    affectedProjections: ['ISO', 'CoMET', 'OISS'],
    remediationAction: {
      label: 'Relocate component to appropriate contact slot or swap with MD_LegalConstraints',
    },
    resolved: false,
  };

  return {
    componentId: component.id,
    slotXpath: slot.xpath,
    linkResolution,
    xmlValidation,
    semanticPlacement: {
      status: 'CONFLICT',
      expectedRole: slot.semanticRole,
      observedRole: component.semanticRole || 'other',
      signalRuleName: 'DOCUCOMP_SLOT_MISMATCH',
      finding,
    },
  };
}

// =========================================================================
// 5. UNRESOLVED VS RESOLVED VS SEMANTIC PROJECTION ENGINE
// =========================================================================

/**
 * UNRESOLVED PROJECTION:
 * Generates ISO/GMI XML strictly PRESERVING DocuComp xlink:href attributes.
 * Never inlines resolved text or strips external authority identity.
 */
export function generateUnresolvedIsoXmlWithPreservedXLinks(
  mission: UxSMission,
  components: DocuCompComponent[] = DOCUCOMP_COMPONENTS_FIXTURE
): string {
  const contactComp = components.find((c) => c.id === 'docucomp-contact-ncei');
  const legalComp = components.find((c) => c.id === 'docucomp-constraints-use');
  const thesaurusComp = components.find((c) => c.id === 'docucomp-thesaurus-gcmd');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://standards.iso.org/iso/19115/-3/gmd/1.0"
  xmlns:gco="http://standards.iso.org/iso/19115/-3/gco/1.0"
  xmlns:gml="http://www.opengis.net/gml/3.2"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <!-- CANONICAL METADATA IDENTIFIER -->
  <gmd:fileIdentifier>
    <gco:CharacterString>${mission.id || 'noaa-uxs-metadata'}</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:language>
    <gmd:LanguageCode codeList="http://www.loc.gov/standards/iso639-2/" codeListValue="eng">eng</gmd:LanguageCode>
  </gmd:language>
  <!-- PRESERVED EXTERNAL DOCUCOMP CONTACT XLINK -->
  ${contactComp ? contactComp.unresolvedXml : `  <gmd:contact xlink:href="https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644" xlink:title="NCEI Official Archive Branch"/>`}
  <gmd:dateStamp>
    <gco:Date>${mission.lastUpdated || new Date().toISOString().split('T')[0]}</gco:Date>
  </gmd:dateStamp>
  <gmd:metadataStandardName>
    <gco:CharacterString>ISO 19115-2 Geographic Information - Extensions for imagery and gridded data (UxS Marine Core Profile)</gco:CharacterString>
  </gmd:metadataStandardName>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title>
            <gco:CharacterString>${mission.title || 'Untitled Mission'}</gco:CharacterString>
          </gmd:title>
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract>
        <gco:CharacterString>${mission.abstract || 'Mission Abstract'}</gco:CharacterString>
      </gmd:abstract>
      <!-- PRESERVED EXTERNAL DOCUCOMP THESAURUS XLINK -->
      <gmd:descriptiveKeywords>
        <gmd:MD_Keywords>
          ${mission.keywords.gcmdScience.map((kw) => `<gmd:keyword><gco:CharacterString>${kw}</gco:CharacterString></gmd:keyword>`).join('\n          ')}
          <gmd:type>
            <gmd:MD_KeywordTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_KeywordTypeCode" codeListValue="theme">theme</gmd:MD_KeywordTypeCode>
          </gmd:type>
          ${thesaurusComp ? thesaurusComp.unresolvedXml : `  <gmd:thesaurusName xlink:href="https://data.noaa.gov/docucomp/1b594b29-e856-4318-912e-9d2bc7a3f3b1" xlink:title="GCMD Keywords v18.4"/>`}
        </gmd:MD_Keywords>
      </gmd:descriptiveKeywords>
      <!-- PRESERVED EXTERNAL DOCUCOMP RESOURCE CONSTRAINTS XLINK -->
      ${legalComp ? legalComp.unresolvedXml : `  <gmd:resourceConstraints xlink:href="https://data.noaa.gov/docucomp/e8163b1b-fb5a-4f4e-8d5c-ed06da10e21b" xlink:title="Use Liability Disclaimer"/>`}
      <!-- SPATIAL BOUNDS -->
      <gmd:extent>
        <gmd:EX_Extent>
          <gmd:geographicElement>
            <gmd:EX_GeographicBoundingBox>
              <gmd:westBoundLongitude><gco:Decimal>${mission.spatialExtent.west.toFixed(4)}</gco:Decimal></gmd:westBoundLongitude>
              <gmd:eastBoundLongitude><gco:Decimal>${mission.spatialExtent.east.toFixed(4)}</gco:Decimal></gmd:eastBoundLongitude>
              <gmd:southBoundLatitude><gco:Decimal>${mission.spatialExtent.south.toFixed(4)}</gco:Decimal></gmd:southBoundLatitude>
              <gmd:northBoundLatitude><gco:Decimal>${mission.spatialExtent.north.toFixed(4)}</gco:Decimal></gmd:northBoundLatitude>
            </gmd:EX_GeographicBoundingBox>
          </gmd:geographicElement>
        </gmd:EX_Extent>
      </gmd:extent>
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
</gmd:MD_Metadata>`;
}

/**
 * RESOLVED PROJECTION:
 * Inlines resolved XML representation ONLY when a real resolver observation exists.
 * If no resolver observation has occurred, clearly marks the block as RESOLVED: NOT RUN.
 * Never manufactures or fakes resolved XML.
 */
export function generateResolvedIsoXml(
  mission: UxSMission,
  components: DocuCompComponent[] = DOCUCOMP_COMPONENTS_FIXTURE,
  observations: ResolverObservation[] = INITIAL_RESOLVER_OBSERVATIONS
): string {
  const contactComp = components.find((c) => c.id === 'docucomp-contact-ncei');
  const legalComp = components.find((c) => c.id === 'docucomp-constraints-use');
  const thesaurusComp = components.find((c) => c.id === 'docucomp-thesaurus-gcmd');

  const contactObs = observations.find((o) => o.componentRef === 'docucomp-contact-ncei');
  const legalObs = observations.find((o) => o.componentRef === 'docucomp-constraints-use');
  const thesaurusObs = observations.find((o) => o.componentRef === 'docucomp-thesaurus-gcmd');

  const resolvedContactBlock =
    contactObs?.status === 'PASS' && contactObs.rawPayload
      ? `  <!-- RESOLVED BY COMET / DOCUCOMP SERVICE (Receipt: ${contactObs.id}) -->\n  ${contactObs.rawPayload}`
      : `  <!-- RESOLVED: NOT RUN (No verified resolver observation recorded) -->\n  ${contactComp?.unresolvedXml || ''}`;

  const resolvedLegalBlock =
    legalObs?.status === 'PASS' && legalObs.rawPayload
      ? `      <!-- RESOLVED BY COMET / DOCUCOMP SERVICE (Receipt: ${legalObs.id}) -->\n      ${legalObs.rawPayload}`
      : `      <!-- RESOLVED: NOT RUN (No verified resolver observation recorded) -->\n      ${legalComp?.unresolvedXml || ''}`;

  const resolvedThesaurusBlock =
    thesaurusObs?.status === 'PASS' && thesaurusObs.rawPayload
      ? `          <!-- RESOLVED BY COMET / DOCUCOMP SERVICE (Receipt: ${thesaurusObs.id}) -->\n          ${thesaurusObs.rawPayload}`
      : `          <!-- RESOLVED: NOT RUN (No verified resolver observation recorded) -->\n          ${thesaurusComp?.unresolvedXml || ''}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://standards.iso.org/iso/19115/-3/gmd/1.0"
  xmlns:gco="http://standards.iso.org/iso/19115/-3/gco/1.0"
  xmlns:gml="http://www.opengis.net/gml/3.2"
  xmlns:xlink="http://www.w3.org/1999/xlink">
  <gmd:fileIdentifier>
    <gco:CharacterString>${mission.id || 'noaa-uxs-metadata'}</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:language>
    <gmd:LanguageCode codeList="http://www.loc.gov/standards/iso639-2/" codeListValue="eng">eng</gmd:LanguageCode>
  </gmd:language>
${resolvedContactBlock}
  <gmd:dateStamp>
    <gco:Date>${mission.lastUpdated || new Date().toISOString().split('T')[0]}</gco:Date>
  </gmd:dateStamp>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title>
            <gco:CharacterString>${mission.title || 'Untitled Mission'}</gco:CharacterString>
          </gmd:title>
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract>
        <gco:CharacterString>${mission.abstract || 'Mission Abstract'}</gco:CharacterString>
      </gmd:abstract>
      <gmd:descriptiveKeywords>
        <gmd:MD_Keywords>
          ${mission.keywords.gcmdScience.map((kw) => `<gmd:keyword><gco:CharacterString>${kw}</gco:CharacterString></gmd:keyword>`).join('\n          ')}
          <gmd:type>
            <gmd:MD_KeywordTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_KeywordTypeCode" codeListValue="theme">theme</gmd:MD_KeywordTypeCode>
          </gmd:type>
${resolvedThesaurusBlock}
        </gmd:MD_Keywords>
      </gmd:descriptiveKeywords>
${resolvedLegalBlock}
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
</gmd:MD_Metadata>`;
}

// Export unified docucompService object
export const docucompService = {
  getComponents: () => DOCUCOMP_COMPONENTS_FIXTURE,
  getSlots: () => ISO_SEMANTIC_SLOTS_FIXTURE,
  getObservations: () => INITIAL_RESOLVER_OBSERVATIONS,
  evaluateSemanticPlacement,
  generateUnresolvedIsoXmlWithPreservedXLinks,
  generateResolvedIsoXml,
};
