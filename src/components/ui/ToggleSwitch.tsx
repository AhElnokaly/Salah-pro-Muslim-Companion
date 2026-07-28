import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeColor?: string; // e.g. 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600'
  size?: 'md' | 'sm';
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  activeColor = 'bg-indigo-600',
  size = 'md',
  disabled = false,
  id,
  ariaLabel
}: ToggleSwitchProps) {
  const isSm = size === 'sm';

  const containerClasses = isSm ? 'w-9 h-5' : 'w-11 h-6';
  const knobClasses = isSm ? 'w-4 h-4' : 'w-5 h-5';
  const translatePos = isSm
    ? (checked ? 'translate-x-[18px]' : 'translate-x-[2px]')
    : (checked ? 'translate-x-[22px]' : 'translate-x-[2px]');

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      dir="ltr"
      className={`relative inline-flex items-center shrink-0 ${containerClasses} rounded-full transition-colors duration-200 ease-in-out cursor-pointer select-none ${
        checked ? activeColor : 'bg-slate-300 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-indigo-500/40'}`}
    >
      <span
        className={`inline-block ${knobClasses} bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${translatePos}`}
      />
    </button>
  );
}

export default ToggleSwitch;
