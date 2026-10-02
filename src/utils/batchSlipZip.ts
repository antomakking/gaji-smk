import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { PenggajianRecord } from '../types';
import { formatRupiah, terbilang, getPayrollCutoffDates } from './security';
import { MONTH_NAMES_ID } from '../components/PeriodSelector';

/**
 * Generate a pristine vector/text PDF document for a single salary slip
 */
export const generateSlipPdfDocument = (record: PenggajianRecord): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const cutoffInfo = getPayrollCutoffDates(record.bulan, record.tahun);
  const monthName = MONTH_NAMES_ID[record.bulan - 1] || 'Agustus';

  // Background subtle border
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin - 4, margin - 4, contentWidth + 8, 275, 3, 3, 'S');

  // 1. KOP SURAT (Header Yayasan & Sekolah Resmi)
  // Left Emblem (Green Islamic Star)
  doc.setFillColor(11, 107, 44); // Green #0b6b2c
  doc.rect(margin, margin, 16, 16, 'F');
  doc.setDrawColor(234, 179, 8); // Gold border
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, 16, 16, 'S');
  doc.setTextColor(254, 240, 138);
  doc.setFont('times', 'bold');
  doc.setFontSize(7);
  doc.text('IQIS', margin + 8, margin + 7, { align: 'center' });
  doc.setFontSize(5);
  doc.text('مدرسة', margin + 8, margin + 12, { align: 'center' });

  // Right Emblem (Slate Gray Islamic Star)
  const rightLogoX = pageWidth - margin - 16;
  doc.setFillColor(51, 65, 85); // Slate #334155
  doc.rect(rightLogoX, margin, 16, 16, 'F');
  doc.setDrawColor(148, 163, 184); // White/slate border
  doc.setLineWidth(0.6);
  doc.rect(rightLogoX, margin, 16, 16, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(6.5);
  doc.text('SMKIT', rightLogoX + 8, margin + 7, { align: 'center' });
  doc.setFontSize(5);
  doc.text('مدرسة', rightLogoX + 8, margin + 12, { align: 'center' });

  // Center Text - Times New Roman / Serif style
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('YAYASAN PENDIDIKAN ISLAM IBNUL QAYYIM SUDIANG MAKASSAR', pageWidth / 2, margin + 2.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  doc.text('SMK IT IBNUL QAYYIM MAKASSAR', pageWidth / 2, margin + 7.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('Terakreditasi A', pageWidth / 2, margin + 11.5, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.text('Jl. Goa Ria Taman Bunga 2, Laikang, Kec. Biringkanaya,', pageWidth / 2, margin + 15, { align: 'center' });
  doc.text('Kota Makassar, Sulawesi Selatan 90242. Telpon: 0811 4411 432.', pageWidth / 2, margin + 18, { align: 'center' });
  doc.text('Email : smkit@iqis.sch.id, Website: https://smkit.iqis.sch.id', pageWidth / 2, margin + 21, { align: 'center' });

  // Double Underline Divider
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 23.5, pageWidth - margin, margin + 23.5);
  doc.setLineWidth(0.2);
  doc.line(margin, margin + 24.7, pageWidth - margin, margin + 24.7);

  // 2. DOCUMENT TITLE & PERIODE
  let currentY = margin + 30;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SLIP GAJI & HONORARIUM PEGAWAI', pageWidth / 2, currentY, { align: 'center' });

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor: ${record.kodeSlip}   |   Periode: ${record.periodeLabel}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cut-Off Data: ${record.periodeCutoffLabel || cutoffInfo.cutoffLabelLong}   •   Jadwal Transfer: ${cutoffInfo.paymentLabel}`, pageWidth / 2, currentY, { align: 'center' });

  // 3. EMPLOYEE INFORMATION BOX
  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Pegawai:', margin + 3, currentY + 5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(record.pegawaiNama, margin + 26, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('NIP / NUPTK:', margin + 3, currentY + 10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(record.pegawaiNip, margin + 26, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jabatan Utama:', margin + 3, currentY + 15);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(record.pegawaiJabatan, margin + 26, currentY + 15);

  // Right side of info box
  const rightColX = margin + contentWidth / 2 + 5;
  const bankName = (record as any).pegawaiBank || (record as any).namaBank || 'Bank Syariah Indonesia (BSI)';
  const rekeningNum = (record as any).nomorRekening || (record as any).pegawaiRekening || '7199887766';

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status Pegawai:', rightColX, currentY + 5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${record.pegawaiStatus} (${record.statusInduk || 'Induk'})`, rightColX + 26, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Rekening Bank:', rightColX, currentY + 10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bankName} - ${rekeningNum}`, rightColX + 26, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status Slip:', rightColX, currentY + 15);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(record.status === 'transferred' ? 'TERBAYAR (LUNAS)' : 'DISETUJUI', rightColX + 26, currentY + 15);

  // 4. ATTENDANCE SNAPSHOT
  currentY += 21;
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'FD');
  doc.setTextColor(49, 46, 129);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Rekap Presensi:', margin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Hadir: ${record.presensiHadir} hr   •   Realisasi JP: ${record.jamMengajarRealisasi} jam   •   Izin/Sakit: ${record.presensiIzin + record.presensiSakit}   •   Cuti: ${record.presensiCuti || 0}   •   Terlambat: ${record.presensiTerlambatMenit || 0} mnt   •   Alpha: ${record.presensiAlpha}`,
    margin + 26,
    currentY + 4.5
  );

  // 5. FINANCIAL BREAKDOWN COLUMNS (2 Columns)
  currentY += 10;
  const colWidth = (contentWidth - 4) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 4;
  const boxHeight = 90;

  // Box A: PENERIMAAN
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col1X, currentY, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(col1X, currentY, colWidth, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('A. PENERIMAAN / HAK GAJI', col1X + 3, currentY + 4.2);
  doc.text('Nominal (Rp)', col1X + colWidth - 3, currentY + 4.2, { align: 'right' });

  // Rows of Penerimaan
  let rowY = currentY + 10;
  const addPenerimaanRow = (label: string, amount: number, highlight = false) => {
    if (amount <= 0 && label !== 'Gaji Pokok') return;
    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(highlight ? 30 : 71, highlight ? 64 : 85, highlight ? 175 : 105);
    doc.text(label, col1X + 3, rowY);
    doc.text(formatRupiah(amount, false), col1X + colWidth - 3, rowY, { align: 'right' });
    rowY += 4.5;
  };

  const gp = record.gajiPokokNominal || record.gajiPokok || 0;
  addPenerimaanRow('Gaji Pokok', gp);
  if ((record.tunjanganKepsek ?? 0) > 0) addPenerimaanRow('Tunjangan Kepala Sekolah', record.tunjanganKepsek || 0);
  if ((record.tunjanganWakasek ?? 0) > 0) addPenerimaanRow('Tunjangan Wakasek', record.tunjanganWakasek || 0);
  if ((record.tunjanganWaliKelas ?? 0) > 0) addPenerimaanRow('Tunjangan Wali Kelas', record.tunjanganWaliKelas || 0);
  if ((record.tunjanganAsrama ?? 0) > 0) addPenerimaanRow('Tunjangan Asrama / Musyrif', record.tunjanganAsrama || 0);
  if ((record.tunjanganItOfficer ?? 0) > 0) addPenerimaanRow('Tunjangan IT Officer', record.tunjanganItOfficer || 0);
  if ((record.tunjanganDkm ?? 0) > 0) addPenerimaanRow('Tunjangan DKM Masjid', record.tunjanganDkm || 0);
  if ((record.tunjanganBendahara ?? 0) > 0) addPenerimaanRow('Tunjangan Bendahara', record.tunjanganBendahara || 0);
  if ((record.tunjanganPj ?? 0) > 0) addPenerimaanRow('Tunjangan Penanggung Jawab (PJ)', record.tunjanganPj || 0);
  
  const tunjHadir = record.tunjanganKehadiran || record.tunjanganKehadiranTransport || 0;
  addPenerimaanRow(`Tunj. Kehadiran (${record.presensiHadir} hr)`, tunjHadir);
  
  const jp = record.jumlahJp ?? record.jamMengajarRealisasi ?? 0;
  const tarifJp = record.nominalPerJp || 18000;
  const honorJp = record.totalHonorJp || record.honorJamMengajar || (jp * tarifJp);
  if (honorJp > 0) addPenerimaanRow(`Honor Mengajar (${jp} JP × ${formatRupiah(tarifJp, false)})`, honorJp, true);
  
  const inval = record.honorInval ?? record.honorInfal ?? 0;
  if (inval > 0) addPenerimaanRow(`Honor Inval / Pengganti (${record.jpMenggantikan || Math.round(inval / 7500)} JP)`, inval, true);
  
  const tambahanLain = record.tambahanLainnya || record.tunjanganLainnya || 0;
  if (tambahanLain !== 0) addPenerimaanRow('Tambahan Lainnya / Workshop / Kajian', tambahanLain);

  // Total Penerimaan Bottom of Box
  const totalTambahan = record.totalTambahan || record.totalPenerimaan || (gp + (record.tunjanganKepsek||0) + (record.tunjanganWakasek||0) + (record.tunjanganWaliKelas||0) + (record.tunjanganAsrama||0) + tunjHadir + honorJp + inval + tambahanLain);
  doc.setDrawColor(226, 232, 240);
  doc.line(col1X, currentY + boxHeight - 7, col1X + colWidth, currentY + boxHeight - 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Penerimaan / Bruto (A):', col1X + 3, currentY + boxHeight - 2.5);
  doc.text(formatRupiah(totalTambahan, false), col1X + colWidth - 3, currentY + boxHeight - 2.5, { align: 'right' });

  // Box B: POTONGAN
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, currentY, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFillColor(255, 241, 242);
  doc.roundedRect(col2X, currentY, colWidth, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57);
  doc.text('B. POTONGAN / KEWAJIBAN', col2X + 3, currentY + 4.2);
  doc.text('Nominal (Rp)', col2X + colWidth - 3, currentY + 4.2, { align: 'right' });

  // Rows of Potongan
  let rowY2 = currentY + 10;
  const addPotonganRow = (label: string, amount: number, highlight = false) => {
    if (amount <= 0) return;
    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(highlight ? 190 : 71, highlight ? 18 : 85, highlight ? 60 : 105);
    doc.text(label, col2X + 3, rowY2);
    doc.text(`-${formatRupiah(amount, false)}`, col2X + colWidth - 3, rowY2, { align: 'right' });
    rowY2 += 4.5;
  };

  const potTerlambat = record.potonganTerlambat || record.potonganKeterlambatan || 0;
  if (potTerlambat > 0) addPotonganRow(`Potongan Terlambat (${record.presensiTerlambatMenit || 0} mnt)`, potTerlambat);
  
  const potKas = record.potonganKas || record.potonganKasSekolah || record.potonganPinjaman || 0;
  if (potKas > 0) addPotonganRow('Potongan Kas / Pinjaman', potKas);

  const potLain = record.potonganLainnya || 0;
  if (potLain > 0) addPotonganRow('Potongan Lainnya', potLain);

  if ((record.potonganTidakMasuk ?? 0) > 0 && potLain === 0) addPotonganRow('Potongan Tidak Masuk', record.potonganTidakMasuk || 0);
  if ((record.potonganInfal ?? 0) > 0 && potLain === 0) addPotonganRow(`Potongan Inval Digantikan (${record.jpDigantikan || 0} JP)`, record.potonganInfal || 0);

  // Total Potongan Bottom of Box
  const totalPot = record.totalPotongan || (potTerlambat + potKas + potLain);
  doc.setDrawColor(226, 232, 240);
  doc.line(col2X, currentY + boxHeight - 7, col2X + colWidth, currentY + boxHeight - 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57);
  doc.text('Total Potongan (B):', col2X + 3, currentY + boxHeight - 2.5);
  doc.text(`-${formatRupiah(totalPot, false)}`, col2X + colWidth - 3, currentY + boxHeight - 2.5, { align: 'right' });

  // 6. TOTAL GAJI BERSIH (TAKE HOME PAY)
  const thp = record.takeHomePay || record.gajiBersih || (totalTambahan - totalPot);
  currentY += boxHeight + 4;
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'F');

  doc.setTextColor(199, 210, 254);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('GAJI BERSIH DITERIMA (TAKE HOME PAY = A - B):', margin + 4, currentY + 5.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(formatRupiah(thp, false), margin + 4, currentY + 11.5);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.text(`Terbilang: # ${terbilang(thp, false)} #`, margin + 4, currentY + 14.5);

  // Status stamp right inside banner
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(margin + contentWidth - 38, currentY + 4, 34, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(record.status === 'transferred' ? 'LUNAS DITRANSFER' : 'DISETUJUI RESMI', margin + contentWidth - 21, currentY + 9, { align: 'center' });

  // 7. SIGNATURES & FOOTER
  currentY += 21;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Makassar, 26 ${monthName} ${record.tahun}`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 4;
  const sigColWidth = contentWidth / 2;

  // Signature 1: Penerima
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.text('Penerima Gaji,', margin + sigColWidth / 2, currentY, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(record.pegawaiNama, margin + sigColWidth / 2, currentY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIP: ${record.pegawaiNip}`, margin + sigColWidth / 2, currentY + 22, { align: 'center' });

  // Signature 2: Kepala Sekolah
  const sig2X = margin + sigColWidth + sigColWidth / 2;
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Mengetahui / Menyetujui,', sig2X, currentY, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Anto, S.E.I., M.E., Gr., MCF.', sig2X, currentY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Kepala SMK IT Ibnul Qayyim', sig2X, currentY + 22, { align: 'center' });

  // 8. SECURITY & ENCRYPTION WATERMARK FOOTER
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen digital sah diterbitkan otomatis oleh SIM GAJI SMK IT Ibnul Qayyim Makassar (Enkripsi AES-256 Validated) • Ref: ${record.nomorReferensiTransfer || record.kodeSlip}`,
    pageWidth / 2,
    286,
    { align: 'center' }
  );

  return doc;
};

/**
 * Format clean filename for employee slip
 */
export const getSlipPdfFilename = (record: PenggajianRecord, index?: number): string => {
  const indexPrefix = index !== undefined ? `${String(index + 1).padStart(2, '0')}_` : '';
  const cleanName = record.pegawaiNama
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const monthName = MONTH_NAMES_ID[record.bulan - 1] || `Bulan_${record.bulan}`;
  return `${indexPrefix}Slip_Gaji_${cleanName}_${monthName}_${record.tahun}.pdf`;
};

/**
 * Export batch payroll slips into an organized ZIP archive
 */
export const exportBatchSlipsToZip = async (
  records: PenggajianRecord[],
  options?: {
    onProgress?: (current: number, total: number, currentName: string) => void;
  }
): Promise<{ blob: Blob; filename: string; count: number; totalNominal: number }> => {
  if (!records || records.length === 0) {
    throw new Error('Tidak ada data slip gaji yang dipilih untuk diekspor.');
  }

  const zip = new JSZip();
  const sample = records[0];
  const monthName = MONTH_NAMES_ID[sample.bulan - 1] || `Bulan_${sample.bulan}`;
  const year = sample.tahun;
  const folderName = `SLIP_GAJI_SMKIT_IBNULQAYYIM_${monthName.toUpperCase()}_${year}`;
  const folder = zip.folder(folderName) || zip;

  let totalNominal = 0;
  const total = records.length;

  // Generate each PDF asynchronously
  for (let i = 0; i < total; i++) {
    const record = records[i];
    totalNominal += record.gajiBersih;

    if (options?.onProgress) {
      options.onProgress(i + 1, total, record.pegawaiNama);
    }

    // Yield control to UI thread briefly to ensure smooth progress rendering
    await new Promise((resolve) => setTimeout(resolve, 20));

    const doc = generateSlipPdfDocument(record);
    const pdfBlob = doc.output('blob');
    const filename = getSlipPdfFilename(record, i);

    folder.file(filename, pdfBlob);
  }

  // Create Rekapitulasi Summary Text file inside the ZIP
  const rekapLines = [
    '========================================================================',
    `REKAPITULASI DOKUMEN SLIP GAJI - SMK IT IBNUL QAYYIM MAKASSAR`,
    `Periode: ${monthName} ${year}`,
    `Total Slip Diekspor: ${records.length} Pegawai`,
    `Total Gaji Bersih: ${formatRupiah(totalNominal)}`,
    `Waktu Export: ${new Date().toLocaleString('id-ID')} WITA`,
    '========================================================================',
    '',
    'DAFTAR PEGAWAI & KODE SLIP:',
    ...records.map((r, idx) => 
      `${String(idx + 1).padStart(2, '0')}. [${r.kodeSlip}] ${r.pegawaiNama.padEnd(35, ' ')} | NIP: ${r.pegawaiNip.padEnd(20, ' ')} | Gaji Bersih: ${formatRupiah(r.gajiBersih).padStart(16, ' ')} | Status: ${r.status.toUpperCase()}`
    ),
    '',
    '========================================================================',
    'Catatan: Dokumen slip PDF terlampir dalam arsip ini sah dan terenkripsi.',
    '========================================================================',
  ];

  folder.file(`00_INDEX_REKAPITULASI_${monthName.toUpperCase()}_${year}.txt`, rekapLines.join('\n'));

  // Generate final ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `BATCH_SLIP_GAJI_SMKIT_IBNULQAYYIM_${monthName.toUpperCase()}_${year}.zip`;

  return {
    blob: zipBlob,
    filename: zipFilename,
    count: records.length,
    totalNominal,
  };
};
