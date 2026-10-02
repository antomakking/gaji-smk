import { SlotJadwalPelajaran, GuruInitialMap, HariJadwal } from '../types';

export const DAFTAR_KELAS = [
  '10-A', '10-B', '11-A', '11-B', '12-A', '12-B',
  '7-A', '7-B', '7-C', '7-D', '8-A', '8-B', '8-C', '8-D', '9-A', '9-B'
] as const;

export const GURU_INITIALS: GuruInitialMap[] = [
  { kode: 'A', nama: 'Anto, S.E.I., M.E., Gr., MCF.', pegawaiId: 'peg-001', mataPelajaranUtama: 'Kepemimpinan & Vokasi', warnaBadge: 'bg-emerald-600 text-white' },
  { kode: 'KH', nama: 'Khalid Fikri Mustanir, A.Md.T., MCF.', pegawaiId: 'peg-004', mataPelajaranUtama: 'Koding dan AI / Basis Data / Dasar RPL', warnaBadge: 'bg-blue-600 text-white' },
  { kode: 'RQ', nama: 'Rajie Al-Qadri Anwar, S.Kom., MCF.', pegawaiId: 'peg-005', mataPelajaranUtama: 'Informatika / Pemrograman Web', warnaBadge: 'bg-teal-700 text-white' },
  { kode: 'AY', nama: 'Ayu Aksari, S.Kom., Gr., MTA., MCF.', pegawaiId: 'peg-006', mataPelajaranUtama: 'Pemrograman Web / RPL', warnaBadge: 'bg-purple-600 text-white' },
  { kode: 'BA', nama: 'Basyirah Anan, S.Pd., M.Pd., Gr.', pegawaiId: 'peg-014', mataPelajaranUtama: 'Bahasa Inggris', warnaBadge: 'bg-teal-600 text-white' },
  { kode: 'MM', nama: 'Gr. Mustakim, S.Pd.I., M.Pd.', pegawaiId: 'peg-018', mataPelajaranUtama: 'Bahasa Arab / PAI', warnaBadge: 'bg-amber-600 text-white' },
  { kode: 'SA', nama: 'Salmawati Aiwa, S.H., M.H., C.MA.', pegawaiId: 'peg-011', mataPelajaranUtama: 'Bahasa Arab / PKn', warnaBadge: 'bg-orange-600 text-white' },
  { kode: 'AN', nama: 'Asnani, S.Pd.', pegawaiId: 'peg-012', mataPelajaranUtama: 'Matematika', warnaBadge: 'bg-rose-600 text-white' },
  { kode: 'AS', nama: 'Gr. Ashary Alam, S.Pd., M.Pd.', pegawaiId: 'peg-016', mataPelajaranUtama: 'Sejarah / Pengetahuan Umum', warnaBadge: 'bg-cyan-700 text-white' },
  { kode: 'SY', nama: 'Gr. Syahrul, S.Pd.', pegawaiId: 'peg-017', mataPelajaranUtama: 'Pendidikan Pancasila / Tahfidz', warnaBadge: 'bg-green-700 text-white' },
  { kode: 'IS', nama: 'Israyhuni, S.Pd., Gr.', pegawaiId: 'peg-019', mataPelajaranUtama: 'Proyek IPAS / Sains Vokasi', warnaBadge: 'bg-lime-700 text-white' },
  { kode: 'FA', nama: 'Faura, S.S., M.Hum.', pegawaiId: 'peg-013', mataPelajaranUtama: 'Bahasa Indonesia', warnaBadge: 'bg-sky-600 text-white' },
  { kode: 'MS', nama: 'Mashuri, S.Pd., Gr.', pegawaiId: 'peg-015', mataPelajaranUtama: 'PJOK / Pendidikan Jasmani', warnaBadge: 'bg-red-600 text-white' },
  { kode: 'IA', nama: 'Ilham Aidil, S.Pd., Gr.', pegawaiId: 'peg-020', mataPelajaranUtama: 'Bhs. Inggris / Dasar Kejuruan', warnaBadge: 'bg-violet-600 text-white' },
  { kode: 'IZ', nama: 'Nur Hadi Indra, S.Kom., MCF.', pegawaiId: 'peg-002', mataPelajaranUtama: 'Kreativitas, Inovasi (PKK) / Seni Budaya', warnaBadge: 'bg-fuchsia-700 text-white' },
  { kode: 'ZC', nama: 'Dzulkifli Chaniago (Adab/PAI)', pegawaiId: 'peg-003', mataPelajaranUtama: 'Adab & Akhlak / PAI', warnaBadge: 'bg-slate-700 text-white' },
  { kode: 'TD', nama: 'Muhammad Takdir', pegawaiId: 'peg-009', mataPelajaranUtama: 'Tahfidz dan Tahsin Al-Qur\'an', warnaBadge: 'bg-emerald-700 text-white' },
  { kode: 'MT', nama: 'Mukhlisah Tamif, S.H.', pegawaiId: 'peg-008', mataPelajaranUtama: 'Tahfidz / Kejuruan Vokasi', warnaBadge: 'bg-pink-700 text-white' },
  { kode: 'TS', nama: 'Tsania Nur Azizah, S.Psi.', pegawaiId: 'peg-010', mataPelajaranUtama: 'Bimbingan Konseling (BK)', warnaBadge: 'bg-yellow-700 text-white' },
  { kode: 'GP', nama: 'Guru Piket Sekolah', pegawaiId: 'peg-piket', mataPelajaranUtama: 'Piket Harian / Pengawasan Sekolah', warnaBadge: 'bg-amber-700 text-white' },
];

