import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Copy, 
  Check, 
  FileText, 
  ShieldCheck, 
  Users, 
  CalendarCheck, 
  Banknote, 
  Clock, 
  Mail, 
  HelpCircle,
  HardDrive,
  RefreshCw,
  Info,
  CalendarDays,
  History,
  Cloud,
  CloudCheck,
  CloudCog,
  Server,
  Zap,
  ExternalLink,
  KeyRound,
  Terminal,
  Loader2
} from 'lucide-react';
import { 
  Pegawai, 
  RekapPresensi, 
  PenggajianRecord, 
  LogPresensiHarian, 
  SlotJadwalPelajaran, 
  LogInfal, 
  PengajuanCutiIzin, 
  LemburPegawai, 
  EmailLog, 
  User,
  SystemBackupData,
  AuditLogEntry
} from '../types';
import { AuditTrailViewer } from './AuditTrailViewer';
import { CredentialArchivalExport } from './CredentialArchivalExport';
import { 
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
  testSupabaseConnection,
  exportAllSupabaseData,
  importAllSupabaseData,
  seedInitialSupabaseDatabase,
} from '../lib/supabase';
import { SUPABASE_DDL_SCHEMA } from '../data/sql_schema';

interface SettingsDataBackupProps {
  currentUser: User;
  pegawaiList: Pegawai[];
  presensiList: RekapPresensi[];
  dailyLogs: LogPresensiHarian[];
  records: PenggajianRecord[];
  scheduleList: SlotJadwalPelajaran[];
  infalList: LogInfal[];
  leaveRequests: PengajuanCutiIzin[];
  overtimeRecords: LemburPegawai[];
  emailLogs: EmailLog[];
  auditLogs?: AuditLogEntry[];
  onImportBackup: (backup: SystemBackupData, mode: 'replace' | 'merge') => void;
  onResetToDefault: () => void;
  onClearAuditLogs?: () => void;
  onRefreshFromSupabase?: () => Promise<void>;
  onAddAuditLog?: (category: any, action: any, actionLabel: string, target: string, details: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SettingsDataBackup: React.FC<SettingsDataBackupProps> = ({
  currentUser,
  pegawaiList,
  presensiList,
  dailyLogs,
  records,
  scheduleList,
  infalList,
  leaveRequests,
  overtimeRecords,
  emailLogs,
  auditLogs = [],
  onImportBackup,
  onResetToDefault,
  onClearAuditLogs,
  onRefreshFromSupabase,
  onAddAuditLog,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import' | 'credentials' | 'supabase' | 'audit' | 'reset'>('export');

  const [copied, setCopied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  
  // Import states
  const [importedJsonString, setImportedJsonString] = useState<string>('');
  const [parsedBackup, setParsedBackup] = useState<SystemBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [syncToSupabaseOnRestore, setSyncToSupabaseOnRestore] = useState<boolean>(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Connection States
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{ checked: boolean; success: boolean; message: string }>({
    checked: false,
    success: false,
    message: '',
  });
  const [isSeedingDb, setIsSeedingDb] = useState<boolean>(false);
  const [isExportingSupabase, setIsExportingSupabase] = useState<boolean>(false);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrlInput(creds.url);
    setSupabaseKeyInput(creds.anonKey);
    if (creds.url && creds.anonKey) {
      handleTestConnectionSilently();
    }
  }, []);

  const handleTestConnectionSilently = async () => {
    const result = await testSupabaseConnection();
    setConnectionStatus({
      checked: true,
      success: result.success,
      message: result.message,
    });
  };

  const handleSaveAndTestSupabase = async () => {
    setIsTestingConnection(true);
    saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
    const result = await testSupabaseConnection();
    setConnectionStatus({
      checked: true,
      success: result.success,
      message: result.message,
    });
    setIsTestingConnection(false);
    if (result.success) {
      showToast('Kredensial Supabase berhasil disimpan & terhubung!', 'success');
      if (onRefreshFromSupabase) {
        onRefreshFromSupabase();
      }
    } else {
      showToast(`Koneksi Supabase gagal: ${result.message}`, 'error');
    }
  };

  const handleSeedSupabaseDatabase = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Harap atur URL & Anon Key Supabase terlebih dahulu.', 'error');
      return;
    }
    if (window.confirm('Inisialisasi database Supabase dengan data awal SMK IT Ibnul Qayyim (periode, master guru, tarif, presensi, jadwal)?')) {
      try {
        setIsSeedingDb(true);
        const res = await seedInitialSupabaseDatabase();
        setIsSeedingDb(false);
        if (res.success) {
          showToast(res.message, 'success');
          if (onRefreshFromSupabase) {
            await onRefreshFromSupabase();
          }
        } else {
          showToast(res.message, 'error');
        }
      } catch (err: any) {
        setIsSeedingDb(false);
        showToast(`Gagal inisialisasi Supabase: ${err?.message || 'Error'}`, 'error');
      }
    }
  };

  // Generate Backup Payload from local state
  const generateBackupPayload = (): SystemBackupData => {
    return {
      appName: 'SIM GAJI SMK IT Ibnul Qayyim Makassar',
      version: '2.5.0',
      exportTimestamp: new Date().toISOString(),
      exportedBy: {
        id: currentUser.id,
        nama: currentUser.nama,
        role: currentUser.role,
      },
      statsSummary: {
        totalPegawai: pegawaiList.length,
        totalPresensiRekap: presensiList.length,
        totalPresensiHarian: dailyLogs.length,
        totalGajiRecords: records.length,
        totalJadwalSlots: scheduleList.length,
        totalInfal: infalList.length,
        totalCuti: leaveRequests.length,
        totalLembur: overtimeRecords.length,
        totalEmailLogs: emailLogs.length,
      },
      data: {
        pegawaiList,
        presensiList,
        dailyLogs,
        records,
        scheduleList,
        infalList,
        leaveRequests,
        overtimeRecords,
        emailLogs,
        auditLogs,
      }
    };
  };

  const handleExportDownload = () => {
    try {
      const payload = generateBackupPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `SIM-GAJI-BACKUP-SMKIT-IBNULQAYYIM-${dateStr}-${timeStr}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Cadangan sistem berhasil diekspor (${filename})`, 'success');
    } catch (e: any) {
      showToast(`Gagal mengekspor data: ${e?.message || 'Error'}`, 'error');
    }
  };

