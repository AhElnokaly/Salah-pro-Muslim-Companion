import React from 'react';
import { 
  PendingQadaPrayer, 
  RamadanQadaTracker, 
  DashboardTab 
} from '../types';
import { generateSpiritualNotifications } from '../utils/spiritualNotifications';

interface UseDashboardSpiritualNotificationsProps {
  now: Date;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  ramadanQada?: RamadanQadaTracker;
  setRamadanQada?: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  toArabicNumbers: (n: number | string) => string;
  setActiveTab?: (tab: DashboardTab) => void;
}

export function useDashboardSpiritualNotifications({
  now,
  hijri,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  ramadanQada,
  setRamadanQada,
  setFastingLogs,
  toArabicNumbers,
  setActiveTab,
}: UseDashboardSpiritualNotificationsProps) {
  const [showNotificationsModal, setShowNotificationsModal] = React.useState<boolean>(false);

  // Handle global header notifications modal trigger
  React.useEffect(() => {
    const handleNotificationsTrigger = () => {
      setShowNotificationsModal(true);
    };
    window.addEventListener('open-spiritual-notifications', handleNotificationsTrigger);
    return () => {
      window.removeEventListener('open-spiritual-notifications', handleNotificationsTrigger);
    };
  }, []);

  // Dispatch spiritual notifications count to header
  const spiritualNotifications = React.useMemo(() => {
    return generateSpiritualNotifications({
      now,
      hijri,
      pendingQadaPrayers,
      setPendingQadaPrayers,
      ramadanQada,
      setRamadanQada,
      setFastingLogs,
      toArabicNumbers,
      setActiveTab
    });
  }, [
    now, 
    hijri, 
    pendingQadaPrayers, 
    ramadanQada?.daysOwed, 
    ramadanQada?.daysCompleted, 
    setFastingLogs, 
    setPendingQadaPrayers, 
    setRamadanQada, 
    toArabicNumbers, 
    setActiveTab
  ]);

  React.useEffect(() => {
    const count = spiritualNotifications.length;
    const event = new CustomEvent('update-spiritual-notifications-count', { detail: count });
    window.dispatchEvent(event);
  }, [spiritualNotifications.length]);

  return {
    spiritualNotifications,
    showNotificationsModal,
    setShowNotificationsModal,
  };
}
