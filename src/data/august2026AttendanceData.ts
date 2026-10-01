import { LogPresensiHarian, RekapPresensi } from '../types';

/**
 * DATA PRESENSI HARIAN AGUSTUS 2026
 * Periode Cut-Off Resmi: 23 Juli 2026 s/d 22 Agustus 2026 (26 Hari Kerja Efektif)
 * Berdasarkan Laporan Kehadiran Fisik & Mesin Fingerprint/Face Recognition SMK IT Ibnul Qayyim Makassar
 */

export const ALL_PEGAWAI_IDS: string[] = [
  'peg-001', 'peg-002', 'peg-003', 'peg-004', 'peg-005',
  'peg-006', 'peg-007', 'peg-008', 'peg-009', 'peg-010',
  'peg-011', 'peg-012', 'peg-013', 'peg-014', 'peg-015',
  'peg-016', 'peg-017', 'peg-018', 'peg-019', 'peg-020',
  'peg-021', 'peg-022', 'peg-023',
];

interface RawDailyAttendance {
  tanggal: string; // YYYY-MM-DD
  hari: string;
  isSaturday: boolean;
  records: {
    pegawaiId: string;
    jamMasuk?: string;
    jamKeluar?: string;
    status: 'hadir_tepat_waktu' | 'terlambat' | 'sakit' | 'cuti' | 'izin' | 'alpha';
    menitTerlambat?: number;
    keterangan?: string;
  }[];
}

