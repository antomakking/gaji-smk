import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Award, 
  GraduationCap, 
  CreditCard,
  Building,
  CheckCircle,
  Briefcase,
  Table as TableIcon,
  LayoutGrid,
  Filter,
  Calendar,
  MapPin,
  FileBadge,
  Edit3,
  AlertCircle,
  Sparkles,
  BookOpen,
  Check,
  RefreshCw,
  Banknote,
  X
} from 'lucide-react';

import { Pegawai, StatusPegawai } from '../types';
import { formatRupiah, maskData } from '../utils/security';
import { BulkSalaryAdjustmentModal } from './BulkSalaryAdjustmentModal';
import { Editdata } from './Editdata';

interface EmployeeManagerProps {
  pegawaiList: Pegawai[];
  onAddPegawai: (pegawai: Pegawai) => void;
  onUpdatePegawai?: (pegawai: Pegawai) => void;
  onBulkUpdateSalary?: (updatedStaff: Pegawai[]) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}


// Utility to calculate age from birth date string (YYYY-MM-DD)
export const calculateAge = (birthDateStr?: string, refDateStr: string = '2026-08-31'): string => {
  if (!birthDateStr || birthDateStr === '-') return '';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '';
  const ref = new Date(refDateStr);
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return '0 Tahun';
  return `${years} Tahun${months > 0 ? ` ${months} Bulan` : ''}`;
};

