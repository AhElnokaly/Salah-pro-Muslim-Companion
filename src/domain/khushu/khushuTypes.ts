import { KhushuModeType } from '../../services/khushuModePlugin';

export interface KhushuPrayerDurations {
  fajr: number;    // بالدقائق (مثلاً 20)
  dhuhr: number;   // 15
  asr: number;     // 15
  maghrib: number; // 15
  isha: number;    // 20
  friday: number;  // 45
}

export interface KhushuIqamaOffsets {
  fajr: number;    // دقائق بعد الأذان (مثلاً 20)
  dhuhr: number;   // 15
  asr: number;     // 15
  maghrib: number; // 10
  isha: number;    // 15
  friday: number;  // 25
}

export interface KhushuSettings {
  preferredMode: KhushuModeType;
  defaultDurationMinutes: number;
  autoWithIqama: boolean;
  enableFridaySpecial: boolean;
  enableDistractionShield: boolean;
  enableEmergencyCallBypass: boolean;
  enableGentleHapticPulse: boolean;
  enablePostPrayerAthkar: boolean;
  prayerDurations: KhushuPrayerDurations;
  iqamaOffsets: KhushuIqamaOffsets;
}

export const DEFAULT_KHUSHU_SETTINGS: KhushuSettings = {
  preferredMode: 'silent',
  defaultDurationMinutes: 15,
  autoWithIqama: false,
  enableFridaySpecial: true,
  enableDistractionShield: true,
  enableEmergencyCallBypass: true,
  enableGentleHapticPulse: true,
  enablePostPrayerAthkar: true,
  prayerDurations: {
    fajr: 20,
    dhuhr: 15,
    asr: 15,
    maghrib: 15,
    isha: 20,
    friday: 45,
  },
  iqamaOffsets: {
    fajr: 20,
    dhuhr: 15,
    asr: 15,
    maghrib: 10,
    isha: 15,
    friday: 25,
  },
};
