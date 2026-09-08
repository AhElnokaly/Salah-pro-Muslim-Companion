import { useState, useEffect, useCallback, useRef } from 'react';
import { KhushuMode, KhushuModeType } from '../services/khushuModePlugin';
import { KhushuSettings } from '../domain/khushu/khushuTypes';
import { KhushuStorage } from '../domain/khushu/khushuStorage';

export function useKhushuMode() {
  const [isActive, setIsActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<KhushuModeType>('silent');
  const [currentDuration, setCurrentDuration] = useState(15);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [hasPermission, setHasPermission] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [loading, setLoading] = useState(false);

  // إعدادات الخشوع الشاملة
  const [settings, setSettings] = useState<KhushuSettings>(() => KhushuStorage.getSettings());

  // حالة شاشة السكون الإيماني ونافذة ما بعد الصلاة
  const [shieldVisible, setShieldVisible] = useState(false);
  const [postPrayerModalOpen, setPostPrayerModalOpen] = useState(false);

  const prevActiveRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string>('');

  // تنسيق الوقت المتبقي
  const formatRemainingTime = useCallback((secs: number = remainingSeconds) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  }, [remainingSeconds]);

  // مزامنة حالة وضع الخشوع من البلجن
  const syncStatus = useCallback(async () => {
    try {
      const status = await KhushuMode.getStatus();
      const wasActive = prevActiveRef.current;
      setIsActive(status.active);
      setCurrentMode(status.mode);
      setCurrentDuration(status.durationMinutes);
      setRemainingSeconds(status.remainingSeconds);

      // إذا بدأ الوضع للتو
      if (status.active && !wasActive) {
        sessionIdRef.current = `session_${Date.now()}`;
        KhushuStorage.clearShieldDismissed();
        if (settings.enableDistractionShield) {
          setShieldVisible(true);
        }
      }

      // إذا انتهى الوضع للتو
      if (!status.active && wasActive) {
        setShieldVisible(false);
        // إطلاق نبضة الاهتزاز اللطيفة
        if (settings.enableGentleHapticPulse && typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([120, 100, 120]);
          } catch {
            // ignore
          }
        }
        // إظهار نافذة أذكار ما بعد الصلاة
        if (settings.enablePostPrayerAthkar) {
          setPostPrayerModalOpen(true);
        }
      }

      prevActiveRef.current = status.active;
    } catch (e) {
      console.warn('[useKhushuMode] syncStatus error:', e);
    }
  }, [settings.enableDistractionShield, settings.enableGentleHapticPulse, settings.enablePostPrayerAthkar]);

  // فحص الصلاحيات
  const checkPermission = useCallback(async () => {
    try {
      const res = await KhushuMode.checkPermission();
      setHasPermission(res.granted);
    } catch (e) {
      console.warn('[useKhushuMode] checkPermission error:', e);
    }
  }, []);

  // طلب الصلاحية
  const requestPermission = useCallback(async () => {
    try {
      await KhushuMode.requestPermission();
      await checkPermission();
    } catch (e) {
      console.warn('[useKhushuMode] requestPermission error:', e);
    }
  }, [checkPermission]);

  // حفظ الإعدادات وتحديث الحالة
  const updateSettings = useCallback((newSettings: Partial<KhushuSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      KhushuStorage.saveSettings(updated);
      return updated;
    });
  }, []);

  // تفعيل وضع الخشوع
  const activate = useCallback(
    async (durationMinutes?: number, modeOverride?: KhushuModeType): Promise<boolean> => {
      const mode = modeOverride || settings.preferredMode || 'silent';
      const duration = durationMinutes || settings.defaultDurationMinutes || 15;

      setLoading(true);
      try {
        if (mode === 'dnd') {
          const perm = await KhushuMode.checkPermission();
          if (!perm.granted) {
            await KhushuMode.requestPermission();
            const permAfter = await KhushuMode.checkPermission();
            if (!permAfter.granted) {
              setHasPermission(false);
              setLoading(false);
              return false;
            }
          }
        }

        const res = await KhushuMode.activate({
          mode,
          durationMinutes: duration,
        });

        if (res.active) {
          sessionIdRef.current = `session_${Date.now()}`;
          KhushuStorage.clearShieldDismissed();
          if (settings.enableDistractionShield) {
            setShieldVisible(true);
          }
          await syncStatus();
        }
        return res.active;
      } catch (e) {
        console.error('[useKhushuMode] activate error:', e);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [settings, syncStatus]
  );

  // إنهاء وضع الخشوع
  const deactivate = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await KhushuMode.deactivate();
      if (!res.active) {
        setShieldVisible(false);
        await syncStatus();
      }
      return !res.active;
    } catch (e) {
      console.error('[useKhushuMode] deactivate error:', e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [syncStatus]);

  // إغلاق شاشة السكون مع استمرار الوضع الصامت
  const dismissShield = useCallback(() => {
    setShieldVisible(false);
    if (sessionIdRef.current) {
      KhushuStorage.setShieldDismissed(sessionIdRef.current);
    }
  }, []);

  const closePostPrayerModal = useCallback(() => {
    setPostPrayerModalOpen(false);
  }, []);

  // المزامنة الدورية
  useEffect(() => {
    syncStatus();
    checkPermission();

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncStatus();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // إذا كان وضع الخشوع نشطاً، يتم تحديث العداد كل ثانية
    // إذا كان خاملاً، يكفي فحص دوري خفيف (كل 30 ثانية) لتوفير طاقة المعالج والبطارية
    const pollInterval = isActive ? 1000 : 30000;
    const interval = setInterval(syncStatus, pollInterval);

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [syncStatus, checkPermission, isActive]);

  return {
    isActive,
    currentMode,
    mode: currentMode,
    currentDuration,
    durationMinutes: currentDuration,
    remainingSeconds,
    formatRemainingTime,
    hasPermission,
    isSupported,
    loading,
    isLoading: loading,
    settings,
    updateSettings,
    shieldVisible,
    postPrayerModalOpen,
    dismissShield,
    closePostPrayerModal,
    activate,
    deactivate,
    requestPermission,
    checkPermission,
    syncStatus,
  };
}
