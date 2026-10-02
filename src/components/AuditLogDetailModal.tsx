import React, { useState, useMemo } from 'react';
import { 
  History, 
  X, 
  Search, 
  Download, 
  Filter, 
  ShieldCheck, 
  Banknote, 
  CalendarCheck, 
  Users, 
  HardDrive, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  ArrowUpDown, 
  Sparkles,
  ChevronRight,
  Database,
  Calendar
} from 'lucide-react';
import { AuditLogEntry, AuditCategory } from '../types';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  currentUser?: { nama: string; role: string };
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  auditLogs = [],
  currentUser,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gaji' | 'pegawai' | 'presensi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter audit logs based on Category and Search Query
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Category Filter (Gaji, Pegawai, Presensi, or All)
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'gaji') {
            if (log.category !== 'gaji' && log.category !== 'approval') return false;
          } else if (log.category !== selectedCategory) {
            return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchUser = log.userName?.toLowerCase().includes(q) || false;
          const matchAction = (log.actionLabel || log.action || '').toLowerCase().includes(q);
          const matchTarget = (log.target || '').toLowerCase().includes(q);
          const matchDetails = (log.details || '').toLowerCase().includes(q);
          const matchIp = (log.ipAddress || '').toLowerCase().includes(q);
          return matchUser || matchAction || matchTarget || matchDetails || matchIp;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [auditLogs, selectedCategory, searchQuery, sortOrder]);

  // Statistics per category
  const stats = useMemo(() => {
    return {
      all: auditLogs.length,
      gaji: auditLogs.filter(l => l.category === 'gaji' || l.category === 'approval').length,
      pegawai: auditLogs.filter(l => l.category === 'pegawai').length,
      presensi: auditLogs.filter(l => l.category === 'presensi').length,
    };
  }, [auditLogs]);

  // Export Filtered Logs to CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      onShowToast?.('Tidak ada log audit untuk diekspor pada filter saat ini.', 'info');
      return;
    }

    const headers = [
      'Timestamp (WITA)',
      'Kategori',
      'Aksi / Event',
      'Pengguna (User)',
      'Peran (Role)',
      'Target / Subjek',
      'Rincian Detail',
      'IP Address',
      'Metadata JSON'
    ];

    const rows = filteredLogs.map((log) => {
      const formattedTime = new Date(log.timestamp).toLocaleString('id-ID', {
        timeZone: 'Asia/Makassar',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const metaString = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : '';

      return [
        `"${formattedTime}"`,
        `"${log.category?.toUpperCase() || '-'}"`,
        `"${(log.actionLabel || log.action || '-').replace(/"/g, '""')}"`,
        `"${(log.userName || '-').replace(/"/g, '""')}"`,
        `"${(log.userRole || '-').replace(/"/g, '""')}"`,
        `"${(log.target || '-').replace(/"/g, '""')}"`,
        `"${(log.details || '-').replace(/"/g, '""')}"`,
        `"${log.ipAddress || '127.0.0.1'}"`,
        `"${metaString}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const categorySuffix = selectedCategory === 'all' ? 'SEMUA' : selectedCategory.toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10);

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AUDIT-LOG-SIM-GAJI-${categorySuffix}-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast?.(`Berhasil mengekspor ${filteredLogs.length} baris riwayat audit (${categorySuffix}) ke CSV!`, 'success');
  };

  const getCategoryTheme = (category: AuditCategory) => {
    switch (category) {
      case 'gaji':
      case 'approval':
        return {
          label: 'Gaji & Approval',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: Banknote,
        };
      case 'pegawai':
        return {
          label: 'Data Pegawai',
          bg: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
          icon: Users,
        };
      case 'presensi':
        return {
          label: 'Presensi & JP',
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          icon: CalendarCheck,
        };
      default:
        return {
          label: 'Sistem',
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: HardDrive,
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Log Audit Detail Sistem
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Keamanan & Kepatuhan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Riwayat lengkap perubahan data, mutasi gaji, absensi harian, dan otorisasi pengguna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              title="Unduh seluruh data log terfilter dalam format file CSV"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV ({filteredLogs.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Category Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Semua Log
              <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] rounded-full">
                {stats.all}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('gaji')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === 'gaji'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              Gaji & Approval
              <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] rounded-full">
                {stats.gaji}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('pegawai')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === 'pegawai'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-400" />
              Pegawai
              <span className="px-1.5 py-0.2 bg-teal-950 text-teal-300 border border-teal-500/30 text-[10px] rounded-full">
                {stats.pegawai}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('presensi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === 'presensi'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-teal-300" />
              Presensi & JP
              <span className="px-1.5 py-0.2 bg-teal-950 text-teal-300 border border-teal-500/30 text-[10px] rounded-full">
                {stats.presensi}
              </span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari aksi, user, target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              title={`Urutan: ${sortOrder === 'desc' ? 'Terbaru ke Terlama' : 'Terlama ke Terbaru'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Modal Body / Table View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="max-h-[52vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold z-10">
                  <tr>
                    <th className="py-3 px-4">Waktu (WITA)</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Aktivitas / Event</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Target & Rincian</th>
                    <th className="py-3 px-4 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Tidak ada catatan log audit yang sesuai dengan filter atau kata kunci.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const theme = getCategoryTheme(log.category);
                      const IconComp = theme.icon;
                      const dateObj = new Date(log.timestamp);
                      const isSelected = selectedLog?.id === log.id;

                      return (
                        <tr 
                          key={log.id} 
                          onClick={() => setSelectedLog(isSelected ? null : log)}
                          className={`hover:bg-slate-900/50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-950/30' : ''
                          }`}
                        >
                          {/* Timestamp */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            <div className="text-white font-medium">
                              {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div>
                              {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${theme.bg}`}>
                              <IconComp className="w-3 h-3" />
                              {theme.label}
                            </span>
                          </td>

                          {/* Action / Event */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">
                              {log.actionLabel || log.action}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {log.action}
                            </div>
                          </td>

                          {/* User & Role */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-200">{log.userName || 'Sistem'}</div>
                            <span className="text-[10px] text-slate-400 block capitalize">
                              {log.userRole?.replace(/_/g, ' ') || 'Admin'}
                            </span>
                          </td>

                          {/* Target & Details */}
                          <td className="py-3 px-4">
                            <div className="text-slate-300 font-medium line-clamp-1">{log.target}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{log.details}</div>
                          </td>

                          {/* Detail Toggle Icon */}
                          <td className="py-3 px-4 text-center">
                            <button 
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expanded Detail Inspection Box */}
          {selectedLog && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">
                    Rincian Audit Log: {selectedLog.actionLabel || selectedLog.action}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {selectedLog.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Waktu Eksekusi:</span>
                  <span className="text-slate-200 font-medium font-mono">
                    {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Pengguna / Aktor:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedLog.userName} ({selectedLog.userRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">IP Address / Terminal:</span>
                  <span className="text-slate-200 font-mono">
                    {selectedLog.ipAddress || '127.0.0.1 (Local Session)'}
                  </span>
                </div>
              </div>

              <div className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Deskripsi Operasi:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedLog.details}</p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="text-xs">
                  <span className="text-slate-400 block font-semibold mb-1">Payload Metadata:</span>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-32">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>
              Menampilkan <strong>{filteredLogs.length}</strong> dari total <strong>{auditLogs.length}</strong> log tersimpan.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