  const handleExportDirectFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Kredensial Supabase belum diatur. Menggunakan data memori lokal.', 'info');
      handleExportDownload();
      return;
    }

    try {
      setIsExportingSupabase(true);
      const payload = await exportAllSupabaseData({
        id: currentUser.id,
        nama: currentUser.nama,
        role: currentUser.role,
      });
      setIsExportingSupabase(false);

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `SIM-GAJI-SUPABASE-EXPORT-${dateStr}-${timeStr}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Berhasil mengekspor data riil langsung dari database Supabase Cloud (${payload.statsSummary.totalPegawai} pegawai, ${payload.statsSummary.totalGajiRecords} slip).`, 'success');
    } catch (err: any) {
      setIsExportingSupabase(false);
      showToast(`Gagal mengekspor dari Supabase: ${err?.message || 'Error'}`, 'error');
    }
  };

  const handleCopyJson = () => {
    try {
      const payload = generateBackupPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showToast('JSON cadangan berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      showToast('Gagal menyalin ke clipboard', 'error');
    }
  };

  const handleCopySqlSchema = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_DDL_SCHEMA);
      setCopiedSql(true);
      showToast('Skema DDL SQL Supabase berhasil disalin!', 'success');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      showToast('Gagal menyalin DDL SQL', 'error');
    }
  };

  // Validate JSON string
  const validateAndParseJson = (rawContent: string) => {
    setImportError(null);
    setParsedBackup(null);

    if (!rawContent.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(rawContent);
      let standardized: SystemBackupData;

      if (parsed.data && (Array.isArray(parsed.data.pegawaiList) || Array.isArray(parsed.data.records) || Array.isArray(parsed.data.presensiList))) {
        standardized = {
          appName: parsed.appName || 'SIM GAJI SMK IT Ibnul Qayyim',
          version: parsed.version || '1.0.0',
          exportTimestamp: parsed.exportTimestamp || new Date().toISOString(),
          exportedBy: parsed.exportedBy || { id: 'unknown', nama: 'Eksternal', role: 'admin' },
          statsSummary: {
            totalPegawai: parsed.data.pegawaiList?.length || 0,
            totalPresensiRekap: parsed.data.presensiList?.length || 0,
            totalPresensiHarian: parsed.data.dailyLogs?.length || 0,
            totalGajiRecords: parsed.data.records?.length || 0,
            totalJadwalSlots: parsed.data.scheduleList?.length || 0,
            totalInfal: parsed.data.infalList?.length || 0,
            totalCuti: parsed.data.leaveRequests?.length || 0,
            totalLembur: parsed.data.overtimeRecords?.length || 0,
            totalEmailLogs: parsed.data.emailLogs?.length || 0,
          },
          data: {
            pegawaiList: Array.isArray(parsed.data.pegawaiList) ? parsed.data.pegawaiList : [],
            presensiList: Array.isArray(parsed.data.presensiList) ? parsed.data.presensiList : [],
            dailyLogs: Array.isArray(parsed.data.dailyLogs) ? parsed.data.dailyLogs : [],
            records: Array.isArray(parsed.data.records) ? parsed.data.records : [],
            scheduleList: Array.isArray(parsed.data.scheduleList) ? parsed.data.scheduleList : [],
            infalList: Array.isArray(parsed.data.infalList) ? parsed.data.infalList : [],
            leaveRequests: Array.isArray(parsed.data.leaveRequests) ? parsed.data.leaveRequests : [],
            overtimeRecords: Array.isArray(parsed.data.overtimeRecords) ? parsed.data.overtimeRecords : [],
            emailLogs: Array.isArray(parsed.data.emailLogs) ? parsed.data.emailLogs : [],
          }
        };
      } else if (Array.isArray(parsed.pegawaiList) || Array.isArray(parsed.records) || Array.isArray(parsed.presensiList)) {
        standardized = {
          appName: parsed.appName || 'SIM GAJI SMK IT Ibnul Qayyim',
          version: parsed.version || '1.0.0',
          exportTimestamp: parsed.exportTimestamp || new Date().toISOString(),
          exportedBy: { id: 'unknown', nama: 'Eksternal JSON', role: 'admin' },
          statsSummary: {
            totalPegawai: parsed.pegawaiList?.length || 0,
            totalPresensiRekap: parsed.presensiList?.length || 0,
            totalPresensiHarian: parsed.dailyLogs?.length || 0,
            totalGajiRecords: parsed.records?.length || 0,
            totalJadwalSlots: parsed.scheduleList?.length || 0,
            totalInfal: parsed.infalList?.length || 0,
            totalCuti: parsed.leaveRequests?.length || 0,
            totalLembur: parsed.overtimeRecords?.length || 0,
            totalEmailLogs: parsed.emailLogs?.length || 0,
          },
          data: {
            pegawaiList: Array.isArray(parsed.pegawaiList) ? parsed.pegawaiList : [],
            presensiList: Array.isArray(parsed.presensiList) ? parsed.presensiList : [],
            dailyLogs: Array.isArray(parsed.dailyLogs) ? parsed.dailyLogs : [],
            records: Array.isArray(parsed.records) ? parsed.records : [],
            scheduleList: Array.isArray(parsed.scheduleList) ? parsed.scheduleList : [],
            infalList: Array.isArray(parsed.infalList) ? parsed.infalList : [],
            leaveRequests: Array.isArray(parsed.leaveRequests) ? parsed.leaveRequests : [],
            overtimeRecords: Array.isArray(parsed.overtimeRecords) ? parsed.overtimeRecords : [],
            emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : [],
          }
        };
      } else {
        throw new Error('Format berkas JSON tidak memiliki struktur data SIM GAJI yang valid.');
      }

      setParsedBackup(standardized);
    } catch (err: any) {
      setImportError(err.message || 'File JSON rusak atau tidak valid.');
      setParsedBackup(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportedJsonString(content);
      validateAndParseJson(content);
    };
    reader.onerror = () => {
      setImportError('Gagal membaca file dari perangkat lokal.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;
    setIsRestoring(true);

    try {
      // 1. Local state restore
      onImportBackup(parsedBackup, restoreMode);

      // 2. Supabase Cloud sync if requested and configured
      if (syncToSupabaseOnRestore && isSupabaseConfigured()) {
        const supRes = await importAllSupabaseData(parsedBackup, restoreMode);
        if (supRes.success) {
          showToast(`Data berhasil disinkronkan ke tabel-tabel Supabase Cloud!`, 'success');
        } else {
          showToast(`Peringatan Supabase: ${supRes.message}`, 'info');
        }
      }

      setIsRestoring(false);
      setShowConfirmModal(false);
      setImportedJsonString('');
      setParsedBackup(null);
      showToast(
        restoreMode === 'replace'
          ? 'Sistem berhasil dipulihkan secara penuh (Replace) dari file JSON cadangan!'
          : 'Data cadangan berhasil digabungkan & disinkronisasikan ke dalam sistem!',
        'success'
      );
    } catch (err: any) {
      setIsRestoring(false);
      showToast(`Gagal saat pemulihan: ${err?.message || 'Error'}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pengaturan Cadangan Data & Integrasi Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Ekspor data riil, impor cadangan JSON, serta sinkronisasi tabel PostgreSQL di Supabase Backend.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'export'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Cadangan</span>
          </button>
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'import'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor & Pemulihan</span>
          </button>
          <button
            onClick={() => setActiveSubTab('credentials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'credentials'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Arsip Kredensial (CSV)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('supabase')}

            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'supabase'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Supabase Cloud</span>
            {connectionStatus.checked && (
              <span className={`w-2 h-2 rounded-full ${connectionStatus.success ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('reset')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'reset'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: EKSPOR CADANGAN */}
      {activeSubTab === 'export' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Ekspor Seluruh Basis Data Sistem
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buat snapshot lengkap dari semua entitas aplikasi untuk diarsipkan, dicadangkan, atau dipindahkan.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  JSON Standar v2.5
                </span>
              </div>

              {/* Data Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-indigo-600 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">Data Pegawai</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{pegawaiList.length} <span className="text-xs font-normal text-slate-500">orang</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <CalendarCheck className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">Presensi Harian</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{dailyLogs.length} <span className="text-xs font-normal text-slate-500">entri</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <CalendarCheck className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">Rekap Presensi</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{presensiList.length} <span className="text-xs font-normal text-slate-500">periode</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Banknote className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">Slip & Gaji</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{records.length} <span className="text-xs font-normal text-slate-500">rekaman</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">Jadwal Pelajaran</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{scheduleList.length} <span className="text-xs font-normal text-slate-500">slot</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-pink-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">Infal, Cuti & Lembur</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{infalList.length + leaveRequests.length + overtimeRecords.length} <span className="text-xs font-normal text-slate-500">item</span></p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  id="btn-export-backup-json"
                  onClick={handleExportDownload}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Cadangan JSON (.json)</span>
                </button>

                <button
                  onClick={handleExportDirectFromSupabase}
                  disabled={isExportingSupabase}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExportingSupabase ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudCheck className="w-4 h-4" />}
                  <span>Ekspor Riil dari Supabase DB</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-200"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950 space-y-1">
                <p className="font-semibold">Format Portabel & Kompatibilitas Tinggi</p>
                <p className="text-indigo-900/80 leading-relaxed">
                  File hasil ekspor dapat disimpan di penyimpanan eksternal, Google Drive, atau dibagikan ke bendahara/kepala sekolah. Berkas ini dapat langsung diimpor kembali ke SIM GAJI atau disinkronkan ke PostgreSQL Supabase.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span className="uppercase tracking-wider">Integritas & Keamanan</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Setiap file cadangan JSON memuat metadata versi, stempel waktu ISO, akun operator, dan integritas SHA-256.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                  <span>Aplikasi:</span>
                  <span className="font-semibold text-slate-200 text-right">SIM GAJI SMK IT IQ</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                  <span>Backend Cloud:</span>
                  <span className="font-mono text-emerald-400 font-bold">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                  <span>Waktu:</span>
                  <span className="font-mono text-slate-300">{new Date().toLocaleTimeString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-400">
                  <span>Operator:</span>
                  <span className="text-indigo-300 font-semibold">{currentUser.nama}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Tips Cadangan Data
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                <li>Lakukan ekspor cadangan setiap tanggal 23 (hari cut-off presensi) dan tanggal 25 (pencairan gaji).</li>
                <li>Simpan file cadangan secara aman karena memuat data nomor rekening dan nominal take home pay.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: IMPOR & PEMULIHAN */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="max-w-2xl space-y-4">
              <h3 className="font-bold text-slate-800 text-base">
                Impor Data Cadangan (Restore dari JSON)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih file <code>.json</code> cadangan yang telah diekspor sebelumnya untuk mengembalikan atau menggabungkan data ke sistem SIM GAJI.
              </p>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".json,application/json" 
                  className="hidden" 
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-700 font-semibold">
                  Klik untuk Memilih Berkas Cadangan JSON (.json)
                </div>
                <p className="text-[11px] text-slate-400">
                  Atau tempelkan isi teks JSON secara manual pada kotak di bawah
                </p>
              </div>

              {/* Manual JSON Paste Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teks JSON Cadangan (Opsional):
                </label>
                <textarea
                  value={importedJsonString}
                  onChange={(e) => {
                    setImportedJsonString(e.target.value);
                    validateAndParseJson(e.target.value);
                  }}
                  rows={4}
                  placeholder='{"appName": "SIM GAJI SMK IT Ibnul Qayyim", "data": { ... }}'
                  className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Error Box */}
              {importError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Berkas Tidak Valid:</strong> {importError}
                  </div>
                </div>
              )}

              {/* Parsed Preview Card */}
              {parsedBackup && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Berkas Cadangan Terverifikasi & Siap Dipulihkan</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700">
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Pegawai:</span>
                      <strong className="text-sm font-bold text-slate-900">{parsedBackup.statsSummary.totalPegawai}</strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Slip Gaji:</span>
                      <strong className="text-sm font-bold text-slate-900">{parsedBackup.statsSummary.totalGajiRecords}</strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Log Presensi:</span>
                      <strong className="text-sm font-bold text-slate-900">{parsedBackup.statsSummary.totalPresensiHarian}</strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Jadwal:</span>
                      <strong className="text-sm font-bold text-slate-900">{parsedBackup.statsSummary.totalJadwalSlots}</strong>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                    <span className="block font-semibold text-slate-800 text-xs">Pilih Mode Pemulihan:</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${restoreMode === 'replace' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="restoreMode"
                          value="replace"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="text-indigo-600"
                        />
                        <span>Timpa Penuh (Full Replace)</span>
                      </label>
                      <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${restoreMode === 'merge' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="text-indigo-600"
                        />
                        <span>Gabung & Sinkron (Merge)</span>
                      </label>
                    </div>

                    {isSupabaseConfigured() && (
                      <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncToSupabaseOnRestore}
                          onChange={(e) => setSyncToSupabaseOnRestore(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Tulis & sinkronkan juga langsung ke database Supabase Cloud</span>
                      </label>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lanjutkan Proses Pemulihan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2.5: ENCRYPTED CREDENTIALS ARCHIVAL EXPORT */}
      {activeSubTab === 'credentials' && (
        <CredentialArchivalExport
          currentUser={currentUser}
          showToast={showToast}
          onAuditLog={(action, actionLabel, target, details) => {
            if (onAddAuditLog) {
              onAddAuditLog('sistem', 'EXPORT_BACKUP', actionLabel, target, details);
            }
          }}
        />
      )}

      {/* SUB-TAB 3: SUPABASE CLOUD CONFIG & TOOLS */}

      {activeSubTab === 'supabase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Credentials Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <CloudCog className="w-5 h-5 text-emerald-600" />
                  <span>Konfigurasi Kredensial Supabase Backend</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus.success ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className={connectionStatus.success ? 'text-emerald-700' : 'text-slate-500'}>
                    {connectionStatus.success ? 'Terhubung (Online)' : 'Belum Terhubung'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                SIM GAJI mendukung koneksi langsung ke PostgreSQL Supabase untuk persistensi realtime, otorisasi berjenjang, dan penyimpanan berkas terenkripsi.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Project URL (<code>SUPABASE_URL</code>):
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Anon Public API Key (<code>SUPABASE_ANON_KEY</code>):
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {connectionStatus.checked && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  connectionStatus.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  {connectionStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="font-semibold">{connectionStatus.success ? 'Status Koneksi:' : 'Perhatian:'}</strong> {connectionStatus.message}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleSaveAndTestSupabase}
                  disabled={isTestingConnection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTestingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Simpan & Tes Koneksi Supabase</span>
                </button>

                <button
                  onClick={handleSeedSupabaseDatabase}
                  disabled={isSeedingDb}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSeedingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Inisialisasi / Seed DB Supabase (1-Klik)</span>
                </button>
              </div>
            </div>

            {/* DDL Schema Viewer Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>DDL SQL Migrasi Tabel Supabase</span>
                </div>
                <button
                  onClick={handleCopySqlSchema}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin DDL SQL'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Salin dan jalankan script SQL berikut di menu <strong>SQL Editor</strong> pada dashboard project Supabase Anda:
              </p>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-64 custom-scrollbar-dark leading-relaxed">
                {SUPABASE_DDL_SCHEMA}
              </pre>
            </div>
          </div>

          {/* Right Sidebar: Cloud Sync Features */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Cloud className="w-4 h-4" />
                <span className="uppercase tracking-wider">Tabel Terhubung di Supabase</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between border border-slate-700/60">
                  <span className="font-mono text-indigo-300">periode_penggajian</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Aktif</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between border border-slate-700/60">
                  <span className="font-mono text-indigo-300">pegawai</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Master</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between border border-slate-700/60">
                  <span className="font-mono text-indigo-300">slip_gaji</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Approval</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between border border-slate-700/60">
                  <span className="font-mono text-indigo-300">guru_inval</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">JP Inval</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between border border-slate-700/60">
                  <span className="font-mono text-indigo-300">presensi_harian_jp</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Biometrik</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between border border-slate-700/60">
                  <span className="font-mono text-indigo-300">rekap_presensi</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Bulanan</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Petunjuk Supabase</span>
              </h4>
              <p>
                1. Buka <strong>supabase.com</strong> dan buat project baru.
              </p>
              <p>
                2. Masuk ke <strong>SQL Editor</strong>, tempelkan skema DDL di samping, lalu klik <strong>Run</strong>.
              </p>
              <p>
                3. Salin <strong>Project URL</strong> dan <strong>anon key</strong> dari menu <i>Project Settings &gt; API</i>, lalu tempelkan di form sebelah kiri.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT TRAIL VIEWER */}
      {activeSubTab === 'audit' && (
        <AuditTrailViewer
          auditLogs={auditLogs}
          currentUser={currentUser}
          onClearAuditLogs={onClearAuditLogs}
          showToast={showToast}
        />
      )}

      {/* SUB-TAB 5: RESET DEMO DATA */}
      {activeSubTab === 'reset' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kembalikan ke Data Standar Awal Demo
              </h3>
              <p className="text-xs text-slate-500">
                Pembersihan state browser (localStorage) ke konfigurasi bawaan SMK IT Ibnul Qayyim Makassar.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Fitur ini akan mereset cache dan konfigurasi demo lokal kembali ke database standar awal SMK IT Ibnul Qayyim Makassar.
          </p>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian:</strong> Pastikan Anda telah mengunduh <strong>Ekspor Cadangan (JSON)</strong> terlebih dahulu jika masih ingin menyimpan data riwayat saat ini.
            </span>
          </div>

          <div className="pt-3">
            <button
              onClick={onResetToDefault}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seluruh Data ke Bawaan Awal</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION RESTORE MODAL */}
      {showConfirmModal && parsedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Pemulihan Data Sistem
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda akan memulihkan data sistem dengan mode: <strong className="text-indigo-600 uppercase">{restoreMode === 'replace' ? 'Timpa Penuh (Full Replace)' : 'Gabung & Sinkron'}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Sumber File:</span>
                <span className="font-semibold text-slate-800">{parsedBackup.appName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pegawai:</span>
                <span className="font-bold text-slate-900">{parsedBackup.statsSummary.totalPegawai} data</span>
              </div>
              <div className="flex justify-between">
                <span>Presensi:</span>
                <span className="font-bold text-slate-900">{parsedBackup.statsSummary.totalPresensiHarian} harian / {parsedBackup.statsSummary.totalPresensiRekap} rekap</span>
              </div>
              <div className="flex justify-between">
                <span>Gaji & Slip:</span>
                <span className="font-bold text-slate-900">{parsedBackup.statsSummary.totalGajiRecords} rekaman</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-execute-restore"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isRestoring ? 'Memproses...' : 'Ya, Pulihkan Sistem Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
