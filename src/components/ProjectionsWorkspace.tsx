import React, { useState } from 'react';
import { CheckCircle2, Copy, Download, Layers } from 'lucide-react';
import { UxSMission } from '../types';
import {
  generateUnresolvedIsoXmlWithPreservedXLinks,
  generateResolvedIsoXml,
} from '../services/docucompService';

interface ProjectionsWorkspaceProps {
  mission: UxSMission;
}

type ProjectionFormat = 'ISO' | 'STAC' | 'DCAT' | 'OISS';

export const ProjectionsWorkspace: React.FC<ProjectionsWorkspaceProps> = ({ mission }) => {
  const [activeFormat, setActiveFormat] = useState<ProjectionFormat>('ISO');
  const [useResolvedXlinks, setUseResolvedXlinks] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayedIsoXml = useResolvedXlinks
    ? generateResolvedIsoXml(mission)
    : generateUnresolvedIsoXmlWithPreservedXLinks(mission);

  const stacJson = JSON.stringify(
    {
      type: 'Feature',
      stac_version: '1.0.0',
      id: mission.id || 'noaa-uxs-stac-item',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [mission.spatialExtent.west, mission.spatialExtent.north],
          [mission.spatialExtent.east, mission.spatialExtent.north],
          [mission.spatialExtent.east, mission.spatialExtent.south],
          [mission.spatialExtent.west, mission.spatialExtent.south],
          [mission.spatialExtent.west, mission.spatialExtent.north],
        ]],
      },
      bbox: [
        mission.spatialExtent.west,
        mission.spatialExtent.south,
        mission.spatialExtent.east,
        mission.spatialExtent.north,
      ],
      properties: {
        title: mission.title,
        description: mission.abstract,
        datetime: `${mission.dateStart}T00:00:00Z`,
        start_datetime: `${mission.dateStart}T00:00:00Z`,
        end_datetime: `${mission.dateEnd}T23:59:59Z`,
        platform: mission.platform.name,
        'platform:model': mission.platform.modelId || 'REMUS-620',
        'platform:callsign': mission.platform.callSign,
        instruments: mission.instruments,
        'uxs:category': mission.platform.uxsCategory,
        conformance_score: mission.conformanceScore,
        license: 'CC0-1.0',
        providers: [{
          name: mission.contact.organization,
          roles: ['producer', 'licensor', 'host'],
          url: 'https://www.ncei.noaa.gov',
        }],
      },
      assets: {
        iso_metadata: {
          href: `https://data.noaa.gov/cedit/metadata/${mission.ceditRecordId || 'record'}`,
          type: 'application/xml',
          title: 'Canonical ISO 19115-2 XML Metadata',
          roles: ['metadata'],
        },
        backscatter_data: {
          href: `https://ocean-archive.ncei.noaa.gov/archive/archive-management-library/${mission.id}/data.tif`,
          type: 'image/tiff; application=geotiff',
          title: 'High-Resolution Acoustic Backscatter Geotiff Mosaic',
          roles: ['data'],
        },
      },
      links: [
        { rel: 'root', href: 'https://ocean-stac.noaa.gov/', type: 'application/json' },
        { rel: 'collection', href: 'https://ocean-stac.noaa.gov/collections/uxs-marine-missions', type: 'application/json' },
      ],
    },
    null,
    2
  );

  const dcatJson = JSON.stringify(
    {
      '@context': 'https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld',
      '@type': 'dcat:Dataset',
      title: mission.title,
      description: mission.abstract,
      keyword: [
        ...mission.keywords.freeKeywords,
        ...mission.keywords.gcmdScience,
        mission.platform.name,
      ],
      modified: mission.lastUpdated || new Date().toISOString().split('T')[0],
      publisher: { '@type': 'org:Organization', name: mission.contact.organization },
      contactPoint: {
        '@type': 'vcard:Contact',
        fn: mission.contact.name,
        hasEmail: `mailto:${mission.contact.email}`,
      },
      identifier: mission.doi || `gov.noaa.ncei:${mission.id}`,
      accessLevel: 'public',
      bureauCode: ['006:48'],
      programCode: ['006:055'],
      spatial: `${mission.spatialExtent.west},${mission.spatialExtent.south},${mission.spatialExtent.east},${mission.spatialExtent.north}`,
      temporal: `${mission.dateStart}/${mission.dateEnd}`,
    },
    null,
    2
  );

  const oissManifest = JSON.stringify(
    {
      manifestVersion: '1.2.0',
      packageId: `OISS-HANDOFF-${mission.id}`,
      mode: 'LOCAL_HANDOFF_PREVIEW',
      canonicalMissionId: mission.id,
      profile: 'NOAA UxS Marine Core v3.2',
      packageContext: {
        platformAsset: mission.platform.name,
        instruments: mission.instruments,
        boundingBox: [
          mission.spatialExtent.west,
          mission.spatialExtent.south,
          mission.spatialExtent.east,
          mission.spatialExtent.north,
        ],
        checksumAlgorithm: 'SHA-256',
      },
      doesNotProve: [
        'OISS validation',
        'OISS execution',
        'archive acceptance',
        'discovery availability',
      ],
    },
    null,
    2
  );

  const getCurrentContent = () => {
    switch (activeFormat) {
      case 'ISO': return displayedIsoXml;
      case 'STAC': return stacJson;
      case 'DCAT': return dcatJson;
      case 'OISS': return oissManifest;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = () => {
    const content = getCurrentContent();
    const extension = activeFormat === 'ISO' ? 'xml' : 'json';
    const blob = new Blob([content], {
      type: activeFormat === 'ISO' ? 'application/xml' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mission.id}_projection_${activeFormat.toLowerCase()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLabel: Record<ProjectionFormat, string> = {
    ISO: 'ISO 19115-2',
    STAC: 'STAC',
    DCAT: 'DCAT-US',
    OISS: 'OISS handoff preview',
  };

  return (
    <div id="projections-workspace" className="flex-1 flex flex-col bg-[#050a12] text-slate-200 overflow-hidden font-sans">
      <div className="px-6 py-5 border-b border-slate-900 flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Projection</span>
          </div>
          <h2 className="mt-1 text-lg font-medium text-slate-100">{formatLabel[activeFormat]}</h2>
        </div>

        <select
          value={activeFormat}
          onChange={(e) => setActiveFormat(e.target.value as ProjectionFormat)}
          className="bg-[#09111d] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-800"
          aria-label="Projection format"
        >
          <option value="ISO">ISO 19115-2 XML</option>
          <option value="STAC">STAC 1.0.0</option>
          <option value="DCAT">DCAT-US 3.0</option>
          <option value="OISS">OISS handoff preview</option>
        </select>
      </div>

      <div className="px-6 py-3 border-b border-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="text-xs text-slate-500">
          {activeFormat === 'ISO'
            ? 'Canonical mission → ISO XML'
            : activeFormat === 'STAC'
            ? 'Canonical mission → STAC Item'
            : activeFormat === 'DCAT'
            ? 'Canonical mission → DCAT dataset'
            : 'Canonical mission → local OISS handoff package preview'}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="copy-projection-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            id="download-projection-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-cyan-300 hover:bg-cyan-950/30"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {activeFormat === 'ISO' && (
        <div className="px-6 py-3 border-b border-slate-900 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useResolvedXlinks}
              onChange={(e) => setUseResolvedXlinks(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            {useResolvedXlinks ? 'Inline resolved components' : 'Preserve DocuComp XLinks'}
          </label>
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300">Projection details</summary>
            <div className="mt-3 pl-4 border-l border-slate-800 space-y-2 leading-relaxed">
              <div>DocuComp slot mapping remains a MANTAS-local profile unless backed by an authoritative NOAA policy source.</div>
              <div>{useResolvedXlinks ? 'Components are rendered inline for inspection.' : 'XLink references remain preserved in the generated XML.'}</div>
            </div>
          </details>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-[#03070d] px-7 py-6">
        <pre className="max-w-5xl text-[12px] font-mono leading-6 text-slate-300 whitespace-pre-wrap break-words">
          {getCurrentContent()}
        </pre>
      </div>
    </div>
  );
};
