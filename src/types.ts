export type UserRole = 
  | 'super_admin' 
  | 'kepala_sekolah' 
  | 'ketua_yayasan' 
  | 'bendahara_yayasan' 
  | 'pegawai';

export type StatusPegawai = 'GTY' | 'GTT' | 'PTY' | 'PTT';

export type StatusPenggajian = 
  | 'draft' 
  | 'pending_kepsek' 
  | 'pending_yayasan' 
  | 'approved' 
  | 'transferred' 
  | 'rejected';

export type StatusKehadiranHarian =
  | 'hadir_tepat_waktu'
  | 'terlambat'
  | 'izin_terlambat'
  | 'pulang_cepat'
  | 'izin_resmi'
  | 'izin_pribadi'
  | 'sakit_skd'
  | 'sakit_tanpa_skd'
  | 'cuti_tahunan'
  | 'cuti_khusus'
  | 'libur_sekolah'
  | 'dinas_luar'
  | 'pelatihan'
  | 'alpha'
  | 'bukan_hari_kerja';

export type MetodePresensi = 
  | 'biometric_fingerprint'
  | 'face_recognition'
  | 'rfid_card'
  | 'mobile_gps'
  | 'manual_admin';

export type JenisCutiIzin = 
  | 'cuti_tahunan'
  | 'cuti_melahirkan'
  | 'cuti_ibadah'
  | 'izin_dinas_luar'
  | 'pelatihan'
  | 'izin_pribadi'
  | 'sakit_skd'
  | 'sakit_tanpa_skd';

export type KategoriLembur = 
  | 'perawatan_lab_it'
  | 'bimbingan_lks_ukk'
  | 'kegiatan_sekolah'
  | 'ekskul_robotik'
  | 'admin_dapodik';

export interface User {
  id: string;
  username: string;
  nama: string;
  email: string;
  role: UserRole;
  jabatan: string;
  pegawaiId?: string;
  avatarUrl?: string;
}

export interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  email: string;
  noHp: string;
  statusPegawai: StatusPegawai;
  jabatanUtama: string;
  jabatanTambahan?: string[]; // e.g. ['Wali Kelas XII RPL', 'Kepala Bengkel TKJ']
  pendidikanTerakhir: string;
  tanggalMasuk: string;
  namaBank: string;
  nomorRekening: string; // Encrypted in storage
  atasNamaRekening: string;
  npwp?: string;
  niy?: string;
  nik?: string;
  nuptk?: string;
  jenisKelamin?: 'L' | 'P';
  tempatLahir?: string;
  tanggalLahir?: string;
  usia?: string;
  jurusan?: string;
  tmt?: string;
  masaKerja?: string;
  statusInduk?: 'Induk' | 'Non Induk' | string;
  keteranganInduk?: string;
  gajiPokokDefault: number;
  tunjanganJabatanDefault: number;
  // Detail Jabatan Struktural
  tunjanganKepsekDefault?: number; // KS: 1.200.000
  tunjanganWakasekDefault?: number; // WKS: 500.000
  tunjanganItOfficerDefault?: number; // IT: 300.000 / 600.000
  tunjanganDkmDefault?: number; // DKM: 500.000
  tunjanganAsramaDefault?: number; // Asrama: 250.000
  tunjanganBendaharaDefault?: number; // BD: 600.000
  tunjanganPjDefault?: number; // PJ: 300.000 / 600.000
  // Detail Kualifikasi & Kompetensi
  tunjanganIjazahJenjang?: 'SMA' | 'D1' | 'D2' | 'D3' | 'S1' | 'S2' | 'S3';
  tunjanganIjazahDefault?: number; // SMA: 200rb, D1: 225rb, D2: 250rb, D3: 275rb, S1: 300rb, S2: 500rb, S3: 500rb
  isLinierKompetensi?: boolean; // Rp 50.000 jika linier
  tahunPengalaman?: number; // Rp 50.000 / tahun
  tahunMasaKerja?: number; // Rp 50.000 / tahun di IQM
  tunjanganKinerjaDefault?: number; // Tunjangan Kinerja bulanan
  // Tarif Standar
  tarifPerJamMengajar: number; // e.g. Rp 18.000 / JP
  tarifTransportHarian: number; // e.g. Rp 20.000 / hari (25 hari = 500.000)
  tarifLemburPerJam: number; // e.g. Rp 35.000 - Rp 50.000 / jam
  tunjanganKeluarga: number;
  tunjanganWaliKelas: number; // Rp 300.000
  tunjanganKhususVokasi: number; // Tunjangan Sertifikasi / Kompetensi IT
  potonganBpjsKesehatan: number;
  potonganBpjsKetenagakerjaan: number;
  potonganKasSekolah: number;
  isActive: boolean;
}

