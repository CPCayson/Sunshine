import { ExpectedFile, ObservedFile, FileComparisonItem, ComparisonState } from '../types';

export const EN2501_EXPECTED_FILES: ExpectedFile[] = [
  {
    logicalFileKey: 'FLK:en2501:sonar:dive01:raw',
    filename: 'EN2501_D01_Kraken_MINSAS_Raw.s7k',
    relativePath: 'raw/sonar/EN2501_D01_Kraken_MINSAS_Raw.s7k',
    mediaType: 'application/octet-stream',
    sizeBytes: 1428571428,
    algorithm: 'SHA-256',
    expectedChecksum: '8e4f1a23c590ba1f2249de659381bf4520938b82400e9a78942125bbce419510',
    version: '1.0.0',
    sourceRef: 'SR:cruise-manifest:en2501:p1',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:minsas',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    mandatory: true
  },
  {
    logicalFileKey: 'FLK:en2501:sonar:dive01:proc',
    filename: 'EN2501_D01_Backscatter_Mosaic_1m.tif',
    relativePath: 'processed/sonar/EN2501_D01_Backscatter_Mosaic_1m.tif',
    mediaType: 'image/tiff; application=geotiff',
    sizeBytes: 854910240,
    algorithm: 'SHA-256',
    expectedChecksum: '44a7281bc8910029ef31049281a0b3c299a9b1c3d4e5f60718293a4b5c6d7e8f',
    version: '1.1.0',
    sourceRef: 'SR:cruise-manifest:en2501:p1',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:minsas',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    mandatory: true
  },
  {
    logicalFileKey: 'FLK:en2501:ctd:dive01:cnv',
    filename: 'EN2501_D01_SBE49_CTD_Profile.cnv',
    relativePath: 'raw/ctd/EN2501_D01_SBE49_CTD_Profile.cnv',
    mediaType: 'text/plain',
    sizeBytes: 4892010,
    algorithm: 'SHA-256',
    expectedChecksum: 'a9b8c7d6e5f4031234567890abcdef1234567890abcdef1234567890abcdef12',
    version: '1.0.0',
    sourceRef: 'SR:ship-sensor-log:sbe49:en2501',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:ctd',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    mandatory: true
  },
  {
    logicalFileKey: 'FLK:en2501:nav:usbl:dive01',
    filename: 'EN2501_D01_USBL_Track_PostProcessed.csv',
    relativePath: 'nav/EN2501_D01_USBL_Track_PostProcessed.csv',
    mediaType: 'text/csv',
    sizeBytes: 24108840,
    algorithm: 'SHA-256',
    expectedChecksum: 'c1d2e3f4a5b60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    version: '2.0.0',
    sourceRef: 'SR:usbl-nav-log:dive01',
    canonicalRef: 'deployment:en2501:dive01',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    mandatory: true
  },
  {
    logicalFileKey: 'FLK:en2501:report:cruise_summary',
    filename: 'EN2501_Cruise_Summary_Report_Final.pdf',
    relativePath: 'docs/EN2501_Cruise_Summary_Report_Final.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 15401920,
    algorithm: 'SHA-256',
    expectedChecksum: 'f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100',
    version: '1.0.0',
    sourceRef: 'SR:cruise-report:en2501',
    canonicalRef: 'mission:en2501',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    mandatory: true
  },
  {
    logicalFileKey: 'FLK:en2501:optical:laser_sample',
    filename: 'EN2501_D01_Voyis_LaserPointCloud.las',
    relativePath: 'processed/optical/EN2501_D01_Voyis_LaserPointCloud.las',
    mediaType: 'application/vnd.las',
    sizeBytes: 3105408200,
    algorithm: 'SHA-256',
    expectedChecksum: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    version: '1.0.0',
    sourceRef: 'SR:cruise-manifest:en2501:p1',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:optical',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    mandatory: false
  }
];

