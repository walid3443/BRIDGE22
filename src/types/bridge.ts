export type PageId = 'home' | 'features' | 'downloads' | 'docs' | 'security' | 'about';

export interface ReleaseArtifact {
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

export interface SiteConfig {
  productName: string;
  repositoryUrl: string;
  contactEmail: string;
  securityContactEmail: string;
  organizationName: string;
  configurationNote: string;
}

export interface DocSection {
  id: string;
  category: 'Setup' | 'Features' | 'Troubleshooting';
  title: string;
  summary: string;
  steps: string[];
}
