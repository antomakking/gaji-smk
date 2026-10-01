import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  AlertCircle, 
  Check, 
  Edit3, 
  Save, 
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Fingerprint,
  FileText,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Filter,
  UploadCloud,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Download,
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { 
  Pegawai, 
  RekapPresensi, 
  LogPresensiHarian, 
  PengajuanCutiIzin, 
  LemburPegawai,
  StatusKehadiranHarian,
  JenisCutiIzin,
  KategoriLembur,
  MetodePresensi,
  LogInfal
} from '../types';
import { formatRupiah, formatNumber, getPayrollCutoffDates, getTodayDateString } from '../utils/security';
import { DailyAttendanceSheet } from './DailyAttendanceSheet';
import { InfalManager } from './InfalManager';
import { TimeInput24 } from './TimeInput24';
import { PeriodSelector } from './PeriodSelector';

interface AttendanceManagerProps {
  pegawaiList: Pegawai[];
  presensiList: RekapPresensi[];
  dailyLogs: LogPresensiHarian[];
  leaveRequests: PengajuanCutiIzin[];
  overtimeRecords: LemburPegawai[];
  infalList?: LogInfal[];
  onUpdatePresensi: (presensi: RekapPresensi) => void;
  onRefreshAndRecalculate: () => void;
  onAddDailyLog: (log: LogPresensiHarian) => void;
  onBatchSaveDailyLogs?: (logs: LogPresensiHarian[], dateLabel: string) => void;
  onAddLeaveRequest: (req: PengajuanCutiIzin) => void;
  onUpdateLeaveStatus: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
  onAddOvertime: (ot: LemburPegawai) => void;
  onUpdateOvertimeStatus: (id: string, status: 'approved' | 'rejected') => void;
  onDeleteOvertime?: (id: string) => void;
  onDeleteLeaveRequest?: (id: string) => void;
  onDeleteDailyLog?: (id: string) => void;
  onBatchSyncFromDailyLogs: () => void;
  onAddInfal?: (infal: LogInfal) => void;
  onDeleteInfal?: (id: string) => void;
  onUpdateInfalStatus?: (id: string, status: 'approved' | 'rejected') => void;
  selectedBulan?: number;
  selectedTahun?: number;
  onSelectPeriod?: (bulan: number, tahun: number) => void;
  availablePeriods?: { bulan: number; tahun: number; count: number; status?: string }[];
  initialSubTab?: 'input_harian' | 'infal' | 'rekap' | 'harian' | 'cuti' | 'lembur' | 'mesin';
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  pegawaiList,
  presensiList,
  dailyLogs,
  leaveRequests,
  overtimeRecords,
  infalList = [],
  onUpdatePresensi,
  onRefreshAndRecalculate,
  onAddDailyLog,
  onBatchSaveDailyLogs,
  onAddLeaveRequest,
  onUpdateLeaveStatus,
  onAddOvertime,
  onUpdateOvertimeStatus,
  onDeleteOvertime,
  onDeleteLeaveRequest,
  onDeleteDailyLog,
  onBatchSyncFromDailyLogs,
  onAddInfal = () => {},
  onDeleteInfal = () => {},
  onUpdateInfalStatus = () => {},
  selectedBulan = (new Date().getMonth() + 1),
  selectedTahun = (new Date().getFullYear()),
  onSelectPeriod,
  availablePeriods = [],
  initialSubTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input_harian' | 'infal' | 'rekap' | 'harian' | 'cuti' | 'lembur' | 'mesin'>(initialSubTab || 'input_harian');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>(() => getTodayDateString());
  const [filterPegawaiId, setFilterPegawaiId] = useState<string>('all');

  const cutoffInfo = getPayrollCutoffDates(selectedBulan, selectedTahun);
  
  // State for Rekap Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RekapPresensi>>({});

