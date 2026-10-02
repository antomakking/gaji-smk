import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Users, 
  CalendarCheck, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  HelpCircle, 
  Copy, 
  Check, 
  Printer, 
  Building2,
  PieChart,
  Calculator,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { Pegawai, PenggajianRecord, SlotJadwalPelajaran, LogInfal, LogPresensiHarian, PengajuanCutiIzin } from '../types';
import { formatRupiah, formatNumber, getPayrollCutoffDates } from '../utils/security';
import { MONTH_NAMES_ID } from './PeriodSelector';

interface PayrollProjectionSectionProps {
  currentRecords: PenggajianRecord[];
  pegawaiList: Pegawai[];
  scheduleList?: SlotJadwalPelajaran[];
  infalList?: LogInfal[];
  dailyLogs?: LogPresensiHarian[];
  leaveRequests?: PengajuanCutiIzin[];
  selectedBulan: number;
  selectedTahun: number;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type ProjectionScenario = 'baseline' | 'intensive' | 'efficient';

export const PayrollProjectionSection: React.FC<PayrollProjectionSectionProps> = ({
  currentRecords,
  pegawaiList,
  scheduleList = [],
  infalList = [],
  dailyLogs = [],
  leaveRequests = [],
  selectedBulan,
  selectedTahun,
  showToast,
}) => {
  const [scenario, setScenario] = useState<ProjectionScenario>('baseline');
  const [customVariableMultiplier, setCustomVariableMultiplier] = useState<number>(1.0);
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState<'all' | 'guru' | 'tendik'>('all');
  const [copied, setCopied] = useState(false);

  // Determine next month & year
  const nextMonthInfo = useMemo(() => {
    let nextBulan = selectedBulan + 1;
    let nextTahun = selectedTahun;
    if (nextBulan > 12) {
      nextBulan = 1;
      nextTahun += 1;
    }
    const monthName = MONTH_NAMES_ID[nextBulan - 1] || `Bulan ${nextBulan}`;
    const currentMonthName = MONTH_NAMES_ID[selectedBulan - 1] || `Bulan ${selectedBulan}`;
    const cutoff = getPayrollCutoffDates(nextBulan, nextTahun);

    return {
      bulan: nextBulan,
      tahun: nextTahun,
      monthName,
      currentMonthName,
      label: `${monthName} ${nextTahun}`,
      currentLabel: `${currentMonthName} ${selectedTahun}`,
      cutoff,
    };
  }, [selectedBulan, selectedTahun]);

  // Current Month Baseline Totals
  const currentTotals = useMemo(() => {
    const totalTHP = currentRecords.reduce((sum, r) => sum + (r.gajiBersih || 0), 0);
    const totalGajiPokok = currentRecords.reduce((sum, r) => sum + (r.gajiPokok || 0), 0);
    const totalTunjangan = currentRecords.reduce((sum, r) => {
      return sum + (
        (r.tunjanganJabatan || 0) +
        (r.tunjanganIjazah || 0) +
        (r.tunjanganMasaKerja || 0) +
        (r.tunjanganKinerja || 0) +
        (r.tunjanganKompetensi || 0) +
        (r.tunjanganVokasiIT || 0) +
        (r.tunjanganWaliKelas || 0) +
        (r.tunjanganKehadiranTransport || 0)
      );
    }, 0);
    const totalHonorJP = currentRecords.reduce((sum, r) => sum + (r.honorJamMengajar || 0), 0);
    const totalVariabel = currentRecords.reduce((sum, r) => sum + (r.honorLembur || 0) + (r.honorInfal || 0) + (r.insentifKajianMuslimah || 0), 0);
    const totalPotongan = currentRecords.reduce((sum, r) => sum + (r.totalPotongan || 0), 0);
    const totalGross = currentRecords.reduce((sum, r) => sum + (r.totalPenerimaan || 0), 0);

    return {
      totalTHP: totalTHP || 38500000,
      totalGajiPokok: totalGajiPokok || 26000000,
      totalTunjangan: totalTunjangan || 4800000,
      totalHonorJP: totalHonorJP || 6400000,
      totalVariabel: totalVariabel || 1800000,
      totalPotongan: totalPotongan || 500000,
      totalGross: totalGross || 39000000,
      staffCount: currentRecords.length || pegawaiList.length || 23,
    };
  }, [currentRecords, pegawaiList]);

  // Next Month Projection Calculations based on employee structure and trends
  const projection = useMemo(() => {
    const activeStaff = pegawaiList.filter(p => p.statusAktif !== false);
    const totalStaffCount = activeStaff.length || 23;

    // 1. Calculate Fixed Salary Components (Gaji Pokok & Tunjangan Struktural)
    let fixedGajiPokok = 0;
    let fixedTunjangan = 0;

    activeStaff.forEach(p => {
      // Calculate from employee master or baseline
      const pokok = p.gajiPokok || (p.statusPegawai === 'GTY' ? 1800000 : p.statusPegawai === 'GTT' ? 1200000 : 1500000);
      fixedGajiPokok += pokok;

      // Allowances
      const tunjJabatan = p.tunjanganJabatan || 0;
      const tunjIjazah = p.tunjanganIjazah || 150000;
      const tunjMasaKerja = p.tunjanganMasaKerja || 100000;
      const tunjVokasi = p.tunjanganVokasiIT || (p.jabatanUtama?.includes('RPL') || p.jabatanUtama?.includes('TKJ') ? 250000 : 0);
      fixedTunjangan += (tunjJabatan + tunjIjazah + tunjMasaKerja + tunjVokasi);
    });

    if (fixedGajiPokok === 0) fixedGajiPokok = currentTotals.totalGajiPokok;
    if (fixedTunjangan === 0) fixedTunjangan = currentTotals.totalTunjangan;

    // 2. Scheduled Teaching Hours (JP) Multiplier
    // Count active teaching slots per week × 4.2 weeks per month
    const totalWeeklyJP = scheduleList.length || 184;
    const estimatedMonthlyJP = Math.round(totalWeeklyJP * 4.2);
    const avgTarifPerJP = 25000;
    const baseEstimatedHonorJP = Math.round(estimatedMonthlyJP * avgTarifPerJP);

    // 3. Scenario Adjustments
    let scenarioMultiplier = 1.0;
    let variableMultiplier = 1.0;
    let scenarioLabel = 'Standar Baseline (Operasional Normal)';
    let scenarioDesc = 'Perhitungan 100% jam efektif sesuai jadwal induk dan tingkat kehadiran reguler.';

    if (scenario === 'intensive') {
      scenarioMultiplier = 1.05; // +5% overall variable/infal/lembur
      variableMultiplier = 1.25; // +25% variable
      scenarioLabel = 'Intensif (+5% Beban Kegiatan/Ujian)';
      scenarioDesc = 'Mengantisipasi kegiatan semester, workshop sertifikasi kejuruan, lembur lab IT, dan infal.';
    } else if (scenario === 'efficient') {
      scenarioMultiplier = 0.97; // -3% optimization
      variableMultiplier = 0.85; // -15% variable
      scenarioLabel = 'Optimalisasi Efisiensi Kas (-3%)';
      scenarioDesc = 'Proyeksi dengan optimalisasi jam paralel guru dan pembatasan jam lembur.';
    }

    const appliedMultiplier = scenarioMultiplier * customVariableMultiplier;

    // Estimated components
    const projectedGajiPokok = Math.round(fixedGajiPokok);
    const projectedTunjangan = Math.round(fixedTunjangan * (scenario === 'intensive' ? 1.02 : 1.0));
    const projectedHonorJP = Math.round((baseEstimatedHonorJP || currentTotals.totalHonorJP) * appliedMultiplier);
    const projectedVariabel = Math.round((currentTotals.totalVariabel * variableMultiplier) * customVariableMultiplier);
    const projectedGross = projectedGajiPokok + projectedTunjangan + projectedHonorJP + projectedVariabel;
    const projectedPotongan = Math.round(currentTotals.totalPotongan * 1.02);
    const projectedTHP = projectedGross - projectedPotongan;

    // Variance vs Current
    const diffTHP = projectedTHP - currentTotals.totalTHP;
    const percentDiff = currentTotals.totalTHP > 0 ? (diffTHP / currentTotals.totalTHP) * 100 : 0;

    // Department Breakdown
    const guruStaff = activeStaff.filter(p => p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT' || p.jabatanUtama?.toLowerCase().includes('guru'));
    const tendikStaff = activeStaff.filter(p => !guruStaff.includes(p));

    const guruShare = Math.round(projectedTHP * 0.72);
    const tendikShare = Math.round(projectedTHP * 0.28);
    const avgPerEmployee = Math.round(projectedTHP / (totalStaffCount || 1));

    return {
      projectedTHP,
      projectedGross,
      projectedGajiPokok,
      projectedTunjangan,
      projectedHonorJP,
      projectedVariabel,
      projectedPotongan,
      diffTHP,
      percentDiff,
      totalStaffCount,
      guruCount: guruStaff.length || 18,
      tendikCount: tendikStaff.length || 5,
      guruShare,
      tendikShare,
      avgPerEmployee,
      scenarioLabel,
      scenarioDesc,
      fixedCostRatio: Math.round(((projectedGajiPokok + projectedTunjangan) / projectedGross) * 100),
      variableCostRatio: Math.round(((projectedHonorJP + projectedVariabel) / projectedGross) * 100),
    };
  }, [pegawaiList, scheduleList, scenario, customVariableMultiplier, currentTotals]);

  // Chart Comparison Data
  const chartData = useMemo(() => {
    return [
      {
        kategori: 'Gaji Pokok (Fixed)',
        BulanIni: currentTotals.totalGajiPokok,
        ProyeksiBulanDepan: projection.projectedGajiPokok,
      },
      {
        kategori: 'Tunjangan Tetap',
        BulanIni: currentTotals.totalTunjangan,
        ProyeksiBulanDepan: projection.projectedTunjangan,
      },
      {
        kategori: 'Honor Beban JP',
        BulanIni: currentTotals.totalHonorJP,
        ProyeksiBulanDepan: projection.projectedHonorJP,
      },
      {
        kategori: 'Lembur & Infal',
        BulanIni: currentTotals.totalVariabel,
        ProyeksiBulanDepan: projection.projectedVariabel,
      },
      {
        kategori: 'Total Bersih (THP)',
        BulanIni: currentTotals.totalTHP,
        ProyeksiBulanDepan: projection.projectedTHP,
      },
    ];
  }, [currentTotals, projection]);

  const handleCopyProjection = () => {
    const text = `PROYEKSI ANGGARAN PENGGAJIAN - SMK IT IBNUL QAYYIM MAKASSAR
Periode Target: ${nextMonthInfo.label}
Estimasi Total Kebutuhan Kas (THP): ${formatRupiah(projection.projectedTHP, false)}
Variansi vs Bulan Berjalan: ${projection.percentDiff >= 0 ? '+' : ''}${projection.percentDiff.toFixed(1)}% (${formatRupiah(projection.diffTHP, false)})

Rincian Komponen:
1. Gaji Pokok: ${formatRupiah(projection.projectedGajiPokok, false)} (${projection.fixedCostRatio}% porsi tetap)
2. Tunjangan Fungsional: ${formatRupiah(projection.projectedTunjangan, false)}
3. Honor Jam Mengajar (JP): ${formatRupiah(projection.projectedHonorJP, false)}
4. Estimasi Lembur & Infal: ${formatRupiah(projection.projectedVariabel, false)}
5. Estimasi Potongan: ${formatRupiah(projection.projectedPotongan, false)}

Total Pegawai Aktif: ${projection.totalStaffCount} Orang (${projection.guruCount} Guru, ${projection.tendikCount} Tendik)
Skenario: ${projection.scenarioLabel}
Jadwal Transfer: ${nextMonthInfo.cutoff.paymentLabel}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    if (showToast) {
      showToast('Ringkasan proyeksi anggaran berhasil disalin ke clipboard!', 'success');
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6">
      
      {/* Header with Period & Scenario Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Proyeksi Anggaran Mendatang
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Berdasarkan Struktur Gaji & Tren Historis
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Estimasi Biaya Penggajian: <span className="text-indigo-600 font-extrabold">{nextMonthInfo.label}</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl">
            Prakiraan kebutuhan likuiditas kas yayasan untuk periode mendatang berdasarkan {projection.totalStaffCount} staf aktif, jadwal mengajar reguler, dan parameter fluktuasi kegiatan.
          </p>
        </div>

        {/* Right Header Action: Scenario Selector & Copy */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setScenario('baseline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                scenario === 'baseline'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baseline Normal
            </button>
            <button
              type="button"
              onClick={() => setScenario('intensive')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                scenario === 'intensive'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intensif (+5%)
            </button>
            <button
              type="button"
              onClick={() => setScenario('efficient')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                scenario === 'efficient'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Efisiensi (-3%)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyProjection}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            title="Salin Ringkasan Proyeksi Anggaran"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Tersalin' : 'Salin Ikhtisar'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Projected Net Payroll */}
        <div className="bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-900 p-4 rounded-2xl text-white shadow-sm border border-indigo-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300 text-xs mb-1 font-medium">
            <span>Estimasi Kas THP Bulan Depan</span>
            <Banknote className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white mt-1">
            {formatRupiah(projection.projectedTHP)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-[11px] ${
              projection.percentDiff > 0 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {projection.percentDiff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(projection.percentDiff).toFixed(1)}%
            </span>
            <span className="text-slate-300 text-[11px]">
              vs {nextMonthInfo.currentMonthName} ({formatRupiah(projection.diffTHP)})
            </span>
          </div>
        </div>

        {/* Card 2: Fixed Cost (Gaji Pokok + Tunjangan Tetap) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Komponen Biaya Tetap (Fixed)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatRupiah(projection.projectedGajiPokok + projection.projectedTunjangan)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Porsi: <strong>{projection.fixedCostRatio}%</strong> dari Total</span>
            <span className="text-emerald-700 font-semibold">Pokok & Tunjangan</span>
          </div>
        </div>

        {/* Card 3: Variable Costs (Honor JP & Overtime) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Komponen Variabel & JP</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatRupiah(projection.projectedHonorJP + projection.projectedVariabel)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Porsi: <strong>{projection.variableCostRatio}%</strong> dari Total</span>
            <span className="text-amber-700 font-semibold">JP, Infal & Lembur</span>
          </div>
        </div>

        {/* Card 4: Average per Staff */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Rata-rata per Pegawai</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatRupiah(projection.avgPerEmployee)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{projection.totalStaffCount} Pegawai Terdaftar</span>
            <span className="text-purple-700 font-semibold">{projection.guruCount} Guru / {projection.tendikCount} Tendik</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Comparison Chart & Cost Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Visual Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart className="w-3.5 h-3.5 text-indigo-600" />
                Komparasi Nominal: Bulan Berjalan vs Proyeksi {nextMonthInfo.label}
              </h4>
              <p className="text-[11px] text-slate-500">
                Visualisasi perbandingan pos pengeluaran berdasarkan skenario terpilih.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              {projection.scenarioLabel}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="kategori" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} 
                />
                <Bar 
                  dataKey="BulanIni" 
                  name={`${nextMonthInfo.currentMonthName} (Aktual)`} 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="ProyeksiBulanDepan" 
                  name={`Proyeksi ${nextMonthInfo.monthName}`} 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Simulation Multiplier Slider */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Simulasi Penyesuaian Beban Mengajar / Kegiatan ({Math.round(customVariableMultiplier * 100)}%):
              </span>
              <span className="font-mono font-bold text-indigo-600 text-xs">
                {customVariableMultiplier > 1.0 ? `+${Math.round((customVariableMultiplier - 1.0) * 100)}%` : customVariableMultiplier < 1.0 ? `-${Math.round((1.0 - customVariableMultiplier) * 100)}%` : 'Standar'}
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={customVariableMultiplier}
              onChange={(e) => setCustomVariableMultiplier(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-20% (Pengurangan Jam)</span>
              <span>100% (Normal)</span>
              <span>+30% (Intensif Ekstra)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown & Cash Preparedness (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Detailed Component Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              Rincian Pos Anggaran Proyeksi ({nextMonthInfo.label})
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Gaji Pokok Pegawai Aktif</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(projection.projectedGajiPokok)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Tunjangan Fungsional & Vokasi</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(projection.projectedTunjangan)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Honor Beban JP Mengajar</span>
                <span className="font-bold text-indigo-700 font-mono">{formatRupiah(projection.projectedHonorJP)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Estimasi Lembur & Infal</span>
                <span className="font-bold text-amber-700 font-mono">{formatRupiah(projection.projectedVariabel)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 text-rose-800">
                <span>Perkiraan Potongan (BPJS/Kas)</span>
                <span className="font-bold font-mono">-{formatRupiah(projection.projectedPotongan)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-900">Total Kebutuhan Kas Bersih (THP):</span>
              <span className="text-indigo-900 font-black text-sm font-mono">{formatRupiah(projection.projectedTHP)}</span>
            </div>
          </div>

          {/* Executive Liquidity Advice */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Rekomendasi Likuiditas Kas Yayasan:</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Yayasan disarankan mengalokasikan dana minimal <strong>{formatRupiah(projection.projectedTHP)}</strong> di rekening kas operasional sebelum tanggal cutoff <strong>{nextMonthInfo.cutoff.paymentLabel}</strong>.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-700 border-t border-emerald-200/60">
              <span>Status Staf: <strong>{projection.guruCount} Guru</strong> + <strong>{projection.tendikCount} Tendik</strong></span>
              <span>Cut-Off: <strong>{nextMonthInfo.cutoff.cutoffLabelLong}</strong></span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
