import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  AuditLogEntry, 
  SystemBackupData,
  StatusPenggajian 
} from '../types';
import { 
  INITIAL_PEGAWAI, 
  INITIAL_PRESENSI, 
  INITIAL_DAILY_LOGS, 
  INITIAL_INFAL, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_OVERTIME_RECORDS, 
  INITIAL_EMAIL_LOGS, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';
import { INITIAL_SCHEDULE_SLOTS } from '../data/scheduleData';
import { PAYROLL_JULI_2026, PRESENSI_JULI_2026 } from '../data/july2026PayrollData';

import { 
  SupabasePegawaiRow,
  SupabaseSlipGajiRow,
  SupabasePresensiHarianRow,
  SupabaseGuruInvalRow,
  SupabaseRekapPresensiRow,
  SupabasePeriodePenggajianRow,
  SupabaseDatabaseSchema,
  safeNumber,
  safeString,
  safeBoolean,
  safeArray
} from '../types/supabase';


import { supabase, getSupabaseClientInstance, getSafeSupabaseCredentials } from '../supabaseClient';


// Storage keys for runtime configuration
const LS_SUPABASE_URL_KEY = 'sim_gaji_supabase_url';
const LS_SUPABASE_ANON_KEY = 'sim_gaji_supabase_anon_key';

/**
 * Validates Supabase environment variables (import.meta.env.VITE_SUPABASE_URL & import.meta.env.VITE_SUPABASE_ANON_KEY).
 * Throws a clear, descriptive Error if either variable is missing, malformed, or using default placeholder values,
 * preventing the application from attempting to connect to an undefined or broken Supabase instance.
 */
export function validateSupabaseEnv(): { url: string; anonKey: string } {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '') || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '') || '';
  
  const localUrl = typeof window !== 'undefined' && window.localStorage ? (window.localStorage.getItem(LS_SUPABASE_URL_KEY) || '').trim() : '';
  const localKey = typeof window !== 'undefined' && window.localStorage ? (window.localStorage.getItem(LS_SUPABASE_ANON_KEY) || '').trim() : '';

  const activeUrl = (localUrl || envUrl).trim();
  const activeKey = (localKey || envKey).trim();

  const missing: string[] = [];

  if (!activeUrl) {
    missing.push('import.meta.env.VITE_SUPABASE_URL');
  } else if (activeUrl.includes('your-project-id.supabase.co') || activeUrl.includes('placeholder.supabase.co')) {
    throw new Error(
      `[Supabase Initialization Error] VITE_SUPABASE_URL masih menggunakan nilai placeholder: "${activeUrl}". ` +
      `Harap ganti dengan URL project Supabase Anda yang sebenarnya pada berkas .env atau pengaturan Hostinger.`
    );
  } else if (!activeUrl.startsWith('http://') && !activeUrl.startsWith('https://')) {
    throw new Error(
      `[Supabase Initialization Error] Format VITE_SUPABASE_URL tidak valid: "${activeUrl}". ` +
      `URL harus diawali dengan http:// atau https:// (contoh: https://xyzcompany.supabase.co).`
    );
  }

  if (!activeKey) {
    missing.push('import.meta.env.VITE_SUPABASE_ANON_KEY');
  } else if (activeKey.includes('your-anon-public-key') || activeKey.includes('placeholder-anon-key')) {
    throw new Error(
      `[Supabase Initialization Error] VITE_SUPABASE_ANON_KEY masih menggunakan nilai placeholder. ` +
      `Harap isi dengan Public Anon Key Supabase asli dari Project Settings > API pada Supabase Dashboard.`
    );
  } else if (activeKey.length < 20) {
    throw new Error(
      `[Supabase Initialization Error] VITE_SUPABASE_ANON_KEY tidak valid (${activeKey.length} karakter). ` +
      `Kunci publik Supabase anon JWT yang valid harus memiliki panjang minimal 20 karakter.`
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `[Supabase Initialization Error] Variabel lingkungan wajib belum diatur: ${missing.join(', ')}. ` +
      `Pastikan variabel tersebut telah didefinisikan pada berkas .env atau Hostinger Environment Settings (lihat panduan .env.example).`
    );
  }

  return { url: activeUrl, anonKey: activeKey };
}

/**
 * Non-throwing environment check utility for graceful UI fallbacks & build monitoring
 */
export function checkSupabaseEnvStatus(): {
  isValid: boolean;
  error: string | null;
  url: string;
  anonKey: string;
} {
  try {
    const creds = validateSupabaseEnv();
    return {
      isValid: true,
      error: null,
      url: creds.url,
      anonKey: creds.anonKey,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err?.message || 'Konfigurasi Supabase tidak valid.',
      url: '',
      anonKey: '',
    };
  }
}


/**
 * Retrieve active Supabase credentials (from environment import.meta.env or localStorage)
 */
export function getSupabaseCredentials(): { url: string; anonKey: string } {

  const safe = getSafeSupabaseCredentials();
  return {
    url: safe.url,
    anonKey: safe.anonKey,
  };
}

/**
 * Check if Supabase client has valid, non-placeholder credentials
 */
export function isSupabaseConfigured(): boolean {
  return getSafeSupabaseCredentials().isConfigured;
}

/**
 * Save custom Supabase credentials to localStorage
 */
export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(LS_SUPABASE_URL_KEY, url.trim());
    else localStorage.removeItem(LS_SUPABASE_URL_KEY);

    if (anonKey) localStorage.setItem(LS_SUPABASE_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(LS_SUPABASE_ANON_KEY);
  }
}

/**
 * Get or create the Supabase client singleton dynamically
 */
export function getSupabase(): SupabaseClient<SupabaseDatabaseSchema> {
  return getSupabaseClientInstance();
}




/**
 * Test connectivity with Supabase backend
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase (URL & Anon Key) belum diatur.',
    };
  }

  try {
    const { data, error } = await client.from('pegawai').select('id', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Tabel belum dibuat, silakan jalankan DDL Migrasi di Supabase SQL Editor.',
          tableCount: 0,
        };
      }
      return {
        success: false,
        message: `Koneksi Supabase gagal: ${error.message} (${error.code || 'Error'})`,
      };
    }
    return {
      success: true,
      message: 'Koneksi ke database Supabase berhasil aktif & responsif!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung: ${err?.message || 'Network error'}`,
    };
  }
}

// ============================================================================
// 1. DATA FETCHING (Asynchronous Supabase Query Functions)
// ============================================================================

export interface PeriodePenggajianRow {
  id: string;
  bulan: number;
  tahun: number;
  periode_label: string;
  tanggal_cutoff_mulai: string;
  tanggal_cutoff_selesai: string;
  tanggal_mulai_bayar: string;
  is_active: boolean;
  status_global?: string;
  created_at?: string;
}

/**
 * Ambil daftar periode aktif dari tabel `periode_penggajian`
 * Mengambil periode terbaru berdasarkan created_at tanpa memfilter kolom 'bulan'/'tahun'
 */
export async function fetchActivePeriodsSupabase(): Promise<{ bulan: number; tahun: number; count: number; status?: string; namaPeriode?: string }[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('periode_penggajian')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [Supabase] Error query periode_penggajian:', error.message);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }

    const rowList = data as SupabasePeriodePenggajianRow[];
    console.log('📅 [Supabase] Periode aktif terambil:', rowList[0]);

    return rowList.map((p) => {
      const label = safeString(p.nama_periode || p.periode_label || '');
      let b = safeNumber(p.bulan, 0);
      let t = safeNumber(p.tahun, 0);

      if (!b || !t) {
        const monthMap: Record<string, number> = {
          januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
          juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
        };
        const monthMatch = label.toLowerCase().match(/januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember/);
        const yearMatch = label.match(/20\d\d/);
        if (monthMatch) {
          b = monthMap[monthMatch[0]] || (new Date().getMonth() + 1);
        }
        if (yearMatch) {
          t = parseInt(yearMatch[0], 10);
        }
      }

      return {
        bulan: b || (new Date().getMonth() + 1),
        tahun: t || (new Date().getFullYear()),
        count: 0,
        status: safeString(p.status_global || p.status || (safeBoolean(p.is_active) ? 'active' : 'closed')),
        namaPeriode: label || `${b}-${t}`,
      };
    });
  } catch (err) {
    console.warn('Error fetching periode_penggajian from Supabase:', err);
    return [];
  }
}

/**
 * Ambil data daftar staf dari tabel `pegawai`
 * Diurutkan berdasarkan kolom 'nama_lengkap'
 */
