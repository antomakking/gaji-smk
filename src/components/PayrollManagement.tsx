import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  CheckCheck, 
  Send, 
  CreditCard, 
  XCircle, 
  Calculator, 
  Clock, 
  AlertTriangle,
  Mail,
  Zap,
  Download,
  ShieldAlert,
  ArrowUpDown,
  Archive,
  Loader2,
  FolderArchive,
  Check,
  GraduationCap,
  Briefcase,
  Users
} from 'lucide-react';
import { PenggajianRecord, User, StatusPenggajian, AuditCategory, AuditActionType } from '../types';
import { formatRupiah, formatNumber, getPayrollCutoffDates } from '../utils/security';
import { PeriodSelector, MONTH_NAMES_ID } from './PeriodSelector';
import { exportBatchSlipsToZip } from '../utils/batchSlipZip';

interface PayrollManagementProps {
  records: PenggajianRecord[];
  currentUser: User;
  onGeneratePayroll: (bulan?: number, tahun?: number) => void;
  onApproveRecord: (recordId: string, action: 'approve' | 'reject' | 'submit_kepsek', notes?: string) => void;
  onTransferRecord: (recordId: string) => void;
  onSendEmailSlip: (recordId: string) => void;
  onBatchApprove: (ids: string[]) => void;
  onBatchEmail: (ids: string[]) => void;
  onViewSlip: (record: PenggajianRecord) => void;
  onInspectFormula: (record: PenggajianRecord) => void;
  selectedBulan?: number;
  selectedTahun?: number;
  onSelectPeriod?: (bulan: number, tahun: number) => void;
  availablePeriods?: { bulan: number; tahun: number; count: number; status?: string }[];
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onAuditLog?: (category: AuditCategory, action: AuditActionType, actionLabel: string, target: string, details: string) => void;
}

