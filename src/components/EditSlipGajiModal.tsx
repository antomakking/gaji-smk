import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calculator, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Layers, 
  Briefcase, 
  GraduationCap,
  Sparkles,
  Loader2,
  Lock
} from 'lucide-react';
import { PenggajianRecord } from '../types';
import { formatRupiah } from '../utils/security';
import { getSupabase } from '../lib/supabase';

interface EditSlipGajiModalProps {
  record: PenggajianRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedRecord: PenggajianRecord) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EditSlipGajiModal: React.FC<EditSlipGajiModalProps> = ({
  record,
  isOpen,
  onClose,
  onSaveSuccess,
  showToast,
}) => {
  if (!isOpen || !record) return null;

  // 1. Kelompok Tunjangan Jabatan
  const [tunjanganKepsek, setTunjanganKepsek] = useState<number>(record.tunjanganKepsek || 0);
  const [tunjanganWakasek, setTunjanganWakasek] = useState<number>(record.tunjanganWakasek || 0);
  const [tunjanganWaliKelas, setTunjanganWaliKelas] = useState<number>(record.tunjanganWaliKelas || 0);
  const [tunjanganAsrama, setTunjanganAsrama] = useState<number>(record.tunjanganAsrama || 0);

  // 2. Kelompok Penerimaan & Kinerja
  const [gajiPokokNominal, setGajiPokokNominal] = useState<number>(record.gajiPokok || 0);
  const [tunjanganKehadiran, setTunjanganKehadiran] = useState<number>(record.tunjanganKehadiran || 0);
  
  // JP Mengajar: jumlah_jp * nominal_per_jp = total_honor_jp
  const [jumlahJp, setJumlahJp] = useState<number>(record.jumlahJp || record.jamMengajarRealisasi || 0);
  const initialTarifPerJp = record.nominalPerJp || (jumlahJp > 0 && record.honorJamMengajar ? Math.round(record.honorJamMengajar / jumlahJp) : 18000);
  const [nominalPerJp, setNominalPerJp] = useState<number>(initialTarifPerJp || 18000);
  
  const [honorInval, setHonorInval] = useState<number>(record.honorInval || record.honorInfal || 0);

  // 3. Kelompok Tambahan
  const [tambahanLainnya, setTambahanLainnya] = useState<number>(record.tambahanLainnya || record.tunjanganLainnya || record.koreksiPenerimaan || 0);

  // 4. Kelompok Potongan
  const [potonganTerlambat, setPotonganTerlambat] = useState<number>(record.potonganTerlambat || record.potonganKeterlambatan || 0);
  const [potonganKas, setPotonganKas] = useState<number>(record.potonganKas || record.potonganKasSekolah || record.potonganPinjaman || 0);
  const [potonganLainnya, setPotonganLainnya] = useState<number>(record.potonganLainnya || 0);

  const [isSaving, setIsSaving] = useState(false);

  // Initialize/Reset state when target record changes
  useEffect(() => {
    if (record) {
      setTunjanganKepsek(record.tunjanganKepsek || 0);
      setTunjanganWakasek(record.tunjanganWakasek || 0);
      setTunjanganWaliKelas(record.tunjanganWaliKelas || 0);
      setTunjanganAsrama(record.tunjanganAsrama || 0);
      setGajiPokokNominal(record.gajiPokok || 0);
      setTunjanganKehadiran(record.tunjanganKehadiran || 0);
      
      const jp = record.jumlahJp || record.jamMengajarRealisasi || 0;
      setJumlahJp(jp);
      const tarif = record.nominalPerJp || (jp > 0 && record.honorJamMengajar ? Math.round(record.honorJamMengajar / jp) : 18000);
      setNominalPerJp(tarif || 18000);
      
      setHonorInval(record.honorInval || record.honorInfal || 0);
      setTambahanLainnya(record.tambahanLainnya || record.tunjanganLainnya || record.koreksiPenerimaan || 0);
      setPotonganTerlambat(record.potonganTerlambat || record.potonganKeterlambatan || 0);
      setPotonganKas(record.potonganKas || record.potonganKasSekolah || record.potonganPinjaman || 0);
      setPotonganLainnya(record.potonganLainnya || 0);
    }
  }, [record]);

  // Automated Formula Calculations
  // 1. total_honor_jp = jumlah_jp * nominal_per_jp
  const totalHonorJp = Math.round(Number(jumlahJp || 0) * Number(nominalPerJp || 0));

  // 2. total_tambahan = gaji_pokok_nominal + tunjangan_kepsek + tunjangan_wakasek + tunjangan_wali_kelas + tunjangan_asrama + tunjangan_kehadiran + total_honor_jp + honor_inval + tambahan_lainnya
  const totalTambahan = Math.round(
    Number(gajiPokokNominal || 0) +
    Number(tunjanganKepsek || 0) +
    Number(tunjanganWakasek || 0) +
    Number(tunjanganWaliKelas || 0) +
    Number(tunjanganAsrama || 0) +
    Number(tunjanganKehadiran || 0) +
    totalHonorJp +
    Number(honorInval || 0) +
    Number(tambahanLainnya || 0)
  );

  // 3. total_potongan = potongan_terlambat + potongan_kas + potongan_lainnya
  const totalPotongan = Math.round(
    Number(potonganTerlambat || 0) +
    Number(potonganKas || 0) +
    Number(potonganLainnya || 0)
  );

  // 4. take_home_pay = total_tambahan - total_potongan
  const takeHomePay = Math.round(totalTambahan - totalPotongan);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedRecord: PenggajianRecord = {
      ...record,
      // Identitas & Status
      tunjanganKepsek,
      tunjanganWakasek,
      tunjanganWaliKelas,
      tunjanganAsrama,
      tunjanganJabatan: tunjanganKepsek + tunjanganWakasek + tunjanganWaliKelas + tunjanganAsrama,
      
      gajiPokok: gajiPokokNominal,
      gajiPokokNominal,
      tunjanganKehadiran,
      tunjanganKehadiranTransport: tunjanganKehadiran,
      
      jumlahJp,
      nominalPerJp,
      totalHonorJp,
      jamMengajarRealisasi: jumlahJp,
      honorJamMengajar: totalHonorJp,
      
      honorInval,
      honorInfal: honorInval,
      
      tambahanLainnya,
      tunjanganLainnya: tambahanLainnya,
      totalTambahan,
      totalPenerimaan: totalTambahan,
      
      potonganTerlambat,
      potonganKeterlambatan: potonganTerlambat,
      potonganKas,
      potonganKasSekolah: potonganKas,
      potonganLainnya,
      totalPotongan,
      
      takeHomePay,
      gajiBersih: takeHomePay,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Direct Supabase Update
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('slip_gaji')
          .update({
            gaji_pokok: gajiPokokNominal,
            tunjangan_kepsek: tunjanganKepsek,
            tunjangan_wakasek: tunjanganWakasek,
            tunjangan_wali_kelas: tunjanganWaliKelas,
            tunjangan_asrama: tunjanganAsrama,
            tunjangan_kehadiran: tunjanganKehadiran,
            realisasi_jp: jumlahJp,
            jam_mengajar_realisasi: jumlahJp,
            honor_jam_mengajar: totalHonorJp,
            honor_infal: honorInval,
            tunjangan_lainnya: tambahanLainnya,
            gaji_kotor: totalTambahan,
            total_penerimaan: totalTambahan,
            potongan_keterlambatan: potonganTerlambat,
            potongan_kas_sekolah: potonganKas,
            potongan_lainnya: potonganLainnya,
            total_potongan: totalPotongan,
            gaji_bersih: takeHomePay,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);

        if (error) {
          console.warn('⚠️ [Supabase] Gagal menyimpan update rincian slip gaji:', error.message);
        } else {
          console.log(`✅ [Supabase] Slip gaji id=${record.id} berhasil diperbarui di cloud.`);
        }
      }

      onSaveSuccess(updatedRecord);
      if (showToast) {
        showToast(`Rincian slip gaji ${record.pegawaiNama} berhasil disimpan!`, 'success');
      }
      onClose();
    } catch (err: any) {
      console.error('Error updating slip gaji:', err);
      if (showToast) {
        showToast(`Gagal menyimpan: ${err?.message || 'Terjadi kesalahan sistem'}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header - Soft Green Aesthetic */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center font-bold text-white shadow-xs">
              <Calculator className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Form Rincian &amp; Edit Slip Gaji</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  {record.kodeSlip}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {record.pegawaiNama} • <span className="text-emerald-300 font-medium">{record.pegawaiJabatan}</span> ({record.periodeLabel})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* SECTION 1: KELOMPOK TUNJANGAN JABATAN */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                1. Kelompok Tunjangan Jabatan Struktural
              </h4>
              <span className="text-[11px] font-bold text-emerald-800 font-mono">
                Subtotal: {formatRupiah(tunjanganKepsek + tunjanganWakasek + tunjanganWaliKelas + tunjanganAsrama)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kepala Sekolah (<code className="text-[10px] text-slate-500">tunjangan_kepsek</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={tunjanganKepsek}
                    onChange={(e) => setTunjanganKepsek(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Wakasek (<code className="text-[10px] text-slate-500">tunjangan_wakasek</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={tunjanganWakasek}
                    onChange={(e) => setTunjanganWakasek(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Wali Kelas (<code className="text-[10px] text-slate-500">tunjangan_wali_kelas</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={tunjanganWaliKelas}
                    onChange={(e) => setTunjanganWaliKelas(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asrama/Musyrif (<code className="text-[10px] text-slate-500">tunjangan_asrama</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={tunjanganAsrama}
                    onChange={(e) => setTunjanganAsrama(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: KELOMPOK PENERIMAAN & KINERJA */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                2. Kelompok Penerimaan Pokok, Presensi & JP Mengajar
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 font-mono">
                Subtotal: {formatRupiah(gajiPokokNominal + tunjanganKehadiran + totalHonorJp + honorInval)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gaji Pokok (<code className="text-[10px] text-slate-500">gaji_pokok_nominal</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={gajiPokokNominal}
                    onChange={(e) => setGajiPokokNominal(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kehadiran (<code className="text-[10px] text-slate-500">tunjangan_kehadiran</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={tunjanganKehadiran}
                    onChange={(e) => setTunjanganKehadiran(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inval / Guru Pengganti (<code className="text-[10px] text-slate-500">honor_inval</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={honorInval}
                    onChange={(e) => setHonorInval(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tambahan / Workshop (<code className="text-[10px] text-slate-500">tambahan_lainnya</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={tambahanLainnya}
                    onChange={(e) => setTambahanLainnya(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* JP Calculation Sub-card */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah JP (<code className="text-[10px] text-slate-500">jumlah_jp</code>):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={jumlahJp}
                    onChange={(e) => setJumlahJp(Number(e.target.value) || 0)}
                    className="w-full p-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                  <span className="text-slate-500 font-bold shrink-0">JP</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif per JP (<code className="text-[10px] text-slate-500">nominal_per_jp</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={nominalPerJp}
                    onChange={(e) => setNominalPerJp(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  Total Honor JP (<code className="text-[9px]">total_honor_jp = JP × Tarif</code>):
                </span>
                <span className="text-sm font-black text-emerald-900 font-mono">
                  {formatRupiah(totalHonorJp)}
                </span>
                <span className="text-[9px] text-emerald-700 block mt-0.5">
                  ({jumlahJp} JP × {formatRupiah(nominalPerJp)})
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: KELOMPOK POTONGAN */}
          <div className="bg-rose-50/50 p-4 sm:p-5 rounded-xl border border-rose-200/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                3. Kelompok Potongan Kewajiban Pegawai
              </h4>
              <span className="text-[11px] font-bold text-rose-700 font-mono">
                Total Potongan: -{formatRupiah(totalPotongan)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Potongan Terlambat (<code className="text-[10px] text-slate-500">potongan_terlambat</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={potonganTerlambat}
                    onChange={(e) => setPotonganTerlambat(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Potongan Kas / Pinjaman (<code className="text-[10px] text-slate-500">potongan_kas</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={potonganKas}
                    onChange={(e) => setPotonganKas(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Potongan Lainnya (<code className="text-[10px] text-slate-500">potongan_lainnya</code>):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={potonganLainnya}
                    onChange={(e) => setPotonganLainnya(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs font-mono rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-rose-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: REALTIME SUMMARY TAKE HOME PAY CALCULATION */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#07241e] to-teal-950 p-5 rounded-2xl text-white shadow-lg border border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Hasil Rekapitulasi Otomatis Frontend &amp; Supabase
              </span>
              <span className="font-mono text-[11px] text-emerald-200/80">Formula Resmi SMK IT IQM</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-emerald-800/60">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block">Total Tambahan / Bruto:</span>
                <span className="text-base font-black text-white font-mono">{formatRupiah(totalTambahan)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Pokok + Tunjangan + JP + Inval</span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-rose-300 uppercase tracking-wider block">Total Potongan:</span>
                <span className="text-base font-black text-rose-300 font-mono">-{formatRupiah(totalPotongan)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Terlambat + Kas + Lainnya</span>
              </div>

              <div className="bg-emerald-500/15 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-bold">Diterima / Take Home Pay:</span>
                <span className="text-xl font-black text-emerald-300 font-mono">{formatRupiah(takeHomePay)}</span>
                <span className="text-[9px] text-emerald-200/80 block mt-0.5">Total Tambahan - Total Potongan</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan ke Supabase...' : 'Simpan Perubahan Slip Gaji'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
