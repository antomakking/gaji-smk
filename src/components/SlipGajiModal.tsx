import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Send, 
  ShieldCheck, 
  School, 
  CheckCircle2, 
  Lock,
  QrCode,
  Sparkles
} from 'lucide-react';
import { PenggajianRecord, Pegawai } from '../types';
import { formatRupiah, terbilang, maskData, getPayrollCutoffDates } from '../utils/security';
import { MONTH_NAMES_ID } from './PeriodSelector';
import { useSalaryPrivacy } from '../context/SalaryPrivacyContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface SlipGajiModalProps {
  record: PenggajianRecord | null;
  pegawaiList?: Pegawai[];
  onClose: () => void;
  onSendEmail: (recordId: string) => void;
}

// Official SVG Emblems for Kop Surat - 1:1 Authentic Logos
const KopLogoLeft = () => (
  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
    <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-xs">
      {/* Outer 8-Pointed Star (Rub El Hizb) */}
      <g transform="translate(70 70)">
        <rect x="-48" y="-42" width="96" height="84" rx="1.5" fill="#085c29" stroke="#eab308" strokeWidth="2.5" />
        <rect x="-48" y="-42" width="96" height="84" rx="1.5" fill="#085c29" stroke="#eab308" strokeWidth="2.5" transform="rotate(45)" />
        <rect x="-43" y="-37" width="86" height="74" fill="none" stroke="#fef08a" strokeWidth="1" />
        <rect x="-43" y="-37" width="86" height="74" fill="none" stroke="#fef08a" strokeWidth="1" transform="rotate(45)" />
      </g>

      {/* Top Banner Text: IBNUL QAYYIM ISLAMIC SCHOOL */}
      <text x="70" y="44" textAnchor="middle" fill="#fef08a" fontSize="6.2" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.2">
        IBNUL QAYYIM
      </text>
      <text x="70" y="51" textAnchor="middle" fill="#fef08a" fontSize="5.5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.2">
        ISLAMIC SCHOOL
      </text>

      {/* Open Book Graphic in Center */}
      <g transform="translate(70 68) scale(1.1)">
        {/* Book Base & Spine */}
        <path d="M-16,-2 Q-8,-6 0,-1 Q8,-6 16,-2 L16,11 Q8,7 0,12 Q-8,7 -16,11 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
        {/* Pages Left */}
        <path d="M-15,-0.5 Q-7.5,-4.5 0,1 L0,12 Q-7.5,7 -15,11 Z" fill="#fef08a" />
        {/* Pages Right */}
        <path d="M15,-0.5 Q7.5,-4.5 0,1 L0,12 Q7.5,7 15,11 Z" fill="#fde047" />
        {/* Page Inner Lines */}
        <line x1="-12" y1="2" x2="-2" y2="2" stroke="#085c29" strokeWidth="0.6" opacity="0.6" />
        <line x1="-12" y1="5" x2="-2" y2="5" stroke="#085c29" strokeWidth="0.6" opacity="0.6" />
        <line x1="2" y1="2" x2="12" y2="2" stroke="#085c29" strokeWidth="0.6" opacity="0.6" />
        <line x1="2" y1="5" x2="12" y2="5" stroke="#085c29" strokeWidth="0.6" opacity="0.6" />
        <line x1="0" y1="1" x2="0" y2="12" stroke="#085c29" strokeWidth="1.2" />
      </g>

      {/* Arabic Calligraphy Banner Bottom: مدرسة ابن القيم */}
      <rect x="28" y="86" width="84" height="13" rx="2" fill="#085c29" stroke="#eab308" strokeWidth="0.8" />
      <text x="70" y="95" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="bold" fontFamily="Traditional Arabic, Scheherazade, Noto Naskh Arabic, serif">
        مدرسة ابن القيم
      </text>
    </svg>
  </div>
);