export async function fetchStaffListSupabase(): Promise<Pegawai[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('pegawai')
      .select('*')
      .order('nama_lengkap', { ascending: true });

    if (error) {
      console.error('❌ [Supabase] Error query pegawai:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const rowList = data as SupabasePegawaiRow[];
    console.log(`👥 [Supabase] Berhasil memuat ${rowList.length} data pegawai.`);

    // Map database snake_case columns to TypeScript camelCase Pegawai with strict safety
    return rowList.map((row): Pegawai => ({
      id: safeString(row.id),
      nip: safeString(row.nip),
      nama: safeString(row.nama_lengkap || row.nama),
      email: safeString(row.email),
      noHp: safeString(row.no_hp),
      statusPegawai: (safeString(row.status_pegawai || row.jenis_pegawai || 'GTT') as any),
      jabatanUtama: safeString(row.jabatan_utama || row.jabatan),
      jabatanTambahan: safeArray<string>(row.jabatan_tambahan),
      pendidikanTerakhir: safeString(row.pendidikan_terakhir || 'S1'),
      tanggalMasuk: safeString(row.tanggal_masuk || '2023-07-15'),
      namaBank: safeString(row.nama_bank || 'Bank Syariah Indonesia (BSI)'),
      nomorRekening: safeString(row.nomor_rekening || '7108920192'),
      atasNamaRekening: safeString(row.atas_nama_rekening || row.nama_lengkap || row.nama),
      npwp: safeString(row.npwp),
      niy: safeString(row.niy),
      nik: safeString(row.nik),
      nuptk: safeString(row.nuptk),
      jenisKelamin: (safeString(row.jenis_kelamin) as any),
      tempatLahir: safeString(row.tempat_lahir),
      tanggalLahir: safeString(row.tanggal_lahir),
      usia: safeString(row.usia),
      jurusan: safeString(row.jurusan),
      tmt: safeString(row.tmt),
      masaKerja: safeString(row.masa_kerja),
      statusInduk: (safeString(row.status_induk || 'Induk') as any),
      keteranganInduk: safeString(row.keterangan_induk),
      gajiPokokDefault: safeNumber(row.gaji_pokok_default || row.gaji_pokok_nominal, 0),
      tunjanganJabatanDefault: safeNumber(row.tunjangan_jabatan_default, 0),
      tunjanganKepsekDefault: safeNumber(row.tunjangan_kepsek_default, 0),
      tunjanganWakasekDefault: safeNumber(row.tunjangan_wakasek_default, 0),
      tunjanganItOfficerDefault: safeNumber(row.tunjangan_it_officer_default, 0),
      tunjanganDkmDefault: safeNumber(row.tunjangan_dkm_default, 0),
      tunjanganAsramaDefault: safeNumber(row.tunjangan_asrama_default, 0),
      tunjanganBendaharaDefault: safeNumber(row.tunjangan_bendahara_default, 0),
      tunjanganPjDefault: safeNumber(row.tunjangan_pj_default, 0),
      tunjanganIjazahJenjang: (safeString(row.tunjangan_ijazah_jenjang) as any) || undefined,
      tunjanganIjazahDefault: safeNumber(row.tunjangan_ijazah_default, 0),
      isLinierKompetensi: safeBoolean(row.is_linier_kompetensi, false),

      tahunPengalaman: safeNumber(row.tahun_pengalaman, 0),
      tahunMasaKerja: safeNumber(row.tahun_masa_kerja, 0),
      tunjanganKinerjaDefault: safeNumber(row.tunjangan_kinerja_default, 0),
      tarifPerJamMengajar: safeNumber(row.tarif_per_jam_mengajar, 18000),
      tarifTransportHarian: safeNumber(row.tarif_transport_harian, 20000),
      tarifLemburPerJam: safeNumber(row.tarif_lembur_per_jam, 20000),
      tunjanganKeluarga: safeNumber(row.tunjangan_keluarga, 0),
      tunjanganWaliKelas: safeNumber(row.tunjangan_wali_kelas, 0),
      tunjanganKhususVokasi: safeNumber(row.tunjangan_khusus_vokasi, 0),
      potonganBpjsKesehatan: safeNumber(row.potongan_bpjs_kesehatan, 0),
      potonganBpjsKetenagakerjaan: safeNumber(row.potongan_bpjs_ketenagakerjaan, 0),
      potonganKasSekolah: safeNumber(row.potongan_kas_sekolah, 0),
      isActive: row.is_active !== undefined ? safeBoolean(row.is_active, true) : true,
    }));
  } catch (err) {
    console.warn('Error fetching pegawai from Supabase:', err);
    return null;
  }
}

/**
 * Ambil data rekap gaji dan staf dari tabel `slip_gaji` yang berelasi dengan tabel `pegawai` (atau fallback query)
 */
export async function fetchPayrollRecordsSupabase(namaPeriode?: string): Promise<PenggajianRecord[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    // 1. Coba query relasional dengan foreign key pegawai (nama_lengkap)
    let query = client
      .from('slip_gaji')
      .select(`
        *,
        pegawai (
          id,
          nip,
          niy,
          nama_lengkap,
          nama,
          jabatan,
          jabatan_utama,
          jenis_pegawai,
          status_pegawai,
          status_induk,
          gaji_pokok_nominal,
          gaji_pokok_default
        )
      `);


    if (namaPeriode) {
      query = query.eq('nama_periode', namaPeriode);
    }

    const { data: relationalData, error: relError } = await query;

    let rawData: SupabaseSlipGajiRow[] | null = (relationalData as SupabaseSlipGajiRow[]) || null;
    let listPegawaiFallback: SupabasePegawaiRow[] = [];

    // 2. Jika query relasional error atau kosong, fallback query terpisah
    if (relError || !relationalData || relationalData.length === 0) {
      if (relError) {
        console.warn('⚠️ [Supabase] Query relasi foreign key:', relError.message, '-> Mencoba flat query.');
      }

      // Query tabel pegawai fallback
      const pegRes = await client.from('pegawai').select('*').order('nama_lengkap', { ascending: true });
      listPegawaiFallback = (pegRes.data as SupabasePegawaiRow[]) || [];

      // Query flat slip_gaji
      let flatQuery = client.from('slip_gaji').select('*');
      if (namaPeriode) {
        flatQuery = flatQuery.eq('nama_periode', namaPeriode);
      }
      const flatRes = await flatQuery;
      rawData = (flatRes.data as SupabaseSlipGajiRow[]) || null;
    }

    if (!rawData || rawData.length === 0) {
      return null;
    }

    console.log(`📑 [Supabase] Berhasil memetakan ${rawData.length} rekaman slip gaji.`);

    return rawData.map((row: SupabaseSlipGajiRow): PenggajianRecord => {
      const rawPeg = row.pegawai;
      const joinedPeg: Partial<SupabasePegawaiRow> | null = Array.isArray(rawPeg) ? rawPeg[0] : rawPeg;
      const fallbackPeg = listPegawaiFallback.find((p) => p.id === row.pegawai_id);
      const peg: Partial<SupabasePegawaiRow> = (joinedPeg && typeof joinedPeg === 'object' ? joinedPeg : fallbackPeg) || {};

      const statusApproval: StatusPenggajian = (safeString(row.status_approval || row.status || 'draft') as StatusPenggajian);

      const jamMengajarRealisasi = safeNumber(row.realisasi_jp || row.jam_mengajar_realisasi, 0);
      const totalPenerimaan = safeNumber(row.gaji_kotor || row.total_penerimaan, 0);
      const totalPotongan = safeNumber(row.total_potongan, 0);
      const gajiBersih = safeNumber(row.gaji_bersih, Math.max(0, totalPenerimaan - totalPotongan));

      const rowYear = safeNumber(row.tahun, new Date().getFullYear());
      const rowMonth = safeNumber(row.bulan, new Date().getMonth() + 1);

      return {
        id: safeString(row.id),
        kodeSlip: safeString(row.kode_slip || `SLIP/${rowYear}/${String(rowMonth).padStart(2, '0')}/${row.id.slice(0, 6)}`),
        pegawaiId: safeString(row.pegawai_id || peg.id || ''),
        pegawaiNama: safeString(peg.nama_lengkap || peg.nama || row.pegawai_nama || ''),
        pegawaiNip: safeString(peg.nip || row.pegawai_nip || ''),
        pegawaiJabatan: safeString(peg.jabatan || peg.jabatan_utama || row.pegawai_jabatan || ''),
        pegawaiStatus: (safeString(peg.jenis_pegawai || peg.status_pegawai || row.pegawai_status || 'GTT') as any),
        pegawaiEmail: safeString(peg.email || row.pegawai_email || ''),
        bulan: rowMonth,
        tahun: rowYear,
        periodeLabel: safeString(row.periode_label || row.nama_periode || `${rowMonth}-${rowYear}`),

        tanggalCutoffMulai: safeString(row.tanggal_cutoff_mulai),
        tanggalCutoffSelesai: safeString(row.tanggal_cutoff_selesai),
        tanggalMulaiBayar: safeString(row.tanggal_mulai_bayar),
        periodeCutoffLabel: safeString(row.periode_cutoff_label),

        statusInduk: (safeString(peg.status_induk || row.status_induk) as any),
        keteranganInduk: safeString(peg.keterangan_induk || row.keterangan_induk),

        presensiHadir: safeNumber(row.presensi_hadir, 0),
        presensiAlpha: safeNumber(row.presensi_alpha, 0),
        presensiIzin: safeNumber(row.presensi_izin, 0),
        presensiSakit: safeNumber(row.presensi_sakit, 0),
        presensiCuti: safeNumber(row.presensi_cuti, 0),
        presensiDinasLuar: safeNumber(row.presensi_dinas_luar, 0),
        presensiTerlambatMenit: safeNumber(row.presensi_terlambat_menit, 0),
        jamMengajarRealisasi,
        jamLembur: safeNumber(row.jam_lembur, 0),

        gajiPokok: safeNumber(row.gaji_pokok || peg.gaji_pokok_nominal || peg.gaji_pokok_default, 0),
        tunjanganJabatan: safeNumber(row.tunjangan_jabatan, 0),
        tunjanganKepsek: safeNumber(row.tunjangan_kepsek, 0),
        tunjanganWakasek: safeNumber(row.tunjangan_wakasek, 0),
        tunjanganWaliKelas: safeNumber(row.tunjangan_wali_kelas, 0),
        tunjanganItOfficer: safeNumber(row.tunjangan_it_officer, 0),
        tunjanganDkm: safeNumber(row.tunjangan_dkm, 0),
        tunjanganAsrama: safeNumber(row.tunjangan_asrama, 0),
        tunjanganBendahara: safeNumber(row.tunjangan_bendahara, 0),
        tunjanganPj: safeNumber(row.tunjangan_pj, 0),
        tunjanganIjazahJenjang: safeString(row.tunjangan_ijazah_jenjang),
        tunjanganIjazah: safeNumber(row.tunjangan_ijazah, 0),
        isLinierKompetensi: safeBoolean(row.is_linier_kompetensi, false),
        tunjanganKompetensi: safeNumber(row.tunjangan_kompetensi, 0),
        tahunPengalaman: safeNumber(row.tahun_pengalaman, 0),
        tunjanganPengalaman: safeNumber(row.tunjangan_pengalaman, 0),
        tahunMasaKerja: safeNumber(row.tahun_masa_kerja, 0),
        tunjanganMasaKerja: safeNumber(row.tunjangan_masa_kerja, 0),
        tunjanganKinerja: safeNumber(row.tunjangan_kinerja, 0),
        tunjanganKehadiran: safeNumber(row.tunjangan_kehadiran, 0),
        tunjanganKehadiranTransport: safeNumber(row.tunjangan_kehadiran_transport || row.tunjangan_kehadiran, 0),
        honorJamMengajar: safeNumber(row.honor_jam_mengajar, 0),
        honorLembur: safeNumber(row.honor_lembur, 0),
        honorInfal: safeNumber(row.honor_infal, 0),
        jpMenggantikan: safeNumber(row.jp_menggantikan, 0),
        insentifKajianMuslimah: safeNumber(row.insentif_kajian_muslimah, 0),
        koreksiPenerimaan: safeNumber(row.koreksi_penerimaan, 0),
        tunjanganVokasiIT: safeNumber(row.tunjangan_vokasi_it, 0),
        tunjanganLainnya: safeNumber(row.tunjangan_lainnya, 0),
        totalPenerimaan,

        potonganKeterlambatan: safeNumber(row.potongan_keterlambatan, 0),
        potonganTidakMasuk: safeNumber(row.potongan_tidak_masuk, 0),
        potonganAlpha: safeNumber(row.potongan_alpha, 0),
        potonganIzin: safeNumber(row.potongan_izin, 0),
        potonganInfal: safeNumber(row.potongan_infal, 0),
        jpDigantikan: safeNumber(row.jp_digantikan, 0),
        koreksiPotongan: safeNumber(row.koreksi_potongan, 0),
        potonganPinjaman: safeNumber(row.potongan_pinjaman, 0),
        potonganBpjsKesehatan: safeNumber(row.potongan_bpjs_kesehatan, 0),
        potonganBpjsKetenagakerjaan: safeNumber(row.potongan_bpjs_ketenagakerjaan, 0),
        potonganKasSekolah: safeNumber(row.potongan_kas_sekolah, 0),
        potonganKoperasi: safeNumber(row.potongan_koperasi, 0),
        potonganLainnya: safeNumber(row.potongan_lainnya, 0),
        totalPotongan,

        gajiBersih,
        status: statusApproval,

        approvedKepsekBy: safeString(row.approved_kepsek_by),
        approvedKepsekAt: safeString(row.approved_kepsek_at),
        catatanKepsek: safeString(row.catatan_kepsek),

        approvedYayasanBy: safeString(row.approved_yayasan_by),
        approvedYayasanAt: safeString(row.approved_yayasan_at),
        catatanYayasan: safeString(row.catatan_yayasan),

        rejectedBy: safeString(row.rejected_by),
        rejectedAt: safeString(row.rejected_at),
        catatanPenolakan: safeString(row.catatan_penolakan),

        transferredBy: safeString(row.transferred_by),
        transferredAt: safeString(row.transferred_at),
        nomorReferensiTransfer: safeString(row.nomor_referensi_transfer),
        buktiTransferUrl: safeString(row.bukti_transfer_url),

        emailSent: safeBoolean(row.email_sent, false),
        emailSentAt: safeString(row.email_sent_at),
        emailRecipient: safeString(row.email_recipient),

        isEncrypted: row.is_encrypted !== undefined ? safeBoolean(row.is_encrypted, true) : true,
        securityChecksum: safeString(row.security_checksum || 'sha256-verified-iqm-system'),
        qrVerificationUrl: safeString(row.qr_verification_url || 'https://iqm.sch.id/verify'),

        createdAt: safeString(row.created_at || new Date().toISOString()),
        updatedAt: safeString(row.updated_at || new Date().toISOString()),
      };
    });
  } catch (err) {
    console.warn('Error fetching slip_gaji from Supabase:', err);
    return null;
  }
}



