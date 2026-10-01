/**
 * DDL Schema Database SQL (PostgreSQL & MySQL Compatible)
 * Sistem Informasi Manajemen Penggajian (SIM GAJI)
 * SMK IT Ibnul Qayyim Makassar
 */

export const POSTGRESQL_DDL_SCHEMA = `-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN PENGGAJIAN (SIM GAJI)
-- INSTITUSI: SMK IT IBNUL QAYYIM MAKASSAR
-- TARGET RDBMS: PostgreSQL 14+ / 16+
-- FITUR: Multi-Role Workflow, Presensi Biometrik, Cuti/Izin/Lembur, Enkripsi AES-256
-- ============================================================================

-- 1. ENUM TYPES
CREATE TYPE role_user_enum AS ENUM (
    'super_admin',
    'kepala_sekolah',
    'ketua_yayasan',
    'bendahara_yayasan',
    'pegawai'
);

CREATE TYPE status_pegawai_enum AS ENUM (
    'GTY', -- Guru Tetap Yayasan
    'GTT', -- Guru Tidak Tetap
    'PTY', -- Pegawai Tetap Yayasan
    'PTT'  -- Pegawai Tidak Tetap
);

CREATE TYPE status_penggajian_enum AS ENUM (
    'draft',
    'pending_kepsek',
    'pending_yayasan',
    'approved',
    'transferred',
    'rejected'
);

CREATE TYPE status_kehadiran_enum AS ENUM (
    'hadir_tepat_waktu',
    'terlambat',
    'izin_terlambat',
    'pulang_cepat',
    'izin_resmi',
    'izin_pribadi',
    'sakit_skd',
    'sakit_tanpa_skd',
    'cuti_tahunan',
    'cuti_khusus',
    'libur_sekolah',
    'dinas_luar',
    'pelatihan',
    'alpha',
    'bukan_hari_kerja'
);

CREATE TYPE metode_presensi_enum AS ENUM (
    'biometric_fingerprint',
    'face_recognition',
    'rfid_card',
    'mobile_gps',
    'manual_admin'
);

CREATE TYPE jenis_cuti_izin_enum AS ENUM (
    'cuti_tahunan',
    'cuti_melahirkan',
    'cuti_ibadah',
    'izin_dinas_luar',
    'pelatihan',
    'izin_pribadi',
    'sakit_skd',
    'sakit_tanpa_skd'
);

CREATE TYPE kategori_lembur_enum AS ENUM (
    'perawatan_lab_it',
    'bimbingan_lks_ukk',
    'kegiatan_sekolah',
    'ekskul_robotik',
    'admin_dapodik'
);

CREATE TYPE kategori_komponen_enum AS ENUM (
    'penerimaan',
    'potongan'
);

-- ============================================================================
-- 2. TABEL USERS (Autentikasi & Otorisasi Berbasis Role)
-- ============================================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    role role_user_enum NOT NULL DEFAULT 'pegawai',
    pegawai_id VARCHAR(36),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 3. TABEL PEGAWAI (Master Biodata, Status Karyawan & Skema Default)
-- ============================================================================
CREATE TABLE pegawai (
    id VARCHAR(36) PRIMARY KEY,
    nip VARCHAR(25) NOT NULL UNIQUE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    no_hp VARCHAR(20) NOT NULL,
    status_pegawai status_pegawai_enum NOT NULL DEFAULT 'GTT',
    jabatan_utama VARCHAR(100) NOT NULL,
    jabatan_tambahan TEXT[], -- e.g. ARRAY['Wali Kelas XII RPL', 'Kepala Bengkel']
    pendidikan_terakhir VARCHAR(50) NOT NULL,
    tanggal_masuk DATE NOT NULL,
    
    -- Informasi Rekening (Dapat Dienkripsi dengan AES-256 / pgcrypto)
    nama_bank VARCHAR(50) NOT NULL,
    nomor_rekening_encrypted BYTEA NOT NULL, -- Kolom Terenkripsi
    nomor_rekening_masked VARCHAR(20) NOT NULL, -- Masking e.g. 7108****481
    atas_nama_rekening VARCHAR(150) NOT NULL,
    npwp VARCHAR(30),
    
    -- Tarif Dasar & Default Allowance
    gaji_pokok_default DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_jabatan_default DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    tarif_per_jam_mengajar DECIMAL(14, 2) NOT NULL DEFAULT 45000.00, -- Honor per Jam Tatap Muka
    tarif_transport_harian DECIMAL(14, 2) NOT NULL DEFAULT 25000.00, -- Tunjangan Kehadiran per Hari Hadir
    tarif_lembur_per_jam DECIMAL(14, 2) NOT NULL DEFAULT 20000.00, -- Honor per Jam Lembur
    tunjangan_keluarga DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_wali_kelas DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_khusus_vokasi DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- Sertifikasi Keahlian IT / Asesor
    
    -- Potongan Tetap
    potongan_bpjs_kesehatan DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_ketenagakerjaan DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    potongan_kas_sekolah DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pegawai_nip ON pegawai(nip);
CREATE INDEX idx_pegawai_status ON pegawai(status_pegawai);
CREATE INDEX idx_pegawai_jabatan ON pegawai(jabatan_utama);

-- ============================================================================
-- 4. TABEL LOG_PRESENSI_HARIAN (Data Log Raw Mesin Biometrik & Tap RFID)
-- ============================================================================
CREATE TABLE log_presensi_harian (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    tanggal DATE NOT NULL,
    jam_masuk TIME NOT NULL,
    jam_keluar TIME,
    status status_kehadiran_enum NOT NULL DEFAULT 'hadir_tepat_waktu',
    menit_terlambat INTEGER NOT NULL DEFAULT 0,
    menit_pulang_cepat INTEGER NOT NULL DEFAULT 0,
    jam_lembur DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    metode metode_presensi_enum NOT NULL DEFAULT 'biometric_fingerprint',
    lokasi_terminal VARCHAR(100) NOT NULL,
    keterangan TEXT,
    foto_bukti_url VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_presensi_harian_pegawai UNIQUE (pegawai_id, tanggal)
);

CREATE INDEX idx_presensi_harian_tgl ON log_presensi_harian(tanggal);
CREATE INDEX idx_presensi_harian_pegawai ON log_presensi_harian(pegawai_id);

-- ============================================================================
-- 5. TABEL PENGAJUAN_CUTI_IZIN (Workflow Cuti, Sakit SKD, dan Izin Dinas)
-- ============================================================================
CREATE TABLE pengajuan_cuti_izin (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    jenis jenis_cuti_izin_enum NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jumlah_hari SMALLINT NOT NULL DEFAULT 1,
    alasan TEXT NOT NULL,
    lampiran_dokumen_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    catatan_approval TEXT,
    berdampak_potongan_gaji BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cuti_pegawai ON pengajuan_cuti_izin(pegawai_id);
CREATE INDEX idx_cuti_status ON pengajuan_cuti_izin(status);

-- ============================================================================
-- 6. TABEL LEMBUR_PEGAWAI (Klaim & Penugasan Jam Lembur Guru/Tendik)
-- ============================================================================
CREATE TABLE lembur_pegawai (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    durasi_jam DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    kategori kategori_lembur_enum NOT NULL,
    deskripsi_tugas TEXT NOT NULL,
    tarif_per_jam DECIMAL(14, 2) NOT NULL,
    total_honor DECIMAL(14, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lembur_pegawai ON lembur_pegawai(pegawai_id);
CREATE INDEX idx_lembur_tanggal ON lembur_pegawai(tanggal);

-- ============================================================================
-- 7. TABEL REKAP_PRESENSI (Agregasi Bulanan untuk Sinkronisasi Penggajian)
-- ============================================================================
CREATE TABLE rekap_presensi (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    bulan SMALLINT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun SMALLINT NOT NULL CHECK (tahun >= 2020),
    total_hari_efektif SMALLINT NOT NULL DEFAULT 22,
    hadir SMALLINT NOT NULL DEFAULT 0,
    sakit SMALLINT NOT NULL DEFAULT 0,
    izin SMALLINT NOT NULL DEFAULT 0,
    cuti SMALLINT NOT NULL DEFAULT 0,
    dinas_luar SMALLINT NOT NULL DEFAULT 0,
    alpha SMALLINT NOT NULL DEFAULT 0,
    menit_terlambat INTEGER NOT NULL DEFAULT 0,
    jam_mengajar_rencana INTEGER NOT NULL DEFAULT 0,
    jam_mengajar_realisasi INTEGER NOT NULL DEFAULT 0, -- Realisasi Jam Tatap Muka
    jam_lembur_total DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    honor_lembur_total DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    potongan_izin_tidak_resmi DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    catatan_absensi TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_presensi_pegawai_periode UNIQUE (pegawai_id, bulan, tahun)
);

CREATE INDEX idx_presensi_periode ON rekap_presensi(tahun, bulan);
CREATE INDEX idx_presensi_pegawai ON rekap_presensi(pegawai_id);

-- ============================================================================
-- 8. TABEL PENGGAJIAN (Payroll Header, Approval Multitier & Status)
-- ============================================================================
CREATE TABLE penggajian (
    id VARCHAR(36) PRIMARY KEY,
    kode_slip VARCHAR(50) NOT NULL UNIQUE, -- e.g. SLIP/2026/08/IQM-001
    pegawai_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    rekap_presensi_id VARCHAR(36) REFERENCES rekap_presensi(id) ON DELETE SET NULL,
    bulan SMALLINT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun SMALLINT NOT NULL CHECK (tahun >= 2020),
    periode_label VARCHAR(50) NOT NULL, -- e.g. "Agustus 2026"
    tanggal_cutoff_mulai DATE NOT NULL, -- Cut-off: tgl 23 bulan lalu (e.g. "2026-07-23")
    tanggal_cutoff_selesai DATE NOT NULL, -- Cut-off: tgl 22 bulan berjalan (e.g. "2026-08-22")
    tanggal_mulai_bayar DATE NOT NULL, -- Jadwal pencairan: tgl 25 bulan berjalan (e.g. "2026-08-25")
    
    -- Snapshot Presensi Terintegrasi
    presensi_hadir SMALLINT NOT NULL DEFAULT 0,
    presensi_alpha SMALLINT NOT NULL DEFAULT 0,
    presensi_izin SMALLINT NOT NULL DEFAULT 0,
    presensi_sakit SMALLINT NOT NULL DEFAULT 0,
    presensi_cuti SMALLINT NOT NULL DEFAULT 0,
    presensi_dinas_luar SMALLINT NOT NULL DEFAULT 0,
    presensi_terlambat_menit INTEGER NOT NULL DEFAULT 0,
    jam_mengajar_realisasi INTEGER NOT NULL DEFAULT 0,
    jam_lembur DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    
    -- Rangkuman Komponen Keuangan
    honor_jam_mengajar DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    honor_lembur DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_kehadiran_transport DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    potongan_keterlambatan DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    potongan_alpha DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    potongan_izin DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_penerimaan DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_potongan DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    gaji_bersih DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- THP = Total Penerimaan - Total Potongan
    
    -- Workflow & Multi-Tier Approval
    status status_penggajian_enum NOT NULL DEFAULT 'draft',
    
    -- Approval Level 1: Kepala Sekolah
    approved_kepsek_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    approved_kepsek_at TIMESTAMP WITH TIME ZONE,
    catatan_kepsek TEXT,
    
    -- Approval Level 2: Ketua Yayasan
    approved_yayasan_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    approved_yayasan_at TIMESTAMP WITH TIME ZONE,
    catatan_yayasan TEXT,
    
    -- Penolakan (Jika Ada)
    rejected_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    catatan_penolakan TEXT,
    
    -- Transfer Eksekusi Bendahara Yayasan
    transferred_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    transferred_at TIMESTAMP WITH TIME ZONE,
    nomor_referensi_transfer VARCHAR(100),
    bukti_transfer_url VARCHAR(255),
    
    -- Notifikasi Email
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Enkripsi & Integritas Dokumen (Anti-Tampering)
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    security_checksum VARCHAR(128) NOT NULL, -- SHA-256 HMAC Payload Checksum
    qr_verification_url VARCHAR(255) NOT NULL,
    
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_penggajian_pegawai_periode UNIQUE (pegawai_id, bulan, tahun)
);

CREATE INDEX idx_penggajian_periode ON penggajian(tahun, bulan);
CREATE INDEX idx_penggajian_status ON penggajian(status);
CREATE INDEX idx_penggajian_pegawai ON penggajian(pegawai_id);

-- ============================================================================
-- 9. TABEL PENGGAJIAN_DETAIL (Rincian Item Penerimaan & Potongan)
-- ============================================================================
CREATE TABLE penggajian_detail (
    id VARCHAR(36) PRIMARY KEY,
    penggajian_id VARCHAR(36) NOT NULL REFERENCES penggajian(id) ON DELETE CASCADE,
    nama_komponen VARCHAR(100) NOT NULL,
    kategori kategori_komponen_enum NOT NULL,
    nominal DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    keterangan VARCHAR(255), -- e.g. "34 JP x Rp 45.000", "Lembur 5 Jam", "Denda 1 Alpha"
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_penggajian_detail_parent ON penggajian_detail(penggajian_id);

-- ============================================================================
-- 10. TABEL EMAIL_NOTIFICATIONS (Audit Log Pengiriman Slip Gaji Digital)
-- ============================================================================
CREATE TABLE email_notifications (
    id VARCHAR(36) PRIMARY KEY,
    penggajian_id VARCHAR(36) NOT NULL REFERENCES penggajian(id) ON DELETE CASCADE,
    recipient_email VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    message_preview TEXT
);

CREATE INDEX idx_email_logs_penggajian ON email_notifications(penggajian_id);

-- ============================================================================
-- 11. TABEL LOG_INFAL (Guru Pengganti - Penyesuaian Honor Rp 7.500 / JP)
-- ============================================================================
-- Logika: Guru yang absen jam mengajarnya dipotong Rp 7.500/JP,
-- dan dialihkan sebagai tambahan honor bagi guru yang menggantikan.
CREATE TABLE log_infal (
    id VARCHAR(36) PRIMARY KEY,
    tanggal DATE NOT NULL,
    guru_absen_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    guru_absen_nama VARCHAR(150) NOT NULL,
    guru_pengganti_id VARCHAR(36) NOT NULL REFERENCES pegawai(id) ON DELETE RESTRICT,
    guru_pengganti_nama VARCHAR(150) NOT NULL,
    mata_pelajaran VARCHAR(100) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    jumlah_jp SMALLINT NOT NULL CHECK (jumlah_jp > 0),
    tarif_per_jp DECIMAL(14, 2) NOT NULL DEFAULT 7500.00,
    total_nominal DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- jumlah_jp * tarif_per_jp
    alasan_absen VARCHAR(100) NOT NULL,
    catatan TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'approved', -- pending, approved, rejected
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_infal_tanggal ON log_infal(tanggal);
CREATE INDEX idx_infal_guru_absen ON log_infal(guru_absen_id);
CREATE INDEX idx_infal_guru_pengganti ON log_infal(guru_pengganti_id);
`;

