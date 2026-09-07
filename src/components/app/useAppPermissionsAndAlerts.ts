import { useState, useEffect, useCallback } from 'react';
import { 
  checkExactAlarmPermission, 
  checkNotificationPermission 
} from '../../services/athanAlarmPlugin';
import { StorageFacade } from '../../domain/storage/StorageFacade';

export interface HeaderParticle {
  id: string;
  x: number;
  y: number;
  rotate: number;
  emoji: string;
  scale: number;
}

export function useAppPermissionsAndAlerts() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageWarningAcknowledged, setStorageWarningAcknowledged] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => 
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [notifBannerDismissed, setNotifBannerDismissed] = useState<boolean>(false);
  const [exactAlarmPermissionGranted, setExactAlarmPermissionGranted] = useState<boolean>(true);
  const [exactAlarmBannerDismissed, setExactAlarmBannerDismissed] = useState<boolean>(false);

  // Smart Network & Sync Status Indicator State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Floating particles state
  const [headerParticles, setHeaderParticles] = useState<HeaderParticle[]>([]);

  // Proactive check and listener for exact alarm permission and notification permission
  useEffect(() => {
    checkExactAlarmPermission().then(granted => {
      setExactAlarmPermissionGranted(granted);
    });

    checkNotificationPermission().then(granted => {
      if (granted) {
        setNotifPermission('granted');
      }
    });

    // Silent progressive background migration of heavy collections to IndexedDB
    StorageFacade.initAndMigrate().catch((err) => {
      console.warn('[App] StorageFacade background init warning:', err);
    });

    const handleMissingPerm = () => {
      setExactAlarmPermissionGranted(false);
    };
    window.addEventListener('exact-alarm-permission-missing', handleMissingPerm);
    return () => {
      window.removeEventListener('exact-alarm-permission-missing', handleMissingPerm);
    };
  }, []);

  // Network and GPS sync event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleGpsSync = () => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2200);
    };
    window.addEventListener('trigger-gps-sync', handleGpsSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('trigger-gps-sync', handleGpsSync);
    };
  }, []);

  // Auto-dismiss toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const triggerHeaderParticles = useCallback(() => {
    const emojis = ['✨', '⭐', '🌸', '🤍', '💚', '🕌'];
    const newParticles: HeaderParticle[] = Array.from({ length: 10 }).map((_, idx) => {
      const angle = (Math.random() * 120 + 30) * (Math.PI / 180);
      const distance = Math.random() * 60 + 50;
      const x = Math.cos(angle) * distance;
      const y = -Math.sin(angle) * distance - 15;
      
      return {
        id: `${Date.now()}-${idx}-${Math.random()}`,
        x,
        y,
        rotate: Math.random() * 360 - 180,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: Math.random() * 0.5 + 0.7
      };
    });
    
    setHeaderParticles(newParticles);
    setTimeout(() => {
      setHeaderParticles([]);
    }, 1500);
  }, []);

  const handleShareApp = useCallback(async () => {
    const shareData = {
      title: 'هِمَّتِي Hemmaty',
      text: 'تطبيق هِمَّتِي: مواقيت الصلاة بدقة عالية، الأذكار اليومية، الختمات والقرآن الكريم، واتجاه القبلة مع ميزات رائعة وتصميم عصري!',
      url: 'https://salah-pro-muslim-companion.vercel.app/',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setToastMessage("تم فتح قائمة المشاركة بنجاح 📤");
      } catch (err) {
        console.log("Share failed or was canceled:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setToastMessage("تم نسخ رابط التطبيق بنجاح! شاركه الآن مع أحبابك 🔗🤍");
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        setToastMessage("عذراً، لم نتمكن من نسخ الرابط تلقائياً. يمكنك مشاركة هذا الرابط: https://salah-pro-muslim-companion.vercel.app/");
      }
    }
  }, []);

  return {
    toastMessage,
    setToastMessage,
    storageWarningAcknowledged,
    setStorageWarningAcknowledged,
    notifPermission,
    setNotifPermission,
    notifBannerDismissed,
    setNotifBannerDismissed,
    exactAlarmPermissionGranted,
    setExactAlarmPermissionGranted,
    exactAlarmBannerDismissed,
    setExactAlarmBannerDismissed,
    isOnline,
    isSyncing,
    headerParticles,
    triggerHeaderParticles,
    handleShareApp
  };
}
