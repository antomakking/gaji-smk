import React from 'react';
import { 
  Banknote, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  Lock, 
  FileText, 
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  HardDrive,
  Download,
  Upload
} from 'lucide-react';
import { DashboardStats, PenggajianRecord, User, Pegawai, LogPresensiHarian, SlotJadwalPelajaran, LogInfal, PengajuanCutiIzin } from '../types';
import { formatRupiah, formatNumber, getPayrollCutoffDates } from '../utils/security';
import { PeriodSelector, MONTH_NAMES_ID } from './PeriodSelector';
import { DailyAbsenceInfalCard } from './DailyAbsenceInfalCard';
import { SalaryTrendWidget } from './SalaryTrendWidget';

interface DashboardOverviewProps {

  stats: DashboardStats;
  records: PenggajianRecord[];
  currentUser: User;
  onGeneratePayroll: (bulan?: number, tahun?: number) => void;
  onNavigateTab: (tab: string, subTab?: string) => void;
  onViewSlip: (record: PenggajianRecord) => void;
  selectedBulan?: number;
  selectedTahun?: number;
  onSelectPeriod?: (bulan: number, tahun: number) => void;
  availablePeriods?: { bulan: number; tahun: number; count: number; status?: string }[];
  pegawaiList?: Pegawai[];
  dailyLogs?: LogPresensiHarian[];
  scheduleList?: SlotJadwalPelajaran[];
  infalList?: LogInfal[];
  leaveRequests?: PengajuanCutiIzin[];
  onAddInfal?: (infal: LogInfal) => void;
  onExportBackup?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  records,
  currentUser,
  onGeneratePayroll,
  onNavigateTab,
  onViewSlip,
  selectedBulan = (new Date().getMonth() + 1),
  selectedTahun = (new Date().getFullYear()),
  onSelectPeriod,
  availablePeriods = [],
  pegawaiList = [],
  dailyLogs = [],
  scheduleList = [],
  infalList = [],
  leaveRequests = [],
  onAddInfal,
  onExportBackup,
}) => {
  const cutoffInfo = getPayrollCutoffDates(selectedBulan, selectedTahun);

  return (
    <div className="space-y-6">
      {/* Period Selection & Summary Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Ringkasan Eksekutif Penggajian
            </h2>
            {onSelectPeriod && (
               <PeriodSelector
                selectedBulan={selectedBulan}
                selectedTahun={selectedTahun}
                onSelectPeriod={onSelectPeriod}
                availablePeriods={availablePeriods}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">Cut-Off Data:</span>
              <strong className="text-indigo-900 font-mono">{cutoffInfo.cutoffLabelLong}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-900">
              <span className="text-emerald-700 font-medium">Jadwal Transfer:</span>
              <strong className="font-mono">{cutoffInfo.paymentLabel}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onExportBackup && (
            <button
              onClick={onExportBackup}
              title="Ekspor Seluruh Data Aplikasi ke File JSON"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ekspor Backup JSON</span>
            </button>
          )}

          {(currentUser.role === 'super_admin' || currentUser.role === 'bendahara_yayasan') && (
            <button
              onClick={() => onGeneratePayroll(selectedBulan, selectedTahun)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Hitung Ulang Periode Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Metrics matching Professional Polish Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Gaji Bersih */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              Total Gaji Bersih
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">
              {formatRupiah(stats.totalGajiBulanIni)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Kotor: <strong className="text-slate-700 font-semibold">{formatRupiah(stats.totalPenerimaanKotor)}</strong>
            </p>
          </div>
        </div>

        {/* Pegawai Terdata */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              Pegawai Terdata
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalPegawai} <span className="text-sm font-normal text-slate-500">Orang</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {stats.totalGuru} Guru Vokasi • {stats.totalTendik} Tenaga Kependidikan
            </p>
          </div>
        </div>

        {/* Total Jam Mengajar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              Total Jam Mengajar
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalJamMengajarTerbayar} <span className="text-sm font-normal text-slate-500">Jam Tatap Muka</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Honor jam terhitung otomatis per skema
            </p>
          </div>
        </div>

        {/* Status Realisasi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              Status Realisasi
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">
              {stats.persentaseSelesai}% <span className="text-sm font-normal text-slate-500">Tuntas</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {stats.countTransferred} Terbayar • {stats.countApproved} Siap Transfer
            </p>
          </div>
        </div>
      </div>

      {/* Salary Trend Visualization (6 Months Expenditure Pattern) */}
      <SalaryTrendWidget
        currentRecords={records}
        pegawaiList={pegawaiList}
        selectedBulan={selectedBulan}
        selectedTahun={selectedTahun}
        availablePeriods={availablePeriods}
      />

      {/* Real-Time Daily Attendance & Substitute Teacher (Infal) Monitoring Widget */}
      <DailyAbsenceInfalCard

        pegawaiList={pegawaiList}
        dailyLogs={dailyLogs}
        scheduleList={scheduleList}
        infalList={infalList}
        leaveRequests={leaveRequests}
        onNavigateTab={onNavigateTab}
        onAddInfal={onAddInfal}
        selectedBulan={selectedBulan}
        selectedTahun={selectedTahun}
      />

      {/* Interactive Workflow Pipeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Pipeline Alur Persetujuan & Pencairan Gaji
            </h2>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-0.5">
              <span>Periode Aktif: <strong className="text-slate-800">{MONTH_NAMES_ID[selectedBulan - 1] || 'Agustus'} {selectedTahun}</strong></span>
              <span>•</span>
              <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-mono text-[11px]">
                Cut-off: {cutoffInfo.cutoffLabelShort}
              </span>
              <span>•</span>
              <span className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium text-[11px]">
                Jadwal Bayar: {cutoffInfo.paymentLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(currentUser.role === 'super_admin' || currentUser.role === 'bendahara_yayasan') && (
              <button
                id="btn-quick-generate"
                onClick={() => onGeneratePayroll(selectedBulan, selectedTahun)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Otomasi Hitung Ulang</span>
              </button>
            )}
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              {records.length} Berkas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Step 1: Draft */}
          <div className={`p-4 rounded-xl border transition ${stats.countDraft > 0 ? 'bg-slate-50 border-slate-300' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>1. Draft Awal</span>
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                {stats.countDraft}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Kalkulasi otomatis dari rekap absensi & skema.
            </p>
          </div>

          {/* Step 2: Approval Kepsek */}
          <div className={`p-4 rounded-xl border transition ${stats.countPendingKepsek > 0 ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 mb-1">
              <span>2. Review Kepsek</span>
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px]">
                {stats.countPendingKepsek}
              </span>
            </div>
            <p className="text-[11px] text-indigo-600/80 leading-tight">
              Verifikasi jam mengajar & ketertiban guru.
            </p>
          </div>

          {/* Step 3: Approval Yayasan */}
          <div className={`p-4 rounded-xl border transition ${stats.countPendingYayasan > 0 ? 'bg-purple-50/60 border-purple-300 ring-1 ring-purple-400' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs font-semibold text-purple-700 mb-1">
              <span>3. Review Yayasan</span>
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                {stats.countPendingYayasan}
              </span>
            </div>
            <p className="text-[11px] text-purple-600/80 leading-tight">
              Otorisasi anggaran yayasan Ibnul Qayyim.
            </p>
          </div>

          {/* Step 4: Approved / Siap Transfer */}
          <div className={`p-4 rounded-xl border transition ${stats.countApproved > 0 ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
              <span>4. Siap Ditransfer</span>
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px]">
                {stats.countApproved}
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 leading-tight">
              Menunggu eksekusi rekening Bendahara.
            </p>
          </div>

          {/* Step 5: Selesai / Terbit Slip */}
          <div className={`p-4 rounded-xl border transition ${stats.countTransferred > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
              <span>5. Selesai & Terbit</span>
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px]">
                {stats.countTransferred}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 leading-tight">
              Transfer sukses, slip PDF & email terkirim.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Activity Table & Security Module */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Payroll Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Data Penggajian Periode Aktif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar rincian nominal dan status persetujuan terkini
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pegawai / NIP</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Realisasi JP</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Gaji Bersih</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.slice(0, 5).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 text-xs">{record.pegawaiNama}</div>
                      <div className="text-[10px] font-mono text-slate-400">{record.pegawaiNip}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      <div>{record.pegawaiJabatan}</div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold">
                        {record.pegawaiStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 text-xs">
                      <span className="font-bold text-slate-900">{record.jamMengajarRealisasi}</span> JP
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700 text-xs">
                      {formatRupiah(record.gajiBersih)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase ${
                        record.status === 'transferred' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'approved' ? 'bg-amber-100 text-amber-700' :
                        record.status === 'pending_yayasan' ? 'bg-purple-100 text-purple-700' :
                        record.status === 'pending_kepsek' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {record.status === 'transferred' ? 'Terbayar' :
                         record.status === 'approved' ? 'Siap Transfer' :
                         record.status === 'pending_yayasan' ? 'Menunggu Yayasan' :
                         record.status === 'pending_kepsek' ? 'Menunggu Kepsek' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onViewSlip(record)}
                        className="bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        Slip Gaji
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Security, AES-256 & Documentation Navigation */}
        <div className="space-y-4">
          {/* Dark Accent Summary Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-wider">Proteksi Keamanan Enkripsi</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Nomor rekening, NIK, dan rincian nominal gaji dilindungi dengan enkripsi <strong>AES-256-GCM</strong> hardware-level. Integritas data slip dijamin dengan tanda tangan digital <strong>HMAC-SHA256</strong>.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-slate-400">Enkripsi Database:</span>
                <span className="font-mono text-emerald-400 font-bold">AES-256-GCM</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-slate-400">Status Checksum:</span>
                <span className="text-indigo-300 font-semibold">100% Anti-Tamper</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-slate-400">QR Code Verifikasi:</span>
                <span className="text-slate-200">Digital Seal Terintegrasi</span>
              </div>
            </div>
          </div>

          {/* Cadangan & Pemulihan Data JSON Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <span>Cadangan & Pemulihan Sistem (JSON)</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Ekspor seluruh data pegawai, presensi harian & rekap, jadwal, serta riwayat slip gaji ke berkas JSON atau pulihkan status sistem kapan saja.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportBackup ? onExportBackup : () => onNavigateTab('settings')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor JSON</span>
              </button>
              <button
                onClick={() => onNavigateTab('settings')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pulihkan Data</span>
              </button>
            </div>
          </div>

          {/* Quick Nav Card to SQL & Architecture */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              <span>Fondasi Teknis & DDL Database SQL</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Lihat skema SQL PostgreSQL/MySQL lengkap, relasi ERD Mermaid, dan dokumentasi API backend penggajian SMK IT Ibnul Qayyim.
            </p>
            <button
              onClick={() => onNavigateTab('architecture')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Buka Skema DDL & ERD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