export interface LogPresensiHarian {
  id: string;
  pegawaiId: string;
  tanggal: string; // YYYY-MM-DD
  jamMasuk: string; // HH:mm:ss
  jamKeluar?: string; // HH:mm:ss
  status: StatusKehadiranHarian;
  menitTerlambat: number;
  menitPulangCepat: number;
  jamLembur: number;
  jamMengajarHariIni?: number;
  metode: MetodePresensi;
  lokasiTerminal: string; // e.g. 'Terminal RFID Gerbang Utama' | 'Mesin Fingerprint Lab RPL'
  keterangan?: string;
  fotoBuktiUrl?: string;
  isVerified: boolean;
}

export interface PengajuanCutiIzin {
  id: string;
  pegawaiId: string;
  pegawaiNama: string;
  jenis: JenisCutiIzin;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  lampiranDokumenUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  catatanApproval?: string;
  berdampakPotonganGaji: boolean; // True jika cuti di luar tanggungan atau izin tanpa SKD
  createdAt: string;
}

export interface LemburPegawai {
  id: string;
  pegawaiId: string;
  pegawaiNama: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  durasiJam: number;
  kategori: KategoriLembur;
  deskripsiTugas: string;
  tarifPerJam: number;
  totalHonor: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  catatan?: string;
  createdAt: string;
}

export interface LogInfal {
  id: string;
  tanggal: string; // YYYY-MM-DD
  guruDigantikanId: string; // Guru yang berhalangan hadir
  guruDigantikanNama: string;
  guruAbsenId?: string; // Alias kompatibilitas
  guruAbsenNama?: string;
  guruPenggantiId: string; // Guru yang menggantikan mengajar
  guruPenggantiNama: string;
  kelas: string; // e.g. "X RPL 1", "XI TKJ", "XII RPL"
  mataPelajaran: string;
  jamKe?: string; // e.g. "Jam 1-2 (07.30 - 09.00)"
  jumlahJp: number; // Jumlah Jam Pelajaran yang digantikan
  tarifPerJp: number; // Default: 7500 (Rp 7.500/JP)
  totalNominal: number; // jumlahJp * tarifPerJp
  alasan: string; // "Sakit", "Izin Dinas Luar", "Cuti Tahunan", etc.
  alasanAbsen?: string; // Alias kompatibilitas
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  catatan?: string;
  createdAt: string;
}

export interface RekapPresensi {
  id: string;
  pegawaiId: string;
  bulan: number; // 1 - 12
  tahun: number;
  tanggalCutoffMulai?: string; // e.g. "2026-07-23"
  tanggalCutoffSelesai?: string; // e.g. "2026-08-22"
  periodeCutoffLabel?: string; // e.g. "23 Juli 2026 s/d 22 Agustus 2026"
  totalHariEfektif: number;
  hadir: number;
  sakit: number;
  izin: number;
  cuti: number;
  dinasLuar: number;
  alpha: number;
  menitTerlambat: number;
  jamMengajarRencana: number; // Total Jam Tatap Muka
  jamMengajarRealisasi: number; // Jam Mengajar Aktual
  jamLemburTotal: number;
  honorLemburTotal: number;
  jumlahJpMenggantikan?: number; // Total JP menggantikan guru lain (Infal Masuk)
  honorInfalTotal?: number; // Honor Infal = JP Menggantikan x 7.500
  jumlahJpDigantikan?: number; // Total JP berhalangan yang digantikan guru lain (Infal Keluar)
  potonganInfalTotal?: number; // Potongan Infal = JP Digantikan x 7.500
  insentifKajianMuslimah?: number; // Insentif Kajian Muslimah
  potonganIzinTidakResmi: number;
  catatan?: string;
  updatedAt: string;
}

export interface KomponenRincian {
  nama: string;
  kategori: 'penerimaan' | 'potongan';
  keterangan?: string;
  nominal: number;
}

export interface PenggajianRecord {
  id: string;
  kodeSlip: string; // e.g. SLIP/2026/08/IQM-001
  pegawaiId: string;
  pegawaiNama: string;
  pegawaiNip: string;
  pegawaiJabatan: string;
  pegawaiStatus: StatusPegawai;
  pegawaiEmail: string;
  bulan: number;
  tahun: number;
  periodeLabel: string; // "Agustus 2026"
  
