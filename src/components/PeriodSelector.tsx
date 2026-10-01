import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Check, 
  ChevronDown, 
  Sparkles,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { getPayrollCutoffDates } from '../utils/security';

interface PeriodSelectorProps {
  selectedBulan: number;
  selectedTahun: number;
  onSelectPeriod: (bulan: number, tahun: number) => void;
  availablePeriods?: { bulan: number; tahun: number; count: number; status?: string }[];
  compact?: boolean;
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedBulan,
  selectedTahun,
  onSelectPeriod,
  availablePeriods = [],
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempYear, setTempYear] = useState(selectedTahun);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync tempYear when selectedTahun changes
  useEffect(() => {
    setTempYear(selectedTahun);
  }, [selectedTahun]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentCutoff = getPayrollCutoffDates(selectedBulan, selectedTahun);
  const selectedMonthName = MONTH_NAMES_ID[selectedBulan - 1];

  const handleSelectMonth = (bulan: number) => {
    onSelectPeriod(bulan, tempYear);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newBulan = selectedBulan - 1;
    let newTahun = selectedTahun;
    if (newBulan < 1) {
      newBulan = 12;
      newTahun -= 1;
    }
    onSelectPeriod(newBulan, newTahun);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newBulan = selectedBulan + 1;
    let newTahun = selectedTahun;
    if (newBulan > 12) {
      newBulan = 1;
      newTahun += 1;
    }
    onSelectPeriod(newBulan, newTahun);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button / Pill */}
      <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-indigo-300 transition overflow-hidden">
        {/* Quick Prev Button */}
        {!compact && (
          <button
            onClick={handlePrevMonth}
            className="px-2 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border-r border-slate-200 transition cursor-pointer"
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Main Selector Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'} font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Periode: <strong className="text-slate-900 font-semibold">{selectedMonthName} {selectedTahun}</strong>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </button>

        {/* Quick Next Button */}
        {!compact && (
          <button
            onClick={handleNextMonth}
            className="px-2 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border-l border-slate-200 transition cursor-pointer"
            title="Bulan Berikutnya"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Dropdown Picker */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header & Year Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                Pilih Periode Penggajian
              </h3>
              <p className="text-[11px] text-slate-500">
                Tahun Ajaran 2026/2027 SMK IT Ibnul Qayyim
              </p>
            </div>

            {/* Year navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setTempYear(prev => prev - 1)}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Tahun Lalu"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-indigo-900 px-2 font-mono">
                {tempYear}
              </span>
              <button
                onClick={() => setTempYear(prev => prev + 1)}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Tahun Depan"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pilihan Cepat
              </p>
              {(() => {
                const now = new Date();
                const curM = now.getMonth() + 1;
                const curY = now.getFullYear();
                const isAlreadyCurrent = selectedBulan === curM && selectedTahun === curY;
                if (isAlreadyCurrent) return null;
                return (
                  <button
                    onClick={() => { onSelectPeriod(curM, curY); setIsOpen(false); }}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Bulan Sekarang ({MONTH_NAMES_SHORT[curM - 1]} {curY})
                  </button>
                );
              })()}
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(() => {
                const now = new Date();
                const curM = now.getMonth() + 1;
                const curY = now.getFullYear();
                
                // Prev month
                let prevM = curM - 1;
                let prevY = curY;
                if (prevM < 1) { prevM = 12; prevY -= 1; }

                // Next month
                let nextM = curM + 1;
                let nextY = curY;
                if (nextM > 12) { nextM = 1; nextY += 1; }

                const shortcuts = [
                  { bulan: prevM, tahun: prevY, label: `${MONTH_NAMES_SHORT[prevM - 1]} ${prevY}`, isCur: false },
                  { bulan: curM, tahun: curY, label: `${MONTH_NAMES_SHORT[curM - 1]} ${curY} (Sekarang)`, isCur: true },
                  { bulan: nextM, tahun: nextY, label: `${MONTH_NAMES_SHORT[nextM - 1]} ${nextY}`, isCur: false },
                ];

                return shortcuts.map((s, i) => {
                  const isActive = selectedBulan === s.bulan && selectedTahun === s.tahun;
                  return (
                    <button
                      key={i}
                      onClick={() => { onSelectPeriod(s.bulan, s.tahun); setIsOpen(false); }}
                      className={`px-2 py-1.5 rounded-lg border text-left transition cursor-pointer truncate ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold ring-1 ring-indigo-400'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* 12 Month Grid */}
          <div className="py-2 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Bulan ({tempYear})
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_NAMES_SHORT.map((name, idx) => {
                const monthNum = idx + 1;
                const isSelected = selectedBulan === monthNum && selectedTahun === tempYear;
                const now = new Date();
                const isCurrentMonth = monthNum === (now.getMonth() + 1) && tempYear === now.getFullYear();
                const periodMeta = availablePeriods.find(p => p.bulan === monthNum && p.tahun === tempYear);

                return (
                  <button
                    key={monthNum}
                    onClick={() => handleSelectMonth(monthNum)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium transition cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-1'
                        : isCurrentMonth
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    <span>{name}</span>
                    {periodMeta && periodMeta.count > 0 && (
                      <span className={`text-[9px] mt-0.5 px-1 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {periodMeta.count} data
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Card: Cut-Off & Payment Date for Selected Month */}
          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-2xl text-[11px] text-slate-600">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-slate-500">Rentang Cut-Off Presensi:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {currentCutoff.cutoffLabelShort}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-500">Jadwal Transfer Gaji:</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {currentCutoff.paymentLabel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