// 26 Hari Kerja Efektif (Kamis 23 Juli 2026 s/d Sabtu 22 Agustus 2026)
export const RAW_DAILY_ATTENDANCE_AGUSTUS_2026: RawDailyAttendance[] = [
  // 1. Kamis, 23 Juli 2026
  {
    tanggal: '2026-07-23',
    hari: 'Kamis',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:53', jamKeluar: '16:39', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', jamMasuk: '07:02', jamKeluar: '15:58', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:14', jamKeluar: '17:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:42', jamKeluar: '14:25', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:56', jamKeluar: '16:23', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:46', jamKeluar: '17:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:58', jamKeluar: '17:44', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:56', jamKeluar: '16:05', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:00', jamKeluar: '17:44', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:41', jamKeluar: '17:34', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin', keterangan: 'Jadwal fleksibel DKM/PJ' },
      { pegawaiId: 'peg-013', jamMasuk: '06:48', jamKeluar: '16:20', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:55', jamKeluar: '16:20', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:50', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin', keterangan: 'Jadwal layanan BK luar jam' },
    ]
  },
  // 2. Jumat, 24 Juli 2026
  {
    tanggal: '2026-07-24',
    hari: 'Jumat',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:56', jamKeluar: '16:20', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin', keterangan: 'Tidak ada jam mengajar' },
      { pegawaiId: 'peg-004', jamMasuk: '06:08', jamKeluar: '20:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:45', jamKeluar: '16:20', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:52', jamKeluar: '16:23', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '16:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:50', jamKeluar: '17:01', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:05', jamKeluar: '16:05', status: 'terlambat', menitTerlambat: 5 },
      { pegawaiId: 'peg-010', jamMasuk: '07:01', jamKeluar: '18:30', status: 'terlambat', menitTerlambat: 1 },
      { pegawaiId: 'peg-011', jamMasuk: '06:37', jamKeluar: '17:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', jamMasuk: '08:33', jamKeluar: '16:00', status: 'terlambat', menitTerlambat: 93 },
      { pegawaiId: 'peg-013', jamMasuk: '06:49', jamKeluar: '16:05', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:58', jamKeluar: '16:05', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:53', jamKeluar: '16:05', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin', keterangan: 'Tidak ada jadwal' },
    ]
  },
  // 3. Sabtu, 25 Juli 2026 (Sabtu masuk 07:30 - 12:00)
  {
    tanggal: '2026-07-25',
    hari: 'Sabtu',
    isSaturday: true,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '07:44', jamKeluar: '15:42', status: 'terlambat', menitTerlambat: 14 },
      { pegawaiId: 'peg-005', jamMasuk: '07:33', jamKeluar: '13:18', status: 'terlambat', menitTerlambat: 3 },
      { pegawaiId: 'peg-006', jamMasuk: '07:33', jamKeluar: '13:17', status: 'terlambat', menitTerlambat: 3 },
      { pegawaiId: 'peg-007', status: 'izin' },
      { pegawaiId: 'peg-008', jamMasuk: '07:28', jamKeluar: '13:32', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:39', jamKeluar: '12:11', status: 'terlambat', menitTerlambat: 9 },
      { pegawaiId: 'peg-010', jamMasuk: '09:00', jamKeluar: '12:00', status: 'terlambat', menitTerlambat: 90 },
      { pegawaiId: 'peg-011', jamMasuk: '07:26', jamKeluar: '13:50', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '07:58', jamKeluar: '12:53', status: 'terlambat', menitTerlambat: 28 },
      { pegawaiId: 'peg-014', jamMasuk: '07:59', jamKeluar: '12:53', status: 'terlambat', menitTerlambat: 29 },
      { pegawaiId: 'peg-015', status: 'izin' },
      { pegawaiId: 'peg-016', jamMasuk: '07:28', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 4. Senin, 27 Juli 2026
  {
    tanggal: '2026-07-27',
    hari: 'Senin',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:57', jamKeluar: '21:29', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:14', jamKeluar: '19:56', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'alpha', keterangan: 'Tidak hadir tanpa keterangan' },
      { pegawaiId: 'peg-006', jamMasuk: '06:58', jamKeluar: '11:46', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:56', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:55', jamKeluar: '16:46', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:53', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:47', jamKeluar: '20:47', status: 'terlambat', menitTerlambat: 47 },
      { pegawaiId: 'peg-011', jamMasuk: '06:41', jamKeluar: '16:57', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:37', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:35', jamKeluar: '08:21', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '07:02', jamKeluar: '16:08', status: 'terlambat', menitTerlambat: 2 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 5. Selasa, 28 Juli 2026
  {
    tanggal: '2026-07-28',
    hari: 'Selasa',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:57', jamKeluar: '17:50', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:07', jamKeluar: '18:55', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:45', jamKeluar: '16:25', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '16:39', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:57', jamKeluar: '17:26', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:59', jamKeluar: '16:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:47', jamKeluar: '20:30', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:36', jamKeluar: '16:12', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:33', jamKeluar: '16:03', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:48', jamKeluar: '16:03', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:46', jamKeluar: '16:52', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 6. Rabu, 29 Juli 2026
  {
    tanggal: '2026-07-29',
    hari: 'Rabu',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:58', jamKeluar: '17:41', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', jamMasuk: '06:43', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:21', jamKeluar: '19:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:41', jamKeluar: '17:25', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-007', jamMasuk: '06:56', jamKeluar: '16:21', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:54', jamKeluar: '17:01', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:00', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:52', jamKeluar: '19:56', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:43', jamKeluar: '16:50', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:50', jamKeluar: '16:12', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:40', jamKeluar: '16:12', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:52', jamKeluar: '16:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 7. Kamis, 30 Juli 2026
  {
    tanggal: '2026-07-30',
    hari: 'Kamis',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:55', jamKeluar: '16:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', jamMasuk: '06:23', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:28', jamKeluar: '18:12', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:45', jamKeluar: '16:23', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:59', jamKeluar: '16:09', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:36', jamKeluar: '16:53', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:58', jamKeluar: '16:52', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:57', jamKeluar: '16:01', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:58', jamKeluar: '17:17', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:41', jamKeluar: '16:43', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:48', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:59', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:49', jamKeluar: '16:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 8. Jumat, 31 Juli 2026
  {
    tanggal: '2026-07-31',
    hari: 'Jumat',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:58', jamKeluar: '16:15', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:34', jamKeluar: '20:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:47', jamKeluar: '16:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:57', jamKeluar: '16:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '17:10', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:48', jamKeluar: '16:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:00', jamKeluar: '16:05', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:59', jamKeluar: '16:16', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:58', jamKeluar: '16:22', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:46', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:58', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:55', jamKeluar: '16:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 9. Sabtu, 01 Agustus 2026 (Sabtu masuk 07:30 - 12:00)
  {
    tanggal: '2026-08-01',
    hari: 'Sabtu',
    isSaturday: true,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:30', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '08:15', jamKeluar: '10:44', status: 'terlambat', menitTerlambat: 45 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:29', jamKeluar: '17:22', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '07:25', jamKeluar: '10:40', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '07:28', jamKeluar: '12:45', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '07:18', jamKeluar: '10:37', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '07:21', jamKeluar: '12:03', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:23', jamKeluar: '10:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:39', jamKeluar: '18:18', status: 'terlambat', menitTerlambat: 9 },
      { pegawaiId: 'peg-011', jamMasuk: '07:31', jamKeluar: '12:11', status: 'terlambat', menitTerlambat: 1 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '07:16', jamKeluar: '10:48', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:24', jamKeluar: '10:48', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '07:52', jamKeluar: '12:00', status: 'terlambat', menitTerlambat: 22 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 10. Senin, 03 Agustus 2026
  {
    tanggal: '2026-08-03',
    hari: 'Senin',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:55', jamKeluar: '18:53', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:08', jamKeluar: '17:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'alpha', keterangan: 'Tidak hadir' },
      { pegawaiId: 'peg-006', jamMasuk: '06:58', jamKeluar: '16:10', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', status: 'izin' },
      { pegawaiId: 'peg-008', jamMasuk: '06:58', jamKeluar: '17:42', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:57', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:54', jamKeluar: '21:10', status: 'terlambat', menitTerlambat: 54 },
      { pegawaiId: 'peg-011', jamMasuk: '06:55', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:45', jamKeluar: '16:09', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:44', jamKeluar: '16:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:54', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 11. Selasa, 04 Agustus 2026
  {
    tanggal: '2026-08-04',
    hari: 'Selasa',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:56', jamKeluar: '20:01', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:21', jamKeluar: '21:43', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:40', jamKeluar: '16:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:49', jamKeluar: '16:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '17:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:57', jamKeluar: '17:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:56', jamKeluar: '17:03', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:02', jamKeluar: '21:25', status: 'terlambat', menitTerlambat: 2 },
      { pegawaiId: 'peg-011', jamMasuk: '06:54', jamKeluar: '17:29', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:44', jamKeluar: '16:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:00', jamKeluar: '16:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:54', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 12. Rabu, 05 Agustus 2026
  {
    tanggal: '2026-08-05',
    hari: 'Rabu',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:40', jamKeluar: '16:52', status: 'terlambat', menitTerlambat: 40 },
      { pegawaiId: 'peg-003', jamMasuk: '06:35', jamKeluar: '15:22', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:20', jamKeluar: '17:59', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:32', jamKeluar: '17:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-007', jamMasuk: '06:58', jamKeluar: '16:40', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:57', jamKeluar: '17:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', status: 'izin' },
      { pegawaiId: 'peg-010', jamMasuk: '06:46', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:43', jamKeluar: '16:18', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', jamMasuk: '06:48', jamKeluar: '16:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-013', jamMasuk: '06:45', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:00', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:57', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 13. Kamis, 06 Agustus 2026
  {
    tanggal: '2026-08-06',
    hari: 'Kamis',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:58', jamKeluar: '19:49', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', jamMasuk: '06:41', jamKeluar: '15:35', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:08', jamKeluar: '17:10', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:45', jamKeluar: '17:27', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:46', jamKeluar: '16:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:42', jamKeluar: '16:58', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:55', jamKeluar: '16:59', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:19', jamKeluar: '16:01', status: 'terlambat', menitTerlambat: 19 },
      { pegawaiId: 'peg-010', jamMasuk: '00:24', jamKeluar: '21:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:54', jamKeluar: '17:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', jamMasuk: '16:03', jamKeluar: '18:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-013', jamMasuk: '06:51', jamKeluar: '16:13', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:01', jamKeluar: '16:12', status: 'terlambat', menitTerlambat: 1 },
      { pegawaiId: 'peg-015', jamMasuk: '06:59', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:28', jamKeluar: '16:02', status: 'terlambat', menitTerlambat: 28 },
    ]
  },
  // 14. Jumat, 07 Agustus 2026
  {
    tanggal: '2026-08-07',
    hari: 'Jumat',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:58', jamKeluar: '17:55', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:23', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:37', jamKeluar: '16:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:56', jamKeluar: '17:49', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '17:50', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:48', jamKeluar: '17:50', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:53', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:58', jamKeluar: '19:19', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:53', jamKeluar: '16:15', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:46', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:49', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:54', jamKeluar: '16:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '06:28', jamKeluar: '16:09', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 15. Sabtu, 08 Agustus 2026 (Sabtu masuk 07:30 - 12:00)
  {
    tanggal: '2026-08-08',
    hari: 'Sabtu',
    isSaturday: true,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:30', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '08:57', jamKeluar: '17:39', status: 'terlambat', menitTerlambat: 87 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:32', jamKeluar: '19:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '07:05', jamKeluar: '10:23', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '07:32', jamKeluar: '11:02', status: 'terlambat', menitTerlambat: 2 },
      { pegawaiId: 'peg-007', jamMasuk: '07:24', jamKeluar: '11:42', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '07:24', jamKeluar: '11:43', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:20', jamKeluar: '09:28', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:33', jamKeluar: '22:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '07:34', jamKeluar: '12:49', status: 'terlambat', menitTerlambat: 4 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '07:08', jamKeluar: '11:32', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:28', jamKeluar: '11:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '07:42', jamKeluar: '10:19', status: 'terlambat', menitTerlambat: 12 },
      { pegawaiId: 'peg-016', status: 'izin' },
    ]
  },
  // 16. Senin, 10 Agustus 2026
  {
    tanggal: '2026-08-10',
    hari: 'Senin',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:54', jamKeluar: '18:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:12', jamKeluar: '19:28', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:53', jamKeluar: '16:36', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:59', jamKeluar: '16:31', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:58', jamKeluar: '16:53', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:52', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:54', jamKeluar: '16:04', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:56', jamKeluar: '17:27', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:44', jamKeluar: '17:44', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:47', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:48', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:46', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:00', jamKeluar: '16:10', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 17. Selasa, 11 Agustus 2026
  {
    tanggal: '2026-08-11',
    hari: 'Selasa',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:58', jamKeluar: '17:16', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:28', jamKeluar: '18:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', jamMasuk: '06:49', jamKeluar: '16:20', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-006', jamMasuk: '06:57', jamKeluar: '16:51', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '07:00', jamKeluar: '16:22', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:59', jamKeluar: '16:51', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:58', jamKeluar: '16:36', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:51', jamKeluar: '18:18', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:43', jamKeluar: '16:51', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:54', jamKeluar: '16:51', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:58', jamKeluar: '15:57', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:00', jamKeluar: '16:07', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 18. Rabu, 12 Agustus 2026
  {
    tanggal: '2026-08-12',
    hari: 'Rabu',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:08', jamKeluar: '16:28', status: 'terlambat', menitTerlambat: 8 },
      { pegawaiId: 'peg-003', jamMasuk: '06:34', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:06', jamKeluar: '20:52', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', jamMasuk: '06:59', jamKeluar: '17:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '16:41', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:57', jamKeluar: '17:27', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:57', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:57', jamKeluar: '17:57', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-012', jamMasuk: '06:39', jamKeluar: '16:15', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-013', jamMasuk: '06:43', jamKeluar: '17:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:57', jamKeluar: '16:30', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:46', jamKeluar: '15:58', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:30', jamKeluar: '16:11', status: 'terlambat', menitTerlambat: 30 },
    ]
  },
  // 19. Kamis, 13 Agustus 2026
  {
    tanggal: '2026-08-13',
    hari: 'Kamis',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:57', jamKeluar: '17:41', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', jamMasuk: '06:44', jamKeluar: '15:30', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:33', jamKeluar: '18:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', jamMasuk: '07:08', jamKeluar: '16:25', status: 'terlambat', menitTerlambat: 8 },
      { pegawaiId: 'peg-007', jamMasuk: '06:41', jamKeluar: '17:48', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:59', jamKeluar: '17:48', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:02', jamKeluar: '16:01', status: 'terlambat', menitTerlambat: 2 },
      { pegawaiId: 'peg-010', jamMasuk: '06:56', jamKeluar: '18:18', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:49', jamKeluar: '17:19', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', jamMasuk: '06:52', jamKeluar: '16:12', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-013', jamMasuk: '06:50', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:54', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:52', jamKeluar: '16:01', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:29', jamKeluar: '16:00', status: 'terlambat', menitTerlambat: 29 },
    ]
  },
  // 20. Jumat, 14 Agustus 2026
  {
    tanggal: '2026-08-14',
    hari: 'Jumat',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:10', jamKeluar: '16:00', status: 'terlambat', menitTerlambat: 10 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:30', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', jamMasuk: '06:53', jamKeluar: '16:12', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:58', jamKeluar: '17:10', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:51', jamKeluar: '16:35', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:53', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:49', jamKeluar: '18:35', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:59', jamKeluar: '16:54', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', jamMasuk: '06:53', jamKeluar: '16:04', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-013', jamMasuk: '06:54', jamKeluar: '16:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:59', jamKeluar: '16:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:53', jamKeluar: '17:48', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '06:40', jamKeluar: '16:04', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 21. Sabtu, 15 Agustus 2026 (Sabtu masuk 07:30 - 12:00)
  {
    tanggal: '2026-08-15',
    hari: 'Sabtu',
    isSaturday: true,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:30', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:43', jamKeluar: '11:44', status: 'terlambat', menitTerlambat: 13 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:53', jamKeluar: '19:16', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', jamMasuk: '07:29', jamKeluar: '12:37', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '07:26', jamKeluar: '13:28', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '07:25', jamKeluar: '12:47', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-010', jamMasuk: '07:41', jamKeluar: '22:20', status: 'terlambat', menitTerlambat: 11 },
      { pegawaiId: 'peg-011', jamMasuk: '07:19', jamKeluar: '12:37', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '07:14', jamKeluar: '12:36', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:18', jamKeluar: '12:36', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '07:49', jamKeluar: '11:38', status: 'terlambat', menitTerlambat: 19 },
      { pegawaiId: 'peg-016', jamMasuk: '07:58', jamKeluar: '12:00', status: 'terlambat', menitTerlambat: 28 },
    ]
  },
  // 22. Senin, 17 Agustus 2026 (Upacara Hari Kemerdekaan RI)
  {
    tanggal: '2026-08-17',
    hari: 'Senin',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '14:00', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-002', status: 'alpha', keterangan: 'Tidak hadir / hanya absen pulang' },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:28', jamKeluar: '17:52', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-007', jamMasuk: '06:56', jamKeluar: '12:15', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-008', jamMasuk: '06:57', jamKeluar: '12:15', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-009', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-010', jamMasuk: '06:59', jamKeluar: '16:22', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-011', jamMasuk: '06:50', jamKeluar: '12:04', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:47', jamKeluar: '10:59', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-014', jamMasuk: '06:52', jamKeluar: '10:59', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Upacara HUT RI' },
      { pegawaiId: 'peg-015', jamMasuk: '07:37', jamKeluar: '16:22', status: 'terlambat', menitTerlambat: 37 },
      { pegawaiId: 'peg-016', jamMasuk: '11:06', jamKeluar: '14:00', status: 'hadir_tepat_waktu', menitTerlambat: 0, keterangan: 'Hadir kegiatan kemerdekaan' },
    ]
  },
  // 23. Selasa, 18 Agustus 2026
  {
    tanggal: '2026-08-18',
    hari: 'Selasa',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:55', jamKeluar: '17:52', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:19', jamKeluar: '20:30', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', status: 'sakit', keterangan: 'Sakit (S)' },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '16:09', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:56', jamKeluar: '16:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:56', jamKeluar: '16:31', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:55', jamKeluar: '17:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:55', jamKeluar: '15:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:46', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:55', jamKeluar: '16:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:55', jamKeluar: '16:04', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '06:36', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 24. Rabu, 19 Agustus 2026
  {
    tanggal: '2026-08-19',
    hari: 'Rabu',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '06:59', jamKeluar: '17:23', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', jamMasuk: '06:41', jamKeluar: '15:22', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:14', jamKeluar: '17:54', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', jamMasuk: '06:56', jamKeluar: '17:22', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:58', jamKeluar: '16:33', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:56', jamKeluar: '17:24', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:57', jamKeluar: '16:01', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:07', jamKeluar: '17:25', status: 'terlambat', menitTerlambat: 7 },
      { pegawaiId: 'peg-011', jamMasuk: '08:00', jamKeluar: '16:10', status: 'terlambat', menitTerlambat: 60 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:44', jamKeluar: '17:09', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:59', jamKeluar: '16:21', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:49', jamKeluar: '16:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '06:43', jamKeluar: '16:02', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
    ]
  },
  // 25. Kamis, 20 Agustus 2026
  {
    tanggal: '2026-08-20',
    hari: 'Kamis',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:07', jamKeluar: '17:15', status: 'terlambat', menitTerlambat: 7 },
      { pegawaiId: 'peg-003', jamMasuk: '06:25', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-004', jamMasuk: '06:30', jamKeluar: '20:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', jamMasuk: '06:58', jamKeluar: '16:21', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-007', jamMasuk: '06:41', jamKeluar: '17:38', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:57', jamKeluar: '17:38', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:58', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '06:59', jamKeluar: '16:16', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-011', jamMasuk: '06:51', jamKeluar: '17:18', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '06:48', jamKeluar: '17:08', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '06:59', jamKeluar: '16:44', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:45', jamKeluar: '16:06', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:37', jamKeluar: '16:00', status: 'terlambat', menitTerlambat: 37 },
    ]
  },
  // 26. Jumat, 21 Agustus 2026
  {
    tanggal: '2026-08-21',
    hari: 'Jumat',
    isSaturday: false,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:00', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:04', jamKeluar: '17:15', status: 'terlambat', menitTerlambat: 4 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:13', jamKeluar: '20:14', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-007', jamMasuk: '06:59', jamKeluar: '16:51', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '06:48', jamKeluar: '16:51', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '06:55', jamKeluar: '16:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '07:03', jamKeluar: '17:17', status: 'terlambat', menitTerlambat: 3 },
      { pegawaiId: 'peg-011', jamMasuk: '07:08', jamKeluar: '16:12', status: 'terlambat', menitTerlambat: 8 },
      { pegawaiId: 'peg-012', jamMasuk: '06:57', jamKeluar: '16:43', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-013', jamMasuk: '06:46', jamKeluar: '17:11', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:00', jamKeluar: '16:05', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '06:54', jamKeluar: '16:20', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-016', jamMasuk: '07:23', jamKeluar: '16:08', status: 'terlambat', menitTerlambat: 23 },
    ]
  },
  // 27. Sabtu, 22 Agustus 2026 (Sabtu masuk 07:30 - 12:00)
  {
    tanggal: '2026-08-22',
    hari: 'Sabtu',
    isSaturday: true,
    records: [
      { pegawaiId: 'peg-001', jamMasuk: '07:30', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-002', jamMasuk: '07:25', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-003', status: 'izin' },
      { pegawaiId: 'peg-004', jamMasuk: '06:18', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-005', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-006', status: 'cuti', keterangan: 'Cuti (C)' },
      { pegawaiId: 'peg-007', jamMasuk: '07:24', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-008', jamMasuk: '07:15', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-009', jamMasuk: '07:29', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-010', jamMasuk: '08:00', jamKeluar: '12:00', status: 'terlambat', menitTerlambat: 30 },
      { pegawaiId: 'peg-011', jamMasuk: '07:27', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-012', status: 'izin' },
      { pegawaiId: 'peg-013', jamMasuk: '07:04', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-014', jamMasuk: '07:21', jamKeluar: '12:00', status: 'hadir_tepat_waktu', menitTerlambat: 0 },
      { pegawaiId: 'peg-015', jamMasuk: '07:46', jamKeluar: '12:00', status: 'terlambat', menitTerlambat: 16 },
      { pegawaiId: 'peg-016', jamMasuk: '07:44', jamKeluar: '12:00', status: 'terlambat', menitTerlambat: 14 },
    ]
  }
];

// Konversi ke format LogPresensiHarian individual untuk setiap pegawai dan tanggal
export const DAILY_ATTENDANCE_LOGS_AGUSTUS_2026: LogPresensiHarian[] = [];

RAW_DAILY_ATTENDANCE_AGUSTUS_2026.forEach((day) => {
  day.records.forEach((rec) => {
    const isTendik = ['peg-013', 'peg-014'].includes(rec.pegawaiId);
    const isGuru = !isTendik;
    const isPresent = rec.status === 'hadir_tepat_waktu' || rec.status === 'terlambat';

    let statusHarian = 'hadir_tepat_waktu';
    if (rec.status === 'terlambat') statusHarian = 'terlambat';
    else if (rec.status === 'sakit') statusHarian = 'sakit_skd';
    else if (rec.status === 'cuti') statusHarian = 'cuti_tahunan';
    else if (rec.status === 'izin') statusHarian = 'izin_resmi';
    else if (rec.status === 'alpha') statusHarian = 'alpha';

    DAILY_ATTENDANCE_LOGS_AGUSTUS_2026.push({
      id: `log-${day.tanggal}-${rec.pegawaiId}`,
      pegawaiId: rec.pegawaiId,
      tanggal: day.tanggal,
      jamMasuk: rec.jamMasuk ? `${rec.jamMasuk}:00` : '-',
      jamKeluar: rec.jamKeluar ? `${rec.jamKeluar}:00` : '-',
      status: statusHarian as any,
      menitTerlambat: rec.menitTerlambat || 0,
      menitPulangCepat: 0,
      jamLembur: 0,
      jamMengajarHariIni: isPresent && isGuru ? 4 : 0,
      metode: 'biometric_fingerprint',
      lokasiTerminal: 'Lobby Kantor Guru & Ruang Tata Usaha',
      keterangan: rec.keterangan || (rec.menitTerlambat ? `Terlambat ${rec.menitTerlambat} menit` : undefined),
      isVerified: true,
    });
  });
});

/**
 * REKAP PRESENSI RESMI AGUSTUS 2026 (Periode Cut-Off: 23 Juli 2026 - 22 Agustus 2026)
 * Total Hari Kerja Efektif: 26 Hari
 */
export const PRESENSI_AGUSTUS_2026: RekapPresensi[] = ALL_PEGAWAI_IDS.map((pegId, idx) => {
  let hadir = 26;
  let sakit = 0;
  let izin = 0;
  let cuti = 0;
  let dinasLuar = 0;
  let alpha = 0;
  let menitTerlambat = 0;
  let hariTidakMasuk = 0;
  let potonganTidakMasuk = 0;
  let jamMengajarRencana = 24;
  let jamMengajarRealisasi = 24;
  let jumlahJpMenggantikan = 0;
  let honorInfalTotal = 0;
  let jumlahJpDigantikan = 0;
  let potonganInfalTotal = 0;
  let koreksiPenerimaan = 0;
  let koreksiPotongan = 0;
  let potonganPinjaman = 0;
  let jamLemburTotal = 0;
  let honorLemburTotal = 0;
  let catatan = 'Kehadiran dan kedisiplinan mengajar sesuai rekapitulasi resmi';

  if (pegId === 'peg-001') {
    // Anto (Kepala Sekolah) - 26 hari penuh hadir, 0 terlambat
    hadir = 26;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 1;
    honorInfalTotal = 7500;
    catatan = 'Presensi 26 hari penuh (100%), realisasi mengajar 24 JP, infal pengganti 1 JP';
  } else if (pegId === 'peg-002') {
    // Nur Hadi Indra - Hadir 24, Sakit 1, Alpha 1, Terlambat 8x (214 menit)
    hadir = 24;
    sakit = 1;
    alpha = 1;
    menitTerlambat = 214;
    hariTidakMasuk = 1;
    potonganTidakMasuk = 20000;
    jamMengajarRealisasi = 18;
    jumlahJpMenggantikan = 7;
    honorInfalTotal = 52500;
    catatan = 'Presensi 24 hari, 1 hari sakit (25 Jul), 1 hari tidak masuk (-20rb), terlambat 8x (-55.500), infal 7 JP (+52.500)';
  } else if (pegId === 'peg-003') {
    // Dzulkifli Chaniago - Hadir 9 hari sesuai jadwal tugas DKM & Mapel
    hadir = 25;
    jamMengajarRealisasi = 18;
    catatan = 'Presensi tugas DKM & jadwal mengajar 18 JP';
  } else if (pegId === 'peg-004') {
    // Khalid Fikri Mustanir - Hadir 26 hari penuh, 0 terlambat, jam lembur/infal
    hadir = 26;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 9;
    honorInfalTotal = 67500;
    potonganPinjaman = 500000;
    catatan = 'Presensi 26 hari penuh (100%), realisasi 24 JP, infal 9 JP (+67.500), potongan pinjaman 500.000';
  } else if (pegId === 'peg-005') {
    // Rajie Al-Qadri Anwar - Hadir 15, Cuti 10 hari (12-22 Agu), 2 hari tidak masuk
    hadir = 15;
    cuti = 10;
    alpha = 2;
    hariTidakMasuk = 9;
    potonganTidakMasuk = 180000;
    jamMengajarRealisasi = 26;
    jumlahJpMenggantikan = 3;
    honorInfalTotal = 22500;
    jumlahJpDigantikan = 48;
    potonganInfalTotal = 360000;
    koreksiPotongan = 90000;
    catatan = 'Presensi 15 hari, cuti 10 hari, 9 hari tidak masuk (-180rb), digantikan 48 JP (-360rb), koreksi potongan (-90rb)';
  } else if (pegId === 'peg-006') {
    // Ayu Aksari - Hadir 19, Sakit 5 hari, Cuti 2 hari, Terlambat 1x
    hadir = 19;
    sakit = 5;
    cuti = 2;
    menitTerlambat = 8;
    hariTidakMasuk = 5;
    potonganTidakMasuk = 100000;
    jamMengajarRealisasi = 26;
    jumlahJpDigantikan = 16;
    potonganInfalTotal = 120000;
    catatan = 'Presensi 19 hari, sakit 5 hari, cuti 2 hari, terlambat 1x (-7.500), digantikan 16 JP (-120rb)';
  } else if (pegId === 'peg-007') {
    // Ayu Purnama - Hadir 24, Izin 2 hari, 0 Terlambat
    hadir = 24;
    izin = 2;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 3;
    honorInfalTotal = 22500;
    catatan = 'Presensi 24 hari, izin 2 hari, realisasi 24 JP, infal pengganti 3 JP (+22.500)';
  } else if (pegId === 'peg-008') {
    // Mukhlisa Tamif - Hadir 26 hari penuh (100%), 0 terlambat
    hadir = 26;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 2;
    honorInfalTotal = 15000;
    catatan = 'Presensi 26 hari penuh (100%), realisasi 24 JP, infal pengganti 2 JP (+15.000)';
  } else if (pegId === 'peg-009') {
    // Muhammad Takdir - Hadir 23, Cuti 2 hari, Izin 1 hari, Terlambat 4x
    hadir = 23;
    cuti = 2;
    izin = 1;
    menitTerlambat = 35;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 6;
    honorInfalTotal = 45000;
    jumlahJpDigantikan = 5;
    potonganInfalTotal = 37500;
    catatan = 'Presensi 23 hari, cuti 2 hari, terlambat 4x (-24rb), digantikan 5 JP (-37.500), infal 6 JP (+45rb)';
  } else if (pegId === 'peg-010') {
    // Muhammad Rifqi Hafizh - Hadir 26, Terlambat 10x
    hadir = 26;
    menitTerlambat = 165;
    jamMengajarRealisasi = 24;
    catatan = 'Presensi 26 hari, terlambat 10x (-30rb), realisasi mengajar 24 JP';
  } else if (pegId === 'peg-011') {
    // Salmawati Aiwa - Hadir 24, Sakit 2 hari (11, 12 Agu), Terlambat 4x
    hadir = 24;
    sakit = 2;
    menitTerlambat = 73;
    hariTidakMasuk = 2;
    potonganTidakMasuk = 40000;
    jamMengajarRealisasi = 24;
    jumlahJpDigantikan = 4;
    potonganInfalTotal = 30000;
    catatan = 'Presensi 24 hari, sakit 2 hari (-40rb), terlambat (-4.500), digantikan 4 JP (-30rb)';
  } else if (pegId === 'peg-012') {
    // Nu'man Nasyar - Hadir sesuai jadwal PJ & Infal besar
    hadir = 25;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 31;
    honorInfalTotal = 232500;
    koreksiPenerimaan = 90000;
    catatan = 'Presensi tugas PJ, infal pengganti 31 JP (+232.500), koreksi penerimaan (+90.000)';
  } else if (pegId === 'peg-013') {
    // Asnani - Hadir 26 hari penuh, Terlambat 1x (Sabtu 25 Jul)
    hadir = 26;
    menitTerlambat = 28;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 13;
    honorInfalTotal = 97500;
    catatan = 'Presensi 26 hari penuh (100%), infal pengganti 13 JP (+97.500)';
  } else if (pegId === 'peg-014') {
    // Faura - Hadir 26 hari penuh, Terlambat 2x
    hadir = 26;
    menitTerlambat = 30;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 8;
    honorInfalTotal = 60000;
    catatan = 'Presensi 26 hari penuh (100%), infal pengganti 8 JP (+60.000)';
  } else if (pegId === 'peg-015') {
    // Muhammad Hafizh Rahman - Hadir 25, Terlambat 7x
    hadir = 25;
    menitTerlambat = 108;
    jamMengajarRencana = 0;
    jamMengajarRealisasi = 0;
    jumlahJpMenggantikan = 5;
    honorInfalTotal = 37500;
    catatan = 'Guru Pengabdian, presensi 25 hari, infal pengganti 5 JP (+37.500)';
  } else if (pegId === 'peg-016') {
    // Tsania Nur Azizah - Layanan BK, Terlambat 6x, Infal 13 JP
    hadir = 25;
    menitTerlambat = 142;
    jamMengajarRealisasi = 24;
    jumlahJpMenggantikan = 13;
    honorInfalTotal = 97500;
    jumlahJpDigantikan = 3;
    potonganInfalTotal = 22500;
    catatan = 'Presensi 25 hari, infal 13 JP (+97.500), terlambat (-171rb), digantikan 3 JP (-22.500)';
  } else {
    // Guru Non Induk
    hadir = 20;
    jamMengajarRencana = 16;
    jamMengajarRealisasi = 16;
    catatan = 'Guru Pengampu Mapel Non-Induk (SMPIT Ibnul Qayyim) - Murni JP';
  }

  return {
    id: `prs-2026-08-${String(idx + 1).padStart(3, '0')}`,
    pegawaiId: pegId,
    bulan: 8,
    tahun: 2026,
    totalHariEfektif: 26,
    hadir,
    sakit,
    izin,
    cuti,
    dinasLuar,
    alpha,
    menitTerlambat,
    potonganKeterlambatan: menitTerlambat * 15000,
    hariTidakMasuk,
    potonganTidakMasuk,
    jamMengajarRencana,
    jamMengajarRealisasi,
    jamLemburTotal,
    honorLemburTotal,
    potonganIzinTidakResmi: 0,
    jumlahJpMenggantikan,
    honorInfalTotal,
    jumlahJpDigantikan,
    potonganInfalTotal,
    koreksiPenerimaan,
    koreksiPotongan,
    potonganPinjaman,
    catatan,
    updatedAt: '2026-08-25T10:00:00Z',
  };
});
