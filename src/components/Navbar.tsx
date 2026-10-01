import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  Home, 
  Users, 
  CalendarCheck, 
  CalendarDays,
  Banknote, 
  Mail, 
  Database,
  Menu,
  X,
  UserCheck,
  Building2,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  HardDrive,
  LogOut
} from 'lucide-react';
import { User, UserRole } from '../types';
import { PeriodSelector } from './PeriodSelector';
import { useSalaryPrivacy } from '../context/SalaryPrivacyContext';

interface SidebarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onLogout?: () => void;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  pendingApprovalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onSelectUser,
  onLogout,
  allUsers,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  pendingApprovalCount = 0,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navSections = [
    {
      title: 'MENU UTAMA',
      items: [
        { id: 'dashboard', label: 'Beranda Dashboard', icon: Home },
        { 
          id: 'payroll', 
          label: 'Kelola Penggajian', 
          icon: Banknote,
          badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} Draft` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        { id: 'attendance', label: 'Rekap Presensi & JP', icon: CalendarCheck },
        { id: 'schedule', label: 'Pengaturan Jadwal Pelajaran', icon: CalendarDays },
        { id: 'employees', label: 'Data Guru & Staf', icon: Users },
      ]
    },
    {
      title: 'LAYANAN & SISTEM',
      items: [
        { id: 'settings', label: 'Cadangan & Pemulihan Data', icon: HardDrive },
        { id: 'emails', label: 'Notifikasi Email Slip', icon: Mail },
        { id: 'architecture', label: 'Skema SQL & Arsitektur', icon: Database },
      ]
    }
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin / HR', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'kepala_sekolah':
        return { label: 'Kepala Sekolah (Approver 1)', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'ketua_yayasan':
        return { label: 'Ketua Yayasan (Approver 2)', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'bendahara_yayasan':
        return { label: 'Bendahara (Transfer)', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'pegawai':
        return { label: 'Guru / Tenaga Pendidik', badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container: flush on left, seamless full-height */}
      <aside 
        id="main-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out select-none
          md:static md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-600/30 border border-indigo-400/30 shrink-0">
              IQ
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-sm tracking-wide">SIM GAJI</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded-sm border border-emerald-500/30">
                  v2.4
                </span>
              </div>
              <p className="text-slate-400 text-xs truncate">SMK IT Ibnul Qayyim</p>
            </div>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white md:hidden p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Info Sub-badge */}
        <div className="px-4 py-2.5 bg-slate-850/60 border-b border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate text-[11px]">Makassar, Sulawesi Selatan</span>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 pl-3 pr-2 py-4 space-y-5 overflow-y-auto custom-scrollbar-dark">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {sec.title}
              </p>
              {sec.items.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`sidebar-tab-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/25'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Current Active Role Card & Switcher in Sidebar Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80">
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.nama.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-200">
                    {currentUser.nama}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {roleInfo.label.split('(')[0]}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Multi-Role Switcher Menu */}
            {roleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar-dark">
                <div className="px-3 py-1.5 border-b border-slate-700/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Simulasi Peran Pengguna
                </div>
                {allUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-700/60 transition cursor-pointer ${
                      user.id === currentUser.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.nama}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.jabatan}</p>
                    </div>
                    {user.id === currentUser.id && (
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                ))}
                {onLogout && (
                  <div className="pt-1 mt-1 border-t border-slate-700/80">
                    <button
                      id="sidebar-logout-btn"
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Keluar dari Akun (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              AES-256 Validated
            </span>
            {onLogout ? (
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            ) : (
              <span>Tahun Ajaran 2026/2027</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

interface HeaderProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onLogout?: () => void;
  allUsers: User[];
  activeTab: string;
  setMobileMenuOpen: (open: boolean) => void;
  selectedBulan?: number;
  selectedTahun?: number;
  onSelectPeriod?: (bulan: number, tahun: number) => void;
  availablePeriods?: { bulan: number; tahun: number; count: number; status?: string }[];
}

export const TopHeader: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  onLogout,
  allUsers,
  activeTab,
  setMobileMenuOpen,
  selectedBulan = (new Date().getMonth() + 1),
  selectedTahun = (new Date().getFullYear()),
  onSelectPeriod,
  availablePeriods = [],
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isSalaryHidden, toggleSalaryPrivacy } = useSalaryPrivacy();

  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'dashboard': 
        return {
          title: 'Beranda Dashboard Penggajian',
          subtitle: 'Statistik eksekutif & progress approval gaji guru dan tendik'
        };
      case 'payroll': 
        return {
          title: 'Kelola Penggajian & Otomasi Hitung',
          subtitle: 'Kalkulasi komponen penerimaan, potongan presensi, & eksekusi transfer'
        };
      case 'attendance': 
        return {
          title: 'Rekap Presensi, Jam Tatap Muka & Lembur',
          subtitle: 'Integrasi log biometrik, jam mengajar riil, cuti/izin, serta klaim lembur'
        };
      case 'schedule': 
        return {
          title: 'Pengaturan Jadwal Pelajaran (Semester Gasal 2026/2027)',
          subtitle: 'Matriks jadwal mengajar, alokasi kelas, pembagian jam tatap muka guru SMK IT Ibnul Qayyim'
        };
      case 'employees': 
        return {
          title: 'Data Master Guru & Tenaga Kependidikan',
          subtitle: 'Manajemen skema gaji pokok, tunjangan jabatan, dan tarif mengajar vokasi'
        };
      case 'settings': 
        return {
          title: 'Pengaturan Cadangan Data & Pemulihan Sistem (JSON)',
          subtitle: 'Ekspor berkas cadangan JSON, impor pemulihan sistem, dan manajemen snapshot database'
        };
      case 'emails': 
        return {
          title: 'Pusat Notifikasi & Penerbitan Slip PDF',
          subtitle: 'Log pengiriman slip gaji resmi berenkripsi via SMTP ke email pegawai'
        };
      case 'architecture': 
        return {
          title: 'Arsitektur Teknis, DDL Database SQL & REST API',
          subtitle: 'Dokumentasi skema PostgreSQL/MySQL, Entity Relations & implementasi backend'
        };
      default: 
        return {
          title: 'SIM GAJI SMK IT Ibnul Qayyim Makassar',
          subtitle: 'Sistem Informasi Manajemen Penggajian Terpadu'
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate leading-tight">
            {title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Interactive Dynamic Period Selector Dropdown */}
        {onSelectPeriod ? (
          <PeriodSelector
            selectedBulan={selectedBulan}
            selectedTahun={selectedTahun}
            onSelectPeriod={onSelectPeriod}
            availablePeriods={availablePeriods}
          />
        ) : (
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Periode: <strong className="text-slate-900 font-semibold">Agustus 2026</strong></span>
          </div>
        )}

        {/* Tombol Privasi Gaji (Toggle Hide/Show Salary) */}
        <button
          id="salary-privacy-toggle-btn"
          type="button"
          onClick={toggleSalaryPrivacy}
          title={
            isSalaryHidden
              ? "Mode Privasi Aktif (Nominal Gaji Disembunyikan *****). Klik untuk menampilkan angka."
              : "Mode Privasi Nonaktif (Nominal Gaji Terbuka). Klik untuk menyembunyikan angka."
          }
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-2xs select-none ${
            isSalaryHidden
              ? 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-300 ring-1 ring-amber-400/20'
              : 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/20'
          }`}
          aria-label="Toggle Privasi Gaji"
        >
          {isSalaryHidden ? (
            <>
              <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden md:inline text-amber-800">Privasi:</span>
              <span className="font-mono tracking-widest font-bold text-amber-950 bg-amber-200/80 px-1.5 py-0.5 rounded text-[11px]">
                *****
              </span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden md:inline text-emerald-800">Privasi:</span>
              <span className="font-semibold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded text-[11px]">
                Terbuka
              </span>
            </>
          )}
        </button>

        {/* Security & SMTP status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200/80">
          <Mail className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">SMTP</span>
          <span>Aktif</span>
        </div>

        {/* User Role Quick Menu */}
        <div className="relative">
          <button
            id="top-role-selector-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-50 border border-slate-200 transition text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 shrink-0">
              {currentUser.nama.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                {currentUser.nama}
              </div>
              <div className="text-[10px] text-indigo-600 font-medium truncate capitalize">
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ganti Akun Pengguna
                </p>
                <p className="text-xs text-slate-500">
                  Uji alur persetujuan Kepala Sekolah & Yayasan:
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {allUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition cursor-pointer ${
                      user.id === currentUser.id ? 'bg-indigo-50/80 text-indigo-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      {user.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.nama}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.jabatan}</p>
                    </div>
                    {user.id === currentUser.id && (
                      <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              {onLogout && (
                <div className="pt-1.5 mt-1 border-t border-slate-100 px-2">
                  <button
                    id="topheader-logout-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Keluar dari SIM GAJI (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const Navbar: React.FC<{
  currentUser: User;
  onSelectUser: (user: User) => void;
  onLogout?: () => void;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedBulan?: number;
  selectedTahun?: number;
  onSelectPeriod?: (bulan: number, tahun: number) => void;
  availablePeriods?: { bulan: number; tahun: number; count: number; status?: string }[];
}> = (props) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <Sidebar
        {...props}
        mobileMenuOpen={mobileOpen}
        setMobileMenuOpen={setMobileOpen}
      />
      <TopHeader
        {...props}
        setMobileMenuOpen={setMobileOpen}
      />
    </>
  );
};

