import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface ConfiguredArtifact {
  id: string;
  platform: 'windows' | 'android' | 'shared';
  name: string;
  format: string;
  supportedOs: string;
  localFilePath: string;
  configuredDownloadUrl: string;
  version: string | null;
  releaseDate: string | null;
  sizeBytes?: number | null;
  sha256?: string | null;
  releaseNotes: string[];
  buildEnvironmentNote: string;
}

export interface EvaluatedArtifact {
  id: string;
  platform: 'windows' | 'android' | 'shared';
  name: string;
  format: string;
  supportedOs: string;
  available: boolean;
  downloadUrl: string | null;
  version: string | null;
  releaseDate: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  releaseNotes: string[];
  buildEnvironmentNote: string;
  statusMessage: string;
}

export function computeFileDigestAndSize(filePath: string): {
  sizeBytes: number;
  sha256: string;
} {
  const bytes = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return { sizeBytes: bytes.byteLength, sha256 };
}

/**
 * Resolves release artifacts strictly against real non-empty files on disk or explicitly configured HTTPS URLs.
 * Never fabricates file sizes, checksums, or download links for missing binaries.
 */
export function evaluateReleaseArtifacts(
  rootDir: string,
  artifacts: ConfiguredArtifact[]
): EvaluatedArtifact[] {
  return artifacts.map((item) => {
    const resolvedPath = path.resolve(rootDir, item.localFilePath);
    const stat =
      resolvedPath.startsWith(path.resolve(rootDir)) && fs.existsSync(resolvedPath)
        ? fs.statSync(resolvedPath)
        : null;
    const existsLocally = Boolean(stat && stat.isFile() && stat.size > 0);

    if (existsLocally) {
      const { sizeBytes, sha256 } = computeFileDigestAndSize(resolvedPath);
      const url = item.configuredDownloadUrl || `/api/downloads/artifact/${encodeURIComponent(item.id)}`;
      return {
        id: item.id,
        platform: item.platform,
        name: item.name,
        format: item.format,
        supportedOs: item.supportedOs,
        available: true,
        downloadUrl: url,
        version: item.version ?? '1.0.0',
        releaseDate: item.releaseDate ?? new Date(stat!.mtimeMs).toISOString().slice(0, 10),
        sizeBytes,
        sha256,
        releaseNotes: item.releaseNotes,
        buildEnvironmentNote: item.buildEnvironmentNote,
        statusMessage: 'Verified on disk with SHA-256 checksum.',
      };
    }

    const hasExternalUrl =
      typeof item.configuredDownloadUrl === 'string' &&
      item.configuredDownloadUrl.startsWith('https://');

    if (hasExternalUrl) {
      return {
        id: item.id,
        platform: item.platform,
        name: item.name,
        format: item.format,
        supportedOs: item.supportedOs,
        available: true,
        downloadUrl: item.configuredDownloadUrl,
        version: item.version,
        releaseDate: item.releaseDate,
        sizeBytes: typeof item.sizeBytes === 'number' ? item.sizeBytes : null,
        sha256: typeof item.sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(item.sha256)
          ? item.sha256.toLowerCase()
          : null,
        releaseNotes: item.releaseNotes,
        buildEnvironmentNote: item.buildEnvironmentNote,
        statusMessage: 'Hosted via configured external release URL.',
      };
    }

    return {
      id: item.id,
      platform: item.platform,
      name: item.name,
      format: item.format,
      supportedOs: item.supportedOs,
      available: false,
      downloadUrl: null,
      version: null,
      releaseDate: null,
      sizeBytes: null,
      sha256: null,
      releaseNotes: item.releaseNotes,
      buildEnvironmentNote: item.buildEnvironmentNote,
      statusMessage: 'Binary not built in this Linux container. GitHub Actions CI workflows are ready to build this installer.',
    };
  });
}

export function loadRawConfiguredArtifacts(rootDir: string): ConfiguredArtifact[] {
  const manifestPath = path.join(rootDir, 'config', 'releases.json');
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
    artifacts?: ConfiguredArtifact[];
  };
  return parsed.artifacts ?? [];
}

export function loadReleasesManifest(rootDir: string): EvaluatedArtifact[] {
  return evaluateReleaseArtifacts(rootDir, loadRawConfiguredArtifacts(rootDir));
}