export const MYSQL_DDL_SCHEMA = `-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN PENGGAJIAN (SIM GAJI) - MySQL 8.0+
-- INSTITUSI: SMK IT IBNUL QAYYIM MAKASSAR
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    role ENUM('super_admin', 'kepala_sekolah', 'ketua_yayasan', 'bendahara_yayasan', 'pegawai') NOT NULL DEFAULT 'pegawai',
    pegawai_id VARCHAR(36),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pegawai (
    id VARCHAR(36) PRIMARY KEY,
    nip VARCHAR(25) NOT NULL UNIQUE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    no_hp VARCHAR(20) NOT NULL,
    status_pegawai ENUM('GTY', 'GTT', 'PTY', 'PTT') NOT NULL DEFAULT 'GTT',
    jabatan_utama VARCHAR(100) NOT NULL,
    jabatan_tambahan JSON NULL,
    pendidikan_terakhir VARCHAR(50) NOT NULL,
    tanggal_masuk DATE NOT NULL,
    nama_bank VARCHAR(50) NOT NULL,
    nomor_rekening_encrypted BLOB NOT NULL,
    nomor_rekening_masked VARCHAR(20) NOT NULL,
    atas_nama_rekening VARCHAR(150) NOT NULL,
    npwp VARCHAR(30) NULL,
    gaji_pokok_default DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tunjangan_jabatan_default DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tarif_per_jam_mengajar DECIMAL(14,2) NOT NULL DEFAULT 45000.00,
    tarif_transport_harian DECIMAL(14,2) NOT NULL DEFAULT 25000.00,
    tarif_lembur_per_jam DECIMAL(14,2) NOT NULL DEFAULT 20000.00,
    tunjangan_keluarga DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tunjangan_wali_kelas DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tunjangan_khusus_vokasi DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_kesehatan DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_ketenagakerjaan DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_kas_sekolah DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pegawai_nip (nip),
    INDEX idx_pegawai_status (status_pegawai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS log_presensi_harian (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk TIME NOT NULL,
    jam_keluar TIME NULL,
    status ENUM('hadir_tepat_waktu', 'terlambat', 'izin_terlambat', 'pulang_cepat', 'izin_resmi', 'izin_pribadi', 'sakit_skd', 'sakit_tanpa_skd', 'cuti_tahunan', 'cuti_khusus', 'libur_sekolah', 'dinas_luar', 'pelatihan', 'alpha', 'bukan_hari_kerja') NOT NULL DEFAULT 'hadir_tepat_waktu',
    menit_terlambat INT NOT NULL DEFAULT 0,
    menit_pulang_cepat INT NOT NULL DEFAULT 0,
    jam_lembur DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    metode ENUM('biometric_fingerprint', 'face_recognition', 'rfid_card', 'mobile_gps', 'manual_admin') NOT NULL DEFAULT 'biometric_fingerprint',
    lokasi_terminal VARCHAR(100) NOT NULL,
    keterangan TEXT NULL,
    foto_bukti_url VARCHAR(255) NULL,
    is_verified TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_presensi_harian_pegawai (pegawai_id, tanggal),
    CONSTRAINT fk_log_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pengajuan_cuti_izin (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL,
    jenis ENUM('cuti_tahunan', 'cuti_melahirkan', 'cuti_ibadah', 'izin_dinas_luar', 'pelatihan', 'izin_pribadi', 'sakit_skd', 'sakit_tanpa_skd') NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jumlah_hari TINYINT NOT NULL DEFAULT 1,
    alasan TEXT NOT NULL,
    lampiran_dokumen_url VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(36) NULL,
    approved_at DATETIME NULL,
    catatan_approval TEXT NULL,
    berdampak_potongan_gaji TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuti_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lembur_pegawai (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    durasi_jam DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    kategori ENUM('perawatan_lab_it', 'bimbingan_lks_ukk', 'kegiatan_sekolah', 'ekskul_robotik', 'admin_dapodik') NOT NULL,
    deskripsi_tugas TEXT NOT NULL,
    tarif_per_jam DECIMAL(14,2) NOT NULL,
    total_honor DECIMAL(14,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(36) NULL,
    approved_at DATETIME NULL,
    catatan TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lembur_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rekap_presensi (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) NOT NULL,
    bulan TINYINT NOT NULL,
    tahun SMALLINT NOT NULL,
    total_hari_efektif TINYINT NOT NULL DEFAULT 22,
    hadir TINYINT NOT NULL DEFAULT 0,
    sakit TINYINT NOT NULL DEFAULT 0,
    izin TINYINT NOT NULL DEFAULT 0,
    cuti TINYINT NOT NULL DEFAULT 0,
    dinas_luar TINYINT NOT NULL DEFAULT 0,
    alpha TINYINT NOT NULL DEFAULT 0,
    menit_terlambat INT NOT NULL DEFAULT 0,
    jam_mengajar_rencana INT NOT NULL DEFAULT 0,
    jam_mengajar_realisasi INT NOT NULL DEFAULT 0,
    jam_lembur_total DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    honor_lembur_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_izin_tidak_resmi DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    catatan_absensi TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_presensi_pegawai_periode (pegawai_id, bulan, tahun),
    CONSTRAINT fk_presensi_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS penggajian (
    id VARCHAR(36) PRIMARY KEY,
    kode_slip VARCHAR(50) NOT NULL UNIQUE,
    pegawai_id VARCHAR(36) NOT NULL,
    rekap_presensi_id VARCHAR(36) NULL,
    bulan TINYINT NOT NULL,
    tahun SMALLINT NOT NULL,
    periode_label VARCHAR(50) NOT NULL,
    tanggal_cutoff_mulai DATE NOT NULL COMMENT 'Cut-off tgl 23 bulan lalu',
    tanggal_cutoff_selesai DATE NOT NULL COMMENT 'Cut-off tgl 22 bulan berjalan',
    tanggal_mulai_bayar DATE NOT NULL COMMENT 'Dibayarkan mulai tgl 25 bulan berjalan',
    presensi_hadir TINYINT NOT NULL DEFAULT 0,
    presensi_alpha TINYINT NOT NULL DEFAULT 0,
    presensi_izin TINYINT NOT NULL DEFAULT 0,
    presensi_sakit TINYINT NOT NULL DEFAULT 0,
    presensi_cuti TINYINT NOT NULL DEFAULT 0,
    presensi_dinas_luar TINYINT NOT NULL DEFAULT 0,
    presensi_terlambat_menit INT NOT NULL DEFAULT 0,
    jam_mengajar_realisasi INT NOT NULL DEFAULT 0,
    jam_lembur DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    honor_jam_mengajar DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    honor_lembur DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tunjangan_kehadiran_transport DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_keterlambatan DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_alpha DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    potongan_izin DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_penerimaan DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_potongan DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    gaji_bersih DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status ENUM('draft', 'pending_kepsek', 'pending_yayasan', 'approved', 'transferred', 'rejected') NOT NULL DEFAULT 'draft',
    approved_kepsek_by VARCHAR(36) NULL,
    approved_kepsek_at DATETIME NULL,
    catatan_kepsek TEXT NULL,
    approved_yayasan_by VARCHAR(36) NULL,
    approved_yayasan_at DATETIME NULL,
    catatan_yayasan TEXT NULL,
    rejected_by VARCHAR(36) NULL,
    rejected_at DATETIME NULL,
    catatan_penolakan TEXT NULL,
    transferred_by VARCHAR(36) NULL,
    transferred_at DATETIME NULL,
    nomor_referensi_transfer VARCHAR(100) NULL,
    bukti_transfer_url VARCHAR(255) NULL,
    email_sent TINYINT(1) NOT NULL DEFAULT 0,
    email_sent_at DATETIME NULL,
    is_encrypted TINYINT(1) NOT NULL DEFAULT 1,
    security_checksum VARCHAR(128) NOT NULL,
    qr_verification_url VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_penggajian_pegawai_periode (pegawai_id, bulan, tahun),
    CONSTRAINT fk_penggajian_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS penggajian_detail (
    id VARCHAR(36) PRIMARY KEY,
    penggajian_id VARCHAR(36) NOT NULL,
    nama_komponen VARCHAR(100) NOT NULL,
    kategori ENUM('penerimaan', 'potongan') NOT NULL,
    nominal DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    keterangan VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detail_penggajian FOREIGN KEY (penggajian_id) REFERENCES penggajian(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS log_infal (
    id VARCHAR(36) PRIMARY KEY,
    tanggal DATE NOT NULL,
    guru_absen_id VARCHAR(36) NOT NULL,
    guru_absen_nama VARCHAR(150) NOT NULL,
    guru_pengganti_id VARCHAR(36) NOT NULL,
    guru_pengganti_nama VARCHAR(150) NOT NULL,
    mata_pelajaran VARCHAR(100) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    jumlah_jp TINYINT NOT NULL,
    tarif_per_jp DECIMAL(14,2) NOT NULL DEFAULT 7500.00,
    total_nominal DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    alasan_absen VARCHAR(100) NOT NULL,
    catatan TEXT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    approved_by VARCHAR(150) NULL,
    approved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_infal_absen FOREIGN KEY (guru_absen_id) REFERENCES pegawai(id) ON DELETE RESTRICT,
    CONSTRAINT fk_infal_pengganti FOREIGN KEY (guru_pengganti_id) REFERENCES pegawai(id) ON DELETE RESTRICT,
    INDEX idx_infal_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const SUPABASE_DDL_SCHEMA = `-- ============================================================================