const KopLogoRight = () => (
  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
    <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-xs">
      {/* Outer 8-Pointed Star (Rub El Hizb) */}
      <g transform="translate(70 70)">
        <rect x="-48" y="-42" width="96" height="84" rx="1.5" fill="#3b4856" stroke="#ffffff" strokeWidth="2.5" />
        <rect x="-48" y="-42" width="96" height="84" rx="1.5" fill="#3b4856" stroke="#ffffff" strokeWidth="2.5" transform="rotate(45)" />
        <rect x="-43" y="-37" width="86" height="74" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="-43" y="-37" width="86" height="74" fill="none" stroke="#e2e8f0" strokeWidth="1" transform="rotate(45)" />
      </g>

      {/* Top Banner Text: SMK ISLAM TERPADU IBNUL QAYYIM */}
      <text x="70" y="43" textAnchor="middle" fill="#ffffff" fontSize="5.2" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.2">
        SMK ISLAM TERPADU
      </text>
      <text x="70" y="50" textAnchor="middle" fill="#ffffff" fontSize="5.8" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.2">
        IBNUL QAYYIM
      </text>

      {/* Open Book Graphic in Center */}
      <g transform="translate(70 68) scale(1.1)">
        {/* Book Base & Spine */}
        <path d="M-16,-2 Q-8,-6 0,-1 Q8,-6 16,-2 L16,11 Q8,7 0,12 Q-8,7 -16,11 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
        {/* Pages Left */}
        <path d="M-15,-0.5 Q-7.5,-4.5 0,1 L0,12 Q-7.5,7 -15,11 Z" fill="#f8fafc" />
        {/* Pages Right */}
        <path d="M15,-0.5 Q7.5,-4.5 0,1 L0,12 Q7.5,7 15,11 Z" fill="#f1f5f9" />
        {/* Page Inner Lines */}
        <line x1="-12" y1="2" x2="-2" y2="2" stroke="#3b4856" strokeWidth="0.6" opacity="0.6" />
        <line x1="-12" y1="5" x2="-2" y2="5" stroke="#3b4856" strokeWidth="0.6" opacity="0.6" />
        <line x1="2" y1="2" x2="12" y2="2" stroke="#3b4856" strokeWidth="0.6" opacity="0.6" />
        <line x1="2" y1="5" x2="12" y2="5" stroke="#3b4856" strokeWidth="0.6" opacity="0.6" />
        <line x1="0" y1="1" x2="0" y2="12" stroke="#3b4856" strokeWidth="1.2" />
      </g>

      {/* Arabic Calligraphy Banner Bottom: مدرسة ابن القيم */}
      <rect x="28" y="86" width="84" height="13" rx="2" fill="#3b4856" stroke="#ffffff" strokeWidth="0.8" />
      <text x="70" y="95" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="Traditional Arabic, Scheherazade, Noto Naskh Arabic, serif">
        مدرسة ابن القيم
      </text>
    </svg>
  </div>
);