/**
 * Ambil status monitoring presensi harian dari tabel `presensi_harian_jp`
 */
export async function fetchDailyAttendanceSupabase(): Promise<LogPresensiHarian[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('presensi_harian_jp')
      .select('*')
      .order('tanggal', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const rowList = data as SupabasePresensiHarianRow[];

    return rowList.map((row): LogPresensiHarian => ({
      id: safeString(row.id),
      pegawaiId: safeString(row.pegawai_id),
      tanggal: safeString(row.tanggal),
      jamMasuk: safeString(row.jam_masuk || '07:15:00'),
      jamKeluar: safeString(row.jam_keluar),
      status: (safeString(row.status || 'hadir_tepat_waktu') as any),
      menitTerlambat: safeNumber(row.menit_terlambat, 0),
      menitPulangCepat: safeNumber(row.menit_pulang_cepat, 0),
      jamLembur: safeNumber(row.jam_lembur, 0),
      jamMengajarHariIni: safeNumber(row.jam_mengajar_hari_ini, 0),
      metode: (safeString(row.metode || 'biometric_fingerprint') as any),
      lokasiTerminal: safeString(row.lokasi_terminal || 'Terminal RFID / Biometrik'),
      keterangan: safeString(row.keterangan),
      fotoBuktiUrl: safeString(row.foto_bukti_url),
      isVerified: row.is_verified !== undefined ? safeBoolean(row.is_verified, true) : true,
    }));
  } catch (err) {
    console.warn('Error fetching presensi_harian_jp from Supabase:', err);
    return null;
  }
}

/**
 * Ambil data inval dari tabel `guru_inval`
 */
export async function fetchGuruInvalSupabase(): Promise<LogInfal[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('guru_inval')
      .select('*')
      .order('tanggal', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const rowList = data as SupabaseGuruInvalRow[];

    return rowList.map((row): LogInfal => ({
      id: safeString(row.id),
      tanggal: safeString(row.tanggal),
      guruDigantikanId: safeString(row.guru_digantikan_id || row.guru_absen_id),
      guruDigantikanNama: safeString(row.guru_digantikan_nama || row.guru_absen_nama),
      guruAbsenId: safeString(row.guru_digantikan_id || row.guru_absen_id),
      guruAbsenNama: safeString(row.guru_digantikan_nama || row.guru_absen_nama),
      guruPenggantiId: safeString(row.guru_pengganti_id),
      guruPenggantiNama: safeString(row.guru_pengganti_nama),
      kelas: safeString(row.kelas),
      mataPelajaran: safeString(row.mata_pelajaran),
      jamKe: safeString(row.jam_ke),
      jumlahJp: safeNumber(row.jumlah_jp, 0),
      tarifPerJp: safeNumber(row.tarif_per_jp, 7500),
      totalNominal: safeNumber(row.total_nominal, 0),
      alasan: safeString(row.alasan),
      alasanAbsen: safeString(row.alasan),
      status: (safeString(row.status || 'approved') as any),
      approvedBy: safeString(row.approved_by),
      approvedAt: safeString(row.approved_at),
      catatan: safeString(row.catatan),
      createdAt: safeString(row.created_at || new Date().toISOString()),
    }));
  } catch (err) {
    console.warn('Error fetching guru_inval from Supabase:', err);
    return null;
  }
}


// ============================================================================
// 2. MUTASI DATA & APPROVAL (Live CRUD to Supabase Tables)
// ============================================================================

/**
 * Upsert data guru & staf ke tabel `pegawai` Supabase
 */
export async function upsertPegawaiSupabase(pegawai: Partial<Pegawai> | any): Promise<{ success: boolean; error?: string; data?: any }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase client belum terhubung' };

  const dataForm: Record<string, any> = {
    id: pegawai.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `peg_${Date.now()}`),
    nip: pegawai.nip || '',
    niy: pegawai.niy || '',
    nik: pegawai.nik || '',
    nuptk: pegawai.nuptk || '',
    nama_lengkap: pegawai.nama || pegawai.nama_lengkap || '',
    nama: pegawai.nama || pegawai.nama_lengkap || '',
    email: pegawai.email || '',
    no_hp: pegawai.noHp || pegawai.no_hp || '',
    jabatan: pegawai.jabatanUtama || pegawai.jabatan || '',
    jabatan_utama: pegawai.jabatanUtama || pegawai.jabatan || '',
    jabatan_tambahan: Array.isArray(pegawai.jabatanTambahan) ? JSON.stringify(pegawai.jabatanTambahan) : (pegawai.jabatanTambahan || '[]'),
    jenis_pegawai: pegawai.statusPegawai || pegawai.jenis_pegawai || 'GTT',
    status_pegawai: pegawai.statusPegawai || pegawai.jenis_pegawai || 'GTT',
    status_induk: pegawai.statusInduk || 'Induk',
    keterangan_induk: pegawai.keteranganInduk || '',
    pendidikan_terakhir: pegawai.pendidikanTerakhir || 'S1',
    tanggal_masuk: pegawai.tanggalMasuk || new Date().toISOString().split('T')[0],
    nama_bank: pegawai.namaBank || 'Bank Syariah Indonesia (BSI)',
    nomor_rekening: pegawai.nomorRekening || '',
    atas_nama_rekening: pegawai.atasNamaRekening || pegawai.nama || pegawai.nama_lengkap || '',
    npwp: pegawai.npwp || '',
    jenis_kelamin: pegawai.jenisKelamin || 'Laki-laki',
    tempat_lahir: pegawai.tempatLahir || '',
    tanggal_lahir: pegawai.tanggalLahir || '',
    usia: Number(pegawai.usia || 0),
    jurusan: pegawai.jurusan || '',
    tmt: pegawai.tmt || '',
    masa_kerja: pegawai.masaKerja || '',
    gaji_pokok_nominal: Number(pegawai.gajiPokokDefault || pegawai.gaji_pokok_nominal || pegawai.gajiPokok || 0),
    gaji_pokok_default: Number(pegawai.gajiPokokDefault || pegawai.gaji_pokok_nominal || pegawai.gajiPokok || 0),
    tunjangan_jabatan_default: Number(pegawai.tunjanganJabatanDefault || 0),
    tunjangan_kepsek_default: Number(pegawai.tunjanganKepsekDefault || 0),
    tunjanganWakasekDefault: Number(pegawai.tunjanganWakasekDefault || 0),
    tunjangan_wali_kelas: Number(pegawai.tunjanganWaliKelas || 0),
    tunjangan_it_officer_default: Number(pegawai.tunjanganItOfficerDefault || 0),
    tunjangan_dkm_default: Number(pegawai.tunjanganDkmDefault || 0),
    tunjangan_asrama_default: Number(pegawai.tunjanganAsramaDefault || 0),
    tunjangan_bendahara_default: Number(pegawai.tunjanganBendaharaDefault || 0),
    tunjangan_pj_default: Number(pegawai.tunjanganPjDefault || 0),
    tunjangan_ijazah_jenjang: pegawai.tunjanganIjazahJenjang || 'S1',
    tunjangan_ijazah_default: Number(pegawai.tunjanganIjazahDefault || 0),
    is_linier_kompetensi: Boolean(pegawai.isLinierKompetensi),
    tahun_pengalaman: Number(pegawai.tahunPengalaman || 0),
    tahun_masa_kerja: Number(pegawai.tahunMasaKerja || 0),
    tunjangan_kinerja_default: Number(pegawai.tunjanganKinerjaDefault || 0),
    tarif_per_jam_mengajar: Number(pegawai.tarifPerJamMengajar || 18000),
    tarif_transport_harian: Number(pegawai.tarifTransportHarian || 20000),
    tarif_lembur_per_jam: Number(pegawai.tarifLemburPerJam || 20000),
    tunjangan_keluarga: Number(pegawai.tunjanganKeluarga || 0),
    tunjangan_khusus_vokasi: Number(pegawai.tunjanganKhususVokasi || 0),
    potongan_bpjs_kesehatan: Number(pegawai.potonganBpjsKesehatan || 0),
    potongan_bpjs_ketenagakerjaan: Number(pegawai.potonganBpjsKetenagakerjaan || 0),
    potongan_kas_sekolah: Number(pegawai.potonganKasSekolah || 0),
    is_active: pegawai.isActive !== false,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await client
      .from('pegawai')
      .upsert([dataForm], { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ [Supabase] Error upsert pegawai:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase] Berhasil upsert pegawai:', dataForm.nama_lengkap);
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ [Supabase] Exception saat upsert pegawai:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan ke Supabase' };
  }
}