-- SUPABASE POSTGRESQL DDL & MIGRATION SCHEMA (SIM GAJI SMK IT IBNUL QAYYIM)
-- Tabel Utama: periode_penggajian, pegawai, slip_gaji, guru_inval, presensi_harian_jp
-- ============================================================================

-- 1. TABEL PERIODE PENGGAJIAN
CREATE TABLE IF NOT EXISTS public.periode_penggajian (
    id TEXT PRIMARY KEY,
    bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun INTEGER NOT NULL CHECK (tahun >= 2020),
    periode_label TEXT NOT NULL,
    tanggal_cutoff_mulai DATE NOT NULL,
    tanggal_cutoff_selesai DATE NOT NULL,
    tanggal_mulai_bayar DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status_global TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL PEGAWAI (Master Data Guru & Staf)
CREATE TABLE IF NOT EXISTS public.pegawai (
    id TEXT PRIMARY KEY,
    nip TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    no_hp TEXT NOT NULL,
    status_pegawai TEXT NOT NULL DEFAULT 'GTT', -- GTY, GTT, PTY, PTT
    jabatan_utama TEXT NOT NULL,
    jabatan_tambahan JSONB DEFAULT '[]'::jsonb,
    pendidikan_terakhir TEXT NOT NULL DEFAULT 'S1',
    tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
    nama_bank TEXT NOT NULL DEFAULT 'Bank Syariah Indonesia (BSI)',
    nomor_rekening TEXT NOT NULL,
    atas_nama_rekening TEXT NOT NULL,
    npwp TEXT,
    niy TEXT,
    nik TEXT,
    nuptk TEXT,
    jenis_kelamin TEXT DEFAULT 'L',
    tempat_lahir TEXT,
    tanggal_lahir DATE,
    usia TEXT,
    jurusan TEXT,
    tmt TEXT,
    masa_kerja TEXT,
    status_induk TEXT DEFAULT 'Induk',
    keterangan_induk TEXT,
    gaji_pokok_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_jabatan_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_kepsek_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_wakasek_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_it_officer_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_dkm_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_asrama_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_bendahara_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_pj_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_ijazah_jenjang TEXT,
    tunjangan_ijazah_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_linier_kompetensi BOOLEAN NOT NULL DEFAULT FALSE,
    tahun_pengalaman NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    tahun_masa_kerja NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    tunjangan_kinerja_default NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tarif_per_jam_mengajar NUMERIC(14, 2) NOT NULL DEFAULT 18000.00,
    tarif_transport_harian NUMERIC(14, 2) NOT NULL DEFAULT 20000.00,
    tarif_lembur_per_jam NUMERIC(14, 2) NOT NULL DEFAULT 20000.00,
    tunjangan_keluarga NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_wali_kelas NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_khusus_vokasi NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_kesehatan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_ketenagakerjaan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_kas_sekolah NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL SLIP_GAJI (Rekap Penggajian & Mutasi Approval)
CREATE TABLE IF NOT EXISTS public.slip_gaji (
    id TEXT PRIMARY KEY,
    kode_slip TEXT NOT NULL UNIQUE,
    pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    pegawai_nama TEXT NOT NULL,
    pegawai_nip TEXT NOT NULL,
    pegawai_jabatan TEXT NOT NULL,
    pegawai_status TEXT NOT NULL,
    pegawai_email TEXT NOT NULL,
    bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun INTEGER NOT NULL CHECK (tahun >= 2020),
    periode_label TEXT NOT NULL,
    tanggal_cutoff_mulai DATE,
    tanggal_cutoff_selesai DATE,
    tanggal_mulai_bayar DATE,
    periode_cutoff_label TEXT,
    status_induk TEXT,
    keterangan_induk TEXT,
    
    -- Kehadiran & JP
    presensi_hadir INTEGER NOT NULL DEFAULT 0,
    presensi_alpha INTEGER NOT NULL DEFAULT 0,
    presensi_izin INTEGER NOT NULL DEFAULT 0,
    presensi_sakit INTEGER NOT NULL DEFAULT 0,
    presensi_cuti INTEGER NOT NULL DEFAULT 0,
    presensi_dinas_luar INTEGER NOT NULL DEFAULT 0,
    presensi_terlambat_menit INTEGER NOT NULL DEFAULT 0,
    jam_mengajar_realisasi INTEGER NOT NULL DEFAULT 0,
    jam_lembur NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    
    -- Penerimaan
    gaji_pokok NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_jabatan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_kepsek NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_wakasek NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_wali_kelas NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_it_officer NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_dkm NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_asrama NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_bendahara NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_pj NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_ijazah_jenjang TEXT,
    tunjangan_ijazah NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_linier_kompetensi BOOLEAN NOT NULL DEFAULT FALSE,
    tunjangan_kompetensi NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tahun_pengalaman NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    tunjangan_pengalaman NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tahun_masa_kerja NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    tunjangan_masa_kerja NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_kinerja NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_kehadiran NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_kehadiran_transport NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    honor_jam_mengajar NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    honor_lembur NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    honor_infal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    jp_menggantikan INTEGER NOT NULL DEFAULT 0,
    insentif_kajian_muslimah NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    koreksi_penerimaan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_vokasi_it NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tunjangan_lainnya NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_penerimaan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- Potongan
    potongan_keterlambatan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_tidak_masuk NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_alpha NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_izin NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_infal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    jp_digantikan INTEGER NOT NULL DEFAULT 0,
    koreksi_potongan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_pinjaman NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_kesehatan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_bpjs_ketenagakerjaan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_kas_sekolah NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_koperasi NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_lainnya NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_potongan NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- THP
    gaji_bersih NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- Kolom Status Approval Berjenjang
    status_approval TEXT NOT NULL DEFAULT 'draft', -- draft, pending_kepsek, pending_yayasan, approved, transferred, rejected
    status TEXT NOT NULL DEFAULT 'draft',
    
    -- Metadata Approval & Transfer
    approved_kepsek_by TEXT,
    approved_kepsek_at TIMESTAMPTZ,
    catatan_kepsek TEXT,
    approved_yayasan_by TEXT,
    approved_yayasan_at TIMESTAMPTZ,
    catatan_yayasan TEXT,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    catatan_penolakan TEXT,
    transferred_by TEXT,
    transferred_at TIMESTAMPTZ,
    nomor_referensi_transfer TEXT,
    bukti_transfer_url TEXT,
    
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    email_recipient TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    security_checksum TEXT NOT NULL DEFAULT 'sha256-verified-iqm',
    qr_verification_url TEXT NOT NULL DEFAULT 'https://iqm.sch.id',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL GURU_INVAL (Log Menggantikan Jam Pelajaran)
CREATE TABLE IF NOT EXISTS public.guru_inval (
    id TEXT PRIMARY KEY,
    tanggal DATE NOT NULL,
    guru_digantikan_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    guru_digantikan_nama TEXT NOT NULL,
    guru_pengganti_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    guru_pengganti_nama TEXT NOT NULL,
    kelas TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    jam_ke TEXT,
    jumlah_jp INTEGER NOT NULL CHECK (jumlah_jp > 0),
    tarif_per_jp NUMERIC(14, 2) NOT NULL DEFAULT 7500.00,
    total_nominal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    alasan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL PRESENSI_HARIAN_JP (Log Presensi Realtime Harian)
CREATE TABLE IF NOT EXISTS public.presensi_harian_jp (
    id TEXT PRIMARY KEY,
    pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    tanggal DATE NOT NULL,
    jam_masuk TIME NOT NULL DEFAULT '07:15:00',
    jam_keluar TIME,
    status TEXT NOT NULL DEFAULT 'hadir_tepat_waktu',
    menit_terlambat INTEGER NOT NULL DEFAULT 0,
    menit_pulang_cepat INTEGER NOT NULL DEFAULT 0,
    jam_lembur NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    jam_mengajar_hari_ini INTEGER NOT NULL DEFAULT 0,
    metode TEXT NOT NULL DEFAULT 'biometric_fingerprint',
    lokasi_terminal TEXT NOT NULL DEFAULT 'Terminal RFID / Biometrik',
    keterangan TEXT,
    foto_bukti_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL REKAP_PRESENSI (Agregasi Bulanan)
CREATE TABLE IF NOT EXISTS public.rekap_presensi (
    id TEXT PRIMARY KEY,
    pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun INTEGER NOT NULL CHECK (tahun >= 2020),
    total_hari_efektif INTEGER NOT NULL DEFAULT 22,
    hadir INTEGER NOT NULL DEFAULT 0,
    sakit INTEGER NOT NULL DEFAULT 0,
    izin INTEGER NOT NULL DEFAULT 0,
    cuti INTEGER NOT NULL DEFAULT 0,
    dinas_luar INTEGER NOT NULL DEFAULT 0,
    alpha INTEGER NOT NULL DEFAULT 0,
    menit_terlambat INTEGER NOT NULL DEFAULT 0,
    jam_mengajar_rencana INTEGER NOT NULL DEFAULT 0,
    jam_mengajar_realisasi INTEGER NOT NULL DEFAULT 0,
    jam_lembur_total NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    honor_lembur_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    jumlah_jp_menggantikan INTEGER NOT NULL DEFAULT 0,
    honor_infal_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    jumlah_jp_digantikan INTEGER NOT NULL DEFAULT 0,
    potongan_infal_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    insentif_kajian_muslimah NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    potongan_izin_tidak_resmi NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL PENGAJUAN_CUTI_IZIN
CREATE TABLE IF NOT EXISTS public.pengajuan_cuti_izin (
    id TEXT PRIMARY KEY,
    pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    pegawai_nama TEXT NOT NULL,
    jenis TEXT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jumlah_hari INTEGER NOT NULL DEFAULT 1,
    alasan TEXT NOT NULL,
    lampiran_dokumen_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    catatan_approval TEXT,
    berdampak_potongan_gaji BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABEL LEMBUR_PEGAWAI
CREATE TABLE IF NOT EXISTS public.lembur_pegawai (
    id TEXT PRIMARY KEY,
    pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE RESTRICT,
    pegawai_nama TEXT NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    durasi_jam NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    kategori TEXT NOT NULL,
    deskripsi_tugas TEXT NOT NULL,
    tarif_per_jam NUMERIC(14, 2) NOT NULL DEFAULT 20000.00,
    total_honor NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABEL JADWAL_PELAJARAN
CREATE TABLE IF NOT EXISTS public.jadwal_pelajaran (
    id TEXT PRIMARY KEY,
    hari TEXT NOT NULL,
    jam_ke TEXT NOT NULL,
    rentang_waktu TEXT NOT NULL,
    kelas TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    kode_guru TEXT NOT NULL,
    guru_nama TEXT NOT NULL,
    pegawai_id TEXT REFERENCES public.pegawai(id) ON DELETE SET NULL,
    ruang TEXT,
    is_istirahat BOOLEAN NOT NULL DEFAULT FALSE,
    is_non_akademik BOOLEAN NOT NULL DEFAULT FALSE,
    tipe_slot TEXT NOT NULL DEFAULT 'pelajaran',
    kategori_istirahat TEXT
);

-- 10. TABEL EMAIL_LOGS & AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.email_logs (
    id TEXT PRIMARY KEY,
    penggajian_id TEXT NOT NULL,
    kode_slip TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'sent',
    message_preview TEXT
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    action_label TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT,
    ip_address TEXT
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) & POLICY AKSES PUBLIK / AUTH
ALTER TABLE public.periode_penggajian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slip_gaji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_inval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_harian_jp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rekap_presensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_cuti_izin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembur_pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Anon / Authenticated Access untuk Operasi SIM GAJI
CREATE POLICY "Allow all on periode_penggajian" ON public.periode_penggajian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pegawai" ON public.pegawai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on slip_gaji" ON public.slip_gaji FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on guru_inval" ON public.guru_inval FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on presensi_harian_jp" ON public.presensi_harian_jp FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rekap_presensi" ON public.rekap_presensi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pengajuan_cuti_izin" ON public.pengajuan_cuti_izin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lembur_pegawai" ON public.lembur_pegawai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on jadwal_pelajaran" ON public.jadwal_pelajaran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
`;


