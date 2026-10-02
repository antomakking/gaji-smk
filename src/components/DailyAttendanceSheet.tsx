import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Search, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  Coffee, 
  Briefcase, 
  BookOpen, 
  Building2,
  CalendarCheck2,
  Filter
} from 'lucide-react';
import { 
  Pegawai, 
  LogPresensiHarian, 
  StatusKehadiranHarian, 
  MetodePresensi 
} from '../types';
import { formatRupiah, getPayrollCutoffDates, getTodayDateString } from '../utils/security';
import { TimeInput24 } from './TimeInput24';

export interface DailyAttendanceRow {
  pegawaiId: string;
  status: StatusKehadiranHarian;
  jamMasuk: string;
  jamKeluar: string;
  menitTerlambat: number;
  jamMengajarHariIni: number;
  jamLembur: number;
  metode: MetodePresensi;
  keterangan: string;
  isSavedInDb?: boolean;
  isApproved?: boolean;
}

interface DailyAttendanceSheetProps {
  pegawaiList: Pegawai[];
  dailyLogs: LogPresensiHarian[];
  onBatchSaveDailyLogs?: (logs: LogPresensiHarian[], dateLabel: string) => void;
  onAddDailyLog: (log: LogPresensiHarian) => void;
  onRefreshAndRecalculate: () => void;
  selectedBulan?: number;
  selectedTahun?: number;
}

