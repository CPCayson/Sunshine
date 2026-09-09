import { UxSMission, ValidationIssue } from '../types';

export function generateIso19115Xml(mission: UxSMission): string {
  const gcmdXml = mission.keywords.gcmdScience
    .map(
      (kw) => `      <gmd:keyword>
        <gco:CharacterString>${escapeXml(kw)}</gco:CharacterString>
      </gmd:keyword>`
    )
    .join('\n');

  const instXml = mission.instruments
    .map(
      (inst) => `      <gmd:keyword>
        <gco:CharacterString>Instruments &gt; ${escapeXml(inst)}</gco:CharacterString>
      </gmd:keyword>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://standards.iso.org/iso/19115/-3/gmd/1.0"
  xmlns:gco="http://standards.iso.org/iso/19115/-3/gco/1.0"
  xmlns:gml="http://www.opengis.net/gml/3.2"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://standards.iso.org/iso/19115/-3/gmd/1.0 http://standards.iso.org/iso/19115/-3/gmd/1.0/gmd.xsd">
  <gmd:fileIdentifier>
    <gco:CharacterString>${escapeXml(mission.id || 'noaa-uxs-metadata')}</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:language>
    <gmd:LanguageCode codeList="http://www.loc.gov/standards/iso639-2/" codeListValue="eng">eng</gmd:LanguageCode>
  </gmd:language>
  <gmd:characterSet>
    <gmd:MD_CharacterSetCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_CharacterSetCode" codeListValue="utf8">utf8</gmd:MD_CharacterSetCode>
  </gmd:characterSet>
  <gmd:hierarchyLevel>
    <gmd:MD_ScopeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_ScopeCode" codeListValue="${escapeXml(mission.resourceType || 'dataset')}">${escapeXml(mission.resourceType || 'dataset')}</gmd:MD_ScopeCode>
  </gmd:hierarchyLevel>
  <gmd:contact>
    <gmd:CI_ResponsibleParty>
      <gmd:individualName>
        <gco:CharacterString>${escapeXml(mission.contact?.name || 'NCEI Data Custodian')}</gco:CharacterString>
      </gmd:individualName>
      <gmd:organisationName>
        <gco:CharacterString>${escapeXml(mission.contact?.organization || 'National Centers for Environmental Information (NCEI)')}</gco:CharacterString>
      </gmd:organisationName>
      <gmd:contactInfo>
        <gmd:CI_Contact>
          <gmd:address>
            <gmd:CI_Address>
              <gmd:electronicMailAddress>
                <gco:CharacterString>${escapeXml(mission.contact?.email || 'ncei.info@noaa.gov')}</gco:CharacterString>
              </gmd:electronicMailAddress>
            </gmd:CI_Address>
          </gmd:address>
        </gmd:CI_Contact>
      </gmd:contactInfo>
      <gmd:role>
        <gmd:CI_RoleCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_RoleCode" codeListValue="pointOfContact">pointOfContact</gmd:CI_RoleCode>
      </gmd:role>
    </gmd:CI_ResponsibleParty>
  </gmd:contact>
  <gmd:dateStamp>
    <gco:Date>${mission.lastUpdated || new Date().toISOString().split('T')[0]}</gco:Date>
  </gmd:dateStamp>
  <gmd:metadataStandardName>
    <gco:CharacterString>ISO 19115-2 Geographic Information - Metadata Part 2: Extensions for imagery and gridded data (UxS Marine Core Profile)</gco:CharacterString>
  </gmd:metadataStandardName>
  <gmd:metadataStandardVersion>
    <gco:CharacterString>ISO 19115-2:2019 / NOAA CEDIT v3.2</gco:CharacterString>
  </gmd:metadataStandardVersion>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title>
            <gco:CharacterString>${escapeXml(mission.title || 'Untitled NOAA UxS Mission')}</gco:CharacterString>
          </gmd:title>
          ${
            mission.alternateTitle
              ? `<gmd:alternateTitle>
            <gco:CharacterString>${escapeXml(mission.alternateTitle)}</gco:CharacterString>
          </gmd:alternateTitle>`
              : ''
          }
          <gmd:date>
            <gmd:CI_Date>
              <gmd:date>
                <gco:Date>${mission.publicationDate || mission.dateEnd || '2025-01-01'}</gco:Date>
              </gmd:date>
              <gmd:dateType>
                <gmd:CI_DateTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#CI_DateTypeCode" codeListValue="publication">publication</gmd:CI_DateTypeCode>
              </gmd:dateType>
            </gmd:CI_Date>
          </gmd:date>
          ${
            mission.doi
              ? `<gmd:identifier>
            <gmd:MD_Identifier>
              <gmd:code>
                <gco:CharacterString>doi:${escapeXml(mission.doi)}</gco:CharacterString>
              </gmd:code>
            </gmd:MD_Identifier>
          </gmd:identifier>`
              : ''
          }
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract>
        <gco:CharacterString>${escapeXml(mission.abstract || 'No abstract provided.')}</gco:CharacterString>
      </gmd:abstract>
      <gmd:purpose>
        <gco:CharacterString>${escapeXml(mission.purpose || 'No purpose statement specified.')}</gco:CharacterString>
      </gmd:purpose>
      <gmd:status>
        <gmd:MD_ProgressCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_ProgressCode" codeListValue="${escapeXml(mission.status || 'completed')}">${escapeXml(mission.status || 'completed')}</gmd:MD_ProgressCode>
      </gmd:status>
      <!-- GCMD Science Keywords -->
      <gmd:descriptiveKeywords>
        <gmd:MD_Keywords>
${gcmdXml || '          <gmd:keyword><gco:CharacterString>Oceans &gt; Ocean Acoustics</gco:CharacterString></gmd:keyword>'}
          <gmd:type>
            <gmd:MD_KeywordTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_KeywordTypeCode" codeListValue="theme">theme</gmd:MD_KeywordTypeCode>
          </gmd:type>
          <gmd:thesaurusName>
            <gmd:CI_Citation>
              <gmd:title>
                <gco:CharacterString>Global Change Master Directory (GCMD) Science Keywords v18.4</gco:CharacterString>
              </gmd:title>
            </gmd:CI_Citation>
          </gmd:thesaurusName>
        </gmd:MD_Keywords>
      </gmd:descriptiveKeywords>
      <!-- NOAA UxS Platform & Sensor Instrumentation -->
      <gmd:descriptiveKeywords>
        <gmd:MD_Keywords>
          <gmd:keyword>
            <gco:CharacterString>Platform &gt; ${escapeXml(mission.platform.name)} (${escapeXml(mission.platform.callSign || 'N/A')}) [${escapeXml(mission.platform.uxsCategory)}]</gco:CharacterString>
          </gmd:keyword>
${instXml}
          <gmd:type>
            <gmd:MD_KeywordTypeCode codeList="http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_KeywordTypeCode" codeListValue="platform">platform</gmd:MD_KeywordTypeCode>
          </gmd:type>
        </gmd:MD_Keywords>
      </gmd:descriptiveKeywords>
      <!-- Spatial and Temporal Extent -->
      <gmd:extent>
        <gmd:EX_Extent>
          <gmd:description>
            <gco:CharacterString>${escapeXml(mission.spatialExtent.placeName || 'Oceanic survey extent')}</gco:CharacterString>
          </gmd:description>
          <gmd:geographicElement>
            <gmd:EX_GeographicBoundingBox>
              <gmd:westBoundLongitude>
                <gco:Decimal>${mission.spatialExtent.west.toFixed(4)}</gco:Decimal>
              </gmd:westBoundLongitude>
              <gmd:eastBoundLongitude>
                <gco:Decimal>${mission.spatialExtent.east.toFixed(4)}</gco:Decimal>
              </gmd:eastBoundLongitude>
              <gmd:southBoundLatitude>
                <gco:Decimal>${mission.spatialExtent.south.toFixed(4)}</gco:Decimal>
              </gmd:southBoundLatitude>
              <gmd:northBoundLatitude>
                <gco:Decimal>${mission.spatialExtent.north.toFixed(4)}</gco:Decimal>
              </gmd:northBoundLatitude>
            </gmd:EX_GeographicBoundingBox>
          </gmd:geographicElement>
          <gmd:temporalElement>
            <gmd:EX_TemporalExtent>
              <gmd:extent>
                <gml:TimePeriod gml:id="temporal_period_1">
                  <gml:beginPosition>${mission.dateStart}</gml:beginPosition>
                  <gml:endPosition>${mission.dateEnd || mission.dateStart}</gml:endPosition>
                </gml:TimePeriod>
              </gmd:extent>
            </gmd:EX_TemporalExtent>
          </gmd:temporalElement>
        </gmd:EX_Extent>
      </gmd:extent>
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
</gmd:MD_Metadata>`;
}

function escapeXml(unsafe: string = ''): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function validateUxSMission(mission: UxSMission): { issues: ValidationIssue[]; score: number } {
  const issues: ValidationIssue[] = [];

  // Mandatory fields for ISO 19115-2 & CoMET UxS
  if (!mission.title || mission.title.trim().length < 10) {
    issues.push({
      id: 'err-title',
      type: 'error',
      field: 'title',
      message: 'Mission Title is required and should be at least 10 characters descriptive.',
      path: 'gmd:identificationInfo > gmd:citation > gmd:title',
      autoFixable: false
    });
  }

  if (!mission.abstract || mission.abstract.trim().length < 30) {
    issues.push({
      id: 'err-abstract',
      type: 'error',
      field: 'abstract',
      message: 'Abstract is required for NCEI archival and should be comprehensive (> 30 characters).',
      path: 'gmd:identificationInfo > gmd:abstract',
      autoFixable: false
    });
  }

  // Spatial coordinates validation
  const { west, east, south, north } = mission.spatialExtent;
  if (west < -180 || west > 180 || east < -180 || east > 180) {
    issues.push({
      id: 'err-lon',
      type: 'error',
      field: 'spatialExtent',
      message: 'Longitude coordinates must be between -180° and +180° WGS84.',
      path: 'gmd:extent > gmd:EX_GeographicBoundingBox',
      autoFixable: true,
      fixAction: {
        field: 'spatialExtent',
        value: { ...mission.spatialExtent, west: Math.max(-180, Math.min(180, west)), east: Math.max(-180, Math.min(180, east)) },
        description: 'Clamp longitude bounds to valid -180° to 180° range'
      }
    });
  }

  if (south < -90 || south > 90 || north < -90 || north > 90 || south > north) {
    issues.push({
      id: 'err-lat',
      type: 'error',
      field: 'spatialExtent',
      message: 'Latitude must be between -90° and +90°, with South Bound <= North Bound.',
      path: 'gmd:extent > gmd:EX_GeographicBoundingBox',
      autoFixable: true,
      fixAction: {
        field: 'spatialExtent',
        value: { ...mission.spatialExtent, south: Math.min(south, north), north: Math.max(south, north) },
        description: 'Correct flipped south/north coordinates'
      }
    });
  }

  // Warnings
  if (!mission.purpose || mission.purpose.trim().length < 15) {
    issues.push({
      id: 'warn-purpose',
      type: 'warning',
      field: 'purpose',
      message: 'Missing or short Purpose (dataset) statement. Recommended by NOAA CoMET review board.',
      path: 'gmd:identificationInfo > gmd:purpose',
      autoFixable: true,
      fixAction: {
        field: 'purpose',
        value: 'Conduct high-resolution seafloor mapping and autonomous UxS marine survey for scientific baseline assessment.',
        description: 'Add standard UxS purpose description'
      }
    });
  }

  if (!mission.keywords.gcmdScience || mission.keywords.gcmdScience.length < 2) {
    issues.push({
      id: 'warn-gcmd',
      type: 'warning',
      field: 'keywords',
      message: 'At least 2 GCMD Science Keywords are recommended for CoMET catalog discoverability.',
      path: 'gmd:identificationInfo > gmd:descriptiveKeywords',
      autoFixable: true,
      fixAction: {
        field: 'keywords.gcmdScience',
        value: [
          ...(mission.keywords.gcmdScience || []),
          'Oceans > Bathymetry/Seafloor Topography > Bathymetry',
          'Oceans > Ocean Acoustics > Acoustic Backscatter'
        ],
        description: 'Auto-populate standard GCMD Ocean science keywords'
      }
    });
  }

  if (!mission.platform.name || mission.platform.name.trim() === '') {
    issues.push({
      id: 'warn-platform',
      type: 'warning',
      field: 'platform.name',
      message: 'Primary platform or vessel name is unspecified.',
      path: 'gmd:descriptiveKeywords > platform',
      autoFixable: false
    });
  }

  if (!mission.doi) {
    issues.push({
      id: 'info-doi',
      type: 'info',
      field: 'doi',
      message: 'No DOI assigned yet. Can be registered via NOAA NCEI Minting service.',
      path: 'gmd:identificationInfo > gmd:citation > gmd:identifier',
      autoFixable: true,
      fixAction: {
        field: 'doi',
        value: `10.25921/${mission.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}-oceans`,
        description: 'Generate standardized NCEI DOI placeholder'
      }
    });
  }

  if (!mission.contact.rorId) {
    issues.push({
      id: 'info-ror',
      type: 'info',
      field: 'contact.rorId',
      message: 'Recommended: Link organization to Research Organization Registry (ROR ID).',
      path: 'gmd:contact > gmd:CI_ResponsibleParty',
      autoFixable: true,
      fixAction: {
        field: 'contact.rorId',
        value: 'https://ror.org/02z5n2526', // NOAA ROR ID
        description: 'Attach NOAA NCEI ROR Identifier (02z5n2526)'
      }
    });
  }

  // Calculate score
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warnCount = issues.filter((i) => i.type === 'warning').length;
  const infoCount = issues.filter((i) => i.type === 'info').length;

  let score = 100 - errorCount * 25 - warnCount * 7 - infoCount * 2;
  score = Math.max(20, Math.min(100, score));

  return { issues, score };
}