// Utility to calculate tenure (Masa Kerja) from TMT
export const calculateMasaKerja = (tmtStr?: string, refDateStr: string = '2026-08-31'): string => {
  if (!tmtStr || tmtStr === '-') return '';
  const tmt = new Date(tmtStr);
  if (isNaN(tmt.getTime())) return '';
  const ref = new Date(refDateStr);
  let years = ref.getFullYear() - tmt.getFullYear();
  let months = ref.getMonth() - tmt.getMonth();
  if (ref.getDate() < tmt.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return '0 Tahun 0 Bulan';
  return `${years} Tahun ${months} Bulan`;
};

const POPULAR_JURUSAN = [
  'Pendidikan Sejarah',
  'Teknik Informatika',
  'Rekayasa Perangkat Lunak',
  'Teknik Komputer & Jaringan',
  'Pendidikan Matematika',
  'Pendidikan Bahasa Inggris',
  'Pendidikan Jasmani, Kesehatan dan Rekreasi',
  'Ekonomi Islam',
  'Hukum Keluarga',
  'Akuntansi',
  'Manajemen',
  'Psikologi',
  'Dirasah Islamiyah',
  'Pendidikan Agama Islam',
  'Linguistik / Sastra'
];

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  pegawaiList,
  onAddPegawai,
  onUpdatePegawai,
  onBulkUpdateSalary,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'incomplete' | 'GTY' | 'GTT' | 'PTY' | 'induk' | 'non_induk'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'editdata'>('editdata');
  const [showEncryptedAccounts, setShowEncryptedAccounts] = useState<Record<string, boolean>>({});
  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkSalaryModalOpen, setBulkSalaryModalOpen] = useState(false);
  const [selectedDetailPegawai, setSelectedDetailPegawai] = useState<Pegawai | null>(null);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);


  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<Pegawai>>({});

  // New Employee Form State
  const [formData, setFormData] = useState<Partial<Pegawai>>({
    nama: '',
    nip: '',
    niy: '',
    nik: '',
    nuptk: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '',
    usia: '',
    jurusan: '',
    tmt: '',
    masaKerja: '',
    statusInduk: 'Induk',
    email: '',
    noHp: '',
    statusPegawai: 'GTY',
    jabatanUtama: 'Guru Mapel Kejuruan IT',
    pendidikanTerakhir: 'S1',
    tanggalMasuk: new Date().toISOString().slice(0, 10),
    namaBank: 'Bank Syariah Indonesia (BSI)',
    nomorRekening: '',
    atasNamaRekening: '',
    gajiPokokDefault: 1800000,
    tunjanganJabatanDefault: 0,
    tarifPerJamMengajar: 18000,
    tarifTransportHarian: 20000,
    tarifLemburPerJam: 20000,
    tunjanganKeluarga: 0,
    tunjanganWaliKelas: 0,
    tunjanganKhususVokasi: 0,
    potonganBpjsKesehatan: 0,
    potonganBpjsKetenagakerjaan: 0,
    potonganKasSekolah: 0,
  });

  const toggleRevealAccount = (id: string) => {
    setShowEncryptedAccounts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Edit Modal for a specific employee
  const handleOpenEdit = (peg: Pegawai) => {
    setEditingPegawai(peg);
    setEditFormData({
      ...peg,
      tempatLahir: peg.tempatLahir || '',
      tanggalLahir: peg.tanggalLahir || '',
      usia: peg.usia || calculateAge(peg.tanggalLahir),
      jurusan: peg.jurusan && peg.jurusan !== '-' ? peg.jurusan : '',
      tmt: peg.tmt || peg.tanggalMasuk || '',
      masaKerja: peg.masaKerja || calculateMasaKerja(peg.tmt || peg.tanggalMasuk),
      pendidikanTerakhir: peg.pendidikanTerakhir || 'S1',
      jenisKelamin: peg.jenisKelamin || 'L',
      statusInduk: peg.statusInduk || 'Induk',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPegawai || !onUpdatePegawai) return;

    // Recalculate auto values if needed
    const calculatedAge = editFormData.tanggalLahir 
      ? calculateAge(editFormData.tanggalLahir) 
      : (editFormData.usia || '');
    
    const calculatedMasaKerja = editFormData.tmt 
      ? calculateMasaKerja(editFormData.tmt) 
      : (editFormData.masaKerja || '');

    const updated: Pegawai = {
      ...editingPegawai,
      ...editFormData,
      nama: editFormData.nama || editingPegawai.nama,
      nip: editFormData.nip || editingPegawai.nip,
      niy: editFormData.niy || editFormData.nip || editingPegawai.niy,
      nik: editFormData.nik || '',
      nuptk: editFormData.nuptk || '',
      jenisKelamin: (editFormData.jenisKelamin as 'L' | 'P') || 'L',
      tempatLahir: editFormData.tempatLahir || '',
      tanggalLahir: editFormData.tanggalLahir || '',
      usia: calculatedAge,
      jurusan: editFormData.jurusan || '',
      pendidikanTerakhir: editFormData.pendidikanTerakhir || 'S1',
      tmt: editFormData.tmt || '',
      masaKerja: calculatedMasaKerja,
      statusInduk: editFormData.statusInduk || 'Induk',
      keteranganInduk: editFormData.keteranganInduk || '',
      statusPegawai: (editFormData.statusPegawai as StatusPegawai) || editingPegawai.statusPegawai,
      jabatanUtama: editFormData.jabatanUtama || editingPegawai.jabatanUtama,
      jabatanTambahan: editFormData.jabatanTambahan || editingPegawai.jabatanTambahan,
      email: editFormData.email || editingPegawai.email,
      noHp: editFormData.noHp || editingPegawai.noHp,
      namaBank: editFormData.namaBank || editingPegawai.namaBank,
      nomorRekening: editFormData.nomorRekening || editingPegawai.nomorRekening,
      atasNamaRekening: editFormData.atasNamaRekening || editingPegawai.atasNamaRekening,
      gajiPokokDefault: Number(editFormData.gajiPokokDefault ?? editingPegawai.gajiPokokDefault),
      tunjanganJabatanDefault: Number(editFormData.tunjanganJabatanDefault ?? editingPegawai.tunjanganJabatanDefault),
      tarifPerJamMengajar: Number(editFormData.tarifPerJamMengajar ?? editingPegawai.tarifPerJamMengajar),
      tarifTransportHarian: Number(editFormData.tarifTransportHarian ?? editingPegawai.tarifTransportHarian),
      tarifLemburPerJam: Number(editFormData.tarifLemburPerJam ?? editingPegawai.tarifLemburPerJam ?? 20000),
      tunjanganKeluarga: Number(editFormData.tunjanganKeluarga ?? editingPegawai.tunjanganKeluarga),
      tunjanganWaliKelas: Number(editFormData.tunjanganWaliKelas ?? editingPegawai.tunjanganWaliKelas),
      tunjanganKhususVokasi: Number(editFormData.tunjanganKhususVokasi ?? editingPegawai.tunjanganKhususVokasi),
      potonganBpjsKesehatan: Number(editFormData.potonganBpjsKesehatan ?? editingPegawai.potonganBpjsKesehatan),
      potonganBpjsKetenagakerjaan: Number(editFormData.potonganBpjsKetenagakerjaan ?? editingPegawai.potonganBpjsKetenagakerjaan),
      potonganKasSekolah: Number(editFormData.potonganKasSekolah ?? editingPegawai.potonganKasSekolah),
    };

    onUpdatePegawai(updated);
    if (selectedDetailPegawai && selectedDetailPegawai.id === updated.id) {
      setSelectedDetailPegawai(updated);
    }
    setEditingPegawai(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nip || !formData.email) return;

    const calculatedAge = formData.tanggalLahir 
      ? calculateAge(formData.tanggalLahir) 
      : (formData.usia || '');
    
    const calculatedMasaKerja = formData.tmt 
      ? calculateMasaKerja(formData.tmt) 
      : (formData.masaKerja || '');

    const newPegawai: Pegawai = {
      id: `peg-${Date.now()}`,
      nip: formData.nip || '',
      niy: formData.niy || formData.nip || '',
      nik: formData.nik || '',
      nuptk: formData.nuptk || '',
      jenisKelamin: (formData.jenisKelamin as 'L' | 'P') || 'L',
      tempatLahir: formData.tempatLahir || '',
      tanggalLahir: formData.tanggalLahir || '',
      usia: calculatedAge,
      jurusan: formData.jurusan || '',
      tmt: formData.tmt || formData.tanggalMasuk || '',
      masaKerja: calculatedMasaKerja,
      statusInduk: formData.statusInduk || 'Induk',
      keteranganInduk: formData.keteranganInduk || '',
      nama: formData.nama || '',
      email: formData.email || '',
      noHp: formData.noHp || '',
      statusPegawai: (formData.statusPegawai as StatusPegawai) || 'GTT',
      jabatanUtama: formData.jabatanUtama || '',
      jabatanTambahan: formData.jabatanTambahan || [],
      pendidikanTerakhir: formData.pendidikanTerakhir || 'S1',
      tanggalMasuk: formData.tanggalMasuk || new Date().toISOString().slice(0, 10),
      namaBank: formData.namaBank || 'Bank Syariah Indonesia (BSI)',
      nomorRekening: formData.nomorRekening || '7100000000',
      atasNamaRekening: formData.atasNamaRekening || formData.nama || '',
      gajiPokokDefault: Number(formData.gajiPokokDefault || 0),
      tunjanganJabatanDefault: Number(formData.tunjanganJabatanDefault || 0),
      tarifPerJamMengajar: Number(formData.tarifPerJamMengajar || 18000),
      tarifTransportHarian: Number(formData.tarifTransportHarian || 20000),
      tarifLemburPerJam: Number(formData.tarifLemburPerJam || 20000),
      tunjanganKeluarga: Number(formData.tunjanganKeluarga || 0),
      tunjanganWaliKelas: Number(formData.tunjanganWaliKelas || 0),
      tunjanganKhususVokasi: Number(formData.tunjanganKhususVokasi || 0),
      potonganBpjsKesehatan: Number(formData.potonganBpjsKesehatan || 0),
      potonganBpjsKetenagakerjaan: Number(formData.potonganBpjsKetenagakerjaan || 0),
      potonganKasSekolah: Number(formData.potonganKasSekolah || 0),
      isActive: true,
    };

    onAddPegawai(newPegawai);
    setAddModalOpen(false);
  };

  const isDataIncomplete = (p: Pegawai) => {
    const isTtlEmpty = !p.tempatLahir || p.tempatLahir.trim() === '' || p.tempatLahir === '-' || !p.tanggalLahir || p.tanggalLahir === '-';
    const isJurusanEmpty = (!p.jurusan || p.jurusan.trim() === '' || p.jurusan === '-') && (p.pendidikanTerakhir === 'S1' || p.pendidikanTerakhir === 'S2' || p.pendidikanTerakhir === 'D3');
    return isTtlEmpty || isJurusanEmpty;
  };

  const incompleteCount = pegawaiList.filter(isDataIncomplete).length;

  const filtered = pegawaiList.filter((p) => {
    const matchesSearch = 
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.includes(searchTerm) ||
      (p.niy && p.niy.includes(searchTerm)) ||
      (p.nik && p.nik.includes(searchTerm)) ||
      (p.nuptk && p.nuptk.includes(searchTerm)) ||
      (p.tempatLahir && p.tempatLahir.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.jabatanUtama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.jurusan && p.jurusan.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterCategory === 'all') return true;
    if (filterCategory === 'incomplete') return isDataIncomplete(p);
    if (filterCategory === 'GTY') return p.statusPegawai === 'GTY';
    if (filterCategory === 'GTT') return p.statusPegawai === 'GTT';
    if (filterCategory === 'PTY') return p.statusPegawai === 'PTY' || p.statusPegawai === 'PTT';
    if (filterCategory === 'induk') return p.statusInduk === 'Induk';
    if (filterCategory === 'non_induk') return p.statusInduk === 'Non Induk';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Master Data Guru & Tenaga Kependidikan (Tendik)
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {pegawaiList.length} Guru & Tendik Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data resmi kepegawaian SMK IT Ibnul Qayyim Makassar: Tempat & Tanggal Lahir (TTL), Jurusan S1/Ijazah, NIY, NIK, NUPTK, TMT, Masa Kerja, Gaji Pokok & Tarif JP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('editdata')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'editdata' ? 'bg-emerald-700 text-white shadow-sm font-bold' : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Matriks Edit Data Lengkap (Live RPC)</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-emerald-800 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Ringkas</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-emerald-800 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu Payroll</span>
            </button>
          </div>

          <button
            onClick={() => setBulkSalaryModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Penyesuaian Gaji Pokok Massal & Personal ke Supabase"
          >
            <Banknote className="w-4 h-4" />
            <span>Penyesuaian Gaji Pokok</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      {/* Incomplete Data Notification Banner if applicable */}
      {incompleteCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Perhatian: {incompleteCount} data pegawai belum memiliki TTL atau Jurusan S1 lengkap.</span>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Klik tombol <span className="font-semibold text-emerald-800">"Edit / Lengkapi"</span> pada baris tabel untuk melengkapi Tempat Tanggal Lahir dan Jurusan Ijazah.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterCategory(filterCategory === 'incomplete' ? 'all' : 'incomplete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border cursor-pointer ${
              filterCategory === 'incomplete'
                ? 'bg-amber-700 text-white border-amber-800'
                : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {filterCategory === 'incomplete' ? 'Tampilkan Semua' : `Filter ${incompleteCount} Data Belum Lengkap`}
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NIY, NIK, TTL, jurusan, jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({pegawaiList.length})
          </button>

          {incompleteCount > 0 && (
            <button
              onClick={() => setFilterCategory('incomplete')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                filterCategory === 'incomplete' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Belum Lengkap ({incompleteCount})</span>
            </button>
          )}

          <button
            onClick={() => setFilterCategory('GTY')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterCategory === 'GTY' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            GTY ({pegawaiList.filter(p => p.statusPegawai === 'GTY').length})
          </button>
          <button
            onClick={() => setFilterCategory('GTT')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterCategory === 'GTT' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            GTT ({pegawaiList.filter(p => p.statusPegawai === 'GTT').length})
          </button>
          <button
            onClick={() => setFilterCategory('PTY')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterCategory === 'PTY' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Tendik PTY ({pegawaiList.filter(p => p.statusPegawai === 'PTY' || p.statusPegawai === 'PTT').length})
          </button>
          <button
            onClick={() => setFilterCategory('induk')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterCategory === 'induk' ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Induk ({pegawaiList.filter(p => p.statusInduk === 'Induk').length})
          </button>
          <button
            onClick={() => setFilterCategory('non_induk')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterCategory === 'non_induk' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Non-Induk ({pegawaiList.filter(p => p.statusInduk === 'Non Induk').length})
          </button>
        </div>
      </div>

      {/* EDITDATA MATRIX VIEW (Master Guru & Pegawai with Sticky Name & Supabase RPC) */}
      {viewMode === 'editdata' && (
        <Editdata
          pegawaiList={pegawaiList}
          onUpdatePegawai={onUpdatePegawai}
          onBatchUpdatePegawai={onBulkUpdateSalary}
          showToast={onShowToast}
        />
      )}

      {/* TABLE VIEW (Complete Master Table) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3 min-w-[200px]">NIY & Nama Pegawai</th>
                  <th className="py-3 px-2 text-center">L/P</th>
                  <th className="py-3 px-3 min-w-[170px]">Tempat, Tgl Lahir (Usia)</th>
                  <th className="py-3 px-3">NIK / NUPTK</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Jabatan & Penugasan</th>
                  <th className="py-3 px-3">TMT & Masa Kerja</th>
                  <th className="py-3 px-3 min-w-[160px]">Ijazah / Jurusan S1</th>
                  <th className="py-3 px-3">Status Induk</th>
                  <th className="py-3 px-3 text-right">Gaji Pokok</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((peg, index) => {
                  const hasMissingTtl = !peg.tempatLahir || peg.tempatLahir === '-' || !peg.tanggalLahir || peg.tanggalLahir === '-';
                  const hasMissingJurusan = (!peg.jurusan || peg.jurusan === '-') && (peg.pendidikanTerakhir === 'S1' || peg.pendidikanTerakhir === 'S2' || peg.pendidikanTerakhir === 'D3');
                  
                  return (
                    <tr key={`${peg.id}-${index}`} className="hover:bg-emerald-50/40 transition">
                      <td className="py-3 px-3 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{peg.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIY: {peg.niy || peg.nip}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-semibold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          peg.jenisKelamin === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {peg.jenisKelamin || 'L'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {hasMissingTtl ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-slate-400 italic text-[11px]">-</span>
                            <button
                              onClick={() => handleOpenEdit(peg)}
                              className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded font-semibold border border-amber-200 flex items-center gap-1 transition cursor-pointer"
                              title="Klik untuk melengkapi TTL"
                            >
                              <Plus className="w-2.5 h-2.5" /> Lengkapi TTL
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-800">
                              {peg.tempatLahir}, {peg.tanggalLahir}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {peg.usia || calculateAge(peg.tanggalLahir)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>{peg.nik || '-'}</div>
                        {peg.nuptk && (
                          <div className="text-[10px] text-emerald-700 font-semibold">NUPTK: {peg.nuptk}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          peg.statusPegawai === 'GTY' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          peg.statusPegawai === 'PTY' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {peg.statusPegawai}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{peg.jabatanUtama}</div>
                        {peg.jabatanTambahan && peg.jabatanTambahan.length > 0 && (
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {peg.jabatanTambahan.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div>{peg.tmt || peg.tanggalMasuk}</div>
                        {peg.masaKerja && (
                          <div className="text-[10px] text-slate-500 font-medium">{peg.masaKerja}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{peg.pendidikanTerakhir}</div>
                        {hasMissingJurusan ? (
                          <div className="flex flex-col items-start gap-1 mt-0.5">
                            <span className="text-slate-400 italic text-[11px]">-</span>
                            <button
                              onClick={() => handleOpenEdit(peg)}
                              className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded font-semibold border border-amber-200 flex items-center gap-1 transition cursor-pointer"
                              title="Klik untuk melengkapi Jurusan"
                            >
                              <Plus className="w-2.5 h-2.5" /> Isi Jurusan
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-950 font-medium">{peg.jurusan || '-'}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          peg.statusInduk === 'Induk' ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {peg.statusInduk || 'Induk'}
                        </span>
                        {peg.keteranganInduk && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">{peg.keteranganInduk}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatRupiah(peg.gajiPokokDefault)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedDetailPegawai(peg)}
                            className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer"
                            title="Lihat Profil Lengkap"
                          >
                            Lihat
                          </button>
                          <button
                            onClick={() => handleOpenEdit(peg)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 border border-emerald-200 cursor-pointer"
                            title="Edit / Lengkapi Data TTL & Jurusan"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Menampilkan <b>{filtered.length}</b> dari {pegawaiList.length} data guru & tenaga kependidikan</span>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Database terverifikasi SMK IT Ibnul Qayyim Makassar
            </span>
          </div>
        </div>
      )}

      {/* GRID VIEW (Salary & Bank Account Card Snapshot) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((peg, idx) => {
            const isRevealed = showEncryptedAccounts[peg.id];
            const incomplete = isDataIncomplete(peg);

            return (
              <div key={`${peg.id}-${idx}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition relative">
                {incomplete && (
                  <div className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Lengkapi Data
                  </div>
                )}

                <div>
                  {/* Status & ID */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                        {peg.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{peg.nama}</h3>
                        <div className="text-[10px] text-slate-400 font-mono">NIY: {peg.niy || peg.nip}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase">
                      {peg.statusPegawai}
                    </span>
                  </div>

                  {/* TTL & Jurusan Overview Card */}
                  <div className="mt-3.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                    <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{peg.jabatanUtama}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="text-slate-500">TTL:</span>
                      <span className="font-medium text-slate-800">
                        {peg.tempatLahir && peg.tanggalLahir ? `${peg.tempatLahir}, ${peg.tanggalLahir}` : <span className="text-amber-600 italic">Belum diisi</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Ijazah: <b className="text-slate-700">{peg.pendidikanTerakhir}</b></span>
                      <span>Jurusan: <b className="text-slate-700">{peg.jurusan || <span className="text-amber-600 italic">Belum diisi</span>}</b></span>
                    </div>
                  </div>

                  {/* Salary Scheme Snapshot */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Gaji Pokok:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(peg.gajiPokokDefault)}</span>
                    </div>
                    {peg.tarifPerJamMengajar > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tarif per JP:</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(peg.tarifPerJamMengajar)}/JP</span>
                      </div>
                    )}
                    {peg.tunjanganJabatanDefault > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tunj. Jabatan:</span>
                        <span className="font-medium text-slate-800">{formatRupiah(peg.tunjanganJabatanDefault)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Account Info & Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <div className="text-[11px]">
                      <div className="font-semibold text-slate-700">{peg.namaBank}</div>
                      <div className="font-mono text-slate-500">
                        {isRevealed ? peg.nomorRekening : maskData(peg.nomorRekening, 3, 3)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRevealAccount(peg.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-100 cursor-pointer"
                      title={isRevealed ? "Tutup Masking" : "Buka Enkripsi"}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(peg)}
                      className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Edit Biodata"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedDetailPegawai(peg)}
                      className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md text-[11px] font-semibold cursor-pointer"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT & LENGKAPI BIODATA (TTL & JURUSAN S1) */}
      {/* ========================================================================= */}
      {editingPegawai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Edit & Lengkapi Data Guru / Tendik
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui Tempat Tanggal Lahir (TTL), Jurusan S1, Pendidikan, NIY, NIK, dan Skema Gaji.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPegawai(null)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6 text-xs">
              {/* SECTION 1: BIODATA, TEMPAT & TANGGAL LAHIR (TTL) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                    <FileBadge className="w-4 h-4 text-emerald-700" />
                    <span>1. Identitas & Tempat Tanggal Lahir (TTL)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium">Wajib diisi lengkap</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar Akademik</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                      placeholder="Contoh: Gr. Ashary Alam, S.Pd., M.Pd."
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tempat Lahir (Kota / Kabupaten) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Makassar / Ujung Pandang / Bulukumba / Bone"
                        value={editFormData.tempatLahir || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, tempatLahir: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={editFormData.tanggalLahir || ''}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          const newAge = calculateAge(newDate);
                          setEditFormData({ 
                            ...editFormData, 
                            tanggalLahir: newDate,
                            usia: newAge
                          });
                        }}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Usia (Terhitung Otomatis)</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editFormData.tanggalLahir) {
                            setEditFormData({ ...editFormData, usia: calculateAge(editFormData.tanggalLahir) });
                          }
                        }}
                        className="text-[10px] text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Hitung Ulang
                      </button>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 31 Tahun 7 Bulan"
                      value={editFormData.usia || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, usia: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-100/70 font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={editFormData.jenisKelamin || 'L'}
                      onChange={(e) => setEditFormData({ ...editFormData, jenisKelamin: e.target.value as 'L' | 'P' })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIK KTP (16 Digit)</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="Contoh: 7371121901950004"
                      value={editFormData.nik || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIY / NIP</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 19950119-202007-01-03"
                      value={editFormData.niy || editFormData.nip || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, niy: e.target.value, nip: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NUPTK (Jika ada)</label>
                    <input
                      type="text"
                      placeholder="NUPTK 16 digit"
                      value={editFormData.nuptk || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nuptk: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      value={editFormData.noHp || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, noHp: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: KUALIFIKASI PENDIDIKAN & JURUSAN S1 */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3.5">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>2. Kualifikasi Pendidikan Terakhir & Jurusan S1</span>
                  </h4>
                  <span className="text-[11px] text-emerald-800 font-medium">Linearitas Mapel</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenjang Ijazah Terakhir</label>
                    <select
                      value={editFormData.pendidikanTerakhir || 'S1'}
                      onChange={(e) => setEditFormData({ ...editFormData, pendidikanTerakhir: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-semibold text-slate-800"
                    >
                      <option value="S3">S3 (Doktor)</option>
                      <option value="S2">S2 (Magister)</option>
                      <option value="S1">S1 (Sarjana)</option>
                      <option value="D3">D3 (Diploma 3)</option>
                      <option value="D2">D2 (Diploma 2)</option>
                      <option value="D1">D1 (Diploma 1)</option>
                      <option value="SMA">SMA / MA / SMK</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jurusan S1 / Program Studi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pendidikan Sejarah / Teknik Informatika / Pendidikan Matematika"
                      value={editFormData.jurusan || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, jurusan: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Popular Jurusan Suggestions */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">Pilih cepat jurusan / program studi:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_JURUSAN.map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, jurusan: j })}
                        className={`text-[10px] px-2 py-0.5 rounded-md transition border cursor-pointer ${
                          editFormData.jurusan === j
                            ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: PENUGASAN & STATUS KERJA */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                    <span>3. Penugasan, Status Induk & Masa Kerja</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
                    <select
                      value={editFormData.statusPegawai || 'GTY'}
                      onChange={(e) => setEditFormData({ ...editFormData, statusPegawai: e.target.value as StatusPegawai })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    >
                      <option value="GTY">Guru Tetap Yayasan (GTY)</option>
                      <option value="GTT">Guru Tidak Tetap / Percobaan (GTT)</option>
                      <option value="PTY">Pegawai Tetap Yayasan (PTY / Tendik)</option>
                      <option value="PTT">Pegawai Tidak Tetap (PTT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status Induk / Non-Induk</label>
                    <select
                      value={editFormData.statusInduk || 'Induk'}
                      onChange={(e) => setEditFormData({ ...editFormData, statusInduk: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                    >
                      <option value="Induk">Guru / Staf Induk (SMK IT Ibnul Qayyim)</option>
                      <option value="Non Induk">Guru Non-Induk (SMPIT / Mitra Luar - Murni JP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jabatan Utama</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Guru Mapel Sejarah / Kaprog RPL"
                      value={editFormData.jabatanUtama || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, jabatanUtama: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Asal Sekolah (Jika Non-Induk)</label>
                    <input
                      type="text"
                      placeholder="Contoh: SMPIT Ibnul Qayyim Makassar"
                      value={editFormData.keteranganInduk || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, keteranganInduk: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TMT (Terhitung Mulai Tanggal)</label>
                    <input
                      type="date"
                      value={editFormData.tmt || editFormData.tanggalMasuk || ''}
                      onChange={(e) => {
                        const newTmt = e.target.value;
                        const newMasa = calculateMasaKerja(newTmt);
                        setEditFormData({ 
                          ...editFormData, 
                          tmt: newTmt,
                          masaKerja: newMasa
                        });
                      }}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Masa Kerja (Terhitung)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 6 Tahun 9 Bulan"
                      value={editFormData.masaKerja || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, masaKerja: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-100 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: SKEMA PENGGAJIAN & REKENING */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3.5">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>4. Skema Komponen Gaji & Rekening Bank</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok Default (Rp)</label>
                    <input
                      type="number"
                      required
                      value={editFormData.gajiPokokDefault ?? 0}
                      onChange={(e) => setEditFormData({ ...editFormData, gajiPokokDefault: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tarif per JP Mengajar (Rp)</label>
                    <input
                      type="number"
                      value={editFormData.tarifPerJamMengajar ?? 18000}
                      onChange={(e) => setEditFormData({ ...editFormData, tarifPerJamMengajar: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tarif Jam Lembur (Rp/Jam)</label>
                    <input
                      type="number"
                      value={editFormData.tarifLemburPerJam ?? 20000}
                      onChange={(e) => setEditFormData({ ...editFormData, tarifLemburPerJam: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={editFormData.namaBank || 'Bank Syariah Indonesia (BSI)'}
                      onChange={(e) => setEditFormData({ ...editFormData, namaBank: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={editFormData.nomorRekening || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nomorRekening: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Atas Nama Rekening</label>
                    <input
                      type="text"
                      value={editFormData.atasNamaRekening || editFormData.nama || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, atasNamaRekening: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPegawai(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs hover:shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Pegawai */}
      {selectedDetailPegawai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{selectedDetailPegawai.nama}</h3>
                <p className="text-xs text-slate-500">NIY: {selectedDetailPegawai.niy || selectedDetailPegawai.nip} | {selectedDetailPegawai.jabatanUtama}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const target = selectedDetailPegawai;
                    setSelectedDetailPegawai(null);
                    handleOpenEdit(target);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit / Lengkapi</span>
                </button>
                <button onClick={() => setSelectedDetailPegawai(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer">×</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <FileBadge className="w-3.5 h-3.5 text-emerald-700" /> Profil Biodata & TTL
                </h4>
                <div className="flex justify-between"><span className="text-slate-500">Jenis Kelamin:</span><span className="font-semibold">{selectedDetailPegawai.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tempat, Tgl Lahir:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetailPegawai.tempatLahir && selectedDetailPegawai.tanggalLahir 
                      ? `${selectedDetailPegawai.tempatLahir}, ${selectedDetailPegawai.tanggalLahir}` 
                      : <span className="text-amber-600 font-bold italic">Belum lengkap</span>}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Usia:</span><span className="font-semibold">{selectedDetailPegawai.usia || calculateAge(selectedDetailPegawai.tanggalLahir) || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">NIK KTP:</span><span className="font-mono font-semibold">{selectedDetailPegawai.nik || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">NUPTK:</span><span className="font-mono font-semibold">{selectedDetailPegawai.nuptk || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email Resmi:</span><span className="font-semibold">{selectedDetailPegawai.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">No. WhatsApp:</span><span className="font-semibold">{selectedDetailPegawai.noHp}</span></div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-700" /> Data Kepegawaian & Ijazah
                </h4>
                <div className="flex justify-between"><span className="text-slate-500">Status Pegawai:</span><span className="font-bold text-emerald-700">{selectedDetailPegawai.statusPegawai}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status Induk:</span><span className="font-bold">{selectedDetailPegawai.statusInduk || 'Induk'}</span></div>
                {selectedDetailPegawai.keteranganInduk && (
                  <div className="flex justify-between"><span className="text-slate-500">Asal Sekolah:</span><span className="font-medium text-slate-700">{selectedDetailPegawai.keteranganInduk}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Ijazah Terakhir:</span><span className="font-semibold">{selectedDetailPegawai.pendidikanTerakhir}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jurusan S1 / Studi:</span>
                  <span className="font-bold text-emerald-950">
                    {selectedDetailPegawai.jurusan || <span className="text-amber-600 italic">Belum diisi</span>}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">TMT (Terhitung Mulai):</span><span className="font-semibold">{selectedDetailPegawai.tmt || selectedDetailPegawai.tanggalMasuk}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Masa Kerja:</span><span className="font-semibold">{selectedDetailPegawai.masaKerja || calculateMasaKerja(selectedDetailPegawai.tmt || selectedDetailPegawai.tanggalMasuk) || '-'}</span></div>
              </div>
            </div>

            {/* Skema Komponen Penggajian */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-950 border-b border-emerald-200/80 pb-1">Skema Komponen Penggajian & Rekening</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 text-[11px]">Gaji Pokok:</span>
                  <div className="font-bold text-slate-900 font-mono">{formatRupiah(selectedDetailPegawai.gajiPokokDefault)}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Tarif Jam Mengajar:</span>
                  <div className="font-bold text-emerald-700 font-mono">{formatRupiah(selectedDetailPegawai.tarifPerJamMengajar)}/JP</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Tarif Jam Lembur:</span>
                  <div className="font-bold text-slate-900 font-mono">{formatRupiah(selectedDetailPegawai.tarifLemburPerJam || 20000)}/Jam</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Tunj. Jabatan:</span>
                  <div className="font-bold text-slate-900 font-mono">{formatRupiah(selectedDetailPegawai.tunjanganJabatanDefault)}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                <span>Rekening Bank: <b>{selectedDetailPegawai.namaBank}</b> - <span className="font-mono">{selectedDetailPegawai.nomorRekening}</span> a.n. <b>{selectedDetailPegawai.atasNamaRekening}</b></span>
                <span className="text-emerald-700 font-semibold">Status: Aktif</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDetailPegawai(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Pegawai */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tambah Data Guru / Tendik Baru</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gr. Ashary Alam, S.Pd., M.Pd."
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIY / NIP</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19950119-202007-01-03"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value, niy: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir (Kota/Kabupaten)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makassar"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalLahir}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData({ 
                        ...formData, 
                        tanggalLahir: newDate,
                        usia: calculateAge(newDate)
                      });
                    }}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK KTP (16 Digit)</label>
                  <input
                    type="text"
                    placeholder="7371xxxxxxxxxxxx"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NUPTK (Jika ada)</label>
                  <input
                    type="text"
                    placeholder="NUPTK 16 digit"
                    value={formData.nuptk}
                    onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    required
                    placeholder="guru@smkit-ibnulqayyim.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pegawai</label>
                  <select
                    value={formData.statusPegawai}
                    onChange={(e) => setFormData({ ...formData, statusPegawai: e.target.value as StatusPegawai })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="GTY">Guru Tetap Yayasan (GTY)</option>
                    <option value="GTT">Guru Tidak Tetap / Percobaan (GTT)</option>
                    <option value="PTY">Pegawai Tetap Yayasan (PTY / Tendik)</option>
                    <option value="PTT">Pegawai Tidak Tetap (PTT)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Induk / Non-Induk</label>
                  <select
                    value={formData.statusInduk || 'Induk'}
                    onChange={(e) => setFormData({ ...formData, statusInduk: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  >
                    <option value="Induk">Guru / Staf Induk (SMK IT IQM)</option>
                    <option value="Non Induk">Guru Non-Induk (SMPIT / Luar - Murni Honor JP)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan Utama</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru Mapel Sejarah"
                    value={formData.jabatanUtama}
                    onChange={(e) => setFormData({ ...formData, jabatanUtama: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pendidikan & Jurusan S1</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.pendidikanTerakhir || 'S1'}
                      onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                      <option value="D3">D3</option>
                      <option value="SMA">SMA</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Jurusan S1"
                      value={formData.jurusan}
                      onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok Default (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.gajiPokokDefault}
                    onChange={(e) => setFormData({ ...formData, gajiPokokDefault: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif per JP (Rp/JP)</label>
                  <input
                    type="number"
                    value={formData.tarifPerJamMengajar}
                    onChange={(e) => setFormData({ ...formData, tarifPerJamMengajar: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  Simpan Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk & Personal Salary Adjustment Modal */}
      <BulkSalaryAdjustmentModal
        isOpen={bulkSalaryModalOpen}
        onClose={() => setBulkSalaryModalOpen(false)}
        pegawaiList={pegawaiList}
        onSaveSuccess={(updatedStaff) => {
          if (onBulkUpdateSalary) {
            onBulkUpdateSalary(updatedStaff);
          }
        }}
        onShowToast={(msg, type) => {
          if (onShowToast) {
            onShowToast(msg, type);
          }
        }}
      />
    </div>
  );
};
