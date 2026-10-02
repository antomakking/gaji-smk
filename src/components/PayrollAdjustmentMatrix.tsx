import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Download, 
  Search, 
  Filter, 
  Check, 
  AlertCircle, 
  Database, 
  Copy, 
  Calculator, 
  Sparkles, 
  Columns, 
  Eye, 
  CheckCheck, 
  Loader2, 
  FileSpreadsheet, 
  X,
  HelpCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { PenggajianRecord, Pegawai, User, AuditCategory, AuditActionType } from '../types';
import { formatRupiah } from '../utils/security';
import { updatePayrollMatrixAdjustmentRPC, getSupabase } from '../lib/supabase';

interface PayrollAdjustmentMatrixProps {
  records: PenggajianRecord[];
  pegawaiList?: Pegawai[];
  currentUser: User;
  onUpdateRecord?: (updatedRecord: PenggajianRecord) => void;
  onBatchUpdateRecords?: (updatedRecords: PenggajianRecord[]) => void;
  selectedBulan?: number;
  selectedTahun?: number;
  selectedPeriodeId?: string;
  onClose?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onAuditLog?: (category: AuditCategory, action: AuditActionType, actionLabel: string, target: string, details: string) => void;
  onInspectFormula?: (record: PenggajianRecord) => void;
  onViewSlip?: (record: PenggajianRecord) => void;
}

