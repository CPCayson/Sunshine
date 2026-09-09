import { IngestedSourceRow, SourceArtifact } from '../types';

export interface SourceFirstIngestResult {
  artifact: SourceArtifact;
  rows: IngestedSourceRow[];
  hashStatus: 'SHA256_VERIFIED' | 'HASH_UNAVAILABLE';
  warnings: string[];
}

const normalizeFileName = (title: string, extension: string) =>
  `${title || 'source_artifact'}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') + extension;

async function computeSha256(text: string): Promise<string | undefined> {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    return undefined;
  }

  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      result.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  result.push(value.trim());
  return result;
}

function rowsFromCsv(
  input: string,
  artifactId: string,
  sourceFile: string,
  sheetName: string,
  importedAt: string,
  artifactHash?: string
): IngestedSourceRow[] {
  const lines = input.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: IngestedSourceRow[] = [];

  lines.slice(1).forEach((line, lineIndex) => {
    const cells = parseCsvLine(line);
    headers.forEach((header, columnIndex) => {
      const rawValue = cells[columnIndex] ?? '';
      if (!rawValue) return;
      rows.push({
        id: `${artifactId}:r${lineIndex + 2}:c${columnIndex + 1}`,
        sourceArtifactId: artifactId,
        sourceFile,
        sheet: sheetName,
        row: lineIndex + 2,
        column: header || `column_${columnIndex + 1}`,
        rawField: header || `column_${columnIndex + 1}`,
        rawValue,
        importTimestamp: importedAt,
        artifactHash,
      });
    });
  });

  return rows;
}

function rowsFromJson(
  input: string,
  artifactId: string,
  sourceFile: string,
  importedAt: string,
  artifactHash?: string
): IngestedSourceRow[] {
  const parsed = JSON.parse(input);
  const records = Array.isArray(parsed) ? parsed : [parsed];
  const rows: IngestedSourceRow[] = [];

  records.forEach((record, rowIndex) => {
    if (!record || typeof record !== 'object') return;
    Object.entries(record as Record<string, unknown>).forEach(([field, value], columnIndex) => {
      if (value === null || value === undefined || value === '') return;
      rows.push({
        id: `${artifactId}:r${rowIndex + 1}:c${columnIndex + 1}`,
        sourceArtifactId: artifactId,
        sourceFile,
        sheet: 'json',
        row: rowIndex + 1,
        column: field,
        rawField: field,
        rawValue: typeof value === 'string' ? value : JSON.stringify(value),
        importTimestamp: importedAt,
        artifactHash,
      });
    });
  });

  return rows;
}

/**
 * Truth-safe source ingestion boundary.
 *
 * This service mints SourceArtifact + IngestedSourceRow observations only.
 * It deliberately performs NO fuzzy identity merge, NO canonical mutation,
 * and NO capability/deployment/data-lineage assertion.
 */
export async function ingestCorpusSource(
  input: string,
  format: 'CSV' | 'JSON' | 'WORKBOOK_ROW',
  artifactTitle: string,
  sheetName = 'Sheet1'
): Promise<SourceFirstIngestResult> {
  const importedAt = new Date().toISOString();
  const artifactId = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const artifactHash = await computeSha256(input);
  const extension = format === 'JSON' ? '.json' : '.csv';
  const sourceFile = normalizeFileName(artifactTitle, extension);

  let rows: IngestedSourceRow[] = [];
  const warnings: string[] = [];

  if (format === 'JSON') {
    try {
      rows = rowsFromJson(input, artifactId, sourceFile, importedAt, artifactHash);
    } catch {
      warnings.push('JSON_PARSE_ERROR: source was not ingested because it is not valid JSON.');
    }
  } else {
    rows = rowsFromCsv(input, artifactId, sourceFile, sheetName, importedAt, artifactHash);
    if (rows.length === 0) {
      warnings.push('NO_DATA_ROWS: CSV/workbook text needs a header row and at least one populated data row.');
    }
  }

  const artifact: SourceArtifact = {
    id: artifactId,
    name: artifactTitle || `Imported ${format} source`,
    artifactType: format === 'JSON' ? 'JSON_FEED' : format === 'CSV' ? 'CSV_TABLE' : 'XLSX_WORKBOOK',
    fileName: sourceFile,
    sheetName: format === 'JSON' ? undefined : sheetName,
    artifactHash,
    importedAt,
    provenanceType: 'IMPORTED_ARTIFACT',
    recordCount: rows.length,
    organization: 'User-provided source',
    description:
      'Source-first observation artifact. Ingestion preserves raw evidence only; it does not mutate accepted UxsMission knowledge.',
  };

  if (!artifactHash) {
    warnings.push('HASH_UNAVAILABLE: Web Crypto SHA-256 was unavailable in this runtime; no hash was asserted.');
  }

  return {
    artifact,
    rows,
    hashStatus: artifactHash ? 'SHA256_VERIFIED' : 'HASH_UNAVAILABLE',
    warnings,
  };
}