  // State for Modals
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showAddOvertimeModal, setShowAddOvertimeModal] = useState(false);
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // New Log Form State
  const [newLog, setNewLog] = useState<{
    pegawaiId: string;
    tanggal: string;
    jamMasuk: string;
    jamKeluar: string;
    metode: MetodePresensi;
    lokasiTerminal: string;
    keterangan: string;
  }>({
    pegawaiId: pegawaiList[0]?.id || '',
    tanggal: getTodayDateString(),
    jamMasuk: '07:00:00',
    jamKeluar: '16:00:00',
    metode: 'biometric_fingerprint',
    lokasiTerminal: 'Lobby Kantor Guru (Mesin Solution F100)',
    keterangan: '',
  });

  // New Leave Form State
  const [newLeave, setNewLeave] = useState<{
    pegawaiId: string;
    jenis: JenisCutiIzin;
    tanggalMulai: string;
    tanggalSelesai: string;
    jumlahHari: number;
    alasan: string;
    lampiranDokumenUrl: string;
  }>({
    pegawaiId: pegawaiList[0]?.id || '',
    jenis: 'cuti_tahunan',
    tanggalMulai: '2026-08-26',
    tanggalSelesai: '2026-08-26',
    jumlahHari: 1,
    alasan: '',
    lampiranDokumenUrl: '',
  });

  // New Overtime Form State
  const [newOvertime, setNewOvertime] = useState<{
    pegawaiId: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    durasiJam: number;
    kategori: KategoriLembur;
    deskripsiTugas: string;
  }>({
    pegawaiId: pegawaiList[0]?.id || '',
    tanggal: '2026-08-25',
    jamMulai: '16:00',
    jamSelesai: '19:00',
    durasiJam: 3,
    kategori: 'perawatan_lab_it',
    deskripsiTugas: '',
  });

  const startEdit = (pres: RekapPresensi, initialValues?: Partial<RekapPresensi>) => {
    setEditingId(pres.id);
    setEditForm({ ...pres, ...initialValues });
  };

  const updateEditField = (updates: Partial<RekapPresensi>) => {
    const nextForm = { ...editForm, ...updates };
    setEditForm(nextForm);
    if (editingId) {
      onUpdatePresensi(nextForm as RekapPresensi);
    }
  };

  const handleSaveRekap = () => {
    if (editingId && editForm) {
      onUpdatePresensi(editForm as RekapPresensi);
      setEditingId(null);
    }
  };

  const handleCreateDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const peg = pegawaiList.find(p => p.id === newLog.pegawaiId);
    if (!peg) return;

    // Detect late minutes (threshold: 07:00:00)
    const [inHours, inMinutes] = newLog.jamMasuk.split(':').map(Number);
    const standardStartMinutes = 7 * 60; // 07:00
    const actualInMinutes = inHours * 60 + inMinutes;
    const menitTerlambat = Math.max(0, actualInMinutes - standardStartMinutes);

    // Detect Overtime (after 16:00)
    let jamLembur = 0;
    if (newLog.jamKeluar) {
      const [outHours, outMinutes] = newLog.jamKeluar.split(':').map(Number);
      const standardEndMinutes = 16 * 60; // 16:00
      const actualOutMinutes = outHours * 60 + outMinutes;
      if (actualOutMinutes > standardEndMinutes) {
        jamLembur = Math.round(((actualOutMinutes - standardEndMinutes) / 60) * 10) / 10;
      }
    }

    let status: StatusKehadiranHarian = 'hadir_tepat_waktu';
    if (menitTerlambat > 0) status = 'terlambat';

    const logRecord: LogPresensiHarian = {
      id: `log-${Date.now()}`,
      pegawaiId: newLog.pegawaiId,
      tanggal: newLog.tanggal,
      jamMasuk: newLog.jamMasuk,
      jamKeluar: newLog.jamKeluar,
      status,
      menitTerlambat,
      menitPulangCepat: 0,
      jamLembur,
      metode: newLog.metode,
      lokasiTerminal: newLog.lokasiTerminal,
      keterangan: newLog.keterangan,
      isVerified: true,
    };

    onAddDailyLog(logRecord);
    setShowAddLogModal(false);
    setNewLog({
      ...newLog,
      keterangan: '',
    });
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const peg = pegawaiList.find(p => p.id === newLeave.pegawaiId);
    if (!peg) return;

    const berdampakPotonganGaji = newLeave.jenis === 'izin_pribadi' || newLeave.jenis === 'sakit_tanpa_skd';

    const leaveRecord: PengajuanCutiIzin = {
      id: `cuti-${Date.now()}`,
      pegawaiId: newLeave.pegawaiId,
      pegawaiNama: peg.nama,
      jenis: newLeave.jenis,
      tanggalMulai: newLeave.tanggalMulai,
      tanggalSelesai: newLeave.tanggalSelesai,
      jumlahHari: Number(newLeave.jumlahHari),
      alasan: newLeave.alasan,
      lampiranDokumenUrl: newLeave.lampiranDokumenUrl || undefined,
      status: 'pending',
      berdampakPotonganGaji,
      createdAt: new Date().toISOString(),
    };

    onAddLeaveRequest(leaveRecord);
    setShowAddLeaveModal(false);
  };

  const handleCreateOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    const peg = pegawaiList.find(p => p.id === newOvertime.pegawaiId);
    if (!peg) return;

    const tarifPerJam = peg.tarifLemburPerJam || 20000;
    const durasi = Number(newOvertime.durasiJam);
    const totalHonor = durasi * tarifPerJam;

    const overtimeRecord: LemburPegawai = {
      id: `lmb-${Date.now()}`,
      pegawaiId: newOvertime.pegawaiId,
      pegawaiNama: peg.nama,
      tanggal: newOvertime.tanggal,
      jamMulai: newOvertime.jamMulai,
      jamSelesai: newOvertime.jamSelesai,
      durasiJam: durasi,
      kategori: newOvertime.kategori,
      deskripsiTugas: newOvertime.deskripsiTugas,
      tarifPerJam,
      totalHonor,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onAddOvertime(overtimeRecord);
    setShowAddOvertimeModal(false);
  };

  const handleSimulateSyncMachine = () => {
    setIsSimulatingSync(true);
    setTimeout(() => {
      onBatchSyncFromDailyLogs();
      setIsSimulatingSync(false);
      setSyncFeedback('Sinkronisasi Berhasil: 7 Mesin Biometrik & Terminal RFID telah menarik 142 log kehadiran terbaru. Rekapitulasi penggajian telah disesuaikan secara otomatis!');
      setTimeout(() => setSyncFeedback(null), 6000);
    }, 1200);
  };

  // Filtered Daily Logs
  const filteredDailyLogs = dailyLogs.filter(log => {
    const peg = pegawaiList.find(p => p.id === log.pegawaiId);
    const matchSearch = peg ? peg.nama.toLowerCase().includes(searchTerm.toLowerCase()) || peg.nip.includes(searchTerm) : true;
    const matchDate = filterDate ? log.tanggal === filterDate : true;
    const matchPeg = filterPegawaiId !== 'all' ? log.pegawaiId === filterPegawaiId : true;
    return matchSearch && matchDate && matchPeg;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Subtabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Pusat Integrasi Absensi & Jam Kerja Pegawai
            </h2>
            {onSelectPeriod && (
              <PeriodSelector
                selectedBulan={selectedBulan}
                selectedTahun={selectedTahun}
                onSelectPeriod={onSelectPeriod}
                availablePeriods={availablePeriods}
              />
            )}
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-600" />
              <span>Biometric & RFID Engine</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">Periode Cut-Off:</span>
              <strong className="text-indigo-900 font-mono">{cutoffInfo.cutoffLabelLong}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-900">
              <span className="text-emerald-700 font-medium">Jadwal Penggajian:</span>
              <strong className="font-mono">{cutoffInfo.paymentLabel}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateSyncMachine}
            disabled={isSimulatingSync}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingSync ? 'animate-spin' : ''}`} />
            <span>{isSimulatingSync ? 'Menarik Data...' : 'Tarik Log Mesin Absensi'}</span>
          </button>

          <button
            onClick={onRefreshAndRecalculate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hitung Ulang & Sync Gaji</span>
          </button>
        </div>
      </div>

      {/* Sync Alert Banner */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Jam Masuk Senin - Jumat</div>
            <div className="text-xs font-bold text-slate-800">07:00 WITA</div>
            <div className="text-[9px] text-slate-400">Denda 1 menit = Rp 1.500</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Denda Ketidakhadiran</div>
            <div className="text-xs font-bold text-rose-700">Rp 50.000 / Alpha</div>
            <div className="text-[9px] text-slate-400">Tanpa surat resmi</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Hak Cuti & Sakit SKD</div>
            <div className="text-xs font-bold text-emerald-700">Gaji Pokok 100%</div>
            <div className="text-[9px] text-slate-400">Transport berbasis hadir</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Honor Jam Lembur</div>
            <div className="text-xs font-bold text-amber-800">Rp. 20.000 / jam</div>
            <div className="text-[9px] text-slate-400">Kegiatan diluar jam kerja</div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Switcher Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap items-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveSubTab('input_harian')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'input_harian'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Input Presensi Manual (Berdasarkan Hari)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('infal')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'infal'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
          <span>Manajemen Infal / Guru Pengganti ({infalList.length})</span>
          <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">Rp 7.500/JP</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rekap')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'rekap'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Rekapitulasi Bulanan & Sinkronisasi Gaji</span>
        </button>

        <button
          onClick={() => setActiveSubTab('harian')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'harian'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Log Presensi Individu & Terminal Biometrik ({dailyLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cuti')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'cuti'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Manajemen Cuti & Izin ({leaveRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lembur')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'lembur'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Klaim & Rekap Jam Lembur ({overtimeRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mesin')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'mesin'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Terminal Hardware & Importer CSV</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 0: INPUT PRESENSI MANUAL BERDASARKAN HARI */}
      {/* ========================================================================= */}
      {activeSubTab === 'input_harian' && (
        <DailyAttendanceSheet
          pegawaiList={pegawaiList}
          dailyLogs={dailyLogs}
          onBatchSaveDailyLogs={onBatchSaveDailyLogs}
          onAddDailyLog={onAddDailyLog}
          onRefreshAndRecalculate={onRefreshAndRecalculate}
          selectedBulan={selectedBulan}
          selectedTahun={selectedTahun}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 0B: MANAJEMEN INFAL (GURU PENGGANTI - RP 7.500 / JP) */}
      {/* ========================================================================= */}
      {activeSubTab === 'infal' && (
        <InfalManager
          pegawaiList={pegawaiList}
          infalList={infalList}
          onAddInfal={onAddInfal}
          onDeleteInfal={onDeleteInfal}
          onUpdateInfalStatus={onUpdateInfalStatus}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: REKAPITULASI BULANAN */}
      {/* ========================================================================= */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari guru / tendik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-semibold border border-indigo-100">
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cut-Off: <strong>{cutoffInfo.cutoffLabelShort}</strong></span>
              </span>
              <span>Total <strong>{pegawaiList.length}</strong> pegawai</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Guru / Staf</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Hadir</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Dinas Luar</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Sakit</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Izin</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Cuti</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Alpha</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Terlambat</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Jam Mengajar (JP)</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-indigo-700 bg-indigo-50/50 uppercase tracking-wider text-center" title={`Infal Guru Pengganti / Digantikan Periode Cut-Off: ${cutoffInfo.cutoffLabelShort} (23 s/d 22)`}>
                      Infal (JP)
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Jam Lembur</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Estimasi Honor Lembur</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pegawaiList
                    .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nip.includes(searchTerm))
                    .map((peg) => {
                      const pres = presensiList.find(p => p.pegawaiId === peg.id && p.bulan === selectedBulan && p.tahun === selectedTahun) || 
                        presensiList.find(p => p.pegawaiId === peg.id) || {
                        id: `prs-${peg.id}-${selectedBulan}-${selectedTahun}`,
                        pegawaiId: peg.id,
                        bulan: selectedBulan,
                        tahun: selectedTahun,
                        totalHariEfektif: 26,
                        hadir: 0,
                        sakit: 0,
                        izin: 0,
                        cuti: 0,
                        dinasLuar: 0,
                        alpha: 0,
                        menitTerlambat: 0,
                        jamMengajarRencana: 24,
                        jamMengajarRealisasi: 24,
                        jamLemburTotal: 0,
                        honorLemburTotal: 0,
                        potonganIzinTidakResmi: 0,
                        updatedAt: new Date().toISOString(),
                      };

                      // Filter daily logs specifically within this Cut-Off period: cutoffInfo.startDate (23 M-1) s/d cutoffInfo.endDate (22 M)
                      const cutoffDailyLogs = (dailyLogs || []).filter(
                        (l) => l.pegawaiId === peg.id && l.tanggal >= cutoffInfo.startDate && l.tanggal <= cutoffInfo.endDate
                      );

                      const hasDailyLogsInCutoff = cutoffDailyLogs.length > 0;

                      // Akumulasi data dalam periode Cut-Off:
                      const statHadir = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => ['hadir_tepat_waktu', 'terlambat', 'izin_terlambat', 'pulang_cepat', 'dinas_luar', 'pelatihan'].includes(l.status)).length
                        : (pres.hadir || 0);

                      const statDinasLuar = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => ['dinas_luar', 'pelatihan'].includes(l.status)).length
                        : (pres.dinasLuar || 0);

                      const statSakit = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => ['sakit_skd', 'sakit_tanpa_skd'].includes(l.status)).length
                        : (pres.sakit || 0);

                      const statIzin = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => ['izin_resmi', 'izin_pribadi'].includes(l.status)).length
                        : (pres.izin || 0);

                      const statCuti = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => ['cuti_tahunan', 'cuti_khusus'].includes(l.status)).length
                        : (pres.cuti || 0);

                      const statAlpha = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => l.status === 'alpha').length
                        : (pres.alpha || 0);

                      const statTerlambat = hasDailyLogsInCutoff
                        ? cutoffDailyLogs.filter(l => l.status === 'terlambat').reduce((sum, l) => sum + (Number(l.menitTerlambat) || 0), 0)
                        : (pres.menitTerlambat || 0);

                      // Data Overtime / Lembur pada periode cut-off
                      const activePeriodOvertime = (overtimeRecords || []).filter(
                        (ot) => ot.pegawaiId === peg.id && ot.status === 'approved' && ot.tanggal >= cutoffInfo.startDate && ot.tanggal <= cutoffInfo.endDate
                      );
                      const statJamLembur = activePeriodOvertime.length > 0
                        ? activePeriodOvertime.reduce((sum, ot) => sum + (Number(ot.durasiJam) || 0), 0)
                        : (pres.jamLemburTotal || 0);

                      const isEditing = editingId === pres.id;
                      const currentJamLembur = isEditing ? (editForm.jamLemburTotal ?? statJamLembur) : statJamLembur;
                      const estLembur = currentJamLembur * (peg.tarifLemburPerJam || 20000);

                      // Data Infal pada periode cut-off penggajian (tgl 23 s/d 22 bulan berikutnya)
                      const activePeriodInfals = (infalList || []).filter(
                        (item) => item.tanggal >= cutoffInfo.startDate && item.tanggal <= cutoffInfo.endDate && item.status !== 'rejected'
                      );
                      const infalMenggantikan = activePeriodInfals.filter((i) => i.guruPenggantiId === peg.id);
                      const infalDigantikan = activePeriodInfals.filter((i) => i.guruDigantikanId === peg.id || i.guruAbsenId === peg.id);

                      const totalJpMenggantikan = infalMenggantikan.reduce((sum, item) => sum + (Number(item.jumlahJp) || 0), 0);
                      const totalJpDigantikan = infalDigantikan.reduce((sum, item) => sum + (Number(item.jumlahJp) || 0), 0);

                      return (
                        <tr key={peg.id} className="hover:bg-slate-50/70 transition text-xs">
                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{peg.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{peg.nip} • {peg.jabatanUtama}</div>
                          </td>

                          {/* Hadir */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.hadir ?? statHadir}
                                onChange={(e) => updateEditField({ hadir: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-12 text-center p-1 text-xs border rounded-md border-slate-300 font-bold focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {statHadir}
                              </span>
                            )}
                          </td>

                          {/* Dinas Luar */}
                          <td className="py-3 px-3 text-center text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.dinasLuar ?? statDinasLuar}
                                onChange={(e) => updateEditField({ dinasLuar: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-10 text-center p-1 text-xs border rounded-md border-slate-300 focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              statDinasLuar
                            )}
                          </td>

                          {/* Sakit */}
                          <td className="py-3 px-3 text-center text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.sakit ?? statSakit}
                                onChange={(e) => updateEditField({ sakit: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-10 text-center p-1 text-xs border rounded-md border-slate-300 focus:ring-1 focus:ring-amber-500"
                              />
                            ) : (
                              statSakit
                            )}
                          </td>

                          {/* Izin */}
                          <td className="py-3 px-3 text-center text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.izin ?? statIzin}
                                onChange={(e) => updateEditField({ izin: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-10 text-center p-1 text-xs border rounded-md border-slate-300 focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              statIzin
                            )}
                          </td>

                          {/* Cuti */}
                          <td className="py-3 px-3 text-center text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.cuti ?? statCuti}
                                onChange={(e) => updateEditField({ cuti: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-10 text-center p-1 text-xs border rounded-md border-slate-300 focus:ring-1 focus:ring-sky-500"
                              />
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded font-semibold ${statCuti > 0 ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}>
                                {statCuti}
                              </span>
                            )}
                          </td>

                          {/* Alpha */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.alpha ?? statAlpha}
                                onChange={(e) => updateEditField({ alpha: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-10 text-center p-1 text-xs border rounded-md border-rose-300 text-rose-700 font-bold focus:ring-1 focus:ring-rose-500"
                              />
                            ) : (
                              <span className={`px-2 py-0.5 rounded font-bold ${statAlpha > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-500'}`}>
                                {statAlpha}
                              </span>
                            )}
                          </td>

                          {/* Terlambat */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.menitTerlambat ?? statTerlambat}
                                onChange={(e) => updateEditField({ menitTerlambat: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-12 text-center p-1 text-xs border rounded-md border-slate-300 font-mono focus:ring-1 focus:ring-amber-500"
                              />
                            ) : (
                              <span className={`font-mono ${statTerlambat > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                                {statTerlambat} m
                              </span>
                            )}
                          </td>

                          {/* JP */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.jamMengajarRealisasi ?? (pres.jamMengajarRealisasi || 0)}
                                onChange={(e) => updateEditField({ jamMengajarRealisasi: Number(e.target.value) })}
                                onBlur={handleSaveRekap}
                                className="w-12 text-center p-1 text-xs border rounded-md border-indigo-300 font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {pres.jamMengajarRealisasi || 0} JP
                              </span>
                            )}
                          </td>

                          {/* Infal (JP) - Periode Cut-Off 23 s/d 22 */}
                          <td className="py-3 px-3 text-center">
                            {totalJpMenggantikan === 0 && totalJpDigantikan === 0 ? (
                              <span className="text-slate-400 font-mono text-[11px]">0 JP</span>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                {totalJpMenggantikan > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap shadow-2xs"
                                    title={`Menggantikan ${totalJpMenggantikan} JP pada periode cut-off ${cutoffInfo.cutoffLabelShort} (+Rp ${formatNumber(totalJpMenggantikan * 7500)})`}
                                  >
                                    <span>+{totalJpMenggantikan} JP</span>
                                  </span>
                                )}
                                {totalJpDigantikan > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap shadow-2xs"
                                    title={`Digantikan ${totalJpDigantikan} JP pada periode cut-off ${cutoffInfo.cutoffLabelShort} (-Rp ${formatNumber(totalJpDigantikan * 7500)})`}
                                  >
                                    <span>-{totalJpDigantikan} JP</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Jam Lembur */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                value={editForm.jamLemburTotal ?? statJamLembur}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  updateEditField({ 
                                    jamLemburTotal: val,
                                    honorLemburTotal: val * (peg.tarifLemburPerJam || 20000)
                                  });
                                }}
                                onBlur={handleSaveRekap}
                                className="w-12 text-center p-1 text-xs border rounded-md border-amber-300 font-bold text-amber-700 focus:ring-1 focus:ring-amber-500"
                              />
                            ) : (
                              <span className={`font-bold px-2 py-0.5 rounded ${statJamLembur > 0 ? 'bg-amber-50 text-amber-800' : 'text-slate-400'}`}>
                                {statJamLembur} Jam
                              </span>
                            )}
                          </td>

                          {/* Estimasi Honor Lembur */}
                          <td className="py-3 px-4 text-right font-bold text-amber-800">
                            {formatRupiah(estLembur)}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={handleSaveRekap}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded transition cursor-pointer"
                                  title="Simpan"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="bg-slate-200 text-slate-700 p-1 rounded hover:bg-slate-300 text-xs font-bold cursor-pointer"
                                  title="Batal"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(pres, {
                                  hadir: statHadir,
                                  dinasLuar: statDinasLuar,
                                  sakit: statSakit,
                                  izin: statIzin,
                                  cuti: statCuti,
                                  alpha: statAlpha,
                                  menitTerlambat: statTerlambat,
                                  jamLemburTotal: statJamLembur,
                                  honorLemburTotal: statJamLembur * (peg.tarifLemburPerJam || 20000),
                                })}
                                className="p-1 rounded text-slate-500 hover:text-indigo-700 hover:bg-slate-100 transition cursor-pointer"
                                title="Ubah Data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: LOG PRESENSI HARIAN & BIOMETRIK */}
      {/* ========================================================================= */}
      {activeSubTab === 'harian' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Filter Tanggal</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Filter Pegawai</label>
                <select
                  value={filterPegawaiId}
                  onChange={(e) => setFilterPegawaiId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white"
                >
                  <option value="all">Semua Pegawai</option>
                  {pegawaiList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowAddLogModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 self-start md:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Log Manual / Tap Terminal</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pegawai</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Tanggal</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Jam Masuk</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Jam Keluar</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status Kehadiran</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Keterlambatan</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Jam Lembur</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode & Terminal</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan / Keterangan</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-xs text-slate-400">
                        Tidak ada log presensi harian pada tanggal dan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyLogs.map(log => {
                      const peg = pegawaiList.find(p => p.id === log.pegawaiId);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition text-xs">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {peg ? peg.nama : log.pegawaiId}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
                            {log.tanggal}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                            {log.jamMasuk}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600">
                            {log.jamKeluar || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              log.status === 'hadir_tepat_waktu'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'terlambat'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : log.status === 'izin_terlambat'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : log.status === 'bukan_hari_kerja'
                                ? 'bg-slate-100 text-slate-700 border-slate-300 font-bold'
                                : log.status === 'libur_sekolah'
                                 ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                                 : log.status === 'dinas_luar'
                                ? 'bg-teal-50 text-teal-700 border-teal-200 font-bold'
                                : log.status === 'pelatihan'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                                : log.status === 'sakit_skd'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : log.status === 'alpha'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {log.status === 'bukan_hari_kerja' 
                                ? 'BUKAN HARI KERJA (OFF)' 
                                : log.status === 'izin_terlambat'
                                ? '⏱️ IZIN TERLAMBAT (BEBAS DENDA)'
                                : log.status === 'dinas_luar'
                                ? '🏢 DINAS LUAR'
                                : log.status === 'pelatihan'
                                ? '🎓 PELATIHAN / DIKLAT'
                                : log.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            {log.menitTerlambat > 0 ? (
                              <span className="text-rose-600">+{log.menitTerlambat} menit</span>
                            ) : (
                              <span className="text-emerald-600">0 m</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            {log.jamLembur > 0 ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{log.jamLembur} Jam</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            <div className="font-semibold text-slate-800">{log.lokasiTerminal}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{log.metode.replace(/_/g, ' ')}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                            {log.keterangan || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {onDeleteDailyLog && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus log presensi tanggal ${log.tanggal} untuk ${peg ? peg.nama : log.pegawaiId}?`)) {
                                    onDeleteDailyLog(log.id);
                                  }
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Log Presensi Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MANAJEMEN CUTI & IZIN */}
      {/* ========================================================================= */}
      {activeSubTab === 'cuti' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Daftar Pengajuan Cuti, Izin Dinas, & Sakit Dokter (SKD)</h3>
              <p className="text-[11px] text-slate-500">Cuti resmi & sakit ber-SKD disetujui Kepala Sekolah tidak memotong Gaji Pokok atau dikenai denda.</p>
            </div>

            <button
              onClick={() => setShowAddLeaveModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ajukan Cuti / Izin Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pegawai</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Cuti/Izin</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Rentang Tanggal</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Durasi</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alasan & Dokumen</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Pengaruh Gaji</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status Approval</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition text-xs">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {req.pegawaiNama}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <span className="capitalize">{req.jenis.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        {req.tanggalMulai} {req.tanggalMulai !== req.tanggalSelesai ? `s/d ${req.tanggalSelesai}` : ''}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-700">
                        {req.jumlahHari} Hari
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">
                        <div>{req.alasan}</div>
                        {req.lampiranDokumenUrl && (
                          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Dokumen SKD Terlampir</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {req.berdampakPotonganGaji ? (
                          <span className="text-rose-700 bg-rose-50 text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200">
                            Potong Gaji
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200">
                            Gaji Pokok Utuh
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {req.status === 'approved' ? 'DISETUJUI' : req.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => onUpdateLeaveStatus(req.id, 'approved', 'Disetujui oleh Kepala Sekolah')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-md text-[10px] font-bold flex items-center gap-1 px-2 cursor-pointer transition shadow-2xs"
                                title="Setujui Pengajuan"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => onUpdateLeaveStatus(req.id, 'rejected', 'Alasan tidak lengkap')}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md text-[10px] font-bold flex items-center gap-1 px-2 cursor-pointer transition shadow-2xs"
                                title="Tolak Pengajuan"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Tolak</span>
                              </button>
                            </>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {req.approvedBy?.split(' ')[0] || 'Admin'}
                            </div>
                          )}

                          {onDeleteLeaveRequest && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus data pengajuan ${req.jenis.replace(/_/g, ' ')} untuk ${req.pegawaiNama} (${req.tanggalMulai})?`)) {
                                  onDeleteLeaveRequest(req.id);
                                }
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus Baris Pengajuan Cuti/Izin Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
      {/* SUB-TAB 4: KLAIM & REKAP JAM LEMBUR */}
      {/* ========================================================================= */}
      {activeSubTab === 'lembur' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Klaim & Penugasan Lembur Guru / Tenaga Kependidikan</h3>
              <p className="text-[11px] text-slate-500">Mencakup tugas bimbingan LKS IT, maintenance server lab TKJ, penataan administrasi Dapodik, dan pendampingan UKK.</p>
            </div>

            <button
              onClick={() => setShowAddOvertimeModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Penugasan Lembur</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pegawai</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Tanggal</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Jam Mulai - Selesai</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Durasi</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori & Deskripsi</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Tarif / Jam</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total Honor Lembur</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overtimeRecords.map(ot => (
                    <tr key={ot.id} className="hover:bg-slate-50/70 transition text-xs">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ot.pegawaiNama}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        {ot.tanggal}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {ot.jamMulai} - {ot.jamSelesai}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/60">
                        {ot.durasiJam} Jam
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs">
                        <div className="font-semibold text-slate-800 capitalize">{ot.kategori.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{ot.deskripsiTugas}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatRupiah(ot.tarifPerJam)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(ot.totalHonor)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ot.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ot.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ot.status === 'approved' ? 'DISETUJUI' : ot.status === 'rejected' ? 'DITOLAK' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {ot.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => onUpdateOvertimeStatus(ot.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded text-[10px] font-bold px-2 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Setujui Lembur"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => onUpdateOvertimeStatus(ot.id, 'rejected')}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded text-[10px] font-bold px-2 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Tolak Lembur"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Tolak</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Tervalidasi</span>
                          )}

                          {onDeleteOvertime && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus data penugasan lembur ${ot.pegawaiNama} (${ot.durasiJam} Jam - ${ot.tanggal})?`)) {
                                  onDeleteOvertime(ot.id);
                                }
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus Baris Lembur Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
      {/* SUB-TAB 5: TERMINAL HARDWARE & IMPORTER CSV */}
      {/* ========================================================================= */}
      {activeSubTab === 'mesin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hardware Machine Status */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800">Status Terminal Presensi Fisik</h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Online & Terhubung
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Terminal 01: Gerbang Masuk AI Face Recognition</div>
                  <div className="text-[10px] text-slate-400 font-mono">IP: 192.168.10.201 • Protokol TCP/IP ZKEMKeeper</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Terminal 02: Mesin Fingerprint Lobby Kantor Guru</div>
                  <div className="text-[10px] text-slate-400 font-mono">IP: 192.168.10.202 • Solution F100 Standalone</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Terminal 03: Node RFID Smart Gate Lab Software Engineering</div>
                  <div className="text-[10px] text-slate-400 font-mono">IP: 192.168.10.203 • MQTT Broker & ESP32 Reader</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>

            <button
              onClick={handleSimulateSyncMachine}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronisasi Seluruh Terminal Sekarang</span>
            </button>
          </div>

          {/* CSV File Parser Simulation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800">Upload File Rekap / Raw Log (.CSV / .XLSX)</h3>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 transition cursor-pointer bg-slate-50/50">
              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">Drag & Drop file log mesin absensi di sini</div>
              <div className="text-[10px] text-slate-400 mt-1">Mendukung format standard Solution, Fingerspot, ZKTeco, & EasyLink</div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
              <div className="font-bold text-indigo-950">Aturan Deteksi Otomatis:</div>
              <div>• Jam Masuk &gt; 07:00 WITA otomatis dihitung menit keterlambatan.</div>
              <div>• Tap Masuk &amp; Keluar tidak ditemukan dihitung sebagai Alpha (Denda Rp 50.000).</div>
              <div>• Jam Keluar &gt; 16:00 dihitung sebagai potensi jam lembur.</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT LOG PRESENSI MANUAL */}
      {/* ========================================================================= */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-indigo-600" />
                <span>Catat Log Presensi Baru</span>
              </h3>
              <button onClick={() => setShowAddLogModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateDailyLog} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pegawai</label>
                <select
                  value={newLog.pegawaiId}
                  onChange={(e) => setNewLog({ ...newLog, pegawaiId: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-200 bg-white"
                  required
                >
                  {pegawaiList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.nip})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={newLog.tanggal}
                    onChange={(e) => setNewLog({ ...newLog, tanggal: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Masuk (24 Jam)</label>
                  <TimeInput24
                    value={newLog.jamMasuk}
                    onChange={(val) => setNewLog({ ...newLog, jamMasuk: val })}
                    title="Format 24 Jam (00:00 - 24:00)"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Keluar (24 Jam)</label>
                  <TimeInput24
                    value={newLog.jamKeluar}
                    onChange={(val) => setNewLog({ ...newLog, jamKeluar: val })}
                    title="Format 24 Jam (00:00 - 24:00)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Metode Presensi</label>
                  <select
                    value={newLog.metode}
                    onChange={(e) => setNewLog({ ...newLog, metode: e.target.value as MetodePresensi })}
                    className="w-full p-2 border rounded-lg border-slate-200 bg-white"
                  >
                    <option value="biometric_fingerprint">Fingerprint</option>
                    <option value="face_recognition">AI Face Recognition</option>
                    <option value="rfid_card">RFID Card</option>
                    <option value="mobile_gps">Mobile GPS</option>
                    <option value="manual_admin">Manual Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Terminal</label>
                  <input
                    type="text"
                    value={newLog.lokasiTerminal}
                    onChange={(e) => setNewLog({ ...newLog, lokasiTerminal: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Kehadiran</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan (opsional)"
                  value={newLog.keterangan}
                  onChange={(e) => setNewLog({ ...newLog, keterangan: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Log Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUKAN CUTI / IZIN */}
      {/* ========================================================================= */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Pengajuan Cuti / Izin / Sakit SKD</span>
              </h3>
              <button onClick={() => setShowAddLeaveModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pegawai</label>
                <select
                  value={newLeave.pegawaiId}
                  onChange={(e) => setNewLeave({ ...newLeave, pegawaiId: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-200 bg-white"
                  required
                >
                  {pegawaiList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.nip})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Cuti / Izin</label>
                  <select
                    value={newLeave.jenis}
                    onChange={(e) => setNewLeave({ ...newLeave, jenis: e.target.value as JenisCutiIzin })}
                    className="w-full p-2 border rounded-lg border-slate-200 bg-white"
                  >
                    <option value="cuti_tahunan">Cuti Tahunan (Bergaji)</option>
                    <option value="sakit_skd">Sakit dengan Surat Dokter (SKD)</option>
                    <option value="izin_dinas_luar">Izin Dinas Luar (Tugas Sekolah)</option>
                    <option value="pelatihan">Pelatihan / Diklat / Bimtek (Tugas)</option>
                    <option value="cuti_melahirkan">Cuti Melahirkan</option>
                    <option value="cuti_ibadah">Cuti Ibadah Umroh / Haji</option>
                    <option value="izin_pribadi">Izin Pribadi</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Hari</label>
                  <input
                    type="number"
                    min={1}
                    value={newLeave.jumlahHari}
                    onChange={(e) => setNewLeave({ ...newLeave, jumlahHari: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={newLeave.tanggalMulai}
                    onChange={(e) => setNewLeave({ ...newLeave, tanggalMulai: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={newLeave.tanggalSelesai}
                    onChange={(e) => setNewLeave({ ...newLeave, tanggalSelesai: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Pengajuan</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan alasan pengajuan cuti atau rincian surat tugas..."
                  value={newLeave.alasan}
                  onChange={(e) => setNewLeave({ ...newLeave, alasan: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Kirim Pengajuan Cuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT PENUGASAN LEMBUR */}
      {/* ========================================================================= */}
      {showAddOvertimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Form Penugasan Jam Lembur</span>
              </h3>
              <button onClick={() => setShowAddOvertimeModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateOvertime} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pegawai Ditugaskan</label>
                <select
                  value={newOvertime.pegawaiId}
                  onChange={(e) => setNewOvertime({ ...newOvertime, pegawaiId: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-200 bg-white"
                  required
                >
                  {pegawaiList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} - Tarif {formatRupiah(p.tarifLemburPerJam || 20000)}/jam</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={newOvertime.tanggal}
                    onChange={(e) => setNewOvertime({ ...newOvertime, tanggal: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mulai (24 Jam)</label>
                  <TimeInput24
                    includeSeconds={false}
                    value={newOvertime.jamMulai}
                    onChange={(val) => setNewOvertime({ ...newOvertime, jamMulai: val })}
                    title="Format 24 Jam (00:00 - 24:00)"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selesai (24 Jam)</label>
                  <TimeInput24
                    includeSeconds={false}
                    value={newOvertime.jamSelesai}
                    onChange={(val) => setNewOvertime({ ...newOvertime, jamSelesai: val })}
                    title="Format 24 Jam (00:00 - 24:00)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Lembur</label>
                  <select
                    value={newOvertime.kategori}
                    onChange={(e) => setNewOvertime({ ...newOvertime, kategori: e.target.value as KategoriLembur })}
                    className="w-full p-2 border rounded-lg border-slate-200 bg-white"
                  >
                    <option value="perawatan_lab_it">Perawatan &amp; Jaringan Lab IT</option>
                    <option value="bimbingan_lks_ukk">Pembimbingan LKS &amp; Ujian UKK</option>
                    <option value="admin_dapodik">Administrasi &amp; Cut-off Dapodik</option>
                    <option value="ekskul_robotik">Pembinaan Ekskul Robotik</option>
                    <option value="kegiatan_sekolah">Kepanitiaan Kegiatan Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Durasi (Jam)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={newOvertime.durasiJam}
                    onChange={(e) => setNewOvertime({ ...newOvertime, durasiJam: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg border-slate-200 font-bold text-indigo-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Tugas</label>
                <textarea
                  rows={2}
                  placeholder="Rincian aktivitas lembur yang dikerjakan..."
                  value={newOvertime.deskripsiTugas}
                  onChange={(e) => setNewOvertime({ ...newOvertime, deskripsiTugas: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOvertimeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Klaim Lembur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
