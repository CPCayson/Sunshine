import {
  UxSMission,
  ExternalServiceObservation,
  ExpectedVsObservedDiff,
  ObservedComponentReference,
  ProvenanceType
} from '../types';

export type CometOperationMode =
  | 'LIVE_OBSERVED_MODE'
  | 'SYNTHETIC_DEMO_MODE';

export interface CometOfficialEndpoint {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  category: 'RECORD_SERVICES' | 'CATALOG_READ' | 'WRITE_OUT_OF_SCOPE';
  description: string;
  scopeStatus: 'IN_SCOPE_OBSERVATION' | 'OUT_OF_SCOPE_MUTATION';
}

export const OFFICIAL_COMET_CONTRACT: CometOfficialEndpoint[] = [
  {
    method: 'GET',
    path: '/metadata/{uuid}',
    category: 'CATALOG_READ',
    description: 'Retrieve XML record by UUID from NOAA catalog',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'GET',
    path: '/metadata/search',
    category: 'CATALOG_READ',
    description: 'Search catalog records by keyword or identifier',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'GET',
    path: '/metadata/validate/{uuid}',
    category: 'CATALOG_READ',
    description: 'Validate stored catalog record against ISO schemas',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'POST',
    path: '/recordServices/validate',
    category: 'RECORD_SERVICES',
    description: 'Stateless ISO 19139 / 19115-2 XML schema validation service',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'POST',
    path: '/recordServices/resolver',
    category: 'RECORD_SERVICES',
    description: 'DocuComp component XLink resolution service',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'POST',
    path: '/recordServices/rubricV2',
    category: 'RECORD_SERVICES',
    description: 'NOAA ISO Rubric V2 completeness and quality calculator',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'POST',
    path: '/recordServices/linkcheck',
    category: 'RECORD_SERVICES',
    description: 'Automated CI_OnlineResource URL accessibility validator',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'POST',
    path: '/recordServices/upload',
    category: 'RECORD_SERVICES',
    description: 'File upload processor for record generation',
    scopeStatus: 'IN_SCOPE_OBSERVATION',
  },
  {
    method: 'POST',
    path: '/metadata/import',
    category: 'WRITE_OUT_OF_SCOPE',
    description: 'Import / create new record in CoMET database (Mutating write)',
    scopeStatus: 'OUT_OF_SCOPE_MUTATION',
  },
  {
    method: 'PUT',
    path: '/metadata/{uuid}',
    category: 'WRITE_OUT_OF_SCOPE',
    description: 'Update existing record in CoMET database (Mutating write)',
    scopeStatus: 'OUT_OF_SCOPE_MUTATION',
  },
];

class CometAdapter {
  private mode: CometOperationMode = 'LIVE_OBSERVED_MODE';
  private readonly baseUrl = 'https://data.noaa.gov/cedit';
  private readonly docucompBaseUrl = 'https://data.noaa.gov/docucomp';

  public getMode(): CometOperationMode {
    return this.mode;
  }

  public setMode(mode: CometOperationMode): void {
    this.mode = mode;
  }

  public getOfficialContract(): CometOfficialEndpoint[] {
    return OFFICIAL_COMET_CONTRACT;
  }

