import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface TimeInput24Props {
  value: string; // e.g. "07:00:00" or "16:00" or "16:00:00" or "-"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  includeSeconds?: boolean; // if true, emits "HH:mm:00", else "HH:mm"
  compact?: boolean;
}

export const TimeInput24: React.FC<TimeInput24Props> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = '00:00',
  title = 'Format 24 Jam (00:00 - 24:00)',
  includeSeconds = true,
  compact = false,
}) => {
  // Normalize value to "HH:mm"
  const getNormalizedTime = (val: string) => {
    if (!val || val === '-') return '';
    const parts = val.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return val;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [textVal, setTextVal] = useState(getNormalizedTime(value));
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setTextVal(getNormalizedTime(value));
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentHH = textVal ? parseInt(textVal.split(':')[0] || '0', 10) : 7;
  const currentMM = textVal ? parseInt(textVal.split(':')[1] || '0', 10) : 0;

  const emitChange = (formattedHHMM: string) => {
    setTextVal(formattedHHMM);
    if (includeSeconds) {
      onChange(`${formattedHHMM}:00`);
    } else {
      onChange(formattedHHMM);
    }
  };

  // Handle manual typing in 24-hour format
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^0-9:]/g, '');
    
    // Auto-insert colon if user types 4 digits e.g. "1600" -> "16:00"
    if (input.length === 4 && !input.includes(':')) {
      input = `${input.slice(0, 2)}:${input.slice(2, 4)}`;
    }

    if (input.length > 5) {
      input = input.slice(0, 5);
    }

    setTextVal(input);

    // Validate if complete "HH:mm"
    if (input.length === 5 && input.includes(':')) {
      const [hStr, mStr] = input.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);

      if (isNaN(h) || h < 0) h = 0;
      if (h > 24) h = 24;
      if (isNaN(m) || m < 0) m = 0;
      if (h === 24) m = 0; // 24:00 is midnight
      else if (m > 59) m = 59;

      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      emitChange(formatted);
    }
  };

  const handleBlur = () => {
    if (!textVal) return;
    const parts = textVal.split(':');
    let h = parseInt(parts[0] || '0', 10);
    let m = parseInt(parts[1] || '0', 10);

    if (isNaN(h)) h = 0;
    if (h > 24) h = 24;
    if (isNaN(m)) m = 0;
    if (h === 24) m = 0;
    else if (m > 59) m = 59;

    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    emitChange(formatted);
  };

  const selectHour = (hour: number) => {
    const safeH = Math.max(0, Math.min(24, hour));
    const safeM = safeH === 24 ? 0 : currentMM;
    const formatted = `${String(safeH).padStart(2, '0')}:${String(safeM).padStart(2, '0')}`;
    emitChange(formatted);
  };

  const selectMinute = (minute: number) => {
    const safeH = currentHH === 24 ? 23 : currentHH;
    const safeM = Math.max(0, Math.min(59, minute));
    const formatted = `${String(safeH).padStart(2, '0')}:${String(safeM).padStart(2, '0')}`;
    emitChange(formatted);
  };

  const quickPresets = [
    { label: '06:45', time: '06:45', desc: 'Pagi' },
    { label: '07:00', time: '07:00', desc: 'Masuk' },
    { label: '07:15', time: '07:15', desc: 'Toleransi' },
    { label: '07:30', time: '07:30', desc: 'Terlambat' },
    { label: '14:00', time: '14:00', desc: 'Siang' },
    { label: '15:30', time: '15:30', desc: 'Sore' },
    { label: '16:00', time: '16:00', desc: 'Pulang' },
    { label: '16:30', time: '16:30', desc: 'Pulang 2' },
    { label: '18:00', time: '18:00', desc: 'Lembur 1' },
    { label: '19:00', time: '19:00', desc: 'Lembur 2' },
    { label: '21:00', time: '21:00', desc: 'Malam' },
    { label: '24:00', time: '24:00', desc: '24:00 (Malam)' },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block ${compact ? 'w-24' : 'w-full'}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={textVal}
          disabled={disabled}
          placeholder={placeholder}
          title={title}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onClick={() => !disabled && setIsOpen(true)}
          className={`font-mono text-center font-bold tracking-wider ${
            compact
              ? 'w-24 px-2 py-1 text-xs border rounded-lg border-slate-300 bg-white text-slate-800 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden shadow-xs cursor-pointer'
              : 'w-full p-2 text-sm border rounded-lg border-slate-300 bg-white text-slate-800 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden shadow-xs'
          } ${className}`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-1.5 p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
          title="Buka Pilihan Jam 24:00"
        >
          <Clock className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>
      </div>

      {/* 24-Hour Picker Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 text-slate-800 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Format 24 Jam (00:00 - 24:00)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Selected Big Preview */}
          <div className="bg-slate-900 text-white rounded-lg p-2 text-center mb-3 flex items-center justify-between px-4">
            <span className="text-[11px] text-slate-400 font-medium">Nilai Jam:</span>
            <span className="text-lg font-bold font-mono text-amber-400 tracking-wider">
              {textVal || '00:00'}
            </span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-400/30">
              24-JAM
            </span>
          </div>

          {/* Quick Preset Chips */}
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
              Pilihan Jam Cepat
            </div>
            <div className="grid grid-cols-4 gap-1">
              {quickPresets.map((preset) => {
                const isSelected = textVal === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => {
                      emitChange(preset.time);
                      setIsOpen(false);
                    }}
                    className={`px-1.5 py-1 text-xs font-mono rounded-md font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={`text-[9px] font-sans font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hour & Minute Selectors */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {/* Jam (00 - 24) */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Jam (00 - 24)
              </label>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-1 space-y-0.5 bg-slate-50/50">
                {Array.from({ length: 25 }, (_, i) => i).map((hour) => {
                  const isSelected = currentHH === hour;
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => selectHour(hour)}
                      className={`w-full text-left px-2 py-0.5 text-xs font-mono rounded flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-indigo-50 text-slate-700'
                      }`}
                    >
                      <span>{String(hour).padStart(2, '0')}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menit (00 - 59) */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Menit (00 - 59)
              </label>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-1 space-y-0.5 bg-slate-50/50">
                {Array.from({ length: 60 }, (_, i) => i).map((minute) => {
                  const isSelected = currentMM === minute;
                  return (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => selectMinute(minute)}
                      className={`w-full text-left px-2 py-0.5 text-xs font-mono rounded flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-indigo-50 text-slate-700'
                      }`}
                    >
                      <span>{String(minute).padStart(2, '0')}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer action */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const h = String(now.getHours()).padStart(2, '0');
                const m = String(now.getMinutes()).padStart(2, '0');
                emitChange(`${h}:${m}`);
              }}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Set Jam Sekarang
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