export interface TimeSlotConfig {
  jamKe: string;
  rentangWaktu: string;
  isBreak?: boolean;
  labelBreak?: string;
  isStaggeredBreak?: boolean;
}

/**
 * Aturan Istirahat 1 & Sholat Dhuha:
 * - Senin - Kamis:
 *   - 09.00 - 09.40 (3A): Istirahat 1, Dhuha untuk Kelas 10-A, 11-A, 12-A
 *   - 09.40 - 10.20 (3B): Istirahat 1, Dhuha untuk Kelas 10-B, 11-B, 12-B
 * - Jumat:
 *   - 09.00 - 09.40 (3A): Istirahat 1, Dhuha untuk Kelas 10-B, 11-B, 12-B
 *   - 09.40 - 10.20 (3B): Istirahat 1, Dhuha untuk Kelas 10-A, 11-A, 12-A
 */
export const checkDhuhaBreak = (
  hari: HariJadwal, 
  jamKe: string, 
  kelas: string
): { isBreak: boolean; label: string; keterangan: string } => {
  if (['Senin', 'Selasa', 'Rabu', 'Kamis'].includes(hari)) {
    if (jamKe === '3A' && ['10-A', '11-A', '12-A'].includes(kelas)) {
      return {
        isBreak: true,
        label: 'Istirahat 1, Dhuha',
        keterangan: 'Waktu Istirahat 1 & Sholat Dhuha (Kelas 10-A, 11-A, 12-A)'
      };
    }
    if (jamKe === '3B' && ['10-B', '11-B', '12-B'].includes(kelas)) {
      return {
        isBreak: true,
        label: 'Istirahat 1, Dhuha',
        keterangan: 'Waktu Istirahat 1 & Sholat Dhuha (Kelas 10-B, 11-B, 12-B)'
      };
    }
  } else if (hari === 'Jumat') {
    if (jamKe === '3A' && ['10-B', '11-B', '12-B'].includes(kelas)) {
      return {
        isBreak: true,
        label: 'Istirahat 1, Dhuha',
        keterangan: 'Waktu Istirahat 1 & Sholat Dhuha (Kelas 10-B, 11-B, 12-B)'
      };
    }
    if (jamKe === '3B' && ['10-A', '11-A', '12-A'].includes(kelas)) {
      return {
        isBreak: true,
        label: 'Istirahat 1, Dhuha',
        keterangan: 'Waktu Istirahat 1 & Sholat Dhuha (Kelas 10-A, 11-A, 12-A)'
      };
    }
  }

  return { isBreak: false, label: '', keterangan: '' };
};

