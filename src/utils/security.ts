/**
 * Security & Financial Calculation Engine
 * SMK IT Ibnul Qayyim Makassar
 */

import { Pegawai, RekapPresensi, PenggajianRecord, StatusPenggajian } from '../types';

let globalSalaryHidden = true;

export function setGlobalSalaryPrivacy(hidden: boolean): void {
  globalSalaryHidden = hidden;
}

export function isGlobalSalaryHidden(): boolean {
  return globalSalaryHidden;
}

/**
 * Mendapatkan string tanggal hari ini dalam format YYYY-MM-DD lokal
 */
export function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatRupiah(amount: number, hideOverride?: boolean): string {
  const hidden = hideOverride !== undefined ? hideOverride : globalSalaryHidden;
  if (hidden) return '*****';
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number, hideOverride?: boolean): string {
  const hidden = hideOverride !== undefined ? hideOverride : globalSalaryHidden;
  if (hidden) return '*****';
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Konversi angka nominal ke kalimat terbilang bahasa Indonesia
 */
export function terbilang(nilai: number, hideOverride?: boolean): string {
  const hidden = hideOverride !== undefined ? hideOverride : globalSalaryHidden;
  if (hidden) return '*****';

  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function convert(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return convert(n - 10) + ' Belas';
    } else if (n < 100) {
      return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + convert(n - 100);
    } else if (n < 1000) {
      return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + convert(n - 1000);
    } else if (n < 1000000) {
      return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    } else if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    } else if (n < 1000000000000) {
      return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000);
    }
    return '';
  }

  const cleanNilai = Math.floor(Math.abs(nilai));
  if (cleanNilai === 0) return 'Nol Rupiah';
  
  const hasil = convert(cleanNilai).replace(/\s+/g, ' ').trim() + ' Rupiah';
  return hasil;
}

/**
 * Masking data sensitif rekening atau NIK
 */
export function maskData(str: string, visiblePrefix = 3, visibleSuffix = 3): string {
  if (!str) return '***';
  if (str.length <= visiblePrefix + visibleSuffix) return str;
  const prefix = str.slice(0, visiblePrefix);
  const suffix = str.slice(-visibleSuffix);
  const maskedLength = Math.max(3, str.length - visiblePrefix - visibleSuffix);
  return `${prefix}${'•'.repeat(maskedLength)}${suffix}`;
}

/**
 * Simulasi enkripsi AES-256-GCM / SHA-256 Checksum
 */
