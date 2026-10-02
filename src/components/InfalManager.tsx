import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  UserX, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  HelpCircle,
  ShieldCheck,
  BookOpen,
  School,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Pegawai, LogInfal } from '../types';
import { formatRupiah } from '../utils/security';

interface InfalManagerProps {
  pegawaiList: Pegawai[];
  infalList: LogInfal[];
  onAddInfal: (infal: LogInfal) => void;
  onDeleteInfal: (id: string) => void;
  onUpdateInfalStatus?: (id: string, status: 'approved' | 'rejected') => void;
}

export const InfalManager: React.FC<InfalManagerProps> = ({
  pegawaiList,
  infalList,
  onAddInfal,
  onDeleteInfal,
  onUpdateInfalStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<number>(8);
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>('all');

  // Form State for new Infal
  const [formData, setFormData] = useState<{
    tanggal: string;
    guruDigantikanId: string;
    guruPenggantiId: string;
    kelas: string;
    mataPelajaran: string;
    jamKe: string;
    jumlahJp: number;
    tarifPerJp: number;
    alasan: string;
    catatan: string;
  }>({
    tanggal: '2026-08-25',
    guruDigantikanId: pegawaiList[2]?.id || pegawaiList[0]?.id || '',
    guruPenggantiId: pegawaiList[1]?.id || pegawaiList[0]?.id || '',
    kelas: 'X RPL 1 (Rekayasa Perangkat Lunak)',
    mataPelajaran: 'Pemrograman Berorientasi Objek & Web',
    jamKe: 'Jam ke 1-2 (07.30 - 09.00)',
    jumlahJp: 2,
    tarifPerJp: 7500, // Rp 7.500 per JP (SMK IT Ibnul Qayyim Rule)
    alasan: 'Sakit (Surat Keterangan Dokter)',
    catatan: 'Materi pembelajaran modul praktikum HTML/CSS di Lab RPL',
  });

  const totalNominalCalculated = formData.jumlahJp * (formData.tarifPerJp || 7500);

  // List of all teachers & staff (Guru dan Tendik)
  const guruList = useMemo(() => {
    return pegawaiList;
  }, [pegawaiList]);

  // Filtered infal list
  const filteredInfal = useMemo(() => {
    return infalList.filter((item) => {
      const matchesSearch = 
        item.guruDigantikanNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.guruPenggantiNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alasan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGuru = 
        selectedGuruFilter === 'all' || 
        item.guruDigantikanId === selectedGuruFilter || 
        item.guruPenggantiId === selectedGuruFilter;

      return matchesSearch && matchesGuru;
    });
  }, [infalList, searchTerm, selectedGuruFilter]);

  // Monthly summary stats
  const stats = useMemo(() => {
    let totalJp = 0;
    let totalNominal = 0;
    const guruDigantikanSet = new Set<string>();
    const guruPenggantiSet = new Set<string>();

    filteredInfal.forEach((item) => {
      totalJp += item.jumlahJp;
      totalNominal += item.totalNominal;
      guruDigantikanSet.add(item.guruDigantikanId);
      guruPenggantiSet.add(item.guruPenggantiId);
    });

    return {
      totalJp,
      totalNominal,
      countGuruDigantikan: guruDigantikanSet.size,
      countGuruPengganti: guruPenggantiSet.size,
      totalTransaksi: filteredInfal.length,
    };
  }, [filteredInfal]);

  // Teacher aggregated infal breakdown (Teacher Balance)
  const teacherInfalBalances = useMemo(() => {
    const map: Record<string, {
      pegawai: Pegawai;
      jpDigantikan: number;
      nominalPotongan: number;
      jpMenggantikan: number;
      nominalHonor: number;
      netSaldo: number;
      transaksiCount: number;
    }> = {};

    guruList.forEach((g) => {
      map[g.id] = {
        pegawai: g,
        jpDigantikan: 0,
        nominalPotongan: 0,
        jpMenggantikan: 0,
        nominalHonor: 0,
        netSaldo: 0,
        transaksiCount: 0,
      };
    });

    infalList.forEach((item) => {
      // Guru yang digantikan (Potongan)
      if (map[item.guruDigantikanId]) {
        map[item.guruDigantikanId].jpDigantikan += item.jumlahJp;
        map[item.guruDigantikanId].nominalPotongan += item.totalNominal;
        map[item.guruDigantikanId].transaksiCount += 1;
      }
      // Guru yang menggantikan (Honor)
      if (map[item.guruPenggantiId]) {
        map[item.guruPenggantiId].jpMenggantikan += item.jumlahJp;
        map[item.guruPenggantiId].nominalHonor += item.totalNominal;
        map[item.guruPenggantiId].transaksiCount += 1;
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        netSaldo: item.nominalHonor - item.nominalPotongan,
      }))
      .filter((item) => item.transaksiCount > 0 || item.jpDigantikan > 0 || item.jpMenggantikan > 0)
      .sort((a, b) => b.transaksiCount - a.transaksiCount);
  }, [guruList, infalList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guruDigantikanId || !formData.guruPenggantiId) {
      alert('Mohon pilih guru yang digantikan dan guru pengganti');
      return;
    }
    if (formData.guruDigantikanId === formData.guruPenggantiId) {
      alert('Guru yang berhalangan tidak boleh sama dengan guru yang menggantikan!');
      return;
    }

    const guruDigantikan = pegawaiList.find(p => p.id === formData.guruDigantikanId);
    const guruPengganti = pegawaiList.find(p => p.id === formData.guruPenggantiId);

    const newRecord: LogInfal = {
      id: `infal-${Date.now()}`,
      tanggal: formData.tanggal,
      guruDigantikanId: formData.guruDigantikanId,
      guruDigantikanNama: guruDigantikan?.nama || 'Guru Berhalangan',
      guruPenggantiId: formData.guruPenggantiId,
      guruPenggantiNama: guruPengganti?.nama || 'Guru Pengganti',
      kelas: formData.kelas,
      mataPelajaran: formData.mataPelajaran,
      jamKe: formData.jamKe,
      jumlahJp: Number(formData.jumlahJp) || 2,
      tarifPerJp: Number(formData.tarifPerJp) || 7500,
      totalNominal: (Number(formData.jumlahJp) || 2) * (Number(formData.tarifPerJp) || 7500),
      alasan: formData.alasan,
      catatan: formData.catatan,
      status: 'approved',
      approvedBy: 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onAddInfal(newRecord);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card & Rules Banner - Soft Green Aesthetic */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200/80 shadow-xs">
              <ArrowRightLeft className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Manajemen Infal (Guru Pengganti)
              </h2>
              <p className="text-xs text-slate-500">
                Sistem kompensasi simetris untuk jam mengajar yang digantikan saat guru berhalangan hadir.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Infal Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Educational Rule Card: Formula Rp 7.500/JP */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
              <span>SK Yayasan SMK IT Ibnul Qayyim Makassar</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Ketentuan Kompensasi &amp; Potongan Infal: Rp 7.500 / Jam Pelajaran (JP)
            </h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Guru yang <b>tidak masuk mengajar</b> pada jadwal tatap muka maka jam pelajaran (JP) yang digantikan 
              akan <b>dipotong Rp 7.500 per JP</b>, dan nominal potongan tersebut <b>diberikan langsung sebagai honor tambahan</b> bagi 
              guru yang masuk menggantikan mengajar di kelas.
            </p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-3.5 rounded-xl border border-emerald-500/30 text-xs shrink-0 space-y-1 w-full md:w-auto text-center md:text-right">
            <span className="text-[11px] text-emerald-200">Tarif Standar Infal:</span>
            <div className="text-xl font-black text-amber-300 font-mono">Rp 7.500 <span className="text-xs font-normal text-white">/ JP</span></div>
            <div className="text-[10px] text-emerald-300 flex items-center justify-center md:justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Otomatis Sinkron ke Slip Gaji</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500">Total Jam Infal (JP)</span>
          <div className="text-xl font-bold text-slate-900 font-mono flex items-baseline gap-1">
            <span>{stats.totalJp}</span>
            <span className="text-xs font-normal text-slate-500">Jam (JP)</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            {stats.totalTransaksi} Sesi Pergantian Kelas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500">Total Alokasi Honor Infal</span>
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {formatRupiah(stats.totalNominal)}
          </div>
          <div className="text-[10px] text-slate-400">
            Kompensasi Mengajar Pengganti
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500">Total Potongan Terkumpul</span>
          <div className="text-xl font-bold text-rose-700 font-mono">
            {formatRupiah(stats.totalNominal)}
          </div>
          <div className="text-[10px] text-slate-400">
            Dari {stats.countGuruDigantikan} Guru Berhalangan
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500">Guru Pengganti Aktif</span>
          <div className="text-xl font-bold text-teal-800 font-mono flex items-baseline gap-1">
            <span>{stats.countGuruPengganti}</span>
            <span className="text-xs font-normal text-slate-500">Guru</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Saldo Simetris (0 Selisih)
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari guru, kelas, mata pelajaran, alasan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-700" /> Filter Guru:
          </span>
          <select
            value={selectedGuruFilter}
            onChange={(e) => setSelectedGuruFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">Semua Guru ({guruList.length})</option>
            {guruList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Teacher Balance Summary Table */}
      {teacherInfalBalances.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-100/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                Rekapitulasi Saldo Infal Guru (Periode Aktif)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Menampilkan {teacherInfalBalances.length} guru dengan transaksi Infal
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Nama Guru</th>
                  <th className="py-2.5 px-3">Status Pegawai</th>
                  <th className="py-2.5 px-3 text-center">Jam Digantikan (-)</th>
                  <th className="py-2.5 px-3 text-right">Potongan Infal</th>
                  <th className="py-2.5 px-3 text-center">Jam Menggantikan (+)</th>
                  <th className="py-2.5 px-3 text-right">Honor Infal</th>
                  <th className="py-2.5 px-3 text-right">Net Saldo Infal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {teacherInfalBalances.map(({ pegawai, jpDigantikan, nominalPotongan, jpMenggantikan, nominalHonor, netSaldo }) => (
                  <tr key={pegawai.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{pegawai.nama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIY: {pegawai.niy || pegawai.nip}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                        {pegawai.statusPegawai}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {jpDigantikan > 0 ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          {jpDigantikan} JP
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                      {nominalPotongan > 0 ? `-${formatRupiah(nominalPotongan)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {jpMenggantikan > 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          +{jpMenggantikan} JP
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {nominalHonor > 0 ? `+${formatRupiah(nominalHonor)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs">
                      <span className={netSaldo > 0 ? 'text-emerald-700' : netSaldo < 0 ? 'text-rose-700' : 'text-slate-600'}>
                        {netSaldo > 0 ? `+${formatRupiah(netSaldo)}` : netSaldo < 0 ? `-${formatRupiah(Math.abs(netSaldo))}` : 'Rp 0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Detailed Infal Transaction Log Table */}
      <div className="bg-white rounded-xl border border-emerald-100/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              Log Riwayat Transaksi Pergantian Mengajar (Infal)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Total {filteredInfal.length} Catatan Infal
          </span>
        </div>

        {filteredInfal.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-600">Belum ada data pencatatan Infal</p>
            <p className="text-[11px] text-slate-400">
              Klik tombol &quot;Catat Infal Baru&quot; untuk menginput guru berhalangan dan guru pengganti.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Infal Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                  <th className="py-3 px-3">Guru Yang Berhalangan</th>
                  <th className="py-3 px-3">Guru Pengganti</th>
                  <th className="py-3 px-3">Kelas &amp; Mata Pelajaran</th>
                  <th className="py-3 px-3 text-center">Durasi (JP)</th>
                  <th className="py-3 px-3 text-right">Potongan (-)</th>
                  <th className="py-3 px-3 text-right">Honor (+)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInfal.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.tanggal}</div>
                      {item.jamKe && (
                        <div className="text-[10px] text-slate-500 font-medium">{item.jamKe}</div>
                      )}
                    </td>

                    {/* Guru Berhalangan (Dipotong) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{item.guruDigantikanNama}</div>
                          <div className="text-[10px] text-rose-600 font-medium">Alasan: {item.alasan}</div>
                        </div>
                      </div>
                    </td>

                    {/* Guru Pengganti (Diberi Honor) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{item.guruPenggantiNama}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">Pengganti Aktif</div>
                        </div>
                      </div>
                    </td>

                    {/* Kelas & Mapel */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.kelas}</div>
                      <div className="text-[10px] text-slate-500">{item.mataPelajaran}</div>
                      {item.catatan && (
                        <div className="text-[10px] text-slate-400 italic line-clamp-1">{item.catatan}</div>
                      )}
                    </td>

                    {/* Durasi JP */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        {item.jumlahJp} JP
                      </span>
                    </td>

                    {/* Potongan Guru Berhalangan */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      -{formatRupiah(item.totalNominal)}
                      <div className="text-[9px] text-slate-400 font-normal">@{formatRupiah(item.tarifPerJp)}/JP</div>
                    </td>

                    {/* Honor Guru Pengganti */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      +{formatRupiah(item.totalNominal)}
                      <div className="text-[9px] text-slate-400 font-normal">@{formatRupiah(item.tarifPerJp)}/JP</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Disetujui</span>
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pencatatan Infal ${item.guruPenggantiNama} menggantikan ${item.guruDigantikanNama}?`)) {
                            onDeleteInfal(item.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Hapus Infal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Modal Input Pencatatan Infal Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-auto border border-emerald-100">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Catat Guru Pengganti (Infal)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tarif otomatis Rp 7.500/JP (Potongan guru berhalangan = Honor guru pengganti)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Tanggal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Pergantian Mengajar
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Guru yang Berhalangan & Guru Pengganti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1">
                  <label className="block font-bold text-rose-900 flex items-center gap-1">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>Guru Yang Berhalangan (Dipotong)</span>
                  </label>
                  <select
                    required
                    value={formData.guruDigantikanId}
                    onChange={(e) => setFormData({ ...formData, guruDigantikanId: e.target.value })}
                    className="w-full p-2 border rounded-lg border-rose-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                  >
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.statusPegawai})
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-rose-700">Gaji akan dipotong Rp 7.500/JP</div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1">
                  <label className="block font-bold text-emerald-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Guru Pengganti (Diberi Honor)</span>
                  </label>
                  <select
                    required
                    value={formData.guruPenggantiId}
                    onChange={(e) => setFormData({ ...formData, guruPenggantiId: e.target.value })}
                    className="w-full p-2 border rounded-lg border-emerald-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.statusPegawai})
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-emerald-700">Menerima honor +Rp 7.500/JP</div>
                </div>
              </div>

              {/* Kelas & Mata Pelajaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat / Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: X RPL 1, XI TKJ, XII RPL"
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pemrograman Web, Matematika"
                    value={formData.mataPelajaran}
                    onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Jam Ke, Jumlah JP, Tarif */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu / Jam Ke</label>
                  <input
                    type="text"
                    placeholder="Jam 1-2 (07.30-09.00)"
                    value={formData.jamKe}
                    onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah JP</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formData.jumlahJp}
                    onChange={(e) => setFormData({ ...formData, jumlahJp: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg border-emerald-300 bg-emerald-50/50 font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif Flat (Rp/JP)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.tarifPerJp}
                    className="w-full p-2 border rounded-lg border-slate-200 bg-slate-100 font-bold text-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* Alasan & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alasan Berhalangan</label>
                  <select
                    value={formData.alasan}
                    onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="Sakit (Surat Keterangan Dokter)">Sakit (Surat Keterangan Dokter)</option>
                    <option value="Izin Dinas Luar Sekolah">Izin Dinas Luar Sekolah</option>
                    <option value="Cuti Tahunan / Khusus">Cuti Tahunan / Khusus</option>
                    <option value="Izin Pribadi / Mendesak">Izin Pribadi / Mendesak</option>
                    <option value="Tanpa Keterangan (Alpha Mengajar)">Tanpa Keterangan (Alpha Mengajar)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Materi praktikum / modul..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Kalkulasi Simetris Preview */}
              <div className="bg-[#051c17] text-white p-3.5 rounded-xl border border-emerald-900/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-200/80">Kalkulasi Otomatis Sistem:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {formData.jumlahJp} JP × Rp 7.500 = {formatRupiah(totalNominalCalculated)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-900/80">
                  <div className="text-rose-300">
                    Potongan Guru Berhalangan: <b className="font-mono">-{formatRupiah(totalNominalCalculated)}</b>
                  </div>
                  <div className="text-emerald-300 text-right">
                    Honor Guru Pengganti: <b className="font-mono">+{formatRupiah(totalNominalCalculated)}</b>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition cursor-pointer"
                >
                  Simpan Infal &amp; Terapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