export const TIME_SLOTS_BY_DAY: Record<HariJadwal, TimeSlotConfig[]> = {
  Senin: [
    { jamKe: 'Pagi-1', rentangWaktu: '07:00 - 07:20', isBreak: true, labelBreak: 'Upacara Bendera' },
    { jamKe: 'Pagi-2', rentangWaktu: '07:20 - 07:40', isBreak: true, labelBreak: 'Upacara Bendera' },
    { jamKe: '1', rentangWaktu: '07:40 - 08:20' },
    { jamKe: '2', rentangWaktu: '08:20 - 09:00' },
    { jamKe: '3A', rentangWaktu: '09:00 - 09:40', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10A, 11A, 12A)' },
    { jamKe: '3B', rentangWaktu: '09:40 - 10:20', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10B, 11B, 12B)' },
    { jamKe: '4', rentangWaktu: '10:20 - 11:00' },
    { jamKe: '5', rentangWaktu: '11:00 - 11:40' },
    { jamKe: 'Break-2', rentangWaktu: '11:40 - 12:00', isBreak: true, labelBreak: 'Istirahat 2' },
    { jamKe: 'Dhuhur', rentangWaktu: '12:00 - 12:40', isBreak: true, labelBreak: 'Sholat Dhuhur' },
    { jamKe: '6', rentangWaktu: '12:40 - 13:20' },
    { jamKe: '7', rentangWaktu: '13:20 - 14:00' },
    { jamKe: '8', rentangWaktu: '14:00 - 14:40' },
    { jamKe: '9', rentangWaktu: '14:40 - 15:20' },
    { jamKe: 'Ashar', rentangWaktu: '15:30 - 15:50', isBreak: true, labelBreak: 'Sholat Ashar' },
    { jamKe: 'Pulang', rentangWaktu: '15:50', isBreak: true, labelBreak: 'Pulang' },
  ],
  Selasa: [
    { jamKe: 'Pagi-1', rentangWaktu: '07:00 - 07:20', isBreak: true, labelBreak: 'Dzikir Pagi' },
    { jamKe: 'Pagi-2', rentangWaktu: '07:20 - 07:40', isBreak: true, labelBreak: 'Tadarus Al-Qur\'an' },
    { jamKe: '1', rentangWaktu: '07:40 - 08:20' },
    { jamKe: '2', rentangWaktu: '08:20 - 09:00' },
    { jamKe: '3A', rentangWaktu: '09:00 - 09:40', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10A, 11A, 12A)' },
    { jamKe: '3B', rentangWaktu: '09:40 - 10:20', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10B, 11B, 12B)' },
    { jamKe: '4', rentangWaktu: '10:20 - 11:00' },
    { jamKe: '5', rentangWaktu: '11:00 - 11:40' },
    { jamKe: 'Break-2', rentangWaktu: '11:40 - 12:00', isBreak: true, labelBreak: 'Istirahat 2' },
    { jamKe: 'Dhuhur', rentangWaktu: '12:00 - 12:40', isBreak: true, labelBreak: 'Sholat Dhuhur' },
    { jamKe: '6', rentangWaktu: '12:40 - 13:20' },
    { jamKe: '7', rentangWaktu: '13:20 - 14:00' },
    { jamKe: '8', rentangWaktu: '14:00 - 14:40' },
    { jamKe: '9', rentangWaktu: '14:40 - 15:20' },
    { jamKe: 'Ashar', rentangWaktu: '15:30 - 15:50', isBreak: true, labelBreak: 'Sholat Ashar' },
    { jamKe: 'Pulang', rentangWaktu: '15:50', isBreak: true, labelBreak: 'Pulang' },
  ],
  Rabu: [
    { jamKe: 'Pagi-1', rentangWaktu: '07:00 - 07:20', isBreak: true, labelBreak: 'Adab' },
    { jamKe: 'Pagi-2', rentangWaktu: '07:20 - 07:40', isBreak: true, labelBreak: 'Adab' },
    { jamKe: '1', rentangWaktu: '07:40 - 08:20' },
    { jamKe: '2', rentangWaktu: '08:20 - 09:00' },
    { jamKe: '3A', rentangWaktu: '09:00 - 09:40', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10A, 11A, 12A)' },
    { jamKe: '3B', rentangWaktu: '09:40 - 10:20', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10B, 11B, 12B)' },
    { jamKe: '4', rentangWaktu: '10:20 - 11:00' },
    { jamKe: '5', rentangWaktu: '11:00 - 11:40' },
    { jamKe: 'Break-2', rentangWaktu: '11:40 - 12:00', isBreak: true, labelBreak: 'Istirahat 2' },
    { jamKe: 'Dhuhur', rentangWaktu: '12:00 - 12:40', isBreak: true, labelBreak: 'Sholat Dhuhur' },
    { jamKe: '6', rentangWaktu: '12:40 - 13:20' },
    { jamKe: '7', rentangWaktu: '13:20 - 14:00' },
    { jamKe: '8', rentangWaktu: '14:00 - 14:40' },
    { jamKe: '9', rentangWaktu: '14:40 - 15:20' },
    { jamKe: 'Ashar', rentangWaktu: '15:30 - 15:50', isBreak: true, labelBreak: 'Sholat Ashar' },
    { jamKe: 'Pulang', rentangWaktu: '15:50', isBreak: true, labelBreak: 'Pulang' },
  ],
  Kamis: [
    { jamKe: 'Pagi-1', rentangWaktu: '07:00 - 07:20', isBreak: true, labelBreak: 'Adab' },
    { jamKe: 'Pagi-2', rentangWaktu: '07:20 - 07:40', isBreak: true, labelBreak: 'Adab' },
    { jamKe: '1', rentangWaktu: '07:40 - 08:20' },
    { jamKe: '2', rentangWaktu: '08:20 - 09:00' },
    { jamKe: '3A', rentangWaktu: '09:00 - 09:40', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10A, 11A, 12A)' },
    { jamKe: '3B', rentangWaktu: '09:40 - 10:20', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10B, 11B, 12B)' },
    { jamKe: '4', rentangWaktu: '10:20 - 11:00' },
    { jamKe: '5', rentangWaktu: '11:00 - 11:40' },
    { jamKe: 'Break-2', rentangWaktu: '11:40 - 12:00', isBreak: true, labelBreak: 'Istirahat 2' },
    { jamKe: 'Dhuhur', rentangWaktu: '12:00 - 12:40', isBreak: true, labelBreak: 'Sholat Dhuhur' },
    { jamKe: '6', rentangWaktu: '12:40 - 13:20' },
    { jamKe: '7', rentangWaktu: '13:20 - 14:00' },
    { jamKe: '8', rentangWaktu: '14:00 - 14:40' },
    { jamKe: '9', rentangWaktu: '14:40 - 15:20' },
    { jamKe: 'Ashar', rentangWaktu: '15:30 - 15:50', isBreak: true, labelBreak: 'Sholat Ashar' },
    { jamKe: 'Pulang', rentangWaktu: '15:50', isBreak: true, labelBreak: 'Pulang' },
  ],
  Jumat: [
    { jamKe: 'Pagi-1', rentangWaktu: '07:00 - 07:20', isBreak: true, labelBreak: 'Dzikir Pagi' },
    { jamKe: 'Pagi-2', rentangWaktu: '07:20 - 07:40', isBreak: true, labelBreak: 'Wali Kelas' },
    { jamKe: '1', rentangWaktu: '07:40 - 08:20' },
    { jamKe: '2', rentangWaktu: '08:20 - 09:00' },
    { jamKe: '3A', rentangWaktu: '09:00 - 09:40', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10B, 11B, 12B)' },
    { jamKe: '3B', rentangWaktu: '09:40 - 10:20', isStaggeredBreak: true, labelBreak: 'Istirahat 1, Dhuha (10A, 11A, 12A)' },
    { jamKe: '4', rentangWaktu: '10:20 - 11:00' },
    { jamKe: '5', rentangWaktu: '11:00 - 11:40' },
    { jamKe: 'Al-Kahfi', rentangWaktu: '11:40 - 12:00', isBreak: true, labelBreak: 'Al-Kahfi' },
    { jamKe: 'Jumat', rentangWaktu: '12:00 - 13:00', isBreak: true, labelBreak: 'Shalat Jumat' },
  ]
};

