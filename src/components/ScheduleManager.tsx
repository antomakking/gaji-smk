import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Printer, 
  Clock, 
  GraduationCap, 
  Building2, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpDown, 
  Sparkles, 
  BookOpen, 
  Download, 
  Layers, 
  Calendar,
  X,
  UserCheck,
  RefreshCw,
  Info,
  Coffee,
  Sun,
  ShieldCheck,
  Check
} from 'lucide-react';
import { SlotJadwalPelajaran, GuruInitialMap, HariJadwal, Pegawai } from '../types';
import { formatRupiah } from '../utils/security';
import { 
  DAFTAR_KELAS, 
  GURU_INITIALS as DEFAULT_GURU_INITIALS, 
  TIME_SLOTS_BY_DAY, 
  INITIAL_SCHEDULE_SLOTS,
  checkDhuhaBreak
} from '../data/scheduleData';

interface ScheduleManagerProps {
  pegawaiList: Pegawai[];
  scheduleList?: SlotJadwalPelajaran[];
  onUpdateSchedule?: (slots: SlotJadwalPelajaran[]) => void;
  onSyncHoursToAttendance?: (guruId: string, totalHours: number) => void;
}

/**
 * Helper untuk mendeteksi apakah suatu slot merupakan WAKTU ISTIRAHAT / NON-AKADEMIK.
 * Slot istirahat TIDAK dihitung sebagai jam pelajaran (0 JP) dan tidak menambah beban jam mengajar.
 */
export const isSlotBreak = (slot?: Partial<SlotJadwalPelajaran> | null): boolean => {
  if (!slot) return false;
  if (slot.isIstirahat === true) return true;
  if (slot.tipeSlot === 'istirahat') return true;
  if (slot.isNonAkademik === true) return true;

  const mapel = (slot.mataPelajaran || '').toLowerCase();
  const jamKe = (slot.jamKe || '').toLowerCase();
  const kodeGuru = (slot.kodeGuru || '').toUpperCase();

  const breakKeywords = [
    'istirahat', 'sholat', 'shalat', 'dhuha', 'dhuhur', 'dzuhur', 
    'jumat', "jum'at", 'dzikir', 'upacara', 'al-kahfi', 'rehat', 
    'makan', 'evaluasi', 'kepulangan', 'senam', 'tadarus', 'apel', 'piket'
  ];

  const hasBreakKeyword = breakKeywords.some(kw => mapel.includes(kw));
  const isBreakJamKe = jamKe.startsWith('break') || jamKe === 'dhuhur' || jamKe === 'pagi-1' || jamKe === 'pagi-2' || jamKe === 'pulang' || jamKe === 'jumat' || jamKe === 'al-kahfi';
  const isBreakGuru = kodeGuru === 'REST' || kodeGuru === 'BREAK' || kodeGuru === 'ISTIRAHAT';

  return hasBreakKeyword || isBreakJamKe || isBreakGuru;
};

/**
 * Helper informasi visual untuk slot istirahat
 */
