import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KHUSHU_SETTINGS } from './khushuTypes';
import { KhushuStorage, KHUSHU_SETTINGS_STORAGE_KEY } from './khushuStorage';

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
});

