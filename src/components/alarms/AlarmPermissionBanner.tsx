/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AlarmPermissionBannerProps {
  permission: NotificationPermission;
  onRequestPermission: () => void;
}

export const AlarmPermissionBanner: React.FC<AlarmPermissionBannerProps> = ({
  permission,
  onRequestPermission,
}) => {
  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/40 text-amber-900 dark:text-amber-300">
      <div className="flex items-center gap-2.5 text-xs font-bold">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>لتلقي التنبيهات في الخلفية وعند قفل الشاشة، يُنصح بتفعيل إذن الإشعارات.</span>
      </div>
      <button
        type="button"
        onClick={onRequestPermission}
        className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors cursor-pointer"
      >
        تفعيل الإذن
      </button>
    </div>
  );
};

export default AlarmPermissionBanner;