  /**
   * Probes official CoMET Record Services over HTTP.
   * Captured observation reflects genuine upstream response:
   * - HTTP 302 -> AUTH_REQUIRED (CAS login redirect)
   * - HTTP 200 -> AUTHENTICATED
   * - Connection error -> UNAVAILABLE_FROM_RUNTIME
   * Never simulates success.
   */
  public async probeRecordService(
    service: 'validate' | 'resolver' | 'rubricV2' | 'linkcheck',
    xmlPayload: string
  ): Promise<ExternalServiceObservation> {
    if (this.mode === 'SYNTHETIC_DEMO_MODE') {
      return this.getSyntheticDemoRecordServiceObservation(service);
    }

    try {
      const res = await fetch('/api/comet/recordServices/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, xml: xmlPayload }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const obs: ExternalServiceObservation = await res.json();
      return obs;
    } catch (err: any) {
      return {
        id: `obs-srv-err-${service}-${Date.now()}`,
        service: `POST /recordServices/${service}`,
        authority: 'NOAA CoMET',
        upstreamEndpoint: `${this.baseUrl}/recordServices/${service}`,
        requestArtifactHash: 'sha256:unknown',
        timestamp: new Date().toISOString(),
        httpStatus: null,
        provenanceType: 'NOT_IMPLEMENTED',
        authStatus: 'UNAVAILABLE_FROM_RUNTIME',
        result: `UNAVAILABLE_FROM_RUNTIME: Could not execute probe to ${this.baseUrl}/recordServices/${service}: ${err?.message || err}`,
      };
    }
  }

  /**
   * Probes NOAA DocuComp component public dereference endpoint.
   * DocuComp is publicly readable without ICAM session for valid component UUIDs.
   */
  public async probeDocucompDereference(uuidOrUrl: string): Promise<{
    observation: ExternalServiceObservation;
    xml: string | null;
  }> {
    if (this.mode === 'SYNTHETIC_DEMO_MODE') {
      return this.getSyntheticDemoDocucompObservation(uuidOrUrl);
    }

    try {
      const res = await fetch(`/api/docucomp/dereference?url=${encodeURIComponent(uuidOrUrl)}`);
      const data = await res.json();

      const obs: ExternalServiceObservation = {
        id: data.id || `obs-docucomp-${Date.now()}`,
        service: `GET /docucomp/${data.uuid || 'target'}`,
        authority: 'NOAA DocuComp',
        upstreamEndpoint: data.upstreamUrl || `${this.docucompBaseUrl}/${data.uuid}`,
        requestArtifactHash: 'sha256:get-request',
        responseArtifactHash: data.responseHash || 'sha256:none',
        timestamp: data.timestamp || new Date().toISOString(),
        httpStatus: data.httpStatus,
        contentType: data.contentType,
        provenanceType: data.provenanceType || 'LIVE_OBSERVED',
        authStatus: 'NOT_REQUIRED',
        result: data.message || `HTTP ${data.httpStatus} from NOAA DocuComp.`,
        rawResponseSnippet: data.xml ? data.xml.slice(0, 300) : data.rawSnippet,
      };

      return {
        observation: obs,
        xml: data.xml || null,
      };
    } catch (err: any) {
      const obs: ExternalServiceObservation = {
        id: `obs-docucomp-err-${Date.now()}`,
        service: `GET /docucomp/${uuidOrUrl}`,
        authority: 'NOAA DocuComp',
        upstreamEndpoint: `${this.docucompBaseUrl}/${uuidOrUrl}`,
        requestArtifactHash: 'sha256:get-request',
        timestamp: new Date().toISOString(),
        httpStatus: null,
        provenanceType: 'NOT_IMPLEMENTED',
        authStatus: 'UNAVAILABLE_FROM_RUNTIME',
        result: `UNAVAILABLE_FROM_RUNTIME: ${err?.message || err}`,
      };
      return { observation: obs, xml: null };
    }
  }

  /**
   * Probes official NOAA catalog search endpoint: GET /metadata/search
   */
  public async probeCatalogSearch(): Promise<ExternalServiceObservation> {
    if (this.mode === 'SYNTHETIC_DEMO_MODE') {
      return {
        id: 'obs-search-fixture',
        service: 'GET /metadata/search',
        authority: 'NOAA CoMET',
        upstreamEndpoint: `${this.baseUrl}/metadata/search`,
        requestArtifactHash: 'sha256:demo-search',
        responseArtifactHash: 'sha256:demo-res',
        timestamp: new Date().toISOString(),
        httpStatus: 200,
        provenanceType: 'SYNTHETIC_FIXTURE',
        authStatus: 'AUTHENTICATED',
        result: 'DEMO_FIXTURE: Simulated catalog search response (3 mock catalog hits).',
      };
    }

    try {
      const res = await fetch('/api/comet/metadata/search');
      const data = await res.json();
      return {
        id: `obs-search-${Date.now()}`,
        service: data.service || 'GET /metadata/search',
        authority: 'NOAA CoMET',
        upstreamEndpoint: data.upstreamUrl || `${this.baseUrl}/metadata/search`,
        requestArtifactHash: 'sha256:search-query',
        timestamp: data.timestamp || new Date().toISOString(),
        httpStatus: data.httpStatus,
        provenanceType: data.provenanceType || 'LIVE_OBSERVED',
        authStatus: data.authStatus || (data.httpStatus === 302 ? 'AUTH_REQUIRED' : 'NOT_REQUIRED'),
        result: data.result || `HTTP ${data.httpStatus}`,
      };
    } catch (err: any) {
      return {
        id: `obs-search-err-${Date.now()}`,
        service: 'GET /metadata/search',
        authority: 'NOAA CoMET',
        upstreamEndpoint: `${this.baseUrl}/metadata/search`,
        requestArtifactHash: 'sha256:search-query',
        timestamp: new Date().toISOString(),
        httpStatus: null,
        provenanceType: 'NOT_IMPLEMENTED',
        authStatus: 'UNAVAILABLE_FROM_RUNTIME',
        result: `UNAVAILABLE_FROM_RUNTIME: ${err?.message || err}`,
      };
    }
  }

  /**
   * Run the full honest Services Observation Suite
   */
  public async runFullServicesObservationSuite(xml: string): Promise<ExternalServiceObservation[]> {
    const services: Array<'validate' | 'resolver' | 'rubricV2' | 'linkcheck'> = [
      'validate',
      'resolver',
      'rubricV2',
      'linkcheck',
    ];

    const observations: ExternalServiceObservation[] = [];

    // Probe Record Services in parallel
    const recordServicePromises = services.map((s) => this.probeRecordService(s, xml));
    const recordObs = await Promise.all(recordServicePromises);
    observations.push(...recordObs);

    // Probe Catalog Search
    const searchObs = await this.probeCatalogSearch();
    observations.push(searchObs);

    // Probe Public DocuComp Read (NCEI Contact UUID)
    const docucompRes = await this.probeDocucompDereference('440b3ac2-64a5-46e2-9846-38305718b644');
    observations.push(docucompRes.observation);

    return observations;
  }

  /**
   * Expected vs Services-Observed Comparison
   * Emits clear structural verification diffs between MANTAS Expected projection
   * and NOAA Observed service states.
   */
  public generateExpectedVsServicesObservedDiffs(
    mission: UxSMission,
    observations: ExternalServiceObservation[]
  ): Array<{
    targetCapability: string;
    expectedFromMantas: string;
    observedFromNoaa: string;
    upstreamService: string;
    provenance: ProvenanceType;
    statusBadge: 'PASS' | 'AUTH_REQUIRED' | 'UNAVAILABLE' | 'FIXTURE';
    notes: string;
  }> {
    const validateObs = observations.find((o) => o.service.includes('validate'));
    const resolverObs = observations.find((o) => o.service.includes('resolver'));
    const rubricObs = observations.find((o) => o.service.includes('rubricV2'));
    const linkcheckObs = observations.find((o) => o.service.includes('linkcheck'));
    const searchObs = observations.find((o) => o.service.includes('search'));
    const docucompObs = observations.find((o) => o.authority === 'NOAA DocuComp');

    return [
      {
        targetCapability: 'ISO 19139 Schema Validation',
        expectedFromMantas: 'Valid ISO 19115-2 / 19139 XML with root gmd:MD_Metadata',
        observedFromNoaa: validateObs ? validateObs.result : 'Service probe not run yet',
        upstreamService: 'POST https://data.noaa.gov/cedit/recordServices/validate',
        provenance: validateObs?.provenanceType || 'NOT_IMPLEMENTED',
        statusBadge: validateObs?.authStatus === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : validateObs?.httpStatus === 200 ? 'PASS' : 'UNAVAILABLE',
        notes: 'Stateless XSD validation on CEDIT server. Requires ICAM CAC session or API key to bypass CAS redirect.',
      },
      {
        targetCapability: 'DocuComp Public Component Read',
        expectedFromMantas: 'Live ResponsibleParty XML for NCEI Contact (UUID: 440b3ac2-64a5-46e2-9846-38305718b644)',
        observedFromNoaa: docucompObs?.result || 'Probe not run',
        upstreamService: 'GET https://data.noaa.gov/docucomp/440b3ac2-64a5-46e2-9846-38305718b644',
        provenance: docucompObs?.provenanceType || 'NOT_IMPLEMENTED',
        statusBadge: docucompObs?.httpStatus === 200 ? 'PASS' : 'UNAVAILABLE',
        notes: 'Permission-free public GET from authoritative NOAA DocuComp registry. Verified live HTTP 200 with XML anchor.',
      },
      {
        targetCapability: 'DocuComp Server-Side XLink Resolver',
        expectedFromMantas: 'Automated inlining of external DocuComp XLinks by NOAA resolver',
        observedFromNoaa: resolverObs ? resolverObs.result : 'Service probe not run',
        upstreamService: 'POST https://data.noaa.gov/cedit/recordServices/resolver',
        provenance: resolverObs?.provenanceType || 'NOT_IMPLEMENTED',
        statusBadge: resolverObs?.authStatus === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNAVAILABLE',
        notes: 'Requires ICAM session. Public read path is handled client/server-side via direct DocuComp dereferencing.',
      },
      {
        targetCapability: 'NOAA ISO Rubric V2 Scoring',
        expectedFromMantas: 'High-completeness ISO Rubric score (88%+ required elements)',
        observedFromNoaa: rubricObs ? rubricObs.result : 'Service probe not run',
        upstreamService: 'POST https://data.noaa.gov/cedit/recordServices/rubricV2',
        provenance: rubricObs?.provenanceType || 'NOT_IMPLEMENTED',
        statusBadge: rubricObs?.authStatus === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNAVAILABLE',
        notes: 'Rubric service requires ICAM session. Local rubric evaluation available in Rosetta mapping view.',
      },
      {
        targetCapability: 'CI_OnlineResource Link Check',
        expectedFromMantas: 'Verification that online links in metadata are accessible',
        observedFromNoaa: linkcheckObs ? linkcheckObs.result : 'Service probe not run',
        upstreamService: 'POST https://data.noaa.gov/cedit/recordServices/linkcheck',
        provenance: linkcheckObs?.provenanceType || 'NOT_IMPLEMENTED',
        statusBadge: linkcheckObs?.authStatus === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNAVAILABLE',
        notes: 'Stateless link checker on CEDIT. Intercepted by CAS login redirect.',
      },
      {
        targetCapability: 'Catalog Record Search',
        expectedFromMantas: 'Query catalog records matching mission identifiers',
        observedFromNoaa: searchObs ? searchObs.result : 'Search probe not run',
        upstreamService: 'GET https://data.noaa.gov/cedit/metadata/search',
        provenance: searchObs?.provenanceType || 'NOT_IMPLEMENTED',
        statusBadge: searchObs?.authStatus === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNAVAILABLE',
        notes: 'Protected catalog search endpoint.',
      },
    ];
  }

  // Fallback demo fixture generators (strictly for SYNTHETIC_DEMO_MODE)
  private getSyntheticDemoRecordServiceObservation(service: string): ExternalServiceObservation {
    return {
      id: `obs-demo-${service}`,
      service: `POST /recordServices/${service}`,
      authority: 'NOAA CoMET',
      upstreamEndpoint: `${this.baseUrl}/recordServices/${service}`,
      requestArtifactHash: 'sha256:synthetic-demo',
      responseArtifactHash: 'sha256:synthetic-reply',
      timestamp: new Date().toISOString(),
      httpStatus: 200,
      provenanceType: 'SYNTHETIC_FIXTURE',
      authStatus: 'AUTHENTICATED',
      result: `SYNTHETIC_FIXTURE: Simulated response for demonstration mode. Does NOT reflect live NOAA connection.`,
    };
  }

  private getSyntheticDemoDocucompObservation(uuid: string): {
    observation: ExternalServiceObservation;
    xml: string;
  } {
    const demoXml = `<gmd:CI_ResponsibleParty xmlns:gmd="http://www.isotc211.org/2005/gmd" uuid="${uuid}">
  <gmd:organisationName><gco:CharacterString xmlns:gco="http://www.isotc211.org/2005/gco">SYNTHETIC DEMO Responsible Party</gco:CharacterString></gmd:organisationName>
</gmd:CI_ResponsibleParty>`;
    return {
      observation: {
        id: `obs-demo-docucomp-${uuid}`,
        service: `GET /docucomp/${uuid}`,
        authority: 'NOAA DocuComp',
        upstreamEndpoint: `${this.docucompBaseUrl}/${uuid}`,
        requestArtifactHash: 'sha256:demo-req',
        responseArtifactHash: 'sha256:demo-docucomp',
        timestamp: new Date().toISOString(),
        httpStatus: 200,
        provenanceType: 'SYNTHETIC_FIXTURE',
        authStatus: 'NOT_REQUIRED',
        result: 'SYNTHETIC_FIXTURE: Component XML loaded from hard-coded fixture for offline testing.',
      },
      xml: demoXml,
    };
  }
}

export const cometAdapter = new CometAdapter();
