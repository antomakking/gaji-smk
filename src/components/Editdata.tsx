import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Save, 
  RotateCcw, 
  Download, 
  Search, 
  Filter, 
  Check, 
  AlertCircle, 
  Database, 
  Copy, 
  Sparkles, 
  Columns, 
  Eye, 
  CheckCheck, 
  Loader2, 
  FileSpreadsheet, 
  X,
  Edit3,
  Calendar,
  CreditCard,
  Building,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Pegawai, StatusPegawai, User, AuditCategory, AuditActionType } from '../types';
import { formatRupiah, maskData } from '../utils/security';
import { updatePegawaiMasterDataRPC } from '../lib/supabase';
import { calculateAge, calculateMasaKerja } from './EmployeeManager';

interface EditdataProps {
  pegawaiList: Pegawai[];
  currentUser?: User;
  onUpdatePegawai?: (pegawai: Pegawai) => void;
  onBatchUpdatePegawai?: (updatedList: Pegawai[]) => void;
  onClose?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onAuditLog?: (category: AuditCategory, action: AuditActionType, actionLabel: string, target: string, details: string) => void;
}

export const Editdata: React.FC<EditdataProps> = ({
  pegawaiList,
  currentUser = { id: 'usr-admin', nama: 'Administrator Kepegawaian', role: 'super_admin', email: 'admin@iqm.sch.id', username: 'admin', jabatan: 'Admin SDM' },
  onUpdatePegawai,
  onBatchUpdatePegawai,
  onClose,
  showToast,
  onAuditLog,
}) => {
  // Local state for draft modifications per pegawai
  const [draftPegawai, setDraftPegawai] = useState<Record<string, Pegawai>>({});
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [indukFilter, setIndukFilter] = useState<'all' | 'Induk' | 'Non Induk'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'tendik'>('all');
  const [compactView, setCompactView] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Modal Detail Edit Row
  const [selectedPegawaiForModal, setSelectedPegawaiForModal] = useState<Pegawai | null>(null);

  // Initialize draft pegawai map
  useEffect(() => {
    const map: Record<string, Pegawai> = {};
    pegawaiList.forEach(p => {
      map[p.id] = { ...p };
    });
    setDraftPegawai(map);
    setDirtyRowIds(new Set());
  }, [pegawaiList]);

  // Handle cell field change
  const handleCellChange = (pegawaiId: string, field: keyof Pegawai, value: any) => {
    setDraftPegawai(prev => {
      const current = prev[pegawaiId];
      if (!current) return prev;

      const updated = {
        ...current,
        [field]: value
      };

      // Auto update usia if tanggalLahir changes
      if (field === 'tanggalLahir' && value) {
        updated.usia = calculateAge(value);
      }

      // Auto update masaKerja if tmt changes
      if (field === 'tmt' && value) {
        updated.masaKerja = calculateMasaKerja(value);
      }

      return {
        ...prev,
        [pegawaiId]: updated
      };
    });

    setDirtyRowIds(prev => new Set(prev).add(pegawaiId));
  };

  // Revert row changes to original record
  const handleResetRow = (pegawaiId: string) => {
    const original = pegawaiList.find(p => p.id === pegawaiId);
    if (original) {
      setDraftPegawai(prev => ({
        ...prev,
        [pegawaiId]: { ...original }
      }));
      setDirtyRowIds(prev => {
        const next = new Set(prev);
        next.delete(pegawaiId);
        return next;
      });
      showToast?.(`Perubahan data pada ${original.nama} berhasil di-reset.`, 'info');
    }
  };

  // Reset all edited rows
  const handleResetAll = () => {
    const map: Record<string, Pegawai> = {};
    pegawaiList.forEach(p => {
      map[p.id] = { ...p };
    });
    setDraftPegawai(map);
    setDirtyRowIds(new Set());
    showToast?.('Seluruh perubahan data master pegawai dikembalikan ke data awal.', 'info');
  };

  // Save single row via Supabase RPC
  const handleSaveRow = async (pegawaiId: string) => {
    const pegawai = draftPegawai[pegawaiId];
    if (!pegawai) return;

    setSavingRowIds(prev => new Set(prev).add(pegawaiId));

    try {
      const result = await updatePegawaiMasterDataRPC(pegawai, currentUser.nama);

      if (result.success) {
        onUpdatePegawai?.(pegawai);
        setDirtyRowIds(prev => {
          const next = new Set(prev);
          next.delete(pegawaiId);
          return next;
        });

        const method = result.viaRpc ? 'RPC Supabase' : 'Direct Supabase Table';
        showToast?.(`Berhasil menyimpan data ${pegawai.nama} via ${method}!`, 'success');

        onAuditLog?.(
          'pegawai',
          'UPDATE',
          'Pembaruan Master Data Pegawai',
          `${pegawai.nama} (NIP: ${pegawai.nip})`,
          `Pembaruan master data pegawai & konfigurasi gaji: Gaji Pokok Rp ${(pegawai.gajiPokokDefault || 0).toLocaleString('id-ID')} (${method}).`
        );
      } else {
        showToast?.(`Gagal menyimpan: ${result.error}`, 'error');
      }
    } catch (err: any) {
      showToast?.(`Error saat menyimpan data pegawai: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingRowIds(prev => {
        const next = new Set(prev);
        next.delete(pegawaiId);
        return next;
      });
    }
  };

  // Batch Save all dirty rows via Supabase RPC
  const handleBatchSave = async () => {
    if (dirtyRowIds.size === 0) return;

    setIsBatchSaving(true);
    const rowIds = Array.from(dirtyRowIds);
    let successCount = 0;
    let failCount = 0;
    const updatedList: Pegawai[] = [];

    for (const id of rowIds) {
      const p = draftPegawai[id];
      if (!p) continue;

      try {
        const res = await updatePegawaiMasterDataRPC(p, currentUser.nama);
        if (res.success) {
          successCount++;
          updatedList.push(p);
          onUpdatePegawai?.(p);
          setDirtyRowIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    if (onBatchUpdatePegawai && updatedList.length > 0) {
      onBatchUpdatePegawai(updatedList);
    }

    setIsBatchSaving(false);

    if (failCount === 0) {
      showToast?.(`Sukses menyimpan seluruh ${successCount} data pegawai ke Supabase!`, 'success');
      onAuditLog?.(
        'pegawai',
        'UPDATE',
        'Batch Update Master Data Pegawai',
        `${successCount} Pegawai`,
        `Penyimpanan serentak ${successCount} baris master data guru dan staf SMK IT IQM.`
      );
    } else {
      showToast?.(`Penyimpanan selesai: ${successCount} berhasil, ${failCount} gagal.`, failCount > 0 ? 'info' : 'success');
    }
  };

  // Export Table to CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'NIP',
      'Nama Lengkap',
      'NIK',
      'NIY',
      'NUPTK',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Usia',
      'No HP',
      'Email',
      'Status Pegawai',
      'Status Induk',
      'Keterangan Induk',
      'Jabatan Utama',
      'Pendidikan Terakhir',
      'Jurusan',
      'TMT',
      'Masa Kerja',
      'Gaji Pokok Default',
      'Tunjangan Jabatan',
      'Tunjangan Wali Kelas',
      'Tunjangan Ijazah',
      'Tunjangan Kinerja',
      'Tarif JP',
      'Tarif Transport',
      'Nama Bank',
      'Nomor Rekening',
      'Atas Nama Rekening',
      'NPWP',
      'Status Aktif'
    ];

    const rows = filteredPegawai.map((p, idx) => [
      idx + 1,
      `'${p.nip}`,
      `"${p.nama.replace(/"/g, '""')}"`,
      `'${p.nik || ''}`,
      `'${p.niy || ''}`,
      `'${p.nuptk || ''}`,
      p.jenisKelamin || 'L',
      `"${p.tempatLahir || ''}"`,
      p.tanggalLahir || '',
      `"${p.usia || ''}"`,
      `'${p.noHp || ''}`,
      p.email || '',
      p.statusPegawai || 'GTT',
      p.statusInduk || 'Induk',
      `"${p.keteranganInduk || ''}"`,
      `"${p.jabatanUtama.replace(/"/g, '""')}"`,
      p.pendidikanTerakhir || 'S1',
      `"${p.jurusan || ''}"`,
      p.tmt || '',
      `"${p.masaKerja || ''}"`,
      p.gajiPokokDefault || 0,
      p.tunjanganJabatanDefault || 0,
      p.tunjanganWaliKelas || 0,
      p.tunjanganIjazahDefault || 0,
      p.tunjanganKinerjaDefault || 0,
      p.tarifPerJamMengajar || 18000,
      p.tarifTransportHarian || 20000,
      `"${p.namaBank || 'BSI'}"`,
      `'${p.nomorRekening || ''}`,
      `"${p.atasNamaRekening || p.nama}"`,
      `'${p.npwp || ''}`,
      p.isActive !== false ? 'Aktif' : 'Non-Aktif'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Lengkap_Pegawai_SMKIT_IQM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast?.('Data lengkap pegawai berhasil diekspor ke CSV!', 'success');
  };

  // Filtered pegawai list
  const filteredPegawai = useMemo(() => {
    return pegawaiList
      .map(p => draftPegawai[p.id] || p)
      .filter(p => {
        const matchesSearch = 
          p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.nik && p.nik.includes(searchQuery)) ||
          p.jabatanUtama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.jurusan && p.jurusan.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || p.statusPegawai === statusFilter;
        const matchesInduk = indukFilter === 'all' || p.statusInduk === indukFilter;

        const isGuru = p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT' || p.jabatanUtama.toLowerCase().includes('guru');
        const matchesRole = 
          roleFilter === 'all' || 
          (roleFilter === 'guru' && isGuru) || 
          (roleFilter === 'tendik' && !isGuru);

        return matchesSearch && matchesStatus && matchesInduk && matchesRole;
      });
  }, [pegawaiList, draftPegawai, searchQuery, statusFilter, indukFilter, roleFilter]);

  // Aggregates for totals & summary
  const summary = useMemo(() => {
    const totalGajiPokok = filteredPegawai.reduce((acc, p) => acc + (p.gajiPokokDefault || 0), 0);
    const totalGuru = filteredPegawai.filter(p => p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT' || p.jabatanUtama.toLowerCase().includes('guru')).length;
    const totalTendik = filteredPegawai.length - totalGuru;
    const totalInduk = filteredPegawai.filter(p => p.statusInduk === 'Induk').length;
    const totalNonInduk = filteredPegawai.length - totalInduk;

    return {
      totalPegawai: filteredPegawai.length,
      totalGajiPokok,
      totalGuru,
      totalTendik,
      totalInduk,
      totalNonInduk
    };
  }, [filteredPegawai]);

  // SQL Stored Procedure Code snippet for Supabase
  const sqlRpcSnippet = `-- ============================================================================
-- SUPABASE RPC STORED PROCEDURE: update_pegawai_master_data
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard Anda.
-- ============================================================================
CREATE OR REPLACE FUNCTION update_pegawai_master_data(
  p_pegawai_id TEXT,
  p_nip TEXT DEFAULT NULL,
  p_niy TEXT DEFAULT NULL,
  p_nik TEXT DEFAULT NULL,
  p_nuptk TEXT DEFAULT NULL,
  p_nama_lengkap TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_no_hp TEXT DEFAULT NULL,
  p_status_pegawai TEXT DEFAULT NULL,
  p_jabatan_utama TEXT DEFAULT NULL,
  p_jabatan_tambahan TEXT DEFAULT NULL,
  p_pendidikan_terakhir TEXT DEFAULT NULL,
  p_jurusan TEXT DEFAULT NULL,
  p_status_induk TEXT DEFAULT NULL,
  p_keterangan_induk TEXT DEFAULT NULL,
  p_jenis_kelamin TEXT DEFAULT NULL,
  p_tempat_lahir TEXT DEFAULT NULL,
  p_tanggal_lahir TEXT DEFAULT NULL,
  p_tmt TEXT DEFAULT NULL,
  p_masa_kerja TEXT DEFAULT NULL,
  p_gaji_pokok_nominal NUMERIC DEFAULT NULL,
  p_tunjangan_jabatan NUMERIC DEFAULT NULL,
  p_tunjangan_wali_kelas NUMERIC DEFAULT NULL,
  p_tunjangan_ijazah NUMERIC DEFAULT NULL,
  p_tunjangan_kinerja NUMERIC DEFAULT NULL,
  p_tarif_per_jam_mengajar NUMERIC DEFAULT NULL,
  p_tarif_transport_harian NUMERIC DEFAULT NULL,
  p_nama_bank TEXT DEFAULT NULL,
  p_nomor_rekening TEXT DEFAULT NULL,
  p_atas_nama_rekening TEXT DEFAULT NULL,
  p_npwp TEXT DEFAULT NULL,
  p_is_linier_kompetensi BOOLEAN DEFAULT NULL,
  p_tahun_pengalaman NUMERIC DEFAULT NULL,
  p_tahun_masa_kerja NUMERIC DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_modified_by TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE pegawai
  SET
    nip = COALESCE(p_nip, nip),
    niy = COALESCE(p_niy, niy),
    nik = COALESCE(p_nik, nik),
    nuptk = COALESCE(p_nuptk, nuptk),
    nama_lengkap = COALESCE(p_nama_lengkap, nama_lengkap),
    nama = COALESCE(p_nama_lengkap, nama),
    email = COALESCE(p_email, email),
    no_hp = COALESCE(p_no_hp, no_hp),
    status_pegawai = COALESCE(p_status_pegawai, status_pegawai),
    jenis_pegawai = COALESCE(p_status_pegawai, jenis_pegawai),
    jabatan_utama = COALESCE(p_jabatan_utama, jabatan_utama),
    jabatan = COALESCE(p_jabatan_utama, jabatan),
    jabatan_tambahan = COALESCE(p_jabatan_tambahan, jabatan_tambahan),
    pendidikan_terakhir = COALESCE(p_pendidikan_terakhir, pendidikan_terakhir),
    jurusan = COALESCE(p_jurusan, jurusan),
    status_induk = COALESCE(p_status_induk, status_induk),
    keterangan_induk = COALESCE(p_keterangan_induk, keterangan_induk),
    jenis_kelamin = COALESCE(p_jenis_kelamin, jenis_kelamin),
    tempat_lahir = COALESCE(p_tempat_lahir, tempat_lahir),
    tanggal_lahir = COALESCE(p_tanggal_lahir, tanggal_lahir),
    tmt = COALESCE(p_tmt, tmt),
    masa_kerja = COALESCE(p_masa_kerja, masa_kerja),
    gaji_pokok_nominal = COALESCE(p_gaji_pokok_nominal, gaji_pokok_nominal),
    gaji_pokok_default = COALESCE(p_gaji_pokok_nominal, gaji_pokok_default),
    tunjangan_jabatan_default = COALESCE(p_tunjangan_jabatan, tunjangan_jabatan_default),
    tunjangan_wali_kelas = COALESCE(p_tunjangan_wali_kelas, tunjangan_wali_kelas),
    tunjangan_ijazah_default = COALESCE(p_tunjangan_ijazah, tunjangan_ijazah_default),
    tunjangan_kinerja_default = COALESCE(p_tunjangan_kinerja, tunjangan_kinerja_default),
    tarif_per_jam_mengajar = COALESCE(p_tarif_per_jam_mengajar, tarif_per_jam_mengajar),
    tarif_transport_harian = COALESCE(p_tarif_transport_harian, tarif_transport_harian),
    nama_bank = COALESCE(p_nama_bank, nama_bank),
    nomor_rekening = COALESCE(p_nomor_rekening, nomor_rekening),
    atas_nama_rekening = COALESCE(p_atas_nama_rekening, atas_nama_rekening),
    npwp = COALESCE(p_npwp, npwp),
    is_linier_kompetensi = COALESCE(p_is_linier_kompetensi, is_linier_kompetensi),
    tahun_pengalaman = COALESCE(p_tahun_pengalaman, tahun_pengalaman),
    tahun_masa_kerja = COALESCE(p_tahun_masa_kerja, tahun_masa_kerja),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_pegawai_id;

  v_result := jsonb_build_object(
    'success', true,
    'pegawai_id', p_pegawai_id,
    'modified_by', p_modified_by,
    'timestamp', NOW()
  );
  RETURN v_result;
END;
$$;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlRpcSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showToast?.('Skrip RPC Master Pegawai berhasil disalin ke clipboard!', 'info');
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm overflow-hidden transition-all duration-300">
      {/* Top Banner & Control Header - Soft Green Aesthetic */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
                <Users className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Tabel Data Lengkap Guru & Pegawai
                  <span className="text-xs font-normal text-emerald-200/90 bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                    Master SDM SMK IT IQM
                  </span>
                </h3>
                <p className="text-xs text-emerald-100/75 mt-0.5">
                  Tabel interaktif master data lengkap seluruh guru & tenaga kependidikan dengan kolom Nama Pegawai sticky dan integrasi Supabase RPC.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1.5 bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Lihat kode stored procedure PostgreSQL untuk Supabase RPC Pegawai"
            >
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>Skrip RPC Supabase</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => setCompactView(!compactView)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                compactView 
                  ? 'bg-emerald-600 text-white border-emerald-400' 
                  : 'bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 border-emerald-600/40'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{compactView ? 'Tampilan Lengkap' : 'Tampilan Ringkas'}</span>
            </button>

            {dirtyRowIds.size > 0 && (
              <button
                onClick={handleResetAll}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-100 text-xs font-medium rounded-lg border border-rose-700/50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua ({dirtyRowIds.size})</span>
              </button>
            )}

            <button
              onClick={handleBatchSave}
              disabled={dirtyRowIds.size === 0 || isBatchSaving}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                dirtyRowIds.size > 0
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold shadow-emerald-900/40'
                  : 'bg-emerald-800/40 text-emerald-300/40 cursor-not-allowed border border-emerald-700/30'
              }`}
            >
              {isBatchSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Semua ({dirtyRowIds.size} Diubah)</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 rounded-lg transition-colors cursor-pointer ml-1"
                title="Tutup Tabel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter and Quick Metrics Bar */}
        <div className="mt-4 pt-4 border-t border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-300" />
              <input
                type="text"
                placeholder="Cari nama, NIP, NIK, jabatan, jurusan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-emerald-950/50 text-white placeholder-emerald-300/60 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-emerald-600/40 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Filter Status Pegawai */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-emerald-200/80 mr-1 text-[11px]">Status:</span>
              {(['all', 'GTY', 'GTT', 'PTY'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-emerald-900 font-semibold shadow-xs'
                      : 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st}
                </button>
              ))}
            </div>

            {/* Filter Induk vs Non-Induk */}
            <div className="flex items-center gap-1 text-xs ml-1">
              <span className="text-emerald-200/80 mr-1 text-[11px]">Induk:</span>
              {(['all', 'Induk', 'Non Induk'] as const).map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndukFilter(ind)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    indukFilter === ind
                      ? 'bg-white text-emerald-900 font-semibold shadow-xs'
                      : 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60'
                  }`}
                >
                  {ind === 'all' ? 'Semua' : ind}
                </button>
              ))}
            </div>

            {/* Filter Role (Guru vs Tendik) */}
            <div className="flex items-center gap-1 text-xs ml-1">
              <span className="text-emerald-200/80 mr-1 text-[11px]">Tipe:</span>
              {(['all', 'guru', 'tendik'] as const).map((rf) => (
                <button
                  key={rf}
                  onClick={() => setRoleFilter(rf)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer capitalize ${
                    roleFilter === rf
                      ? 'bg-white text-emerald-900 font-semibold shadow-xs'
                      : 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60'
                  }`}
                >
                  {rf === 'all' ? 'Semua' : rf}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 text-xs bg-emerald-950/60 px-3.5 py-1.5 rounded-lg border border-emerald-700/50">
            <div>
              <span className="text-emerald-300/80 text-[11px]">Total SDM:</span>{' '}
              <strong className="text-white font-mono">{summary.totalPegawai}</strong>
            </div>
            <span className="text-emerald-600">·</span>
            <div>
              <span className="text-emerald-300/80 text-[11px]">Guru / Tendik:</span>{' '}
              <strong className="text-emerald-200 font-mono">{summary.totalGuru} / {summary.totalTendik}</strong>
            </div>
            <span className="text-emerald-600">·</span>
            <div>
              <span className="text-emerald-300 text-[11px] font-semibold">Total Gaji Pokok:</span>{' '}
              <strong className="text-emerald-300 font-mono font-bold">{formatRupiah(summary.totalGajiPokok)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Spreadsheet Table */}
      <div className="overflow-x-auto relative max-h-[72vh] border-b border-emerald-100 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
        <table className="w-full text-left text-xs border-collapse">
          {/* Multi-Tier Table Header with Soft Green Tone */}
          <thead className="sticky top-0 z-30 shadow-xs select-none">
            {/* Category Groups Header */}
            <tr className="bg-emerald-900 text-white uppercase text-[10px] tracking-wider border-b border-emerald-700">
              <th 
                colSpan={2} 
                className="sticky left-0 z-40 bg-emerald-950 py-2 px-3 border-r border-emerald-800 text-emerald-200 font-semibold text-center"
              >
                1. Data Identitas Pegawai
              </th>
              
              {!compactView ? (
                <th 
                  colSpan={6} 
                  className="py-2 px-3 bg-emerald-900 border-r border-emerald-800 text-emerald-100 font-semibold text-center"
                >
                  2. Administrasi Kependudukan & Kontak
                </th>
              ) : (
                <th 
                  colSpan={2} 
                  className="py-2 px-3 bg-emerald-900 border-r border-emerald-800 text-emerald-100 font-semibold text-center"
                >
                  2. Administrasi Pokok
                </th>
              )}

              <th 
                colSpan={compactView ? 3 : 6} 
                className="py-2 px-3 bg-teal-900 border-r border-teal-800 text-teal-100 font-semibold text-center"
              >
                3. Kepegawaian, Jabatan & Pendidikan
              </th>

              <th 
                colSpan={compactView ? 3 : 7} 
                className="py-2 px-3 bg-emerald-800 border-r border-emerald-700 text-emerald-100 font-semibold text-center"
              >
                4. Konfigurasi Gaji Pokok & Tunjangan Standar
              </th>

              <th 
                colSpan={compactView ? 2 : 4} 
                className="py-2 px-3 bg-slate-900 border-r border-slate-700 text-slate-200 font-semibold text-center"
              >
                5. Rekening Bank & NPWP
              </th>

              <th 
                className="sticky right-0 z-40 bg-emerald-950 py-2 px-3 text-emerald-300 font-extrabold text-center border-l-2 border-emerald-500"
              >
                6. Aksi
              </th>
            </tr>

            {/* Detailed Sub Headers */}
            <tr className="bg-emerald-800 text-emerald-100 text-[11px] font-medium border-b border-emerald-600">
              {/* Sticky Columns Left */}
              <th className="sticky left-0 z-40 bg-emerald-900 py-2.5 px-2.5 text-center w-10 border-r border-emerald-700">
                No
              </th>
              <th className="sticky left-10 z-40 bg-emerald-900 py-2.5 px-3 min-w-[210px] border-r border-emerald-700 text-emerald-100">
                Nama Lengkap & NIP
              </th>

              {/* Administrasi Kependudukan */}
              <th className="py-2.5 px-2.5 min-w-[130px] border-r border-emerald-700 font-mono">
                NIK (16 Digit)
              </th>
              {!compactView && (
                <>
                  <th className="py-2.5 px-2 text-center min-w-[50px] border-r border-emerald-700">
                    L/P
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[110px] border-r border-emerald-700">
                    Tempat Lahir
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[105px] border-r border-emerald-700">
                    Tgl Lahir
                  </th>
                  <th className="py-2.5 px-2 text-center min-w-[75px] border-r border-emerald-700">
                    Usia
                  </th>
                </>
              )}
              <th className="py-2.5 px-2.5 min-w-[125px] border-r border-emerald-700 font-mono">
                No. HP / WA
              </th>

              {/* Kepegawaian & Jabatan */}
              <th className="py-2.5 px-2.5 min-w-[90px] border-r border-emerald-700">
                Status
              </th>
              <th className="py-2.5 px-2.5 min-w-[90px] border-r border-emerald-700">
                Induk
              </th>
              <th className="py-2.5 px-3 min-w-[140px] border-r border-emerald-700">
                Jabatan Utama
              </th>
              {!compactView && (
                <>
                  <th className="py-2.5 px-2 text-center min-w-[65px] border-r border-emerald-700">
                    Pendidikan
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[130px] border-r border-emerald-700">
                    Jurusan / Prodi
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[95px] border-r border-emerald-700">
                    Masa Kerja
                  </th>
                </>
              )}

              {/* Konfigurasi Gaji Pokok & Tunjangan */}
              <th className="py-2.5 px-2.5 text-right min-w-[110px] border-r border-emerald-700 font-mono text-emerald-100 font-bold bg-emerald-700/60">
                Gaji Pokok
              </th>
              <th className="py-2.5 px-2 text-right min-w-[95px] border-r border-emerald-700 font-mono">
                Tunj. Jabatan
              </th>
              <th className="py-2.5 px-2 text-right min-w-[90px] border-r border-emerald-700 font-mono">
                Tunj. Wali Kelas
              </th>
              {!compactView && (
                <>
                  <th className="py-2.5 px-2 text-right min-w-[90px] border-r border-emerald-700 font-mono">
                    Tunj. Ijazah
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[90px] border-r border-emerald-700 font-mono">
                    Tunj. Kinerja
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono">
                    Tarif JP
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono">
                    Transport/Hr
                  </th>
                </>
              )}

              {/* Rekening Bank */}
              <th className="py-2.5 px-2.5 min-w-[100px] border-r border-emerald-700">
                Nama Bank
              </th>
              <th className="py-2.5 px-2.5 min-w-[120px] border-r border-emerald-700 font-mono">
                No. Rekening
              </th>
              {!compactView && (
                <>
                  <th className="py-2.5 px-2.5 min-w-[130px] border-r border-emerald-700">
                    Atas Nama
                  </th>
                  <th className="py-2.5 px-2.5 min-w-[110px] border-r border-emerald-700 font-mono">
                    NPWP
                  </th>
                </>
              )}

              {/* Sticky Action Column */}
              <th className="sticky right-0 z-40 bg-emerald-900 py-2.5 px-3 text-center min-w-[80px] text-emerald-100 border-l-2 border-emerald-500">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-emerald-100/70 bg-white">
            {filteredPegawai.length === 0 ? (
              <tr>
                <td colSpan={28} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-70" />
                  <p className="font-medium">Tidak ada data pegawai yang sesuai dengan filter pencarian.</p>
                </td>
              </tr>
            ) : (
              filteredPegawai.map((p, index) => {
                const isDirty = dirtyRowIds.has(p.id);
                const isSaving = savingRowIds.has(p.id);

                return (
                  <tr 
                    key={p.id} 
                    className={`group transition-colors ${
                      isDirty 
                        ? 'bg-amber-50/50 hover:bg-amber-50/80' 
                        : 'hover:bg-emerald-50/40'
                    }`}
                  >
                    {/* Sticky Left 1: Index */}
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-emerald-50/70 py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-500 border-r border-emerald-100">
                      {index + 1}
                    </td>

                    {/* Sticky Left 2: Employee Name & NIP */}
                    <td className="sticky left-10 z-20 bg-white group-hover:bg-emerald-50/70 py-2 px-3 border-r border-emerald-100 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[210px]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 border border-emerald-300/60">
                          {p.nama.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <input
                            type="text"
                            value={p.nama}
                            onChange={(e) => handleCellChange(p.id, 'nama', e.target.value)}
                            className="font-semibold text-slate-800 text-xs w-full bg-transparent border-b border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                            title={p.nama}
                          />
                          <div className="text-[10px] text-slate-500 font-mono truncate flex items-center gap-1">
                            <span>NIP:</span>
                            <input
                              type="text"
                              value={p.nip}
                              onChange={(e) => handleCellChange(p.id, 'nip', e.target.value)}
                              className="font-mono text-[10px] text-slate-600 bg-transparent border-b border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none w-24"
                            />
                            {isDirty && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 ml-auto" title="Ada perubahan belum disimpan" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* NIK */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <input
                        type="text"
                        maxLength={16}
                        value={p.nik || ''}
                        placeholder="3201..."
                        onChange={(e) => handleCellChange(p.id, 'nik', e.target.value)}
                        className="w-full font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {!compactView && (
                      <>
                        {/* Jenis Kelamin */}
                        <td className="p-1 text-center border-r border-emerald-100/80">
                          <select
                            value={p.jenisKelamin || 'L'}
                            onChange={(e) => handleCellChange(p.id, 'jenisKelamin', e.target.value)}
                            className="text-xs bg-transparent border border-transparent hover:border-emerald-200 focus:border-emerald-500 rounded py-0.5 px-1 cursor-pointer focus:outline-none"
                          >
                            <option value="L">L</option>
                            <option value="P">P</option>
                          </select>
                        </td>

                        {/* Tempat Lahir */}
                        <td className="p-1 border-r border-emerald-100/80">
                          <input
                            type="text"
                            value={p.tempatLahir || ''}
                            placeholder="Kota..."
                            onChange={(e) => handleCellChange(p.id, 'tempatLahir', e.target.value)}
                            className="w-full text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tanggal Lahir */}
                        <td className="p-1 border-r border-emerald-100/80">
                          <input
                            type="date"
                            value={p.tanggalLahir || ''}
                            onChange={(e) => handleCellChange(p.id, 'tanggalLahir', e.target.value)}
                            className="w-full text-[11px] font-mono px-1 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Usia (Auto-Calculated) */}
                        <td className="py-2 px-1 text-center text-[10px] text-slate-600 font-mono border-r border-emerald-100/80 whitespace-nowrap">
                          {p.usia || calculateAge(p.tanggalLahir) || '-'}
                        </td>
                      </>
                    )}

                    {/* No HP */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <input
                        type="text"
                        value={p.noHp || ''}
                        placeholder="0812..."
                        onChange={(e) => handleCellChange(p.id, 'noHp', e.target.value)}
                        className="w-full font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Status Pegawai */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <select
                        value={p.statusPegawai || 'GTT'}
                        onChange={(e) => handleCellChange(p.id, 'statusPegawai', e.target.value)}
                        className="w-full text-xs font-semibold text-emerald-800 bg-transparent border border-transparent hover:border-emerald-200 focus:border-emerald-500 rounded py-1 px-1 cursor-pointer focus:outline-none"
                      >
                        <option value="GTY">GTY</option>
                        <option value="GTT">GTT</option>
                        <option value="PTY">PTY</option>
                        <option value="PTT">PTT</option>
                      </select>
                    </td>

                    {/* Status Induk */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <select
                        value={p.statusInduk || 'Induk'}
                        onChange={(e) => handleCellChange(p.id, 'statusInduk', e.target.value)}
                        className={`w-full text-xs font-medium bg-transparent border border-transparent hover:border-emerald-200 focus:border-emerald-500 rounded py-1 px-1 cursor-pointer focus:outline-none ${
                          p.statusInduk === 'Non Induk' ? 'text-amber-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <option value="Induk">Induk</option>
                        <option value="Non Induk">Non Induk</option>
                      </select>
                    </td>

                    {/* Jabatan Utama */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <input
                        type="text"
                        value={p.jabatanUtama || ''}
                        onChange={(e) => handleCellChange(p.id, 'jabatanUtama', e.target.value)}
                        className="w-full text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                        title={p.jabatanUtama}
                      />
                    </td>

                    {!compactView && (
                      <>
                        {/* Pendidikan */}
                        <td className="p-1 text-center border-r border-emerald-100/80">
                          <select
                            value={p.pendidikanTerakhir || 'S1'}
                            onChange={(e) => handleCellChange(p.id, 'pendidikanTerakhir', e.target.value)}
                            className="text-xs bg-transparent border border-transparent hover:border-emerald-200 focus:border-emerald-500 rounded py-1 px-1 cursor-pointer focus:outline-none"
                          >
                            <option value="SMA">SMA</option>
                            <option value="D1">D1</option>
                            <option value="D2">D2</option>
                            <option value="D3">D3</option>
                            <option value="S1">S1</option>
                            <option value="S2">S2</option>
                            <option value="S3">S3</option>
                          </select>
                        </td>

                        {/* Jurusan */}
                        <td className="p-1 border-r border-emerald-100/80">
                          <input
                            type="text"
                            value={p.jurusan || ''}
                            placeholder="Teknik Informatika..."
                            onChange={(e) => handleCellChange(p.id, 'jurusan', e.target.value)}
                            className="w-full text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                            title={p.jurusan}
                          />
                        </td>

                        {/* Masa Kerja */}
                        <td className="py-2 px-2 text-[10px] text-slate-600 font-mono border-r border-emerald-100/80 whitespace-nowrap">
                          {p.masaKerja || calculateMasaKerja(p.tmt) || '-'}
                        </td>
                      </>
                    )}

                    {/* Gaji Pokok Default */}
                    <td className="p-1 text-right border-r border-emerald-100/80 bg-emerald-50/30">
                      <input
                        type="number"
                        step="10000"
                        value={p.gajiPokokDefault || 0}
                        onChange={(e) => handleCellChange(p.id, 'gajiPokokDefault', Number(e.target.value))}
                        className="w-full text-right font-mono font-bold text-emerald-900 text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Tunjangan Jabatan */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="10000"
                        value={p.tunjanganJabatanDefault || 0}
                        onChange={(e) => handleCellChange(p.id, 'tunjanganJabatanDefault', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Tunjangan Wali Kelas */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="10000"
                        value={p.tunjanganWaliKelas || 0}
                        onChange={(e) => handleCellChange(p.id, 'tunjanganWaliKelas', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {!compactView && (
                      <>
                        {/* Tunjangan Ijazah */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="10000"
                            value={p.tunjanganIjazahDefault || 0}
                            onChange={(e) => handleCellChange(p.id, 'tunjanganIjazahDefault', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tunjangan Kinerja */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="10000"
                            value={p.tunjanganKinerjaDefault || 0}
                            onChange={(e) => handleCellChange(p.id, 'tunjanganKinerjaDefault', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tarif JP */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={p.tarifPerJamMengajar || 18000}
                            onChange={(e) => handleCellChange(p.id, 'tarifPerJamMengajar', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tarif Transport */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={p.tarifTransportHarian || 20000}
                            onChange={(e) => handleCellChange(p.id, 'tarifTransportHarian', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>
                      </>
                    )}

                    {/* Nama Bank */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <input
                        type="text"
                        value={p.namaBank || 'BSI'}
                        onChange={(e) => handleCellChange(p.id, 'namaBank', e.target.value)}
                        className="w-full text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Nomor Rekening */}
                    <td className="p-1 border-r border-emerald-100/80">
                      <input
                        type="text"
                        value={p.nomorRekening || ''}
                        onChange={(e) => handleCellChange(p.id, 'nomorRekening', e.target.value)}
                        className="w-full font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {!compactView && (
                      <>
                        {/* Atas Nama */}
                        <td className="p-1 border-r border-emerald-100/80">
                          <input
                            type="text"
                            value={p.atasNamaRekening || p.nama}
                            onChange={(e) => handleCellChange(p.id, 'atasNamaRekening', e.target.value)}
                            className="w-full text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* NPWP */}
                        <td className="p-1 border-r border-emerald-100/80">
                          <input
                            type="text"
                            value={p.npwp || ''}
                            onChange={(e) => handleCellChange(p.id, 'npwp', e.target.value)}
                            className="w-full font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>
                      </>
                    )}

                    {/* Sticky Action Column */}
                    <td className="sticky right-0 z-20 bg-white group-hover:bg-emerald-50/70 py-2 px-2 text-center border-l-2 border-emerald-400">
                      <div className="flex items-center justify-center gap-1">
                        {isDirty ? (
                          <>
                            <button
                              onClick={() => handleSaveRow(p.id)}
                              disabled={isSaving}
                              title="Simpan baris ini ke Supabase"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleResetRow(p.id)}
                              title="Batalkan perubahan"
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedPegawaiForModal(p)}
                            title="Buka Formulir Lengkap Pegawai"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-md transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Footer: Total Summary */}
          <tfoot className="sticky bottom-0 z-30 bg-emerald-900 text-white font-bold border-t-2 border-emerald-600 shadow-md">
            <tr className="text-[11px]">
              <td 
                colSpan={2} 
                className="sticky left-0 z-40 bg-emerald-950 py-3 px-3 text-emerald-200 uppercase tracking-wide border-r border-emerald-800 text-center font-bold"
              >
                TOTAL ({filteredPegawai.length} PEGAWAI)
              </td>

              <td colSpan={compactView ? 5 : 12} className="py-3 px-3 text-emerald-100 text-xs border-r border-emerald-800">
                SDM Aktif: <strong className="text-white">{summary.totalInduk} Induk</strong> · <span className="text-emerald-300">{summary.totalNonInduk} Non-Induk</span> ({summary.totalGuru} Guru, {summary.totalTendik} Tenaga Kependidikan)
              </td>

              {/* Total Gaji Pokok */}
              <td className="py-3 px-2.5 text-right font-mono font-extrabold text-white bg-emerald-800 border-r border-emerald-700">
                {formatRupiah(summary.totalGajiPokok)}
              </td>

              <td colSpan={compactView ? 4 : 10} className="py-3 px-3 text-emerald-200 text-[10px] border-r border-emerald-800">
                Konfigurasi Master Gaji Standar Sekolah
              </td>

              {/* Sticky Right Action Footer */}
              <td className="sticky right-0 z-40 bg-emerald-950 py-3 px-2 text-center text-emerald-400 border-l-2 border-emerald-500">
                <CheckCheck className="w-4 h-4 mx-auto" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Information Footer */}
      <div className="bg-emerald-50/70 p-3.5 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-900 gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Seluruh data identitas, status kepegawaian, dan tarif tunjangan dapat langsung disunting (inline editable) dan tersimpan ke Supabase via RPC.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-[11px] text-slate-600">Diedit belum disimpan ({dirtyRowIds.size})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] text-slate-600">Tersinkronisasi database</span>
          </div>
        </div>
      </div>

      {/* SQL Supabase RPC Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-emerald-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-300" />
                <h4 className="font-bold text-sm">Supabase PostgreSQL RPC Function (Pegawai Master)</h4>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Salin skrip SQL berikut dan jalankan di menu <strong>SQL Editor</strong> pada project Supabase Anda untuk mengaktifkan Remote Procedure Call (RPC) <code>update_pegawai_master_data</code>.
              </p>
              
              <div className="relative">
                <pre className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-72 border border-slate-700 leading-normal">
                  {sqlRpcSnippet}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2.5 right-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Row Editor */}
      {selectedPegawaiForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-emerald-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-300" />
                <h4 className="font-bold text-sm">Sunting Profil Lengkap: {selectedPegawaiForModal.nama}</h4>
              </div>
              <button
                onClick={() => setSelectedPegawaiForModal(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.nama || ''}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'nama', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NIP</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.nip || ''}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'nip', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NIK (KTP)</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.nik || ''}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'nik', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jabatan Utama</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.jabatanUtama || ''}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'jabatanUtama', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pendidikan Terakhir</label>
                  <select
                    value={draftPegawai[selectedPegawaiForModal.id]?.pendidikanTerakhir || 'S1'}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'pendidikanTerakhir', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="SMA">SMA</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jurusan / Program Studi</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.jurusan || ''}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'jurusan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gaji Pokok Default (Rp)</label>
                  <input
                    type="number"
                    step="10000"
                    value={draftPegawai[selectedPegawaiForModal.id]?.gajiPokokDefault || 0}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'gajiPokokDefault', Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:border-emerald-500 focus:outline-none font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tunjangan Jabatan Default (Rp)</label>
                  <input
                    type="number"
                    step="10000"
                    value={draftPegawai[selectedPegawaiForModal.id]?.tunjanganJabatanDefault || 0}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'tunjanganJabatanDefault', Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.namaBank || 'Bank Syariah Indonesia (BSI)'}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'namaBank', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={draftPegawai[selectedPegawaiForModal.id]?.nomorRekening || ''}
                    onChange={(e) => handleCellChange(selectedPegawaiForModal.id, 'nomorRekening', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPegawaiForModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={async () => {
                  await handleSaveRow(selectedPegawaiForModal.id);
                  setSelectedPegawaiForModal(null);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan ke Supabase</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