export const PayrollManagement: React.FC<PayrollManagementProps> = ({
  records,
  currentUser,
  onGeneratePayroll,
  onApproveRecord,
  onTransferRecord,
  onSendEmailSlip,
  onBatchApprove,
  onBatchEmail,
  onViewSlip,
  onInspectFormula,
  selectedBulan = (new Date().getMonth() + 1),
  selectedTahun = (new Date().getFullYear()),
  onSelectPeriod,
  availablePeriods = [],
  showToast,
  onAuditLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jenisPegawaiFilter, setJenisPegawaiFilter] = useState<'all' | 'guru' | 'tendik'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Batch Zip Export State
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  const cutoffInfo = getPayrollCutoffDates(selectedBulan, selectedTahun);

  // Helper check if an employee is Guru or Tendik
  const isTeacher = (r: PenggajianRecord): boolean => {
    return r.pegawaiStatus === 'GTY' || r.pegawaiStatus === 'GTT' || (r.pegawaiJabatan && r.pegawaiJabatan.toLowerCase().includes('guru'));
  };

  // Filter records by search term, status approval, and jenis pegawai (Guru/Tendik)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Search filter
      const matchesSearch = 
        r.pegawaiNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.pegawaiNip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.kodeSlip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.pegawaiJabatan.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Status filter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

      // 3. Jenis Pegawai filter
      const isGuru = isTeacher(r);
      const isTendik = !isGuru;
      const matchesJenisPegawai = 
        jenisPegawaiFilter === 'all' ? true :
        jenisPegawaiFilter === 'guru' ? isGuru :
        jenisPegawaiFilter === 'tendik' ? isTendik : true;

      return matchesSearch && matchesStatus && matchesJenisPegawai;
    });
  }, [records, searchTerm, statusFilter, jenisPegawaiFilter]);

  // Statistics for Category & Status Tabs
  const counts = useMemo(() => {
    const guruCount = records.filter(isTeacher).length;
    const tendikCount = records.length - guruCount;

    return {
      total: records.length,
      guru: guruCount,
      tendik: tendikCount,
      draft: records.filter(r => r.status === 'draft').length,
      pending_kepsek: records.filter(r => r.status === 'pending_kepsek').length,
      pending_yayasan: records.filter(r => r.status === 'pending_yayasan').length,
      approved: records.filter(r => r.status === 'approved').length,
      transferred: records.filter(r => r.status === 'transferred').length,
      rejected: records.filter(r => r.status === 'rejected').length,
    };
  }, [records]);

  // Visual Status Badge Renderer for Approval Stages
  const renderStatusBadge = (status: StatusPenggajian, emailSent?: boolean) => {
    switch (status) {
      case 'transferred':
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terbayar</span>
            </span>
            {emailSent && (
              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-emerald-600" />
                <span>Email Terkirim</span>
              </span>
            )}
          </div>
        );

      case 'approved':
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide bg-teal-50 text-teal-800 border border-teal-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>Siap Transfer</span>
            </span>
          </div>
        );

      case 'pending_yayasan':
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Review Yayasan</span>
            </span>
          </div>
        );

      case 'pending_kepsek':
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide bg-orange-50 text-orange-800 border border-orange-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Review Kepsek</span>
            </span>
          </div>
        );

      case 'rejected':
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Ditolak / Revisi</span>
            </span>
          </div>
        );

      case 'draft':
      default:
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Draft</span>
            </span>
          </div>
        );
    }
  };



  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectTargetId(id);
    setRejectNotes('');
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (rejectTargetId) {
      onApproveRecord(rejectTargetId, 'reject', rejectNotes);
      setRejectModalOpen(false);
      setRejectTargetId(null);
    }
  };

  const canApprove = 
    currentUser.role === 'super_admin' || 
    currentUser.role === 'kepala_sekolah' || 
    currentUser.role === 'ketua_yayasan';

  const canTransfer = 
    currentUser.role === 'super_admin' || 
    currentUser.role === 'bendahara_yayasan';

  // Batch Slip ZIP Export Handler
  const handleDownloadBatchSlipsZip = async (useSelectedOnly = false) => {
    const targetList = useSelectedOnly && selectedIds.length > 0
      ? filteredRecords.filter(r => selectedIds.includes(r.id))
      : filteredRecords;

    if (targetList.length === 0) {
      showToast?.('Tidak ada slip gaji yang sesuai untuk diekspor.', 'info');
      return;
    }

    try {
      setIsDownloadingZip(true);
      setZipProgress({ current: 0, total: targetList.length, name: 'Memulai proses...' });

      const result = await exportBatchSlipsToZip(targetList, {
        onProgress: (current, total, name) => {
          setZipProgress({ current, total, name });
        },
      });

      // Trigger browser download
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', result.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const monthName = MONTH_NAMES_ID[selectedBulan - 1] || `Bulan ${selectedBulan}`;
      showToast?.(`Sukses mengunduh ${result.count} slip gaji dalam file ZIP (${result.filename})!`, 'success');

      if (onAuditLog) {
        onAuditLog(
          'gaji',
          'EXPORT_BACKUP',
          'Cetak Semua Slip (Batch ZIP PDF)',
          `Arsip ${result.count} Slip Gaji (${monthName} ${selectedTahun})`,
          `Pengunduhan bundel PDF slip gaji terenkripsi per pegawai. Total nominal: ${formatRupiah(result.totalNominal)}.`
        );
      }
    } catch (err: any) {
      console.error('Error generating batch slip zip:', err);
      showToast?.(`Gagal mencetak bundel slip: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Kelola Penggajian & Otomasi Hitung
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
              <span className="text-emerald-700 font-medium">Jadwal Pembayaran:</span>
              <strong className="font-mono">{cutoffInfo.paymentLabel}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Cetak Semua Slip ZIP PDF */}
          <button
            id="btn-download-all-slips-zip"
            type="button"
            disabled={isDownloadingZip || filteredRecords.length === 0}
            onClick={() => handleDownloadBatchSlipsZip(false)}
            title="Unduh seluruh slip gaji dari daftar yang difilter ke dalam file ZIP PDF terorganisir per pegawai"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloadingZip ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FolderArchive className="w-4 h-4 text-emerald-100" />
            )}
            <span>
              {isDownloadingZip ? 'Mengemas ZIP...' : `Cetak Semua Slip (${filteredRecords.length} PDF)`}
            </span>
          </button>

          {(currentUser.role === 'super_admin' || currentUser.role === 'bendahara_yayasan') && (
            <button
              onClick={() => onGeneratePayroll(selectedBulan, selectedTahun)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Otomasi Hitung Periode Ini</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isDownloadingZip}
                onClick={() => handleDownloadBatchSlipsZip(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Unduh Slip Terpilih ({selectedIds.length} ZIP)</span>
              </button>

              {canApprove && (
                <button
                  onClick={() => onBatchApprove(selectedIds)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Setujui Terpilih ({selectedIds.length})</span>
                </button>
              )}
              <button
                onClick={() => onBatchEmail(selectedIds)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Kirim Batch Email ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama guru/staf, NIP, atau jabatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Jenis Pegawai Filter Group (Guru vs Tendik) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start lg:self-auto">
            <span className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Jenis:
            </span>
            
            <button
              type="button"
              onClick={() => setJenisPegawaiFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                jenisPegawaiFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Semua ({counts.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setJenisPegawaiFilter('guru')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                jenisPegawaiFilter === 'guru'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Guru ({counts.guru})</span>
            </button>

            <button
              type="button"
              onClick={() => setJenisPegawaiFilter('tendik')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                jenisPegawaiFilter === 'tendik'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Tendik ({counts.tendik})</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills with Counts */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-0.5">
            {[
              { id: 'all', label: 'Semua Status', count: counts.total, color: 'slate' },
              { id: 'draft', label: 'Draft', count: counts.draft, color: 'slate' },
              { id: 'pending_kepsek', label: 'Review Kepsek', count: counts.pending_kepsek, color: 'amber' },
              { id: 'pending_yayasan', label: 'Review Yayasan', count: counts.pending_yayasan, color: 'indigo' },
              { id: 'approved', label: 'Siap Transfer', count: counts.approved, color: 'blue' },
              { id: 'transferred', label: 'Terbayar & Terbit', count: counts.transferred, color: 'emerald' },
              { id: 'rejected', label: 'Ditolak / Revisi', count: counts.rejected, color: 'rose' },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-medium ml-auto">
            Menampilkan <strong>{filteredRecords.length}</strong> data (Total THP: <strong className="text-emerald-700 font-mono">{formatRupiah(filteredRecords.reduce((acc, curr) => acc + curr.gajiBersih, 0))}</strong>)
          </div>
        </div>
      </div>


      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode Slip & Pegawai</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan & Vokasi</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Presensi & JP</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Penerimaan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Potongan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Gaji Bersih (THP)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status Alur</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data penggajian yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <tr key={record.id} className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(record.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Pegawai Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{record.pegawaiNama}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-indigo-600 font-semibold">{record.kodeSlip}</span>
                          <span>•</span>
                          <span>NIP: {record.pegawaiNip}</span>
                        </div>
                      </td>

                      {/* Jabatan */}
                      <td className="py-3.5 px-4 text-slate-700 text-xs">
                        <div className="font-medium text-slate-800">{record.pegawaiJabatan}</div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600">
                            {record.pegawaiStatus}
                          </span>
                          {record.statusInduk === 'Non Induk' && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-200">
                              Non-Induk (Murni JP)
                            </span>
                          )}
                          {record.tunjanganVokasiIT > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Sertifikasi IT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Presensi & JP */}
                      <td className="py-3.5 px-4 text-center text-xs">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                            {record.jamMengajarRealisasi} JP
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            Hadir: {record.presensiHadir} | A: {record.presensiAlpha} | T: {record.presensiTerlambatMenit}m
                          </span>
                        </div>
                      </td>

                      {/* Penerimaan */}
                      <td className="py-3.5 px-4 text-right text-xs">
                        <div className="font-semibold text-slate-800">
                          {formatRupiah(record.totalPenerimaan)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          {record.statusInduk === 'Non Induk' ? (
                            <span className="text-indigo-700 font-semibold">Honor JP: {formatRupiah(record.honorJamMengajar)}</span>
                          ) : (
                            <span>Pokok: {formatRupiah(record.gajiPokok)}</span>
                          )}
                          {record.honorInfal > 0 && (
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold" title={`Honor Infal Menggantikan: ${record.jpMenggantikan} JP`}>
                              +{formatRupiah(record.honorInfal)} Infal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Potongan */}
                      <td className="py-3.5 px-4 text-right text-xs">
                        <div className="font-semibold text-rose-600">
                          -{formatRupiah(record.totalPotongan)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          {record.statusInduk === 'Non Induk' && record.totalPotongan === 0 ? (
                            <span className="text-slate-400 italic">Murni JP (Tanpa Potongan)</span>
                          ) : (
                            <span>BPJS & Denda</span>
                          )}
                          {record.potonganInfal > 0 && (
                            <span className="text-rose-700 bg-rose-50 px-1 rounded font-bold" title={`Potongan Infal Digantikan: ${record.jpDigantikan} JP`}>
                              -{formatRupiah(record.potonganInfal)} Infal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gaji Bersih */}
                      <td className="py-3.5 px-4 text-right text-xs">
                        <div className="font-bold text-emerald-700 text-xs">
                          {formatRupiah(record.gajiBersih)}
                        </div>
                        <button
                          onClick={() => onInspectFormula(record)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                        >
                          Rincian Rumus
                        </button>
                      </td>

                      {/* Status Approval Stage Visual Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {renderStatusBadge(record.status, record.emailSent)}
                      </td>


                      {/* Tindakan Workflow & Cetak */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View / Print Slip */}
                          <button
                            onClick={() => onViewSlip(record)}
                            title="Buka & Cetak Slip Gaji PDF Resmi"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Approval Actions by Role */}
                          {currentUser.role === 'kepala_sekolah' && (record.status === 'draft' || record.status === 'pending_kepsek') && (
                            <button
                              onClick={() => onApproveRecord(record.id, 'approve')}
                              title="Setujui sebagai Kepala Sekolah"
                              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {currentUser.role === 'ketua_yayasan' && record.status === 'pending_yayasan' && (
                            <button
                              onClick={() => onApproveRecord(record.id, 'approve')}
                              title="Setujui & Otorisasi Anggaran Yayasan"
                              className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}

                          {canTransfer && record.status === 'approved' && (
                            <button
                              onClick={() => onTransferRecord(record.id)}
                              title="Eksekusi Transfer Bank Bendahara"
                              className="p-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Email Single Trigger */}
                          {(record.status === 'transferred' || record.status === 'approved') && (
                            <button
                              onClick={() => onSendEmailSlip(record.id)}
                              title="Kirim Notifikasi Email Slip Gaji"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reject Option for Approvers */}
                          {canApprove && (record.status === 'pending_kepsek' || record.status === 'pending_yayasan') && (
                            <button
                              onClick={() => openRejectDialog(record.id)}
                              title="Tolak / Minta Revisi"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal Dialog */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Konfirmasi Penolakan / Revisi Penggajian</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Penggajian ini akan dikembalikan ke status Draft untuk dikoreksi kembali oleh admin/bendahara.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Revisi / Alasan Penolakan:
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Contoh: Jam mengajar realisasi belum sesuai dengan jadwal ekstrakurikuler..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
              >
                Tolak Penggajian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Dialog when creating and zipping PDFs */}
      {isDownloadingZip && zipProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <FolderArchive className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Memproses & Mengemas Seluruh Slip ke ZIP...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Membuat dokumen PDF berenkripsi dan terstruktur per pegawai.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="truncate max-w-[220px] font-medium text-slate-800">{zipProgress.name}</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {zipProgress.current} / {zipProgress.total} ({Math.round((zipProgress.current / Math.max(zipProgress.total, 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${Math.round((zipProgress.current / Math.max(zipProgress.total, 1)) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Mohon tidak menutup peramban. Berkas ZIP akan otomatis terunduh begitu proses selesai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
