import { CURRENT_RELEASE } from './data/changelog';

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  commitHash: string;
  releaseDate: string;
  releaseName: string;
  changelog: string[];
}

export const APP_COMMIT_HASH = (import.meta as any).env?.VITE_APP_COMMIT_HASH || 'unknown (no VITE_APP_COMMIT_HASH)';

export const APP_VERSION: AppVersionInfo = {
  version: CURRENT_RELEASE.version,
  buildNumber: CURRENT_RELEASE.buildNumber,
  commitHash: APP_COMMIT_HASH,
  releaseDate: CURRENT_RELEASE.date,
  releaseName: CURRENT_RELEASE.title,
  changelog: CURRENT_RELEASE.highlights.map(h => h.text)
};