/**
 * Hapus data pegawai dari Supabase
 */
export async function deletePegawaiSupabase(pegawaiId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('pegawai').delete().eq('id', pegawaiId);
    if (error) {
      console.error('❌ [Supabase] Gagal menghapus pegawai:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ [Supabase] Exception delete pegawai:', err);
    return false;
  }
}

/**
 * Bulk update gaji pokok pegawai secara massal / personal langsung ke tabel `pegawai` Supabase
 */
export async function bulkUpdateGajiPokokSupabase(
  updates: { id: string; gajiPokok: number; nama?: string }[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, count: 0, error: 'Supabase client belum terhubung' };

  try {
    const payload = updates.map(u => ({
      id: u.id,
      gaji_pokok_nominal: Number(u.gajiPokok),
      gaji_pokok_default: Number(u.gajiPokok),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('pegawai')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('❌ [Supabase] Error bulk update gaji pokok:', error.message);
      return { success: false, count: 0, error: error.message };
    }

    console.log(`✅ [Supabase] Berhasil memperbarui gaji pokok untuk ${updates.length} pegawai.`);
    return { success: true, count: updates.length };
  } catch (err: any) {
    console.error('❌ [Supabase] Exception bulk update gaji pokok:', err);
    return { success: false, count: 0, error: err?.message || 'Gagal menyimpan ke Supabase' };
  }
}

/**
 * Update penyesuaian matriks penggajian menggunakan Supabase RPC Stored Procedure `update_payroll_matrix_adjustment`
 * dengan fallback otomatis ke direct table update pada tabel `slip_gaji`.
 */
export async function updatePayrollMatrixAdjustmentRPC(
  record: PenggajianRecord,
  modifiedBy?: string
): Promise<{ success: boolean; error?: string; viaRpc?: boolean; data?: any }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client belum terhubung. Konfigurasi kredensial terlebih dahulu.' };
  }

  // 1. Eksekusi melalui Supabase RPC Function
  try {
    const rpcPayload = {
      p_record_id: record.id,
      p_gaji_pokok: Number(record.gajiPokok || 0),
      p_tunjangan_jabatan: Number(record.tunjanganJabatan || 0),
      p_tunjangan_wali_kelas: Number(record.tunjanganWaliKelas || 0),
      p_tunjangan_ijazah: Number(record.tunjanganIjazah || 0),
      p_tunjangan_kinerja: Number(record.tunjanganKinerja || 0),
      p_tunjangan_kehadiran: Number(record.tunjanganKehadiran || 0),
      p_honor_jam_mengajar: Number(record.honorJamMengajar || 0),
      p_honor_infal: Number(record.honorInfal || 0),
      p_tunjangan_lainnya: Number(record.tunjanganLainnya || 0),
      p_potongan_keterlambatan: Number(record.potonganKeterlambatan || 0),
      p_potongan_alpha: Number(record.potonganAlpha || 0),
      p_potongan_izin: Number(record.potonganIzin || 0),
      p_potongan_infal: Number(record.potonganInfal || 0),
      p_potongan_kas_sekolah: Number(record.potonganKasSekolah || 0),
      p_potongan_bpjs_kesehatan: Number(record.potonganBpjsKesehatan || 0),
      p_potongan_bpjs_ketenagakerjaan: Number(record.potonganBpjsKetenagakerjaan || 0),
      p_potongan_lainnya: Number(record.potonganLainnya || 0),
      p_total_penerimaan: Number(record.totalPenerimaan || 0),
      p_total_potongan: Number(record.totalPotongan || 0),
      p_gaji_bersih: Number(record.gajiBersih || record.takeHomePay || 0),
      p_take_home_pay: Number(record.takeHomePay || record.gajiBersih || 0),
      p_modified_by: modifiedBy || 'Admin Keuangan',
    };

    const { data, error: rpcError } = await (client as any).rpc('update_payroll_matrix_adjustment', rpcPayload);

    if (!rpcError) {
      console.log(`✅ [Supabase RPC] Berhasil update via stored procedure: ${record.kodeSlip}`);
      return { success: true, viaRpc: true, data };
    }

    console.warn('⚠️ [Supabase RPC] RPC update_payroll_matrix_adjustment belum dibuat atau error:', rpcError.message, '-> Beralih ke direct table update.');
  } catch (err: any) {
    console.warn('⚠️ [Supabase RPC Exception]:', err?.message);
  }

  // 2. Graceful Fallback: Direct Table Update ke tabel `slip_gaji`
  try {
    const tablePayload: Record<string, any> = {
      gaji_pokok: Number(record.gajiPokok || 0),
      tunjangan_jabatan: Number(record.tunjanganJabatan || 0),
      tunjangan_wali_kelas: Number(record.tunjanganWaliKelas || 0),
      tunjangan_ijazah: Number(record.tunjanganIjazah || 0),
      tunjangan_kinerja: Number(record.tunjanganKinerja || 0),
      tunjangan_kehadiran: Number(record.tunjanganKehadiran || 0),
      honor_jam_mengajar: Number(record.honorJamMengajar || 0),
      honor_infal: Number(record.honorInfal || 0),
      tunjangan_lainnya: Number(record.tunjanganLainnya || 0),
      potongan_keterlambatan: Number(record.potonganKeterlambatan || 0),
      potongan_alpha: Number(record.potonganAlpha || 0),
      potongan_izin: Number(record.potonganIzin || 0),
      potongan_infal: Number(record.potonganInfal || 0),
      potongan_kas_sekolah: Number(record.potonganKasSekolah || 0),
      potongan_bpjs_kesehatan: Number(record.potonganBpjsKesehatan || 0),
      potongan_bpjs_ketenagakerjaan: Number(record.potonganBpjsKetenagakerjaan || 0),
      potongan_lainnya: Number(record.potonganLainnya || 0),
      total_penerimaan: Number(record.totalPenerimaan || 0),
      gaji_kotor: Number(record.totalPenerimaan || 0),
      total_tambahan: Number(record.totalPenerimaan || 0),
      total_potongan: Number(record.totalPotongan || 0),
      gaji_bersih: Number(record.gajiBersih || record.takeHomePay || 0),
      take_home_pay: Number(record.takeHomePay || record.gajiBersih || 0),
      updated_at: new Date().toISOString(),
    };

    const { error: tableError } = await client
      .from('slip_gaji')
      .update(tablePayload)
      .eq('id', record.id);

    if (tableError) {
      console.error('❌ [Supabase] Direct table update error:', tableError.message);
      return { success: false, error: tableError.message };
    }

    console.log(`✅ [Supabase Table Update] Berhasil update data tabel slip_gaji: ${record.kodeSlip}`);
    return { success: true, viaRpc: false };
  } catch (err: any) {
    console.error('❌ [Supabase] Direct update exception:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan pembaruan data gaji ke Supabase' };
  }
}

/**
 * Update data master pegawai menggunakan Supabase RPC Stored Procedure `update_pegawai_master_data`
 * dengan fallback otomatis ke direct table upsert pada tabel `pegawai`.
 */
