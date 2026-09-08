import { AudioCatalog } from './AudioCatalog';
import { getAudioUrl } from '../../utils/audioStorage';

export class AudioResolver {
  /**
   * Resolves playable audio URL with local IndexedDB/Blob fallback for offline play
   */
  static async resolvePlayableUrl(muezzinId: string, isFajr = false): Promise<string> {
    try {
      // 1. Resolve from AudioCatalog
      const muezzin = AudioCatalog.getMuezzinById(muezzinId);
      if (muezzin && muezzin.url) {
        return await getAudioUrl(muezzin.url, muezzinId, isFajr);
      }

      // 2. Fallback to default catalog item
      const list = isFajr ? AudioCatalog.getFajrMuezzins() : AudioCatalog.getStandardMuezzins();
      if (list.length > 0) {
        return await getAudioUrl(list[0].url, list[0].id, isFajr);
      }
    } catch (e) {
      console.warn('[AudioResolver] Error resolving playable audio URL:', e);
    }

    // Default local offline fallback bundled with app
    return isFajr ? '/audio/fajr-default.mp3' : '/audio/prayer-default.mp3';
  }
}

