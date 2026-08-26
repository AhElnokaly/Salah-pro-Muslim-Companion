import { archiveMuezzins } from '../../utils/archiveMuezzins';
import { AudioTrack } from '../../utils/audioStorage';

export class AudioCatalog {
  static getAllMuezzins(): AudioTrack[] {
    return archiveMuezzins;
  }

  static getMuezzinById(id: string): AudioTrack | undefined {
    return archiveMuezzins.find((m) => m.id === id);
  }

  static getFajrMuezzins(): AudioTrack[] {
    return archiveMuezzins.filter((m) => m.isFajr);
  }

  static getStandardMuezzins(): AudioTrack[] {
    return archiveMuezzins.filter((m) => !m.isFajr);
  }
}