  // Cutoff & Payment Schedule
  // Regulasi: Data presensi/JP dihitung tgl 23 bulan lalu s/d tgl 22 bulan berjalan, dibayarkan mulai tgl 25
  tanggalCutoffMulai?: string; // "2026-07-23"
  tanggalCutoffSelesai?: string; // "2026-08-22"
  tanggalMulaiBayar?: string; // "2026-08-25"
  periodeCutoffLabel?: string; // "23 Juli 2026 s/d 22 Agustus 2026"
  
  // Status Induk
  statusInduk?: 'Induk' | 'Non Induk' | string;
  keteranganInduk?: string;

  // Data Kehadiran Terintegrasi
  presensiHadir: number;
  presensiAlpha: number;
  presensiIzin: number;
  presensiSakit: number;
  presensiCuti: number;
  presensiDinasLuar: number;
  presensiTerlambatMenit: number;
  jamMengajarRealisasi: number;
  jamLembur: number;
  
  // Rincian Penerimaan Sesuai Dokumen Resmi
  gajiPokok: number;
  gajiPokokNominal?: number; // Alias gaji_pokok_nominal
  tunjanganJabatan: number; // Total Tunjangan Jabatan
  tunjanganKepsek?: number; // KS (tunjangan_kepsek)
  tunjanganWakasek?: number; // WKS (tunjangan_wakasek)
  tunjanganWaliKelas?: number; // WK (tunjangan_wali_kelas)
  tunjanganItOfficer?: number; // IT
  tunjanganDkm?: number; // DKM
  tunjanganAsrama?: number; // Asrama (tunjangan_asrama)
  tunjanganBendahara?: number; // BD
  tunjanganPj?: number; // PJ
  tunjanganIjazahJenjang?: string; // S2, S1, D3, SMA, etc
  tunjanganIjazah?: number; // Nilai Ijazah
  isLinierKompetensi?: boolean; // Checkbox Linier
  tunjanganKompetensi?: number; // Rp 50.000 jika linier
  tahunPengalaman?: number; // Tahun Pengalaman
  tunjanganPengalaman?: number; // Tahun x Rp 50.000
  tahunMasaKerja?: number; // Tahun Masa Kerja (TMK)
  tunjanganMasaKerja?: number; // Tahun x Rp 50.000
  tunjanganKinerja?: number; // Kinerja
  tunjanganKehadiran: number; // Hadir x Rp 20.000 (tunjangan_kehadiran)
  tunjanganKehadiranTransport?: number; // Backward-compat
  
  // JP Mengajar & Inval
  jumlahJp?: number; // jumlah_jp (alias jamMengajarRealisasi)
  nominalPerJp?: number; // nominal_per_jp (e.g. 18.000 / 25.000)
  totalHonorJp?: number; // total_honor_jp = jumlah_jp * nominal_per_jp
  honorJamMengajar?: number; // Jam Mengajar x Tarif JP
  honorLembur?: number; // Jam Lembur x Tarif Lembur
  honorInfal?: number; // Tambahan Mengganti JP (honor_inval)
  honorInval?: number; // Alias honor_inval
  jpMenggantikan?: number; // Jumlah JP Menggantikan
  insentifKajianMuslimah?: number; // Tambahan Insentif Kajian Muslimah
  koreksiPenerimaan?: number; // Koreksi Tambahan Penerimaan
  tambahanLainnya?: number; // tambahan_lainnya (Workshop / Lainnya)
  tunjanganVokasiIT?: number;
  tunjanganLainnya?: number;
  totalTambahan?: number; // total_tambahan (Bruto)
  totalPenerimaan: number;
  
  // Rincian Potongan Sesuai Dokumen Resmi
  potonganTerlambat?: number; // potongan_terlambat
  potonganKeterlambatan?: number; // Denda Terlambat (Rupiah)
  potonganKas?: number; // potongan_kas (Kas / Pinjaman)
  potonganTidakMasuk?: number; // Tidak Masuk (Hari x Rp 20.000)
  potonganAlpha?: number; // Backward-compat
  potonganIzin?: number; // Potongan izin pribadi/tanpa SKD
  potonganInfal?: number; // Potongan Diganti JP (JP x Rp 7.500)
  jpDigantikan?: number; // Jumlah JP Digantikan
  koreksiPotongan?: number; // Koreksi Pengurang
  potonganPinjaman?: number; // Pinjaman
  potonganBpjsKesehatan?: number;
  potonganBpjsKetenagakerjaan?: number;
  potonganKasSekolah?: number;
  potonganKoperasi?: number;
  potonganLainnya?: number; // potongan_lainnya
  totalPotongan: number; // total_potongan
  
  // Take Home Pay
  takeHomePay?: number; // take_home_pay (alias gajiBersih)
  gajiBersih: number;

  
  // Status Approval & Transaksi
  status: StatusPenggajian;
  