export const DailyAttendanceSheet: React.FC<DailyAttendanceSheetProps> = ({
  pegawaiList,
  dailyLogs,
  onBatchSaveDailyLogs,
  onAddDailyLog,
  onRefreshAndRecalculate,
  selectedBulan = (new Date().getMonth() + 1),
  selectedTahun = (new Date().getFullYear()),
}) => {
  // Selected Date State - default directly to today's date
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'tendik'>('all');
  const [rows, setRows] = useState<Record<string, DailyAttendanceRow>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync date if period changes from outside selector
  useEffect(() => {
    const formattedMonth = String(selectedBulan).padStart(2, '0');
    const todayStr = getTodayDateString();
    // If today is within the selected period, keep/use today
    if (todayStr.startsWith(`${selectedTahun}-${formattedMonth}`)) {
      setSelectedDate(todayStr);
    } else if (!selectedDate.startsWith(`${selectedTahun}-${formattedMonth}`)) {
      setSelectedDate(`${selectedTahun}-${formattedMonth}-01`);
    }
  }, [selectedBulan, selectedTahun]);

  // Initialize rows when selectedDate or pegawaiList change (default: Belum, or Hari Libur on Sunday)
  useEffect(() => {
    const isSunday = new Date(selectedDate + 'T00:00:00').getDay() === 0;
    const newRows: Record<string, DailyAttendanceRow> = {};
    let shouldAutoSaveSunday = false;

    pegawaiList.forEach((peg) => {
      const isGuru = peg.statusPegawai === 'GTY' || peg.statusPegawai === 'GTT';
      const existingLog = dailyLogs.find(
        (l) => l.pegawaiId === peg.id && l.tanggal === selectedDate
      );

      if (existingLog) {
        // If Sunday and the existing log is an unverified default 'hadir_tepat_waktu', automatically correct to libur_sekolah
        if (isSunday && !existingLog.isVerified && existingLog.status === 'hadir_tepat_waktu') {
          newRows[peg.id] = {
            pegawaiId: peg.id,
            status: 'libur_sekolah',
            jamMasuk: '-',
            jamKeluar: '-',
            menitTerlambat: 0,
            jamMengajarHariIni: 0,
            jamLembur: existingLog.jamLembur || 0,
            metode: existingLog.metode || 'manual_admin',
            keterangan: existingLog.keterangan || 'Hari Libur (Ahad / Minggu)',
            isSavedInDb: true,
            isApproved: false,
          };
          shouldAutoSaveSunday = true;
        } else {
          newRows[peg.id] = {
            pegawaiId: peg.id,
            status: existingLog.status,
            jamMasuk: existingLog.jamMasuk || (isSunday ? '-' : '07:00:00'),
            jamKeluar: existingLog.jamKeluar || (isSunday ? '-' : '16:00:00'),
            menitTerlambat: existingLog.menitTerlambat || 0,
            jamMengajarHariIni: existingLog.jamMengajarHariIni ?? (isSunday ? 0 : (isGuru ? 4 : 0)),
            jamLembur: existingLog.jamLembur || 0,
            metode: existingLog.metode || 'manual_admin',
            keterangan: existingLog.keterangan || (isSunday && existingLog.status === 'libur_sekolah' ? 'Hari Libur (Ahad / Minggu)' : ''),
            isSavedInDb: true,
            isApproved: existingLog.isVerified === true, // Restore verification state from log if present
          };
        }
      } else {
        if (isSunday) {
          // Hari Minggu -> Otomatis set Hari Libur / Non-Efektif
          newRows[peg.id] = {
            pegawaiId: peg.id,
            status: 'libur_sekolah',
            jamMasuk: '-',
            jamKeluar: '-',
            menitTerlambat: 0,
            jamMengajarHariIni: 0,
            jamLembur: 0,
            metode: 'manual_admin',
            keterangan: 'Hari Libur (Ahad / Minggu)',
            isSavedInDb: true,
            isApproved: false,
          };
          shouldAutoSaveSunday = true;
        } else {
          // Default standard active working day for school
          newRows[peg.id] = {
            pegawaiId: peg.id,
            status: 'hadir_tepat_waktu',
            jamMasuk: '07:00:00',
            jamKeluar: '16:00:00',
            menitTerlambat: 0,
            jamMengajarHariIni: isGuru ? 4 : 0,
            jamLembur: 0,
            metode: 'manual_admin',
            keterangan: '',
            isSavedInDb: false,
            isApproved: false, // Default adalah Belum saat form dibuka
          };
        }
      }
    });

    setRows(newRows);

    // Auto-save Sunday holiday records immediately
    if (shouldAutoSaveSunday && onBatchSaveDailyLogs) {
      const sundayLogs: LogPresensiHarian[] = (Object.values(newRows) as DailyAttendanceRow[]).map((r) => ({
        id: `log-${selectedDate}-${r.pegawaiId}`,
        pegawaiId: r.pegawaiId,
        tanggal: selectedDate,
        jamMasuk: r.jamMasuk,
        jamKeluar: r.jamKeluar,
        status: r.status,
        menitTerlambat: 0,
        menitPulangCepat: 0,
        jamLembur: Number(r.jamLembur) || 0,
        jamMengajarHariIni: 0,
        metode: r.metode || 'manual_admin',
        lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
        keterangan: r.keterangan || 'Hari Libur (Ahad / Minggu)',
        isVerified: r.isApproved === true,
      }));
      onBatchSaveDailyLogs(sundayLogs, dateFormattedIndo);
    }
  }, [selectedDate, pegawaiList]);

  // Date Formatting in Indonesian (e.g. "Selasa, 25 Agustus 2026")
  const dateFormattedIndo = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Calculate which payroll cycle the selected date belongs to
  const payrollCycleInfo = useMemo(() => {
    try {
      const parts = selectedDate.split('-').map(Number);
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];

      let targetMonth = month;
      let targetYear = year;

      if (day >= 23) {
        // Belongs to next month's payroll cutoff
        targetMonth = month + 1;
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear = year + 1;
        }
      }

      const cutoff = getPayrollCutoffDates(targetMonth, targetYear);
      return {
        ...cutoff,
        targetMonth,
        targetYear,
        isCurrentActivePeriod: targetMonth === 8 && targetYear === 2026,
      };
    } catch {
      return null;
    }
  }, [selectedDate]);

  // Navigate date by offset days
  const handleDateOffset = (days: number) => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + days);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
      setSaveSuccessMessage(null);
    } catch {
      // fallback
    }
  };

  // Update a single employee's row and auto-save immediately
  const updateRow = (pegawaiId: string, updates: Partial<DailyAttendanceRow>) => {
    const current = rows[pegawaiId];
    if (!current) return;

    const nextRow = { ...current, ...updates, isSavedInDb: true };

    // If jamMasuk is updated, calculate late minutes automatically
    if (updates.jamMasuk !== undefined) {
      const cleanTime = updates.jamMasuk.trim();
      if (cleanTime !== '-' && cleanTime.includes(':')) {
        const [inH, inM] = cleanTime.split(':').map(Number);
        const standardMinutes = 7 * 60; // 07:00 WITA standard school morning assembly
        const currentMinutes = (inH || 0) * 60 + (inM || 0);
        const late = Math.max(0, currentMinutes - standardMinutes);
        nextRow.menitTerlambat = late;
        if (nextRow.status !== 'izin_terlambat') {
          if (late > 0 && nextRow.status === 'hadir_tepat_waktu') {
            nextRow.status = 'terlambat';
          } else if (late === 0 && nextRow.status === 'terlambat') {
            nextRow.status = 'hadir_tepat_waktu';
          }
        }
      }
    }

    // If status changed to absent/leave/sickness/off day/permitted late/duty/training, adjust hours
    if (updates.status) {
      if (updates.status === 'bukan_hari_kerja') {
        nextRow.jamMasuk = '-';
        nextRow.jamKeluar = '-';
        nextRow.menitTerlambat = 0;
        nextRow.jamMengajarHariIni = 0;
        nextRow.jamLembur = 0;
        if (!nextRow.keterangan) {
          nextRow.keterangan = 'Bukan Hari Kerja (Off / Bebas Tugas)';
        }
      } else if (updates.status === 'izin_terlambat') {
        // Izin terlambat: tetap hadir bekerja, dapat memiliki jam masuk terlambat, bebas denda/tanpa potongan gaji
        if (current.jamMasuk === '-' || !current.jamMasuk) {
          nextRow.jamMasuk = '07:30:00';
          nextRow.jamKeluar = '16:00:00';
          const peg = pegawaiList.find((p) => p.id === pegawaiId);
          const isGuru = peg?.statusPegawai === 'GTY' || peg?.statusPegawai === 'GTT';
          nextRow.jamMengajarHariIni = isGuru ? 4 : 0;
        }
        if (!nextRow.keterangan) {
          nextRow.keterangan = 'Izin Terlambat (Dispensasi - Bebas Potongan)';
        }
      } else if (updates.status === 'dinas_luar') {
        if (!nextRow.keterangan) {
          nextRow.keterangan = 'Dinas Luar (Tugas Sekolah / Instansi)';
        }
      } else if (updates.status === 'pelatihan') {
        if (!nextRow.keterangan) {
          nextRow.keterangan = 'Pelatihan / Diklat / Bimtek';
        }
      } else if (['sakit_skd', 'sakit_tanpa_skd', 'izin_resmi', 'izin_pribadi', 'cuti_tahunan', 'cuti_khusus', 'libur_sekolah', 'alpha'].includes(updates.status)) {
        nextRow.jamMasuk = '-';
        nextRow.jamKeluar = '-';
        nextRow.menitTerlambat = 0;
        nextRow.jamMengajarHariIni = 0;
        nextRow.jamLembur = 0;
      } else if (updates.status === 'hadir_tepat_waktu' && (current.jamMasuk === '-' || !current.jamMasuk)) {
        nextRow.jamMasuk = '07:00:00';
        nextRow.jamKeluar = '16:00:00';
        const peg = pegawaiList.find((p) => p.id === pegawaiId);
        const isGuru = peg?.statusPegawai === 'GTY' || peg?.statusPegawai === 'GTT';
        nextRow.jamMengajarHariIni = isGuru ? 4 : 0;
      }
    }

    if (updates.isApproved !== undefined) {
      nextRow.isSavedInDb = true;
      const peg = pegawaiList.find((p) => p.id === pegawaiId);
      const displayName = peg?.nama ? peg.nama.split(',')[0] : 'Pegawai';
      if (updates.isApproved === true) {
        setSaveSuccessMessage(`Presensi ${displayName} diset Sesuai & tersimpan otomatis.`);
      } else {
        setSaveSuccessMessage(`Presensi ${displayName} diset Belum & tersimpan otomatis.`);
      }
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 2500);
    }

    const updatedAllRows: Record<string, DailyAttendanceRow> = {
      ...rows,
      [pegawaiId]: nextRow,
    };

    setRows(updatedAllRows);

    // Real-time Instant Auto-Save & Recalculate Attendance / Payroll
    const allDayLogs: LogPresensiHarian[] = (Object.values(updatedAllRows) as DailyAttendanceRow[]).map((r) => ({
      id: `log-${selectedDate}-${r.pegawaiId}`,
      pegawaiId: r.pegawaiId,
      tanggal: selectedDate,
      jamMasuk: r.jamMasuk,
      jamKeluar: r.jamKeluar,
      status: r.status,
      menitTerlambat: Number(r.menitTerlambat) || 0,
      menitPulangCepat: 0,
      jamLembur: Number(r.jamLembur) || 0,
      jamMengajarHariIni: Number(r.jamMengajarHariIni) || 0,
      metode: r.metode || 'manual_admin',
      lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
      keterangan: r.keterangan || undefined,
      isVerified: r.isApproved === true,
    }));

    if (onBatchSaveDailyLogs) {
      onBatchSaveDailyLogs(allDayLogs, dateFormattedIndo);
    } else if (onAddDailyLog) {
      const singleLog = allDayLogs.find((l) => l.pegawaiId === pegawaiId);
      if (singleLog) onAddDailyLog(singleLog);
    }
  };

  // Bulk Actions
  const handleSetAllApproved = (approved: boolean = true) => {
    const next: Record<string, DailyAttendanceRow> = {};
    Object.keys(rows).forEach((id) => {
      next[id] = {
        ...rows[id],
        isApproved: approved,
        isSavedInDb: true,
      };
    });
    setRows(next);

    // Otomatis simpan ke database dan rekap kehadiran saat diset Sesuai maupun Belum
    const allDayLogs: LogPresensiHarian[] = (Object.values(next) as DailyAttendanceRow[]).map((r) => ({
      id: `log-${selectedDate}-${r.pegawaiId}`,
      pegawaiId: r.pegawaiId,
      tanggal: selectedDate,
      jamMasuk: r.jamMasuk,
      jamKeluar: r.jamKeluar,
      status: r.status,
      menitTerlambat: Number(r.menitTerlambat) || 0,
      menitPulangCepat: 0,
      jamLembur: Number(r.jamLembur) || 0,
      jamMengajarHariIni: Number(r.jamMengajarHariIni) || 0,
      metode: r.metode || 'manual_admin',
      lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
      keterangan: r.keterangan || undefined,
      isVerified: approved,
    }));

    if (onBatchSaveDailyLogs) {
      onBatchSaveDailyLogs(allDayLogs, dateFormattedIndo);
    } else if (onAddDailyLog) {
      allDayLogs.forEach((log) => onAddDailyLog(log));
    }

    setSaveSuccessMessage(`Seluruh presensi (${Object.keys(next).length} pegawai) diset ${approved ? 'Sesuai' : 'Belum'} & tersimpan otomatis.`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3000);
  };

  const handleSetAllPresent = () => {
    const next: Record<string, DailyAttendanceRow> = {};
    Object.keys(rows).forEach((id) => {
      const peg = pegawaiList.find((p) => p.id === id);
      const isGuru = peg?.statusPegawai === 'GTY' || peg?.statusPegawai === 'GTT';
      next[id] = {
        ...rows[id],
        status: 'hadir_tepat_waktu',
        jamMasuk: '07:00:00',
        jamKeluar: '16:00:00',
        menitTerlambat: 0,
        jamMengajarHariIni: isGuru ? 4 : 0,
        isSavedInDb: true,
      };
    });
    setRows(next);

    // Otomatis simpan ke database dan sinkronisasi penggajian
    const allDayLogs: LogPresensiHarian[] = (Object.values(next) as DailyAttendanceRow[]).map((r) => ({
      id: `log-${selectedDate}-${r.pegawaiId}`,
      pegawaiId: r.pegawaiId,
      tanggal: selectedDate,
      jamMasuk: r.jamMasuk,
      jamKeluar: r.jamKeluar,
      status: r.status,
      menitTerlambat: 0,
      menitPulangCepat: 0,
      jamLembur: Number(r.jamLembur) || 0,
      jamMengajarHariIni: Number(r.jamMengajarHariIni) || 0,
      metode: r.metode || 'manual_admin',
      lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
      keterangan: r.keterangan || undefined,
      isVerified: r.isApproved === true,
    }));

    if (onBatchSaveDailyLogs) {
      onBatchSaveDailyLogs(allDayLogs, dateFormattedIndo);
    } else if (onAddDailyLog) {
      allDayLogs.forEach((log) => onAddDailyLog(log));
    }

    setSaveSuccessMessage(`Semua pegawai diset Hadir (07:00 - 16:00) & tersimpan otomatis.`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSetAllLate = (minutes: number) => {
    const next: Record<string, DailyAttendanceRow> = {};
    const lateHour = 7 + Math.floor(minutes / 60);
    const lateMin = minutes % 60;
    const timeStr = `${String(lateHour).padStart(2, '0')}:${String(lateMin).padStart(2, '0')}:00`;

    Object.keys(rows).forEach((id) => {
      const peg = pegawaiList.find((p) => p.id === id);
      const isGuru = peg?.statusPegawai === 'GTY' || peg?.statusPegawai === 'GTT';
      next[id] = {
        ...rows[id],
        status: 'terlambat',
        jamMasuk: timeStr,
        jamKeluar: '16:00:00',
        menitTerlambat: minutes,
        jamMengajarHariIni: isGuru ? 4 : 0,
        isSavedInDb: true,
      };
    });
    setRows(next);

    // Otomatis simpan ke database dan sinkronisasi penggajian
    const allDayLogs: LogPresensiHarian[] = (Object.values(next) as DailyAttendanceRow[]).map((r) => ({
      id: `log-${selectedDate}-${r.pegawaiId}`,
      pegawaiId: r.pegawaiId,
      tanggal: selectedDate,
      jamMasuk: r.jamMasuk,
      jamKeluar: r.jamKeluar,
      status: r.status,
      menitTerlambat: minutes,
      menitPulangCepat: 0,
      jamLembur: Number(r.jamLembur) || 0,
      jamMengajarHariIni: Number(r.jamMengajarHariIni) || 0,
      metode: r.metode || 'manual_admin',
      lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
      keterangan: r.keterangan || undefined,
      isVerified: r.isApproved === true,
    }));

    if (onBatchSaveDailyLogs) {
      onBatchSaveDailyLogs(allDayLogs, dateFormattedIndo);
    } else if (onAddDailyLog) {
      allDayLogs.forEach((log) => onAddDailyLog(log));
    }

    setSaveSuccessMessage(`Semua pegawai diset Terlambat ${minutes} menit & tersimpan otomatis.`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSetHoliday = () => {
    const next: Record<string, DailyAttendanceRow> = {};
    Object.keys(rows).forEach((id) => {
      next[id] = {
        ...rows[id],
        status: 'libur_sekolah',
        jamMasuk: '-',
        jamKeluar: '-',
        menitTerlambat: 0,
        jamMengajarHariIni: 0,
        jamLembur: 0,
        keterangan: 'Hari Libur / Non-Efektif KBM',
        isSavedInDb: true,
      };
    });
    setRows(next);

    // Otomatis simpan ke database dan sinkronisasi penggajian
    const allDayLogs: LogPresensiHarian[] = (Object.values(next) as DailyAttendanceRow[]).map((r) => ({
      id: `log-${selectedDate}-${r.pegawaiId}`,
      pegawaiId: r.pegawaiId,
      tanggal: selectedDate,
      jamMasuk: '-',
      jamKeluar: '-',
      status: 'libur_sekolah',
      menitTerlambat: 0,
      menitPulangCepat: 0,
      jamLembur: 0,
      jamMengajarHariIni: 0,
      metode: r.metode || 'manual_admin',
      lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
      keterangan: 'Hari Libur / Non-Efektif KBM',
      isVerified: r.isApproved === true,
    }));

    if (onBatchSaveDailyLogs) {
      onBatchSaveDailyLogs(allDayLogs, dateFormattedIndo);
    } else if (onAddDailyLog) {
      allDayLogs.forEach((log) => onAddDailyLog(log));
    }

    setSaveSuccessMessage(`Tanggal ${dateFormattedIndo} diset Hari Libur & tersimpan otomatis.`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Save All Rows for the Current Day
  const handleSaveDayAttendance = () => {
    setIsSaving(true);
    const rowList: DailyAttendanceRow[] = Object.values(rows);
    const logsToSave: LogPresensiHarian[] = rowList.map((row, idx) => {
      return {
        id: `log-${selectedDate}-${row.pegawaiId}-${Date.now() + idx}`,
        pegawaiId: row.pegawaiId,
        tanggal: selectedDate,
        jamMasuk: row.jamMasuk,
        jamKeluar: row.jamKeluar,
        status: row.status,
        menitTerlambat: Number(row.menitTerlambat) || 0,
        menitPulangCepat: 0,
        jamLembur: Number(row.jamLembur) || 0,
        jamMengajarHariIni: Number(row.jamMengajarHariIni) || 0,
        metode: row.metode || 'manual_admin',
        lokasiTerminal: 'Form Presensi Manual SMK IT Ibnul Qayyim',
        keterangan: row.keterangan || undefined,
        isVerified: row.isApproved === true,
      };
    });

    if (onBatchSaveDailyLogs) {
      onBatchSaveDailyLogs(logsToSave, dateFormattedIndo);
    } else {
      logsToSave.forEach((l) => onAddDailyLog(l));
      onRefreshAndRecalculate();
    }

    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], isSavedInDb: true };
      });
      return next;
    });

    setSaveSuccessMessage(
      `Presensi harian untuk ${dateFormattedIndo} (${logsToSave.length} Pegawai) berhasil disimpan & disinkronkan ke rekapitulasi gaji!`
    );
    setIsSaving(false);
    setTimeout(() => setSaveSuccessMessage(null), 7000);
  };

  // Filtered List
  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter((peg) => {
      const matchSearch =
        peg.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peg.nip.includes(searchTerm) ||
        peg.jabatanUtama.toLowerCase().includes(searchTerm.toLowerCase());

      const isGuru = peg.statusPegawai === 'GTY' || peg.statusPegawai === 'GTT';
      const matchRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'guru'
          ? isGuru
          : !isGuru;

      return matchSearch && matchRole;
    });
  }, [pegawaiList, searchTerm, roleFilter]);

  // Day Metrics Calculation
  const metrics = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izinTerlambat = 0;
    let sakit = 0;
    let izin = 0;
    let cuti = 0;
    let dinasLuar = 0;
    let pelatihan = 0;
    let alpha = 0;
    let bukanHariKerja = 0;
    let totalJp = 0;
    let totalLembur = 0;
    let totalDendaTerlambat = 0;
    let disetujui = 0;

    const rowList: DailyAttendanceRow[] = Object.values(rows);
    rowList.forEach((r) => {
      if (r.status === 'hadir_tepat_waktu' || r.status === 'terlambat' || r.status === 'izin_terlambat' || r.status === 'dinas_luar' || r.status === 'pelatihan') {
        hadir++;
      }
      if (r.status === 'terlambat') {
        terlambat++;
        // Denda keterlambatan Rp 1.500 per menit (HANYA untuk terlambat tanpa izin/dispensasi)
        totalDendaTerlambat += (r.menitTerlambat || 0) * 1500;
      }
      if (r.status === 'izin_terlambat') {
        izinTerlambat++;
        // Izin terlambat: TIDAK MEMOTONG GAJI (Denda Rp 0)
      }
      if (r.status === 'sakit_skd' || r.status === 'sakit_tanpa_skd') sakit++;
      if (r.status === 'izin_resmi' || r.status === 'izin_pribadi') izin++;
      if (r.status === 'cuti_tahunan' || r.status === 'cuti_khusus') cuti++;
      if (r.status === 'dinas_luar') dinasLuar++;
      if (r.status === 'pelatihan') pelatihan++;
      if (r.status === 'alpha') alpha++;
      if (r.status === 'bukan_hari_kerja' || r.status === 'libur_sekolah') bukanHariKerja++;

      if (r.isApproved === true) {
        disetujui++;
      }

      totalJp += Number(r.jamMengajarHariIni || 0);
      totalLembur += Number(r.jamLembur || 0);
    });

    const targetWajibKerja = Math.max(0, pegawaiList.length - bukanHariKerja);

    return {
      hadir,
      terlambat,
      izinTerlambat,
      sakit,
      izin,
      cuti,
      dinasLuar,
      pelatihan,
      alpha,
      bukanHariKerja,
      targetWajibKerja,
      totalJp,
      totalLembur,
      totalDendaTerlambat,
      disetujui,
    };
  }, [rows, pegawaiList.length]);

  return (
    <div className="space-y-5">
      {/* Date Header & Quick Navigation Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Selector & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleDateOffset(-1)}
                className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer shadow-xs"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>{dateFormattedIndo}</span>
              </div>
              <button
                onClick={() => handleDateOffset(1)}
                className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer shadow-xs"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                id="btn-goto-today"
                onClick={() => {
                  const todayStr = getTodayDateString();
                  setSelectedDate(todayStr);
                  setSaveSuccessMessage(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1 border shadow-2xs ${
                  selectedDate === getTodayDateString()
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={`Pilih Tanggal Hari Ini (${getTodayDateString()})`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari Ini</span>
              </button>

              {new Date(selectedDate + 'T00:00:00').getDay() === 0 && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
                  <Coffee className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hari Libur (Minggu)</span>
                </span>
              )}
            </div>

            {payrollCycleInfo && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950">
                <span className="text-slate-500">Siklus:</span>
                <span className="font-bold">Periode {payrollCycleInfo.periodeLabel}</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono text-emerald-800 font-bold">{payrollCycleInfo.cutoffLabelShort}</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700 font-medium">Bayar: 25 {(payrollCycleInfo.periodeLabel || '').split(' ')[0]}</span>
              </div>
            )}
          </div>

          {/* Quick Cut-Off Date Selection Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium text-[10px] uppercase">Pilih Tanggal:</span>
            {[
              { label: '23 Jul (Awal Cut-Off)', date: '2026-07-23' },
              { label: '01 Agu', date: '2026-08-01' },
              { label: '10 Agu', date: '2026-08-10' },
              { label: '17 Agu (Upacara HUT RI)', date: '2026-08-17' },
              { label: '22 Agu (Akhir Cut-Off)', date: '2026-08-22' },
              { label: '25 Agu (Payroll)', date: '2026-08-25' },
            ].map((chip) => (
              <button
                key={chip.date}
                type="button"
                onClick={() => setSelectedDate(chip.date)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedDate === chip.date
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Auto-Save Status Badge & Sync Action */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Auto-Save Aktif</span>
            </div>

            <button
              onClick={handleSaveDayAttendance}
              disabled={isSaving}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Sinkronisasi manual seluruh baris presensi hari ini ke rekapitulasi penggajian"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Menyimpan...' : 'Sinkronkan Ulang'}</span>
            </button>
          </div>
        </div>

        {/* Quick Batch Presets & Fast Fill Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Aksi Cepat Massal:</span>
            <button
              onClick={handleSetAllPresent}
              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Set Semua Hadir (07:00 - 16:00)</span>
            </button>

            <button
              onClick={() => handleSetAllApproved(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
              title="Set semua presensi pegawai hari ini menjadi Sesuai"
            >
              <CheckCircle2 className="w-3 h-3 text-white" />
              <span>Set Semua Sesuai ✓</span>
            </button>

            <button
              onClick={() => handleSetAllLate(15)}
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Set Terlambat 15 Menit</span>
            </button>

            <button
              onClick={handleSetHoliday}
              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Coffee className="w-3 h-3 text-sky-600" />
              <span>Set Hari Libur / Non-Efektif</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Jam Masuk Senin - Jumat: <strong>07:00 WITA</strong> • Denda 1 menit: <strong>Rp 1.500</strong></span>
          </div>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Daily Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Hadir Fisik</div>
          <div className="text-base font-extrabold text-emerald-700 mt-0.5">
            {metrics.hadir} / {metrics.targetWajibKerja}
          </div>
          <div className="text-[10px] text-slate-500">
            {metrics.bukanHariKerja > 0 ? `${metrics.bukanHariKerja} Pegawai Off` : 'Wajib Hadir'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terlambat Masuk</div>
          <div className="text-base font-extrabold text-amber-700 mt-0.5">
            {metrics.terlambat} Orang
          </div>
          <div className="text-[10px] text-amber-700 font-semibold">
            {formatRupiah(metrics.totalDendaTerlambat)} denda
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bukan Hari Kerja</div>
          <div className="text-base font-extrabold text-slate-700 mt-0.5">
            {metrics.bukanHariKerja} Orang
          </div>
          <div className="text-[10px] text-slate-500">Off / Tidak Dihitung</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sakit &amp; Izin</div>
          <div className="text-base font-extrabold text-teal-800 mt-0.5">
            {metrics.sakit + metrics.izin} Orang
          </div>
          <div className="text-[10px] text-slate-500">{metrics.sakit} Sakit, {metrics.izin} Izin</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tugas Luar &amp; Diklat</div>
          <div className="text-base font-extrabold text-sky-700 mt-0.5">
            {metrics.cuti + metrics.dinasLuar + metrics.pelatihan} Orang
          </div>
          <div className="text-[10px] text-slate-500">{metrics.dinasLuar} DL, {metrics.pelatihan} Diklat, {metrics.cuti} Cuti</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alpha (Tanpa Ket.)</div>
          <div className="text-base font-extrabold text-rose-700 mt-0.5">
            {metrics.alpha} Orang
          </div>
          <div className="text-[10px] text-rose-600 font-semibold">
            - Rp 50.000 / hari
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pengecekan Absen</div>
          <div className="text-base font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
            <span>{metrics.disetujui} / {pegawaiList.length}</span>
          </div>
          <div className="text-[10px] text-slate-500">{metrics.disetujui} Sesuai • {pegawaiList.length - metrics.disetujui} Belum</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru, NIP, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Kategori:</span>
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                roleFilter === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Semua ({pegawaiList.length})
            </button>
            <button
              onClick={() => setRoleFilter('guru')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                roleFilter === 'guru' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Guru (GTY/GTT)
            </button>
            <button
              onClick={() => setRoleFilter('tendik')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                roleFilter === 'tendik' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tendik / Staf (PTY/PTT)
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Roll Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-12">No</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama &amp; Jabatan Pegawai</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status Kehadiran</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Jam Masuk</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Jam Keluar</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Keterlambatan</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Pengecekan Absen</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Lembur</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan / Alasan</th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status DB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPegawai.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Tidak ada data pegawai yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredPegawai.map((peg, idx) => {
                  const row = rows[peg.id] || {
                    pegawaiId: peg.id,
                    status: 'hadir_tepat_waktu',
                    jamMasuk: '07:00:00',
                    jamKeluar: '16:00:00',
                    menitTerlambat: 0,
                    jamMengajarHariIni: peg.statusPegawai === 'GTY' || peg.statusPegawai === 'GTT' ? 4 : 0,
                    jamLembur: 0,
                    metode: 'manual_admin',
                    keterangan: '',
                    isSavedInDb: false,
                    isApproved: false,
                  };

                  const isGuru = peg.statusPegawai === 'GTY' || peg.statusPegawai === 'GTT';
                  const isOffDay = row.status === 'bukan_hari_kerja' || row.status === 'libur_sekolah';
                  const isAbsent = ['sakit_skd', 'sakit_tanpa_skd', 'izin_resmi', 'izin_pribadi', 'cuti_tahunan', 'cuti_khusus', 'libur_sekolah', 'alpha', 'bukan_hari_kerja'].includes(row.status);

                  return (
                    <tr key={`${peg.id}-${idx}`} className={`hover:bg-slate-50/70 transition ${isOffDay ? 'bg-slate-50/40' : ''}`}>
                      {/* No */}
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Pegawai Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                          <span>{peg.nama}</span>
                          {peg.statusInduk === 'Non Induk' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Non-Induk (Murni JP)
                            </span>
                          )}
                          {isOffDay && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                              Off (Bukan Hari Kerja)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isGuru ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {peg.statusPegawai}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[170px]">{peg.jabatanUtama}</span>
                        </div>
                      </td>

                      {/* Status Kehadiran Selector */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={row.status}
                          onChange={(e) => updateRow(peg.id, { status: e.target.value as StatusKehadiranHarian })}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold border cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                            row.status === 'hadir_tepat_waktu'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : row.status === 'terlambat'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : row.status === 'izin_terlambat'
                              ? 'bg-amber-100/80 text-amber-900 border-amber-400 font-extrabold shadow-2xs'
                              : row.status === 'bukan_hari_kerja'
                              ? 'bg-slate-100 text-slate-800 border-slate-300 font-semibold'
                              : row.status === 'libur_sekolah'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                              : row.status === 'sakit_skd'
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : row.status === 'izin_resmi'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : row.status === 'dinas_luar'
                              ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                              : row.status === 'pelatihan'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                              : row.status === 'cuti_tahunan' || row.status === 'cuti_khusus'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="hadir_tepat_waktu">🟢 Hadir Tepat Waktu</option>
                          <option value="terlambat">🟡 Terlambat</option>
                          <option value="izin_terlambat">⏱️ Izin Terlambat (Bebas Denda)</option>
                          <option value="bukan_hari_kerja">⚪ Bukan Hari Kerja</option>
                          <option value="libur_sekolah">🏖️ Hari Libur / Non-Efektif</option>
                          <option value="sakit_skd">🔵 Sakit (Surat Dokter / SKD)</option>
                          <option value="sakit_tanpa_skd">⚠️ Sakit (Tanpa SKD)</option>
                          <option value="izin_resmi">🔷 Izin Resmi / Dispensasi</option>
                          <option value="izin_pribadi">🔸 Izin Pribadi</option>
                          <option value="cuti_tahunan">🏖️ Cuti Tahunan</option>
                          <option value="cuti_khusus">🏖️ Cuti Khusus</option>
                          <option value="dinas_luar">🏢 Dinas Luar (Tugas Luar)</option>
                          <option value="pelatihan">🎓 Pelatihan / Diklat / Bimtek</option>
                          <option value="alpha">🔴 Alpha (Tanpa Keterangan)</option>
                        </select>
                      </td>

                      {/* Jam Masuk (Manual Edit Format 24 Jam) */}
                      <td className="py-3.5 px-3 text-center">
                        {isOffDay ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-mono text-[11px] font-semibold" title="Bukan Hari Kerja (Absensi Ditiadakan)">Off</span>
                        ) : isAbsent ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <div className="relative inline-flex items-center">
                            <TimeInput24
                              compact
                              value={row.jamMasuk}
                              onChange={(newTime) => updateRow(peg.id, { jamMasuk: newTime })}
                              title="Ubah Jam Masuk (Format 24 Jam s/d 24:00)"
                            />
                          </div>
                        )}
                      </td>

                      {/* Jam Keluar (Manual Edit Format 24 Jam) */}
                      <td className="py-3.5 px-3 text-center">
                        {isOffDay ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-mono text-[11px] font-semibold" title="Bukan Hari Kerja (Absensi Ditiadakan)">Off</span>
                        ) : isAbsent ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <div className="relative inline-flex items-center">
                            <TimeInput24
                              compact
                              value={row.jamKeluar}
                              onChange={(newTime) => updateRow(peg.id, { jamKeluar: newTime })}
                              title="Ubah Jam Keluar (Format 24 Jam s/d 24:00)"
                            />
                          </div>
                        )}
                      </td>

                      {/* Menit Keterlambatan */}
                      <td className="py-3.5 px-3 text-center">
                        {isOffDay ? (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        ) : isAbsent ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={row.menitTerlambat}
                                onChange={(e) => updateRow(peg.id, { menitTerlambat: Number(e.target.value) })}
                                className={`w-14 px-1 py-1 text-xs text-center border rounded-lg font-mono font-bold ${
                                  row.status === 'izin_terlambat'
                                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                                    : row.menitTerlambat > 0
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-slate-300 text-slate-600'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400">m</span>
                            </div>
                            {row.status === 'izin_terlambat' && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                                Bebas Denda (Rp 0)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Pengecekan Absen (Tombol Sesuai / Belum) */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => updateRow(peg.id, { isApproved: !(row.isApproved === true) })}
                          title={row.isApproved === true ? 'Absensi: Sesuai (Klik untuk mengubah menjadi Belum)' : 'Absensi: Belum (Klik untuk mengubah menjadi Sesuai)'}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs min-w-[85px] ${
                            row.isApproved === true
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                              : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 hover:border-amber-400'
                          }`}
                        >
                          {row.isApproved === true ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Sesuai</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Jam Lembur */}
                      <td className="py-3.5 px-3 text-center">
                        {!isAbsent ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={8}
                              step="0.5"
                              value={row.jamLembur}
                              onChange={(e) => updateRow(peg.id, { jamLembur: Number(e.target.value) })}
                              className={`w-12 px-1 py-1 text-xs text-center border rounded-lg font-bold ${
                                row.jamLembur > 0
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-300 text-slate-600'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400">Jam</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder={isOffDay ? "Bukan Hari Kerja (Off / Bebas Tugas)" : "Catatan / keterangan..."}
                          value={row.keterangan}
                          onChange={(e) => updateRow(peg.id, { keterangan: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                        />
                      </td>

                      {/* Status DB */}
                      <td className="py-3.5 px-3 text-center">
                        {row.isSavedInDb ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800" title="Tersimpan di Log Presensi Harian">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Tersimpan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title="Belum disimpan (klik tombol Simpan Presensi)">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            <span>Draft</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary & Save Bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Menampilkan <strong>{filteredPegawai.length}</strong> pegawai pada tanggal <strong>{dateFormattedIndo}</strong>.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDayAttendance}
              disabled={isSaving}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan &amp; Terapkan ke Penggajian</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
