import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  X, 
  Sparkles, 
  Check, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Search, 
  Save, 
  AlertCircle, 
  ArrowRight, 
  Percent, 
  DollarSign, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react';
import { Pegawai } from '../types';
import { formatRupiah } from '../utils/security';
import { bulkUpdateGajiPokokSupabase, upsertPegawaiSupabase } from '../lib/supabase';

interface BulkSalaryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawaiList: Pegawai[];
  onSaveSuccess: (updatedStaff: Pegawai[]) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export type CategoryFilter = 'all' | 'guru' | 'tendik';
export type AdjustmentMode = 'fixed' | 'increase_nominal' | 'increase_percent';

export const BulkSalaryAdjustmentModal: React.FC<BulkSalaryAdjustmentModalProps> = ({
  isOpen,
  onClose,
  pegawaiList,
  onSaveSuccess,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'bulk' | 'personal'>('bulk');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('increase_nominal');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(100000);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom personal adjustments state (pegawaiId -> newNominal)
  const [personalEdits, setPersonalEdits] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingSingleId, setSavingSingleId] = useState<string | null>(null);

  // Filter pegawai by category
  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter(p => {
      const isGuru = p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT' || p.jabatanUtama?.toLowerCase().includes('guru');
      const isTendik = p.statusPegawai === 'PTY' || p.statusPegawai === 'PTT' || !isGuru;

      if (categoryFilter === 'guru') return isGuru;
      if (categoryFilter === 'tendik') return isTendik;
      return true;
    });
  }, [pegawaiList, categoryFilter]);

  // Filter for Personal editor table with search
  const personalTableList = useMemo(() => {
    return filteredPegawai.filter(p => {
      const term = searchTerm.toLowerCase();
      return (
        p.nama.toLowerCase().includes(term) ||
        (p.nip && p.nip.toLowerCase().includes(term)) ||
        (p.niy && p.niy.toLowerCase().includes(term)) ||
        (p.jabatanUtama && p.jabatanUtama.toLowerCase().includes(term))
      );
    });
  }, [filteredPegawai, searchTerm]);

  // Calculate projected new salary for bulk formula
  const computeBulkSalary = (currentVal: number): number => {
    if (adjustmentMode === 'fixed') {
      return Math.max(0, adjustmentValue);
    }
    if (adjustmentMode === 'increase_nominal') {
      return Math.max(0, currentVal + adjustmentValue);
    }
    if (adjustmentMode === 'increase_percent') {
      const delta = Math.round((currentVal * adjustmentValue) / 100);
      return Math.max(0, currentVal + delta);
    }
    return currentVal;
  };

  // Summary statistics for Bulk Tab
  const bulkStats = useMemo(() => {
    let currentTotal = 0;
    let projectedTotal = 0;

    filteredPegawai.forEach(p => {
      const cur = p.gajiPokokDefault || 0;
      const proj = computeBulkSalary(cur);
      currentTotal += cur;
      projectedTotal += proj;
    });

    return {
      count: filteredPegawai.length,
      currentTotal,
      projectedTotal,
      diffTotal: projectedTotal - currentTotal,
    };
  }, [filteredPegawai, adjustmentMode, adjustmentValue]);

  // Apply Bulk Adjustment to Supabase
  const handleExecuteBulkAdjustment = async () => {
    if (filteredPegawai.length === 0) {
      onShowToast('Tidak ada pegawai yang dipilih dalam kategori ini.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = filteredPegawai.map(p => {
        const newSalary = computeBulkSalary(p.gajiPokokDefault || 0);
        return {
          id: p.id,
          gajiPokok: newSalary,
          nama: p.nama,
        };
      });

      // 1. Direct Supabase Bulk Upsert
      const res = await bulkUpdateGajiPokokSupabase(updates);

      if (res.success) {
        // 2. Update local state
        const updatedStaffMap = new Map(updates.map(u => [u.id, u.gajiPokok]));
        const updatedStaffList = pegawaiList.map(p => {
          if (updatedStaffMap.has(p.id)) {
            return {
              ...p,
              gajiPokokDefault: updatedStaffMap.get(p.id)!,
            };
          }
          return p;
        });

        onSaveSuccess(updatedStaffList);
        onShowToast(`Berhasil menyesuaikan gaji pokok untuk ${res.count} pegawai ke Supabase!`, 'success');
        onClose();
      } else {
        onShowToast(`Gagal menyimpan ke Supabase: ${res.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (err: any) {
      console.error('❌ Error executing bulk adjustment:', err);
      onShowToast(`Exception: ${err?.message || 'Gagal terhubung ke database'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save single individual adjustment
  const handleSaveSinglePersonal = async (pegawai: Pegawai) => {
    const newVal = personalEdits[pegawai.id];
    if (newVal === undefined || isNaN(newVal)) {
      onShowToast('Nominal baru belum diubah.', 'info');
      return;
    }

    setSavingSingleId(pegawai.id);
    try {
      const updatedPeg: Pegawai = {
        ...pegawai,
        gajiPokokDefault: Number(newVal),
      };

      const res = await upsertPegawaiSupabase(updatedPeg);
      if (res.success) {
        const updatedList = pegawaiList.map(p => p.id === pegawai.id ? updatedPeg : p);
        onSaveSuccess(updatedList);
        onShowToast(`Gaji pokok ${pegawai.nama} berhasil diubah menjadi ${formatRupiah(newVal)} di Supabase!`, 'success');
      } else {
        onShowToast(`Gagal update Supabase: ${res.error}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Error: ${err?.message || 'Gagal menyimpan'}`, 'error');
    } finally {
      setSavingSingleId(null);
    }
  };

  // Save all personal edits
  const handleSaveAllPersonalEdits = async () => {
    const editKeys = Object.keys(personalEdits);
    if (editKeys.length === 0) {
      onShowToast('Belum ada perubahan gaji pokok personal yang diedit.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = editKeys.map(id => {
        const p = pegawaiList.find(item => item.id === id);
        return {
          id,
          gajiPokok: personalEdits[id],
          nama: p?.nama || '',
        };
      });

      const res = await bulkUpdateGajiPokokSupabase(updates);
      if (res.success) {
        const editMap = new Map(updates.map(u => [u.id, u.gajiPokok]));
        const updatedList = pegawaiList.map(p => {
          if (editMap.has(p.id)) {
            return {
              ...p,
              gajiPokokDefault: editMap.get(p.id)!,
            };
          }
          return p;
        });

        onSaveSuccess(updatedList);
        setPersonalEdits({});
        onShowToast(`Berhasil menyimpan ${res.count} penyesuaian gaji pokok personal ke Supabase!`, 'success');
        onClose();
      } else {
        onShowToast(`Gagal menyimpan ke Supabase: ${res.error}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Error: ${err?.message || 'Gagal menyimpan'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Penyesuaian Gaji Pokok Pegawai
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" />
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kalkulasi dan simpan pembaruan nominal gaji pokok langsung ke database Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category & Mode Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
          
          {/* Main Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'bulk'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Penyesuaian Massal
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Penyesuaian Personal
              {Object.keys(personalEdits).length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full">
                  {Object.keys(personalEdits).length}
                </span>
              )}
            </button>
          </div>

          {/* Target Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Target Kategori:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'all'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3" />
                Semua ({pegawaiList.length})
              </button>
              <button
                onClick={() => setCategoryFilter('guru')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'guru'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3 h-3 text-emerald-400" />
                Guru ({pegawaiList.filter(p => p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT' || p.jabatanUtama?.toLowerCase().includes('guru')).length})
              </button>
              <button
                onClick={() => setCategoryFilter('tendik')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  categoryFilter === 'tendik'
                    ? 'bg-teal-950 text-teal-300 border border-teal-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3 h-3 text-teal-400" />
                Tendik ({pegawaiList.filter(p => p.statusPegawai === 'PTY' || p.statusPegawai === 'PTT' || (!p.jabatanUtama?.toLowerCase().includes('guru') && p.statusPegawai !== 'GTY' && p.statusPegawai !== 'GTT')).length})
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: BULK ADJUSTMENT FORMULA */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              
              {/* Formula Settings Card */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Metode Penyesuaian Massal
                </h4>

                {/* Mode Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setAdjustmentMode('increase_nominal');
                      setAdjustmentValue(100000);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      adjustmentMode === 'increase_nominal'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Kenaikan Nominal
                      </span>
                      {adjustmentMode === 'increase_nominal' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">Tambah (+Rp) ke gaji pokok saat ini</p>
                  </button>

                  <button
                    onClick={() => {
                      setAdjustmentMode('increase_percent');
                      setAdjustmentValue(10);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      adjustmentMode === 'increase_percent'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        Kenaikan Persen
                      </span>
                      {adjustmentMode === 'increase_percent' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">Naikkan persentase (+%) dari gaji saat ini</p>
                  </button>

                  <button
                    onClick={() => {
                      setAdjustmentMode('fixed');
                      setAdjustmentValue(1500000);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      adjustmentMode === 'fixed'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Nominal Tetap
                      </span>
                      {adjustmentMode === 'fixed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">Tetapkan nominal sama rata untuk semua</p>
                  </button>
                </div>

                {/* Value Input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      {adjustmentMode === 'increase_nominal' && 'Besaran Penambahan (+Rp):'}
                      {adjustmentMode === 'increase_percent' && 'Persentase Kenaikan (+%):'}
                      {adjustmentMode === 'fixed' && 'Nominal Gaji Pokok Baru (Rp):'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        {adjustmentMode === 'increase_percent' ? '%' : 'Rp'}
                      </div>
                      <input
                        type="number"
                        value={adjustmentValue || ''}
                        onChange={(e) => setAdjustmentValue(Number(e.target.value) || 0)}
                        placeholder="Masukkan nilai..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white font-semibold text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Pilihan Cepat:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {adjustmentMode === 'increase_nominal' && (
                        <>
                          {[50000, 100000, 150000, 200000, 250000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setAdjustmentValue(amt)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                                adjustmentValue === amt
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              +{amt / 1000} rb
                            </button>
                          ))}
                        </>
                      )}
                      {adjustmentMode === 'increase_percent' && (
                        <>
                          {[5, 7.5, 10, 12.5, 15, 20].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setAdjustmentValue(pct)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                                adjustmentValue === pct
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </>
                      )}
                      {adjustmentMode === 'fixed' && (
                        <>
                          {[1000000, 1200000, 1500000, 1750000, 2000000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setAdjustmentValue(amt)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                                adjustmentValue === amt
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000} rb`}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Impact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Pegawai Terdampak</span>
                  <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
                    {bulkStats.count} <span className="text-xs font-normal text-slate-400">orang</span>
                  </div>
                  <span className="text-[11px] text-emerald-400/80 mt-1 block">
                    Kategori: {categoryFilter === 'all' ? 'Seluruh Staf' : categoryFilter === 'guru' ? 'Guru (GTY/GTT)' : 'Tendik'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Total Anggaran Saat Ini</span>
                  <div className="text-lg font-bold text-slate-300 mt-1 font-mono">
                    {formatRupiah(bulkStats.currentTotal)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Beban gaji pokok eksisting
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-xs text-emerald-400 font-medium flex items-center justify-between">
                    Total Anggaran Baru
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bulkStats.diffTotal >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {bulkStats.diffTotal >= 0 ? `+${formatRupiah(bulkStats.diffTotal)}` : formatRupiah(bulkStats.diffTotal)}
                    </span>
                  </span>
                  <div className="text-lg font-bold text-emerald-300 mt-1 font-mono">
                    {formatRupiah(bulkStats.projectedTotal)}
                  </div>
                  <span className="text-[11px] text-emerald-400/80 mt-1 block">
                    Estimasi setelah penyesuaian
                  </span>
                </div>
              </div>

              {/* Preview Table of Affected Employees */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Preview Perubahan ({filteredPegawai.length} Pegawai)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Data akan langsung di-upsert ke Supabase
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                  {filteredPegawai.map((p) => {
                    const current = p.gajiPokokDefault || 0;
                    const next = computeBulkSalary(current);
                    const diff = next - current;

                    return (
                      <div key={p.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[11px]">
                            {p.nama.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 block">{p.nama}</span>
                            <span className="text-[11px] text-slate-400">{p.jabatanUtama || p.statusPegawai}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-slate-400 line-through text-[11px] block">{formatRupiah(current)}</span>
                            <span className="font-bold text-emerald-400 font-mono">{formatRupiah(next)}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            diff >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {diff >= 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PERSONAL ADJUSTMENT (PER PEGAWAI TABLE) */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama pegawai, NIP, atau jabatan..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {Object.keys(personalEdits).length > 0 && (
                  <button
                    onClick={handleSaveAllPersonalEdits}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Simpan Semua Perubahan ({Object.keys(personalEdits).length})
                  </button>
                )}
              </div>

              {/* Editable Matrix Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold z-10">
                      <tr>
                        <th className="py-3 px-4">Pegawai</th>
                        <th className="py-3 px-4">Jabatan & Kategori</th>
                        <th className="py-3 px-4 text-right">Gaji Saat Ini</th>
                        <th className="py-3 px-4">Gaji Pokok Baru (Rp)</th>
                        <th className="py-3 px-4 text-right">Selisih</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {personalTableList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            Tidak ada pegawai yang cocok dengan kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        personalTableList.map((pegawai) => {
                          const currentVal = pegawai.gajiPokokDefault || 0;
                          const editedVal = personalEdits[pegawai.id] !== undefined ? personalEdits[pegawai.id] : currentVal;
                          const isEdited = personalEdits[pegawai.id] !== undefined && personalEdits[pegawai.id] !== currentVal;
                          const diff = editedVal - currentVal;
                          const isSavingThis = savingSingleId === pegawai.id;

                          const isGuru = pegawai.statusPegawai === 'GTY' || pegawai.statusPegawai === 'GTT' || pegawai.jabatanUtama?.toLowerCase().includes('guru');

                          return (
                            <tr key={pegawai.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{pegawai.nama}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {pegawai.nip || pegawai.niy || 'NIP -'}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="text-slate-200">{pegawai.jabatanUtama}</div>
                                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded mt-0.5 ${
                                  isGuru ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                                }`}>
                                  {isGuru ? 'Guru' : 'Tendik'} • {pegawai.statusPegawai}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right font-mono text-slate-400">
                                {formatRupiah(currentVal)}
                              </td>

                              <td className="py-3 px-4 w-44">
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[11px]">Rp</span>
                                  <input
                                    type="number"
                                    value={editedVal}
                                    onChange={(e) => {
                                      const num = Number(e.target.value) || 0;
                                      setPersonalEdits(prev => ({
                                        ...prev,
                                        [pegawai.id]: num,
                                      }));
                                    }}
                                    className={`w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border rounded-lg text-xs font-semibold outline-none transition-all ${
                                      isEdited
                                        ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                                        : 'border-slate-800 text-white focus:border-slate-600'
                                    }`}
                                  />
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right">
                                {isEdited ? (
                                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                    diff >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    {diff >= 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[11px]">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {isEdited ? (
                                  <button
                                    onClick={() => handleSaveSinglePersonal(pegawai)}
                                    disabled={isSavingThis}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
                                    title="Simpan perubahan pegawai ini ke Supabase"
                                  >
                                    {isSavingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-600 text-xs">Tersimpan</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Perubahan gaji pokok otomatis disinkronkan ke tabel <code className="text-emerald-300 font-mono">pegawai</code> Supabase dan menghitung ulang slip gaji.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>

            {activeTab === 'bulk' && (
              <button
                type="button"
                onClick={handleExecuteBulkAdjustment}
                disabled={isSubmitting || filteredPegawai.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan ke Supabase...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Terapkan & Simpan ke Supabase
                  </>
                )}
              </button>
            )}

            {activeTab === 'personal' && (
              <button
                type="button"
                onClick={handleSaveAllPersonalEdits}
                disabled={isSubmitting || Object.keys(personalEdits).length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan ke Supabase...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Semua Perubahan ({Object.keys(personalEdits).length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
