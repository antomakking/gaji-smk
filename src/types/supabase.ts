// ==============================================================================
// Strict TypeScript Type Interfaces for Supabase Schema & Database Tables
// SIM GAJI - SMK IT Ibnul Qayyim Makassar
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface SupabasePegawaiRow {
  id: string;
  nip?: string | null;
  niy?: string | null;
  nik?: string | null;
  nuptk?: string | null;
  nama_lengkap?: string | null;
  nama?: string | null;
  email?: string | null;
  no_hp?: string | null;
  jabatan?: string | null;
  jabatan_utama?: string | null;
  jabatan_tambahan?: string | string[] | null;
  jenis_pegawai?: string | null;
  status_pegawai?: string | null;
  status_induk?: string | null;
  keterangan_induk?: string | null;
  pendidikan_terakhir?: string | null;
  tanggal_masuk?: string | null;
  nama_bank?: string | null;
  nomor_rekening?: string | null;
  atas_nama_rekening?: string | null;
  npwp?: string | null;
  jenis_kelamin?: 'L' | 'P' | 'Laki-laki' | 'Perempuan' | string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  usia?: string | number | null;
  jurusan?: string | null;
  tmt?: string | null;
  masa_kerja?: string | null;
  gaji_pokok_nominal?: number | string | null;
  gaji_pokok_default?: number | string | null;
  tunjangan_jabatan_default?: number | string | null;
  tunjangan_kepsek_default?: number | string | null;
  tunjangan_wakasek_default?: number | string | null;
  tunjangan_it_officer_default?: number | string | null;
  tunjangan_dkm_default?: number | string | null;
  tunjangan_asrama_default?: number | string | null;
  tunjangan_bendahara_default?: number | string | null;
  tunjangan_pj_default?: number | string | null;
  tunjangan_ijazah_jenjang?: string | null;
  tunjangan_ijazah_default?: number | string | null;
  is_linier_kompetensi?: boolean | number | string | null;
  tahun_pengalaman?: number | string | null;
  tahun_masa_kerja?: number | string | null;
  tunjangan_kinerja_default?: number | string | null;
  tarif_per_jam_mengajar?: number | string | null;
  tarif_transport_harian?: number | string | null;
  tarif_lembur_per_jam?: number | string | null;
  tunjangan_keluarga?: number | string | null;
  tunjangan_wali_kelas?: number | string | null;
  tunjangan_khusus_vokasi?: number | string | null;
  potongan_bpjs_kesehatan?: number | string | null;
  potongan_bpjs_ketenagakerjaan?: number | string | null;
  potongan_kas_sekolah?: number | string | null;
  is_active?: boolean | number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

// Aliases for Database Representation
export type PegawaiRow = SupabasePegawaiRow;
export type PegawaiTable = SupabasePegawaiRow;

export interface SupabaseSlipGajiRow {
  id: string;
  kode_slip?: string | null;
  pegawai_id?: string | null;
  pegawai_nama?: string | null;
  pegawai_nip?: string | null;
  pegawai_jabatan?: string | null;
  pegawai_status?: string | null;
  pegawai_email?: string | null;
  bulan?: number | string | null;
  tahun?: number | string | null;
  nama_periode?: string | null;
  periode_label?: string | null;
  tanggal_cutoff_mulai?: string | null;
  tanggal_cutoff_selesai?: string | null;
  tanggal_mulai_bayar?: string | null;
  periode_cutoff_label?: string | null;
  status_induk?: string | null;
  keterangan_induk?: string | null;

  // Presensi fields
  presensi_hadir?: number | string | null;
  presensi_alpha?: number | string | null;
  presensi_izin?: number | string | null;
  presensi_sakit?: number | string | null;
  presensi_cuti?: number | string | null;
  presensi_dinas_luar?: number | string | null;
  presensi_terlambat_menit?: number | string | null;
  realisasi_jp?: number | string | null;
  jam_mengajar_realisasi?: number | string | null;
  jam_lembur?: number | string | null;

  // Penerimaan
  gaji_pokok?: number | string | null;
  tunjangan_jabatan?: number | string | null;
  tunjangan_kepsek?: number | string | null;
  tunjangan_wakasek?: number | string | null;
  tunjangan_wali_kelas?: number | string | null;
  tunjangan_it_officer?: number | string | null;
  tunjangan_dkm?: number | string | null;
  tunjangan_asrama?: number | string | null;
  tunjangan_bendahara?: number | string | null;
  tunjangan_pj?: number | string | null;
  tunjangan_ijazah_jenjang?: string | null;
  tunjangan_ijazah?: number | string | null;
  is_linier_kompetensi?: boolean | number | string | null;
  tunjangan_kompetensi?: number | string | null;
  tahun_pengalaman?: number | string | null;
  tunjangan_pengalaman?: number | string | null;
  tahun_masa_kerja?: number | string | null;
  tunjangan_masa_kerja?: number | string | null;
  tunjangan_kinerja?: number | string | null;
  tunjangan_kehadiran?: number | string | null;
  tunjangan_kehadiran_transport?: number | string | null;
  honor_jam_mengajar?: number | string | null;
  honor_lembur?: number | string | null;
  honor_infal?: number | string | null;
  jp_menggantikan?: number | string | null;
  insentif_kajian_muslimah?: number | string | null;
  koreksi_penerimaan?: number | string | null;
  tunjangan_vokasi_it?: number | string | null;
  tunjangan_lainnya?: number | string | null;
  gaji_kotor?: number | string | null;
  total_penerimaan?: number | string | null;

  // Potongan
  potongan_keterlambatan?: number | string | null;
  potongan_tidak_masuk?: number | string | null;
  potongan_alpha?: number | string | null;
  potongan_izin?: number | string | null;
  potongan_infal?: number | string | null;
  jp_digantikan?: number | string | null;
  koreksi_potongan?: number | string | null;
  potongan_pinjaman?: number | string | null;
  potongan_bpjs_kesehatan?: number | string | null;
  potongan_bpjs_ketenagakerjaan?: number | string | null;
  potongan_kas_sekolah?: number | string | null;
  potongan_koperasi?: number | string | null;
  potongan_lainnya?: number | string | null;
  total_potongan?: number | string | null;

  // Gaji Bersih & Status
  gaji_bersih?: number | string | null;
  status_approval?: string | null;
  status?: string | null;

  // Approvals & Audit
  approved_kepsek_by?: string | null;
  approved_kepsek_at?: string | null;
  catatan_kepsek?: string | null;
  approved_yayasan_by?: string | null;
  approved_yayasan_at?: string | null;
  catatan_yayasan?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  catatan_penolakan?: string | null;
  transferred_by?: string | null;
  transferred_at?: string | null;
  nomor_referensi_transfer?: string | null;
  bukti_transfer_url?: string | null;
  email_sent?: boolean | number | string | null;
  email_sent_at?: string | null;
  email_recipient?: string | null;
  is_encrypted?: boolean | number | string | null;
  security_checksum?: string | null;
  qr_verification_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // Joined relation object (optional)
  pegawai?: Partial<SupabasePegawaiRow> | null;
  [key: string]: any;
}

export type SlipGajiRow = SupabaseSlipGajiRow;
export type SlipGajiTable = SupabaseSlipGajiRow;

export interface SupabasePresensiHarianRow {
  id: string;
  pegawai_id: string;
  tanggal: string;
  jam_masuk?: string | null;
  jam_keluar?: string | null;
  status?: string | null;
  menit_terlambat?: number | string | null;
  menit_pulang_cepat?: number | string | null;
  jam_lembur?: number | string | null;
  jam_mengajar_hari_ini?: number | string | null;
  metode?: string | null;
  lokasi_terminal?: string | null;
  keterangan?: string | null;
  foto_bukti_url?: string | null;
  is_verified?: boolean | number | string | null;
  created_at?: string | null;
  [key: string]: any;
}

export type PresensiHarianRow = SupabasePresensiHarianRow;

export interface SupabaseGuruInvalRow {
  id: string;
  tanggal: string;
  guru_digantikan_id?: string | null;
  guru_digantikan_nama?: string | null;
  guru_absen_id?: string | null;
  guru_absen_nama?: string | null;
  guru_pengganti_id: string;
  guru_pengganti_nama: string;
  kelas?: string | null;
  mata_pelajaran?: string | null;
  jam_ke?: string | null;
  jumlah_jp?: number | string | null;
  tarif_per_jp?: number | string | null;
  total_nominal?: number | string | null;
  alasan?: string | null;
  status?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  catatan?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

export type LogInfalRow = SupabaseGuruInvalRow;
export type GuruInvalTable = SupabaseGuruInvalRow;

export interface SupabaseRekapPresensiRow {
  id: string;
  pegawai_id: string;
  bulan: number | string;
  tahun: number | string;
  total_hari_efektif?: number | string | null;
  hadir?: number | string | null;
  sakit?: number | string | null;
  izin?: number | string | null;
  cuti?: number | string | null;
  dinas_luar?: number | string | null;
  alpha?: number | string | null;
  menit_terlambat?: number | string | null;
  jam_mengajar_rencana?: number | string | null;
  jam_mengajar_realisasi?: number | string | null;
  jam_lembur_total?: number | string | null;
  honor_lembur_total?: number | string | null;
  jumlah_jp_menggantikan?: number | string | null;
  honor_infal_total?: number | string | null;
  jumlah_jp_digantikan?: number | string | null;
  potongan_infal_total?: number | string | null;
  potongan_izin_tidak_resmi?: number | string | null;
  catatan?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export type RekapPresensiRow = SupabaseRekapPresensiRow;

export interface SupabasePeriodePenggajianRow {
  id: string;
  bulan: number | string;
  tahun: number | string;
  periode_label?: string | null;
  nama_periode?: string | null;
  tanggal_cutoff_mulai?: string | null;
  tanggal_cutoff_selesai?: string | null;
  tanggal_mulai_bayar?: string | null;
  is_active?: boolean | number | string | null;
  status_global?: string | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

export type PeriodePenggajianRow = SupabasePeriodePenggajianRow;

// Standard Supabase Database Schema Contract
export interface SupabaseDatabaseSchema {
  public: {
    Tables: {
      pegawai: {
        Row: SupabasePegawaiRow;
        Insert: Partial<SupabasePegawaiRow> | any;
        Update: Partial<SupabasePegawaiRow> | any;
        Relationships: [];
      };
      slip_gaji: {
        Row: SupabaseSlipGajiRow;
        Insert: Partial<SupabaseSlipGajiRow> | any;
        Update: Partial<SupabaseSlipGajiRow> | any;
        Relationships: [];
      };
      presensi_harian_jp: {
        Row: SupabasePresensiHarianRow;
        Insert: Partial<SupabasePresensiHarianRow> | any;
        Update: Partial<SupabasePresensiHarianRow> | any;
        Relationships: [];
      };
      guru_inval: {
        Row: SupabaseGuruInvalRow;
        Insert: Partial<SupabaseGuruInvalRow> | any;
        Update: Partial<SupabaseGuruInvalRow> | any;
        Relationships: [];
      };
      rekap_presensi: {
        Row: SupabaseRekapPresensiRow;
        Insert: Partial<SupabaseRekapPresensiRow> | any;
        Update: Partial<SupabaseRekapPresensiRow> | any;
        Relationships: [];
      };
      periode_penggajian: {
        Row: SupabasePeriodePenggajianRow;
        Insert: Partial<SupabasePeriodePenggajianRow> | any;
        Update: Partial<SupabasePeriodePenggajianRow> | any;
        Relationships: [];
      };
      pengajuan_cuti_izin: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      lembur_pegawai: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      jadwal_pelajaran: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      email_logs: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      audit_logs: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Defensive Transformation Helper Utilities
export function safeNumber(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

export function safeString(val: unknown, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

export function safeBoolean(val: unknown, fallback: boolean = false): boolean {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'boolean') return val;
  if (val === 1 || val === '1' || val === 'true') return true;
  if (val === 0 || val === '0' || val === 'false') return false;
  return fallback;
}

export function safeArray<T>(val: unknown, fallback: T[] = []): T[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}
