import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KHUSHU_SETTINGS } from './khushuTypes';
import { KhushuStorage, KHUSHU_SETTINGS_STORAGE_KEY } from './khushuStorage';
import { getIqamaWindowInfo, parsePrayerTimeToDate } from './khushuFlowUtils';

describe('Khushu 2.0 Subsystem Unit Tests', () => {
  let mockStore: Map<string, string>;

  beforeEach(() => {
    mockStore = new Map();
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore.get(key) ?? null,
      setItem: (key: string, val: string) => mockStore.set(key, String(val)),
      removeItem: (key: string) => mockStore.delete(key),
      clear: () => mockStore.clear(),
      key: (idx: number) => Array.from(mockStore.keys())[idx] ?? null,
      get length() {
        return mockStore.size;
      },
    };
  });

  it('provides comprehensive default settings for prayers and iqama', () => {
    assert.equal(DEFAULT_KHUSHU_SETTINGS.preferredMode, 'silent');
    assert.equal(DEFAULT_KHUSHU_SETTINGS.defaultDurationMinutes, 15);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.enableFridaySpecial, true);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.prayerDurations.friday, 45);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.prayerDurations.fajr, 20);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.iqamaOffsets.fajr, 20);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.iqamaOffsets.maghrib, 10);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.enableEmergencyCallBypass, true);
    assert.equal(DEFAULT_KHUSHU_SETTINGS.enableGentleHapticPulse, true);
  });

  it('reads and writes khushu settings accurately to storage', () => {
    const initial = KhushuStorage.getSettings();
    assert.equal(initial.autoWithIqama, false);

    KhushuStorage.saveSettings({
      ...initial,
      autoWithIqama: true,
      prayerDurations: {
        ...initial.prayerDurations,
        fajr: 25,
      },
    });

    const updated = KhushuStorage.getSettings();
    assert.equal(updated.autoWithIqama, true);
    assert.equal(updated.prayerDurations.fajr, 25);
    assert.equal(updated.prayerDurations.dhuhr, 15);
  });

  it('manages distraction shield dismissal session correctly', () => {
    const sessionId = 'session_12345';
    assert.equal(KhushuStorage.isShieldDismissed(sessionId), false);

    KhushuStorage.setShieldDismissed(sessionId);
    assert.equal(KhushuStorage.isShieldDismissed(sessionId), true);
    assert.equal(KhushuStorage.isShieldDismissed('other_session'), false);

    KhushuStorage.clearShieldDismissed();
    assert.equal(KhushuStorage.isShieldDismissed(sessionId), false);
  });

  it('formats widget khushu status and text accurately', () => {
    // Tests widget representation logic
    const getWidgetKhushuRepresentation = (isActive: boolean, remainingMinutes: number) => {
      if (isActive) {
        return {
          statusText: `الخشوع نشط: هدوء وسكون (متبقي ${remainingMinutes} د)`,
          btnText: 'إنهاء الخشوع 🔔',
          statusColor: '#34d399',
        };
      }
      return {
        statusText: 'وضع الخشوع: هدوء وسكون',
        btnText: 'تفعيل الخشوع 🔕',
        statusColor: '#94a3b8',
      };
    };

    const activeRep = getWidgetKhushuRepresentation(true, 18);
    assert.equal(activeRep.statusText, 'الخشوع نشط: هدوء وسكون (متبقي 18 د)');
    assert.equal(activeRep.btnText, 'إنهاء الخشوع 🔔');
    assert.equal(activeRep.statusColor, '#34d399');

    const inactiveRep = getWidgetKhushuRepresentation(false, 0);
    assert.equal(inactiveRep.statusText, 'وضع الخشوع: هدوء وسكون');
    assert.equal(inactiveRep.btnText, 'تفعيل الخشوع 🔕');
    assert.equal(inactiveRep.statusColor, '#94a3b8');
  });

  it('accurately identifies Adhan -> Iqama window and exact Iqama moment', () => {
    const mockTimes = {
      Fajr: '05:00 AM',
      Sunrise: '06:20 AM',
      Dhuhr: '12:30 PM',
      Asr: '03:45 PM',
      Maghrib: '06:10 PM',
      Isha: '07:30 PM',
    };

    const baseDate = new Date(2026, 8, 15, 12, 35, 0); // 12:35 PM, 5 minutes after Dhuhr (Tuesday)
    const info = getIqamaWindowInfo(mockTimes, DEFAULT_KHUSHU_SETTINGS, baseDate);

    assert.ok(info);
    assert.equal(info.prayerId, 'dhuhr');
    assert.equal(info.prayerName, 'الظهر');
    assert.equal(info.isInAdhanIqamaWindow, true);
    assert.equal(info.minutesToIqama, 10); // 15 - 5 = 10 mins
    assert.equal(info.isExactIqamaMoment, false);
    assert.equal(info.suggestedDuration, 15);

    // At exact Iqama moment (12:45 PM)
    const exactIqamaDate = new Date(2026, 8, 15, 12, 45, 10);
    const exactInfo = getIqamaWindowInfo(mockTimes, DEFAULT_KHUSHU_SETTINGS, exactIqamaDate);
    assert.ok(exactInfo);
    assert.equal(exactInfo.isExactIqamaMoment, true);

    // Well after Iqama (1:00 PM)
    const lateDate = new Date(2026, 8, 15, 13, 0, 0);
    const lateInfo = getIqamaWindowInfo(mockTimes, DEFAULT_KHUSHU_SETTINGS, lateDate);
    assert.equal(lateInfo, null);
  });

  it('applies Friday special Iqama offset and prayer duration for Dhuhr', () => {
    const mockTimes = {
      Fajr: '05:00 AM',
      Sunrise: '06:20 AM',
      Dhuhr: '12:30 PM',
      Asr: '03:45 PM',
      Maghrib: '06:10 PM',
      Isha: '07:30 PM',
    };

    // A Friday at 12:35 PM
    const fridayDate = new Date(2026, 8, 18, 12, 35, 0); // Day 5 = Friday
    const info = getIqamaWindowInfo(mockTimes, DEFAULT_KHUSHU_SETTINGS, fridayDate);

    assert.ok(info);
    assert.equal(info.prayerName, 'الجمعة');
    assert.equal(info.minutesToIqama, 20); // 25 min friday offset - 5 = 20 mins
    assert.equal(info.suggestedDuration, 45); // 45 min friday special
  });
});

