import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  UserX, 
  UserCheck, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  School, 
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  X,
  Send,
  CalendarCheck,
  Check,
  TrendingUp,
  TrendingDown,
  Building2,
  Award,
  Layers,
  Filter
} from 'lucide-react';
import { 
  Pegawai, 
  LogPresensiHarian, 
  SlotJadwalPelajaran, 
  LogInfal, 
  PengajuanCutiIzin,
  HariJadwal 
} from '../types';
import { GURU_INITIALS } from '../data/scheduleData';
import { formatRupiah, getTodayDateString } from '../utils/security';

interface DailyAbsenceInfalCardProps {
  pegawaiList: Pegawai[];
  dailyLogs: LogPresensiHarian[];
  scheduleList: SlotJadwalPelajaran[];
  infalList: LogInfal[];
  leaveRequests?: PengajuanCutiIzin[];
  onNavigateTab: (tab: string, subTab?: string) => void;
  onAddInfal?: (infal: LogInfal) => void;
  selectedBulan?: number;
  selectedTahun?: number;
}

export const DailyAbsenceInfalCard: React.FC<DailyAbsenceInfalCardProps> = ({
  pegawaiList,
  dailyLogs,
  scheduleList,
  infalList,
  leaveRequests = [],
  onNavigateTab,
  onAddInfal,
  selectedBulan = (new Date().getMonth() + 1),
  selectedTahun = (new Date().getFullYear()),
}) => {
  // Date State for Daily Inspection (Defaults directly to today's real date)
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());

  // Quick Modal State for Direct Infal Assignment
  const [quickAssignModal, setQuickAssignModal] = useState<{
    isOpen: boolean;
    guruDigantikan: Pegawai | null;
    slot: SlotJadwalPelajaran | null;
    alasan: string;
  }>({
    isOpen: false,
    guruDigantikan: null,
    slot: null,
    alasan: '',
  });

  const [selectedPenggantiId, setSelectedPenggantiId] = useState<string>('');
  const [assignJumlahJp, setAssignJumlahJp] = useState<number>(2);
  const [assignCatatan, setAssignCatatan] = useState<string>('');
  const [showOnlyFreeGuruInduk, setShowOnlyFreeGuruInduk] = useState<boolean>(true);

  // Map Date to Indonesian Day of Week
  const dayInfo = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      const daysIndo: HariJadwal[] = ['Minggu' as any, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu' as any];
      const dayIndex = d.getDay();
      const hari = daysIndo[dayIndex];
      const dateFormatted = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return {
        hari,
        isSchoolDay: dayIndex >= 1 && dayIndex <= 5,
        dateFormatted,
      };
    } catch {
      return { hari: 'Senin' as HariJadwal, isSchoolDay: true, dateFormatted: selectedDate };
    }
  }, [selectedDate]);

  // Helper to resolve Pegawai Id from Schedule Slot
  const getPegawaiIdForSlot = (slot: SlotJadwalPelajaran): string => {
    if (slot.pegawaiId) return slot.pegawaiId;
    const initialMap = GURU_INITIALS.find(g => g.kode === slot.kodeGuru);
    if (initialMap?.pegawaiId) return initialMap.pegawaiId;
    const foundByName = pegawaiList.find(p => 
      p.nama.toLowerCase().includes(slot.guruNama.toLowerCase()) ||
      slot.guruNama.toLowerCase().includes(p.nama.toLowerCase())
    );
    return foundByName?.id || '';
  };

  // Find all absent employees for the selected date
  const absentData = useMemo(() => {
    const list: Array<{
      pegawai: Pegawai;
      statusKey: 'sakit' | 'izin' | 'cuti' | 'dinas_luar' | 'pelatihan' | 'alpha' | 'libur_sekolah';
      statusLabel: string;
      statusBadgeColor: string;
      keterangan: string;
      teachingSlots: Array<{
        slot: SlotJadwalPelajaran;
        replacement: LogInfal | undefined;
      }>;
      totalJpNeedReplace: number;
      totalJpReplaced: number;
    }> = [];

    // Filter daily logs for selected date
    const dateLogs = dailyLogs.filter(l => l.tanggal === selectedDate);
    const dateLeaves = leaveRequests.filter(
      r => r.status === 'approved' && selectedDate >= r.tanggalMulai && selectedDate <= r.tanggalSelesai
    );

    pegawaiList.forEach((peg) => {
      const log = dateLogs.find(l => l.pegawaiId === peg.id);
      const leave = dateLeaves.find(r => r.pegawaiId === peg.id);

      let isAbsent = false;
      let statusKey: 'sakit' | 'izin' | 'cuti' | 'dinas_luar' | 'pelatihan' | 'alpha' = 'izin';
      let statusLabel = '';
      let statusBadgeColor = '';
      let keterangan = '';

      if (log) {
        if (log.status === 'sakit_skd' || log.status === 'sakit_tanpa_skd' || (log.status as any) === 'sakit') {
          isAbsent = true;
          statusKey = 'sakit';
          statusLabel = log.status === 'sakit_skd' ? 'Sakit (SKD Dokter)' : 'Sakit';
          statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          keterangan = log.keterangan || 'Tidak hadir karena sakit';
        } else if (log.status === 'izin_resmi' || log.status === 'izin_pribadi' || (log.status as any) === 'izin') {
          isAbsent = true;
          statusKey = 'izin';
          statusLabel = log.status === 'izin_resmi' ? 'Izin Resmi' : 'Izin Pribadi';
          statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          keterangan = log.keterangan || 'Izin berhalangan hadir';
        } else if (log.status === 'libur_sekolah') {
           isAbsent = true;
           statusKey = 'cuti';
           statusLabel = 'Hari Libur / Non-Efektif KBM';
           statusBadgeColor = 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
           keterangan = log.keterangan || 'Hari Libur / Non-Efektif KBM';
         } else if (log.status === 'cuti_tahunan' || log.status === 'cuti_khusus' || (log.status as any) === 'cuti') {
          isAbsent = true;
          statusKey = 'cuti';
          statusLabel = log.status === 'cuti_tahunan' ? 'Cuti Tahunan' : 'Cuti Khusus';
          statusBadgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
          keterangan = log.keterangan || 'Sedang menjalani masa cuti resmi';
        } else if (log.status === 'dinas_luar') {
          isAbsent = true;
          statusKey = 'dinas_luar';
          statusLabel = 'Dinas Luar (Tugas Sekolah)';
          statusBadgeColor = 'bg-teal-50 text-teal-700 border-teal-200 font-semibold';
          keterangan = log.keterangan || 'Penugasan dinas luar sekolah';
        } else if (log.status === 'pelatihan') {
          isAbsent = true;
          statusKey = 'pelatihan';
          statusLabel = 'Pelatihan / Diklat / Bimtek';
          statusBadgeColor = 'bg-teal-50 text-teal-800 border-teal-200 font-semibold';
          keterangan = log.keterangan || 'Mengikuti pelatihan / workshop / diklat';
        } else if (log.status === 'alpha') {
          isAbsent = true;
          statusKey = 'alpha';
          statusLabel = 'Alpha (Tanpa Keterangan)';
          statusBadgeColor = 'bg-red-100 text-red-800 border-red-300 font-bold';
          keterangan = log.keterangan || 'Tidak hadir dan tidak ada konfirmasi (Denda Rp 50.000)';
        }
      } else if (leave) {
        isAbsent = true;
        if (leave.jenis.includes('sakit')) {
          statusKey = 'sakit';
          statusLabel = 'Sakit (Pengajuan Cuti/Izin)';
          statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        } else if (leave.jenis.includes('cuti')) {
          statusKey = 'cuti';
          statusLabel = 'Cuti Disetujui';
          statusBadgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
        } else if (leave.jenis === 'pelatihan') {
          statusKey = 'pelatihan';
          statusLabel = 'Pelatihan / Diklat Disetujui';
          statusBadgeColor = 'bg-teal-50 text-teal-800 border-teal-200 font-semibold';
        } else if (leave.jenis.includes('dinas')) {
          statusKey = 'dinas_luar';
          statusLabel = 'Dinas Luar (Surat Tugas)';
          statusBadgeColor = 'bg-teal-50 text-teal-700 border-teal-200 font-semibold';
        } else {
          statusKey = 'izin';
          statusLabel = 'Izin Disetujui';
          statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        }
        keterangan = leave.alasan;
      }

      if (isAbsent) {
        // Find teaching schedule slots on this day for this teacher
        const slotsToday = dayInfo.isSchoolDay
          ? scheduleList.filter(s => {
              if (s.hari !== dayInfo.hari) return false;
              if (s.isNonAkademik) return false;
              const slotPegId = getPegawaiIdForSlot(s);
              return slotPegId === peg.id;
            })
          : [];

        // Check each slot if infal replacement already scheduled
        let totalJpNeed = 0;
        let totalJpRep = 0;

        const teachingSlots = slotsToday.map((slot) => {
          // Look up in infalList for this date and this teacher
          const replacement = infalList.find(i => 
            i.tanggal === selectedDate &&
            (i.guruDigantikanId === peg.id || i.guruAbsenId === peg.id) &&
            (i.kelas === slot.kelas || i.mataPelajaran.toLowerCase().includes(slot.mataPelajaran.toLowerCase()) || slot.mataPelajaran.toLowerCase().includes(i.mataPelajaran.toLowerCase()))
          );

          totalJpNeed += 1;
          if (replacement) {
            totalJpRep += 1;
          }

          return { slot, replacement };
        });

        list.push({
          pegawai: peg,
          statusKey,
          statusLabel,
          statusBadgeColor,
          keterangan,
          teachingSlots,
          totalJpNeedReplace: totalJpNeed,
          totalJpReplaced: totalJpRep,
        });
      }
    });

    return list;
  }, [selectedDate, dailyLogs, leaveRequests, pegawaiList, scheduleList, infalList, dayInfo]);

  // Aggregate Metrics for Selected Date
  const metrics = useMemo(() => {
    const totalAbsent = absentData.length;
    const totalSakit = absentData.filter(d => d.statusKey === 'sakit').length;
    const totalIzin = absentData.filter(d => d.statusKey === 'izin').length;
    const totalCuti = absentData.filter(d => d.statusKey === 'cuti').length;
    const totalDinasLuar = absentData.filter(d => d.statusKey === 'dinas_luar').length;
    const totalPelatihan = absentData.filter(d => d.statusKey === 'pelatihan').length;
    const totalAlpha = absentData.filter(d => d.statusKey === 'alpha').length;

    let totalSlotsNeedReplace = 0;
    let totalSlotsReplaced = 0;

    absentData.forEach(d => {
      totalSlotsNeedReplace += d.teachingSlots.length;
      totalSlotsReplaced += d.totalJpReplaced;
    });

    const totalSlotsPending = Math.max(0, totalSlotsNeedReplace - totalSlotsReplaced);

    return {
      totalAbsent,
      totalSakit,
      totalIzin,
      totalCuti,
      totalDinasLuar,
      totalPelatihan,
      totalAlpha,
      totalSlotsNeedReplace,
      totalSlotsReplaced,
      totalSlotsPending,
    };
  }, [absentData]);

  // Compute Replacement Candidates (Guru Induk Saja & Status Kosong saat Jam Tersebut & Rekap Infal Periode Ini)
  const candidateStatsList = useMemo(() => {
    if (!quickAssignModal.slot || !quickAssignModal.guruDigantikan) return [];

    const slot = quickAssignModal.slot;
    const hari = dayInfo.hari;
    const absentTeacherId = quickAssignModal.guruDigantikan.id;

    // Filter to candidate teachers and staff (exclude absent teacher/staff)
    const guruIndukList = pegawaiList.filter((p) => {
      if (p.id === absentTeacherId) return false;
      return true;
    });

    // Check availability at this exact slot & calculate infal cut-off metrics
    return guruIndukList.map((p) => {
      // 1. Check if absent on selectedDate
      const isAbsentToday = dailyLogs.some(
        l => l.tanggal === selectedDate && l.pegawaiId === p.id && 
        ['sakit_skd', 'sakit_tanpa_skd', 'sakit', 'izin_resmi', 'izin_pribadi', 'izin', 'cuti_tahunan', 'cuti_khusus', 'cuti', 'dinas_luar', 'pelatihan', 'alpha'].includes(l.status as string)
      );

      // 2. Check teaching schedule conflict at this exact day and jamKe
      const conflictSlot = scheduleList.find(s => {
        if (s.hari !== hari) return false;
        if (s.jamKe !== slot.jamKe) return false;
        if (s.isNonAkademik) return false;
        const slotPegId = getPegawaiIdForSlot(s);
        return slotPegId === p.id;
      });

      const isKosong = !isAbsentToday && !conflictSlot;

      // 3. Calculate Cut-Off Period Infal Records
      const recordsMenggantikan = infalList.filter(i => i.guruPenggantiId === p.id);
      const kaliMenggantikan = recordsMenggantikan.length;
      const jpMenggantikan = recordsMenggantikan.reduce((acc, curr) => acc + (curr.jumlahJp || 1), 0);
      const nominalMenggantikan = recordsMenggantikan.reduce((acc, curr) => acc + (curr.totalNominal || curr.jumlahJp * 7500), 0);

      const recordsDigantikan = infalList.filter(i => i.guruDigantikanId === p.id || i.guruAbsenId === p.id);
      const kaliDigantikan = recordsDigantikan.length;
      const jpDigantikan = recordsDigantikan.reduce((acc, curr) => acc + (curr.jumlahJp || 1), 0);
      const nominalDigantikan = recordsDigantikan.reduce((acc, curr) => acc + (curr.totalNominal || curr.jumlahJp * 7500), 0);

      const saldoNet = nominalMenggantikan - nominalDigantikan;

      let conflictReason = '';
      if (isAbsentToday) {
        conflictReason = 'Tidak Hadir / Izin / Cuti Hari Ini';
      } else if (conflictSlot) {
        conflictReason = `Sedang Mengajar di Kelas ${conflictSlot.kelas} (${conflictSlot.mataPelajaran})`;
      }

      return {
        pegawai: p,
        isKosong,
        conflictSlot,
        conflictReason,
        isAbsentToday,
        kaliMenggantikan,
        jpMenggantikan,
        nominalMenggantikan,
        kaliDigantikan,
        jpDigantikan,
        nominalDigantikan,
        saldoNet,
      };
    });
  }, [quickAssignModal.slot, quickAssignModal.guruDigantikan, dayInfo.hari, pegawaiList, dailyLogs, scheduleList, selectedDate, infalList]);

  // Filtered Candidate List based on Toggle
  const activeCandidates = useMemo(() => {
    if (showOnlyFreeGuruInduk) {
      return candidateStatsList.filter(c => c.isKosong);
    }
    return candidateStatsList;
  }, [candidateStatsList, showOnlyFreeGuruInduk]);

  // Currently Selected Teacher Object & Stats
  const selectedTeacherCandidate = useMemo(() => {
    return candidateStatsList.find(c => c.pegawai.id === selectedPenggantiId);
  }, [candidateStatsList, selectedPenggantiId]);

  // Handle Quick Assign Submission
  const handleSaveQuickAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAssignModal.guruDigantikan || !quickAssignModal.slot || !selectedPenggantiId) {
      return;
    }

    const guruPengganti = pegawaiList.find(p => p.id === selectedPenggantiId);
    if (!guruPengganti) return;

    const newInfal: LogInfal = {
      id: `inf-${Date.now()}`,
      tanggal: selectedDate,
      guruDigantikanId: quickAssignModal.guruDigantikan.id,
      guruDigantikanNama: quickAssignModal.guruDigantikan.nama,
      guruAbsenId: quickAssignModal.guruDigantikan.id,
      guruAbsenNama: quickAssignModal.guruDigantikan.nama,
      guruPenggantiId: guruPengganti.id,
      guruPenggantiNama: guruPengganti.nama,
      kelas: quickAssignModal.slot.kelas,
      mataPelajaran: quickAssignModal.slot.mataPelajaran,
      jamKe: `Jam ${quickAssignModal.slot.jamKe} (${quickAssignModal.slot.rentangWaktu})`,
      jumlahJp: assignJumlahJp || 1,
      tarifPerJp: 7500,
      totalNominal: (assignJumlahJp || 1) * 7500,
      alasan: quickAssignModal.alasan || 'Penggantian jam mengajar guru berhalangan hadir',
      alasanAbsen: quickAssignModal.alasan || 'Penggantian jam mengajar guru berhalangan hadir',
      status: 'approved',
      approvedBy: 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)',
      approvedAt: new Date().toISOString(),
      catatan: assignCatatan || 'Ditugaskan melalui dasbor monitoring presensi harian',
      createdAt: new Date().toISOString(),
    };

    if (onAddInfal) {
      onAddInfal(newInfal);
    }

    setQuickAssignModal({
      isOpen: false,
      guruDigantikan: null,
      slot: null,
      alasan: '',
    });
    setSelectedPenggantiId('');
    setAssignCatatan('');
  };

  const openAssignModal = (guru: Pegawai, slot: SlotJadwalPelajaran, alasan: string) => {
    const hari = dayInfo.hari;

    // Filter to Guru Induk who are free at this exact day and jamKe
    const freeGuruInduk = pegawaiList.filter((p) => {
      if (p.id === guru.id) return false;
      if (p.statusInduk === 'Non Induk') return false;
      const isInduk = (p.statusInduk || '').toLowerCase().includes('induk');
      const isTeacher = p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT' ||
        p.jabatanUtama.toLowerCase().includes('guru') ||
        p.jabatanUtama.toLowerCase().includes('kepala') ||
        p.jabatanUtama.toLowerCase().includes('wakil') ||
        p.jabatanUtama.toLowerCase().includes('kaprog');

      if (!isInduk || !isTeacher) return false;

      // Check not absent today
      const isAbsent = dailyLogs.some(
        l => l.tanggal === selectedDate && l.pegawaiId === p.id && 
        ['sakit_skd', 'sakit_tanpa_skd', 'sakit', 'izin_resmi', 'izin_pribadi', 'izin', 'cuti_tahunan', 'cuti_khusus', 'cuti', 'dinas_luar', 'pelatihan', 'alpha'].includes(l.status as string)
      );
      if (isAbsent) return false;

      // Check no conflict at this slot
      const conflict = scheduleList.some(s => s.hari === hari && s.jamKe === slot.jamKe && !s.isNonAkademik && getPegawaiIdForSlot(s) === p.id);
      return !conflict;
    });

    const defaultPick = freeGuruInduk[0] || pegawaiList.find(p => p.id !== guru.id && (p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT'));

    setQuickAssignModal({
      isOpen: true,
      guruDigantikan: guru,
      slot,
      alasan,
    });
    setSelectedPenggantiId(defaultPick?.id || '');
    setAssignJumlahJp(1);
    setAssignCatatan(`Menggantikan ${slot.mataPelajaran} di kelas ${slot.kelas} (${slot.rentangWaktu})`);
    setShowOnlyFreeGuruInduk(true);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Date Switcher and Direct CTA to Infal Manager */}
      <div className="p-4 sm:p-5 border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-700 text-white rounded-lg shadow-xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>Pemantauan Kehadiran & Kebutuhan Guru Pengganti (Infal)</span>
                  {metrics.totalSlotsPending > 0 ? (
                    <span className="px-2 py-0.5 text-[11px] bg-rose-100 text-rose-800 border border-rose-200 rounded-full font-bold animate-pulse">
                      {metrics.totalSlotsPending} Jam Kosong Butuh Pengganti
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-semibold">
                      Semua Jam Tercover
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar guru/tendik tidak hadir (Sakit, Izin, Cuti, DL, Alpha) beserta jam mengajar yang perlu jadwal guru pengganti
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Switcher and Redirection Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Date Picker */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-2"
              />
            </div>

            {/* Quick Date Chips */}
            <div className="hidden sm:flex items-center gap-1">
              {[
                { label: 'Hari Ini', val: new Date().toISOString().split('T')[0] },
                { label: '25 Agu', val: `${selectedTahun}-08-25` },
                { label: '20 Agu', val: `${selectedTahun}-08-20` },
                { label: '18 Agu', val: `${selectedTahun}-08-18` },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setSelectedDate(chip.val)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                    selectedDate === chip.val
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Primary Action Button: Navigate directly to Pergantian Mengajar (Infal) */}
            <button
              onClick={() => onNavigateTab('attendance', 'infal')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              title="Buka Halaman Pergantian Mengajar Guru (Jadwal Infal)"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Kelola Jadwal Guru Pengganti (Infal)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Selected Day Banner & KPI Badges */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium text-slate-700 flex items-center gap-2">
            <span className="text-slate-500">Hari & Tanggal:</span>
            <strong className="text-emerald-950 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/80">
              {dayInfo.dateFormatted}
            </strong>
            {!dayInfo.isSchoolDay && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                (Hari Libur Akhir Pekan - Tidak Ada Jam Belajar)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
              <UserX className="w-3.5 h-3.5 text-slate-500" />
              <span>Tidak Hadir: <strong>{metrics.totalAbsent} Orang</strong></span>
            </div>

            {metrics.totalSakit > 0 && (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-md font-semibold text-[11px]">
                {metrics.totalSakit} Sakit
              </span>
            )}
            {metrics.totalIzin > 0 && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md font-semibold text-[11px]">
                {metrics.totalIzin} Izin
              </span>
            )}
            {metrics.totalCuti > 0 && (
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-1 rounded-md font-semibold text-[11px]">
                {metrics.totalCuti} Cuti
              </span>
            )}
            {metrics.totalDinasLuar > 0 && (
              <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-md font-semibold text-[11px]">
                {metrics.totalDinasLuar} Dinas Luar
              </span>
            )}
            {metrics.totalPelatihan > 0 && (
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-1 rounded-md font-semibold text-[11px]">
                {metrics.totalPelatihan} Pelatihan/Diklat
              </span>
            )}
            {metrics.totalAlpha > 0 && (
              <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-1 rounded-md font-bold text-[11px]">
                {metrics.totalAlpha} Alpha
              </span>
            )}

            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-emerald-950 font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Jam Perlu Digantikan: <strong>{metrics.totalSlotsNeedReplace} JP</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Absent Teachers & Teaching Slots Requiring Replacement */}
      <div className="p-4 sm:p-5">
        {absentData.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/40 rounded-xl border border-emerald-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">
              Alhamdulillah, Seluruh Guru & Staf Hadir pada Tanggal Ini
            </h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1 leading-relaxed">
              Tidak ada data izin, sakit, cuti, atau ketidakhadiran pada <strong>{dayInfo.dateFormatted}</strong>. Seluruh jam pelajaran berjalan normal sesuai jadwal.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setSelectedDate(`${selectedTahun}-08-18`)}
                className="text-xs bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Lihat Contoh Tanggal 18 Agustus (Ada Infal)
              </button>
              <button
                onClick={() => setSelectedDate(`${selectedTahun}-08-20`)}
                className="text-xs bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Lihat Contoh Tanggal 20 Agustus
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {absentData.map((item, itemIdx) => (
              <div 
                key={`${item.pegawai.id}-${itemIdx}`}
                className="border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-slate-300 transition bg-slate-50/30"
              >
                {/* Employee Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-300">
                      {item.pegawai.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{item.pegawai.nama}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                          {item.pegawai.niy || item.pegawai.nip}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {item.pegawai.statusPegawai} • {item.pegawai.jabatanUtama}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Alasan: <strong className="text-slate-700 italic">"{item.keterangan}"</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${item.statusBadgeColor}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Schedule & Replacement Section for this Teacher */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Jadwal Jam Mengajar Terdampak Hari {dayInfo.hari}:</span>
                    </div>

                    {item.teachingSlots.length > 0 && (
                      <div className="text-xs text-slate-500">
                        Total <strong>{item.teachingSlots.length} Jam Pelajaran (JP)</strong> •{' '}
                        <span className={item.totalJpReplaced === item.teachingSlots.length ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-bold'}>
                          {item.totalJpReplaced} / {item.teachingSlots.length} Terjadwal Pengganti
                        </span>
                      </div>
                    )}
                  </div>

                  {item.teachingSlots.length === 0 ? (
                    <div className="bg-slate-100/70 p-3 rounded-lg text-xs text-slate-500 italic flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span>Tidak ada jadwal jam mengajar tatap muka di kelas pada hari {dayInfo.hari} (Tenaga Kependidikan / Hari Bebas Mengajar).</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.teachingSlots.map(({ slot, replacement }, idx) => (
                        <div 
                          key={`${slot.id || idx}-${idx}`}
                          className={`p-3.5 rounded-lg border transition flex flex-col justify-between ${
                            replacement 
                              ? 'bg-emerald-50/40 border-emerald-200' 
                              : 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-300/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                Kelas {slot.kelas}
                              </span>
                              <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Jam {slot.jamKe} ({slot.rentangWaktu})
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800 mt-1">
                              {slot.mataPelajaran}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Ruang: {slot.ruang || `Kelas ${slot.kelas}`} • Beban: 1 JP (40 Menit)
                            </div>
                          </div>

                          {/* Replacement Status or Action */}
                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                            {replacement ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="text-[11px] text-slate-500 block">Guru Pengganti (Infal):</span>
                                  <strong className="text-emerald-900 font-semibold">{replacement.guruPenggantiNama}</strong>
                                  <span className="text-[10px] text-emerald-700 ml-1.5 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    +Rp 7.500/JP
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-1 text-xs text-amber-800 font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Belum Ada Pengganti</span>
                                </div>
                                <button
                                  onClick={() => openAssignModal(item.pegawai, slot, item.keterangan)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] px-2.5 py-1 rounded-md shadow-2xs transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tugaskan Pengganti</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-600 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          <span>
            Setiap jam infal yang tercatat resmi akan otomatis menambahkan <strong>Rp 7.500/JP</strong> ke honor guru pengganti dan memotong <strong>Rp 7.500/JP</strong> dari guru berhalangan pada draft penggajian.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-slate-700 hover:text-emerald-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            Lihat Matriks Jadwal
          </button>
          <button
            onClick={() => onNavigateTab('attendance', 'infal')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Halaman Pergantian Mengajar (Infal)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Infal Assignment Modal with Guru Induk Filter, Slot Schedule Availability, and Cut-Off Stats */}
      {quickAssignModal.isOpen && quickAssignModal.guruDigantikan && quickAssignModal.slot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl shadow-2xs">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h4 className="font-bold text-base flex items-center gap-2">
                    <span>Tugaskan Guru Pengganti (Infal)</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Guru Induk Terverifikasi
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-200/90">
                    Jadwal Belajar: <strong>{dayInfo.dateFormatted}</strong> • Jam {quickAssignModal.slot.jamKe} ({quickAssignModal.slot.rentangWaktu})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickAssignModal({ isOpen: false, guruDigantikan: null, slot: null, alasan: '' })}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAssign} className="p-4 sm:p-5 space-y-4">
              {/* Target Class Info Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Guru Yang Berhalangan:</span>
                  <strong className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {quickAssignModal.guruDigantikan.nama}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mata Pelajaran & Kelas:</span>
                  <strong className="text-slate-800">
                    {quickAssignModal.slot.mataPelajaran} (Kelas {quickAssignModal.slot.kelas})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Waktu / Jam Pelajaran:</span>
                  <strong className="text-emerald-950 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                    Hari {dayInfo.hari} • Jam {quickAssignModal.slot.jamKe} ({quickAssignModal.slot.rentangWaktu})
                  </strong>
                </div>
              </div>

              {/* Guru Induk Filter Bar & Toggle */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-emerald-700" />
                    <span>Pilih Guru Pengganti (Khusus Guru Induk IQM)</span>
                    <span className="text-rose-500">*</span>
                  </label>

                  {/* Filter Mode Toggle */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowOnlyFreeGuruInduk(!showOnlyFreeGuruInduk)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 cursor-pointer ${
                        showOnlyFreeGuruInduk
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>{showOnlyFreeGuruInduk ? 'Hanya Guru Induk Yang Kosong' : 'Tampilkan Semua Guru Induk'}</span>
                    </button>
                  </div>
                </div>

                {/* Dropdown Select with Formatted Info */}
                <select
                  value={selectedPenggantiId}
                  onChange={(e) => setSelectedPenggantiId(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs border rounded-lg border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                >
                  <option value="">-- Pilih Guru Pengganti --</option>
                  {activeCandidates.map((c, cIdx) => (
                    <option key={`${c.pegawai.id}-${cIdx}`} value={c.pegawai.id}>
                      {c.pegawai.nama} — [{c.isKosong ? `✅ Kosong Jam ${quickAssignModal.slot?.jamKe}` : `⚠️ ${c.conflictReason}`}] | Menggantikan: {c.kaliMenggantikan}x ({c.jpMenggantikan} JP) | Digantikan: {c.kaliDigantikan}x ({c.jpDigantikan} JP)
                    </option>
                  ))}
                </select>
                {activeCandidates.length === 0 && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    Tidak ada guru induk yang kosong pada jam {quickAssignModal.slot?.jamKe}. Klik toggle di kanan atas untuk menampilkan seluruh guru induk.
                  </p>
                )}
              </div>

              {/* Selected Teacher Detailed Candidate Card with Cut-Off Stats */}
              {selectedTeacherCandidate && (
                <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs space-y-3 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                        {selectedTeacherCandidate.pegawai.nama.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span>{selectedTeacherCandidate.pegawai.nama}</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                            Guru Induk
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedTeacherCandidate.pegawai.statusPegawai} • {selectedTeacherCandidate.pegawai.jabatanUtama}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedTeacherCandidate.isKosong ? (
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Kosong Jam ke-{quickAssignModal.slot.jamKe} (Standby)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{selectedTeacherCandidate.conflictReason}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cut-Off Period Statistics (Berapa kali menggantikan & digantikan) */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Rekap Infal Periode Cut-Off (Bulan {selectedBulan}/{selectedTahun}):</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Tarif: Rp 7.500 / JP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {/* Menggantikan Jam Mengajar */}
                      <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200">
                        <div className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1 mb-0.5">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>Menggantikan (Infal +)</span>
                        </div>
                        <div className="font-bold text-emerald-950 text-xs">
                          {selectedTeacherCandidate.kaliMenggantikan} Kali ({selectedTeacherCandidate.jpMenggantikan} JP)
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-semibold">
                          +{formatRupiah(selectedTeacherCandidate.nominalMenggantikan)}
                        </div>
                      </div>

                      {/* Digantikan Jamnya */}
                      <div className="p-2.5 bg-rose-50/80 rounded-lg border border-rose-200">
                        <div className="text-[10px] font-semibold text-rose-800 flex items-center gap-1 mb-0.5">
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                          <span>Digantikan (Infal -)</span>
                        </div>
                        <div className="font-bold text-rose-950 text-xs">
                          {selectedTeacherCandidate.kaliDigantikan} Kali ({selectedTeacherCandidate.jpDigantikan} JP)
                        </div>
                        <div className="text-[10px] text-rose-700 font-mono mt-0.5 font-semibold">
                          -{formatRupiah(selectedTeacherCandidate.nominalDigantikan)}
                        </div>
                      </div>

                      {/* Saldo Bersih Infal */}
                      <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>Saldo Net Infal</span>
                        </div>
                        <div className={`font-bold text-xs ${
                          selectedTeacherCandidate.saldoNet > 0 
                            ? 'text-emerald-700' 
                            : selectedTeacherCandidate.saldoNet < 0 
                              ? 'text-rose-700' 
                              : 'text-slate-700'
                        }`}>
                          {formatRupiah(selectedTeacherCandidate.saldoNet)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {selectedTeacherCandidate.jpMenggantikan - selectedTeacherCandidate.jpDigantikan} JP Selisih
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Jumlah JP & Tarif */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Penggantian (JP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={assignJumlahJp}
                    onChange={(e) => setAssignJumlahJp(Number(e.target.value))}
                    className="w-full p-2 text-xs border rounded-lg border-slate-300 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Honor Infal
                  </label>
                  <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold text-center">
                    {formatRupiah(assignJumlahJp * 7500)}
                  </div>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penugasan
                </label>
                <input
                  type="text"
                  value={assignCatatan}
                  onChange={(e) => setAssignCatatan(e.target.value)}
                  placeholder="e.g. Pendampingan praktikum basis data lab 1"
                  className="w-full p-2 text-xs border rounded-lg border-slate-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickAssignModal({ isOpen: false, guruDigantikan: null, slot: null, alasan: '' })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedPenggantiId}
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Terapkan Jadwal Pengganti</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
