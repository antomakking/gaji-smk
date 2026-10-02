import React from 'react';
import { 
  X, 
  Calculator, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  CalendarCheck, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp,
  FileCheck,
  ArrowRightLeft
} from 'lucide-react';
import { PenggajianRecord } from '../types';
import { formatRupiah, formatNumber } from '../utils/security';
import { useSalaryPrivacy } from '../context/SalaryPrivacyContext';

interface FormulaInspectorModalProps {
  record: PenggajianRecord | null;
  onClose: () => void;
}

export const FormulaInspectorModal: React.FC<FormulaInspectorModalProps> = ({
  record,
  onClose,
}) => {
  const { isSalaryHidden } = useSalaryPrivacy();
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Inspeksi Rumus & Integrasi Absensi Presisi
              </h2>
              <p className="text-xs text-slate-500">
                {record.pegawaiNama} ({record.pegawaiNip}) • Periode {record.periodeLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 text-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Periode Cut-Off Notice */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Cut-off Presensi &amp; JP: <strong>{record.periodeCutoffLabel || '23 Juli 2026 s/d 22 Agustus 2026'}</strong>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
            <span>Dibayarkan:</span>
            <span>Mulai 25 {record.periodeLabel}</span>
          </span>
        </div>

        {/* Status Induk Notice */}
        {record.statusInduk === 'Non Induk' && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>🏷️ Ketentuan Guru Non-Induk (Honor Murni JP)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Berdasarkan kebijakan yayasan &amp; sekolah, pegawai berstatus <strong>Non Induk</strong> hanya dihitung honor berdasarkan <strong>Realisasi Jam Pelajaran (JP) mengajar</strong> (serta kompensasi infal pengganti jika ada). Komponen gaji pokok, tunjangan kehadiran/transport, serta potongan absensi tidak diberlakukan.
            </p>
          </div>
        )}

        {/* 1. Honor Jam Mengajar (JP) Formula */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Honor Jam Mengajar (Realisasi JP Tatap Muka)</span>
            </span>
            <span className="font-bold text-emerald-800 text-sm">
              {formatRupiah(record.honorJamMengajar)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
            Rumus: Realisasi JP ({record.jamMengajarRealisasi || 0} Jam) × Tarif per JP ({formatRupiah(record.jamMengajarRealisasi > 0 ? Math.round(record.honorJamMengajar / record.jamMengajarRealisasi) : 45000)})
          </div>
        </div>

        {/* 2. Honor Jam Lembur */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Honor Jam Lembur (Overtime Lab &amp; Kegiatan)</span>
            </span>
            <span className="font-bold text-amber-800 text-sm">
              {formatRupiah(record.honorLembur || 0)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
            Rumus: Total Lembur Terverifikasi ({record.jamLembur || 0} Jam) × Tarif Lembur ({formatRupiah(record.jamLembur && record.jamLembur > 0 ? Math.round((record.honorLembur || 0) / record.jamLembur) : 20000)}/jam)
          </div>
        </div>

        {/* 3. Tunjangan Transport & Kehadiran */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <span>Tunjangan Kehadiran &amp; Transport Harian</span>
            </span>
            <span className="font-bold text-emerald-800 text-sm">
              {formatRupiah(record.tunjanganKehadiranTransport)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
            Rumus: (Hadir Fisik {record.presensiHadir} Hari + Dinas Luar {record.presensiDinasLuar || 0} Hari) × Tarif Harian ({formatRupiah(25000)})
          </div>
        </div>

        {/* 4. Infal Guru Pengganti Formula (Rp 7.500 / JP) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
              <span>Sistem Kompensasi &amp; Potongan Infal (Rp 7.500 / JP)</span>
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              {(record.honorInfal || 0) > 0 && (
                <span className="font-bold text-emerald-700">+{formatRupiah(record.honorInfal)}</span>
              )}
              {(record.potonganInfal || 0) > 0 && (
                <span className="font-bold text-rose-700">-{formatRupiah(record.potonganInfal)}</span>
              )}
              {!(record.honorInfal || 0) && !(record.potonganInfal || 0) && (
                <span className="text-slate-400 font-normal">Rp 0</span>
              )}
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
            <div>• Honor Infal (Masuk Menggantikan): {record.jpMenggantikan || 0} JP × Rp 7.500 = {formatRupiah(record.honorInfal || 0)}</div>
            <div>• Potongan Infal (Berhalangan Hadir): {record.jpDigantikan || 0} JP × Rp 7.500 = {formatRupiah(record.potonganInfal || 0)}</div>
            <div className="text-[10px] text-slate-500 italic mt-0.5">Ketentuan: Jam mengajar guru yang digantikan dipotong Rp 7.500/JP dan dialokasikan utuh ke guru pengganti.</div>
          </div>
        </div>

        {/* 5. Cuti & Sakit SKD Policy */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>Status Cuti &amp; Sakit Ber-SKD</span>
            </span>
            <span className="font-bold text-teal-800 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Hak Normatif Terlindungi
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
            Cuti Tahunan: {record.presensiCuti || 0} Hari • Sakit SKD: {record.presensiSakit || 0} Hari (Gaji Pokok &amp; Tunjangan Struktural tetap dibayarkan 100%).
          </div>
        </div>

        {/* 6. Potongan Absensi & Keterlambatan */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Denda Absensi, Izin Non-Resmi &amp; Keterlambatan</span>
            </span>
            <span className="font-bold text-rose-700 text-sm">
              -{formatRupiah(record.potonganAlpha + record.potonganKeterlambatan + (record.potonganIzin || 0))}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
            <div>• Alpha ({record.presensiAlpha} Hari) × Rp 50.000 = {formatRupiah(record.potonganAlpha)}</div>
            <div>• Keterlambatan ({record.presensiTerlambatMenit} Menit) = {formatRupiah(record.potonganKeterlambatan)} (denda Rp 1.500 per menit)</div>
            {(record.potonganIzin || 0) > 0 && (
              <div>• Izin Pribadi / Sakit Non-SKD = {formatRupiah(record.potonganIzin || 0)}</div>
            )}
          </div>
        </div>

        {/* 7. Total Gaji Bersih Step Breakdown */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-xl space-y-3 border border-emerald-900/60 shadow-md">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Kalkulasi Akhir Take Home Pay (THP)
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-emerald-300">
              <span>(+) Total Penerimaan Kotor (Pokok + Jabatan + JP + Lembur + Infal + Transport)</span>
              <span className="font-bold">{formatRupiah(record.totalPenerimaan)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>(-) Total Seluruh Potongan (BPJS + Kas + Denda + Potongan Infal)</span>
              <span className="font-bold">-{formatRupiah(record.totalPotongan)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>(=) Gaji Bersih Siap Transfer</span>
              <span className="text-emerald-400 text-base">{formatRupiah(record.gajiBersih)}</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
