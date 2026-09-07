/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Bell, 
  Trash2, 
  Check
} from 'lucide-react';
import type { 
  AlarmConfig, 
  AlarmSoundType, 
  AlarmNotifyMode, 
  AlarmTimingType, 
  PrayerAlarmRelation, 
  RelativePrayerTarget 
} from '../../types';
import { FIVE_PRAYERS_ONLY } from '../../utils/alarmUtils';
import { playSpiritualSound } from '../../utils/spiritualAudio';
import { PRESET_NAMES } from './alarmModalConstants';
import { AlarmTimingSection } from './AlarmTimingSection';
import { AlarmSoundAndDaysSection } from './AlarmSoundAndDaysSection';

interface AlarmEditModalProps {
  isOpen: boolean;
  alarm: AlarmConfig | null;
  onClose: () => void;
  onSave: (alarm: AlarmConfig) => void;
  onDelete?: (id: string) => void;
  audioVolume: number;
}

export default function AlarmEditModal({
  isOpen,
  alarm,
  onClose,
  onSave,
  onDelete,
  audioVolume
}: AlarmEditModalProps) {
  const isEditing = Boolean(alarm);

  // Form State
  const [title, setTitle] = useState('');
  const [timingType, setTimingType] = useState<AlarmTimingType>('prayer_relative');
  const [prayers, setPrayers] = useState<RelativePrayerTarget[]>(FIVE_PRAYERS_ONLY);
  const [relation, setRelation] = useState<PrayerAlarmRelation>('before');
  const [offsetMinutes, setOffsetMinutes] = useState<number>(10);
  const [timeStr, setTimeStr] = useState<string>('05:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [soundType, setSoundType] = useState<AlarmSoundType>('takbeer');
  const [notifyMode, setNotifyMode] = useState<AlarmNotifyMode>('both');

  // In-modal delete confirmation state (avoids window.confirm browser blocks)
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  // Test sound state
  const [testPlaying, setTestPlaying] = useState<boolean>(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reset/populate form when modal opens or alarm changes
  useEffect(() => {
    if (alarm) {
      setTitle(alarm.title || '');
      setTimingType(alarm.type || (alarm.time ? 'fixed' : 'prayer_relative'));
      setPrayers(alarm.prayers && alarm.prayers.length > 0 ? alarm.prayers : FIVE_PRAYERS_ONLY);
      setRelation(alarm.relation || 'before');
      setOffsetMinutes(alarm.offsetMinutes ?? 10);
      setTimeStr(alarm.time || '05:00');
      setDays(alarm.days || [0, 1, 2, 3, 4, 5, 6]);
      setSoundType(alarm.soundType || 'takbeer');
      setNotifyMode(alarm.notifyMode || 'both');
    } else {
      setTitle('');
      setTimingType('prayer_relative');
      setPrayers(FIVE_PRAYERS_ONLY);
      setRelation('before');
      setOffsetMinutes(10);
      setTimeStr('05:00');
      setDays([0, 1, 2, 3, 4, 5, 6]);
      setSoundType('takbeer');
      setNotifyMode('both');
    }
    setConfirmDelete(false);
  }, [alarm, isOpen]);

  // Clean audio on close
  useEffect(() => {
    if (!isOpen && testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
      setTestPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSound = () => {
    if (testPlaying && testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
      setTestPlaying(false);
      return;
    }

    setTestPlaying(true);
    playSpiritualSound(
      soundType,
      title || 'تنبيه العبادة',
      audioVolume,
      testAudioRef,
      notifyMode
    );

    if (testAudioRef.current) {
      testAudioRef.current.onended = () => setTestPlaying(false);
    } else {
      setTimeout(() => setTestPlaying(false), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || (
      timingType === 'prayer_relative' 
        ? `تنبيه ${relation === 'before' ? 'قبل' : relation === 'after' ? 'بعد' : 'موعد'} الصلاة`
        : 'منبه مخصص'
    );

    const updatedAlarm: AlarmConfig = {
      id: alarm ? alarm.id : `custom_alarm_${Date.now()}`,
      title: finalTitle,
      enabled: alarm ? alarm.enabled : true,
      type: timingType,
      days,
      soundType,
      notifyMode,
      ...(timingType === 'prayer_relative' 
        ? {
            prayers,
            relation,
            offsetMinutes: relation === 'at' ? 0 : offsetMinutes,
            offsetUnit: 'minutes' as const
          }
        : {
            time: timeStr
          }
      )
    };

    onSave(updatedAlarm);
    onClose();
  };

  const executeDelete = () => {
    if (alarm && onDelete) {
      onDelete(alarm.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        id="alarm-edit-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-xl bg-white dark:bg-[#131a24] rounded-t-[28px] sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-200"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#161f2a]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-850 dark:text-slate-100">
                {isEditing ? 'تعديل المنبه' : 'إضافة تنبيه جديد'}
              </h2>
              <p className="text-[11px] font-bold text-slate-400">
                خصص موعد المنبه واربطه بالصلوات أو بوقت محدد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form 
          id="alarm-edit-form" 
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain"
        >
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              اسم المنبه / الغرض:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تنبيه قبل الصلاة، صلاة الضحى، قيام الليل..."
              className="w-full bg-slate-50 dark:bg-[#1a232e] border border-slate-200 dark:border-slate-750 rounded-2xl py-2.5 px-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {/* Quick preset chips - clean horizontal scroll */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {PRESET_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTitle(name)}
                  className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Timing Section (Segmented control + Relative or Fixed UI) */}
          <AlarmTimingSection
            timingType={timingType}
            setTimingType={setTimingType}
            prayers={prayers}
            setPrayers={setPrayers}
            relation={relation}
            setRelation={setRelation}
            offsetMinutes={offsetMinutes}
            setOffsetMinutes={setOffsetMinutes}
            timeStr={timeStr}
            setTimeStr={setTimeStr}
          />

          {/* Days Repetition & Sound Melody Section */}
          <AlarmSoundAndDaysSection
            days={days}
            setDays={setDays}
            soundType={soundType}
            setSoundType={setSoundType}
            testPlaying={testPlaying}
            onTestSound={handleTestSound}
          />
        </form>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-[#161f2a]/90 backdrop-blur-xs flex items-center justify-between gap-2">
          {/* Delete Action (with inline confirmation to bypass browser confirm blocks) */}
          <div>
            {isEditing && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-black text-rose-700 dark:text-rose-300 px-1.5">
                    تأكيد؟
                  </span>
                  <button
                    type="button"
                    onClick={executeDelete}
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                  >
                    نعم، احذف
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف المنبه</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="alarm-edit-form"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التنبيه</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