export function generateChecksum(payload: string): string {
  // Simple fast deterministic hash for verification simulation
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SEC-AES256-${hex.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Kalkulasi Rincian Penggajian Otomatis
 */
/**
 * Menghitung rentang periode cut-off presensi & jam mengajar:
 * - Data presensi/JP dihitung dari tanggal 23 bulan sebelumnya s/d tanggal 22 bulan berjalan
 * - Pembayaran/transfer gaji diproses mulai tanggal 25 bulan berjalan
 */
export function getPayrollCutoffDates(bulan: number, tahun: number) {
  let prevMonth = bulan - 1;
  let prevYear = tahun;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = tahun - 1;
  }
  
  const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-23`;
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-22`;
  const paymentDate = `${tahun}-${String(bulan).padStart(2, '0')}-25`;
  
  const bulanNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const bulanNamesLong = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const cutoffLabelShort = `23 ${bulanNamesShort[prevMonth - 1]} - 22 ${bulanNamesShort[bulan - 1]} ${tahun}`;
  const cutoffLabelLong = `23 ${bulanNamesLong[prevMonth - 1]} ${prevYear} s/d 22 ${bulanNamesLong[bulan - 1]} ${tahun}`;
  const paymentLabel = `25 ${bulanNamesLong[bulan - 1]} ${tahun}`;
  const periodeLabel = `${bulanNamesLong[bulan - 1]} ${tahun}`;
  
  return {
    startDate,
    endDate,
    paymentDate,
    cutoffLabelShort,
    cutoffLabelLong,
    paymentLabel,
    periodeLabel,
    prevMonth,
    prevYear,
  };
}

export function kalkulasiPenggajian(
  pegawai: Pegawai,
  presensi: RekapPresensi,
  options?: {
    tunjanganLainnya?: number;
    potonganKoperasi?: number;
    potonganLainnya?: number;
    honorInfal?: number;
    jpMenggantikan?: number;
    potonganInfal?: number;
    jpDigantikan?: number;
    insentifKajianMuslimah?: number;
    potonganKeterlambatan?: number;
    potonganTidakMasuk?: number;
    koreksiPenerimaan?: number;
    koreksiPotongan?: number;
    potonganPinjaman?: number;
    tahun?: number;
    bulan?: number;
  }
): Omit<PenggajianRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const bulan = options?.bulan ?? presensi.bulan;
  const tahun = options?.tahun ?? presensi.tahun;
  const cutoffInfo = getPayrollCutoffDates(bulan, tahun);
  const periodeLabel = cutoffInfo.periodeLabel;
  
  // Status Induk vs Non-Induk
  const isNonInduk = (pegawai.statusInduk || '').toLowerCase().includes('non') || pegawai.statusInduk === 'Non Induk';
  
  // 1. Gaji Pokok
  const gajiPokok = isNonInduk ? 0 : (pegawai.gajiPokokDefault || 0);

  // 2. Tunjangan Jabatan Struktural
  const tunjanganKepsek = isNonInduk ? 0 : (pegawai.tunjanganKepsekDefault || 0);
  const tunjanganWakasek = isNonInduk ? 0 : (pegawai.tunjanganWakasekDefault || 0);
  const tunjanganWaliKelas = isNonInduk ? 0 : (pegawai.tunjanganWaliKelas || 0);
  const tunjanganItOfficer = isNonInduk ? 0 : (pegawai.tunjanganItOfficerDefault || 0);
  const tunjanganDkm = isNonInduk ? 0 : (pegawai.tunjanganDkmDefault || 0);
  const tunjanganAsrama = isNonInduk ? 0 : (pegawai.tunjanganAsramaDefault || 0);
  const tunjanganBendahara = isNonInduk ? 0 : (pegawai.tunjanganBendaharaDefault || 0);
  const tunjanganPj = isNonInduk ? 0 : (pegawai.tunjanganPjDefault || 0);
  
  // Total Tunjangan Jabatan: sum of structural roles, or fallback to tunjanganJabatanDefault
  const calculatedTunjanganJabatan = tunjanganKepsek + tunjanganWakasek + tunjanganWaliKelas + tunjanganItOfficer + tunjanganDkm + tunjanganAsrama + tunjanganBendahara + tunjanganPj;
  const tunjanganJabatan = isNonInduk ? 0 : (calculatedTunjanganJabatan > 0 ? calculatedTunjanganJabatan : (pegawai.tunjanganJabatanDefault || 0));

  // 3. Tunjangan Ijazah
  const jenjang = pegawai.tunjanganIjazahJenjang || pegawai.pendidikanTerakhir || '-';
  let nilaiIjazahDefault = 0;
  if (jenjang === 'S2' || jenjang === 'S3') nilaiIjazahDefault = 500000;
  else if (jenjang === 'S1') nilaiIjazahDefault = 300000;
  else if (jenjang === 'D3') nilaiIjazahDefault = 275000;
  else if (jenjang === 'D2') nilaiIjazahDefault = 250000;
  else if (jenjang === 'D1') nilaiIjazahDefault = 225000;
  else if (jenjang === 'SMA') nilaiIjazahDefault = 200000;
  
  const tunjanganIjazah = isNonInduk ? 0 : (pegawai.tunjanganIjazahDefault !== undefined ? pegawai.tunjanganIjazahDefault : nilaiIjazahDefault);
  const tunjanganIjazahJenjang = isNonInduk ? '-' : jenjang;

  // 4. Tunjangan Kompetensi / Linieritas (Rp 50.000 jika linier)
  const isLinierKompetensi = isNonInduk ? false : Boolean(pegawai.isLinierKompetensi);
  const tunjanganKompetensi = isLinierKompetensi ? 50000 : 0;

  // 5. Tunjangan Pengalaman (Tahun x Rp 50.000)
  const tahunPengalaman = isNonInduk ? 0 : (pegawai.tahunPengalaman || 0);
  const tunjanganPengalaman = tahunPengalaman * 50000;

  // 6. Tunjangan Masa Kerja (TMK) (Tahun x Rp 50.000)
  const tahunMasaKerja = isNonInduk ? 0 : (pegawai.tahunMasaKerja || 0);
  const tunjanganMasaKerja = tahunMasaKerja * 50000;

  // 7. Tunjangan Kinerja
  const tunjanganKinerja = isNonInduk ? 0 : (pegawai.tunjanganKinerjaDefault || 0);

  // 8. Tunjangan Kehadiran (Hari Hadir x Rp 20.000)
  const hariHadir = presensi.hadir || 0;
  const tunjanganKehadiran = isNonInduk ? 0 : (hariHadir * (pegawai.tarifTransportHarian || 20000));
  const tunjanganKehadiranTransport = tunjanganKehadiran;

  // 9. Honor Jam Mengajar (JP Mengajar x Rp 18.000)
  const jamMengajarRealisasi = presensi.jamMengajarRealisasi || 0;
  const tarifJP = pegawai.tarifPerJamMengajar || 18000;
  const honorJamMengajar = jamMengajarRealisasi * tarifJP;

  // 10. Tambahan: Mengganti JP (Honor Infal: JP x Rp 7.500)
  const jpMenggantikan = options?.jpMenggantikan ?? presensi.jumlahJpMenggantikan ?? 0;
  const honorInfal = options?.honorInfal ?? presensi.honorInfalTotal ?? (jpMenggantikan * 7500);

  // 10b. Tambahan: Insentif Kajian Muslimah
  const insentifKajianMuslimah = isNonInduk ? 0 : (options?.insentifKajianMuslimah ?? (presensi as any).insentifKajianMuslimah ?? 0);

  // 11. Koreksi Penerimaan
  const koreksiPenerimaan = isNonInduk ? 0 : (options?.koreksiPenerimaan ?? (presensi as any).koreksiPenerimaan ?? 0);

  // Lembur & Vokasi
  const jamLembur = isNonInduk ? 0 : (presensi.jamLemburTotal || 0);
  const tarifLembur = pegawai.tarifLemburPerJam || 20000;
  const honorLembur = isNonInduk ? 0 : (jamLembur * tarifLembur);
  const tunjanganVokasiIT = isNonInduk ? 0 : (pegawai.tunjanganKhususVokasi || 0);
  const tunjanganLainnya = isNonInduk ? 0 : ((options?.tunjanganLainnya || 0) + (pegawai.tunjanganKeluarga || 0));

  // TOTAL PENERIMAAN
  const totalPenerimaan = 
    gajiPokok + 
    tunjanganJabatan + 
    tunjanganIjazah +
    tunjanganKompetensi +
    tunjanganPengalaman +
    tunjanganMasaKerja +
    tunjanganKinerja +
    tunjanganKehadiran +
    honorJamMengajar + 
    honorInfal +
    insentifKajianMuslimah +
    koreksiPenerimaan +
    honorLembur +
    tunjanganVokasiIT + 
    tunjanganLainnya;

  // 2. POTONGAN RESMI
  // Potongan Keterlambatan (Rupiah Langsung)
  const potonganKeterlambatan = isNonInduk ? 0 : (
    options?.potonganKeterlambatan !== undefined 
      ? options.potonganKeterlambatan 
      : ((presensi as any).potonganKeterlambatan !== undefined 
          ? (presensi as any).potonganKeterlambatan 
          : ((presensi.menitTerlambat || 0) * 1500))
  );

  // Potongan Tidak Masuk (Hari x Rp 20.000)
  const hariTidakMasuk = (presensi.alpha || 0) + ((presensi as any).hariTidakMasuk || 0);
  const potonganTidakMasuk = isNonInduk ? 0 : (
    options?.potonganTidakMasuk !== undefined
      ? options.potonganTidakMasuk
      : ((presensi as any).potonganTidakMasuk !== undefined
          ? (presensi as any).potonganTidakMasuk
          : (hariTidakMasuk * 20000))
  );
  const potonganAlpha = potonganTidakMasuk;

  // Potongan Diganti JP (JP x Rp 7.500)
  const jpDigantikan = options?.jpDigantikan ?? presensi.jumlahJpDigantikan ?? 0;
  const potonganInfal = options?.potonganInfal ?? presensi.potonganInfalTotal ?? (jpDigantikan * 7500);

  // Koreksi Potongan
  const koreksiPotongan = isNonInduk ? 0 : (options?.koreksiPotongan ?? (presensi as any).koreksiPotongan ?? 0);

  // Potongan Pinjaman
  const potonganPinjaman = isNonInduk ? 0 : (options?.potonganPinjaman ?? (presensi as any).potonganPinjaman ?? 0);

  const potonganIzin = isNonInduk ? 0 : (presensi.potonganIzinTidakResmi || 0);
  const potonganBpjsKesehatan = isNonInduk ? 0 : (pegawai.potonganBpjsKesehatan || 0);
  const potonganBpjsKetenagakerjaan = isNonInduk ? 0 : (pegawai.potonganBpjsKetenagakerjaan || 0);
  const potonganKasSekolah = isNonInduk ? 0 : (pegawai.potonganKasSekolah || 0);
  const potonganKoperasi = isNonInduk ? 0 : (options?.potonganKoperasi || 0);
  const potonganLainnya = isNonInduk ? 0 : (options?.potonganLainnya || 0);

  // TOTAL POTONGAN
  const totalPotongan = 
    potonganKeterlambatan + 
    potonganTidakMasuk + 
    potonganInfal +
    koreksiPotongan +
    potonganPinjaman +
    potonganIzin +
    potonganBpjsKesehatan + 
    potonganBpjsKetenagakerjaan + 
    potonganKasSekolah + 
    potonganKoperasi + 
    potonganLainnya;

  // 3. TAKE HOME PAY (Gaji Bersih)
  const gajiBersih = Math.max(0, totalPenerimaan - totalPotongan);

  const kodeSlip = `SLIP/${tahun}/${String(bulan).padStart(2, '0')}/IQM-${pegawai.nip.slice(-4)}`;
  const payloadSign = `${kodeSlip}|${pegawai.id}|${gajiBersih}|${totalPenerimaan}|${totalPotongan}`;
  const checksum = generateChecksum(payloadSign);
  const qrVerificationUrl = `https://smkit-ibnulqayyim.sch.id/verify-slip?code=${encodeURIComponent(kodeSlip)}&sig=${checksum.slice(0, 12)}`;

  return {
    kodeSlip,
    pegawaiId: pegawai.id,
    pegawaiNama: pegawai.nama,
    pegawaiNip: pegawai.nip,
    pegawaiJabatan: pegawai.jabatanUtama,
    pegawaiStatus: pegawai.statusPegawai,
    statusInduk: pegawai.statusInduk || 'Induk',
    keteranganInduk: pegawai.keteranganInduk,
    pegawaiEmail: pegawai.email,
    bulan,
    tahun,
    periodeLabel,
    tanggalCutoffMulai: cutoffInfo.startDate,
    tanggalCutoffSelesai: cutoffInfo.endDate,
    tanggalMulaiBayar: cutoffInfo.paymentDate,
    periodeCutoffLabel: cutoffInfo.cutoffLabelLong,
    
    presensiHadir: presensi.hadir,
    presensiAlpha: presensi.alpha,
    presensiIzin: presensi.izin,
    presensiSakit: presensi.sakit,
    presensiCuti: presensi.cuti || 0,
    presensiDinasLuar: presensi.dinasLuar || 0,
    presensiTerlambatMenit: presensi.menitTerlambat,
    jamMengajarRealisasi: presensi.jamMengajarRealisasi,
    jamLembur,
    
    // Rincian Penerimaan
    gajiPokok,
    tunjanganJabatan,
    tunjanganKepsek,
    tunjanganWakasek,
    tunjanganWaliKelas,
    tunjanganItOfficer,
    tunjanganDkm,
    tunjanganAsrama,
    tunjanganBendahara,
    tunjanganPj,
    tunjanganIjazahJenjang,
    tunjanganIjazah,
    isLinierKompetensi,
    tunjanganKompetensi,
    tahunPengalaman,
    tunjanganPengalaman,
    tahunMasaKerja,
    tunjanganMasaKerja,
    tunjanganKinerja,
    tunjanganKehadiran,
    tunjanganKehadiranTransport,
    honorJamMengajar,
    honorLembur,
    honorInfal,
    jpMenggantikan,
    insentifKajianMuslimah,
    koreksiPenerimaan,
    tunjanganVokasiIT,
    tunjanganLainnya,
    totalPenerimaan,
    
    // Rincian Potongan
    potonganKeterlambatan,
    potonganTidakMasuk,
    potonganAlpha,
    potonganIzin,
    potonganInfal,
    jpDigantikan,
    koreksiPotongan,
    potonganPinjaman,
    potonganBpjsKesehatan,
    potonganBpjsKetenagakerjaan,
    potonganKasSekolah,
    potonganKoperasi,
    potonganLainnya,
    totalPotongan,
    
    gajiBersih,
    status: 'draft' as StatusPenggajian,
    
    emailSent: false,
    isEncrypted: true,
    securityChecksum: checksum,
    qrVerificationUrl,
  };
}