export async function updatePegawaiMasterDataRPC(
  pegawai: Pegawai,
  modifiedBy?: string
): Promise<{ success: boolean; error?: string; viaRpc?: boolean; data?: any }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client belum terhubung. Konfigurasi kredensial terlebih dahulu.' };
  }

  // 1. Eksekusi melalui Supabase RPC Function `update_pegawai_master_data`
  try {
    const rpcPayload = {
      p_pegawai_id: pegawai.id,
      p_nip: pegawai.nip || '',
      p_niy: pegawai.niy || '',
      p_nik: pegawai.nik || '',
      p_nuptk: pegawai.nuptk || '',
      p_nama_lengkap: pegawai.nama || '',
      p_email: pegawai.email || '',
      p_no_hp: pegawai.noHp || '',
      p_status_pegawai: pegawai.statusPegawai || 'GTT',
      p_jabatan_utama: pegawai.jabatanUtama || '',
      p_jabatan_tambahan: Array.isArray(pegawai.jabatanTambahan) ? JSON.stringify(pegawai.jabatanTambahan) : (pegawai.jabatanTambahan || '[]'),
      p_pendidikan_terakhir: pegawai.pendidikanTerakhir || 'S1',
      p_jurusan: pegawai.jurusan || '',
      p_status_induk: pegawai.statusInduk || 'Induk',
      p_keterangan_induk: pegawai.keteranganInduk || '',
      p_jenis_kelamin: pegawai.jenisKelamin || 'L',
      p_tempat_lahir: pegawai.tempatLahir || '',
      p_tanggal_lahir: pegawai.tanggalLahir || '',
      p_tmt: pegawai.tmt || '',
      p_masa_kerja: pegawai.masaKerja || '',
      p_gaji_pokok_nominal: Number(pegawai.gajiPokokDefault || 0),
      p_tunjangan_jabatan: Number(pegawai.tunjanganJabatanDefault || 0),
      p_tunjangan_wali_kelas: Number(pegawai.tunjanganWaliKelas || 0),
      p_tunjangan_ijazah: Number(pegawai.tunjanganIjazahDefault || 0),
      p_tunjangan_kinerja: Number(pegawai.tunjanganKinerjaDefault || 0),
      p_tarif_per_jam_mengajar: Number(pegawai.tarifPerJamMengajar || 18000),
      p_tarif_transport_harian: Number(pegawai.tarifTransportHarian || 20000),
      p_nama_bank: pegawai.namaBank || 'Bank Syariah Indonesia (BSI)',
      p_nomor_rekening: pegawai.nomorRekening || '',
      p_atas_nama_rekening: pegawai.atasNamaRekening || pegawai.nama || '',
      p_npwp: pegawai.npwp || '',
      p_is_linier_kompetensi: Boolean(pegawai.isLinierKompetensi),
      p_tahun_pengalaman: Number(pegawai.tahunPengalaman || 0),
      p_tahun_masa_kerja: Number(pegawai.tahunMasaKerja || 0),
      p_is_active: pegawai.isActive !== false,
      p_modified_by: modifiedBy || 'Admin Kepegawaian',
    };

    const { data, error: rpcError } = await (client as any).rpc('update_pegawai_master_data', rpcPayload);

    if (!rpcError) {
      console.log(`✅ [Supabase RPC] Berhasil update master pegawai via RPC: ${pegawai.nama}`);
      return { success: true, viaRpc: true, data };
    }

    console.warn('⚠️ [Supabase RPC] RPC update_pegawai_master_data belum dibuat atau error:', rpcError.message, '-> Beralih ke direct table upsert.');
  } catch (err: any) {
    console.warn('⚠️ [Supabase RPC Exception]:', err?.message);
  }

  // 2. Graceful Fallback: Eksekusi direct upsert pada tabel pegawai
  return upsertPegawaiSupabase(pegawai);
}


/**
 * Update langsung status approval di kolom `status_approval` tabel `slip_gaji`

 */
export async function updateSlipGajiApprovalSupabase(
  recordId: string,
  params: {
    action: 'approve' | 'reject' | 'submit_kepsek';
    userRole: string;
    userName: string;
    notes?: string;
    newStatus: StatusPenggajian;
  }
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status_approval: params.newStatus,
    status: params.newStatus, // backward compat
    updated_at: now,
  };

  if (params.action === 'reject') {
    updatePayload.rejected_by = params.userName;
    updatePayload.rejected_at = now;
    updatePayload.catatan_penolakan = params.notes;
  } else if (params.userRole === 'kepala_sekolah' || params.userRole === 'super_admin') {
    if (params.newStatus === 'pending_yayasan') {
      updatePayload.approved_kepsek_by = params.userName;
      updatePayload.approved_kepsek_at = now;
      updatePayload.catatan_kepsek = params.notes;
    }
  } else if (params.userRole === 'ketua_yayasan' || params.userRole === 'super_admin') {
    if (params.newStatus === 'approved') {
      updatePayload.approved_yayasan_by = params.userName;
      updatePayload.approved_yayasan_at = now;
      updatePayload.catatan_yayasan = params.notes;
    }
  }

  try {
    const { error } = await client
      .from('slip_gaji')
      .update(updatePayload)
      .eq('id', recordId);

    if (error) {
      console.warn('Supabase update slip_gaji approval error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update exception:', err);
    return false;
  }
}

/**
 * Update transfer gaji di tabel `slip_gaji`
 */
