import { useState, useEffect, useCallback } from 'react';

export interface UsePwaInstallReturn {
  deferredPrompt: any;
  isInstalled: boolean;
  showPwaInstallGuide: boolean;
  setShowPwaInstallGuide: (show: boolean) => void;
  showManualSteps: boolean;
  setShowManualSteps: (show: boolean) => void;
  handleInstallApp: () => Promise<void>;
  handleDirectInstallInsideModal: (setToastMessage?: (msg: string) => void) => Promise<void>;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showPwaInstallGuide, setShowPwaInstallGuide] = useState<boolean>(false);
  const [showManualSteps, setShowManualSteps] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Installation prompt failed:", err);
        setShowManualSteps(false);
        setShowPwaInstallGuide(true);
      }
    } else {
      setShowManualSteps(false);
      setShowPwaInstallGuide(true);
    }
  }, [deferredPrompt]);

  const handleDirectInstallInsideModal = useCallback(async (setToastMessage?: (msg: string) => void) => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response inside modal: ${outcome}`);
        setDeferredPrompt(null);
        setShowPwaInstallGuide(false);
      } catch (err) {
        console.error("Direct install inside modal failed:", err);
      }
    } else {
      if (setToastMessage) {
        setToastMessage("عذراً، متصفحك يمنع التثبيت التلقائي حالياً (أو أنك تتصفح من داخل إطار المعاينة). تم تفعيل وعرض خطوات التثبيت اليدوي بالأسفل 📲");
      }
      setShowManualSteps(true);
    }
  }, [deferredPrompt]);

  return {
    deferredPrompt,
    isInstalled,
    showPwaInstallGuide,
    setShowPwaInstallGuide,
    showManualSteps,
    setShowManualSteps,
    handleInstallApp,
    handleDirectInstallInsideModal,
  };
}