  // Approval metadata
  approvedKepsekBy?: string;
  approvedKepsekAt?: string;
  catatanKepsek?: string;
  
  approvedYayasanBy?: string;
  approvedYayasanAt?: string;
  catatanYayasan?: string;
  
  rejectedBy?: string;
  rejectedAt?: string;
  catatanPenolakan?: string;
  
  // Transfer metadata
  transferredBy?: string;
  transferredAt?: string;
  nomorReferensiTransfer?: string;
  buktiTransferUrl?: string;
  
  // Email notification metadata
  emailSent?: boolean;
  emailSentAt?: string;
  emailRecipient?: string;
  
  // Security & Encryption metadata
  isEncrypted: boolean;
  securityChecksum: string; // SHA-256 checksum for tamper detection
  qrVerificationUrl: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface EmailLog {
  id: string;
  penggajianId: string;
  kodeSlip: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'queued' | 'failed';
  messagePreview: string;
}

export interface DashboardStats {
  totalGajiBulanIni: number;
  totalPenerimaanKotor: number;
  totalPotongan: number;
  totalPegawai: number;
  totalGuru: number;
  totalTendik: number;
  countDraft: number;
  countPendingKepsek: number;
  countPendingYayasan: number;
  countApproved: number;
  countTransferred: number;
  persentaseSelesai: number;
  totalJamMengajarTerbayar: number;
  totalJamLemburTerbayar: number;
  totalCutiIzinBulanIni: number;
  totalMenitTerlambatBulanIni: number;
  encryptionSecurityScore: number;
}

export type HariJadwal = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';

export interface GuruInitialMap {
  kode: string;
  nama: string;
  pegawaiId?: string;
  mataPelajaranUtama: string;
  warnaBadge: string;
}

export interface SlotJadwalPelajaran {
  id: string;
  hari: HariJadwal;
  jamKe: string; // 'Pagi-1' | 'Pagi-2' | '1' | '2' | '3A' | '3B' | '4' | '5' | '6' | '7' | '8' | '9'
  rentangWaktu: string; // '07:40 - 08:20'
  kelas: string; // '10-A' | '10-B' | '11-A' | '11-B' | '12-A' | '12-B' | '7-A' | etc.
  mataPelajaran: string;
  kodeGuru: string; // e.g. 'KH'
  guruNama: string;
  pegawaiId?: string;
  ruang?: string;
  isIstirahat?: boolean; // Diset sebagai waktu istirahat (TIDAK dihitung JP)
  isNonAkademik?: boolean; // Upacara / Sholat / Dhuha / Al-Kahfi
  tipeSlot?: 'pelajaran' | 'istirahat'; // Default: 'pelajaran'
  kategoriIstirahat?: 'istirahat_makan' | 'sholat_dhuha' | 'sholat_dhuhur' | 'sholat_jumat' | 'dzikir_ibadah' | 'upacara_apel' | 'kegiatan_lain';
}

export interface SystemBackupData {
  appName: string;
  version: string;
  exportTimestamp: string;
  exportedBy: {
    id: string;
    nama: string;
    role: string;
  };
  statsSummary: {
    totalPegawai: number;
    totalPresensiRekap: number;
    totalPresensiHarian: number;
    totalGajiRecords: number;
    totalJadwalSlots: number;
    totalInfal: number;
    totalCuti: number;
    totalLembur: number;
    totalEmailLogs: number;
  };
  data: {
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
  };
}

export type AuditCategory = 'gaji' | 'approval' | 'presensi' | 'pegawai' | 'jadwal' | 'sistem';

export type AuditActionType =
  | 'APPROVAL_KEPSEK'
  | 'APPROVAL_YAYASAN'
  | 'TRANSFER_BENDAHARA'
  | 'RECALCULATE_PAYROLL'
  | 'BATCH_APPROVE'
  | 'UPDATE_PRESENSI'
  | 'SYNC_PRESENSI'
  | 'UPDATE_PEGAWAI'
  | 'ADD_PEGAWAI'
  | 'UPDATE_SCHEDULE'
  | 'ADD_INFAL'
  | 'UPDATE_LEAVE'
  | 'UPDATE_OVERTIME'
  | 'EXPORT_BACKUP'
  | 'IMPORT_BACKUP'
  | 'RESET_SYSTEM'
  | 'LOGIN_SUCCESS'
  | 'LOGOUT'
  | 'AUTO_LOGOUT_TIMEOUT';


export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  category: AuditCategory;
  action: AuditActionType;
  actionLabel: string;
  target: string;
  details: string;
  ipAddress?: string;
}