export async function updateSlipGajiTransferSupabase(
  recordId: string,
  params: {
    transferredBy: string;
    nomorReferensiTransfer: string;
    emailSent?: boolean;
  }
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const now = new Date().toISOString();
  try {
    const { error } = await client
      .from('slip_gaji')
      .update({
        status_approval: 'transferred',
        status: 'transferred',
        transferred_by: params.transferredBy,
        transferred_at: now,
        nomor_referensi_transfer: params.nomorReferensiTransfer,
        email_sent: params.emailSent !== false,
        email_sent_at: now,
        updated_at: now,
      })
      .eq('id', recordId);

    if (error) {
      console.warn('Supabase transfer error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase transfer exception:', err);
    return false;
  }
}

/**
 * Upsert slip gaji batch ke tabel `slip_gaji`
 */
export async function upsertSlipGajiBatchSupabase(records: PenggajianRecord[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || records.length === 0) return false;

  const rows = records.map(r => ({
    id: r.id,
    kode_slip: r.kodeSlip,
    pegawai_id: r.pegawaiId,
    pegawai_nama: r.pegawaiNama,
    pegawai_nip: r.pegawaiNip,
    pegawai_jabatan: r.pegawaiJabatan,
    pegawai_status: r.pegawaiStatus,
    pegawai_email: r.pegawaiEmail,
    bulan: r.bulan,
    tahun: r.tahun,
    periode_label: r.periodeLabel,
    tanggal_cutoff_mulai: r.tanggalCutoffMulai,
    tanggal_cutoff_selesai: r.tanggalCutoffSelesai,
    tanggal_mulai_bayar: r.tanggalMulaiBayar,
    periode_cutoff_label: r.periodeCutoffLabel,
    status_induk: r.statusInduk,
    keterangan_induk: r.keteranganInduk,
    presensi_hadir: r.presensiHadir,
    presensi_alpha: r.presensiAlpha,
    presensi_izin: r.presensiIzin,
    presensi_sakit: r.presensiSakit,
    presensi_cuti: r.presensiCuti,
    presensi_dinas_luar: r.presensiDinasLuar,
    presensi_terlambat_menit: r.presensiTerlambatMenit,
    jam_mengajar_realisasi: r.jamMengajarRealisasi,
    jam_lembur: r.jamLembur,
    gaji_pokok: r.gajiPokok,
    tunjangan_jabatan: r.tunjanganJabatan,
    tunjangan_kepsek: r.tunjanganKepsek,
    tunjangan_wakasek: r.tunjanganWakasek,
    tunjangan_wali_kelas: r.tunjanganWaliKelas,
    tunjangan_it_officer: r.tunjanganItOfficer,
    tunjangan_dkm: r.tunjanganDkm,
    tunjangan_asrama: r.tunjanganAsrama,
    tunjangan_bendahara: r.tunjanganBendahara,
    tunjangan_pj: r.tunjanganPj,
    tunjangan_ijazah_jenjang: r.tunjanganIjazahJenjang,
    tunjangan_ijazah: r.tunjanganIjazah,
    is_linier_kompetensi: r.isLinierKompetensi,
    tunjangan_kompetensi: r.tunjanganKompetensi,
    tahun_pengalaman: r.tahunPengalaman,
    tunjangan_pengalaman: r.tunjanganPengalaman,
    tahun_masa_kerja: r.tahunMasaKerja,
    tunjangan_masa_kerja: r.tunjanganMasaKerja,
    tunjangan_kinerja: r.tunjanganKinerja,
    tunjangan_kehadiran: r.tunjanganKehadiran,
    tunjangan_kehadiran_transport: r.tunjanganKehadiranTransport,
    honor_jam_mengajar: r.honorJamMengajar,
    honor_lembur: r.honorLembur,
    honor_infal: r.honorInfal,
    jp_menggantikan: r.jpMenggantikan,
    insentif_kajian_muslimah: r.insentifKajianMuslimah,
    koreksi_penerimaan: r.koreksiPenerimaan,
    tunjangan_vokasi_it: r.tunjanganVokasiIT,
    tunjangan_lainnya: r.tunjanganLainnya,
    total_penerimaan: r.totalPenerimaan,
    potongan_keterlambatan: r.potonganKeterlambatan,
    potongan_tidak_masuk: r.potonganTidakMasuk,
    potongan_alpha: r.potonganAlpha,
    potongan_izin: r.potonganIzin,
    potongan_infal: r.potonganInfal,
    jp_digantikan: r.jpDigantikan,
    koreksi_potongan: r.koreksiPotongan,
    potongan_pinjaman: r.potonganPinjaman,
    potongan_bpjs_kesehatan: r.potonganBpjsKesehatan,
    potongan_bpjs_ketenagakerjaan: r.potonganBpjsKetenagakerjaan,
    potongan_kas_sekolah: r.potonganKasSekolah,
    potongan_koperasi: r.potonganKoperasi,
    potongan_lainnya: r.potonganLainnya,
    total_potongan: r.totalPotongan,
    gaji_bersih: r.gajiBersih,
    status_approval: r.status,
    status: r.status,
    approved_kepsek_by: r.approvedKepsekBy,
    approved_kepsek_at: r.approvedKepsekAt,
    catatan_kepsek: r.catatanKepsek,
    approved_yayasan_by: r.approvedYayasanBy,
    approved_yayasan_at: r.approvedYayasanAt,
    catatan_yayasan: r.catatanYayasan,
    rejected_by: r.rejectedBy,
    rejected_at: r.rejectedAt,
    catatan_penolakan: r.catatanPenolakan,
    transferred_by: r.transferredBy,
    transferred_at: r.transferredAt,
    nomor_referensi_transfer: r.nomorReferensiTransfer,
    bukti_transfer_url: r.buktiTransferUrl,
    email_sent: r.emailSent,
    email_sent_at: r.emailSentAt,
    email_recipient: r.emailRecipient,
    is_encrypted: r.isEncrypted,
    security_checksum: r.securityChecksum,
    qr_verification_url: r.qrVerificationUrl,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }));

  try {
    const { error } = await client
      .from('slip_gaji')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Error upserting slip_gaji in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error upserting slip_gaji:', err);
    return false;
  }
}

/**
 * Upsert presensi harian / log JP ke Supabase
 */
export async function upsertPresensiHarianSupabase(logs: LogPresensiHarian[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || logs.length === 0) return false;

  const rows = logs.map(l => ({
    id: l.id,
    pegawai_id: l.pegawaiId,
    tanggal: l.tanggal,
    jam_masuk: l.jamMasuk,
    jam_keluar: l.jamKeluar,
    status: l.status,
    menit_terlambat: l.menitTerlambat,
    menit_pulang_cepat: l.menitPulangCepat,
    jam_lembur: l.jamLembur,
    jam_mengajar_hari_ini: l.jamMengajarHariIni || 0,
    metode: l.metode,
    lokasi_terminal: l.lokasiTerminal,
    keterangan: l.keterangan,
    foto_bukti_url: l.fotoBuktiUrl,
    is_verified: l.isVerified,
  }));

  try {
    const { error } = await client
      .from('presensi_harian_jp')
      .upsert(rows, { onConflict: 'id' });
    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Upsert guru inval ke Supabase
 */
export async function upsertGuruInvalSupabase(infals: LogInfal[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || infals.length === 0) return false;

  const rows = infals.map(inf => ({
    id: inf.id,
    tanggal: inf.tanggal,
    guru_digantikan_id: inf.guruDigantikanId || inf.guruAbsenId,
    guru_digantikan_nama: inf.guruDigantikanNama || inf.guruAbsenNama || '',
    guru_pengganti_id: inf.guruPenggantiId,
    guru_pengganti_nama: inf.guruPenggantiNama,
    kelas: inf.kelas,
    mata_pelajaran: inf.mataPelajaran,
    jam_ke: inf.jamKe,
    jumlah_jp: inf.jumlahJp,
    tarif_per_jp: inf.tarifPerJp,
    total_nominal: inf.totalNominal,
    alasan: inf.alasan || inf.alasanAbsen,
    status: inf.status,
    approved_by: inf.approvedBy,
    approved_at: inf.approvedAt,
    catatan: inf.catatan,
    created_at: inf.createdAt,
  }));

  try {
    const { error } = await client
      .from('guru_inval')
      .upsert(rows, { onConflict: 'id' });
    return !error;
  } catch (err) {
    return false;
  }
}

// ============================================================================
// 3. EXPORT & IMPORT REAL SUPABASE DATA (Backup & Restore JSON)
// ============================================================================

/**
 * Ekspor data riil lengkap dari semua tabel Supabase
 */
export async function exportAllSupabaseData(exportedBy: { id: string; nama: string; role: string }): Promise<SystemBackupData> {
  const client = getSupabase();
  
  // If not configured, throw error
  if (!client) {
    throw new Error('Supabase belum terhubung. Konfigurasi kredensial terlebih dahulu.');
  }

  const [
    resPegawai,
    resSlip,
    resPresensiHarian,
    resInval,
    resRekap,
    resCuti,
    resLembur,
    resJadwal,
    resEmails,
    resAudits
  ] = await Promise.allSettled([
    client.from('pegawai').select('*'),
    client.from('slip_gaji').select('*'),
    client.from('presensi_harian_jp').select('*'),
    client.from('guru_inval').select('*'),
    client.from('rekap_presensi').select('*'),
    client.from('pengajuan_cuti_izin').select('*'),
    client.from('lembur_pegawai').select('*'),
    client.from('jadwal_pelajaran').select('*'),
    client.from('email_logs').select('*'),
    client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500),
  ]);

  const rawPegawai = resPegawai.status === 'fulfilled' && resPegawai.value.data ? resPegawai.value.data : [];
  const rawSlip = resSlip.status === 'fulfilled' && resSlip.value.data ? resSlip.value.data : [];
  const rawDaily = resPresensiHarian.status === 'fulfilled' && resPresensiHarian.value.data ? resPresensiHarian.value.data : [];
  const rawInval = resInval.status === 'fulfilled' && resInval.value.data ? resInval.value.data : [];
  const rawRekap = resRekap.status === 'fulfilled' && resRekap.value.data ? resRekap.value.data : [];
  const rawCuti = resCuti.status === 'fulfilled' && resCuti.value.data ? resCuti.value.data : [];
  const rawLembur = resLembur.status === 'fulfilled' && resLembur.value.data ? resLembur.value.data : [];
  const rawJadwal = resJadwal.status === 'fulfilled' && resJadwal.value.data ? resJadwal.value.data : [];
  const rawEmails = resEmails.status === 'fulfilled' && resEmails.value.data ? resEmails.value.data : [];
  const rawAudits = resAudits.status === 'fulfilled' && resAudits.value.data ? resAudits.value.data : [];

  return {
    appName: 'SIM GAJI SMK IT Ibnul Qayyim Makassar (Supabase Cloud)',
    version: '2.5.0-supabase',
    exportTimestamp: new Date().toISOString(),
    exportedBy,
    statsSummary: {
      totalPegawai: rawPegawai.length,
      totalPresensiRekap: rawRekap.length,
      totalPresensiHarian: rawDaily.length,
      totalGajiRecords: rawSlip.length,
      totalJadwalSlots: rawJadwal.length,
      totalInfal: rawInval.length,
      totalCuti: rawCuti.length,
      totalLembur: rawLembur.length,
      totalEmailLogs: rawEmails.length,
    },
    data: {
      pegawaiList: rawPegawai.map((r: any) => ({
        id: r.id,
        nip: r.nip,
        nama: r.nama,
        email: r.email,
        noHp: r.no_hp,
        statusPegawai: r.status_pegawai,
        jabatanUtama: r.jabatan_utama,
        jabatanTambahan: r.jabatan_tambahan ? (Array.isArray(r.jabatan_tambahan) ? r.jabatan_tambahan : JSON.parse(r.jabatan_tambahan)) : [],
        pendidikanTerakhir: r.pendidikan_terakhir,
        tanggalMasuk: r.tanggal_masuk,
        namaBank: r.nama_bank,
        nomorRekening: r.nomor_rekening,
        atasNamaRekening: r.atas_nama_rekening,
        npwp: r.npwp,
        niy: r.niy,
        nik: r.nik,
        nuptk: r.nuptk,
        jenisKelamin: r.jenis_kelamin,
        tempatLahir: r.tempat_lahir,
        tanggalLahir: r.tanggal_lahir,
        usia: r.usia,
        jurusan: r.jurusan,
        tmt: r.tmt,
        masaKerja: r.masa_kerja,
        statusInduk: r.status_induk,
        keteranganInduk: r.keterangan_induk,
        gajiPokokDefault: Number(r.gaji_pokok_default || 0),
        tunjanganJabatanDefault: Number(r.tunjangan_jabatan_default || 0),
        tunjanganKepsekDefault: Number(r.tunjangan_kepsek_default || 0),
        tunjanganWakasekDefault: Number(r.tunjangan_wakasek_default || 0),
        tunjanganItOfficerDefault: Number(r.tunjangan_it_officer_default || 0),
        tunjanganDkmDefault: Number(r.tunjangan_dkm_default || 0),
        tunjanganAsramaDefault: Number(r.tunjangan_asrama_default || 0),
        tunjanganBendaharaDefault: Number(r.tunjangan_bendahara_default || 0),
        tunjanganPjDefault: Number(r.tunjangan_pj_default || 0),
        tunjanganIjazahJenjang: r.tunjangan_ijazah_jenjang,
        tunjanganIjazahDefault: Number(r.tunjangan_ijazah_default || 0),
        isLinierKompetensi: Boolean(r.is_linier_kompetensi),
        tahunPengalaman: Number(r.tahun_pengalaman || 0),
        tahunMasaKerja: Number(r.tahun_masa_kerja || 0),
        tunjanganKinerjaDefault: Number(r.tunjangan_kinerja_default || 0),
        tarifPerJamMengajar: Number(r.tarif_per_jam_mengajar || 18000),
        tarifTransportHarian: Number(r.tarif_transport_harian || 20000),
        tarifLemburPerJam: Number(r.tarif_lembur_per_jam || 20000),
        tunjanganKeluarga: Number(r.tunjangan_keluarga || 0),
        tunjanganWaliKelas: Number(r.tunjangan_wali_kelas || 0),
        tunjanganKhususVokasi: Number(r.tunjangan_khusus_vokasi || 0),
        potonganBpjsKesehatan: Number(r.potongan_bpjs_kesehatan || 0),
        potonganBpjsKetenagakerjaan: Number(r.potongan_bpjs_ketenagakerjaan || 0),
        potonganKasSekolah: Number(r.potongan_kas_sekolah || 0),
        isActive: Boolean(r.is_active !== false),
      })),
      presensiList: rawRekap.map((r: any) => ({
        id: r.id,
        pegawaiId: r.pegawai_id,
        bulan: Number(r.bulan),
        tahun: Number(r.tahun),
        totalHariEfektif: Number(r.total_hari_efektif || 22),
        hadir: Number(r.hadir || 0),
        sakit: Number(r.sakit || 0),
        izin: Number(r.izin || 0),
        cuti: Number(r.cuti || 0),
        dinasLuar: Number(r.dinas_luar || 0),
        alpha: Number(r.alpha || 0),
        menitTerlambat: Number(r.menit_terlambat || 0),
        jamMengajarRencana: Number(r.jam_mengajar_rencana || 0),
        jamMengajarRealisasi: Number(r.jam_mengajar_realisasi || 0),
        jamLemburTotal: Number(r.jam_lembur_total || 0),
        honorLemburTotal: Number(r.honor_lembur_total || 0),
        jumlahJpMenggantikan: Number(r.jumlah_jp_menggantikan || 0),
        honorInfalTotal: Number(r.honor_infal_total || 0),
        jumlahJpDigantikan: Number(r.jumlah_jp_digantikan || 0),
        potonganInfalTotal: Number(r.potongan_infal_total || 0),
        insentifKajianMuslimah: Number(r.insentif_kajian_muslimah || 0),
        potonganIzinTidakResmi: Number(r.potongan_izin_tidak_resmi || 0),
        updatedAt: r.updated_at || new Date().toISOString(),
      })),
      dailyLogs: rawDaily.map((r: any) => ({
        id: r.id,
        pegawaiId: r.pegawai_id,
        tanggal: r.tanggal,
        jamMasuk: r.jam_masuk,
        jamKeluar: r.jam_keluar,
        status: r.status,
        menitTerlambat: Number(r.menit_terlambat || 0),
        menitPulangCepat: Number(r.menit_pulang_cepat || 0),
        jamLembur: Number(r.jam_lembur || 0),
        jamMengajarHariIni: Number(r.jam_mengajar_hari_ini || 0),
        metode: r.metode,
        lokasiTerminal: r.lokasi_terminal,
        keterangan: r.keterangan,
        fotoBuktiUrl: r.foto_bukti_url,
        isVerified: Boolean(r.is_verified !== false),
      })),
      records: rawSlip.map((r: any) => ({
        id: r.id,
        kodeSlip: r.kode_slip,
        pegawaiId: r.pegawai_id,
        pegawaiNama: r.pegawai_nama || '',
        pegawaiNip: r.pegawai_nip || '',
        pegawaiJabatan: r.pegawai_jabatan || '',
        pegawaiStatus: r.pegawai_status || 'GTT',
        pegawaiEmail: r.pegawai_email || '',
        bulan: Number(r.bulan),
        tahun: Number(r.tahun),
        periodeLabel: r.periode_label,
        tanggalCutoffMulai: r.tanggal_cutoff_mulai,
        tanggalCutoffSelesai: r.tanggal_cutoff_selesai,
        tanggalMulaiBayar: r.tanggal_mulai_bayar,
        periodeCutoffLabel: r.periode_cutoff_label,
        statusInduk: r.status_induk,
        keteranganInduk: r.keterangan_induk,
        presensiHadir: Number(r.presensi_hadir || 0),
        presensiAlpha: Number(r.presensi_alpha || 0),
        presensiIzin: Number(r.presensi_izin || 0),
        presensiSakit: Number(r.presensi_sakit || 0),
        presensiCuti: Number(r.presensi_cuti || 0),
        presensiDinasLuar: Number(r.presensi_dinas_luar || 0),
        presensiTerlambatMenit: Number(r.presensi_terlambat_menit || 0),
        jamMengajarRealisasi: Number(r.jam_mengajar_realisasi || 0),
        jamLembur: Number(r.jam_lembur || 0),
        gajiPokok: Number(r.gaji_pokok || 0),
        tunjanganJabatan: Number(r.tunjangan_jabatan || 0),
        tunjanganKepsek: Number(r.tunjangan_kepsek || 0),
        tunjanganWakasek: Number(r.tunjangan_wakasek || 0),
        tunjanganWaliKelas: Number(r.tunjangan_wali_kelas || 0),
        tunjanganItOfficer: Number(r.tunjangan_it_officer || 0),
        tunjanganDkm: Number(r.tunjangan_dkm || 0),
        tunjanganAsrama: Number(r.tunjangan_asrama || 0),
        tunjanganBendahara: Number(r.tunjangan_bendahara || 0),
        tunjanganPj: Number(r.tunjangan_pj || 0),
        tunjanganIjazahJenjang: r.tunjangan_ijazah_jenjang,
        tunjanganIjazah: Number(r.tunjangan_ijazah || 0),
        isLinierKompetensi: Boolean(r.is_linier_kompetensi),
        tunjanganKompetensi: Number(r.tunjangan_kompetensi || 0),
        tahunPengalaman: Number(r.tahun_pengalaman || 0),
        tunjanganPengalaman: Number(r.tunjangan_pengalaman || 0),
        tahunMasaKerja: Number(r.tahun_masa_kerja || 0),
        tunjanganMasaKerja: Number(r.tunjangan_masa_kerja || 0),
        tunjanganKinerja: Number(r.tunjangan_kinerja || 0),
        tunjanganKehadiran: Number(r.tunjangan_kehadiran || 0),
        tunjanganKehadiranTransport: Number(r.tunjangan_kehadiran_transport || r.tunjangan_kehadiran || 0),
        honorJamMengajar: Number(r.honor_jam_mengajar || 0),
        honorLembur: Number(r.honor_lembur || 0),
        honorInfal: Number(r.honor_infal || 0),
        jpMenggantikan: Number(r.jp_menggantikan || 0),
        insentifKajianMuslimah: Number(r.insentif_kajian_muslimah || 0),
        koreksiPenerimaan: Number(r.koreksi_penerimaan || 0),
        tunjanganVokasiIT: Number(r.tunjangan_vokasi_it || 0),
        tunjanganLainnya: Number(r.tunjangan_lainnya || 0),
        totalPenerimaan: Number(r.total_penerimaan || 0),
        potonganKeterlambatan: Number(r.potongan_keterlambatan || 0),
        potonganTidakMasuk: Number(r.potongan_tidak_masuk || 0),
        potonganAlpha: Number(r.potongan_alpha || 0),
        potonganIzin: Number(r.potongan_izin || 0),
        potonganInfal: Number(r.potongan_infal || 0),
        jpDigantikan: Number(r.jp_digantikan || 0),
        koreksiPotongan: Number(r.koreksi_potongan || 0),
        potonganPinjaman: Number(r.potongan_pinjaman || 0),
        potonganBpjsKesehatan: Number(r.potongan_bpjs_kesehatan || 0),
        potonganBpjsKetenagakerjaan: Number(r.potongan_bpjs_ketenagakerjaan || 0),
        potonganKasSekolah: Number(r.potongan_kas_sekolah || 0),
        potonganKoperasi: Number(r.potongan_koperasi || 0),
        potonganLainnya: Number(r.potongan_lainnya || 0),
        totalPotongan: Number(r.total_potongan || 0),
        gajiBersih: Number(r.gaji_bersih || 0),
        status: r.status_approval || r.status || 'draft',
        approvedKepsekBy: r.approved_kepsek_by,
        approvedKepsekAt: r.approved_kepsek_at,
        catatanKepsek: r.catatan_kepsek,
        approvedYayasanBy: r.approved_yayasan_by,
        approvedYayasanAt: r.approved_yayasan_at,
        catatanYayasan: r.catatan_yayasan,
        rejectedBy: r.rejected_by,
        rejectedAt: r.rejected_at,
        catatanPenolakan: r.catatan_penolakan,
        transferredBy: r.transferred_by,
        transferredAt: r.transferred_at,
        nomorReferensiTransfer: r.nomor_referensi_transfer,
        buktiTransferUrl: r.bukti_transfer_url,
        emailSent: Boolean(r.email_sent),
        emailSentAt: r.email_sent_at,
        emailRecipient: r.email_recipient,
        isEncrypted: Boolean(r.is_encrypted !== false),
        securityChecksum: r.security_checksum || 'sha256-verified',
        qrVerificationUrl: r.qr_verification_url || 'https://iqm.sch.id',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      scheduleList: rawJadwal.map((r: any) => ({
        id: r.id,
        hari: r.hari,
        jamKe: r.jam_ke,
        rentangWaktu: r.rentang_waktu,
        kelas: r.kelas,
        mataPelajaran: r.mata_pelajaran,
        kodeGuru: r.kode_guru,
        guruNama: r.guru_nama,
        pegawaiId: r.pegawai_id,
        ruang: r.ruang,
        isIstirahat: Boolean(r.is_istirahat),
        isNonAkademik: Boolean(r.is_non_akademik),
        tipeSlot: r.tipe_slot || 'pelajaran',
        kategoriIstirahat: r.kategori_istirahat,
      })),
      infalList: rawInval.map((r: any) => ({
        id: r.id,
        tanggal: r.tanggal,
        guruDigantikanId: r.guru_digantikan_id || r.guru_absen_id,
        guruDigantikanNama: r.guru_digantikan_nama || r.guru_absen_nama || '',
        guruAbsenId: r.guru_digantikan_id || r.guru_absen_id,
        guruAbsenNama: r.guru_digantikan_nama || r.guru_absen_nama,
        guruPenggantiId: r.guru_pengganti_id,
        guruPenggantiNama: r.guru_pengganti_nama || '',
        kelas: r.kelas,
        mataPelajaran: r.mata_pelajaran,
        jamKe: r.jam_ke,
        jumlahJp: Number(r.jumlah_jp || 0),
        tarifPerJp: Number(r.tarif_per_jp || 7500),
        totalNominal: Number(r.total_nominal || 0),
        alasan: r.alasan,
        status: r.status || 'approved',
        approvedBy: r.approved_by,
        approvedAt: r.approved_at,
        catatan: r.catatan,
        createdAt: r.created_at,
      })),
      leaveRequests: rawCuti.map((r: any) => ({
        id: r.id,
        pegawaiId: r.pegawai_id,
        pegawaiNama: r.pegawai_nama || '',
        jenis: r.jenis,
        tanggalMulai: r.tanggal_mulai,
        tanggalSelesai: r.tanggal_selesai,
        jumlahHari: Number(r.jumlah_hari || 1),
        alasan: r.alasan,
        lampiranDokumenUrl: r.lampiran_dokumen_url,
        status: r.status,
        approvedBy: r.approved_by,
        approvedAt: r.approved_at,
        catatanApproval: r.catatan_approval,
        berdampakPotonganGaji: Boolean(r.berdampak_potongan_gaji),
        createdAt: r.created_at,
      })),
      overtimeRecords: rawLembur.map((r: any) => ({
        id: r.id,
        pegawaiId: r.pegawai_id,
        pegawaiNama: r.pegawai_nama || '',
        tanggal: r.tanggal,
        jamMulai: r.jam_mulai,
        jamSelesai: r.jam_selesai,
        durasiJam: Number(r.durasi_jam || 0),
        kategori: r.kategori,
        deskripsiTugas: r.deskripsi_tugas,
        tarifPerJam: Number(r.tarif_per_jam || 20000),
        totalHonor: Number(r.total_honor || 0),
        status: r.status,
        approvedBy: r.approved_by,
        approvedAt: r.approved_at,
        catatan: r.catatan,
        createdAt: r.created_at,
      })),
      emailLogs: rawEmails.map((r: any) => ({
        id: r.id,
        penggajianId: r.penggajian_id,
        kodeSlip: r.kode_slip,
        recipientEmail: r.recipient_email,
        recipientName: r.recipient_name,
        subject: r.subject,
        sentAt: r.sent_at,
        status: r.status,
        messagePreview: r.message_preview,
      })),
      auditLogs: rawAudits.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        userId: r.user_id,
        userName: r.user_name,
        userRole: r.user_role,
        category: r.category,
        action: r.action,
        actionLabel: r.action_label,
        target: r.target,
        details: r.details,
        ipAddress: r.ip_address,
      })),
    },
  };
}

/**
 * Impor & Sinkronkan data JSON ke tabel-tabel Supabase
 */
export async function importAllSupabaseData(
  backup: SystemBackupData,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client belum terhubung. Konfigurasi kredensial terlebih dahulu.',
    };
  }

  try {
    // 1. Pegawai
    if (backup.data.pegawaiList?.length) {
      const pegRows = backup.data.pegawaiList.map(p => ({
        id: p.id,
        nip: p.nip,
        nama: p.nama,
        email: p.email,
        no_hp: p.noHp,
        status_pegawai: p.statusPegawai,
        jabatan_utama: p.jabatanUtama,
        jabatan_tambahan: p.jabatanTambahan || [],
        pendidikan_terakhir: p.pendidikanTerakhir,
        tanggal_masuk: p.tanggalMasuk,
        nama_bank: p.namaBank,
        nomor_rekening: p.nomorRekening,
        atas_nama_rekening: p.atasNamaRekening,
        npwp: p.npwp,
        niy: p.niy,
        nik: p.nik,
        nuptk: p.nuptk,
        jenis_kelamin: p.jenisKelamin,
        tempat_lahir: p.tempatLahir,
        tanggal_lahir: p.tanggalLahir,
        usia: p.usia,
        jurusan: p.jurusan,
        tmt: p.tmt,
        masa_kerja: p.masaKerja,
        status_induk: p.statusInduk,
        keterangan_induk: p.keteranganInduk,
        gaji_pokok_default: p.gajiPokokDefault,
        tunjangan_jabatan_default: p.tunjanganJabatanDefault,
        tunjangan_kepsek_default: p.tunjanganKepsekDefault || 0,
        tunjangan_wakasek_default: p.tunjanganWakasekDefault || 0,
        tunjangan_it_officer_default: p.tunjanganItOfficerDefault || 0,
        tunjangan_dkm_default: p.tunjanganDkmDefault || 0,
        tunjangan_asrama_default: p.tunjanganAsramaDefault || 0,
        tunjangan_bendahara_default: p.tunjanganBendaharaDefault || 0,
        tunjangan_pj_default: p.tunjanganPjDefault || 0,
        tunjangan_ijazah_jenjang: p.tunjanganIjazahJenjang,
        tunjangan_ijazah_default: p.tunjanganIjazahDefault || 0,
        is_linier_kompetensi: p.isLinierKompetensi || false,
        tahun_pengalaman: p.tahunPengalaman || 0,
        tahun_masa_kerja: p.tahunMasaKerja || 0,
        tunjangan_kinerja_default: p.tunjanganKinerjaDefault || 0,
        tarif_per_jam_mengajar: p.tarifPerJamMengajar,
        tarif_transport_harian: p.tarifTransportHarian,
        tarif_lembur_per_jam: p.tarifLemburPerJam,
        tunjangan_keluarga: p.tunjanganKeluarga,
        tunjangan_wali_kelas: p.tunjanganWaliKelas,
        tunjangan_khusus_vokasi: p.tunjanganKhususVokasi,
        potongan_bpjs_kesehatan: p.potonganBpjsKesehatan,
        potongan_bpjs_ketenagakerjaan: p.potonganBpjsKetenagakerjaan,
        potongan_kas_sekolah: p.potonganKasSekolah,
        is_active: p.isActive,
      }));
      await client.from('pegawai').upsert(pegRows, { onConflict: 'id' });
    }

    // 2. Slip Gaji
    if (backup.data.records?.length) {
      await upsertSlipGajiBatchSupabase(backup.data.records);
    }

    // 3. Presensi Harian JP
    if (backup.data.dailyLogs?.length) {
      await upsertPresensiHarianSupabase(backup.data.dailyLogs);
    }

    // 4. Guru Inval
    if (backup.data.infalList?.length) {
      await upsertGuruInvalSupabase(backup.data.infalList);
    }

    // 5. Rekap Presensi
    if (backup.data.presensiList?.length) {
      const rekapRows = backup.data.presensiList.map(r => ({
        id: r.id || `${r.pegawaiId}-${r.bulan}-${r.tahun}`,
        pegawai_id: r.pegawaiId,
        bulan: r.bulan,
        tahun: r.tahun,
        total_hari_efektif: r.totalHariEfektif,
        hadir: r.hadir,
        sakit: r.sakit,
        izin: r.izin,
        cuti: r.cuti,
        dinas_luar: r.dinasLuar,
        alpha: r.alpha,
        menit_terlambat: r.menitTerlambat,
        jam_mengajar_rencana: r.jamMengajarRencana,
        jam_mengajar_realisasi: r.jamMengajarRealisasi,
        jam_lembur_total: r.jamLemburTotal,
        honor_lembur_total: r.honorLemburTotal,
        jumlah_jp_menggantikan: r.jumlahJpMenggantikan || 0,
        honor_infal_total: r.honorInfalTotal || 0,
        jumlah_jp_digantikan: r.jumlahJpDigantikan || 0,
        potongan_infal_total: r.potonganInfalTotal || 0,
        insentif_kajian_muslimah: r.insentifKajianMuslimah || 0,
        potongan_izin_tidak_resmi: r.potonganIzinTidakResmi || 0,
      }));
      await client.from('rekap_presensi').upsert(rekapRows, { onConflict: 'id' });
    }

    return {
      success: true,
      message: `Berhasil mengimpor dan menyinkronkan data ke Supabase (${backup.statsSummary.totalPegawai} pegawai & ${backup.statsSummary.totalGajiRecords} slip gaji).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal impor ke Supabase: ${err?.message || 'Error'}`,
    };
  }
}