// Helper resolver for teacher name from code
export const getTeacherName = (kode: string): string => {
  const g = GURU_INITIALS.find(item => item.kode === kode);
  return g ? g.nama : kode;
};

// Helper raw matrix entries corresponding exactly to user's 5 schedule images
interface RawSlot {
  hari: HariJadwal;
  jamKe: string;
  waktu: string;
  kelas: '10-A' | '10-B' | '11-A' | '11-B' | '12-A' | '12-B';
  mapel: string;
  kode: string;
  ruang?: string;
}

const RAW_SCHEDULE: RawSlot[] = [
  // ==========================================
  // SENIN (Monday)
  // ==========================================
  // Jam 1 (07.40 - 08.20)
  { hari: 'Senin', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-A', mapel: 'Koding dan AI', kode: 'KH' },
  { hari: 'Senin', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-B', mapel: 'Bimbingan Konseling', kode: 'TS' },
  { hari: 'Senin', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Senin', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Senin', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Senin', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-B', mapel: 'Bahasa Arab', kode: 'SA' },

  // Jam 2 (08.20 - 09.00)
  { hari: 'Senin', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-A', mapel: 'Koding dan AI', kode: 'KH' },
  { hari: 'Senin', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-B', mapel: 'Bhs. Inggris', kode: 'BA' },
  { hari: 'Senin', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Senin', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Senin', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Senin', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-B', mapel: 'Bahasa Arab', kode: 'SA' },

  // Jam 3A (09.00 - 09.40) - Istirahat 1 untuk 10A, 11A, 12A
  { hari: 'Senin', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '10-B', mapel: 'Bhs. Inggris', kode: 'BA' },
  { hari: 'Senin', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '11-B', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Senin', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '12-B', mapel: 'Bahasa Arab', kode: 'SA' },

  // Jam 3B (09.40 - 10.20) - Istirahat 1 untuk 10B, 11B, 12B
  { hari: 'Senin', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Senin', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '11-A', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Senin', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },

  // Jam 4 (10.20 - 11.00)
  { hari: 'Senin', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Senin', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-B', mapel: 'Proyek IPAS', kode: 'IS' },
  { hari: 'Senin', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-A', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Senin', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Senin', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Senin', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 5 (11.00 - 11.40)
  { hari: 'Senin', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Senin', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-B', mapel: 'Proyek IPAS', kode: 'IS' },
  { hari: 'Senin', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-A', mapel: 'Pendidikan Pancasila', kode: 'SY' },
  { hari: 'Senin', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Senin', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Senin', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 6 (12.40 - 13.20)
  { hari: 'Senin', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-A', mapel: 'Bimbingan Konseling', kode: 'TS' },
  { hari: 'Senin', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-B', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Senin', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Senin', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-B', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },
  { hari: 'Senin', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Senin', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 7 (13.20 - 14.00)
  { hari: 'Senin', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Senin', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-B', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Senin', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Senin', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-B', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },
  { hari: 'Senin', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-A', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Senin', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 8 (14.00 - 14.40)
  { hari: 'Senin', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-A', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Senin', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Senin', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Senin', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Senin', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-A', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Senin', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-B', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },

  // Jam 9 (14.40 - 15.20)
  { hari: 'Senin', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-A', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Senin', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Senin', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Senin', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Senin', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-A', mapel: 'Bimbingan Konseling', kode: 'TS' },
  { hari: 'Senin', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-B', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },

  // ==========================================
  // SELASA (Tuesday)
  // ==========================================
  // Jam 1 (07.40 - 08.20)
  { hari: 'Selasa', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Selasa', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-B', mapel: 'Informatika', kode: 'AY' },
  { hari: 'Selasa', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Selasa', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-B', mapel: 'Sejarah', kode: 'AS' },
  { hari: 'Selasa', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Selasa', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-B', mapel: 'Basis Data', kode: 'KH' },

  // Jam 2 (08.20 - 09.00)
  { hari: 'Selasa', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Selasa', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-B', mapel: 'Informatika', kode: 'AY' },
  { hari: 'Selasa', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Selasa', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Selasa', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Selasa', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-B', mapel: 'Basis Data', kode: 'KH' },

  // Jam 3A (09.00 - 09.40)
  { hari: 'Selasa', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '10-B', mapel: 'Informatika', kode: 'AY' },
  { hari: 'Selasa', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Selasa', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '12-B', mapel: 'Basis Data', kode: 'KH' },

  // Jam 3B (09.40 - 10.20)
  { hari: 'Selasa', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Selasa', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '11-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Selasa', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '12-A', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },

  // Jam 4 (10.20 - 11.00)
  { hari: 'Selasa', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-A', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Selasa', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Selasa', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-A', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Selasa', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Selasa', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-A', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },
  { hari: 'Selasa', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-B', mapel: 'Bhs. Inggris', kode: 'BA' },

  // Jam 5 (11.00 - 11.40)
  { hari: 'Selasa', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-A', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Selasa', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Selasa', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-A', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Selasa', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Selasa', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-A', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Selasa', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-B', mapel: 'Bhs. Inggris', kode: 'BA' },

  // Jam 6 (12.40 - 13.20)
  { hari: 'Selasa', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-A', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'KH' },
  { hari: 'Selasa', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-B', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'IZ' },
  { hari: 'Selasa', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },
  { hari: 'Selasa', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-B', mapel: 'Bahasa Arab', kode: 'SA' },
  { hari: 'Selasa', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-A', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Selasa', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 7 (13.20 - 14.00)
  { hari: 'Selasa', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-A', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'KH' },
  { hari: 'Selasa', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-B', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'IZ' },
  { hari: 'Selasa', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },
  { hari: 'Selasa', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-B', mapel: 'Bahasa Arab', kode: 'SA' },
  { hari: 'Selasa', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-A', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Selasa', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 8 (14.00 - 14.40)
  { hari: 'Selasa', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-A', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Selasa', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-B', mapel: 'Koding dan AI', kode: 'KH' },
  { hari: 'Selasa', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-A', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },
  { hari: 'Selasa', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-B', mapel: 'Bahasa Arab', kode: 'SA' },
  { hari: 'Selasa', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Selasa', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-B', mapel: 'Pemrograman Berorientasi Objek', kode: 'AY' },

  // Jam 9 (14.40 - 15.20)
  { hari: 'Selasa', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-A', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Selasa', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-B', mapel: 'Koding dan AI', kode: 'KH' },
  { hari: 'Selasa', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-A', mapel: 'Kreativitas, Inovasi & Kewirausahaan', kode: 'IZ' },
  { hari: 'Selasa', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Selasa', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Selasa', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-B', mapel: 'Pemrograman Berorientasi Objek', kode: 'AY' },

  // ==========================================
  // RABU (Wednesday)
  // ==========================================
  // Jam 1 (07.40 - 08.20)
  { hari: 'Rabu', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-A', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'KH' },
  { hari: 'Rabu', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-B', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'IZ' },
  { hari: 'Rabu', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Rabu', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-B', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Rabu', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Rabu', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-B', mapel: 'Bimbingan Konseling', kode: 'TS' },

  // Jam 2 (08.20 - 09.00)
  { hari: 'Rabu', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-A', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'KH' },
  { hari: 'Rabu', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-B', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'IZ' },
  { hari: 'Rabu', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-A', mapel: 'Bimbingan Konseling', kode: 'TS' },
  { hari: 'Rabu', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-B', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Rabu', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Rabu', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },

  // Jam 3A (09.00 - 09.40)
  { hari: 'Rabu', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Rabu', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '11-B', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Rabu', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },

  // Jam 3B (09.40 - 10.20)
  { hari: 'Rabu', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Rabu', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '11-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Rabu', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '12-A', mapel: 'Pendidikan Pancasila', kode: 'SY' },

  // Jam 4 (10.20 - 11.00)
  { hari: 'Rabu', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Rabu', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-B', mapel: 'Bhs. Inggris', kode: 'BA' },
  { hari: 'Rabu', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Rabu', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-B', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Rabu', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Rabu', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },

  // Jam 5 (11.00 - 11.40)
  { hari: 'Rabu', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Rabu', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-B', mapel: 'Pendidikan Pancasila', kode: 'SY' },
  { hari: 'Rabu', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Rabu', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-B', mapel: 'Matematika', kode: 'AN' },
  { hari: 'Rabu', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Rabu', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },

  // Jam 6 (12.40 - 13.20)
  { hari: 'Rabu', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-A', mapel: 'Sejarah', kode: 'AS' },
  { hari: 'Rabu', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Rabu', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-A', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Rabu', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-B', mapel: 'Bimbingan Konseling', kode: 'TS' },
  { hari: 'Rabu', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Rabu', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-B', mapel: 'Bhs. Inggris', kode: 'BA' },

  // Jam 7 (13.20 - 14.00)
  { hari: 'Rabu', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-A', mapel: 'Informatika', kode: 'RQ' },
  { hari: 'Rabu', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Rabu', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-A', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Rabu', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-B', mapel: 'Bhs. Inggris', kode: 'BA' },
  { hari: 'Rabu', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Rabu', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-B', mapel: 'PAI', kode: 'ZC' },

  // Jam 8 (14.00 - 14.40)
  { hari: 'Rabu', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-A', mapel: 'Informatika', kode: 'RQ' },
  { hari: 'Rabu', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-B', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Rabu', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Rabu', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-B', mapel: 'Bhs. Inggris', kode: 'BA' },
  { hari: 'Rabu', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Rabu', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-B', mapel: 'PAI', kode: 'ZC' },

  // Jam 9 (14.40 - 15.20)
  { hari: 'Rabu', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-A', mapel: 'Informatika', kode: 'RQ' },
  { hari: 'Rabu', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-B', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Rabu', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Rabu', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-B', mapel: 'Bhs. Inggris', kode: 'BA' },
  { hari: 'Rabu', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Rabu', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-B', mapel: 'PAI', kode: 'ZC' },

  // ==========================================
  // KAMIS (Thursday)
  // ==========================================
  // Jam 1 (07.40 - 08.20)
  { hari: 'Kamis', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Kamis', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-B', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-B', mapel: 'Pendidikan Pancasila', kode: 'SY' },
  { hari: 'Kamis', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Kamis', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 2 (08.20 - 09.00)
  { hari: 'Kamis', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-A', mapel: 'Bhs. Inggris', kode: 'IA' },
  { hari: 'Kamis', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-B', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Kamis', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Kamis', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },

  // Jam 3A (09.00 - 09.40)
  { hari: 'Kamis', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '10-B', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Kamis', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '12-B', mapel: 'Pendidikan Pancasila', kode: 'SY' },

  // Jam 3B (09.40 - 10.20)
  { hari: 'Kamis', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '10-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '11-A', mapel: 'Sejarah', kode: 'AS' },
  { hari: 'Kamis', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '12-A', mapel: 'Pemrograman Web', kode: 'RQ' },

  // Jam 4 (10.20 - 11.00)
  { hari: 'Kamis', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-B', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Kamis', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-A', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Kamis', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-B', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Kamis', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-B', mapel: 'Pemrograman Berorientasi Objek', kode: 'AY' },

  // Jam 5 (11.00 - 11.40)
  { hari: 'Kamis', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-B', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Kamis', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-A', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Kamis', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-B', mapel: 'PJOK', kode: 'MS' },
  { hari: 'Kamis', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-B', mapel: 'Pemrograman Berorientasi Objek', kode: 'AY' },

  // Jam 6 (12.40 - 13.20)
  { hari: 'Kamis', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-A', mapel: 'Seni', kode: 'IZ' },
  { hari: 'Kamis', jamKe: '6', waktu: '12:40 - 13:20', kelas: '10-B', mapel: 'Sejarah', kode: 'AS' },
  { hari: 'Kamis', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },
  { hari: 'Kamis', jamKe: '6', waktu: '12:40 - 13:20', kelas: '11-B', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Kamis', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '6', waktu: '12:40 - 13:20', kelas: '12-B', mapel: 'Pemrograman Berorientasi Objek', kode: 'AY' },

  // Jam 7 (13.20 - 14.00)
  { hari: 'Kamis', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-A', mapel: 'Seni', kode: 'IZ' },
  { hari: 'Kamis', jamKe: '7', waktu: '13:20 - 14:00', kelas: '10-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Kamis', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },
  { hari: 'Kamis', jamKe: '7', waktu: '13:20 - 14:00', kelas: '11-B', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Kamis', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '7', waktu: '13:20 - 14:00', kelas: '12-B', mapel: 'Pemrograman Berorientasi Objek', kode: 'AY' },

  // Jam 8 (14.00 - 14.40)
  { hari: 'Kamis', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-A', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'KH' },
  { hari: 'Kamis', jamKe: '8', waktu: '14:00 - 14:40', kelas: '10-B', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'IZ' },
  { hari: 'Kamis', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '8', waktu: '14:00 - 14:40', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Kamis', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '8', waktu: '14:00 - 14:40', kelas: '12-B', mapel: 'Bahasa Indonesia', kode: 'FA' },

  // Jam 9 (14.40 - 15.20)
  { hari: 'Kamis', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-A', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'KH' },
  { hari: 'Kamis', jamKe: '9', waktu: '14:40 - 15:20', kelas: '10-B', mapel: 'Dasar-dasar Program Keahlian RPL', kode: 'IZ' },
  { hari: 'Kamis', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Kamis', jamKe: '9', waktu: '14:40 - 15:20', kelas: '11-B', mapel: 'Pemrograman Web', kode: 'AY' },
  { hari: 'Kamis', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-A', mapel: 'PAI', kode: 'ZC' },
  { hari: 'Kamis', jamKe: '9', waktu: '14:40 - 15:20', kelas: '12-B', mapel: 'Bahasa Indonesia', kode: 'FA' },

  // ==========================================
  // JUMAT (Friday)
  // ==========================================
  // Jam 1 (07.40 - 08.20)
  { hari: 'Jumat', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-A', mapel: 'Pendidikan Pancasila', kode: 'SY' },
  { hari: 'Jumat', jamKe: '1', waktu: '07:40 - 08:20', kelas: '10-B', mapel: 'Seni', kode: 'IZ' },
  { hari: 'Jumat', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Jumat', jamKe: '1', waktu: '07:40 - 08:20', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Jumat', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },
  { hari: 'Jumat', jamKe: '1', waktu: '07:40 - 08:20', kelas: '12-B', mapel: 'Matematika', kode: 'AN' },

  // Jam 2 (08.20 - 09.00)
  { hari: 'Jumat', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-A', mapel: 'Bahasa Arab', kode: 'MM' },
  { hari: 'Jumat', jamKe: '2', waktu: '08:20 - 09:00', kelas: '10-B', mapel: 'Seni', kode: 'IZ' },
  { hari: 'Jumat', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Jumat', jamKe: '2', waktu: '08:20 - 09:00', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Jumat', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },
  { hari: 'Jumat', jamKe: '2', waktu: '08:20 - 09:00', kelas: '12-B', mapel: 'Matematika', kode: 'AN' },

  // Jam 3A (09.00 - 09.40) - Jumat: 10A, 11A, 12A belajar; 10B, 11B, 12B Istirahat 1
  { hari: 'Jumat', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '10-A', mapel: 'Tahfidz dan Tahsin', kode: 'TD' },
  { hari: 'Jumat', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '11-A', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Jumat', jamKe: '3A', waktu: '09:00 - 09:40', kelas: '12-A', mapel: 'Pemrograman Berorientasi Objek', kode: 'RQ' },

  // Jam 3B (09.40 - 10.20) - Jumat: 10B, 11B, 12B belajar; 10A, 11A, 12A Istirahat 1
  { hari: 'Jumat', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '10-B', mapel: 'Bahasa Arab', kode: 'SA' },
  { hari: 'Jumat', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '11-B', mapel: 'Tahfidz dan Tahsin', kode: 'MT' },
  { hari: 'Jumat', jamKe: '3B', waktu: '09:40 - 10:20', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },

  // Jam 4 (10.20 - 11.00)
  { hari: 'Jumat', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-A', mapel: 'Proyek IPAS', kode: 'IS' },
  { hari: 'Jumat', jamKe: '4', waktu: '10:20 - 11:00', kelas: '10-B', mapel: 'Bahasa Arab', kode: 'SA' },
  { hari: 'Jumat', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Jumat', jamKe: '4', waktu: '10:20 - 11:00', kelas: '11-B', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Jumat', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-A', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Jumat', jamKe: '4', waktu: '10:20 - 11:00', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },

  // Jam 5 (11.00 - 11.40)
  { hari: 'Jumat', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-A', mapel: 'Proyek IPAS', kode: 'IS' },
  { hari: 'Jumat', jamKe: '5', waktu: '11:00 - 11:40', kelas: '10-B', mapel: 'Bahasa Arab', kode: 'SA' },
  { hari: 'Jumat', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-A', mapel: 'Pemrograman Web', kode: 'RQ' },
  { hari: 'Jumat', jamKe: '5', waktu: '11:00 - 11:40', kelas: '11-B', mapel: 'Basis Data', kode: 'KH' },
  { hari: 'Jumat', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-A', mapel: 'Bahasa Indonesia', kode: 'FA' },
  { hari: 'Jumat', jamKe: '5', waktu: '11:00 - 11:40', kelas: '12-B', mapel: 'Pemrograman Web', kode: 'AY' },
];

export const INITIAL_SCHEDULE_SLOTS: SlotJadwalPelajaran[] = RAW_SCHEDULE.map((s, idx) => ({
  id: `sch-${s.hari.toLowerCase().slice(0, 3)}-${s.kelas.toLowerCase().replace('-', '')}-${s.jamKe.toLowerCase()}-${idx}`,
  hari: s.hari,
  jamKe: s.jamKe,
  rentangWaktu: s.waktu,
  kelas: s.kelas,
  mataPelajaran: s.mapel,
  kodeGuru: s.kode,
  guruNama: getTeacherName(s.kode),
  ruang: s.ruang || `Kelas ${s.kelas}`,
}));
