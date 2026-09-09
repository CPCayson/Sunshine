import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MANTA Lens NOAA NCEI UxS & CoMET Companion',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      mission,
      model = 'gemini-3.5-flash',
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message string is required.' });
      return;
    }

    const ai = getGenAI();

    const systemInstruction = `You are MANTA Lens AI, the authoritative metadata intelligence companion for NOAA NCEI (National Centers for Environmental Information) and CoMET (Collection Metadata Enterprise Tool) based on the CEDIT OpenAPI (https://data.noaa.gov/cedit/openApiDoc.html).
Your primary role is assisting marine scientists, expedition leads, and data managers in authoring, validating, and publishing Uncrewed Systems (UxS - UUVs, ROVs, USVs, ocean gliders, sail drones) mission metadata according to ISO 19115-2:2019 and NOAA UxS-Marine-Core schemas.

Current Mission In Editor Context:
- Title: ${mission?.title || 'None'}
- Abstract: ${mission?.abstract || 'None'}
- Platform: ${mission?.platform?.name || 'Unknown'} (${mission?.platform?.uxsCategory || 'UxS'})
- Instruments: ${(mission?.instruments || []).join(', ') || 'None listed'}
- Spatial Bounds (WGS84): West: ${mission?.spatialExtent?.west ?? 'N/A'}, South: ${mission?.spatialExtent?.south ?? 'N/A'}, East: ${mission?.spatialExtent?.east ?? 'N/A'}, North: ${mission?.spatialExtent?.north ?? 'N/A'} (Location: ${mission?.spatialExtent?.placeName || 'Ocean area'})
- Temporal Extent: ${mission?.dateStart || 'N/A'} to ${mission?.dateEnd || 'N/A'}
- Current GCMD Science Keywords: ${(mission?.keywords?.gcmdScience || []).join('; ') || 'None'}
- CoMET Validation Score: ${mission?.conformanceScore ?? 'N/A'}%

Guidelines:
1. Always use Google Search Grounding to verify real-world NOAA expedition names, vessel call signs, GCMD taxonomy, scientific sensor specs, or geographic features (like trenches, seamounts, canyons).
2. Be precise, encouraging, and authoritative in oceanographic & geospatial standards.
3. If providing actionable metadata updates (e.g. suggesting keywords, bounding box coordinates, improved title/abstract, or platform fixes), provide a concise explanation followed by a JSON codeblock with:
\`\`\`json
{
  "suggestedUpdates": {
    "title": "optional string",
    "abstract": "optional string",
    "keywords": ["Oceans > ..."],
    "bbox": {"west": -46.78, "south": 31.20, "east": -31.98, "north": 37.87, "placeName": "Corner Rise Seamounts"},
    "instruments": ["ROV Deep Discoverer", "..."]
  }
}
\`\`\`
This allows the user to click and auto-apply your suggestions directly to the form and interactive map!`;

    const contents: any[] = [];
    for (const msg of history) {
      if (msg.sender === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.text }] });
      } else if (msg.sender === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.text }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const targetModel = model || 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const responseText = response.text || '';
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources: Array<{ uri: string; title: string }> = [];

    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        groundingSources.push({
          uri: chunk.web.uri,
          title: chunk.web.title || chunk.web.uri,
        });
      }
    }

    res.json({
      text: responseText,
      groundingSources,
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: error.message || 'Internal Server Error during AI Chat generation.',
    });
  }
});

