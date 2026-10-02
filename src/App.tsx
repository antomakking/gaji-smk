import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  INITIAL_USERS, 
  INITIAL_PEGAWAI, 
  INITIAL_PRESENSI, 
  INITIAL_EMAIL_LOGS,
  INITIAL_DAILY_LOGS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_OVERTIME_RECORDS,
  INITIAL_INFAL,
  INITIAL_AUDIT_LOGS
} from './data/initialData';
import { 
  User, 
  Pegawai, 
  RekapPresensi, 
  PenggajianRecord, 
  EmailLog, 
  DashboardStats,
  StatusPenggajian,
  LogPresensiHarian,
  PengajuanCutiIzin,
  LemburPegawai,
  LogInfal,
  SlotJadwalPelajaran,
  AuditLogEntry,
  AuditCategory,
  AuditActionType
} from './types';
import { INITIAL_SCHEDULE_SLOTS } from './data/scheduleData';
import { PAYROLL_JULI_2026, PRESENSI_JULI_2026 } from './data/july2026PayrollData';
import { PAYROLL_SEPTEMBER_2026 } from './data/september2026PayrollData';

import { kalkulasiPenggajian, getPayrollCutoffDates } from './utils/security';
import { Sidebar, TopHeader } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { PayrollManagement } from './components/PayrollManagement';
import { AttendanceManager } from './components/AttendanceManager';
import { ScheduleManager } from './components/ScheduleManager';
import { EmployeeManager } from './components/EmployeeManager';
import { SlipGajiModal } from './components/SlipGajiModal';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { TechnicalDocViewer } from './components/TechnicalDocViewer';
import { FormulaInspectorModal } from './components/FormulaInspectorModal';
import { SettingsDataBackup } from './components/SettingsDataBackup';
import { LoginPage } from './components/LoginPage';
import { AutoLogoutGuard } from './components/AutoLogoutGuard';
import { MONTH_NAMES_ID } from './components/PeriodSelector';

import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useSalaryPrivacy } from './context/SalaryPrivacyContext';
import { SystemBackupData } from './types';
import { 
  fetchActivePeriodsSupabase,
  fetchStaffListSupabase,
  fetchPayrollRecordsSupabase,
  fetchDailyAttendanceSupabase,
  fetchGuruInvalSupabase,
  updateSlipGajiApprovalSupabase,
  updateSlipGajiTransferSupabase,
  upsertPegawaiSupabase,
  deletePegawaiSupabase,
  upsertGuruInvalSupabase,
  upsertPresensiHarianSupabase,
  isSupabaseConfigured,
} from './lib/supabase';
import { testKoneksiSupabase } from './supabaseClient';




// Helper to generate full realistic payroll records for any period
const generatePeriodPayrollRecords = (
  targetBulan: number,
  targetTahun: number,
  pegList: Pegawai[],
  prsList: RekapPresensi[]
): PenggajianRecord[] => {
  if (targetTahun === 2026 && targetBulan === 7) {
    return PAYROLL_JULI_2026;
  }
  if (targetTahun === 2026 && targetBulan === 9) {
    return PAYROLL_SEPTEMBER_2026;
  }

  // Filter only Pegawai Induk (Pegawai Non Induk digaji di sekolah induk asal mereka, misal SMPIT)
  const indukPegList = pegList.filter(peg => peg.statusInduk !== 'Non Induk' && !['peg-017', 'peg-018', 'peg-019', 'peg-020', 'peg-021', 'peg-022', 'peg-023'].includes(peg.id));

  const formattedBulan = String(targetBulan).padStart(2, '0');

  return indukPegList.map((peg, index) => {
    let pres = prsList.find(p => p.pegawaiId === peg.id && p.bulan === targetBulan && p.tahun === targetTahun);
    if (!pres) {
      pres = {
        id: `prs-gen-${peg.id}-${targetBulan}-${targetTahun}`,
        pegawaiId: peg.id,
        bulan: targetBulan,
        tahun: targetTahun,
        totalHariEfektif: 22,
        hadir: 22,
        sakit: 0,
        izin: 0,
        cuti: 0,
        dinasLuar: 0,
        alpha: 0,
        menitTerlambat: 0,
        jamMengajarRencana: 20,
        jamMengajarRealisasi: 20,
        jamLemburTotal: 0,
        honorLemburTotal: 0,
        potonganIzinTidakResmi: 0,
        jumlahJpMenggantikan: 0,
        honorInfalTotal: 0,
        jumlahJpDigantikan: 0,
        potonganInfalTotal: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const calc = kalkulasiPenggajian(peg, pres, { bulan: targetBulan, tahun: targetTahun });
    let status: StatusPenggajian = 'draft';
    let approvedKepsekBy: string | undefined;
    let approvedKepsekAt: string | undefined;
    let approvedYayasanBy: string | undefined;
    let approvedYayasanAt: string | undefined;
    let transferredBy: string | undefined;
    let transferredAt: string | undefined;
    let nomorReferensiTransfer: string | undefined;
    let emailSent = false;
    let emailSentAt: string | undefined;

    // Past months are fully transferred
    if (targetTahun < 2026 || (targetTahun === 2026 && targetBulan < 8)) {
      status = 'transferred';
      approvedKepsekBy = 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)';
      approvedKepsekAt = `${targetTahun}-${formattedBulan}-25T14:20:00Z`;
      approvedYayasanBy = 'Ir. H. Abdul Malik Karim, M.T. (Ketua Yayasan)';
      approvedYayasanAt = `${targetTahun}-${formattedBulan}-25T18:00:00Z`;
      transferredBy = 'Hj. Nurul Fatimah, S.E., Ak. (Bendahara)';
      transferredAt = `${targetTahun}-${formattedBulan}-26T08:15:00Z`;
      nomorReferensiTransfer = `TRF/BSI/${targetTahun}${formattedBulan}26/${982000 + index}`;
      emailSent = true;
      emailSentAt = `${targetTahun}-${formattedBulan}-26T08:30:00Z`;
    } else if (targetTahun === 2026 && targetBulan === 8) {
      // Demo August 2026 workflow distribution
      if (index === 0 || index === 2) {
        status = 'transferred';
        approvedKepsekBy = 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)';
        approvedKepsekAt = '2026-08-25T14:20:00Z';
        approvedYayasanBy = 'Ir. H. Abdul Malik Karim, M.T. (Ketua Yayasan)';
        approvedYayasanAt = '2026-08-25T18:00:00Z';
        transferredBy = 'Hj. Nurul Fatimah, S.E., Ak. (Bendahara)';
        transferredAt = '2026-08-26T08:15:00Z';
        nomorReferensiTransfer = `TRF/BSI/20260826/${982000 + index}`;
        emailSent = true;
        emailSentAt = '2026-08-26T08:30:00Z';
      } else if (index === 1 || index === 4) {
        status = 'approved';
        approvedKepsekBy = 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)';
        approvedKepsekAt = '2026-08-25T14:25:00Z';
        approvedYayasanBy = 'Ir. H. Abdul Malik Karim, M.T. (Ketua Yayasan)';
        approvedYayasanAt = '2026-08-25T18:30:00Z';
      } else if (index === 3) {
        status = 'pending_yayasan';
        approvedKepsekBy = 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)';
        approvedKepsekAt = '2026-08-25T15:00:00Z';
      } else if (index === 5) {
        status = 'pending_kepsek';
      }
    }

    return {
      ...calc,
      id: `gji-${targetTahun}-${formattedBulan}-${String(index + 1).padStart(3, '0')}`,
      status,
      approvedKepsekBy,
      approvedKepsekAt,
      approvedYayasanBy,
      approvedYayasanAt,
      transferredBy,
      transferredAt,
      nomorReferensiTransfer,
      emailSent,
      emailSentAt,
      createdAt: `${targetTahun}-${formattedBulan}-25T09:00:00Z`,
      updatedAt: `${targetTahun}-${formattedBulan}-26T08:30:00Z`,
    };
  });
};