export const PayrollAdjustmentMatrix: React.FC<PayrollAdjustmentMatrixProps> = ({
  records,
  pegawaiList = [],
  currentUser,
  onUpdateRecord,
  onBatchUpdateRecords,
  selectedBulan = 9,
  selectedTahun = 2026,
  selectedPeriodeId,
  onClose,
  showToast,
  onAuditLog,
  onInspectFormula,
  onViewSlip,
}) => {
  // Supabase fetched records state
  const [matrixRecords, setMatrixRecords] = useState<PenggajianRecord[]>(records);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);

  // Local state for draft modifications per record
  const [draftRecords, setDraftRecords] = useState<Record<string, PenggajianRecord>>({});
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'GTY' | 'GTT' | 'PTY'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'tendik'>('all');
  const [compactView, setCompactView] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // 1. Fetching initial data directly from Supabase slip_gaji table based on selected period
  useEffect(() => {
    let isMounted = true;

    const fetchSupabaseSlipGaji = async () => {
      const client = getSupabase();
      if (!client) {
        setMatrixRecords(records);
        return;
      }

      setIsLoadingSupabase(true);

      try {
        let query = client
          .from('slip_gaji')
          .select(`
            *,
            pegawai:pegawai_id (
              id,
              nip,
              niy,
              nama_lengkap,
              nama,
              jabatan,
              jabatan_utama,
              status_pegawai,
              jenis_pegawai,
              status_induk
            )
          `);

        if (selectedPeriodeId) {
          query = query.eq('periode_id', selectedPeriodeId);
        } else if (selectedBulan && selectedTahun) {
          query = query.eq('bulan', selectedBulan).eq('tahun', selectedTahun);
        }

        let { data, error } = await query;

        if (error) {
          console.warn('⚠️ [Supabase Matrix Fetch] Query slip_gaji:', error.message);
        }

        // Fallback: Jika filter periode tidak mengembalikan data, muat seluruh data slip_gaji dari Supabase
        if ((!data || data.length === 0) && client) {
          const fallbackRes = await client
            .from('slip_gaji')
            .select(`
              *,
              pegawai:pegawai_id (
                id,
                nip,
                niy,
                nama_lengkap,
                nama,
                jabatan,
                jabatan_utama,
                status_pegawai,
                jenis_pegawai,
                status_induk
              )
            `);
          if (fallbackRes.data && fallbackRes.data.length > 0) {
            data = fallbackRes.data;
          }
        }

        if (data && data.length > 0 && isMounted) {
          const mapped: PenggajianRecord[] = data.map((row: any): PenggajianRecord => {
            const rawPeg = row.pegawai;
            const joinedPeg = Array.isArray(rawPeg) ? rawPeg[0] : rawPeg;
            const fallbackPeg = pegawaiList.find(p => p.id === row.pegawai_id);
            const peg = joinedPeg || fallbackPeg || {};

            const totalPenerimaan = Number(row.gaji_kotor || row.total_penerimaan || row.total_tambahan || 0);
            const totalPotongan = Number(row.total_potongan || 0);
            const thp = Number(row.take_home_pay || row.gaji_bersih || Math.max(0, totalPenerimaan - totalPotongan));

            return {
              id: String(row.id), // UUID ASLI DARI TABEL SLIP_GAJI SUPABASE
              kodeSlip: String(row.kode_slip || `SLIP/${row.tahun || selectedTahun}/${String(row.bulan || selectedBulan).padStart(2, '0')}/${String(row.id).slice(0, 8)}`),
              pegawaiId: String(row.pegawai_id || peg.id || ''),
              pegawaiNama: String(peg.nama_lengkap || peg.nama || row.pegawai_nama || 'Pegawai'),
              pegawaiNip: String(peg.nip || peg.niy || row.pegawai_nip || ''),
              pegawaiJabatan: String(peg.jabatan || peg.jabatan_utama || row.pegawai_jabatan || '-'),
              pegawaiStatus: (peg.status_pegawai || peg.jenis_pegawai || row.pegawai_status || 'GTT') as any,
              pegawaiEmail: String(peg.email || row.pegawai_email || ''),
              bulan: Number(row.bulan || selectedBulan),
              tahun: Number(row.tahun || selectedTahun),
              periodeLabel: String(row.periode_label || row.nama_periode || `${selectedBulan}-${selectedTahun}`),

              tanggalCutoffMulai: String(row.tanggal_cutoff_mulai || ''),
              tanggalCutoffSelesai: String(row.tanggal_cutoff_selesai || ''),
              tanggalMulaiBayar: String(row.tanggal_mulai_bayar || ''),
              periodeCutoffLabel: String(row.periode_cutoff_label || ''),

              statusInduk: (peg.status_induk || row.status_induk || 'Induk') as any,
              keteranganInduk: String(peg.keterangan_induk || row.keterangan_induk || ''),

              presensiHadir: Number(row.presensi_hadir || 0),
              presensiAlpha: Number(row.presensi_alpha || 0),
              presensiIzin: Number(row.presensi_izin || 0),
              presensiSakit: Number(row.presensi_sakit || 0),
              presensiCuti: Number(row.presensi_cuti || 0),
              presensiDinasLuar: Number(row.presensi_dinas_luar || 0),
              presensiTerlambatMenit: Number(row.presensi_terlambat_menit || 0),
              jamMengajarRealisasi: Number(row.realisasi_jp || row.jam_mengajar_realisasi || 0),
              jamLembur: Number(row.jam_lembur || 0),

              gajiPokok: Number(row.gaji_pokok_nominal || row.gaji_pokok || 0),
              tunjanganJabatan: Number(row.tunjangan_jabatan || 0),
              tunjanganKepsek: Number(row.tunjangan_kepsek || 0),
              tunjanganWakasek: Number(row.tunjangan_wakasek || 0),
              tunjanganWaliKelas: Number(row.tunjangan_wali_kelas || 0),
              tunjanganItOfficer: Number(row.tunjangan_it_officer || 0),
              tunjanganDkm: Number(row.tunjangan_dkm || 0),
              tunjanganAsrama: Number(row.tunjangan_asrama || 0),
              tunjanganBendahara: Number(row.tunjangan_bendahara || 0),
              tunjanganPj: Number(row.tunjangan_pj || 0),

              tunjanganIjazahJenjang: String(row.tunjangan_ijazah_jenjang || 'S1'),
              tunjanganIjazah: Number(row.tunjangan_ijazah || 0),
              isLinierKompetensi: Boolean(row.is_linier_kompetensi),
              tunjanganKompetensi: Number(row.tunjangan_kompetensi || 0),
              tahunPengalaman: Number(row.tahun_pengalaman || 0),
              tunjanganPengalaman: Number(row.tunjangan_pengalaman || 0),
              tahunMasaKerja: Number(row.tahun_masa_kerja || 0),
              tunjanganMasaKerja: Number(row.tunjangan_masa_kerja || 0),
              tunjanganKinerja: Number(row.tunjangan_kinerja || 0),
              tunjanganKehadiran: Number(row.tunjangan_kehadiran || 0),
              tunjanganKehadiranTransport: Number(row.tunjangan_kehadiran_transport || row.tunjangan_kehadiran || 0),
              honorJamMengajar: Number(row.total_honor_jp || row.honor_jam_mengajar || 0),
              honorLembur: Number(row.honor_lembur || 0),
              honorInfal: Number(row.honor_inval || row.honor_infal || 0),
              jpMenggantikan: Number(row.jp_menggantikan || 0),
              insentifKajianMuslimah: Number(row.insentif_kajian_muslimah || 0),
              koreksiPenerimaan: Number(row.koreksi_penerimaan || 0),
              tunjanganVokasiIT: Number(row.tunjangan_vokasi_it || 0),
              tunjanganLainnya: Number(row.tunjangan_lainnya || 0),
              totalPenerimaan,
              totalTambahan: totalPenerimaan,

              potonganKeterlambatan: Number(row.potongan_terlambat || row.potongan_keterlambatan || 0),
              potonganTidakMasuk: Number(row.potongan_tidak_masuk || row.potongan_alpha || 0),
              potonganAlpha: Number(row.potongan_alpha || row.potongan_tidak_masuk || 0),
              potonganIzin: Number(row.potongan_izin || 0),
              potonganInfal: Number(row.potongan_diganti_jp || row.potongan_infal || 0),
              jpDigantikan: Number(row.jp_digantikan || 0),
              koreksiPotongan: Number(row.koreksi_potongan || 0),
              potonganPinjaman: Number(row.potongan_pinjaman || row.potongan_kas_sekolah || 0),
              potonganBpjsKesehatan: Number(row.potongan_bpjs_kesehatan || 0),
              potonganBpjsKetenagakerjaan: Number(row.potongan_bpjs_ketenagakerjaan || 0),
              potonganKasSekolah: Number(row.potongan_kas_sekolah || row.potongan_pinjaman || 0),
              potonganKoperasi: Number(row.potongan_koperasi || 0),
              potonganLainnya: Number(row.potongan_lainnya || 0),
              totalPotongan,

              takeHomePay: thp,
              gajiBersih: thp,
              status: (row.status_approval || row.status || 'draft') as any,
              isEncrypted: true,
              securityChecksum: String(row.security_checksum || 'sha256-verified-iqm-system'),
              qrVerificationUrl: String(row.qr_verification_url || 'https://iqm.sch.id/verify'),
              createdAt: String(row.created_at || new Date().toISOString()),
              updatedAt: String(row.updated_at || new Date().toISOString()),
            };
          });

          setMatrixRecords(mapped);
        } else {
          setMatrixRecords(records);
        }
      } catch (err) {
        console.error('❌ Error fetching slip_gaji in PayrollAdjustmentMatrix:', err);
        setMatrixRecords(records);
      } finally {
        if (isMounted) setIsLoadingSupabase(false);
      }
    };

    fetchSupabaseSlipGaji();

    return () => { isMounted = false; };
  }, [selectedBulan, selectedTahun, selectedPeriodeId, records, pegawaiList]);

  // Initialize draft records from matrixRecords
  useEffect(() => {
    const map: Record<string, PenggajianRecord> = {};
    matrixRecords.forEach(r => {
      map[r.id] = { ...r };
    });
    setDraftRecords(map);
    setDirtyRowIds(new Set());
  }, [matrixRecords]);

  // Recalculate row totals automatically whenever any value changes
  const recalculateRow = (r: PenggajianRecord): PenggajianRecord => {
    const gp = Number(r.gajiPokok || 0);
    const tjJab = Number(r.tunjanganJabatan || 0);
    const tjWk = Number(r.tunjanganWaliKelas || 0);
    const tjIjz = Number(r.tunjanganIjazah || 0);
    const tjKomp = Number(r.tunjanganKompetensi || 0);
    const tjPeng = Number(r.tunjanganPengalaman || 0);
    const tjMasa = Number(r.tunjanganMasaKerja || 0);
    const tjKin = Number(r.tunjanganKinerja || 0);
    const tjHadir = Number(r.tunjanganKehadiran || 0);
    const hnrJp = Number(r.honorJamMengajar || 0);
    const hnrInf = Number(r.honorInfal || 0);
    const hnrLembur = Number(r.honorLembur || 0);
    const tjLain = Number(r.tunjanganLainnya || 0);
    const koreksiPlus = Number(r.koreksiPenerimaan || 0);

    const totalPenerimaan = 
      gp + tjJab + tjWk + tjIjz + tjKomp + tjPeng + tjMasa + tjKin + tjHadir + 
      hnrJp + hnrInf + hnrLembur + tjLain + koreksiPlus;

    const potTerlambat = Number(r.potonganKeterlambatan || 0);
    const potAlpha = Number(r.potonganAlpha || 0);
    const potIzin = Number(r.potonganIzin || 0);
    const potTidakMasuk = Number(r.potonganTidakMasuk || 0);
    const potInfal = Number(r.potonganInfal || 0);
    const potKas = Number(r.potonganKasSekolah || 0);
    const potBpjsKes = Number(r.potonganBpjsKesehatan || 0);
    const potBpjsTk = Number(r.potonganBpjsKetenagakerjaan || 0);
    const potLain = Number(r.potonganLainnya || 0);
    const koreksiMinus = Number(r.koreksiPotongan || 0);

    const totalPotongan = 
      potTerlambat + potAlpha + potIzin + potTidakMasuk + potInfal + potKas + 
      potBpjsKes + potBpjsTk + potLain + koreksiMinus;

    const takeHomePay = Math.max(0, totalPenerimaan - totalPotongan);

    return {
      ...r,
      totalPenerimaan,
      totalTambahan: totalPenerimaan,
      totalPotongan,
      takeHomePay,
      gajiBersih: takeHomePay,
    };
  };

  // Handle cell field change
  const handleCellChange = (recordId: string, field: keyof PenggajianRecord, value: number) => {
    setDraftRecords(prev => {
      const current = prev[recordId];
      if (!current) return prev;

      const updatedDraft = {
        ...current,
        [field]: value
      };

      const calculated = recalculateRow(updatedDraft);

      return {
        ...prev,
        [recordId]: calculated
      };
    });

    setDirtyRowIds(prev => new Set(prev).add(recordId));
  };

  // Revert row changes to original record
  const handleResetRow = (recordId: string) => {
    const original = matrixRecords.find(r => r.id === recordId);
    if (original) {
      setDraftRecords(prev => ({
        ...prev,
        [recordId]: { ...original }
      }));
      setDirtyRowIds(prev => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
      showToast?.(`Perubahan pada baris ${original.pegawaiNama} telah di-reset.`, 'info');
    }
  };

  // Reset all edited rows
  const handleResetAll = () => {
    const map: Record<string, PenggajianRecord> = {};
    matrixRecords.forEach(r => {
      map[r.id] = { ...r };
    });
    setDraftRecords(map);
    setDirtyRowIds(new Set());
    showToast?.('Seluruh perubahan matriks dikembalikan ke data awal.', 'info');
  };

  // 2. Save single row directly to Supabase using UUID asli (.eq('id', record.id))
  const handleSaveRow = async (recordId: string) => {
    const record = draftRecords[recordId];
    if (!record) return;

    setSavingRowIds(prev => new Set(prev).add(recordId));

    try {
      const client = getSupabase();
      if (!client) {
        showToast?.('Gagal menyimpan: Supabase client belum terhubung.', 'error');
        return;
      }

      // Query update ke tabel slip_gaji berdasarkan UUID asli
      const updatePayload = {
        gaji_pokok_nominal: Number(record.gajiPokok || 0),
        gaji_pokok: Number(record.gajiPokok || 0),
        tunjangan_kepsek: Number(record.tunjanganKepsek || 0),
        tunjangan_wakasek: Number(record.tunjanganWakasek || 0),
        tunjangan_wali_kelas: Number(record.tunjanganWaliKelas || 0),
        tunjangan_kehadiran: Number(record.tunjanganKehadiran || 0),
        tunjangan_jabatan: Number(record.tunjanganJabatan || 0),
        tunjangan_ijazah: Number(record.tunjanganIjazah || 0),
        tunjangan_kinerja: Number(record.tunjanganKinerja || 0),
        total_honor_jp: Number(record.honorJamMengajar || 0),
        honor_jam_mengajar: Number(record.honorJamMengajar || 0),
        honor_inval: Number(record.honorInfal || 0),
        honor_infal: Number(record.honorInfal || 0),
        potongan_terlambat: Number(record.potonganKeterlambatan || 0),
        potongan_keterlambatan: Number(record.potonganKeterlambatan || 0),
        potongan_tidak_masuk: Number(record.potonganAlpha || 0),
        potongan_alpha: Number(record.potonganAlpha || 0),
        potongan_diganti_jp: Number(record.potonganInfal || 0),
        potongan_infal: Number(record.potonganInfal || 0),
        potongan_pinjaman: Number(record.potonganKasSekolah || 0),
        potongan_kas_sekolah: Number(record.potonganKasSekolah || 0),
        potongan_izin: Number(record.potonganIzin || 0),
        potongan_bpjs_kesehatan: Number(record.potonganBpjsKesehatan || 0),
        potongan_bpjs_ketenagakerjaan: Number(record.potonganBpjsKetenagakerjaan || 0),
        tunjangan_lainnya: Number(record.tunjanganLainnya || 0),
        potongan_lainnya: Number(record.potonganLainnya || 0),
        total_penerimaan: Number(record.totalPenerimaan || 0),
        gaji_kotor: Number(record.totalPenerimaan || 0),
        total_tambahan: Number(record.totalPenerimaan || 0),
        total_potongan: Number(record.totalPotongan || 0),
        gaji_bersih: Number(record.gajiBersih || record.takeHomePay || 0),
        take_home_pay: Number(record.takeHomePay || record.gajiBersih || 0),
        updated_at: new Date().toISOString(),
      };

      const { error } = await client
        .from('slip_gaji')
        .update(updatePayload)
        .eq('id', record.id); // UUID asli dari Supabase

      if (!error) {
        onUpdateRecord?.(record);
        setDirtyRowIds(prev => {
          const next = new Set(prev);
          next.delete(recordId);
          return next;
        });

        showToast?.(`Berhasil menyimpan penyesuaian gaji ${record.pegawaiNama} ke Supabase!`, 'success');

        onAuditLog?.(
          'gaji',
          'UPDATE',
          'Penyesuaian Matriks Gaji',
          `${record.pegawaiNama} (${record.kodeSlip})`,
          `Pembaruan matriks: Total Kotor Rp ${record.totalPenerimaan.toLocaleString('id-ID')}, Total Potongan Rp ${record.totalPotongan.toLocaleString('id-ID')}, THP Rp ${record.takeHomePay.toLocaleString('id-ID')}.`
        );
      } else {
        console.warn('⚠️ Direct update error, trying RPC:', error.message);
        const rpcResult = await updatePayrollMatrixAdjustmentRPC(record, currentUser.nama);
        if (rpcResult.success) {
          onUpdateRecord?.(record);
          setDirtyRowIds(prev => {
            const next = new Set(prev);
            next.delete(recordId);
            return next;
          });
          showToast?.(`Berhasil menyimpan penyesuaian gaji ${record.pegawaiNama} via RPC!`, 'success');
        } else {
          showToast?.(`Gagal menyimpan: ${error.message || rpcResult.error}`, 'error');
        }
      }
    } catch (err: any) {
      showToast?.(`Error saat menyimpan data: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingRowIds(prev => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  // Batch Save all dirty rows directly to Supabase
  const handleBatchSave = async () => {
    if (dirtyRowIds.size === 0) return;

    setIsBatchSaving(true);
    const rowIds = Array.from(dirtyRowIds);
    let successCount = 0;
    let failCount = 0;
    const updatedList: PenggajianRecord[] = [];
    const client = getSupabase();

    for (const id of rowIds) {
      const rec = draftRecords[id];
      if (!rec) continue;

      try {
        if (client) {
          const updatePayload = {
            gaji_pokok_nominal: Number(rec.gajiPokok || 0),
            gaji_pokok: Number(rec.gajiPokok || 0),
            tunjangan_kepsek: Number(rec.tunjanganKepsek || 0),
            tunjangan_wakasek: Number(rec.tunjanganWakasek || 0),
            tunjangan_wali_kelas: Number(rec.tunjanganWaliKelas || 0),
            tunjangan_kehadiran: Number(rec.tunjanganKehadiran || 0),
            tunjangan_jabatan: Number(rec.tunjanganJabatan || 0),
            tunjangan_ijazah: Number(rec.tunjanganIjazah || 0),
            tunjangan_kinerja: Number(rec.tunjanganKinerja || 0),
            total_honor_jp: Number(rec.honorJamMengajar || 0),
            honor_jam_mengajar: Number(rec.honorJamMengajar || 0),
            honor_inval: Number(rec.honorInfal || 0),
            honor_infal: Number(rec.honorInfal || 0),
            potongan_terlambat: Number(rec.potonganKeterlambatan || 0),
            potongan_keterlambatan: Number(rec.potonganKeterlambatan || 0),
            potongan_tidak_masuk: Number(rec.potonganAlpha || 0),
            potongan_alpha: Number(rec.potonganAlpha || 0),
            potongan_diganti_jp: Number(rec.potonganInfal || 0),
            potongan_infal: Number(rec.potonganInfal || 0),
            potongan_pinjaman: Number(rec.potonganKasSekolah || 0),
            potongan_kas_sekolah: Number(rec.potonganKasSekolah || 0),
            potongan_izin: Number(rec.potonganIzin || 0),
            potongan_bpjs_kesehatan: Number(rec.potonganBpjsKesehatan || 0),
            potongan_bpjs_ketenagakerjaan: Number(rec.potonganBpjsKetenagakerjaan || 0),
            tunjangan_lainnya: Number(rec.tunjanganLainnya || 0),
            potongan_lainnya: Number(rec.potonganLainnya || 0),
            total_penerimaan: Number(rec.totalPenerimaan || 0),
            gaji_kotor: Number(rec.totalPenerimaan || 0),
            total_tambahan: Number(rec.totalPenerimaan || 0),
            total_potongan: Number(rec.totalPotongan || 0),
            gaji_bersih: Number(rec.gajiBersih || rec.takeHomePay || 0),
            take_home_pay: Number(rec.takeHomePay || rec.gajiBersih || 0),
            updated_at: new Date().toISOString(),
          };

          const { error } = await client
            .from('slip_gaji')
            .update(updatePayload)
            .eq('id', rec.id); // UUID asli

          if (!error) {
            successCount++;
            updatedList.push(rec);
            onUpdateRecord?.(rec);
            setDirtyRowIds(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            continue;
          }
        }

        const res = await updatePayrollMatrixAdjustmentRPC(rec, currentUser.nama);
        if (res.success) {
          successCount++;
          updatedList.push(rec);
          onUpdateRecord?.(rec);
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

    if (onBatchUpdateRecords && updatedList.length > 0) {
      onBatchUpdateRecords(updatedList);
    }

    setIsBatchSaving(false);

    if (failCount === 0) {
      showToast?.(`Sukses menyimpan seluruh ${successCount} data pegawai ke Supabase!`, 'success');
      onAuditLog?.(
        'gaji',
        'UPDATE',
        'Batch Update Matriks Penggajian',
        `${successCount} Pegawai`,
        `Penyimpanan serentak ${successCount} baris matriks penyesuaian gaji periode ${selectedBulan}/${selectedTahun}.`
      );
    } else {
      showToast?.(`Penyimpanan selesai: ${successCount} berhasil, ${failCount} gagal.`, failCount > 0 ? 'info' : 'success');
    }
  };

  // Export Matrix to CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'NIP',
      'Nama Pegawai',
      'Jabatan',
      'Status',
      'Gaji Pokok',
      'Tunjangan Jabatan',
      'Tunjangan Wali Kelas',
      'Tunjangan Ijazah',
      'Tunjangan Kinerja',
      'Tunjangan Kehadiran',
      'Honor JP Mengajar',
      'Honor Infal',
      'Tunjangan Lainnya',
      'Total Penerimaan (Kotor)',
      'Potongan Terlambat',
      'Potongan Alpha/Absen',
      'Potongan Izin',
      'Potongan Infal',
      'Potongan Kas Sekolah',
      'Potongan BPJS',
      'Potongan Lainnya',
      'Total Potongan',
      'Take Home Pay (Bersih)'
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `'${r.pegawaiNip}`,
      `"${r.pegawaiNama.replace(/"/g, '""')}"`,
      `"${r.pegawaiJabatan.replace(/"/g, '""')}"`,
      r.pegawaiStatus,
      r.gajiPokok,
      r.tunjanganJabatan,
      r.tunjanganWaliKelas,
      r.tunjanganIjazah,
      r.tunjanganKinerja,
      r.tunjanganKehadiran,
      r.honorJamMengajar,
      r.honorInfal,
      r.tunjanganLainnya,
      r.totalPenerimaan,
      r.potonganKeterlambatan,
      r.potonganAlpha,
      r.potonganIzin,
      r.potonganInfal,
      r.potonganKasSekolah,
      (r.potonganBpjsKesehatan || 0) + (r.potonganBpjsKetenagakerjaan || 0),
      r.potonganLainnya,
      r.totalPotongan,
      r.takeHomePay
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriks_Penggajian_SMKIT_IQM_${selectedBulan}_${selectedTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast?.('Matriks penggajian berhasil diekspor ke CSV!', 'success');
  };

  // Filtered records enriched with pegawaiList
  const filteredRecords = useMemo(() => {
    return matrixRecords
      .map(r => {
        const draft = draftRecords[r.id] || r;
        if (!pegawaiList || pegawaiList.length === 0) return draft;

        const matched = pegawaiList.find(p => 
          p.id === draft.pegawaiId || 
          (p.nip && draft.pegawaiNip && (p.nip === draft.pegawaiNip || p.niy === draft.pegawaiNip)) ||
          (p.nama && draft.pegawaiNama && p.nama.toLowerCase().trim() === draft.pegawaiNama.toLowerCase().trim())
        );

        if (!matched) return draft;

        let formattedJabatan = matched.jabatanUtama || '';
        if (matched.jabatanTambahan && matched.jabatanTambahan.length > 0) {
          const extra = matched.jabatanTambahan.filter(j => j && j !== 'Guru Pengampu Non Induk' && j !== 'Pembina Olahraga Non Induk');
          if (extra.length > 0) {
            formattedJabatan += ' / ' + extra.join(' / ');
          }
        }

        return {
          ...draft,
          pegawaiNama: matched.nama || draft.pegawaiNama,
          pegawaiJabatan: formattedJabatan || matched.jabatanUtama || draft.pegawaiJabatan,
          pegawaiStatus: matched.statusPegawai || draft.pegawaiStatus,
          pegawaiNip: matched.niy || matched.nip || draft.pegawaiNip,
        };
      })
      .filter(r => {
        const matchesSearch = 
          r.pegawaiNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.pegawaiNip.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.pegawaiJabatan.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || r.pegawaiStatus === statusFilter;

        const isGuru = r.pegawaiStatus === 'GTY' || r.pegawaiStatus === 'GTT' || r.pegawaiJabatan.toLowerCase().includes('guru');
        const matchesRole = 
          roleFilter === 'all' || 
          (roleFilter === 'guru' && isGuru) || 
          (roleFilter === 'tendik' && !isGuru);

        return matchesSearch && matchesStatus && matchesRole;
      });
  }, [matrixRecords, draftRecords, pegawaiList, searchQuery, statusFilter, roleFilter]);

  // Aggregate Calculations across filtered records
  const aggregates = useMemo(() => {
    return filteredRecords.reduce((acc, r) => {
      acc.gajiPokok += Number(r.gajiPokok || 0);
      acc.tunjanganJabatan += Number(r.tunjanganJabatan || 0);
      acc.tunjanganWaliKelas += Number(r.tunjanganWaliKelas || 0);
      acc.tunjanganIjazah += Number(r.tunjanganIjazah || 0);
      acc.tunjanganKinerja += Number(r.tunjanganKinerja || 0);
      acc.tunjanganKehadiran += Number(r.tunjanganKehadiran || 0);
      acc.honorJamMengajar += Number(r.honorJamMengajar || 0);
      acc.honorInfal += Number(r.honorInfal || 0);
      acc.tunjanganLainnya += Number(r.tunjanganLainnya || 0);
      acc.totalPenerimaan += Number(r.totalPenerimaan || 0);

      acc.potonganKeterlambatan += Number(r.potonganKeterlambatan || 0);
      acc.potonganAlpha += Number(r.potonganAlpha || 0);
      acc.potonganIzin += Number(r.potonganIzin || 0);
      acc.potonganInfal += Number(r.potonganInfal || 0);
      acc.potonganKasSekolah += Number(r.potonganKasSekolah || 0);
      acc.potonganBpjs += (Number(r.potonganBpjsKesehatan || 0) + Number(r.potonganBpjsKetenagakerjaan || 0));
      acc.potonganLainnya += Number(r.potonganLainnya || 0);
      acc.totalPotongan += Number(r.totalPotongan || 0);

      acc.takeHomePay += Number(r.takeHomePay || 0);
      return acc;
    }, {
      gajiPokok: 0,
      tunjanganJabatan: 0,
      tunjanganWaliKelas: 0,
      tunjanganIjazah: 0,
      tunjanganKinerja: 0,
      tunjanganKehadiran: 0,
      honorJamMengajar: 0,
      honorInfal: 0,
      tunjanganLainnya: 0,
      totalPenerimaan: 0,
      potonganKeterlambatan: 0,
      potonganAlpha: 0,
      potonganIzin: 0,
      potonganInfal: 0,
      potonganKasSekolah: 0,
      potonganBpjs: 0,
      potonganLainnya: 0,
      totalPotongan: 0,
      takeHomePay: 0,
    });
  }, [filteredRecords]);

  // SQL Stored Procedure Code snippet for Supabase
  const sqlRpcSnippet = `-- ============================================================================
-- SUPABASE RPC STORED PROCEDURE: update_payroll_matrix_adjustment
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard Anda.
-- ============================================================================
CREATE OR REPLACE FUNCTION update_payroll_matrix_adjustment(
  p_record_id TEXT,
  p_gaji_pokok NUMERIC DEFAULT NULL,
  p_tunjangan_jabatan NUMERIC DEFAULT NULL,
  p_tunjangan_wali_kelas NUMERIC DEFAULT NULL,
  p_tunjangan_ijazah NUMERIC DEFAULT NULL,
  p_tunjangan_kinerja NUMERIC DEFAULT NULL,
  p_tunjangan_kehadiran NUMERIC DEFAULT NULL,
  p_honor_jam_mengajar NUMERIC DEFAULT NULL,
  p_honor_infal NUMERIC DEFAULT NULL,
  p_tunjangan_lainnya NUMERIC DEFAULT NULL,
  p_potongan_keterlambatan NUMERIC DEFAULT NULL,
  p_potongan_alpha NUMERIC DEFAULT NULL,
  p_potongan_izin NUMERIC DEFAULT NULL,
  p_potongan_infal NUMERIC DEFAULT NULL,
  p_potongan_kas_sekolah NUMERIC DEFAULT NULL,
  p_potongan_bpjs_kesehatan NUMERIC DEFAULT NULL,
  p_potongan_bpjs_ketenagakerjaan NUMERIC DEFAULT NULL,
  p_potongan_lainnya NUMERIC DEFAULT NULL,
  p_total_penerimaan NUMERIC DEFAULT NULL,
  p_total_potongan NUMERIC DEFAULT NULL,
  p_gaji_bersih NUMERIC DEFAULT NULL,
  p_take_home_pay NUMERIC DEFAULT NULL,
  p_modified_by TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE slip_gaji
  SET
    gaji_pokok = COALESCE(p_gaji_pokok, gaji_pokok),
    tunjangan_jabatan = COALESCE(p_tunjangan_jabatan, tunjangan_jabatan),
    tunjangan_wali_kelas = COALESCE(p_tunjangan_wali_kelas, tunjangan_wali_kelas),
    tunjangan_ijazah = COALESCE(p_tunjangan_ijazah, tunjangan_ijazah),
    tunjangan_kinerja = COALESCE(p_tunjangan_kinerja, tunjangan_kinerja),
    tunjangan_kehadiran = COALESCE(p_tunjangan_kehadiran, tunjangan_kehadiran),
    honor_jam_mengajar = COALESCE(p_honor_jam_mengajar, honor_jam_mengajar),
    honor_infal = COALESCE(p_honor_infal, honor_infal),
    tunjangan_lainnya = COALESCE(p_tunjangan_lainnya, tunjangan_lainnya),
    potongan_keterlambatan = COALESCE(p_potongan_keterlambatan, potongan_keterlambatan),
    potongan_alpha = COALESCE(p_potongan_alpha, potongan_alpha),
    potongan_izin = COALESCE(p_potongan_izin, potongan_izin),
    potongan_infal = COALESCE(p_potongan_infal, potongan_infal),
    potongan_kas_sekolah = COALESCE(p_potongan_kas_sekolah, potongan_kas_sekolah),
    potongan_bpjs_kesehatan = COALESCE(p_potongan_bpjs_kesehatan, potongan_bpjs_kesehatan),
    potongan_bpjs_ketenagakerjaan = COALESCE(p_potongan_bpjs_ketenagakerjaan, potongan_bpjs_ketenagakerjaan),
    potongan_lainnya = COALESCE(p_potongan_lainnya, potongan_lainnya),
    total_penerimaan = COALESCE(p_total_penerimaan, total_penerimaan),
    gaji_kotor = COALESCE(p_total_penerimaan, gaji_kotor),
    total_tambahan = COALESCE(p_total_penerimaan, total_tambahan),
    total_potongan = COALESCE(p_total_potongan, total_potongan),
    gaji_bersih = COALESCE(p_gaji_bersih, p_take_home_pay, gaji_bersih),
    take_home_pay = COALESCE(p_take_home_pay, p_gaji_bersih, take_home_pay),
    updated_at = NOW()
  WHERE id = p_record_id;

  v_result := jsonb_build_object(
    'success', true,
    'record_id', p_record_id,
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
    showToast?.('Skrip RPC berhasil disalin ke clipboard!', 'info');
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm overflow-hidden transition-all duration-300">
      {/* Top Banner & Control Header - Soft Green Aesthetic */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
                <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Matriks Penyesuaian Penggajian Interaktif
                  <span className="text-xs font-normal text-emerald-200/90 bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                    Periode: {selectedBulan === 9 ? 'September' : selectedBulan} {selectedTahun}
                  </span>
                </h3>
                <p className="text-xs text-emerald-100/75 mt-0.5">
                  Tabel kalkulasi spreadsheet realtime dengan kolom Nama Pegawai & Take Home Pay sticky, otomatisasi baris & Supabase RPC.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1.5 bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Lihat kode stored procedure PostgreSQL untuk Supabase RPC"
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
                title="Tutup Matriks"
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
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-300" />
              <input
                type="text"
                placeholder="Cari nama, NIP, jabatan..."
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

            {/* Filter Role */}
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

          {/* Quick Realtime Totals Badge */}
          <div className="flex items-center gap-3 text-xs bg-emerald-950/60 px-3.5 py-1.5 rounded-lg border border-emerald-700/50">
            <div>
              <span className="text-emerald-300/80 text-[11px]">Total Kotor:</span>{' '}
              <strong className="text-emerald-100 font-mono">{formatRupiah(aggregates.totalPenerimaan)}</strong>
            </div>
            <span className="text-emerald-600">|</span>
            <div>
              <span className="text-emerald-300/80 text-[11px]">Total Potongan:</span>{' '}
              <strong className="text-rose-200 font-mono">{formatRupiah(aggregates.totalPotongan)}</strong>
            </div>
            <span className="text-emerald-600">|</span>
            <div>
              <span className="text-emerald-300 text-[11px] font-semibold">Total THP (Bersih):</span>{' '}
              <strong className="text-emerald-300 font-mono font-bold">{formatRupiah(aggregates.takeHomePay)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Matrix Spreadsheet Table */}
      <div className="overflow-x-auto relative max-h-[72vh] border-b border-emerald-100 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
        <table className="w-full text-left text-xs border-collapse">
          {/* Multi-Tier Table Header with Soft Green Tone */}
          <thead className="sticky top-0 z-30 shadow-xs select-none">
            {/* Super Header Categorization */}
            <tr className="bg-emerald-900 text-white uppercase text-[10px] tracking-wider border-b border-emerald-700">
              <th 
                colSpan={3} 
                className="sticky left-0 z-40 bg-emerald-950 py-2 px-3 border-r border-emerald-800 text-emerald-200 font-semibold text-center"
              >
                1. Data Identitas Pegawai
              </th>
              
              {!compactView ? (
                <th 
                  colSpan={9} 
                  className="py-2 px-3 bg-emerald-900 border-r border-emerald-800 text-emerald-100 font-semibold text-center"
                >
                  2. Komponen Penerimaan & Tunjangan (Penambahan)
                </th>
              ) : (
                <th 
                  colSpan={3} 
                  className="py-2 px-3 bg-emerald-900 border-r border-emerald-800 text-emerald-100 font-semibold text-center"
                >
                  2. Penerimaan Utama
                </th>
              )}

              <th 
                className="py-2 px-3 bg-emerald-800 text-emerald-100 font-bold text-center border-r border-emerald-700"
              >
                Total Bruto
              </th>

              {!compactView ? (
                <th 
                  colSpan={7} 
                  className="py-2 px-3 bg-slate-900 border-r border-slate-700 text-rose-200 font-semibold text-center"
                >
                  3. Komponen Pemotongan Kehadiran & Kas
                </th>
              ) : (
                <th 
                  colSpan={2} 
                  className="py-2 px-3 bg-slate-900 border-r border-slate-700 text-rose-200 font-semibold text-center"
                >
                  3. Potongan Utama
                </th>
              )}

              <th 
                className="py-2 px-3 bg-slate-800 text-rose-200 font-bold text-center border-r border-slate-700"
              >
                Total Pot.
              </th>

              <th 
                colSpan={2} 
                className="sticky right-0 z-40 bg-emerald-950 py-2 px-3 text-emerald-300 font-extrabold text-right border-l-2 border-emerald-500"
              >
                4. Gaji Bersih (Take Home Pay) & Aksi
              </th>
            </tr>

            {/* Sub Header Detailed Columns */}
            <tr className="bg-emerald-800 text-emerald-100 text-[11px] font-medium border-b border-emerald-600">
              {/* Sticky Columns Left */}
              <th className="sticky left-0 z-40 bg-emerald-900 py-2.5 px-2.5 text-center w-10 border-r border-emerald-700">
                No
              </th>
              <th className="sticky left-10 z-40 bg-emerald-900 py-2.5 px-3 min-w-[200px] border-r border-emerald-700 text-emerald-100">
                Nama Lengkap & NIP
              </th>
              <th className="py-2.5 px-3 min-w-[130px] border-r border-emerald-700">
                Jabatan
              </th>

              {/* Penerimaan Columns */}
              <th className="py-2.5 px-2 text-right min-w-[100px] border-r border-emerald-700 font-mono">
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
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono">
                    Tunj. Kinerja
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[90px] border-r border-emerald-700 font-mono">
                    Tunj. Hadir
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[95px] border-r border-emerald-700 font-mono">
                    Honor JP
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono">
                    Honor Infal
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[90px] border-r border-emerald-700 font-mono">
                    Tambahan Lain
                  </th>
                </>
              )}

              {/* Total Penerimaan */}
              <th className="py-2.5 px-3 text-right min-w-[110px] bg-emerald-700 text-white font-bold border-r border-emerald-600 font-mono">
                Penerimaan
              </th>

              {/* Potongan Columns */}
              <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                Pot. Terlambat
              </th>
              <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                Pot. Alpha
              </th>

              {!compactView && (
                <>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                    Pot. Izin
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                    Pot. Infal
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                    Kas Sekolah
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                    BPJS
                  </th>
                  <th className="py-2.5 px-2 text-right min-w-[85px] border-r border-emerald-700 font-mono text-rose-100">
                    Pot. Lainnya
                  </th>
                </>
              )}

              {/* Total Potongan */}
              <th className="py-2.5 px-3 text-right min-w-[100px] bg-slate-800 text-rose-200 font-bold border-r border-slate-700 font-mono">
                Total Pot.
              </th>

              {/* Sticky Columns Right: Take Home Pay */}
              <th className="sticky right-16 z-40 bg-emerald-900 py-2.5 px-3 text-right min-w-[125px] text-emerald-200 font-bold border-l-2 border-emerald-500 font-mono">
                Take Home Pay
              </th>
              <th className="sticky right-0 z-40 bg-emerald-900 py-2.5 px-2 text-center w-16 text-emerald-100">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-emerald-100/70 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={24} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-70" />
                  <p className="font-medium">Tidak ada data pegawai yang sesuai dengan filter.</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, index) => {
                const isDirty = dirtyRowIds.has(r.id);
                const isSaving = savingRowIds.has(r.id);

                return (
                  <tr 
                    key={r.id} 
                    className={`group transition-colors ${
                      isDirty 
                        ? 'bg-amber-50/50 hover:bg-amber-50/80' 
                        : 'hover:bg-emerald-50/40'
                    }`}
                  >
                    {/* Sticky Left: Index */}
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-emerald-50/70 py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-500 border-r border-emerald-100">
                      {index + 1}
                    </td>

                    {/* Sticky Left: Employee Name & NIP */}
                    <td className="sticky left-10 z-20 bg-white group-hover:bg-emerald-50/70 py-2 px-3 border-r border-emerald-100 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 border border-emerald-300/60">
                          {r.pegawaiNama.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate text-xs flex items-center gap-1.5">
                            <span title={r.pegawaiNama}>{r.pegawaiNama}</span>
                            {isDirty && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Ada perubahan belum disimpan" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            NIP: {r.pegawaiNip} · <span className="font-sans font-medium text-emerald-700">{r.pegawaiStatus}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan */}
                    <td className="py-2 px-3 text-slate-600 text-[11px] border-r border-emerald-100/80 max-w-[150px] truncate" title={r.pegawaiJabatan}>
                      {r.pegawaiJabatan}
                    </td>

                    {/* Penerimaan 1: Gaji Pokok (Editable) */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="10000"
                        value={r.gajiPokok || 0}
                        onChange={(e) => handleCellChange(r.id, 'gajiPokok', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Penerimaan 2: Tunj. Jabatan (Editable) */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="10000"
                        value={r.tunjanganJabatan || 0}
                        onChange={(e) => handleCellChange(r.id, 'tunjanganJabatan', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Penerimaan 3: Tunj. Wali Kelas (Editable) */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="10000"
                        value={r.tunjanganWaliKelas || 0}
                        onChange={(e) => handleCellChange(r.id, 'tunjanganWaliKelas', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </td>

                    {!compactView && (
                      <>
                        {/* Tunj. Ijazah */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="10000"
                            value={r.tunjanganIjazah || 0}
                            onChange={(e) => handleCellChange(r.id, 'tunjanganIjazah', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tunj. Kinerja */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="10000"
                            value={r.tunjanganKinerja || 0}
                            onChange={(e) => handleCellChange(r.id, 'tunjanganKinerja', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tunj. Kehadiran */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="10000"
                            value={r.tunjanganKehadiran || 0}
                            onChange={(e) => handleCellChange(r.id, 'tunjanganKehadiran', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Honor JP */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={r.honorJamMengajar || 0}
                            onChange={(e) => handleCellChange(r.id, 'honorJamMengajar', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Honor Infal */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={r.honorInfal || 0}
                            onChange={(e) => handleCellChange(r.id, 'honorInfal', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>

                        {/* Tambahan Lainnya */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="10000"
                            value={r.tunjanganLainnya || 0}
                            onChange={(e) => handleCellChange(r.id, 'tunjanganLainnya', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </td>
                      </>
                    )}

                    {/* Auto-Calculated Total Penerimaan (Bruto) */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/50 border-r border-emerald-100">
                      {formatRupiah(r.totalPenerimaan)}
                    </td>

                    {/* Potongan 1: Terlambat */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="1000"
                        value={r.potonganKeterlambatan || 0}
                        onChange={(e) => handleCellChange(r.id, 'potonganKeterlambatan', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                      />
                    </td>

                    {/* Potongan 2: Alpha */}
                    <td className="p-1 text-right border-r border-emerald-100/80">
                      <input
                        type="number"
                        step="1000"
                        value={r.potonganAlpha || 0}
                        onChange={(e) => handleCellChange(r.id, 'potonganAlpha', Number(e.target.value))}
                        className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                      />
                    </td>

                    {!compactView && (
                      <>
                        {/* Potongan Izin */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={r.potonganIzin || 0}
                            onChange={(e) => handleCellChange(r.id, 'potonganIzin', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                          />
                        </td>

                        {/* Potongan Infal */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={r.potonganInfal || 0}
                            onChange={(e) => handleCellChange(r.id, 'potonganInfal', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                          />
                        </td>

                        {/* Kas Sekolah */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="5000"
                            value={r.potonganKasSekolah || 0}
                            onChange={(e) => handleCellChange(r.id, 'potonganKasSekolah', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                          />
                        </td>

                        {/* BPJS */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="1000"
                            value={(r.potonganBpjsKesehatan || 0) + (r.potonganBpjsKetenagakerjaan || 0)}
                            onChange={(e) => handleCellChange(r.id, 'potonganBpjsKesehatan', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                          />
                        </td>

                        {/* Potongan Lainnya */}
                        <td className="p-1 text-right border-r border-emerald-100/80">
                          <input
                            type="number"
                            step="5000"
                            value={r.potonganLainnya || 0}
                            onChange={(e) => handleCellChange(r.id, 'potonganLainnya', Number(e.target.value))}
                            className="w-full text-right font-mono text-xs px-1.5 py-1 rounded border border-transparent hover:border-rose-200 focus:border-rose-400 focus:bg-white focus:outline-none transition-colors text-rose-800"
                          />
                        </td>
                      </>
                    )}

                    {/* Auto-Calculated Total Potongan */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-800 bg-rose-50/40 border-r border-emerald-100">
                      {formatRupiah(r.totalPotongan)}
                    </td>

                    {/* Sticky Right: Take Home Pay (Gaji Bersih) */}
                    <td className="sticky right-16 z-20 bg-emerald-50/90 group-hover:bg-emerald-100/90 py-2 px-3 text-right border-l-2 border-emerald-400 shadow-[-2px_0_4px_-1px_rgba(16,185,129,0.12)]">
                      <div className="font-mono font-extrabold text-xs text-emerald-950">
                        {formatRupiah(r.takeHomePay)}
                      </div>
                      <div className="text-[10px] text-emerald-700/80 flex items-center justify-end gap-1 font-sans">
                        <span>Slip:</span>
                        <span className="font-mono font-medium">{r.kodeSlip.slice(-7)}</span>
                      </div>
                    </td>

                    {/* Sticky Right: Action Column */}
                    <td className="sticky right-0 z-20 bg-white group-hover:bg-emerald-50/70 py-2 px-2 text-center border-l border-emerald-100">
                      <div className="flex items-center justify-center gap-1">
                        {isDirty ? (
                          <>
                            <button
                              onClick={() => handleSaveRow(r.id)}
                              disabled={isSaving}
                              title="Simpan perubahan baris ini ke Supabase"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleResetRow(r.id)}
                              title="Batalkan perubahan pada baris ini"
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {onInspectFormula && (
                              <button
                                onClick={() => onInspectFormula(r)}
                                title="Inspeksi Rumus Hitung"
                                className="p-1 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onViewSlip && (
                              <button
                                onClick={() => onViewSlip(r)}
                                title="Lihat Slip PDF"
                                className="p-1 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Footer: Grand Totals Across All Rows */}
          <tfoot className="sticky bottom-0 z-30 bg-emerald-900 text-white font-bold border-t-2 border-emerald-600 shadow-md">
            <tr className="text-[11px]">
              <td 
                colSpan={3} 
                className="sticky left-0 z-40 bg-emerald-950 py-3 px-3 text-emerald-200 uppercase tracking-wide border-r border-emerald-800 text-center font-bold"
              >
                TOTAL ANGGARAN ({filteredRecords.length} PEGAWAI)
              </td>

              {/* Total Penerimaan Columns */}
              <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                {formatRupiah(aggregates.gajiPokok)}
              </td>
              <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                {formatRupiah(aggregates.tunjanganJabatan)}
              </td>
              <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                {formatRupiah(aggregates.tunjanganWaliKelas)}
              </td>

              {!compactView && (
                <>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                    {formatRupiah(aggregates.tunjanganIjazah)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                    {formatRupiah(aggregates.tunjanganKinerja)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                    {formatRupiah(aggregates.tunjanganKehadiran)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                    {formatRupiah(aggregates.honorJamMengajar)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                    {formatRupiah(aggregates.honorInfal)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800">
                    {formatRupiah(aggregates.tunjanganLainnya)}
                  </td>
                </>
              )}

              {/* Total Kotor / Bruto */}
              <td className="py-3 px-3 text-right font-mono font-extrabold bg-emerald-800 text-white border-r border-emerald-700">
                {formatRupiah(aggregates.totalPenerimaan)}
              </td>

              {/* Total Potongan Columns */}
              <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                {formatRupiah(aggregates.potonganKeterlambatan)}
              </td>
              <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                {formatRupiah(aggregates.potonganAlpha)}
              </td>

              {!compactView && (
                <>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                    {formatRupiah(aggregates.potonganIzin)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                    {formatRupiah(aggregates.potonganInfal)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                    {formatRupiah(aggregates.potonganKasSekolah)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                    {formatRupiah(aggregates.potonganBpjs)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono border-r border-emerald-800 text-rose-200">
                    {formatRupiah(aggregates.potonganLainnya)}
                  </td>
                </>
              )}

              {/* Total Potongan */}
              <td className="py-3 px-3 text-right font-mono font-extrabold bg-slate-950 text-rose-300 border-r border-slate-800">
                {formatRupiah(aggregates.totalPotongan)}
              </td>

              {/* Sticky Right: Grand Total Take Home Pay */}
              <td className="sticky right-16 z-40 bg-emerald-950 py-3 px-3 text-right font-mono font-black text-sm text-emerald-300 border-l-2 border-emerald-400">
                {formatRupiah(aggregates.takeHomePay)}
              </td>
              <td className="sticky right-0 z-40 bg-emerald-950 py-3 px-2 text-center text-emerald-400">
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
            Setiap sel angka dapat langsung disunting (inline editable). Perubahan otomatis mengkalkulasi baris dan total anggaran seketika.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-[11px] text-slate-600">Draft diubah ({dirtyRowIds.size})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] text-slate-600">Tersinkronisasi</span>
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
                <h4 className="font-bold text-sm">Supabase PostgreSQL RPC Function</h4>
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
                Salin skrip SQL berikut dan jalankan di menu <strong>SQL Editor</strong> pada project Supabase Anda untuk mengaktifkan Remote Procedure Call (RPC) <code>update_payroll_matrix_adjustment</code>. Komponen ini juga dilengkapi fallback otomatis ke direct table update jika RPC belum dibuat.
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
    </div>
  );
};
