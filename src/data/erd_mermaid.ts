/**
 * Mermaid ERD Diagram & System Architecture Definition
 * SMK IT Ibnul Qayyim Makassar - SIM GAJI
 */

export const MERMAID_ERD = `erDiagram
    USERS ||--o{ PENGGAJIAN : "creates/approves"
    PEGAWAI ||--|| USERS : "auth_account"
    PEGAWAI ||--o{ LOG_PRESENSI_HARIAN : "generates_daily_logs"
    PEGAWAI ||--o{ PENGAJUAN_CUTI_IZIN : "requests_leave"
    PEGAWAI ||--o{ LEMBUR_PEGAWAI : "submits_overtime"
    PEGAWAI ||--o{ LOG_INFAL : "guru_absen_or_substitute"
    PEGAWAI ||--o{ REKAP_PRESENSI : "has_monthly_attendance"
    PEGAWAI ||--o{ PENGGAJIAN : "receives_payroll"
    REKAP_PRESENSI ||--o| PENGGAJIAN : "drives_calculation"
    PENGGAJIAN ||--|{ PENGGAJIAN_DETAIL : "contains_breakdown"
    PENGGAJIAN ||--o{ EMAIL_NOTIFICATIONS : "triggers_notification"

    USERS {
        string id PK
        string username UK
        string email UK
        string role "super_admin|kepala_sekolah|ketua_yayasan|bendahara|pegawai"
        string nama
        string pegawai_id FK
        boolean is_active
    }

    PEGAWAI {
        string id PK
        string nip UK
        string nama
        string email UK
        string status_pegawai "GTY|GTT|PTY|PTT"
        string jabatan_utama
        string nomor_rekening_encrypted "AES-256-GCM"
        string nomor_rekening_masked
        decimal gaji_pokok_default
        decimal tunjangan_jabatan_default
        decimal tarif_per_jam_mengajar "Honor JP"
        decimal tarif_transport_harian
        decimal tarif_lembur_per_jam
        decimal tunjangan_khusus_vokasi "Sertifikasi IT"
    }

    LOG_INFAL {
        string id PK
        date tanggal
        string guru_absen_id FK "Dipotong -Rp 7.500/JP"
        string guru_pengganti_id FK "Menerima +Rp 7.500/JP"
        string mata_pelajaran
        string kelas
        int jumlah_jp
        decimal tarif_per_jp "Rp 7.500"
        decimal total_nominal
        string status "pending|approved|rejected"
    }

    LOG_PRESENSI_HARIAN {
        string id PK
        string pegawai_id FK
        date tanggal
        time jam_masuk
        time jam_keluar
        string status "tepat_waktu|terlambat|izin|sakit_skd|cuti|dinas_luar|alpha"
        int menit_terlambat
        decimal jam_lembur
        string metode "fingerprint|face_recognition|rfid|gps"
        string lokasi_terminal
    }

    PENGAJUAN_CUTI_IZIN {
        string id PK
        string pegawai_id FK
        string jenis "cuti_tahunan|melahirkan|dinas_luar|izin|sakit_skd"
        date tanggal_mulai
        date tanggal_selesai
        int jumlah_hari
        string status "pending|approved|rejected"
        boolean berdampak_potongan_gaji
    }

    LEMBUR_PEGAWAI {
        string id PK
        string pegawai_id FK
        date tanggal
        time jam_mulai
        time jam_selesai
        decimal durasi_jam
        string kategori "lab_it|lks_ukk|ekskul_robotik|dapodik"
        decimal total_honor
        string status "pending|approved|rejected"
    }

    REKAP_PRESENSI {
        string id PK
        string pegawai_id FK
        int bulan
        int tahun
        int hadir
        int sakit
        int izin
        int cuti
        int dinas_luar
        int alpha
        int menit_terlambat
        int jam_mengajar_realisasi "Total JP"
        decimal jam_lembur_total
        decimal honor_lembur_total
    }

    PENGGAJIAN {
        string id PK
        string kode_slip UK
        string pegawai_id FK
        int bulan
        int tahun
        decimal total_penerimaan
        decimal total_potongan
        decimal gaji_bersih "Take Home Pay"
        string status "draft|pending_kepsek|pending_yayasan|approved|transferred"
        string security_checksum "HMAC-SHA256"
        string nomor_referensi_transfer
        boolean email_sent
    }

    PENGGAJIAN_DETAIL {
        string id PK
        string penggajian_id FK
        string nama_komponen
        string kategori "penerimaan|potongan"
        decimal nominal
        string keterangan
    }

    EMAIL_NOTIFICATIONS {
        string id PK
        string penggajian_id FK
        string recipient_email
        string subject
        datetime sent_at
        string status
    }
`;

export const MERMAID_WORKFLOW = `flowchart TD
    A[1. Mesin Biometrik / RFID / GPS Absensi] -->|Tap Real-time| B[Log Presensi Harian]
    C[Pengajuan Cuti & Sakit SKD] -->|Approval Kepsek| B
    D[Klaim Lembur Lab/LKS/Dapodik] -->|Approval Wakasek/Kepsek| B
    INF[Log Infal Guru Pengganti Rp 7.500/JP] -->|Potong Guru Absen & Tambah Pengganti| E
    B -->|Agregasi Otomatis| E[2. Rekap Presensi & Jam Kerja Bulanan]
    E -->|Kalkulasi Honor JP, Infal, Denda Alpha & Lembur| F[3. POST /api/penggajian/generate]
    F --> G{Status: DRAFT GAJI}
    G --> H[4. Review & Approval Kepala Sekolah]
    H -->|Ditolak/Revisi Absensi| G
    H -->|Setuju| I[Status: PENDING YAYASAN]
    I --> J[5. Review & Approval Ketua Yayasan]
    J -->|Ditolak/Revisi Budget| G
    J -->|Setuju| K[Status: APPROVED / SIAP TRANSFER]
    K --> L[6. Eksekusi Transfer Bendahara Yayasan]
    L --> M[Status: TRANSFERRED / FINAL]
    M --> N[7. Generate Slip Gaji PDF Resmi Ber-QR Code]
    M --> O[8. Auto Send Email Notifikasi Slip Gaji]
`;