export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({
  record,
  pegawaiList = [],
  onClose,
  onSendEmail,
}) => {
  const { isSalaryHidden } = useSalaryPrivacy();
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  if (!record) return null;

  const matchedPegawai = pegawaiList?.find(p => 
    p.id === record.pegawaiId || 
    (p.nip && record.pegawaiNip && (p.nip === record.pegawaiNip || p.niy === record.pegawaiNip)) ||
    (p.nama && record.pegawaiNama && p.nama.toLowerCase().trim() === record.pegawaiNama.toLowerCase().trim())
  );

  let formattedJabatan = matchedPegawai?.jabatanUtama || '';
  if (matchedPegawai?.jabatanTambahan && matchedPegawai.jabatanTambahan.length > 0) {
    const extra = matchedPegawai.jabatanTambahan.filter(j => j && j !== 'Guru Pengampu Non Induk' && j !== 'Pembina Olahraga Non Induk');
    if (extra.length > 0) {
      formattedJabatan += ' / ' + extra.join(' / ');
    }
  }

  const displayNama = matchedPegawai?.nama || record.pegawaiNama;
  const displayJabatan = formattedJabatan || matchedPegawai?.jabatanUtama || record.pegawaiJabatan;
  const displayStatus = matchedPegawai?.statusPegawai || record.pegawaiStatus;
  const displayNip = matchedPegawai?.niy || matchedPegawai?.nip || record.pegawaiNip;

  const cutoffInfo = getPayrollCutoffDates(record.bulan, record.tahun);

  const handleDownloadPdf = async () => {
    if (!slipRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(slipRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`SLIP_GAJI_${record.pegawaiNama.replace(/\s+/g, '_')}_${record.periodeLabel.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmailClick = () => {
    onSendEmail(record.id);
    setEmailSentStatus(true);
    setTimeout(() => setEmailSentStatus(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh] border border-slate-700">
        {/* Action Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-white shadow-sm">
              IQ
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Dokumen Resmi Slip Gaji</h2>
              <p className="text-[11px] text-slate-400">{record.kodeSlip} • {record.periodeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Memproses...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleSendEmailClick}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{emailSentStatus ? 'Email Terkirim!' : 'Kirim Email'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/60 flex justify-center">
          {/* Printable Official Slip Paper (A4 Style) */}
          <div
            ref={slipRef}
            id="official-slip-document"
            className="bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-lg w-full max-w-2xl border border-slate-300 font-sans text-xs relative"
          >
            {/* Watermark for Security */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-8xl font-black text-slate-900 rotate-[-30deg]">
                SMK IT IQM
              </span>
            </div>

            {/* 1. Official School Letterhead (Kop Surat) */}
            <div className="border-b-4 border-black pb-1 mb-5 text-center relative font-serif">
              <div className="flex items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-black">
                <KopLogoLeft />

                <div className="flex-1 text-center font-serif text-black leading-snug select-none">
                  <div className="text-xs sm:text-sm font-bold uppercase tracking-normal">
                    YAYASAN PENDIDIKAN ISLAM IBNUL QAYYIM SUDIANG MAKASSAR
                  </div>
                  <h1 className="text-base sm:text-xl font-extrabold text-black tracking-tight uppercase mt-0.5 font-sans">
                    SMK IT IBNUL QAYYIM MAKASSAR
                  </h1>
                  <div className="text-xs sm:text-sm font-bold text-black mt-0.5">
                    Terakreditasi A
                  </div>
                  <div className="text-[11px] sm:text-xs text-black font-normal mt-1 leading-tight">
                    Jl. Goa Ria Taman Bunga 2, Laikang, Kec. Biringkanaya,
                  </div>
                  <div className="text-[11px] sm:text-xs text-black font-normal leading-tight">
                    Kota Makassar, Sulawesi Selatan 90242. Telpon: 0811 4411 432.
                  </div>
                  <div className="text-[11px] sm:text-xs text-black font-normal leading-tight">
                    Email : smkit@iqis.sch.id, Website: https://smkit.iqis.sch.id
                  </div>
                </div>

                <KopLogoRight />
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-4">
              <span className="inline-block border-b border-slate-800 font-extrabold text-sm uppercase tracking-wider text-slate-900 pb-0.5">
                SLIP GAJI & HONORARIUM PEGAWAI
              </span>
              <div className="text-[11px] text-slate-600 font-mono mt-1">
                Nomor: <strong className="text-slate-900">{record.kodeSlip}</strong> | Periode: <strong className="text-slate-900">{record.periodeLabel}</strong>
              </div>
              <div className="mt-1 flex items-center justify-center gap-3 text-[10px] text-slate-500">
                <span>Cut-Off Data: <strong className="text-emerald-950 font-semibold">{record.periodeCutoffLabel || cutoffInfo.cutoffLabelLong}</strong></span>
                <span>•</span>
                <span>Jadwal Bayar: <strong className="text-emerald-800 font-semibold">Mulai {cutoffInfo.paymentLabel}</strong></span>
              </div>
            </div>

            {/* 2. Employee Info Header */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-xs">
              <div>
                <span className="text-slate-500">Nama Pegawai:</span>{' '}
                <strong className="text-slate-900 font-bold">{displayNama}</strong>
              </div>
              <div>
                <span className="text-slate-500">Status Pegawai:</span>{' '}
                <strong className="text-slate-900">
                  {displayStatus} ({matchedPegawai?.statusInduk || record.statusInduk || 'Induk'})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">NIP / NUPTK:</span>{' '}
                <strong className="font-mono text-slate-900">{displayNip}</strong>
              </div>
              <div>
                <span className="text-slate-500">Jabatan Utama:</span>{' '}
                <strong className="text-slate-900">{displayJabatan}</strong>
              </div>
            </div>

            {/* 3. Attendance Snapshot Sub-card */}
            <div className="mb-4 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-950">
              <span className="font-semibold">Rekap Absensi Terintegrasi:</span>
              <div className="space-x-2 font-mono">
                <span>Hadir: <strong>{record.presensiHadir}</strong> hr</span>
                <span>•</span>
                <span>Realisasi JP: <strong>{record.jamMengajarRealisasi}</strong> jam</span>
                <span>•</span>
                <span>Izin/Sakit: <strong>{record.presensiIzin + record.presensiSakit}</strong></span>
                {(record.presensiCuti || 0) > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-sky-800">Cuti: <strong>{record.presensiCuti}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Alpha: <strong className={record.presensiAlpha > 0 ? 'text-rose-700' : ''}>{record.presensiAlpha}</strong></span>
              </div>
            </div>

            {/* 4. Financial Breakdown Columns (Penerimaan vs Potongan) */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Kolom Penerimaan */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/30">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2 flex justify-between">
                  <span>A. PENERIMAAN</span>
                  <span className="text-[10px] text-slate-400 font-normal">Rupiah</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gaji Pokok:</span>
                    <span className="font-semibold text-slate-900">{formatRupiah(record.gajiPokok)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tunj. Jabatan / Struktural:</span>
                    <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganJabatan)}</span>
                  </div>
                  {(record.tunjanganIjazah ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunj. Ijazah ({record.tunjanganIjazahJenjang || 'S1'}):</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganIjazah || 0)}</span>
                    </div>
                  )}
                  {(record.tunjanganKompetensi ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunj. Linieritas Kompetensi:</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganKompetensi || 0)}</span>
                    </div>
                  )}
                  {(record.tunjanganPengalaman ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunj. Pengalaman Kerja ({record.tahunPengalaman} thn):</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganPengalaman || 0)}</span>
                    </div>
                  )}
                  {(record.tunjanganMasaKerja ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunj. Masa Kerja / TMK ({record.tahunMasaKerja} thn):</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganMasaKerja || 0)}</span>
                    </div>
                  )}
                  {(record.tunjanganKinerja ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunj. Kinerja / Prestasi:</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganKinerja || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tunj. Transport & Kehadiran:</span>
                    <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganKehadiranTransport || record.tunjanganKehadiran)}</span>
                  </div>
                  {record.honorJamMengajar > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Honor Mengajar ({record.jamMengajarRealisasi} JP):</span>
                      <span className="font-semibold text-emerald-800">{formatRupiah(record.honorJamMengajar)}</span>
                    </div>
                  )}
                  {(record.insentifKajianMuslimah ?? 0) > 0 && (
                    <div className="flex justify-between bg-emerald-50/70 p-1 rounded border border-emerald-100 text-emerald-900 font-semibold">
                      <span>Insentif Kajian Muslimah:</span>
                      <span>+{formatRupiah(record.insentifKajianMuslimah || 0)}</span>
                    </div>
                  )}
                  {record.honorLembur > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Honor Lembur ({record.jamLembur} Jam):</span>
                      <span className="font-semibold text-amber-700">{formatRupiah(record.honorLembur)}</span>
                    </div>
                  )}
                  {record.honorInfal > 0 && (
                    <div className="flex justify-between bg-emerald-50/70 p-1 rounded border border-emerald-100 text-emerald-900 font-semibold">
                      <span>Honor Infal ({record.jpMenggantikan || Math.round(record.honorInfal / 7500)} JP):</span>
                      <span>+{formatRupiah(record.honorInfal)}</span>
                    </div>
                  )}
                  {(record.koreksiPenerimaan ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Koreksi Tambahan:</span>
                      <span className="font-semibold text-emerald-700">+{formatRupiah(record.koreksiPenerimaan || 0)}</span>
                    </div>
                  )}
                  {record.tunjanganVokasiIT > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunj. Keahlian Vokasi IT:</span>
                      <span className="font-semibold text-emerald-700">{formatRupiah(record.tunjanganVokasiIT)}</span>
                    </div>
                  )}
                  {record.tunjanganLainnya > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tunjangan Lainnya:</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.tunjanganLainnya)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-200 mt-2.5 pt-2 flex justify-between font-bold text-slate-900 text-xs">
                  <span>Total Penerimaan (A):</span>
                  <span>{formatRupiah(record.totalPenerimaan)}</span>
                </div>
              </div>

              {/* Kolom Potongan */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/30">
                <div className="font-bold text-rose-800 border-b border-slate-200 pb-1.5 mb-2 flex justify-between">
                  <span>B. POTONGAN</span>
                  <span className="text-[10px] text-slate-400 font-normal">Rupiah</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Potongan Absensi (Alpha):</span>
                    <span className="font-semibold text-rose-700">{formatRupiah(record.potonganAlpha)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Potongan Keterlambatan:</span>
                    <span className="font-semibold text-rose-700">{formatRupiah(record.potonganKeterlambatan)}</span>
                  </div>
                  {record.potonganInfal > 0 && (
                    <div className="flex justify-between bg-rose-50/70 p-1 rounded border border-rose-100 text-rose-900 font-semibold">
                      <span>Potongan Infal ({record.jpDigantikan || Math.round(record.potonganInfal / 7500)} JP @ Rp 7.500):</span>
                      <span>-{formatRupiah(record.potonganInfal)}</span>
                    </div>
                  )}
                  {(record.potonganPinjaman ?? 0) > 0 && (
                    <div className="flex justify-between bg-rose-50/70 p-1 rounded border border-rose-100 text-rose-900 font-semibold">
                      <span>Potongan Pinjaman / Kasbon:</span>
                      <span>-{formatRupiah(record.potonganPinjaman || 0)}</span>
                    </div>
                  )}
                  {(record.koreksiPotongan ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Koreksi Pengurang:</span>
                      <span className="font-semibold text-rose-700">-{formatRupiah(record.koreksiPotongan || 0)}</span>
                    </div>
                  )}
                  {record.potonganBpjsKesehatan > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">BPJS Kesehatan (1%):</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.potonganBpjsKesehatan)}</span>
                    </div>
                  )}
                  {record.potonganBpjsKetenagakerjaan > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">BPJS Ketenagakerjaan (2%):</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.potonganBpjsKetenagakerjaan)}</span>
                    </div>
                  )}
                  {record.potonganKasSekolah > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Iuran Kas Yayasan:</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.potonganKasSekolah)}</span>
                    </div>
                  )}
                  {record.potonganKoperasi > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Koperasi / Pinjaman:</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(record.potonganKoperasi)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-200 mt-2.5 pt-2 flex justify-between font-bold text-rose-800 text-xs">
                  <span>Total Potongan (B):</span>
                  <span>{formatRupiah(record.totalPotongan)}</span>
                </div>
              </div>
            </div>

            {/* 5. Total Net Salary (Take Home Pay) & Terbilang */}
            <div className="bg-slate-900 text-white rounded-xl p-4 mb-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
                    GAJI BERSIH DITERIMA (TAKE HOME PAY = A - B)
                  </div>
                  <div className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                    {formatRupiah(record.gajiBersih)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-700 text-emerald-100 border border-emerald-600">
                    {record.status === 'transferred' ? 'LUNAS DITRANSFER' : 'DISETUJUI'}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] italic text-slate-300">
                Terbilang: <strong># {terbilang(record.gajiBersih)} #</strong>
              </div>
            </div>

            {/* 6. Signatures & Digital Authentication */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-right text-[10px] text-slate-500 mb-3">
                Makassar, 26 {MONTH_NAMES_ID[record.bulan - 1] || 'Agustus'} {record.tahun}
              </div>

              <div className="grid grid-cols-2 gap-8 text-center text-[10px]">
                {/* Penerima */}
                <div>
                  <div className="text-slate-500 mb-12">Penerima Gaji,</div>
                  <div className="font-bold text-slate-900 border-b border-slate-400 pb-0.5 inline-block min-w-[140px]">
                    {displayNama}
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">NIP: {displayNip}</div>
                </div>

                {/* Kepala Sekolah */}
                <div>
                  <div className="text-slate-500 mb-12">Mengetahui / Menyetujui,</div>
                  <div className="font-bold text-slate-900 border-b border-slate-400 pb-0.5 inline-block min-w-[140px]">
                    Anto, S.E.I., M.E., Gr., MCF.
                  </div>
                  <div className="text-slate-500 mt-0.5">Kepala SMK IT Ibnul Qayyim</div>
                </div>
              </div>

              {/* Bottom Security Cryptographic Checksum */}
              <div className="mt-6 pt-2 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Security Signature: {record.securityChecksum}</span>
                </div>
                <span>Dokumen Digital Sah Diterbitkan Sistem SIM GAJI IQM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
