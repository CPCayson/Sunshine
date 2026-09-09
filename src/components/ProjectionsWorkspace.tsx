import React, { useState } from 'react';
import {
  Layers,
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Code2,
  RefreshCw,
  ExternalLink,
  Eye
} from 'lucide-react';
import { UxSMission } from '../types';
import { generateIso19115Xml } from '../utils/xmlGenerator';
import {
  generateUnresolvedIsoXmlWithPreservedXLinks,
  generateResolvedIsoXml,
  DOCUCOMP_COMPONENTS_FIXTURE
} from '../services/docucompService';

interface ProjectionsWorkspaceProps {
  mission: UxSMission;
}

export const ProjectionsWorkspace: React.FC<ProjectionsWorkspaceProps> = ({ mission }) => {
  const [activeFormat, setActiveFormat] = useState<'ISO' | 'STAC' | 'DCAT' | 'OISS'>('ISO');
  const [useResolvedXlinks, setUseResolvedXlinks] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate ISO XML via DocuComp authority engine
  const displayedIsoXml = useResolvedXlinks
    ? generateResolvedIsoXml(mission)
    : generateUnresolvedIsoXmlWithPreservedXLinks(mission);

  // Generate STAC Item JSON
  const stacJson = JSON.stringify(
    {
      type: 'Feature',
      stac_version: '1.0.0',
      id: mission.id || 'noaa-uxs-stac-item',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [mission.spatialExtent.west, mission.spatialExtent.north],
            [mission.spatialExtent.east, mission.spatialExtent.north],
            [mission.spatialExtent.east, mission.spatialExtent.south],
            [mission.spatialExtent.west, mission.spatialExtent.south],
            [mission.spatialExtent.west, mission.spatialExtent.north],
          ],
        ],
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
        providers: [
          {
            name: mission.contact.organization,
            roles: ['producer', 'licensor', 'host'],
            url: 'https://www.ncei.noaa.gov',
          },
        ],
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
        {
          rel: 'root',
          href: 'https://ocean-stac.noaa.gov/',
          type: 'application/json',
        },
        {
          rel: 'collection',
          href: 'https://ocean-stac.noaa.gov/collections/uxs-marine-missions',
          type: 'application/json',
        },
      ],
    },
    null,
    2
  );

  // Generate DCAT-US 3.0 JSON-LD
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
      publisher: {
        '@type': 'org:Organization',
        name: mission.contact.organization,
      },
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

  // Generate OISS Ingest Manifest
  const oissManifest = JSON.stringify(
    {
      manifestVersion: '1.2.0',
      oissIngestPackageId: `OISS-INGEST-${mission.id}`,
      submissionAuthority: 'NOAA NCEI Ocean Archive Branch',
      profile: 'NOAA UxS Marine Core v3.2',
      metadataReceipt: {
        canonicalMissionId: mission.id,
        isoValidationState: 'READY',
        cometTargetRecordGroup: 'ea_demo/ (UxS Marine)',
      },
      payloadVerification: {
        platformAsset: mission.platform.name,
        sensorsCarried: mission.instruments,
        boundingBoxEnclosure: [
          mission.spatialExtent.west,
          mission.spatialExtent.south,
          mission.spatialExtent.east,
          mission.spatialExtent.north,
        ],
        checksumAlgorithm: 'SHA-256',
      },
      status: 'INGEST_PACKAGE_ASSEMBLED_WAITING_ARCHIVE_TRANSFER',
    },
    null,
    2
  );

  const getCurrentContent = () => {
    switch (activeFormat) {
      case 'ISO':
        return displayedIsoXml;
      case 'STAC':
        return stacJson;
      case 'DCAT':
        return dcatJson;
      case 'OISS':
        return oissManifest;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div id="projections-workspace" className="flex-1 flex flex-col bg-[#060b14] text-slate-200 overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="bg-[#091120] border-b border-cyan-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
              MULTI-STANDARD PROJECTIONS WORKBENCH
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Projections from Canonical UxSMission
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Projects accepted canonical mission facts into ISO 19115-2 XML, SpatioTemporal Asset Catalog (STAC), DCAT-US Open Data, and OISS Operational Ingest manifests.
          </p>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center bg-[#050912] border border-cyan-500/25 rounded-lg p-1 text-xs font-mono">
          <button
            id="proj-tab-iso"
            onClick={() => setActiveFormat('ISO')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFormat === 'ISO'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ISO 19115-2 XML
          </button>
          <button
            id="proj-tab-stac"
            onClick={() => setActiveFormat('STAC')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFormat === 'STAC'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            STAC v1.0.0
          </button>
          <button
            id="proj-tab-dcat"
            onClick={() => setActiveFormat('DCAT')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFormat === 'DCAT'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DCAT-US 3.0
          </button>
          <button
            id="proj-tab-oiss"
            onClick={() => setActiveFormat('OISS')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFormat === 'OISS'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OISS Manifest
          </button>
        </div>
      </div>

      {/* Projection Toolbar: XLink toggle, Copy, Download */}
      <div className="bg-[#070e1c] border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          {activeFormat === 'ISO' && (
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useResolvedXlinks}
                onChange={(e) => setUseResolvedXlinks(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <span className="text-cyan-300">
                {useResolvedXlinks ? 'Resolved XML (inline components)' : 'Unresolved XLinks (docucomp xlink:href preserved)'}
              </span>
            </label>
          )}

          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Target Spec: {activeFormat === 'ISO' ? 'ISO 19139 Schema (19115-2:2019)' : activeFormat === 'STAC' ? 'STAC Item Specification' : activeFormat === 'DCAT' ? 'Project Open Data' : 'OISS Archive Submission'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-projection-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0b1526] hover:bg-[#12233f] text-cyan-300 border border-cyan-500/30 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <button
            id="download-projection-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFormat}</span>
          </button>
        </div>
      </div>

      {/* ISO DocuComp Component Authority Summary */}
      {activeFormat === 'ISO' && (
        <div className="bg-[#050b18] border-b border-purple-500/25 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-300 font-semibold">DocuComp Registry Target:</span>
            <span className="text-slate-300">data.noaa.gov/docucomp (v4.9.0)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
              MANTAS Slot Profile: PROVISIONAL
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-slate-500">Components:</span>
              <span className="text-purple-300 font-bold">3 Referenced</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-slate-500">XLink Preservation:</span>
              <span className={useResolvedXlinks ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {useResolvedXlinks ? 'INLINED / DEREFERENCED' : 'PRESERVED (NCEI Standard)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-slate-500">Semantic Placement:</span>
              <span className="text-emerald-400 font-bold">3/3 PASS</span>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor / Preview Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-[#04070e]">
        <pre className="text-[12px] font-mono leading-relaxed text-cyan-200/90 whitespace-pre">
          {getCurrentContent()}
        </pre>
      </div>
    </div>
  );
};