app.post('/api/assist', async (req, res) => {
  try {
    const { taskType, mission } = req.body;
    const ai = getGenAI();

    let prompt = '';
    if (taskType === 'suggest_gcmd') {
      prompt = `Given the following NOAA UxS ocean mission:
Title: "${mission?.title}"
Abstract: "${mission?.abstract}"
Instruments: ${(mission?.instruments || []).join(', ')}
Location: ${mission?.spatialExtent?.placeName || 'Ocean'}

Suggest 4 to 6 valid, authentic GCMD (Global Change Master Directory) Science Keywords in the exact hierarchy format, e.g. "Oceans > Ocean Acoustics > Acoustic Backscatter", "Oceans > Bathymetry/Seafloor Topography > Bathymetry", etc.
Return ONLY a valid JSON array of strings, like ["Oceans > ...", "Oceans > ..."].`;
    } else if (taskType === 'infer_bbox') {
      prompt = `Given the mission location description: "${mission?.spatialExtent?.placeName || mission?.title}",
Infer the approximate WGS84 geographic bounding box [west, south, east, north] in decimal degrees (-180 to 180, -90 to 90) and place name.
Return ONLY a valid JSON object with keys: {"west": number, "south": number, "east": number, "north": number, "placeName": string}.`;
    } else if (taskType === 'normalize_dates') {
      prompt = `Given mission start date "${mission?.dateStart}" and end date "${mission?.dateEnd}", format them into ISO 8601 YYYY-MM-DD.
Return ONLY JSON: {"dateStart": "YYYY-MM-DD", "dateEnd": "YYYY-MM-DD", "publicationDate": "YYYY-MM-DD"}.`;
    } else {
      prompt = `Provide a concise 2-sentence executive summary and quality review for NOAA UxS record "${mission?.title}".`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    res.json({
      result: response.text || '',
    });
  } catch (error: any) {
    console.error('Assist endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

app.get('/api/comet/status', (req, res) => {
  res.json({
    status: 'online',
    server: 'https://data.noaa.gov/cedit',
    documentationUrl: 'https://data.noaa.gov/cedit/openApiDoc.html',
    mode: 'READ_ONLY',
    sessionAuthenticated: Boolean(process.env.COMET_COOKIE),
    documentedContracts: [
      { method: 'GET', path: '/metadata/{uuid}', desc: 'Retrieve XML record by UUID' },
      { method: 'GET', path: '/metadata/search', desc: 'Search catalog records' },
      { method: 'GET', path: '/metadata/validate/{uuid}', desc: 'Validate stored record by UUID' },
      { method: 'POST', path: '/recordServices/validate', desc: 'Validate submitted ISO XML against XSD schemas' },
      { method: 'POST', path: '/recordServices/resolver', desc: 'Resolve DocuComp component XLinks in XML' },
      { method: 'POST', path: '/recordServices/rubricV2', desc: 'Calculate ISO Rubric V2 completeness scores' },
      { method: 'POST', path: '/recordServices/linkcheck', desc: 'Verify CI_OnlineResource URL accessibility' },
      { method: 'POST', path: '/recordServices/upload', desc: 'Upload file for processing' }
    ],
    searchContext: {
      primaryRecordGroupConfigured: Boolean(process.env.COMET_PRIMARY_RECORD_GROUP),
      additionalRecordGroupsConfigured: Boolean(process.env.COMET_CONTEXT_RECORD_GROUPS),
    },
    message: 'CoMET live services require NOAA CAS / ICAM credentials. Probing reports authentic HTTP status without silent simulation.',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/comet/recordServices/probe', async (req, res) => {
  const { service, xml } = req.body;
  const validServices = ['validate', 'resolver', 'rubricV2', 'linkcheck'];
  if (!service || !validServices.includes(service)) {
    res.status(400).json({ error: `Invalid service. Must be one of: ${validServices.join(', ')}` });
    return;
  }

  const payloadXml = typeof xml === 'string' && xml.trim().length > 0
    ? xml
    : `<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd"><gmd:fileIdentifier><gco:CharacterString xmlns:gco="http://www.isotc211.org/2005/gco">probe-test</gco:CharacterString></gmd:fileIdentifier></gmd:MD_Metadata>`;

  const requestHash = `sha256:${computeSha256(payloadXml)}`;
  const upstreamPath = `/recordServices/${service}`;
  const upstreamUrl = `https://data.noaa.gov/cedit${upstreamPath}`;
  const timestamp = new Date().toISOString();

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml, text/xml, application/json, text/html, */*',
        'User-Agent': 'MANTAS-Lens-Auditor/1.0',
        ...(process.env.COMET_COOKIE ? { Cookie: process.env.COMET_COOKIE } : {}),
      },
      body: payloadXml,
      redirect: 'manual',
      signal: AbortSignal.timeout(6000),
    });

    const httpStatus = upstreamRes.status;
    const contentType = upstreamRes.headers.get('content-type') || '';
    const location = upstreamRes.headers.get('location') || '';
    const bodyText = await upstreamRes.text();
    const responseHash = `sha256:${computeSha256(bodyText || location || String(httpStatus))}`;
    const isCasRedirect = (httpStatus === 302 || httpStatus === 301) && location.includes('cas/login');

    if (isCasRedirect) {
      res.json({
        id: `obs-srv-${service}-${Date.now()}`,
        service: `POST ${upstreamPath}`,
        authority: 'NOAA CoMET',
        upstreamEndpoint: upstreamUrl,
        officialContract: { method: 'POST', path: upstreamPath, server: 'https://data.noaa.gov/cedit' },
        requestArtifactHash: requestHash,
        responseArtifactHash: responseHash,
        timestamp,
        httpStatus,
        contentType,
        provenanceType: 'LIVE_OBSERVED',
        authStatus: 'AUTH_REQUIRED',
        result: `AUTH_REQUIRED: Real HTTP ${httpStatus} received from NOAA CEDIT. Redirected to CAS login (${location.slice(0, 75)}...). Requires NOAA ICAM session or CEDIT API key.`,
        rawResponseSnippet: `Location: ${location}`,
        isRealResponse: true,
      });
      return;
    }

    if (httpStatus === 200) {
      res.json({
        id: `obs-srv-${service}-${Date.now()}`,
        service: `POST ${upstreamPath}`,
        authority: 'NOAA CoMET',
        upstreamEndpoint: upstreamUrl,
        officialContract: { method: 'POST', path: upstreamPath, server: 'https://data.noaa.gov/cedit' },
        requestArtifactHash: requestHash,
        responseArtifactHash: responseHash,
        timestamp,
        httpStatus,
        contentType,
        provenanceType: 'LIVE_OBSERVED',
        authStatus: 'AUTHENTICATED',
        result: `LIVE_OBSERVED: Real HTTP 200 OK received from NOAA CEDIT ${upstreamPath}.`,
        rawResponseSnippet: bodyText.slice(0, 300),
        isRealResponse: true,
      });
      return;
    }

    res.json({
      id: `obs-srv-${service}-${Date.now()}`,
      service: `POST ${upstreamPath}`,
      authority: 'NOAA CoMET',
      upstreamEndpoint: upstreamUrl,
      officialContract: { method: 'POST', path: upstreamPath, server: 'https://data.noaa.gov/cedit' },
      requestArtifactHash: requestHash,
      responseArtifactHash: responseHash,
      timestamp,
      httpStatus,
      contentType,
      provenanceType: 'LIVE_OBSERVED',
      authStatus: httpStatus === 401 || httpStatus === 403 ? 'AUTH_REQUIRED' : 'NOT_REQUIRED',
      result: `LIVE_OBSERVED: Real HTTP ${httpStatus} returned by upstream NOAA CEDIT server.`,
      rawResponseSnippet: bodyText.slice(0, 300),
      isRealResponse: true,
    });
  } catch (err: any) {
    res.json({
      id: `obs-srv-${service}-${Date.now()}`,
      service: `POST ${upstreamPath}`,
      authority: 'NOAA CoMET',
      upstreamEndpoint: upstreamUrl,
      officialContract: { method: 'POST', path: upstreamPath, server: 'https://data.noaa.gov/cedit' },
      requestArtifactHash: requestHash,
      timestamp,
      httpStatus: null,
      provenanceType: 'NOT_IMPLEMENTED',
      authStatus: 'UNAVAILABLE_FROM_RUNTIME',
      result: `UNAVAILABLE_FROM_RUNTIME: Network connection could not be established to ${upstreamUrl}: ${err?.message || err}`,
      isRealResponse: false,
    });
  }
});

app.get('/api/docucomp/dereference', async (req, res) => {
  const target = (req.query.url as string) || (req.query.uuid as string);
  if (!target) {
    res.status(400).json({ error: 'Missing url or uuid query parameter.' });
    return;
  }

  const uuidMatch = target.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const uuid = uuidMatch ? uuidMatch[0] : target;
  const upstreamUrl = `https://data.noaa.gov/docucomp/${uuid}`;
  const timestamp = new Date().toISOString();

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'MANTAS-Lens-DocuComp-Resolver/1.0',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });

    const httpStatus = upstreamRes.status;
    const contentType = upstreamRes.headers.get('content-type') || '';
    const bodyText = await upstreamRes.text();
    const responseHash = `sha256:${computeSha256(bodyText)}`;

    if (httpStatus === 200) {
      res.json({
        id: `res-obs-live-${uuid}`,
        uuid,
        upstreamUrl,
        officialContract: { method: 'GET', path: `/docucomp/${uuid}`, server: 'https://data.noaa.gov' },
        httpStatus,
        contentType,
        responseHash,
        timestamp,
        provenanceType: 'LIVE_OBSERVED',
        isRealResponse: true,
        xml: bodyText,
        message: `HTTP 200 OK: Authoritative XML component payload dereferenced live from NOAA DocuComp registry.`,
      });
    } else {
      res.json({
        id: `res-obs-live-${uuid}`,
        uuid,
        upstreamUrl,
        officialContract: { method: 'GET', path: `/docucomp/${uuid}`, server: 'https://data.noaa.gov' },
        httpStatus,
        contentType,
        responseHash,
        timestamp,
        provenanceType: 'LIVE_OBSERVED',
        isRealResponse: true,
        xml: null,
        message: `HTTP ${httpStatus}: Component returned ${httpStatus === 500 ? '500 Internal Error / Not Found' : `HTTP ${httpStatus}`} from NOAA DocuComp. No fixture substituted.`,
        rawSnippet: bodyText.slice(0, 250),
      });
    }
  } catch (err: any) {
    res.json({
      id: `res-obs-err-${uuid}`,
      uuid,
      upstreamUrl,
      httpStatus: null,
      timestamp,
      provenanceType: 'NOT_IMPLEMENTED',
      isRealResponse: false,
      xml: null,
      message: `UNAVAILABLE_FROM_RUNTIME: Network connection error reaching NOAA DocuComp: ${err?.message || err}`,
    });
  }
});

function parseCometRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  for (const key of ['hits', 'results', 'records', 'data', 'items']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

// Read-only CoMET workspace/context search. The browser never receives the
// NOAA session secret. The route searches only explicitly configured record groups.
app.get('/api/comet/metadata/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const requestedGroup = String(req.query.recordGroup || '').trim();
  const primaryGroup = String(process.env.COMET_PRIMARY_RECORD_GROUP || '').trim();
  const contextGroups = String(process.env.COMET_CONTEXT_RECORD_GROUPS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const groups = requestedGroup
    ? [requestedGroup]
    : Array.from(new Set([primaryGroup, ...contextGroups].filter(Boolean)));
  const timestamp = new Date().toISOString();

  if (!q) {
    res.status(400).json({ error: 'Missing q query parameter.' });
    return;
  }

  if (groups.length === 0) {
    res.json({
      service: 'GET /metadata/search',
      configured: false,
      authStatus: process.env.COMET_COOKIE ? 'AUTHENTICATED' : 'UNAVAILABLE_FROM_RUNTIME',
      primaryRecordGroup: null,
      hits: [],
      result: 'NOT_CONFIGURED: Set COMET_PRIMARY_RECORD_GROUP and optional COMET_CONTEXT_RECORD_GROUPS to enable scoped CoMET context search.',
      timestamp,
    });
    return;
  }

  const allHits: any[] = [];
  const observations: any[] = [];
  let authRequired = false;

  for (const recordGroup of groups) {
    const params = new URLSearchParams({ recordGroup, q });
    const upstreamUrl = `https://data.noaa.gov/cedit/metadata/search?${params.toString()}`;
    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, application/xml, text/xml, */*',
          'User-Agent': 'MANTAS-Zen-CoMET-Context/1.0',
          ...(process.env.COMET_COOKIE ? { Cookie: process.env.COMET_COOKIE } : {}),
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(6000),
      });
      const httpStatus = upstreamRes.status;
      const location = upstreamRes.headers.get('location') || '';
      const isCas = (httpStatus === 301 || httpStatus === 302) && location.includes('cas/login');
      const bodyText = isCas ? '' : await upstreamRes.text();
      let parsed: any = null;
      try { parsed = bodyText ? JSON.parse(bodyText) : null; } catch { parsed = null; }

      if (isCas || httpStatus === 401 || httpStatus === 403) authRequired = true;
      const rows = httpStatus === 200 && parsed ? parseCometRows(parsed) : [];
      rows.forEach((row) => allHits.push({
        ...row,
        recordGroup,
        recordGroupScope: recordGroup === primaryGroup ? 'MANTAS_PRIMARY' : 'OTHER_READ_ONLY',
      }));
      observations.push({
        recordGroup,
        upstreamUrl,
        httpStatus,
        authStatus: isCas || httpStatus === 401 || httpStatus === 403 ? 'AUTH_REQUIRED' : httpStatus === 200 ? 'AUTHENTICATED' : 'NOT_REQUIRED',
        responseHash: bodyText ? `sha256:${computeSha256(bodyText)}` : undefined,
      });
    } catch (err: any) {
      observations.push({
        recordGroup,
        upstreamUrl,
        httpStatus: null,
        authStatus: 'UNAVAILABLE_FROM_RUNTIME',
        error: err?.message || String(err),
      });
    }
  }

  res.json({
    service: 'GET /metadata/search',
    configured: true,
    query: q,
    primaryRecordGroup: primaryGroup || null,
    contextRecordGroups: contextGroups,
    hits: allHits,
    observations,
    authStatus: authRequired && allHits.length === 0 ? 'AUTH_REQUIRED' : process.env.COMET_COOKIE ? 'AUTHENTICATED' : 'NOT_REQUIRED',
    provenanceType: 'LIVE_OBSERVED',
    result: allHits.length
      ? `LIVE_OBSERVED: ${allHits.length} read-only CoMET context records returned across ${groups.length} configured record group(s).`
      : authRequired
        ? 'AUTH_REQUIRED: CoMET search redirected to NOAA authentication. No fixture records substituted.'
        : 'LIVE_OBSERVED: Search completed with zero matching CoMET context records.',
    timestamp,
  });
});

app.post('/api/comet/validate', (req, res) => {
  const { xml } = req.body;
  if (!xml || typeof xml !== 'string') {
    res.status(400).json({ error: 'XML string is required for validation.' });
    return;
  }
  const hasFileId = xml.includes('<gmd:fileIdentifier>');
  const hasTitle = xml.includes('<gmd:title>');
  const hasBbox = xml.includes('<gmd:EX_GeographicBoundingBox>');

  const errors: string[] = [];
  if (!hasFileId) errors.push('Missing required gmd:fileIdentifier element.');
  if (!hasTitle) errors.push('Missing required gmd:title element in citation.');
  if (!hasBbox) errors.push('Missing required gmd:EX_GeographicBoundingBox in identification extent.');

  res.json({
    isValid: errors.length === 0,
    errors,
    schemaVersion: 'ISO 19139 / 19115-2:2019 (Local Syntax Emulator)',
    provenanceType: 'LOCAL_DERIVED',
    upstreamContractTarget: 'POST /recordServices/validate',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MANTA Lens Server running on http://localhost:${PORT}`);
  });
}

startServer();