export const getBreakVisual = (slot: SlotJadwalPelajaran) => {
  const mapel = (slot.mataPelajaran || '').toLowerCase();
  const jamKe = (slot.jamKe || '').toLowerCase();

  if (mapel.includes('dhuha') || mapel.includes('dhuhur') || mapel.includes('jumat') || mapel.includes('shalat') || mapel.includes('sholat')) {
    return {
      type: 'ibadah',
      iconEmoji: '🕌',
      label: 'Sholat & Ibadah',
      badgeText: '0 JP (Istirahat)',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      containerBg: 'bg-gradient-to-br from-emerald-50/95 via-teal-50/70 to-emerald-100/50 border-emerald-300/90 text-emerald-950',
      accentBorder: 'border-dashed border-emerald-300',
      accentColor: 'text-emerald-700'
    };
  }
  if (mapel.includes('upacara') || mapel.includes('dzikir') || mapel.includes('tadarus') || mapel.includes('adab') || jamKe.startsWith('pagi')) {
    return {
      type: 'karakter',
      iconEmoji: '📖',
      label: 'Pembiasaan & Karakter',
      badgeText: '0 JP (Non-KBM)',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      containerBg: 'bg-gradient-to-br from-sky-50/95 via-indigo-50/60 to-sky-100/50 border-sky-300/90 text-sky-950',
      accentBorder: 'border-dashed border-sky-300',
      accentColor: 'text-sky-700'
    };
  }
  // Default Istirahat
  return {
    type: 'istirahat',
    iconEmoji: '☕',
    label: 'Waktu Istirahat',
    badgeText: '0 JP (Istirahat)',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    containerBg: 'bg-gradient-to-br from-amber-50/95 via-orange-50/60 to-amber-100/50 border-amber-300/90 text-amber-950',
    accentBorder: 'border-dashed border-amber-300',
    accentColor: 'text-amber-700'
  };
};

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  pegawaiList,
  scheduleList: externalScheduleList,
  onUpdateSchedule,
  onSyncHoursToAttendance
}) => {
  // Local state
  const [slots, setSlots] = useState<SlotJadwalPelajaran[]>(() => {
    return externalScheduleList && externalScheduleList.length > 0
      ? externalScheduleList
      : INITIAL_SCHEDULE_SLOTS;
  });

  const [guruList, setGuruList] = useState<GuruInitialMap[]>(DEFAULT_GURU_INITIALS);
  
  // Navigation & View Mode
  const [activeView, setActiveView] = useState<'matrix' | 'by_class' | 'by_teacher' | 'initials'>('matrix');
  const [selectedHari, setSelectedHari] = useState<HariJadwal | 'Semua'>(() => {
    const days: HariJadwal[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    if (todayIndex >= 1 && todayIndex <= 5) {
      return days[todayIndex - 1];
    }
    return 'Senin'; // Default to Senin if weekend
  });
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [selectedGuru, setSelectedGuru] = useState<string>('Semua');
  const [selectedTipeSlot, setSelectedTipeSlot] = useState<'Semua' | 'pelajaran' | 'istirahat'>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotJadwalPelajaran | null>(null);
  const [modalForm, setModalForm] = useState<Partial<SlotJadwalPelajaran>>({
    hari: 'Senin',
    jamKe: '1',
    rentangWaktu: '07:40 - 08:20',
    kelas: '10-A',
    mataPelajaran: '',
    kodeGuru: 'KH',
    guruNama: 'Khalid Fikri Mustanir, A.Md.T., MCF.',
    ruang: 'Lab RPL 1',
    tipeSlot: 'pelajaran',
    isIstirahat: false,
    isNonAkademik: false
  });

  // Modal for Guru Code Management
  const [isGuruModalOpen, setIsGuruModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruInitialMap | null>(null);
  const [guruForm, setGuruForm] = useState<Partial<GuruInitialMap>>({
    kode: '',
    nama: '',
    mataPelajaranUtama: '',
    warnaBadge: 'bg-indigo-600 text-white'
  });

  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Sync back to parent if callback exists
  const updateSlots = (newSlots: SlotJadwalPelajaran[]) => {
    setSlots(newSlots);
    if (onUpdateSchedule) {
      onUpdateSchedule(newSlots);
    }
  };

  const handleResetToOfficial = () => {
    if (window.confirm('Reset jadwal ke matriks standar SK resmi SMK IT Ibnul Qayyim Makassar? Seluruh perubahan lokal akan disinkronkan ulang dengan dokumen.')) {
      updateSlots(INITIAL_SCHEDULE_SLOTS);
      try {
        localStorage.setItem('sim_gaji_schedule_list', JSON.stringify(INITIAL_SCHEDULE_SLOTS));
        localStorage.setItem('sim_gaji_schedule_version', 'v2026.10.01_exact_images_sync');
      } catch (e) {}
      setSyncNotification('Jadwal pelajaran berhasil di-reset & disinkronkan 100% dengan SK resmi!');
      setTimeout(() => setSyncNotification(null), 4000);
    }
  };

  // Check for scheduling conflicts (same teacher or room at the same day & time slot, excluding break slots)
  const conflicts = useMemo(() => {
    const conflictList: { slotId1: string; slotId2: string; type: 'teacher' | 'room'; message: string }[] = [];
    
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];

        if (s1.hari === s2.hari && s1.jamKe === s2.jamKe) {
          // Check teacher conflict (ignore if it is break / non-academic slot)
          if (s1.kodeGuru && s2.kodeGuru && s1.kodeGuru === s2.kodeGuru && !isSlotBreak(s1) && !isSlotBreak(s2)) {
            // Check if it is combined parallel class for sports (PJOK) or character habituation
            const isCombinedParallelPJOK = 
              (s1.mataPelajaran || '').toLowerCase().includes('pjok') && 
              (s2.mataPelajaran || '').toLowerCase().includes('pjok');
            
            const isCombinedAdab = 
              (s1.mataPelajaran || '').toLowerCase().includes('adab') && 
              (s2.mataPelajaran || '').toLowerCase().includes('adab');

            if (!isCombinedParallelPJOK && !isCombinedAdab) {
              conflictList.push({
                slotId1: s1.id,
                slotId2: s2.id,
                type: 'teacher',
                message: `Bentrok Guru (${s1.kodeGuru} - ${s1.guruNama}): mengajar di kelas ${s1.kelas} dan ${s2.kelas} pada hari ${s1.hari} jam ke-${s1.jamKe} (${s1.rentangWaktu})`
              });
            }
          }

          // Check room conflict
          if (s1.ruang && s2.ruang && s1.ruang === s2.ruang && s1.kelas !== s2.kelas && !isSlotBreak(s1) && !isSlotBreak(s2) && !s1.ruang.toLowerCase().includes('lapangan') && !s1.ruang.toLowerCase().includes('masjid')) {
            conflictList.push({
              slotId1: s1.id,
              slotId2: s2.id,
              type: 'room',
              message: `Bentrok Ruangan (${s1.ruang}): digunakan kelas ${s1.kelas} (${s1.mataPelajaran}) dan ${s2.kelas} (${s2.mataPelajaran}) pada ${s1.hari} jam ${s1.rentangWaktu}`
            });
          }
        }
      }
    }
    return conflictList;
  }, [slots]);


  // Filtered slots for table/grid
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      if (selectedHari !== 'Semua' && slot.hari !== selectedHari) return false;
      if (selectedKelas !== 'Semua' && slot.kelas !== selectedKelas) return false;
      if (selectedGuru !== 'Semua' && slot.kodeGuru !== selectedGuru) return false;
      if (selectedTipeSlot === 'pelajaran' && isSlotBreak(slot)) return false;
      if (selectedTipeSlot === 'istirahat' && !isSlotBreak(slot)) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchMapel = (slot.mataPelajaran || '').toLowerCase().includes(q);
        const matchGuru = (slot.guruNama || '').toLowerCase().includes(q) || (slot.kodeGuru || '').toLowerCase().includes(q);
        const matchKelas = (slot.kelas || '').toLowerCase().includes(q);
        const matchRuang = (slot.ruang || '').toLowerCase().includes(q);
        if (!matchMapel && !matchGuru && !matchKelas && !matchRuang) return false;
      }
      return true;
    });
  }, [slots, selectedHari, selectedKelas, selectedGuru, selectedTipeSlot, searchQuery]);

  // Statistics per Teacher (Total JP excludes breaks / non-academic)
  const teacherStats = useMemo(() => {
    return guruList.map(g => {
      // ONLY count slots that are genuine academic lessons (excluding breaks)
      const teacherSlots = slots.filter(s => s.kodeGuru === g.kode && !isSlotBreak(s));
      const breakSlots = slots.filter(s => s.kodeGuru === g.kode && isSlotBreak(s));
      const totalJP = teacherSlots.length;
      const classes = Array.from(new Set(teacherSlots.map(s => s.kelas)));
      const subjects = Array.from(new Set(teacherSlots.map(s => s.mataPelajaran)));
      
      // Calculate estimated monthly teaching honor (Total JP x 4 weeks x Tarif per JP ~ Rp 20.000)
      const tarifPerJP = 20000;
      const monthlyHours = totalJP * 4;
      const estimatedHonor = monthlyHours * tarifPerJP;

      return {
        ...g,
        totalJP,
        breakSlotsCount: breakSlots.length,
        monthlyHours,
        estimatedHonor,
        classes,
        subjects,
        slots: teacherSlots
      };
    }).sort((a, b) => b.totalJP - a.totalJP);
  }, [guruList, slots]);

  // Overall Totals
  const totalAcademicJP = useMemo(() => slots.filter(s => !isSlotBreak(s)).length, [slots]);
  const totalBreakSlots = useMemo(() => slots.filter(s => isSlotBreak(s)).length, [slots]);

  // Open Add Modal
  const handleOpenAddModal = (defaultHari?: HariJadwal, defaultJam?: string, defaultKelas?: string, asBreak = false) => {
    setEditingSlot(null);
    const day = defaultHari || (selectedHari !== 'Semua' ? selectedHari : 'Senin');
    const timeSlotObj = TIME_SLOTS_BY_DAY[day].find(ts => ts.jamKe === defaultJam) || TIME_SLOTS_BY_DAY[day][2];

    setModalForm({
      hari: day,
      jamKe: defaultJam || '1',
      rentangWaktu: timeSlotObj ? timeSlotObj.rentangWaktu : '07:40 - 08:20',
      kelas: defaultKelas || (selectedKelas !== 'Semua' ? selectedKelas : '10-A'),
      mataPelajaran: asBreak ? 'Istirahat & Sholat Dhuha' : '',
      kodeGuru: asBreak ? 'GP' : (guruList[0]?.kode || 'KH'),
      guruNama: asBreak ? 'Guru Piket Sekolah' : (guruList[0]?.nama || ''),
      ruang: asBreak ? 'Masjid / Area Sekolah' : 'Lab RPL 1',
      tipeSlot: asBreak ? 'istirahat' : 'pelajaran',
      isIstirahat: asBreak,
      isNonAkademik: asBreak
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (slot: SlotJadwalPelajaran) => {
    setEditingSlot(slot);
    const breakStatus = isSlotBreak(slot);
    setModalForm({
      ...slot,
      tipeSlot: breakStatus ? 'istirahat' : 'pelajaran',
      isIstirahat: breakStatus,
      isNonAkademik: breakStatus
    });
    setIsModalOpen(true);
  };

  // Handle Save Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.hari || !modalForm.jamKe || !modalForm.kelas || !modalForm.mataPelajaran) {
      alert('Mohon lengkapi isian formulir jadwal.');
      return;
    }

    const isBreak = modalForm.tipeSlot === 'istirahat' || Boolean(modalForm.isIstirahat);
    const selectedG = guruList.find(g => g.kode === modalForm.kodeGuru);
    const guruNama = isBreak 
      ? (modalForm.guruNama || (modalForm.kodeGuru === 'GP' ? 'Guru Piket Sekolah' : selectedG?.nama || '-'))
      : (selectedG ? selectedG.nama : (modalForm.guruNama || modalForm.kodeGuru || '-'));
    const pegawaiId = selectedG?.pegawaiId;

    if (editingSlot) {
      // Update
      const updated = slots.map(s => s.id === editingSlot.id ? {
        ...s,
        ...modalForm,
        isIstirahat: isBreak,
        isNonAkademik: isBreak,
        tipeSlot: isBreak ? 'istirahat' : 'pelajaran',
        guruNama,
        pegawaiId
      } as SlotJadwalPelajaran : s);
      updateSlots(updated);
    } else {
      // Create new
      const newSlot: SlotJadwalPelajaran = {
        id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        hari: modalForm.hari as HariJadwal,
        jamKe: modalForm.jamKe as string,
        rentangWaktu: modalForm.rentangWaktu || '07:40 - 08:20',
        kelas: modalForm.kelas as string,
        mataPelajaran: modalForm.mataPelajaran as string,
        kodeGuru: modalForm.kodeGuru || (isBreak ? 'GP' : 'KH'),
        guruNama,
        pegawaiId,
        ruang: modalForm.ruang || (isBreak ? 'Area Sekolah / Masjid' : 'Kelas ' + modalForm.kelas),
        isIstirahat: isBreak,
        isNonAkademik: isBreak,
        tipeSlot: isBreak ? 'istirahat' : 'pelajaran'
      };
      updateSlots([...slots, newSlot]);
    }

    setIsModalOpen(false);
  };

  // Delete Slot
  const handleDeleteSlot = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus slot jadwal ini?')) {
      const updated = slots.filter(s => s.id !== id);
      updateSlots(updated);
    }
  };

  // Reset to Default Official Schedule
  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan jadwal ke Jadwal Resmi SMK IT Ibnul Qayyim 2026/2027? Semua perubahan khusus akan direset.')) {
      updateSlots(INITIAL_SCHEDULE_SLOTS);
      setGuruList(DEFAULT_GURU_INITIALS);
    }
  };

  // Print schedule
  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pengaturan Jadwal Pelajaran & Waktu Istirahat
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Semester Gasal 2026/2027
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalAcademicJP} JP Mengajar • {totalBreakSlots} Slot Istirahat
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              SMK IT Ibnul Qayyim Makassar • Jurusan Rekayasa Perangkat Lunak & Vokasi
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Reset ke Jadwal Resmi"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <button
            onClick={handleResetToOfficial}
            title="Sinkronkan ulang seluruh jadwal dengan dokumen matriks SK resmi 5 hari"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer border border-emerald-300 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Sinkron Ulang SK Resmi</span>
          </button>

          <button
            onClick={handlePrintSchedule}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Jadwal</span>
          </button>

          <button
            onClick={() => handleOpenAddModal(undefined, undefined, undefined, false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slot Jadwal</span>
          </button>

        </div>
      </div>

      {/* Conflict Banner Alert if any conflicts exist */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                Peringatan: Ditemukan {conflicts.length} Potensi Bentrok Jadwal!
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Sistem mendeteksi jadwal guru atau ruangan yang tumpang tindih pada jam yang sama (slot istirahat dikecualikan):
              </p>
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {conflicts.map((c, idx) => (
                  <li key={idx} className="text-xs text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <span>{c.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Notification banner for sync */}
      {syncNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-3.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncNotification}</span>
          </div>
          <button onClick={() => setSyncNotification(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation View Switcher (Tabs) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'matrix' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriks Lengkap</span>
            </button>

            <button
              onClick={() => setActiveView('by_class')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'by_class' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Jadwal Per Kelas</span>
            </button>

            <button
              onClick={() => setActiveView('by_teacher')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'by_teacher' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Beban Jam Guru (JP)</span>
            </button>

            <button
              onClick={() => setActiveView('initials')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'initials' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Daftar Kode Guru</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari mata pelajaran, guru, kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter controls */}
        {activeView !== 'initials' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Day Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hari:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Semua'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => setSelectedHari(h)}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      selectedHari === h ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Class filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Semua">Semua Kelas ({DAFTAR_KELAS.length})</option>
                {DAFTAR_KELAS.map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            </div>

            {/* Guru filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Guru:</span>
              <select
                value={selectedGuru}
                onChange={(e) => setSelectedGuru(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[180px]"
              >
                <option value="Semua">Semua Guru ({guruList.length})</option>
                {guruList.map(g => (
                  <option key={g.kode} value={g.kode}>[{g.kode}] {(g.nama || '').split(',')[0] || g.nama || g.kode}</option>
                ))}
              </select>
            </div>

            {/* Tipe Slot Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Kategori:</span>
              <select
                value={selectedTipeSlot}
                onChange={(e) => setSelectedTipeSlot(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="pelajaran">📚 Jam Pelajaran Saja (1 JP)</option>
                <option value="istirahat">☕ Waktu Istirahat (0 JP)</option>
              </select>
            </div>

            <div className="ml-auto text-slate-500 text-[11px] flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                {filteredSlots.filter(s => !isSlotBreak(s)).length} JP Mengajar
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-medium">
                {filteredSlots.filter(s => isSlotBreak(s)).length} Istirahat (0 JP)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Staggered Break Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <span>🕌</span> Jadwal Khusus Istirahat 1 & Sholat Dhuha (Senin - Kamis):
            </h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-emerald-900">
              <span className="inline-flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium shadow-2xs">
                <strong className="text-emerald-800">09:00 - 09:40 (Jam 3A):</strong> Kelas 10-A, 11-A, 12-A
              </span>
              <span className="inline-flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg border border-teal-200 font-medium shadow-2xs">
                <strong className="text-teal-800">09:40 - 10:20 (Jam 3B):</strong> Kelas 10-B, 11-B, 12-B
              </span>
            </div>
          </div>
        </div>
        <div className="text-[11px] bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 shrink-0 font-medium">
          💡 <strong>Aturan Sistem:</strong> Waktu istirahat otomatis bernilai <strong>0 JP</strong> & tidak memotong/menambah gaji mengajar
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: MATRIX VIEW (All Slots Grid by Day)                               */}
      {/* ========================================================================= */}
      {activeView === 'matrix' && (
        <div className="space-y-6">
          {(selectedHari === 'Semua' ? (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as HariJadwal[]) : [selectedHari]).map(hariName => {
            const dayTimeSlots = TIME_SLOTS_BY_DAY[hariName];
            const classesToDisplay = selectedKelas === 'Semua' 
              ? ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B']
              : [selectedKelas];

            const academicCount = slots.filter(s => s.hari === hariName && !isSlotBreak(s)).length;
            const breakCount = slots.filter(s => s.hari === hariName && isSlotBreak(s)).length;

            return (
              <div key={hariName} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Header for the day */}
                <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
                    <h3 className="text-base font-bold tracking-wide">
                      JADWAL HARI {hariName.toUpperCase()}
                    </h3>
                    <span className="text-xs bg-slate-800 text-indigo-200 px-2.5 py-0.5 rounded-full border border-slate-700">
                      {academicCount} JP Mengajar • {breakCount} Istirahat (0 JP)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddModal(hariName, undefined, undefined, true)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      title="Tambah slot istirahat khusus (0 JP)"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>+ Istirahat</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddModal(hariName, undefined, undefined, false)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah di {hariName}</span>
                    </button>
                  </div>
                </div>

                {/* Timetable Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-3 w-16 text-center border-r border-slate-200">Jam</th>
                        <th className="py-3 px-4 w-32 border-r border-slate-200">Waktu</th>
                        {classesToDisplay.map(k => (
                          <th key={k} className="py-3 px-4 text-center border-r border-slate-200 last:border-r-0">
                            Kelas {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {dayTimeSlots.map((ts, idx) => {
                        // Official Fixed Break / Prayer Row across all classes
                        if (ts.isBreak) {
                          return (
                            <tr key={idx} className="bg-amber-50/70 text-amber-950 font-medium">
                              <td className="py-2.5 px-3 text-center font-bold text-[11px] text-amber-800 border-r border-amber-200/80 bg-amber-100/60">
                                {ts.jamKe}
                              </td>
                              <td className="py-2.5 px-4 text-[11px] font-semibold text-amber-900 border-r border-amber-200/80 whitespace-nowrap bg-amber-100/40">
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  {ts.rentangWaktu}
                                </span>
                              </td>
                              <td 
                                colSpan={classesToDisplay.length} 
                                className="py-2.5 px-4 text-center text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-t border-b border-amber-300/70 tracking-wide"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-base">☕</span>
                                  <span className="font-bold">{ts.labelBreak || 'Waktu Istirahat / Sholat'}</span>
                                  <span className="font-mono text-[11px] text-amber-800">({ts.rentangWaktu})</span>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                                    0 JP • Non-Akademik
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // Normal or Staggered Lesson / Break Row
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3 text-center font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200">
                              {ts.jamKe}
                            </td>
                            <td className="py-3 px-4 text-[11px] font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {ts.rentangWaktu}
                              </span>
                            </td>

                            {/* Cell for each class */}
                            {classesToDisplay.map(kelasName => {
                              const slotMatch = slots.find(
                                s => s.hari === hariName && s.jamKe === ts.jamKe && s.kelas === kelasName
                              );

                              const dhuhaCheck = checkDhuhaBreak(hariName, ts.jamKe, kelasName);
                              const guruInfo = slotMatch ? guruList.find(g => g.kode === slotMatch.kodeGuru) : null;
                              const isConflict = slotMatch ? conflicts.some(c => c.slotId1 === slotMatch.id || c.slotId2 === slotMatch.id) : false;

                              // If slot is explicitly configured OR auto-detected as a break slot
                              const isBreakSlot = slotMatch ? isSlotBreak(slotMatch) : dhuhaCheck.isBreak;

                              // 1. Staggered Dhuha Break with no explicit override slot yet
                              if (!slotMatch && dhuhaCheck.isBreak) {
                                return (
                                  <td key={kelasName} className="py-2 px-3 border-r border-slate-200 last:border-r-0 align-middle bg-emerald-50/20">
                                    <div className="p-3 rounded-2xl border border-emerald-300/90 bg-emerald-50/60 text-slate-800 flex flex-col justify-center gap-1.5 shadow-2xs relative group min-h-[58px]">
                                      <div className="font-bold text-xs text-emerald-950 leading-tight">
                                        Istirahat 1 & Dhuha
                                      </div>
                                      <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                                        <span className="text-slate-500">Waktu</span>
                                        <span className="font-mono font-semibold text-slate-700">{ts.rentangWaktu}</span>
                                      </div>

                                      {/* Quick hover to convert or edit */}
                                      <button
                                        onClick={() => handleOpenAddModal(hariName, ts.jamKe, kelasName, true)}
                                        className="absolute inset-0 bg-emerald-900/10 hover:bg-emerald-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-emerald-900 cursor-pointer"
                                      >
                                        Edit / Atur Istirahat
                                      </button>
                                    </div>
                                  </td>
                                );
                              }

                              // 2. Explicit Slot Exists
                              if (slotMatch) {
                                // A. Slot is a BREAK / NON-ACADEMIC (WAKTU ISTIRAHAT)
                                if (isBreakSlot) {
                                  return (
                                    <td key={kelasName} className="py-2 px-3 border-r border-slate-200 last:border-r-0 align-top bg-emerald-50/20">
                                      <div 
                                        className="p-3 rounded-2xl border border-emerald-300/90 bg-emerald-50/60 text-slate-800 transition group relative shadow-2xs min-h-[58px] flex flex-col justify-center gap-1.5"
                                      >
                                        <div className="font-bold text-xs text-emerald-950 leading-tight">
                                          {slotMatch.mataPelajaran || 'Istirahat'}
                                        </div>

                                        <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                                          <span className="text-slate-500">Waktu</span>
                                          <span className="font-mono font-semibold text-slate-700">{slotMatch.rentangWaktu || ts.rentangWaktu}</span>
                                        </div>

                                        {/* Quick hover action buttons */}
                                        <div className="absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/95 p-0.5 rounded-md shadow-xs border border-slate-200">
                                          <button
                                            onClick={() => handleOpenEditModal(slotMatch)}
                                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                            title="Edit Slot Istirahat"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSlot(slotMatch.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                            title="Hapus Slot"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  );
                                }

                                // B. Normal Academic Lesson Slot (Dihitung 1 JP)
                                return (
                                  <td key={kelasName} className="py-2 px-3 border-r border-slate-200 last:border-r-0 align-top">
                                    <div 
                                      className={`p-2.5 rounded-xl border transition group relative ${
                                        isConflict 
                                          ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-xs' 
                                          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-1.5">
                                        <span className="font-bold text-slate-900 text-xs leading-tight line-clamp-2">
                                          {slotMatch.mataPelajaran}
                                        </span>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${guruInfo?.warnaBadge || 'bg-slate-700 text-white'}`}>
                                          {slotMatch.kodeGuru}
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-slate-600 truncate mt-1">
                                        {slotMatch.guruNama}
                                      </p>

                                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 text-[10px]">
                                        <span className="text-slate-400 flex items-center gap-1 truncate">
                                          {slotMatch.ruang && (
                                            <>
                                              <Building2 className="w-2.5 h-2.5" />
                                              <span className="truncate">{slotMatch.ruang}</span>
                                            </>
                                          )}
                                        </span>
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded text-[9px] shrink-0 border border-indigo-100">
                                          1 JP
                                        </span>
                                      </div>

                                      {/* Quick hover action buttons */}
                                      <div className="absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/90 p-0.5 rounded-md shadow-xs border border-slate-200">
                                        <button
                                          onClick={() => handleOpenEditModal(slotMatch)}
                                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                          title="Edit Slot"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSlot(slotMatch.id)}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                          title="Hapus Slot"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                );
                              }

                              // 3. Empty Slot
                              return (
                                <td key={kelasName} className="py-2 px-3 border-r border-slate-200 last:border-r-0 align-top">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleOpenAddModal(hariName, ts.jamKe, kelasName, false)}
                                      className="w-full h-14 border border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-300 hover:text-indigo-600 flex flex-col items-center justify-center transition cursor-pointer text-[10px] group"
                                      title="Tambah Jam Pelajaran (1 JP)"
                                    >
                                      <Plus className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />
                                      <span className="text-[9px] font-medium opacity-0 group-hover:opacity-100 transition">+ Mapel</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenAddModal(hariName, ts.jamKe, kelasName, true)}
                                      className="w-8 h-14 border border-dashed border-amber-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/40 text-amber-300 hover:text-amber-700 flex flex-col items-center justify-center transition cursor-pointer text-[10px] group shrink-0"
                                      title="Set sebagai Waktu Istirahat (0 JP)"
                                    >
                                      <Coffee className="w-3 h-3 opacity-40 group-hover:opacity-100 transition" />
                                      <span className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition">0 JP</span>
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BY CLASS TIMETABLE                                                */}
      {/* ========================================================================= */}
      {activeView === 'by_class' && (
        <div className="space-y-6">
          {/* Class selector bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Pilih Kelas:</span>
            {DAFTAR_KELAS.map(k => (
              <button
                key={k}
                onClick={() => setSelectedKelas(k)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  (selectedKelas === 'Semua' ? '10-A' : selectedKelas) === k
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Kelas {k}
              </button>
            ))}
          </div>

          {/* Timetable Card for selected class */}
          {(() => {
            const targetClass = selectedKelas === 'Semua' ? '10-A' : selectedKelas;
            const days: HariJadwal[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const classAcademicJP = slots.filter(s => s.kelas === targetClass && !isSlotBreak(s)).length;
            const classBreakCount = slots.filter(s => s.kelas === targetClass && isSlotBreak(s)).length;

            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Official print header */}
                <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-indigo-400" />
                      <h3 className="text-lg font-bold">JADWAL PELAJARAN KELAS {targetClass}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      SMK IT Ibnul Qayyim Makassar • Tahun Ajaran 2026/2027
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300">
                      Beban: <strong className="text-indigo-300">{classAcademicJP} JP</strong> tatap muka / pekan
                    </div>
                    <div className="text-xs bg-amber-950/80 px-3.5 py-2 rounded-xl border border-amber-700/60 text-amber-200">
                      <strong className="text-amber-300">{classBreakCount}</strong> Slot Istirahat (0 JP)
                    </div>
                  </div>
                </div>

                {/* Day by Day Grid for this Class */}
                <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  {days.map(hari => {
                    const daySlots = slots.filter(s => s.hari === hari && s.kelas === targetClass);
                    const timeSlots = TIME_SLOTS_BY_DAY[hari];
                    const dayAcademicJP = daySlots.filter(s => !isSlotBreak(s)).length;

                    return (
                      <div key={hari} className="p-4 space-y-3">
                        <div className="bg-slate-100 text-slate-800 font-bold text-center py-1.5 px-2 rounded-lg text-xs flex items-center justify-between">
                          <span>{hari.toUpperCase()}</span>
                          <span className="text-[10px] text-indigo-600 bg-white px-1.5 py-0.5 rounded font-bold">
                            {dayAcademicJP} JP
                          </span>
                        </div>

                        <div className="space-y-2">
                          {timeSlots.map((ts, idx) => {
                            if (ts.isBreak) {
                              return (
                                <div key={idx} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-center text-amber-900 font-medium">
                                  ☕ {ts.labelBreak || 'Istirahat'} ({ts.rentangWaktu}) • <strong className="text-amber-800">0 JP</strong>
                                </div>
                              );
                            }

                            const slot = daySlots.find(s => s.jamKe === ts.jamKe);
                            const dhuhaCheck = checkDhuhaBreak(hari, ts.jamKe, targetClass);
                            const guru = slot ? guruList.find(g => g.kode === slot.kodeGuru) : null;
                            const isBreak = slot ? isSlotBreak(slot) : dhuhaCheck.isBreak;

                            // 1. Staggered Break
                            if (!slot && dhuhaCheck.isBreak) {
                              return (
                                <div 
                                  key={idx} 
                                  className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-300/90 shadow-2xs space-y-1.5"
                                >
                                  <div className="font-bold text-xs text-emerald-950 leading-tight">
                                    Istirahat 1 & Dhuha
                                  </div>
                                  <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                                    <span className="text-slate-500">Waktu</span>
                                    <span className="font-mono font-semibold text-slate-700">{ts.rentangWaktu}</span>
                                  </div>
                                </div>
                              );
                            }

                            // 2. Break Slot explicitly added
                            if (slot && isBreak) {
                              return (
                                <div 
                                  key={idx} 
                                  className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-300/90 shadow-2xs space-y-1.5"
                                >
                                  <div className="font-bold text-xs text-emerald-950 leading-tight">
                                    {slot.mataPelajaran || 'Istirahat'}
                                  </div>
                                  <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                                    <span className="text-slate-500">Waktu</span>
                                    <span className="font-mono font-semibold text-slate-700">{slot.rentangWaktu || ts.rentangWaktu}</span>
                                  </div>
                                </div>
                              );
                            }

                            // 3. Regular Teaching Slot
                            return (
                              <div 
                                key={idx}
                                className={`p-2.5 rounded-xl border text-xs transition ${
                                  slot 
                                    ? 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300' 
                                    : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span className="font-bold text-slate-700">Jam {ts.jamKe}</span>
                                  <span>{ts.rentangWaktu}</span>
                                </div>

                                {slot ? (
                                  <div>
                                    <p className="font-bold text-slate-900 leading-tight">
                                      {slot.mataPelajaran}
                                    </p>
                                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                                      <span className="text-[11px] text-slate-600 truncate max-w-[110px]">
                                        {slot.guruNama}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${guru?.warnaBadge || 'bg-slate-700 text-white'}`}>
                                          {slot.kodeGuru}
                                        </span>
                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                          1 JP
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[11px] italic text-slate-400">- Kosong -</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: BY TEACHER WORKLOAD (Beban Jam Mengajar JP & Honor Sync)          */}
      {/* ========================================================================= */}
      {activeView === 'by_teacher' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Total Guru Pengajar</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{guruList.length} Guru</p>
              <p className="text-[11px] text-slate-400 mt-0.5">SMK IT Ibnul Qayyim</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Total Jam Tatap Muka (Pekan)</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {totalAcademicJP} JP / Pekan
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                ✓ Istirahat ({totalBreakSlots} slot) diabaikan dari JP
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Estimasi Total JP Bulanan</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {totalAcademicJP * 4} Jam / Bulan
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Basis 4 pekan efektif</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Standar Tarif Mengajar</span>
              <p className="text-2xl font-black text-amber-600 mt-1">Rp 20.000 / JP</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tunjangan Jam Mengajar</p>
            </div>
          </div>

          {/* Teacher Workload Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Jam Mengajar Guru & Alokasi SIM GAJI (0 JP untuk Istirahat)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Diurutkan berdasarkan beban JP tertinggi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-14 text-center">Kode</th>
                    <th className="py-3 px-4">Nama Guru & Mapel Utama</th>
                    <th className="py-3 px-3 text-center">Beban JP/Pekan</th>
                    <th className="py-3 px-3 text-center">Slot Istirahat</th>
                    <th className="py-3 px-3 text-center">Estimasi JP/Bulan</th>
                    <th className="py-3 px-4">Kelas yang Diajar</th>
                    <th className="py-3 px-4 text-right">Est. Honor Mengajar</th>
                    <th className="py-3 px-4 text-center">Aksi Sinkronisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teacherStats.map((t) => (
                    <tr key={t.kode} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-black px-2 py-1 rounded-md inline-block shadow-2xs ${t.warnaBadge}`}>
                          {t.kode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{t.nama}</p>
                        <p className="text-[11px] text-slate-500">{t.mataPelajaranUtama}</p>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-700 bg-indigo-50/40">
                        {t.totalJP} JP
                      </td>
                      <td className="py-3 px-3 text-center">
                        {t.breakSlotsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            {t.breakSlotsCount} Slot (0 JP)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {t.monthlyHours} Jam
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {t.classes.map(k => (
                            <span key={k} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              {k}
                            </span>
                          ))}
                          {t.classes.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">Belum ada slot</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(t.estimatedHonor)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (onSyncHoursToAttendance && t.pegawaiId) {
                              onSyncHoursToAttendance(t.pegawaiId, t.monthlyHours);
                            }
                            setSyncNotification(`Berhasil menyinkronkan ${t.monthlyHours} JP (${t.totalJP} JP/pekan) untuk ${t.nama} ke kalkulasi presensi SIM GAJI!`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Sinkron ke Gaji</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: GURU INITIALS MASTER REFERENCE                                    */}
      {/* ========================================================================= */}
      {activeView === 'initials' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Daftar Kode & Inisial Guru Pengajar</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lampiran Resmi Jadwal Pelajaran SMK IT Ibnul Qayyim Makassar 2026/2027
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingGuru(null);
                  setGuruForm({ kode: '', nama: '', mataPelajaranUtama: '', warnaBadge: 'bg-indigo-600 text-white' });
                  setIsGuruModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kode Guru</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guruList.map(g => {
                const totalAssigned = slots.filter(s => s.kodeGuru === g.kode && !isSlotBreak(s)).length;
                return (
                  <div 
                    key={g.kode}
                    className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-300 transition shadow-2xs hover:shadow-xs group flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${g.warnaBadge}`}>
                        {g.kode}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {g.nama}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {g.mataPelajaranUtama}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {totalAssigned} JP Aktif (Mengajar)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingGuru(g);
                        setGuruForm({ ...g });
                        setIsGuruModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
                      title="Edit Data Guru"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SLOT JADWAL                                             */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat ? (
                    <Coffee className="w-5 h-5" />
                  ) : (
                    <CalendarDays className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingSlot ? 'Edit Slot Jadwal Pelajaran' : 'Tambah Slot Jadwal Pelajaran'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur mata pelajaran (1 JP) atau waktu istirahat (0 JP)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              {/* Tipe Slot Toggle (Pelajaran 1 JP vs Istirahat 0 JP) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih Kategori Slot Jadwal</label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setModalForm({
                        ...modalForm,
                        tipeSlot: 'pelajaran',
                        isIstirahat: false,
                        isNonAkademik: false,
                        mataPelajaran: modalForm.mataPelajaran?.includes('Istirahat') || modalForm.mataPelajaran?.includes('Sholat') ? '' : modalForm.mataPelajaran
                      });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      !modalForm.isIstirahat && modalForm.tipeSlot !== 'istirahat'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>📚 Jam Pelajaran (1 JP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalForm({
                        ...modalForm,
                        tipeSlot: 'istirahat',
                        isIstirahat: true,
                        isNonAkademik: true,
                        mataPelajaran: modalForm.mataPelajaran || 'Istirahat & Sholat Dhuha',
                        kodeGuru: modalForm.kodeGuru || 'GP'
                      });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      modalForm.isIstirahat || modalForm.tipeSlot === 'istirahat'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-white" />
                    <span>☕ Waktu Istirahat (0 JP)</span>
                  </button>
                </div>
              </div>

              {/* Preset Cepat jika Memilih Waktu Istirahat */}
              {(modalForm.isIstirahat || modalForm.tipeSlot === 'istirahat') && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Pilihan Preset Cepat Istirahat:
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md border border-amber-300">
                      0 JP (Tidak Dihitung Beban Mengajar)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '☕ Istirahat 1 & Dhuha', jam: '3A', waktu: '09:00 - 09:40' },
                      { label: '☕ Istirahat 1 (09:40 - 10:20)', jam: '3B', waktu: '09:40 - 10:20' },
                      { label: '🍱 Istirahat 2 & Makan Siang', jam: 'Break-2', waktu: '11:40 - 12:00' },
                      { label: '🕌 Sholat Dhuhur Berjamaah', jam: 'Dhuhur', waktu: '12:00 - 12:50' },
                      { label: '🕋 Shalat Jumat Berjamaah', jam: 'Jumat', waktu: '12:00 - 13:00' },
                      { label: '📖 Dzikir Pagi & Karakter', jam: 'Pagi-1', waktu: '07:00 - 07:40' },
                      { label: '🇮🇩 Upacara Bendera', jam: 'Pagi-1', waktu: '07:00 - 07:40' },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setModalForm({
                            ...modalForm,
                            mataPelajaran: preset.label.replace(/^[^\s]+\s/, ''),
                            jamKe: preset.jam,
                            rentangWaktu: preset.waktu,
                            tipeSlot: 'istirahat',
                            isIstirahat: true,
                            isNonAkademik: true,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 text-[11px] text-amber-950 font-medium transition cursor-pointer shadow-2xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-800 leading-relaxed pt-1">
                    ℹ️ <strong>Status Sistem:</strong> Slot ini <strong>TIDAK akan dihitung ke total JP</strong> mengajar guru, tidak menambah beban tatap muka kelas, dan tidak dimasukkan ke dalam perhitungan honor jam mengajar di SIM GAJI.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Hari */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={modalForm.hari}
                    onChange={(e) => {
                      const h = e.target.value as HariJadwal;
                      setModalForm({ ...modalForm, hari: h });
                    }}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={modalForm.kelas}
                    onChange={(e) => setModalForm({ ...modalForm, kelas: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  >
                    {DAFTAR_KELAS.map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Jam Ke */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke</label>
                  <select
                    value={modalForm.jamKe}
                    onChange={(e) => {
                      const jam = e.target.value;
                      const day = modalForm.hari || 'Senin';
                      const matchTime = TIME_SLOTS_BY_DAY[day].find(t => t.jamKe === jam);
                      setModalForm({
                        ...modalForm,
                        jamKe: jam,
                        rentangWaktu: matchTime ? matchTime.rentangWaktu : modalForm.rentangWaktu
                      });
                    }}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  >
                    <option value="1">Jam 1 (07:40 - 08:20)</option>
                    <option value="2">Jam 2 (08:20 - 09:00)</option>
                    <option value="3A">Jam 3A (09:00 - 09:40)</option>
                    <option value="3B">Jam 3B (09:40 - 10:20)</option>
                    <option value="4">Jam 4 (10:20 - 11:00)</option>
                    <option value="5">Jam 5 (11:00 - 11:40)</option>
                    <option value="Break-1">Jam Istirahat 1 (11:40 - 12:00)</option>
                    <option value="Break-2">Jam Istirahat 2 (12:00 - 12:50)</option>
                    <option value="Dhuhur">Sholat Dhuhur Berjamaah (12:00 - 12:50)</option>
                    <option value="6">Jam 6 (12:50 - 13:30)</option>
                    <option value="7">Jam 7 (13:30 - 14:10)</option>
                    <option value="8">Jam 8 (14:10 - 14:50)</option>
                    <option value="9">Jam 9 (14:50 - 15:30)</option>
                  </select>
                </div>

                {/* Rentang Waktu */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rentang Waktu</label>
                  <input
                    type="text"
                    value={modalForm.rentangWaktu || ''}
                    onChange={(e) => setModalForm({ ...modalForm, rentangWaktu: e.target.value })}
                    placeholder="07:40 - 08:20"
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {/* Mata Pelajaran / Nama Kegiatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat ? 'Nama Istirahat / Kegiatan Non-JP' : 'Mata Pelajaran'}
                </label>
                <input
                  type="text"
                  value={modalForm.mataPelajaran || ''}
                  onChange={(e) => setModalForm({ ...modalForm, mataPelajaran: e.target.value })}
                  placeholder={modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat ? 'Contoh: Istirahat 1 & Sholat Dhuha' : 'Contoh: Koding dan AI / Pemrograman Web'}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* Guru & Inisial */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat ? 'Guru Pendamping / Piket (Opsional)' : 'Guru Pengajar (Kode Inisial)'}
                </label>
                <select
                  value={modalForm.kodeGuru}
                  onChange={(e) => {
                    const selCode = e.target.value;
                    const matchG = guruList.find(g => g.kode === selCode);
                    setModalForm({
                      ...modalForm,
                      kodeGuru: selCode,
                      guruNama: matchG ? matchG.nama : (selCode === 'GP' ? 'Guru Piket Sekolah' : modalForm.guruNama),
                      pegawaiId: matchG?.pegawaiId
                    });
                  }}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {(modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat) && (
                    <option value="GP">[GP] Guru Piket Sekolah (Tanpa Beban JP)</option>
                  )}
                  {guruList.map(g => (
                    <option key={g.kode} value={g.kode}>
                      [{g.kode}] {g.nama} - {g.mataPelajaranUtama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ruang Kelas / Lab */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  value={modalForm.ruang || ''}
                  onChange={(e) => setModalForm({ ...modalForm, ruang: e.target.value })}
                  placeholder={modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat ? 'Contoh: Masjid / Kantin / Area Sekolah' : 'Contoh: Lab RPL 1 / Kelas 10-A'}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Dhuha Break Notification Warning */}
              {(() => {
                const check = checkDhuhaBreak(
                  modalForm.hari as HariJadwal, 
                  modalForm.jamKe || '', 
                  modalForm.kelas || ''
                );
                if (check.isBreak && !modalForm.isIstirahat && modalForm.tipeSlot !== 'istirahat') {
                  return (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Perhatian: Jadwal Resmi Sholat Dhuha</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Jam <strong>{modalForm.rentangWaktu}</strong> pada hari <strong>{modalForm.hari}</strong> secara standar dijadwalkan sebagai <strong>{check.label}</strong> untuk <strong>Kelas {modalForm.kelas}</strong>.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-semibold shadow-md transition cursor-pointer text-white ${
                    modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  {editingSlot ? 'Simpan Perubahan' : (modalForm.tipeSlot === 'istirahat' || modalForm.isIstirahat ? 'Simpan Waktu Istirahat (0 JP)' : 'Tambahkan Jam Pelajaran (1 JP)')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GURU INITIAL CONFIGURATION                                         */}
      {/* ========================================================================= */}
      {isGuruModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingGuru ? 'Edit Kode Guru' : 'Tambah Kode Guru Baru'}
              </h3>
              <button 
                onClick={() => setIsGuruModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!guruForm.kode || !guruForm.nama) {
                  alert('Lengkapi kode dan nama guru.');
                  return;
                }

                if (editingGuru) {
                  const updated = guruList.map(g => g.kode === editingGuru.kode ? { ...g, ...guruForm } as GuruInitialMap : g);
                  setGuruList(updated);
                } else {
                  setGuruList([...guruList, guruForm as GuruInitialMap]);
                }
                setIsGuruModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Inisial (Maks 3 Huruf)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={guruForm.kode || ''}
                  onChange={(e) => setGuruForm({ ...guruForm, kode: e.target.value.toUpperCase() })}
                  placeholder="Contoh: KH"
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 uppercase font-black text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={guruForm.nama || ''}
                  onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
                  placeholder="Contoh: Khalid Fikri Mustanir, A.Md.T., MCF."
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Utama</label>
                <input
                  type="text"
                  value={guruForm.mataPelajaranUtama || ''}
                  onChange={(e) => setGuruForm({ ...guruForm, mataPelajaranUtama: e.target.value })}
                  placeholder="Contoh: Koding dan AI / Basis Data"
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGuruModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