/**
 * Inisialisasi/Seed awal Supabase Database jika tabel masih kosong
 */
export async function seedInitialSupabaseDatabase(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client belum diatur.',
    };
  }

  try {
    // 1. Seed periode_penggajian
    const periods = [
      { id: 'per-2026-07', bulan: 7, tahun: 2026, periode_label: 'Juli 2026', tanggal_cutoff_mulai: '2026-06-23', tanggal_cutoff_selesai: '2026-07-22', tanggal_mulai_bayar: '2026-07-25', is_active: true, status_global: 'transferred' },
      { id: 'per-2026-08', bulan: 8, tahun: 2026, periode_label: 'Agustus 2026', tanggal_cutoff_mulai: '2026-07-23', tanggal_cutoff_selesai: '2026-08-22', tanggal_mulai_bayar: '2026-08-25', is_active: true, status_global: 'active' },
      { id: 'per-2026-09', bulan: 9, tahun: 2026, periode_label: 'September 2026', tanggal_cutoff_mulai: '2026-08-23', tanggal_cutoff_selesai: '2026-09-22', tanggal_mulai_bayar: '2026-09-25', is_active: true, status_global: 'draft' },
      { id: 'per-2026-10', bulan: 10, tahun: 2026, periode_label: 'Oktober 2026', tanggal_cutoff_mulai: '2026-09-23', tanggal_cutoff_selesai: '2026-10-22', tanggal_mulai_bayar: '2026-10-25', is_active: true, status_global: 'draft' },
      { id: 'per-2026-11', bulan: 11, tahun: 2026, periode_label: 'November 2026', tanggal_cutoff_mulai: '2026-10-23', tanggal_cutoff_selesai: '2026-11-22', tanggal_mulai_bayar: '2026-11-25', is_active: true, status_global: 'draft' },
      { id: 'per-2026-12', bulan: 12, tahun: 2026, periode_label: 'Desember 2026', tanggal_cutoff_mulai: '2026-11-23', tanggal_cutoff_selesai: '2026-12-22', tanggal_mulai_bayar: '2026-12-25', is_active: true, status_global: 'draft' },
    ];
    await client.from('periode_penggajian').upsert(periods, { onConflict: 'id' });

    // 2. Seed pegawai
    const initialBackup: SystemBackupData = {
      appName: 'SIM GAJI SMK IT Ibnul Qayyim Makassar',
      version: '2.5.0',
      exportTimestamp: new Date().toISOString(),
      exportedBy: { id: 'admin-01', nama: 'System Admin', role: 'super_admin' },
      statsSummary: {
        totalPegawai: INITIAL_PEGAWAI.length,
        totalPresensiRekap: INITIAL_PRESENSI.length,
        totalPresensiHarian: INITIAL_DAILY_LOGS.length,
        totalGajiRecords: PAYROLL_JULI_2026.length,
        totalJadwalSlots: INITIAL_SCHEDULE_SLOTS.length,
        totalInfal: INITIAL_INFAL.length,
        totalCuti: INITIAL_LEAVE_REQUESTS.length,
        totalLembur: INITIAL_OVERTIME_RECORDS.length,
        totalEmailLogs: INITIAL_EMAIL_LOGS.length,
      },
      data: {
        pegawaiList: INITIAL_PEGAWAI,
        presensiList: [...INITIAL_PRESENSI, ...PRESENSI_JULI_2026],
        dailyLogs: INITIAL_DAILY_LOGS,
        records: PAYROLL_JULI_2026,
        scheduleList: INITIAL_SCHEDULE_SLOTS,
        infalList: INITIAL_INFAL,
        leaveRequests: INITIAL_LEAVE_REQUESTS,
        overtimeRecords: INITIAL_OVERTIME_RECORDS,
        emailLogs: INITIAL_EMAIL_LOGS,
        auditLogs: INITIAL_AUDIT_LOGS,
      }
    };

    return await importAllSupabaseData(initialBackup, 'replace');
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal seeding Supabase: ${err?.message || 'Error'}`,
    };
  }
}