export const EN2501_OBSERVED_FILES: ObservedFile[] = [
  {
    logicalFileKey: 'FLK:en2501:sonar:dive01:raw',
    filename: 'EN2501_D01_Kraken_MINSAS_Raw.s7k',
    relativePath: 'raw/sonar/EN2501_D01_Kraken_MINSAS_Raw.s7k',
    physicalIdentity: 's3://noaa-ocean-data-staging/raw/en2501/minsas/EN2501_D01_Kraken_MINSAS_Raw.s7k',
    fileVersionIdentity: 'obj-ver-20250620-r2r-fixity-pass',
    sizeBytes: 1428571428,
    algorithm: 'SHA-256',
    checksum: '8e4f1a23c590ba1f2249de659381bf4520938b82400e9a78942125bbce419510',
    version: '1.0.0',
    sourceRef: 'SR:r2r-manifest-harvest:20250620',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:minsas',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    observedAt: '2026-09-08T18:20:00Z',
    observedBy: 'R2R Shipboard Data Harvester'
  },
  {
    logicalFileKey: 'FLK:en2501:sonar:dive01:proc',
    filename: 'EN2501_D01_Backscatter_Mosaic_1m.tif',
    relativePath: 'processed/sonar/EN2501_D01_Backscatter_Mosaic_1m.tif',
    physicalIdentity: 's3://noaa-ocean-data-staging/processed/sonar/EN2501_D01_Backscatter_Mosaic_1m.tif',
    fileVersionIdentity: 'obj-ver-20250701-bathy-v1.1',
    sizeBytes: 854910240,
    algorithm: 'SHA-256',
    checksum: '44a7281bc8910029ef31049281a0b3c299a9b1c3d4e5f60718293a4b5c6d7e8f',
    version: '1.1.0',
    sourceRef: 'SR:science-party-upload:en2501',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:minsas',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    observedAt: '2026-09-08T18:22:00Z',
    observedBy: 'Science Party Lead Scientist'
  },
  {
    logicalFileKey: 'FLK:en2501:ctd:dive01:cnv',
    filename: 'EN2501_D01_SBE49_CTD_Profile.cnv',
    relativePath: 'raw/ctd/EN2501_D01_SBE49_CTD_Profile.cnv',
    physicalIdentity: 's3://noaa-ocean-data-staging/raw/ctd/EN2501_D01_SBE49_CTD_Profile.cnv',
    fileVersionIdentity: 'obj-ver-20250620-ctd-sbe49',
    sizeBytes: 4892010,
    algorithm: 'SHA-256',
    checksum: 'a9b8c7d6e5f4031234567890abcdef1234567890abcdef1234567890abcdef12',
    version: '1.0.0',
    sourceRef: 'SR:ship-sensor-log:sbe49:en2501',
    canonicalRef: 'dataset:en2501:hawaiian-ridge:ctd',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    observedAt: '2026-09-08T18:25:00Z',
    observedBy: 'CTD Technician'
  },
  {
    logicalFileKey: 'FLK:en2501:nav:usbl:dive01',
    filename: 'EN2501_D01_USBL_Track_PostProcessed.csv',
    relativePath: 'nav/EN2501_D01_USBL_Track_PostProcessed.csv',
    physicalIdentity: 's3://noaa-ocean-data-staging/nav/EN2501_D01_USBL_Track_PostProcessed.csv',
    fileVersionIdentity: 'obj-ver-20250705-usbl-recalibrated',
    sizeBytes: 24108840,
    algorithm: 'SHA-256',
    checksum: 'c1d2e3f4a5b60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    version: '2.0.0',
    sourceRef: 'SR:nav-specialist:en2501',
    canonicalRef: 'deployment:en2501:dive01',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    observedAt: '2026-09-08T18:27:00Z',
    observedBy: 'Navigator Lead'
  },
  {
    logicalFileKey: 'FLK:en2501:report:cruise_summary',
    filename: 'EN2501_Cruise_Summary_Report_Final.pdf',
    relativePath: 'docs/EN2501_Cruise_Summary_Report_Final.pdf',
    physicalIdentity: 's3://noaa-ocean-data-staging/docs/EN2501_Cruise_Summary_Report_Final.pdf',
    fileVersionIdentity: 'obj-ver-20250715-pdf-signed',
    sizeBytes: 15401920,
    algorithm: 'SHA-256',
    checksum: 'f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100',
    version: '1.0.0',
    sourceRef: 'SR:chief-scientist-signoff',
    canonicalRef: 'mission:en2501',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    observedAt: '2026-09-08T18:30:00Z',
    observedBy: 'Expedition Coordinator'
  },
  {
    logicalFileKey: 'FLK:en2501:extra:pilot_field_notes',
    filename: 'EN2501_Remus_Pilot_Field_Notes.txt',
    relativePath: 'notes/EN2501_Remus_Pilot_Field_Notes.txt',
    physicalIdentity: 's3://noaa-ocean-data-staging/notes/EN2501_Remus_Pilot_Field_Notes.txt',
    fileVersionIdentity: 'obj-ver-20250620-notes-raw',
    sizeBytes: 18240,
    algorithm: 'SHA-256',
    checksum: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    version: '0.9.0',
    sourceRef: 'SR:uuv-pilot-deck:en2501',
    canonicalRef: 'deployment:en2501:dive01',
    packageRef: 'PKG:NCEI-OISS:EN2501-UUV-2025-01',
    observedAt: '2026-09-08T18:35:00Z',
    observedBy: 'Remus Pilot Deck Hand'
  }
];

export function compareFileInventories(
  expectedFiles: ExpectedFile[] = EN2501_EXPECTED_FILES,
  observedFiles: ObservedFile[] = EN2501_OBSERVED_FILES
): FileComparisonItem[] {
  const result: FileComparisonItem[] = [];
  const observedMap = new Map<string, ObservedFile>();
  observedFiles.forEach(f => observedMap.set(f.logicalFileKey, f));

  expectedFiles.forEach(exp => {
    const obs = observedMap.get(exp.logicalFileKey);
    if (!obs) {
      result.push({
        logicalFileKey: exp.logicalFileKey,
        filename: exp.filename,
        expected: exp,
        state: 'MISSING',
        notes: exp.mandatory ? 'Mandatory package file missing from staging' : 'Optional file not observed'
      });
    } else {
      observedMap.delete(exp.logicalFileKey);
      const isChecksumMatch = !exp.expectedChecksum || (obs.checksum ? exp.expectedChecksum.toLowerCase() === obs.checksum.toLowerCase() : false);
      const isSizeMatch = !exp.sizeBytes || exp.sizeBytes === obs.sizeBytes;
      const isVersionMatch = !exp.version || exp.version === obs.version;

      let state: ComparisonState = 'MATCH';
      if (!isChecksumMatch || !isSizeMatch || !isVersionMatch) {
        state = 'MISMATCH';
      }

      result.push({
        logicalFileKey: exp.logicalFileKey,
        filename: exp.filename,
        expected: exp,
        observed: obs,
        state,
        notes: isChecksumMatch ? 'Checksum & size verified against manifest' : 'Checksum mismatch with expected manifest'
      });
    }
  });

  // Remaining observed files are EXTRA
  observedMap.forEach(obs => {
    result.push({
      logicalFileKey: obs.logicalFileKey,
      filename: obs.filename,
      observed: obs,
      state: 'EXTRA',
      notes: 'File exists in staging payload but is not declared in expected package manifest'
    });
  });

  return result;
}
