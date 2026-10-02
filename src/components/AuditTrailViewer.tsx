import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Banknote, 
  CalendarCheck, 
  Users, 
  HardDrive, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Clock, 
  ArrowUpDown,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { AuditLogEntry, AuditCategory, User } from '../types';
import { AuditLogDetailModal } from './AuditLogDetailModal';

interface AuditTrailViewerProps {
  auditLogs: AuditLogEntry[];
  currentUser: User;
  onClearAuditLogs?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  auditLogs,
  currentUser,
  onClearAuditLogs,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);


  // Filter and sort audit logs (newest first)
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Category filter
        if (selectedCategory !== 'all' && log.category !== selectedCategory) {
          return false;
        }
        // Role filter
        if (selectedRole !== 'all' && log.userRole !== selectedRole) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchUser = log.userName.toLowerCase().includes(q);
          const matchAction = log.actionLabel.toLowerCase().includes(q) || log.action.toLowerCase().includes(q);
          const matchTarget = log.target.toLowerCase().includes(q);
          const matchDetails = log.details.toLowerCase().includes(q);
          return matchUser || matchAction || matchTarget || matchDetails;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, selectedCategory, selectedRole, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: auditLogs.length,
      approval: auditLogs.filter(l => l.category === 'approval').length,
      gaji: auditLogs.filter(l => l.category === 'gaji').length,
      presensi: auditLogs.filter(l => l.category === 'presensi').length,
      pegawai: auditLogs.filter(l => l.category === 'pegawai').length,
      sistem: auditLogs.filter(l => l.category === 'sistem').length,
    };
  }, [auditLogs]);

  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'approval':
        return {
          label: 'Persetujuan (Approval)',
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          icon: ShieldCheck,
        };
      case 'gaji':
        return {
          label: 'Penggajian',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Banknote,
        };
      case 'presensi':
        return {
          label: 'Presensi & JP',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: CalendarCheck,
        };
      case 'pegawai':
        return {
          label: 'Master Pegawai',
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          icon: Users,
        };
      case 'jadwal':
        return {
          label: 'Jadwal & Infal',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'sistem':
      default:
        return {
          label: 'Sistem & Backup',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: HardDrive,
        };
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'kepala_sekolah':
        return { label: 'Kepala Sekolah', color: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'ketua_yayasan':
        return { label: 'Ketua Yayasan', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'bendahara_yayasan':
        return { label: 'Bendahara', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Pegawai', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      showToast?.('Tidak ada log yang dapat diekspor', 'info');
      return;
    }

    const headers = ['ID', 'Waktu (ISO)', 'Waktu Lokal', 'Operator', 'Peran', 'Kategori', 'Aksi', 'Target Data', 'Rincian Perubahan', 'Alamat IP'];
    const rows = filteredLogs.map(log => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${new Date(log.timestamp).toLocaleString('id-ID')}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.category}"`,
      `"${log.actionLabel}"`,
      `"${log.target.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.ipAddress || '127.0.0.1'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AUDIT-TRAIL-SIM-GAJI-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast?.('Log Audit Trail berhasil diekspor ke format CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Metrics - Soft Green Aesthetic */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200/80 shadow-xs">
              <History className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Audit Trail &amp; Riwayat Aktivitas Pengguna</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Realtime Tracking Active
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan rekam jejak mutasi data krusial: perhitungan gaji, alur approval, absensi harian, serta manipulasi data pegawai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Buka tampilan modal log audit lengkap dengan filter kategori & ekspor CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Log Audit Detail</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor CSV</span>
            </button>

            {onClearAuditLogs && currentUser.role === 'super_admin' && (
              <button
                onClick={onClearAuditLogs}
                title="Kosongkan riwayat audit trail"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bersihkan Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Filter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block">Semua Log</span>
            <span className="text-lg font-bold text-slate-900">{stats.total}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('approval')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              selectedCategory === 'approval'
                ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-medium text-teal-800 block">Persetujuan</span>
            <span className="text-lg font-bold text-teal-950">{stats.approval}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('gaji')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              selectedCategory === 'gaji'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-medium text-emerald-700 block">Penggajian</span>
            <span className="text-lg font-bold text-emerald-950">{stats.gaji}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('presensi')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              selectedCategory === 'presensi'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-medium text-blue-700 block">Presensi</span>
            <span className="text-lg font-bold text-blue-950">{stats.presensi}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('pegawai')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              selectedCategory === 'pegawai'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-medium text-emerald-800 block">Pegawai</span>
            <span className="text-lg font-bold text-emerald-950">{stats.pegawai}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('sistem')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              selectedCategory === 'sistem'
                ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-600 block">Sistem</span>
            <span className="text-lg font-bold text-slate-900">{stats.sistem}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari user, aksi, target, atau detail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium">Filter Peran:</span>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Peran</option>
            <option value="super_admin">Super Admin / HR</option>
            <option value="kepala_sekolah">Kepala Sekolah</option>
            <option value="ketua_yayasan">Ketua Yayasan</option>
            <option value="bendahara_yayasan">Bendahara Yayasan</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Tidak ada riwayat aktivitas ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Waktu Aktivitas</th>
                  <th className="px-4 py-3.5">Operator & Peran</th>
                  <th className="px-4 py-3.5">Kategori & Aksi</th>
                  <th className="px-4 py-3.5">Target Entitas</th>
                  <th className="px-4 py-3.5">Rincian Perubahan</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLogs.map((log) => {
                  const catInfo = getCategoryBadge(log.category);
                  const CatIcon = catInfo.icon;
                  const roleBadge = getRoleBadge(log.userRole);
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition group">
                      {/* Waktu */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formattedDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedTime} WITA</span>
                        </div>
                      </td>

                      {/* Operator & Peran */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {log.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[150px]">{log.userName}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                      </td>

                      {/* Kategori & Aksi */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.bg}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{catInfo.label}</span>
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 text-xs mt-1">
                          {log.actionLabel}
                        </p>
                      </td>

                      {/* Target Entitas */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-emerald-950 bg-emerald-50/70 px-2 py-1 rounded-md border border-emerald-100 text-[11px] inline-block">
                          {log.target}
                        </span>
                      </td>

                      {/* Rincian Perubahan */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                          {log.details}
                        </p>
                      </td>

                      {/* Detail Modal Button */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLogDetail(log)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                          title="Lihat Rincian Lengkap Payload Audit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-base">
                  Rincian Log Audit Forensik
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                {selectedLogDetail.id}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Stempel Waktu (ISO):</span>
                <span className="font-mono text-slate-900">{selectedLogDetail.timestamp}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Waktu Lokal:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(selectedLogDetail.timestamp).toLocaleString('id-ID')} WITA
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Operator:</span>
                <span className="font-bold text-slate-900">{selectedLogDetail.userName} ({selectedLogDetail.userRole})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Jenis Aksi:</span>
                <span className="font-bold text-emerald-800">{selectedLogDetail.actionLabel} ({selectedLogDetail.action})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Target Entitas:</span>
                <span className="font-semibold text-slate-900">{selectedLogDetail.target}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 font-medium block mb-1">Rincian Perubahan:</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-mono text-[11px]">
                  {selectedLogDetail.details}
                </div>
              </div>
              <div className="flex justify-between py-1 text-slate-400 text-[11px]">
                <span>Alamat IP / Klien:</span>
                <span className="font-mono">{selectedLogDetail.ipAddress || '192.168.1.100 (LAN SMK IT)'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dedicated Audit Log Detail Modal */}
      <AuditLogDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        auditLogs={auditLogs}
        currentUser={currentUser}
        onShowToast={showToast}
      />
    </div>
  );
};
