import { CURRENT_RELEASE } from './data/changelog';

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  releaseName: string;
  changelog: string[];
}

export const APP_VERSION: AppVersionInfo = {
  version: CURRENT_RELEASE.version,
  buildNumber: CURRENT_RELEASE.buildNumber,
  releaseDate: CURRENT_RELEASE.date,
  releaseName: CURRENT_RELEASE.title,
  changelog: CURRENT_RELEASE.highlights.map(h => h.text)
};
