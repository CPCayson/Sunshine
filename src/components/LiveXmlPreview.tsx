import React, { useState } from 'react';
import { Copy, Check, Download, FileCode2, ExternalLink } from 'lucide-react';

interface LiveXmlPreviewProps {
  xmlContent: string;
  onExportXml: () => void;
}

export const LiveXmlPreview: React.FC<LiveXmlPreviewProps> = ({
  xmlContent,
  onExportXml,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const breadcrumb = 'gmd:MD_Metadata > gmd:identificationInfo > gmd:MD_DataIdentification > gmd:citation > gmd:title';

  const copyFullXml = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyBreadcrumbPath = async () => {
    try {
      await navigator.clipboard.writeText(breadcrumb);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const lines = xmlContent.split('\n');

  return (
    <div id="live-xml-preview-container" className="flex-1 flex flex-col bg-[#060a12] text-slate-200 overflow-hidden font-mono text-xs">
      {/* Breadcrumb Path & Quick Actions */}
      <div className="px-3 py-2 bg-[#09101d] border-b border-cyan-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate text-[11px] text-cyan-300">
          <FileCode2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{breadcrumb}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="copy-xml-path-btn"
            onClick={copyBreadcrumbPath}
            title="Copy XML XPath"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#101b2e] hover:bg-[#182946] text-[10px] text-slate-300 border border-cyan-500/25 transition-colors cursor-pointer"
          >
            {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
            <span>{copiedPath ? 'Copied' : 'Copy path'}</span>
          </button>

          <button
            id="copy-full-xml-btn"
            onClick={copyFullXml}
            title="Copy full ISO 19115-2 XML"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#101b2e] hover:bg-[#182946] text-[10px] text-slate-300 border border-cyan-500/25 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
            <span>{copied ? 'Copied' : 'Copy XML'}</span>
          </button>
        </div>
      </div>

      {/* Line Numbers + XML Code View */}
      <div className="flex-1 overflow-auto p-2 font-mono text-[11px] leading-relaxed selection:bg-cyan-900/60 selection:text-cyan-100">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlight =
                line.includes('gmd:title') ||
                line.includes('EX_GeographicBoundingBox') ||
                line.includes('gmd:abstract');

              return (
                <tr
                  key={idx}
                  className={`hover:bg-cyan-950/30 ${
                    isHighlight ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="w-10 pr-3 text-right text-slate-600 select-none border-r border-cyan-500/10 align-top">
                    {lineNum}
                  </td>
                  <td className="pl-3 pr-2 text-slate-300 whitespace-pre font-mono">
                    <XmlLineRenderer text={line} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Syntax coloring for XML tags, attributes, and text
const XmlLineRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Simple regex highlighting for XML
  if (!text) return <span>&nbsp;</span>;

  // Render commented lines
  if (text.trim().startsWith('<!--')) {
    return <span className="text-emerald-500/80 italic">{text}</span>;
  }

  // Tag with content
  const parts = text.split(/(<[^>]+>)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<') && part.endsWith('>')) {
          const isClosing = part.startsWith('</');
          const tagName = part.replace(/[</>]/g, '').split(' ')[0];
          return (
            <span key={i} className="text-cyan-400 font-semibold">
              {isClosing ? '</' : '<'}
              <span className="text-cyan-300">{tagName}</span>
              {part.includes(' ') && (
                <span className="text-purple-300 text-[10px]">
                  {part.slice(part.indexOf(' '), -1)}
                </span>
              )}
              {'>'}
            </span>
          );
        }
        return (
          <span key={i} className="text-amber-200">
            {part}
          </span>
        );
      })}
    </>
  );
};
