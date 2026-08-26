import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { DASHBOARD_SECTION_REGISTRY, getDashboardSectionsConfig, saveDashboardSectionsConfig, DashboardSectionId } from '../dashboard/dashboardSections';
import ToggleSwitch from '../ui/ToggleSwitch';

export default function DashboardSectionsTab() {
  const [dashboardSections, setDashboardSections] = useState<Record<DashboardSectionId, boolean>>(() => getDashboardSectionsConfig());

  const handleToggleDashboardSection = (id: DashboardSectionId) => {
    setDashboardSections(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      saveDashboardSectionsConfig(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white">تخصيص شاشة الرئيسية (الداشبورد)</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">اختر الأقسام والبطاقات المعروضة في الصفحة الرئيسية لتناسب احتياجك اليومي</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="space-y-3">
          {(Object.keys(DASHBOARD_SECTION_REGISTRY) as DashboardSectionId[]).map((secId) => {
            const sec = DASHBOARD_SECTION_REGISTRY[secId];
            const isEnabled = sec.alwaysVisible ? true : (dashboardSections[secId] ?? sec.defaultEnabled);

            return (
              <div
                key={secId}
                className="p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 text-end flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{sec.label}</span>
                    {sec.alwaysVisible && (
                      <span className="text-[9.5px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        أساسي (بارز دائمًا)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{sec.description}</p>
                </div>

                {!sec.alwaysVisible ? (
                  <ToggleSwitch
                    checked={isEnabled}
                    onChange={() => handleToggleDashboardSection(secId)}
                  />
                ) : (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">مفعّل ✓</span>
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-extrabold text-center pt-2 border-t border-slate-100 dark:border-slate-800/40">
          💡 الأقسام غير المفعّلة لا يتم تحميلها لتوفير السرعة والأداء.
        </p>
      </div>
    </div>
  );
}