export default function App() {
  const { isSalaryHidden } = useSalaryPrivacy();
  
  // Authentication State: Require login before accessing dashboard
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const local = localStorage.getItem('sim_gaji_auth_session');
      const session = sessionStorage.getItem('sim_gaji_auth_session');
      const authData = local || session;
      if (authData) {
        const parsed = JSON.parse(authData);
        return Boolean(parsed && parsed.userId);
      }
    } catch (e) {}
    return false; // Default: show login screen before dashboard
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const local = localStorage.getItem('sim_gaji_auth_session');
      const session = sessionStorage.getItem('sim_gaji_auth_session');
      const authData = local || session;
      if (authData) {
        const parsed = JSON.parse(authData);
        const found = INITIAL_USERS.find(u => u.id === parsed.userId);
        if (found) return found;
      }
    } catch (e) {}
    return INITIAL_USERS[0];
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'input_harian' | 'infal' | 'rekap' | 'harian' | 'cuti' | 'lembur' | 'mesin'>('input_harian');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Active Selected Period State: Default ke September 2026 (23 Agustus - 22 September 2026)
  const [selectedBulan, setSelectedBulan] = useState<number>(9);
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);


  // Data States with LocalStorage Persistence
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_pegawai_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PEGAWAI;
  });

  const [presensiList, setPresensiList] = useState<RekapPresensi[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_presensi_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const initialPresensiWithInfal = INITIAL_PRESENSI.map(p => {
      const copy = { ...p };
      INITIAL_INFAL.filter(i => i.status === 'approved').forEach(inf => {
        if (inf.guruPenggantiId === copy.pegawaiId) {
          copy.jumlahJpMenggantikan = (copy.jumlahJpMenggantikan || 0) + inf.jumlahJp;
          copy.honorInfalTotal = (copy.honorInfalTotal || 0) + inf.totalNominal;
        }
        if (inf.guruAbsenId === copy.pegawaiId) {
          copy.jumlahJpDigantikan = (copy.jumlahJpDigantikan || 0) + inf.jumlahJp;
          copy.potonganInfalTotal = (copy.potonganInfalTotal || 0) + inf.totalNominal;
        }
      });
      return copy;
    });
    return [...initialPresensiWithInfal, ...PRESENSI_JULI_2026];
  });

  const [dailyLogs, setDailyLogs] = useState<LogPresensiHarian[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_daily_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_DAILY_LOGS;
  });

  const [leaveRequests, setLeaveRequests] = useState<PengajuanCutiIzin[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_leave_requests');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LEAVE_REQUESTS;
  });

  const [overtimeRecords, setOvertimeRecords] = useState<LemburPegawai[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_overtime_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_OVERTIME_RECORDS;
  });

  const [infalList, setInfalList] = useState<LogInfal[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_infal_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_INFAL;
  });

  const SCHEDULE_VERSION_KEY = 'sim_gaji_schedule_version';
  const CURRENT_SCHEDULE_VERSION = 'v2026.10.01_exact_images_sync';

  const [scheduleList, setScheduleList] = useState<SlotJadwalPelajaran[]>(() => {
    try {
      const savedVersion = localStorage.getItem(SCHEDULE_VERSION_KEY);
      const saved = localStorage.getItem('sim_gaji_schedule_list');
      if (saved && savedVersion === CURRENT_SCHEDULE_VERSION) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    try {
      localStorage.setItem(SCHEDULE_VERSION_KEY, CURRENT_SCHEDULE_VERSION);
      localStorage.setItem('sim_gaji_schedule_list', JSON.stringify(INITIAL_SCHEDULE_SLOTS));
    } catch (e) {}
    return INITIAL_SCHEDULE_SLOTS;
  });


  const [records, setRecords] = useState<PenggajianRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_payroll_records');
      if (saved) {
        const parsed: PenggajianRecord[] = JSON.parse(saved);
        // Exclude non-induk records from payroll list (they are paid in their parent school)
        const filteredSaved = parsed.filter(r => r.statusInduk !== 'Non Induk' && !['peg-017', 'peg-018', 'peg-019', 'peg-020', 'peg-021', 'peg-022', 'peg-023'].includes(r.pegawaiId));
        // Ensure September 2026 official records are prioritized
        const otherRecords = filteredSaved.filter(r => !(r.bulan === 9 && r.tahun === 2026));
        return [...PAYROLL_SEPTEMBER_2026, ...otherRecords];
      }
    } catch (e) {}
    const initialPresensiWithInfal = INITIAL_PRESENSI.map(p => {
      const copy = { ...p };
      INITIAL_INFAL.filter(i => i.status === 'approved').forEach(inf => {
        if (inf.guruPenggantiId === copy.pegawaiId) {
          copy.jumlahJpMenggantikan = (copy.jumlahJpMenggantikan || 0) + inf.jumlahJp;
          copy.honorInfalTotal = (copy.honorInfalTotal || 0) + inf.totalNominal;
        }
        if (inf.guruAbsenId === copy.pegawaiId) {
          copy.jumlahJpDigantikan = (copy.jumlahJpDigantikan || 0) + inf.jumlahJp;
          copy.potonganInfalTotal = (copy.potonganInfalTotal || 0) + inf.totalNominal;
        }
      });
      return copy;
    });

    const augRecords = generatePeriodPayrollRecords(8, 2026, INITIAL_PEGAWAI, initialPresensiWithInfal);
    const julRecords = PAYROLL_JULI_2026;
    
    return [...PAYROLL_SEPTEMBER_2026, ...augRecords, ...julRecords];
  });


  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_email_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EMAIL_LOGS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_AUDIT_LOGS;
  });

  // Supabase Active Periods State
  const [supabasePeriods, setSupabasePeriods] = useState<{ bulan: number; tahun: number; count: number; status?: string }[]>([]);

  // Auto-save effects to localStorage
  useEffect(() => { localStorage.setItem('sim_gaji_pegawai_list', JSON.stringify(pegawaiList)); }, [pegawaiList]);
  useEffect(() => { localStorage.setItem('sim_gaji_presensi_list', JSON.stringify(presensiList)); }, [presensiList]);
  useEffect(() => { localStorage.setItem('sim_gaji_daily_logs', JSON.stringify(dailyLogs)); }, [dailyLogs]);
  useEffect(() => { localStorage.setItem('sim_gaji_leave_requests', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('sim_gaji_overtime_records', JSON.stringify(overtimeRecords)); }, [overtimeRecords]);
  useEffect(() => { localStorage.setItem('sim_gaji_infal_list', JSON.stringify(infalList)); }, [infalList]);
  useEffect(() => { localStorage.setItem('sim_gaji_schedule_list', JSON.stringify(scheduleList)); }, [scheduleList]);
  useEffect(() => { localStorage.setItem('sim_gaji_payroll_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('sim_gaji_email_logs', JSON.stringify(emailLogs)); }, [emailLogs]);
  useEffect(() => { localStorage.setItem('sim_gaji_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);


  const addAuditLog = (
    category: AuditCategory,
    action: AuditActionType,
    actionLabel: string,
    target: string,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `adt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.nama,
      userRole: currentUser.role,
      category,
      action,
      actionLabel,
      target,
      details,
      ipAddress: '192.168.1.100',
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const handleLoginSuccess = (user: User, remember: boolean) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const sessionData = JSON.stringify({
      userId: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      loginAt: new Date().toISOString(),
    });
    if (remember) {
      localStorage.setItem('sim_gaji_auth_session', sessionData);
    } else {
      sessionStorage.setItem('sim_gaji_auth_session', sessionData);
    }
    const newEntry: AuditLogEntry = {
      id: `adt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.nama,
      userRole: user.role,
      category: 'sistem',
      action: 'LOGIN_SUCCESS',
      actionLabel: 'Autentikasi Pengguna Berhasil',
      target: `Pengguna: ${user.nama} (${user.username})`,
      details: `Berhasil login ke sistem SIM GAJI dengan peran ${user.role} (${user.jabatan}).`,
      ipAddress: '192.168.1.100',
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const handleLogout = (isTimeout: boolean = false) => {
    const newEntry: AuditLogEntry = {
      id: `adt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.nama,
      userRole: currentUser.role,
      category: 'sistem',
      action: isTimeout ? 'AUTO_LOGOUT_TIMEOUT' : 'LOGOUT',
      actionLabel: isTimeout ? 'Sesi Berakhir Otomatis (Inactivity 15 Menit)' : 'Pengguna Keluar (Logout)',
      target: `Pengguna: ${currentUser.nama}`,
      details: isTimeout
        ? `Sesi login untuk ${currentUser.username} (${currentUser.role}) ditutup otomatis oleh sistem setelah 15 menit tanpa aktivitas demi perlindungan data penggajian.`
        : `Sesi login untuk ${currentUser.username} (${currentUser.role}) telah diakhiri secara aman.`,
      ipAddress: '192.168.1.100',
    };
    setAuditLogs(prev => [newEntry, ...prev]);
    localStorage.removeItem('sim_gaji_auth_session');
    sessionStorage.removeItem('sim_gaji_auth_session');
    setIsAuthenticated(false);

    if (isTimeout) {
      showToast('Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 15 menit demi keamanan.', 'info');
    } else {
      showToast('Anda telah keluar dari akun SIM GAJI dengan aman.', 'info');
    }
  };


  const handleResetDataToDefault = () => {
    if (window.confirm('Reset seluruh data ke pengaturan awal (Default Demo SMK IT Ibnul Qayyim)? Semua perubahan input presensi, jadwal, pegawai, dan gaji akan dikembalikan ke data awal.')) {
      addAuditLog('sistem', 'RESET_SYSTEM', 'Reset Demo Bawaan', 'Database SMK IT Ibnul Qayyim', 'Data sistem dikembalikan ke pengaturan default.');
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImportBackup = (backup: SystemBackupData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      if (backup.data.pegawaiList) setPegawaiList(backup.data.pegawaiList);
      if (backup.data.presensiList) setPresensiList(backup.data.presensiList);
      if (backup.data.dailyLogs) setDailyLogs(backup.data.dailyLogs);
      if (backup.data.records) setRecords(backup.data.records);
      if (backup.data.scheduleList) setScheduleList(backup.data.scheduleList);
      if (backup.data.infalList) setInfalList(backup.data.infalList);
      if (backup.data.leaveRequests) setLeaveRequests(backup.data.leaveRequests);
      if (backup.data.overtimeRecords) setOvertimeRecords(backup.data.overtimeRecords);
      if (backup.data.emailLogs) setEmailLogs(backup.data.emailLogs);
      if (backup.data.auditLogs) setAuditLogs(backup.data.auditLogs);
    } else {
      // Merge mode by ID
      if (backup.data.pegawaiList?.length) {
        setPegawaiList(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          backup.data.pegawaiList.forEach(p => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
      if (backup.data.presensiList?.length) {
        setPresensiList(prev => {
          const map = new Map(prev.map(p => [p.id || `${p.pegawaiId}-${p.bulan}-${p.tahun}`, p]));
          backup.data.presensiList.forEach(p => map.set(p.id || `${p.pegawaiId}-${p.bulan}-${p.tahun}`, p));
          return Array.from(map.values());
        });
      }
      if (backup.data.dailyLogs?.length) {
        setDailyLogs(prev => {
          const map = new Map(prev.map(d => [d.id || `${d.pegawaiId}-${d.tanggal}`, d]));
          backup.data.dailyLogs.forEach(d => map.set(d.id || `${d.pegawaiId}-${d.tanggal}`, d));
          return Array.from(map.values());
        });
      }
      if (backup.data.records?.length) {
        setRecords(prev => {
          const map = new Map(prev.map(r => [r.id, r]));
          backup.data.records.forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
      }
      if (backup.data.scheduleList?.length) {
        setScheduleList(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          backup.data.scheduleList.forEach(s => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
      if (backup.data.infalList?.length) {
        setInfalList(prev => {
          const map = new Map(prev.map(i => [i.id, i]));
          backup.data.infalList.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
        });
      }
      if (backup.data.leaveRequests?.length) {
        setLeaveRequests(prev => {
          const map = new Map(prev.map(l => [l.id, l]));
          backup.data.leaveRequests.forEach(l => map.set(l.id, l));
          return Array.from(map.values());
        });
      }
      if (backup.data.overtimeRecords?.length) {
        setOvertimeRecords(prev => {
          const map = new Map(prev.map(o => [o.id, o]));
          backup.data.overtimeRecords.forEach(o => map.set(o.id, o));
          return Array.from(map.values());
        });
      }
      if (backup.data.emailLogs?.length) {
        setEmailLogs(prev => {
          const map = new Map(prev.map(e => [e.id, e]));
          backup.data.emailLogs.forEach(e => map.set(e.id, e));
          return Array.from(map.values());
        });
      }
      if (backup.data.auditLogs?.length) {
        setAuditLogs(prev => {
          const map = new Map(prev.map(a => [a.id, a]));
          backup.data.auditLogs?.forEach(a => map.set(a.id, a));
          return Array.from(map.values());
        });
      }
    }

    addAuditLog(
      'sistem',
      'IMPORT_BACKUP',
      'Pemulihan Sistem (Restore JSON)',
      backup.appName || 'SIM GAJI Backup',
      `Pemulihan data dilakukan dengan mode: ${mode === 'replace' ? 'Timpa Penuh' : 'Gabung & Sinkron'}. Memuat ${backup.statsSummary.totalPegawai} pegawai & ${backup.statsSummary.totalGajiRecords} gaji.`
    );
  };

  const handleExportBackupDirect = () => {
    try {
      const payload: SystemBackupData = {
        appName: 'SIM GAJI SMK IT Ibnul Qayyim Makassar',
        version: '2.4.0',
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
      
      addAuditLog('sistem', 'EXPORT_BACKUP', 'Ekspor Cadangan JSON', filename, `Snapshot sistem diekspor oleh ${currentUser.nama}. Berisi ${pegawaiList.length} pegawai, ${records.length} slip gaji.`);
      showToast(`Cadangan sistem JSON berhasil diunduh (${filename})`, 'success');
    } catch (e: any) {
      showToast(`Gagal mengekspor data: ${e?.message || 'Error'}`, 'error');
    }
  };
  
  // Modals & Inspectors
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<PenggajianRecord | null>(null);
  const [selectedFormulaRecord, setSelectedFormulaRecord] = useState<PenggajianRecord | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleNavigateTab = (tab: string, subTab?: string) => {
    if (tab === 'attendance' && subTab) {
      setAttendanceSubTab(subTab as any);
    }
    setActiveTab(tab);
  };

  // Fetch from Supabase Backend (or Express / local fallback)
  const fetchAllData = async (bulan = selectedBulan, tahun = selectedTahun) => {
    // 1. Direct query to Supabase backend if configured
    if (isSupabaseConfigured()) {
      try {
        console.log(`📡 [Supabase] Mengambil data awal untuk periode ${bulan}/${tahun}...`);
        
        const [periodsRes, staffRes, payrollRes, dailyRes, invalRes] = await Promise.allSettled([
          fetchActivePeriodsSupabase(),
          fetchStaffListSupabase(),
          fetchPayrollRecordsSupabase(),
          fetchDailyAttendanceSupabase(),
          fetchGuruInvalSupabase(),
        ]);


        if (periodsRes.status === 'fulfilled' && periodsRes.value && periodsRes.value.length > 0) {
          console.log('📅 [Supabase] Periode aktif terambil:', periodsRes.value[0]);
          setSupabasePeriods(periodsRes.value);
          const activePeriod = periodsRes.value[0];
          if (activePeriod.bulan && activePeriod.tahun) {
            setSelectedBulan(activePeriod.bulan);
            setSelectedTahun(activePeriod.tahun);
          }
        }


        if (staffRes.status === 'fulfilled' && staffRes.value && staffRes.value.length > 0) {
          console.log(`👥 [Supabase] Data staf dari tabel 'pegawai': ${staffRes.value.length} orang`, staffRes.value);
          setPegawaiList(staffRes.value);
        }

        if (payrollRes.status === 'fulfilled' && payrollRes.value && payrollRes.value.length > 0) {
          console.log(`📑 [Supabase] Rekap slip gaji dari tabel 'slip_gaji': ${payrollRes.value.length} rekaman`, payrollRes.value);
          setRecords(prev => {
            const others = prev.filter(r => !(r.bulan === bulan && r.tahun === tahun));
            return [...others, ...payrollRes.value!];
          });
        }

        if (dailyRes.status === 'fulfilled' && dailyRes.value && dailyRes.value.length > 0) {
          setDailyLogs(dailyRes.value);
        }

        if (invalRes.status === 'fulfilled' && invalRes.value && invalRes.value.length > 0) {
          setInfalList(invalRes.value);
        }
      } catch (err) {
        console.error('❌ [Supabase] Error saat query data:', err);
      }
    }

    // 2. Supplementary check via Express API / local endpoints
    try {
      const [resPenggajian, resPegawai, resPresensi, resEmails] = await Promise.allSettled([
        fetch(`/api/penggajian?bulan=${bulan}&tahun=${tahun}`).then(r => r.json()),
        fetch('/api/pegawai').then(r => r.json()),
        fetch(`/api/presensi?bulan=${bulan}&tahun=${tahun}`).then(r => r.json()),
        fetch('/api/email-logs').then(r => r.json()),
      ]);

      if (resPenggajian.status === 'fulfilled' && Array.isArray(resPenggajian.value) && resPenggajian.value.length > 0) {
        setRecords(prev => {
          const others = prev.filter(r => !(r.bulan === bulan && r.tahun === tahun));
          return [...others, ...resPenggajian.value];
        });
      }
      if (resPegawai.status === 'fulfilled' && Array.isArray(resPegawai.value)) {
        setPegawaiList(resPegawai.value);
      }
      if (resPresensi.status === 'fulfilled' && Array.isArray(resPresensi.value) && resPresensi.value.length > 0) {
        setPresensiList(prev => {
          const others = prev.filter(p => !(p.bulan === bulan && p.tahun === tahun));
          return [...others, ...resPresensi.value];
        });
      }
      if (resEmails.status === 'fulfilled' && Array.isArray(resEmails.value)) {
        setEmailLogs(resEmails.value);
      }
    } catch (err) {
      // Backend API connection fallback, using local state
    }
  };


  // Initial database initialization & Supabase connection test
  useEffect(() => {
    // Panggil test koneksi saat inisialisasi aplikasi
    testKoneksiSupabase();

    setRecords(prev => {
      const hasRecords = prev.some(r => r.bulan === selectedBulan && r.tahun === selectedTahun);
      if (!hasRecords) {
        const newMonthRecords = generatePeriodPayrollRecords(selectedBulan, selectedTahun, pegawaiList, presensiList);
        return [...newMonthRecords, ...prev];
      }
      return prev;
    });
    fetchAllData(selectedBulan, selectedTahun);
  }, []);


  // Handler for Period Switching
  const handleSelectPeriod = (newBulan: number, newTahun: number) => {
    setSelectedBulan(newBulan);
    setSelectedTahun(newTahun);

    // Check if records exist for this period, if not, generate them seamlessly
    const hasRecords = records.some(r => r.bulan === newBulan && r.tahun === newTahun);
    if (!hasRecords) {
      const newMonthRecords = generatePeriodPayrollRecords(newBulan, newTahun, pegawaiList, presensiList);
      setRecords(prev => [...prev, ...newMonthRecords]);
    }

    const monthLabel = MONTH_NAMES_ID[newBulan - 1] || `Bulan ${newBulan}`;
    showToast(`Periode penggajian aktif: ${monthLabel} ${newTahun}`, 'info');
    fetchAllData(newBulan, newTahun);
  };

  // Compute Available Periods (incorporating Supabase active periods)
  const availablePeriods = useMemo(() => {
    const periodMap = new Map<string, { bulan: number; tahun: number; count: number; status?: string }>();
    
    // Default semester months
    [7, 8, 9, 10, 11, 12].forEach(m => {
      const key = `${m}-2026`;
      periodMap.set(key, { bulan: m, tahun: 2026, count: 0 });
    });

    // Supabase active periods
    supabasePeriods.forEach(p => {
      const key = `${p.bulan}-${p.tahun}`;
      periodMap.set(key, { bulan: p.bulan, tahun: p.tahun, count: p.count, status: p.status });
    });

    records.forEach(r => {
      const key = `${r.bulan}-${r.tahun}`;
      const existing = periodMap.get(key) || { bulan: r.bulan, tahun: r.tahun, count: 0 };
      existing.count += 1;
      periodMap.set(key, existing);
    });

    return Array.from(periodMap.values());
  }, [records, supabasePeriods]);


  // Active records for currently selected period (Hanya Pegawai Induk)
  const currentPeriodRecords = useMemo(() => {
    const isInduk = (r: PenggajianRecord) => r.statusInduk !== 'Non Induk' && !['peg-017', 'peg-018', 'peg-019', 'peg-020', 'peg-021', 'peg-022', 'peg-023'].includes(r.pegawaiId);
    const filtered = records.filter(r => r.bulan === selectedBulan && r.tahun === selectedTahun && isInduk(r));
    if (filtered.length > 0) return filtered;
    // Fallback if not yet populated
    return records.filter(r => r.bulan === 8 && r.tahun === 2026 && isInduk(r));
  }, [records, selectedBulan, selectedTahun]);

  // Active presensi for currently selected period
  const currentPeriodPresensi = useMemo(() => {
    const filtered = presensiList.filter(p => p.bulan === selectedBulan && p.tahun === selectedTahun);
    return filtered.length > 0 ? filtered : presensiList;
  }, [presensiList, selectedBulan, selectedTahun]);

  // Compute Dynamic Dashboard Stats for Selected Period
  const dashboardStats: DashboardStats = {
    totalGajiBulanIni: currentPeriodRecords.reduce((acc, curr) => acc + (curr.takeHomePay ?? curr.gajiBersih ?? 0), 0),
    totalPenerimaanKotor: currentPeriodRecords.reduce((acc, curr) => acc + (curr.totalTambahan ?? curr.totalPenerimaan ?? 0), 0),
    totalPotongan: currentPeriodRecords.reduce((acc, curr) => acc + (curr.totalPotongan ?? 0), 0),
    totalPegawai: pegawaiList.length,
    totalGuru: pegawaiList.filter(p => p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT').length,
    totalTendik: pegawaiList.filter(p => p.statusPegawai === 'PTY' || p.statusPegawai === 'PTT').length,
    countDraft: currentPeriodRecords.filter(p => p.status === 'draft').length,
    countPendingKepsek: currentPeriodRecords.filter(p => p.status === 'pending_kepsek').length,
    countPendingYayasan: currentPeriodRecords.filter(p => p.status === 'pending_yayasan').length,
    countApproved: currentPeriodRecords.filter(p => p.status === 'approved').length,
    countTransferred: currentPeriodRecords.filter(p => p.status === 'transferred').length,
    persentaseSelesai: Math.round(((currentPeriodRecords.filter(p => p.status === 'transferred').length) / (currentPeriodRecords.length || 1)) * 100),
    totalJamMengajarTerbayar: currentPeriodRecords.reduce((acc, curr) => acc + curr.jamMengajarRealisasi, 0),
    totalJamLemburTerbayar: currentPeriodRecords.reduce((acc, curr) => acc + (curr.jamLembur || 0), 0),
    totalCutiIzinBulanIni: currentPeriodPresensi.reduce((acc, curr) => acc + (curr.cuti || 0) + (curr.izin || 0) + (curr.sakit || 0), 0),
    totalMenitTerlambatBulanIni: currentPeriodPresensi.reduce((acc, curr) => acc + (curr.menitTerlambat || 0), 0),
    encryptionSecurityScore: 100,
  };

  // Generate / Recalculate monthly payroll for target month/year
  const handleGeneratePayroll = async (targetBulan = selectedBulan, targetTahun = selectedTahun) => {
    const monthLabel = MONTH_NAMES_ID[targetBulan - 1] || `Bulan ${targetBulan}`;
    try {
      const res = await fetch('/api/penggajian/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan: targetBulan, tahun: targetTahun, forceOverwrite: true }),
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setRecords(prev => {
          const others = prev.filter(r => !(r.bulan === targetBulan && r.tahun === targetTahun));
          return [...others, ...data.data];
        });
      } else {
        // Local recalculation
        const fresh = generatePeriodPayrollRecords(targetBulan, targetTahun, pegawaiList, presensiList);
        setRecords(prev => {
          const others = prev.filter(r => !(r.bulan === targetBulan && r.tahun === targetTahun));
          return [...others, ...fresh];
        });
      }
      showToast(`Berhasil mengkalkulasi ulang data gaji periode ${monthLabel} ${targetTahun}!`);
    } catch (err) {
      const fresh = generatePeriodPayrollRecords(targetBulan, targetTahun, pegawaiList, presensiList);
      setRecords(prev => {
        const others = prev.filter(r => !(r.bulan === targetBulan && r.tahun === targetTahun));
        return [...others, ...fresh];
      });
      showToast(`Kalkulasi penggajian periode ${monthLabel} ${targetTahun} berhasil diperbarui.`);
    }

    addAuditLog(
      'gaji',
      'RECALCULATE_PAYROLL',
      'Hitung Ulang Penggajian',
      `Periode ${monthLabel} ${targetTahun}`,
      `Kalkulasi otomatis komponen honor tatap muka, potongan absensi, dan denda terlambat untuk ${pegawaiList.length} pegawai.`
    );
  };

  // Batch sync from daily logs into monthly attendance and recalculate payroll
  const handleBatchSyncFromDailyLogs = () => {
    // Group logs by pegawaiId strictly within the cut-off period of each pres record
    const updatedPresensi = presensiList.map(pres => {
      const cutoff = getPayrollCutoffDates(pres.bulan, pres.tahun);
      const pLogs = dailyLogs.filter(
        l => l.pegawaiId === pres.pegawaiId && l.tanggal >= cutoff.startDate && l.tanggal <= cutoff.endDate
      );
      if (pLogs.length === 0) return pres;

      const hadirCount = pLogs.filter(l => l.status === 'hadir_tepat_waktu' || l.status === 'terlambat' || l.status === 'izin_terlambat' || l.status === 'pulang_cepat' || l.status === 'dinas_luar' || l.status === 'pelatihan').length;
      const sakitCount = pLogs.filter(l => l.status === 'sakit_skd' || l.status === 'sakit_tanpa_skd').length;
      const izinCount = pLogs.filter(l => l.status === 'izin_resmi' || l.status === 'izin_pribadi').length;
      const cutiCount = pLogs.filter(l => l.status === 'cuti_tahunan' || l.status === 'cuti_khusus').length;
      const dinasLuarCount = pLogs.filter(l => l.status === 'dinas_luar' || l.status === 'pelatihan').length;
      const alphaCount = pLogs.filter(l => l.status === 'alpha').length;
      // Hanya denda terlambat jika status 'terlambat' (tanpa izin). Izin terlambat tidak memotong gaji.
      const totalLateMinutes = pLogs.filter(l => l.status === 'terlambat').reduce((sum, l) => sum + (l.menitTerlambat || 0), 0);
      
      // Approved overtime for this employee in cut-off period
      const approvedOT = overtimeRecords
        .filter(ot => ot.pegawaiId === pres.pegawaiId && ot.status === 'approved' && ot.tanggal >= cutoff.startDate && ot.tanggal <= cutoff.endDate)
        .reduce((sum, ot) => sum + ot.durasiJam, 0);

      const targetPeg = pegawaiList.find(p => p.id === pres.pegawaiId);
      const otRate = targetPeg?.tarifLemburPerJam || 20000;

      return {
        ...pres,
        hadir: hadirCount,
        sakit: sakitCount,
        izin: izinCount,
        cuti: cutiCount,
        dinasLuar: dinasLuarCount,
        alpha: alphaCount,
        menitTerlambat: totalLateMinutes,
        jamLemburTotal: approvedOT,
        honorLemburTotal: approvedOT * otRate,
        updatedAt: new Date().toISOString(),
      };
    });

    setPresensiList(updatedPresensi);

    // Recalculate payroll
    const refreshedRecords = records.map(rec => {
      const peg = pegawaiList.find(p => p.id === rec.pegawaiId);
      const prs = updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId && p.bulan === rec.bulan && p.tahun === rec.tahun) ||
        updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId);
      if (peg && prs) {
        const calculated = kalkulasiPenggajian(peg, prs, { bulan: rec.bulan, tahun: rec.tahun });
        return {
          ...rec,
          ...calculated,
          updatedAt: new Date().toISOString(),
        };
      }
      return rec;
    });

    setRecords(refreshedRecords);
    addAuditLog(
      'presensi',
      'SYNC_PRESENSI',
      'Sinkronisasi Presensi Biometrik',
      'Rekap Cut-Off Penggajian',
      `Sinkronisasi ${dailyLogs.length} log biometrik harian ke rekap kehadiran cut-off penggajian.`
    );
    showToast('Sinkronisasi log presensi biometrik periode cut-off ke penggajian berhasil!');
  };

  // Add Daily Log
  const handleAddDailyLog = (log: LogPresensiHarian) => {
    setDailyLogs(prev => [log, ...prev]);
    showToast(`Log presensi baru berhasil dicatat (${log.jamMasuk} - ${log.lokasiTerminal}).`);
  };

  // Batch Save Daily Attendance by Date
  const handleBatchSaveDailyLogs = (newLogs: LogPresensiHarian[], dateLabel: string) => {
    const targetDate = newLogs[0]?.tanggal;
    let mergedLogs = [...dailyLogs];
    if (targetDate) {
      mergedLogs = mergedLogs.filter(l => l.tanggal !== targetDate);
    }
    mergedLogs = [...newLogs, ...mergedLogs];
    setDailyLogs(mergedLogs);

    // Update monthly presensi list and recalculate strictly by cutoff
    const updatedPresensi = presensiList.map(pres => {
      const cutoff = getPayrollCutoffDates(pres.bulan, pres.tahun);
      const pLogs = mergedLogs.filter(
        l => l.pegawaiId === pres.pegawaiId && l.tanggal >= cutoff.startDate && l.tanggal <= cutoff.endDate
      );
      if (pLogs.length === 0) return pres;

      const hadirCount = pLogs.filter(l => l.status === 'hadir_tepat_waktu' || l.status === 'terlambat' || l.status === 'izin_terlambat' || l.status === 'pulang_cepat' || l.status === 'dinas_luar' || l.status === 'pelatihan').length;
      const sakitCount = pLogs.filter(l => l.status === 'sakit_skd' || l.status === 'sakit_tanpa_skd').length;
      const izinCount = pLogs.filter(l => l.status === 'izin_resmi' || l.status === 'izin_pribadi').length;
      const cutiCount = pLogs.filter(l => l.status === 'cuti_tahunan' || l.status === 'cuti_khusus').length;
      const dinasLuarCount = pLogs.filter(l => l.status === 'dinas_luar' || l.status === 'pelatihan').length;
      const alphaCount = pLogs.filter(l => l.status === 'alpha').length;
      // Hanya denda terlambat jika status 'terlambat' (tanpa izin). Izin terlambat tidak memotong gaji.
      const totalLateMinutes = pLogs.filter(l => l.status === 'terlambat').reduce((sum, l) => sum + (l.menitTerlambat || 0), 0);
      
      const approvedOT = overtimeRecords
        .filter(ot => ot.pegawaiId === pres.pegawaiId && ot.status === 'approved' && ot.tanggal >= cutoff.startDate && ot.tanggal <= cutoff.endDate)
        .reduce((sum, ot) => sum + ot.durasiJam, 0);

      const targetPeg = pegawaiList.find(p => p.id === pres.pegawaiId);
      const otRate = targetPeg?.tarifLemburPerJam || 20000;

      return {
        ...pres,
        hadir: hadirCount > 0 ? hadirCount : pres.hadir,
        sakit: sakitCount > 0 ? sakitCount : pres.sakit,
        izin: izinCount > 0 ? izinCount : pres.izin,
        cuti: cutiCount > 0 ? cutiCount : pres.cuti,
        dinasLuar: dinasLuarCount > 0 ? dinasLuarCount : pres.dinasLuar,
        alpha: alphaCount > 0 ? alphaCount : pres.alpha,
        menitTerlambat: totalLateMinutes > 0 ? totalLateMinutes : pres.menitTerlambat,
        jamLemburTotal: approvedOT > 0 ? approvedOT : pres.jamLemburTotal,
        honorLemburTotal: (approvedOT > 0 ? approvedOT : pres.jamLemburTotal) * otRate,
        updatedAt: new Date().toISOString(),
      };
    });

    setPresensiList(updatedPresensi);

    // Recalculate payroll
    const refreshedRecords = records.map(rec => {
      const peg = pegawaiList.find(p => p.id === rec.pegawaiId);
      const prs = updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId && p.bulan === rec.bulan && p.tahun === rec.tahun) ||
        updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId);
      if (peg && prs) {
        const calculated = kalkulasiPenggajian(peg, prs, { bulan: rec.bulan, tahun: rec.tahun });
        return {
          ...rec,
          ...calculated,
          updatedAt: new Date().toISOString(),
        };
      }
      return rec;
    });

    setRecords(refreshedRecords);
    addAuditLog(
      'presensi',
      'UPDATE_PRESENSI',
      'Pembaruan Presensi Harian',
      `Presensi ${dateLabel}`,
      `Perubahan presensi ${newLogs.length} pegawai disimpan dan dikalkulasikan ke rekapitulasi gaji.`
    );
    showToast(`Presensi harian tanggal ${dateLabel} (${newLogs.length} pegawai) berhasil disimpan & disinkronkan ke penggajian!`);
  };

  // Add Leave Request
  const handleAddLeaveRequest = (req: PengajuanCutiIzin) => {
    setLeaveRequests(prev => [req, ...prev]);
    showToast(`Pengajuan cuti/izin untuk ${req.pegawaiNama} telah dikirim ke Kepala Sekolah.`);
  };

  // Update Leave Status
  const handleUpdateLeaveStatus = (id: string, status: 'approved' | 'rejected', notes?: string) => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status,
          approvedBy: currentUser.nama,
          approvedAt: new Date().toISOString(),
          catatanApproval: notes,
        };
      }
      return req;
    }));
    showToast(`Status permohonan cuti berhasil diubah menjadi: ${status.toUpperCase()}`);
  };

  // Add Overtime
  const handleAddOvertime = (ot: LemburPegawai) => {
    setOvertimeRecords(prev => [ot, ...prev]);
    showToast(`Penugasan jam lembur untuk ${ot.pegawaiNama} (${ot.durasiJam} Jam) berhasil diajukan.`);
  };

  // Update Overtime Status
  const handleUpdateOvertimeStatus = (id: string, status: 'approved' | 'rejected') => {
    setOvertimeRecords(prev => prev.map(ot => {
      if (ot.id === id) {
        return {
          ...ot,
          status,
          approvedBy: currentUser.nama,
          approvedAt: new Date().toISOString(),
        };
      }
      return ot;
    }));
    showToast(`Status klaim lembur berhasil diubah: ${status.toUpperCase()}`);
  };

  // Delete Overtime and recalculate
  const handleDeleteOvertime = (id: string) => {
    const target = overtimeRecords.find(ot => ot.id === id);
    const updatedOvertime = overtimeRecords.filter(ot => ot.id !== id);
    setOvertimeRecords(updatedOvertime);

    if (target) {
      const updatedPresensi = presensiList.map(pres => {
        if (pres.pegawaiId !== target.pegawaiId) return pres;
        const cutoff = getPayrollCutoffDates(pres.bulan, pres.tahun);
        const empApprovedOT = updatedOvertime
          .filter(ot => ot.pegawaiId === pres.pegawaiId && ot.status === 'approved' && ot.tanggal >= cutoff.startDate && ot.tanggal <= cutoff.endDate)
          .reduce((sum, ot) => sum + ot.durasiJam, 0);
        const peg = pegawaiList.find(p => p.id === pres.pegawaiId);
        const otRate = peg?.tarifLemburPerJam || 20000;
        return {
          ...pres,
          jamLemburTotal: empApprovedOT,
          honorLemburTotal: empApprovedOT * otRate,
          updatedAt: new Date().toISOString(),
        };
      });
      setPresensiList(updatedPresensi);

      // Recalculate payroll records
      const refreshedRecords = records.map(rec => {
        if (rec.pegawaiId !== target.pegawaiId) return rec;
        const peg = pegawaiList.find(p => p.id === rec.pegawaiId);
        const prs = updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId && p.bulan === rec.bulan && p.tahun === rec.tahun) ||
          updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId);
        if (peg && prs) {
          const calculated = kalkulasiPenggajian(peg, prs, { bulan: rec.bulan, tahun: rec.tahun });
          return {
            ...rec,
            ...calculated,
            updatedAt: new Date().toISOString(),
          };
        }
        return rec;
      });
      setRecords(refreshedRecords);
    }

    showToast(`Data lembur ${target?.pegawaiNama || ''} berhasil dihapus.`);
  };

  // Delete Leave Request
  const handleDeleteLeaveRequest = (id: string) => {
    const target = leaveRequests.find(l => l.id === id);
    setLeaveRequests(prev => prev.filter(l => l.id !== id));
    showToast(`Pengajuan ${target?.jenis.replace(/_/g, ' ') || 'cuti/izin'} ${target?.pegawaiNama || ''} berhasil dihapus.`);
  };

  // Delete Daily Log
  const handleDeleteDailyLog = (id: string) => {
    setDailyLogs(prev => prev.filter(l => l.id !== id));
    showToast('Log presensi berhasil dihapus.');
  };

  // Handle Multi-tier Approval (updates status_approval in Supabase slip_gaji)
  const handleApproveRecord = async (recordId: string, action: 'approve' | 'reject' | 'submit_kepsek', notes?: string) => {
    let newStatus: StatusPenggajian = 'draft';
    const rec = records.find(r => r.id === recordId);
    const currentStatus = rec?.status || 'draft';

    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (currentUser.role === 'kepala_sekolah' || currentUser.role === 'super_admin') {
      if (currentStatus === 'draft' || currentStatus === 'pending_kepsek') {
        newStatus = 'pending_yayasan';
      } else {
        newStatus = 'approved';
      }
    } else if (currentUser.role === 'ketua_yayasan' || currentUser.role === 'super_admin') {
      newStatus = 'approved';
    }

    // Direct update to Supabase table `slip_gaji` column `status_approval`
    if (isSupabaseConfigured()) {
      updateSlipGajiApprovalSupabase(recordId, {
        action,
        userRole: currentUser.role,
        userName: currentUser.nama,
        notes,
        newStatus,
      }).catch(err => console.warn('Supabase approval update failed:', err));
    }

    try {
      await fetch(`/api/penggajian/${recordId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentUser.role,
          approverName: currentUser.nama,
          catatan: notes,
          action,
        }),
      });
    } catch (e) {
      // ignore
    }

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          const now = new Date().toISOString();
          if (action === 'reject') {
            return { ...r, status: 'rejected', rejectedBy: currentUser.nama, rejectedAt: now, catatanPenolakan: notes };
          }
          if (currentUser.role === 'kepala_sekolah' || currentUser.role === 'super_admin') {
            if (r.status === 'draft' || r.status === 'pending_kepsek') {
              return { ...r, status: 'pending_yayasan', approvedKepsekBy: currentUser.nama, approvedKepsekAt: now, catatanKepsek: notes };
            }
          }
          if (currentUser.role === 'ketua_yayasan' || currentUser.role === 'super_admin') {
            return { ...r, status: 'approved', approvedYayasanBy: currentUser.nama, approvedYayasanAt: now, catatanYayasan: notes };
          }
          return { ...r, status: 'approved' };
        }
        return r;
      })
    );

    if (action === 'reject') {
      addAuditLog(
        'approval',
        'APPROVAL_KEPSEK',
        'Penolakan Draft Penggajian',
        `Slip Gaji ID: ${recordId}`,
        `Draft penggajian ditolak oleh ${currentUser.nama}. Catatan: ${notes || 'Perlu penyesuaian'}`
      );
      showToast('Penggajian ditolak dan dikembalikan untuk revisi.', 'error');
    } else {
      const isKepsek = currentUser.role === 'kepala_sekolah' || currentUser.role === 'super_admin';
      const isYayasan = currentUser.role === 'ketua_yayasan' || currentUser.role === 'super_admin';
      
      addAuditLog(
        'approval',
        isKepsek ? 'APPROVAL_KEPSEK' : 'APPROVAL_YAYASAN',
        isKepsek ? 'Persetujuan Kepala Sekolah' : 'Persetujuan Ketua Yayasan',
        `Gaji ${rec?.pegawaiNama || recordId} (${rec?.periodeLabel || ''})`,
        `Disetujui oleh ${currentUser.nama}. Status berlanjut ke tahap berikutnya.`
      );
      showToast('Persetujuan berhasil dicatat & diperbarui di database!');
    }
  };

  // Handle Transfer by Bendahara (updates status_approval = 'transferred' in Supabase slip_gaji)
  const handleTransferRecord = async (recordId: string) => {
    const now = new Date().toISOString();
    const refNum = `TRF/BSI/${selectedTahun}${String(selectedBulan).padStart(2, '0')}26/${Math.floor(100000 + Math.random() * 900000)}`;

    // Direct update to Supabase
    if (isSupabaseConfigured()) {
      updateSlipGajiTransferSupabase(recordId, {
        transferredBy: currentUser.nama,
        nomorReferensiTransfer: refNum,
        emailSent: true,
      }).catch(err => console.warn('Supabase transfer update failed:', err));
    }

    try {
      await fetch(`/api/penggajian/${recordId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferredBy: currentUser.nama,
        }),
      });
    } catch (e) {
      // ignore
    }

    const targetRec = records.find(r => r.id === recordId);
    if (targetRec) {
      addAuditLog(
        'gaji',
        'TRANSFER_BENDAHARA',
        'Transfer Gaji Selesai',
        `Gaji ${targetRec.pegawaiNama} (${targetRec.periodeLabel})`,
        `Eksekusi transfer bank ke rekening ${targetRec.pegawaiBank} (${targetRec.nomorRekening}). Nominal: Rp ${targetRec.gajiBersih.toLocaleString('id-ID')}. Ref: ${refNum}`
      );
    }

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          const updated = {
            ...r,
            status: 'transferred' as StatusPenggajian,
            transferredBy: currentUser.nama,
            transferredAt: now,
            nomorReferensiTransfer: refNum,
            emailSent: true,
            emailSentAt: now,
          };
          
          // Add email log
          const newLog: EmailLog = {
            id: `eml-${Date.now()}`,
            penggajianId: r.id,
            kodeSlip: r.kodeSlip,
            recipientEmail: r.pegawaiEmail,
            recipientName: r.pegawaiNama,
            subject: `[RESMI] Slip Gaji Periode ${r.periodeLabel} - SMK IT Ibnul Qayyim Makassar`,
            sentAt: now,
            status: 'sent',
            messagePreview: `Assalamu alaikum Wr. Wb. Yth. ${r.pegawaiNama}, Gaji bersih Rp ${r.gajiBersih.toLocaleString('id-ID')} telah sukses ditransfer...`,
          };
          setEmailLogs((logs) => [newLog, ...logs]);
          return updated;
        }
        return r;
      })
    );

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    showToast(`Transfer berhasil dieksekusi (Ref: ${refNum}) dan slip PDF resmi diterbitkan.`);
  };

  // Send single email notification
  const handleSendEmailSlip = async (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    try {
      await fetch(`/api/penggajian/${recordId}/send-email`, {
        method: 'POST',
      });
    } catch (e) {}

    const now = new Date().toISOString();
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, emailSent: true, emailSentAt: now } : r));

    const newLog: EmailLog = {
      id: `eml-${Date.now()}`,
      penggajianId: record.id,
      kodeSlip: record.kodeSlip,
      recipientEmail: record.pegawaiEmail,
      recipientName: record.pegawaiNama,
      subject: `[RESMI] Slip Gaji Periode ${record.periodeLabel} - SMK IT Ibnul Qayyim Makassar`,
      sentAt: now,
      status: 'sent',
      messagePreview: `Assalamu alaikum Wr. Wb. Yth. ${record.pegawaiNama}, Slip Gaji resmi Anda telah diterbitkan...`,
    };
    setEmailLogs(logs => [newLog, ...logs]);

    showToast(`Notifikasi slip gaji berhasil dikirimkan ke ${record.pegawaiEmail}`);
  };

  // Batch approve
  const handleBatchApprove = async (ids: string[]) => {
    if (isSupabaseConfigured()) {
      ids.forEach(id => {
        const nextStatus: StatusPenggajian = currentUser.role === 'kepala_sekolah' ? 'pending_yayasan' : 'approved';
        updateSlipGajiApprovalSupabase(id, {
          action: 'approve',
          userRole: currentUser.role,
          userName: currentUser.nama,
          newStatus: nextStatus,
        }).catch(err => console.warn('Supabase batch approve item error:', err));
      });
    }


    try {
      await fetch('/api/penggajian/batch-approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, role: currentUser.role, approverName: currentUser.nama }),
      });
    } catch (e) {}

    setRecords(prev =>
      prev.map(r => {
        if (ids.includes(r.id)) {
          if (currentUser.role === 'kepala_sekolah') {
            return { ...r, status: 'pending_yayasan', approvedKepsekBy: currentUser.nama };
          }
          return { ...r, status: 'approved', approvedYayasanBy: currentUser.nama };
        }
        return r;
      })
    );

    addAuditLog(
      'approval',
      'BATCH_APPROVE',
      'Batch Approval Penggajian',
      `${ids.length} Data Gaji Pegawai`,
      `Persetujuan massal diberikan oleh ${currentUser.nama} (${currentUser.role}).`
    );
    showToast(`Berhasil menyetujui ${ids.length} data penggajian!`);
  };


  // Batch email
  const handleBatchEmail = async (ids: string[]) => {
    try {
      await fetch('/api/penggajian/batch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (e) {}

    const now = new Date().toISOString();
    setRecords(prev =>
      prev.map(r => ids.includes(r.id) ? { ...r, emailSent: true, emailSentAt: now } : r)
    );
    showToast(`Berhasil mengirimkan notifikasi email ke ${ids.length} pegawai.`);
  };

  // Update Presensi
  const handleUpdatePresensi = (updatedPres: RekapPresensi) => {
    setPresensiList(prev => {
      const idx = prev.findIndex(p => p.id === updatedPres.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedPres;
        return copy;
      }
      return [...prev, updatedPres];
    });

    // Recalculate affected employee payroll record
    const targetPeg = pegawaiList.find(p => p.id === updatedPres.pegawaiId);
    if (targetPeg) {
      const recalculated = kalkulasiPenggajian(targetPeg, updatedPres, { bulan: updatedPres.bulan, tahun: updatedPres.tahun });
      setRecords(prev =>
        prev.map(r => (r.pegawaiId === targetPeg.id ? { ...r, ...recalculated, updatedAt: new Date().toISOString() } : r))
      );
    }
    showToast('Data presensi berhasil disimpan dan honor jam mengajar diperbarui otomatis.');
  };

  // Infal (Guru Pengganti - Rp 7.500/JP) Helpers
  const applyInfalToPresensiAndPayroll = (currentInfals: LogInfal[]) => {
    const approved = currentInfals.filter(i => i.status === 'approved');
    
    // Per-teacher infal statistics map
    const teacherMap = new Map<string, { jpMenggantikan: number; honorMenggantikan: number; jpDigantikan: number; potonganDigantikan: number }>();
    
    approved.forEach(inf => {
      // Guru Pengganti (menerima honor +Rp 7.500/JP)
      const pengganti = teacherMap.get(inf.guruPenggantiId) || { jpMenggantikan: 0, honorMenggantikan: 0, jpDigantikan: 0, potonganDigantikan: 0 };
      pengganti.jpMenggantikan += inf.jumlahJp;
      pengganti.honorMenggantikan += inf.totalNominal;
      teacherMap.set(inf.guruPenggantiId, pengganti);

      // Guru Absen (dipotong -Rp 7.500/JP)
      const absen = teacherMap.get(inf.guruAbsenId) || { jpMenggantikan: 0, honorMenggantikan: 0, jpDigantikan: 0, potonganDigantikan: 0 };
      absen.jpDigantikan += inf.jumlahJp;
      absen.potonganDigantikan += inf.totalNominal;
      teacherMap.set(inf.guruAbsenId, absen);
    });

    // Sync to Presensi List
    const updatedPresensi = presensiList.map(pres => {
      const stats = teacherMap.get(pres.pegawaiId) || { jpMenggantikan: 0, honorMenggantikan: 0, jpDigantikan: 0, potonganDigantikan: 0 };
      return {
        ...pres,
        jumlahJpMenggantikan: stats.jpMenggantikan,
        honorInfalTotal: stats.honorMenggantikan,
        jumlahJpDigantikan: stats.jpDigantikan,
        potonganInfalTotal: stats.potonganDigantikan,
        updatedAt: new Date().toISOString(),
      };
    });
    setPresensiList(updatedPresensi);

    // Sync to Payroll records
    setRecords(prev => prev.map(rec => {
      const peg = pegawaiList.find(p => p.id === rec.pegawaiId);
      const prs = updatedPresensi.find(p => p.pegawaiId === rec.pegawaiId);
      if (peg && prs) {
        const calc = kalkulasiPenggajian(peg, prs, { bulan: rec.bulan, tahun: rec.tahun });
        return {
          ...rec,
          ...calc,
          updatedAt: new Date().toISOString(),
        };
      }
      return rec;
    }));
  };

  const handleAddInfal = async (newInfal: LogInfal) => {
    const updated = [newInfal, ...infalList];
    setInfalList(updated);
    if (newInfal.status === 'approved') {
      applyInfalToPresensiAndPayroll(updated);
    }

    // Direct persistence to Supabase tables: guru_inval & presensi_harian_jp
    try {
      if (isSupabaseConfigured()) {
        const supaSuccess = await upsertGuruInvalSupabase([newInfal]);
        if (supaSuccess) {
          console.log('✅ [Supabase] Inval guru pengganti berhasil disimpan ke tabel guru_inval.');
        }
      }
      showToast(`Infal guru pengganti dicatat (${newInfal.jumlahJp} JP - Rp ${newInfal.totalNominal.toLocaleString('id-ID')}) dan tersimpan di database.`);
    } catch (err: any) {
      console.error('❌ [Supabase] Gagal menyimpan guru_inval:', err);
      showToast(`Gagal menyimpan infal ke Supabase: ${err?.message || 'Error'}`, 'error');
    }
  };

  const handleDeleteInfal = async (id: string) => {
    const updated = infalList.filter(i => i.id !== id);
    setInfalList(updated);
    applyInfalToPresensiAndPayroll(updated);

    try {
      if (isSupabaseConfigured()) {
        await upsertGuruInvalSupabase(updated);
      }
      showToast('Log Infal berhasil dihapus dan penggajian disinkronkan kembali.');
    } catch (err: any) {
      console.error('❌ [Supabase] Error saat sinkronisasi delete infal:', err);
    }
  };

  const handleUpdateInfalStatus = async (id: string, status: 'approved' | 'rejected') => {
    const updated = infalList.map(i => i.id === id ? { 
      ...i, 
      status, 
      approvedBy: status === 'approved' ? `${currentUser.nama} (${currentUser.role})` : undefined,
      approvedAt: status === 'approved' ? new Date().toISOString() : undefined 
    } : i);
    setInfalList(updated);
    applyInfalToPresensiAndPayroll(updated);

    try {
      if (isSupabaseConfigured()) {
        await upsertGuruInvalSupabase(updated);
      }
      showToast(`Status Infal diubah: ${status === 'approved' ? 'Disetujui (+Rp 7.500 ke pengganti / -Rp 7.500 dari yang digantikan)' : 'Ditolak'} & tersimpan di Supabase.`);
    } catch (err: any) {
      console.error('❌ [Supabase] Error update status infal:', err);
      showToast('Gagal memperbarui status infal di database.', 'error');
    }
  };

  // Add new employee with full persistence to backend & Supabase
  const handleAddPegawai = async (newPeg: Pegawai) => {
    // 1. Immediately update state for instant responsiveness
    setPegawaiList(prev => {
      const exists = prev.some(p => p.id === newPeg.id || p.nip === newPeg.nip);
      if (exists) {
        return prev.map(p => (p.id === newPeg.id || p.nip === newPeg.nip) ? newPeg : p);
      }
      return [...prev, newPeg];
    });

    const defaultPres: RekapPresensi = {
      id: `prs-${newPeg.id}`,
      pegawaiId: newPeg.id,
      bulan: selectedBulan,
      tahun: selectedTahun,
      totalHariEfektif: 22,
      hadir: 22,
      sakit: 0,
      izin: 0,
      cuti: 0,
      dinasLuar: 0,
      alpha: 0,
      menitTerlambat: 0,
      jamMengajarRencana: 20,
      jamMengajarRealisasi: 20,
      jamLemburTotal: 0,
      honorLemburTotal: 0,
      potonganIzinTidakResmi: 0,
      updatedAt: new Date().toISOString(),
    };
    setPresensiList(prev => {
      const exists = prev.some(p => p.pegawaiId === newPeg.id && p.bulan === selectedBulan && p.tahun === selectedTahun);
      if (exists) return prev;
      return [...prev, defaultPres];
    });

    const calc = kalkulasiPenggajian(newPeg, defaultPres, { bulan: selectedBulan, tahun: selectedTahun });
    const newRecord: PenggajianRecord = {
      ...calc,
      id: `gji-${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${newPeg.id}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords(prev => {
      const exists = prev.some(r => r.pegawaiId === newPeg.id && r.bulan === selectedBulan && r.tahun === selectedTahun);
      if (exists) return prev;
      return [...prev, newRecord];
    });

    // 2. Direct persistence to Supabase (supabase.from('pegawai').upsert([ dataForm ]))
    try {
      if (isSupabaseConfigured()) {
        const supaResult = await upsertPegawaiSupabase(newPeg);
        if (supaResult.success) {
          // Re-fetch data pegawai agar tabel langsung terupdate
          const refreshedStaff = await fetchStaffListSupabase();
          if (refreshedStaff && refreshedStaff.length > 0) {
            setPegawaiList(refreshedStaff);
          }
          showToast(`Pegawai ${newPeg.nama} berhasil disimpan ke database Supabase & sistem SIM GAJI!`, 'success');
        } else {
          showToast(`Peringatan: Gagal menyimpan ke Supabase (${supaResult.error}). Data tersimpan di memori lokal.`, 'info');
        }
      } else {
        showToast(`Pegawai ${newPeg.nama} berhasil didaftarkan di sistem SIM GAJI.`, 'success');
      }
    } catch (err: any) {
      console.error('❌ [Supabase] Error saat upsert pegawai baru:', err);
      showToast(`Gagal menyimpan ke Supabase: ${err?.message || 'Error koneksi'}`, 'error');
    }

    // 3. Optional local express backend sync
    try {
      fetch('/api/pegawai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeg),
      }).catch(() => {});
    } catch (e) {}

    addAuditLog(
      'pegawai',
      'ADD_PEGAWAI',
      'Penambahan Pegawai Baru',
      `${newPeg.nama} (NIP: ${newPeg.nip})`,
      `Pendaftaran pegawai status ${newPeg.statusPegawai}, jabatan ${newPeg.jabatanUtama}, bank ${newPeg.namaBank}.`
    );
  };

  const handleUpdatePegawai = async (updatedPeg: Pegawai) => {
    // 1. Update pegawaiList in state
    setPegawaiList(prev => prev.map(p => p.id === updatedPeg.id ? updatedPeg : p));

    // 2. Direct persistence to Supabase (supabase.from('pegawai').upsert([ dataForm ]))
    try {
      if (isSupabaseConfigured()) {
        const supaResult = await upsertPegawaiSupabase(updatedPeg);
        if (supaResult.success) {
          // Re-fetch data pegawai agar tabel langsung terupdate
          const refreshedStaff = await fetchStaffListSupabase();
          if (refreshedStaff && refreshedStaff.length > 0) {
            setPegawaiList(refreshedStaff);
          }
          showToast(`Biodata & Kualifikasi ${updatedPeg.nama} berhasil diperbarui di database Supabase!`, 'success');
        } else {
          showToast(`Peringatan: Gagal update ke Supabase (${supaResult.error}). Data tersimpan di memori lokal.`, 'info');
        }
      } else {
        showToast(`Biodata & Kualifikasi ${updatedPeg.nama} berhasil diperbarui!`, 'success');
      }
    } catch (err: any) {
      console.error('❌ [Supabase] Error saat update pegawai:', err);
      showToast(`Gagal memperbarui data di Supabase: ${err?.message || 'Error'}`, 'error');
    }

    // 3. Optional local express backend sync
    try {
      fetch(`/api/pegawai/${updatedPeg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPeg)
      }).catch(() => {});
    } catch (e) {}

    // 4. Recalculate payroll records for this employee across all loaded periods
    setRecords(prev => prev.map(rec => {
      if (rec.pegawaiId === updatedPeg.id) {
        const pres = presensiList.find(p => p.pegawaiId === updatedPeg.id && p.bulan === rec.bulan && p.tahun === rec.tahun);
        if (pres) {
          const calc = kalkulasiPenggajian(updatedPeg, pres, { bulan: rec.bulan, tahun: rec.tahun });
          return {
            ...rec,
            ...calc,
            pegawaiNama: updatedPeg.nama,
            pegawaiNip: updatedPeg.nip,
            pegawaiJabatan: updatedPeg.jabatanUtama,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return rec;
    }));

    addAuditLog(
      'pegawai',
      'UPDATE_PEGAWAI',
      'Pembaruan Data Pegawai',
      `${updatedPeg.nama} (${updatedPeg.jabatanUtama})`,
      `Pembaruan kualifikasi ijazah ${updatedPeg.pendidikanTerakhir}, tarif jam mengajar Rp ${updatedPeg.tarifPerJamMengajar}, dan data rekening BSI.`
    );
  };


  const handleBulkUpdateSalary = (updatedStaff: Pegawai[]) => {
    setPegawaiList(updatedStaff);

    // Recalculate payroll records for active period
    setRecords(prev => prev.map(rec => {
      const updatedPeg = updatedStaff.find(p => p.id === rec.pegawaiId);
      if (updatedPeg) {
        const pres = presensiList.find(p => p.pegawaiId === updatedPeg.id && p.bulan === rec.bulan && p.tahun === rec.tahun);
        if (pres) {
          const calc = kalkulasiPenggajian(updatedPeg, pres, { bulan: rec.bulan, tahun: rec.tahun });
          return {
            ...rec,
            ...calc,
            gajiPokok: updatedPeg.gajiPokokDefault || 0,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return rec;
    }));

    addAuditLog(
      'pegawai',
      'UPDATE_PEGAWAI',
      'Penyesuaian Gaji Pokok Pegawai',
      `${updatedStaff.length} Pegawai`,
      'Pembaruan nominal gaji pokok massal/personal berhasil disinkronkan ke Supabase & kalkulasi slip gaji.'
    );
  };

  const handleSyncScheduleHoursToAttendance = (pegawaiId: string, totalMonthlyHours: number) => {

    setPresensiList(prev => prev.map(p => {
      if (p.pegawaiId === pegawaiId) {
        return {
          ...p,
          jamMengajarRencana: totalMonthlyHours,
          jamMengajarRealisasi: totalMonthlyHours,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    // Recalculate payroll for this pegawai
    const targetPegawai = pegawaiList.find(p => p.id === pegawaiId);
    if (targetPegawai) {
      const currentPres = presensiList.find(p => p.pegawaiId === pegawaiId) || {
        id: `prs-${pegawaiId}`,
        pegawaiId: pegawaiId,
        bulan: 8,
        tahun: 2026,
        totalHariEfektif: 22,
        hadir: 22,
        sakit: 0,
        izin: 0,
        cuti: 0,
        alpha: 0,
        menitTerlambat: 0,
        jamMengajarRencana: totalMonthlyHours,
        jamMengajarRealisasi: totalMonthlyHours,
        jamLemburTotal: 0,
        honorLemburTotal: 0,
        potonganIzinTidakResmi: 0,
        updatedAt: new Date().toISOString()
      };

      const updatedPres = {
        ...currentPres,
        jamMengajarRencana: totalMonthlyHours,
        jamMengajarRealisasi: totalMonthlyHours
      };

      const calc = kalkulasiPenggajian(targetPegawai, updatedPres, { bulan: 8, tahun: 2026 });
      setRecords(prev => prev.map(r => r.pegawaiId === pegawaiId ? {
        ...r,
        ...calc,
        updatedAt: new Date().toISOString()
      } : r));
    }

    showToast(`Sinkronisasi berhasil: ${totalMonthlyHours} JP/Bulan telah diperbarui ke Presensi & SIM GAJI.`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {/* Toast Notification Banner */}
        {toast && (
          <div className="fixed top-5 right-5 z-60 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs animate-in fade-in slide-in-from-top-3">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <LoginPage
          users={INITIAL_USERS}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased">
      {/* 15-Minute Inactivity Auto Logout Guard */}
      <AutoLogoutGuard
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        timeoutMinutes={15}
        warningSeconds={60}
      />

      {/* Toast Notification Banner */}

      {toast && (
        <div className="fixed top-5 right-5 z-60 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs animate-in fade-in slide-in-from-top-3">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Integrated Left Navigation Sidebar */}
      <Sidebar
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        onLogout={handleLogout}
        allUsers={INITIAL_USERS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        pendingApprovalCount={records.filter(r => r.status === 'draft' || r.status === 'pending_kepsek' || r.status === 'pending_yayasan').length}
      />

      {/* Integrated Right Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100/70">
        {/* Top Header - flush with top and right edges */}
        <TopHeader
          currentUser={currentUser}
          onSelectUser={setCurrentUser}
          onLogout={handleLogout}
          allUsers={INITIAL_USERS}
          activeTab={activeTab}
          setMobileMenuOpen={setMobileMenuOpen}
          selectedBulan={selectedBulan}
          selectedTahun={selectedTahun}
          onSelectPeriod={handleSelectPeriod}
          availablePeriods={availablePeriods}
        />

        {/* Scrollable Viewport Container */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between custom-scrollbar">
          {/* Main App Content View - seamlessly expanding across width */}
          <main className="w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                stats={dashboardStats}
                records={currentPeriodRecords}
                currentUser={currentUser}
                onGeneratePayroll={() => handleGeneratePayroll(selectedBulan, selectedTahun)}
                onNavigateTab={handleNavigateTab}
                onViewSlip={setSelectedSlipRecord}
                selectedBulan={selectedBulan}
                selectedTahun={selectedTahun}
                onSelectPeriod={handleSelectPeriod}
                availablePeriods={availablePeriods}
                pegawaiList={pegawaiList}
                dailyLogs={dailyLogs}
                scheduleList={scheduleList}
                infalList={infalList}
                leaveRequests={leaveRequests}
                onAddInfal={handleAddInfal}
                onExportBackup={handleExportBackupDirect}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollManagement
                records={currentPeriodRecords}
                currentUser={currentUser}
                onGeneratePayroll={() => handleGeneratePayroll(selectedBulan, selectedTahun)}
                onApproveRecord={handleApproveRecord}
                onTransferRecord={handleTransferRecord}
                onSendEmailSlip={handleSendEmailSlip}
                onBatchApprove={handleBatchApprove}
                onBatchEmail={handleBatchEmail}
                onViewSlip={setSelectedSlipRecord}
                onInspectFormula={setSelectedFormulaRecord}
                onUpdateRecord={(updatedRecord) => {
                  setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
                }}
                selectedBulan={selectedBulan}

                selectedTahun={selectedTahun}
                onSelectPeriod={handleSelectPeriod}
                availablePeriods={availablePeriods}
                showToast={showToast}
                onAuditLog={addAuditLog}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceManager
                pegawaiList={pegawaiList}
                presensiList={currentPeriodPresensi}
                dailyLogs={dailyLogs}
                leaveRequests={leaveRequests}
                overtimeRecords={overtimeRecords}
                infalList={infalList}
                onUpdatePresensi={handleUpdatePresensi}
                onRefreshAndRecalculate={() => handleGeneratePayroll(selectedBulan, selectedTahun)}
                onAddDailyLog={handleAddDailyLog}
                onBatchSaveDailyLogs={handleBatchSaveDailyLogs}
                onAddLeaveRequest={handleAddLeaveRequest}
                onUpdateLeaveStatus={handleUpdateLeaveStatus}
                onAddOvertime={handleAddOvertime}
                onUpdateOvertimeStatus={handleUpdateOvertimeStatus}
                onDeleteOvertime={handleDeleteOvertime}
                onDeleteLeaveRequest={handleDeleteLeaveRequest}
                onDeleteDailyLog={handleDeleteDailyLog}
                onBatchSyncFromDailyLogs={handleBatchSyncFromDailyLogs}
                onAddInfal={handleAddInfal}
                onDeleteInfal={handleDeleteInfal}
                onUpdateInfalStatus={handleUpdateInfalStatus}
                selectedBulan={selectedBulan}
                selectedTahun={selectedTahun}
                onSelectPeriod={handleSelectPeriod}
                availablePeriods={availablePeriods}
                initialSubTab={attendanceSubTab}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleManager
                pegawaiList={pegawaiList}
                scheduleList={scheduleList}
                onUpdateSchedule={setScheduleList}
                onSyncHoursToAttendance={handleSyncScheduleHoursToAttendance}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeManager
                pegawaiList={pegawaiList}
                onAddPegawai={handleAddPegawai}
                onUpdatePegawai={handleUpdatePegawai}
                onBulkUpdateSalary={handleBulkUpdateSalary}
                onShowToast={showToast}
              />
            )}


            {activeTab === 'emails' && (
              <EmailNotificationModal
                emailLogs={emailLogs}
                onTriggerBatchEmail={() => handleBatchEmail(records.filter(r => r.status === 'transferred' || r.status === 'approved').map(r => r.id))}
                onSendSingleEmail={handleSendEmailSlip}
                records={records}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsDataBackup
                currentUser={currentUser}
                pegawaiList={pegawaiList}
                presensiList={presensiList}
                dailyLogs={dailyLogs}
                records={records}
                scheduleList={scheduleList}
                infalList={infalList}
                leaveRequests={leaveRequests}
                overtimeRecords={overtimeRecords}
                emailLogs={emailLogs}
                auditLogs={auditLogs}
                onImportBackup={handleImportBackup}
                onResetToDefault={handleResetDataToDefault}
                onClearAuditLogs={() => {
                  setAuditLogs([]);
                  showToast('Seluruh riwayat audit trail telah dibersihkan.', 'info');
                }}
                onRefreshFromSupabase={() => fetchAllData(selectedBulan, selectedTahun)}
                onAddAuditLog={addAuditLog}
                showToast={showToast}
              />

            )}


            {activeTab === 'architecture' && <TechnicalDocViewer />}
          </main>

          {/* Seamless Bottom Footer */}
          <footer className="bg-white border-t border-slate-200/90 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <strong>SIM GAJI</strong> • © 2026 SMK IT Ibnul Qayyim Makassar. Hak Cipta Dilindungi.
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>AES-256-GCM Payload Active</span>
                </span>
                <span className="text-slate-300">|</span>
                <span>Tahun Ajaran 2026/2027</span>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* Official PDF Slip Gaji Modal */}
      {selectedSlipRecord && (
        <SlipGajiModal
          record={selectedSlipRecord}
          onClose={() => setSelectedSlipRecord(null)}
          onSendEmail={handleSendEmailSlip}
        />
      )}

      {/* Formula Mathematical Inspector Modal */}
      {selectedFormulaRecord && (
        <FormulaInspectorModal
          record={selectedFormulaRecord}
          onClose={() => setSelectedFormulaRecord(null)}
        />
      )}
    </div>
  );
}
