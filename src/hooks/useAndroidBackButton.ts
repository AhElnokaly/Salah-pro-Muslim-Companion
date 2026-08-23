import { useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { TabId } from '../types';

export interface OverlayConfig {
  id: string;
  isOpen: boolean;
  close: () => void;
}

export interface UseAndroidBackButtonProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  overlays: OverlayConfig[];
  setToastMessage?: (msg: string) => void;
}

export function useAndroidBackButton({
  activeTab,
  setActiveTab,
  overlays,
  setToastMessage,
}: UseAndroidBackButtonProps) {
  const tabHistoryRef = useRef<TabId[]>(['home']);
  const isBackNavigationRef = useRef<boolean>(false);
  const lastBackPressTimeRef = useRef<number>(0);

  // Track tab navigation history
  useEffect(() => {
    if (isBackNavigationRef.current) {
      isBackNavigationRef.current = false;
      return;
    }

    const history = tabHistoryRef.current;
    const lastTab = history[history.length - 1];

    if (activeTab === 'home') {
      // Returning to home resets tab history stack to ['home']
      tabHistoryRef.current = ['home'];
    } else if (lastTab !== activeTab) {
      // Push new tab onto stack
      tabHistoryRef.current.push(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const setupListener = async () => {
      try {
        listenerHandle = await CapacitorApp.addListener('backButton', () => {
          // 1. Dispatch custom event so sub-component modals can intercept first if needed
          const customBackEvent = new CustomEvent('salah_android_back', { cancelable: true });
          const wasIntercepted = !window.dispatchEvent(customBackEvent);

          if (wasIntercepted) {
            return;
          }

          // 2. Check top-level overlays/modals in priority order
          for (const overlay of overlays) {
            if (overlay.isOpen) {
              overlay.close();
              return;
            }
          }

          // 3. Tab navigation history stack
          const history = tabHistoryRef.current;
          if (history.length > 1) {
            history.pop(); // Remove current tab
            const previousTab = history[history.length - 1] || 'home';
            isBackNavigationRef.current = true;
            setActiveTab(previousTab);
            return;
          } else if (activeTab !== 'home') {
            isBackNavigationRef.current = true;
            setActiveTab('home');
            return;
          }

          // 4. Already on home tab with no overlays open -> Require 2-press confirmation to exit
          const now = Date.now();
          if (now - lastBackPressTimeRef.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPressTimeRef.current = now;
            if (setToastMessage) {
              setToastMessage('اضغط رجوع مرة أخرى للخروج');
            } else {
              alert('اضغط رجوع مرة أخرى للخروج');
            }
          }
        });
      } catch (err) {
        // Native backButton listener not supported in web browser preview - ignored
      }
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [activeTab, overlays, setActiveTab, setToastMessage]);
}
