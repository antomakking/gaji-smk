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
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sim_gaji_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sim_gaji_sidebar_collapsed', String(next));
      return next;
    });
  };

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
        return { label: 'Super Admin / HR', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'kepala_sekolah':
        return { label: 'Kepala Sekolah (Approver 1)', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
      case 'ketua_yayasan':
        return { label: 'Ketua Yayasan (Approver 2)', badgeColor: 'bg-emerald-600/20 text-emerald-200 border-emerald-500/30' };
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

      {/* Sidebar Container: flush on left, smooth width transition between Full (w-72) & Compact Icon-Only (w-20) */}
      <aside 
        id="main-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#07241e] text-emerald-100 flex flex-col shrink-0 border-r border-[#0e3a30] transition-all duration-300 ease-in-out select-none shadow-xl
          md:static md:translate-x-0
          ${isCollapsed ? 'md:w-20' : 'md:w-72'}
          ${mobileMenuOpen ? 'w-72 translate-x-0 shadow-2xl' : 'w-72 -translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#0e3a30] flex items-center justify-between bg-[#051c17] shrink-0">
          {!isCollapsed || mobileMenuOpen ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-950/60 border border-emerald-400/40 shrink-0">
                IQ
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm tracking-wide">SIM GAJI</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-sm border border-emerald-500/30">
                    v2.4
                  </span>
                </div>
                <p className="text-emerald-300/70 text-xs truncate">SMK IT Ibnul Qayyim</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={toggleCollapse}
                className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-950/60 border border-emerald-400/40 shrink-0 hover:scale-105 transition cursor-pointer group"
                title="Buka Sidebar (Mode Full)"
              >
                <span className="group-hover:hidden">IQ</span>
                <PanelLeftOpen className="w-5 h-5 hidden group-hover:block text-white" />
              </button>
            </div>
          )}

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCollapse}
                className="hidden md:flex text-emerald-300/70 hover:text-white p-1.5 rounded-lg hover:bg-[#0c362c] transition cursor-pointer"
                title="Ciutkan Sidebar (Mode Icon Saja)"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-emerald-300/70 hover:text-white md:hidden p-1.5 rounded-lg hover:bg-[#0c362c] transition cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* School Info Sub-badge */}
        {!isCollapsed || mobileMenuOpen ? (
          <div className="px-4 py-2.5 bg-[#041713] border-b border-[#0e3a30] flex items-center gap-2 text-xs text-emerald-300/80 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-[11px]">Makassar, Sulawesi Selatan</span>
          </div>
        ) : (
          <div className="py-2.5 bg-[#041713] border-b border-[#0e3a30] flex items-center justify-center text-emerald-300/80 shrink-0" title="Makassar, Sulawesi Selatan">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto custom-scrollbar-dark">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed || mobileMenuOpen ? (
                <p className="px-3 text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-2">
                  {sec.title}
                </p>
              ) : (
                <div className="my-2 border-t border-[#0e3a30]" title={sec.title} />
              )}

              {sec.items.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                if (!isCollapsed || mobileMenuOpen) {
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
                          ? 'bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-950/60 border border-emerald-500/40'
                          : 'text-emerald-100/75 hover:bg-[#0d3b31] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-300/70'}`} />
                        <span className="truncate">{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                }

                // Collapsed Icon-Only Mode Item Button
                return (
                  <div className="relative group flex justify-center my-1" key={tab.id}>
                    <button
                      id={`sidebar-tab-${tab.id}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-950/60 border border-emerald-500/40'
                          : 'text-emerald-100/75 hover:bg-[#0d3b31] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-300/70'}`} />
                      {tab.badge && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#07241e]" />
                      )}
                    </button>
                    
                    {/* Hover Floating Tooltip */}
                    <div className="fixed left-20 ml-2 px-3 py-1.5 bg-[#051c17] text-white text-xs font-semibold rounded-lg shadow-2xl border border-emerald-500/40 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-60 flex items-center gap-2">
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Current Active Role Card & Switcher in Sidebar Footer */}
        <div className="p-3 bg-[#051c17] border-t border-[#0e3a30] shrink-0">
          {!isCollapsed || mobileMenuOpen ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full p-2.5 rounded-xl bg-[#0a2f26] hover:bg-[#0e3d32] border border-[#14483c] transition flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-200">
                        {currentUser.nama}
                      </p>
                      <p className="text-[10px] text-emerald-300/70 truncate">
                        {roleInfo.label.split('(')[0]}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Quick Multi-Role Switcher Menu */}
                {roleDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#092b23] border border-[#14483c] rounded-xl shadow-2xl py-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar-dark">
                    <div className="px-3 py-1.5 border-b border-[#0e3a30] text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider">
                      Simulasi Peran Pengguna
                    </div>
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#0e3d32] transition cursor-pointer ${
                          user.id === currentUser.id ? 'bg-emerald-600/30 text-emerald-200 font-semibold' : 'text-emerald-100/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.nama}</p>
                          <p className="text-[10px] text-emerald-300/60 truncate">{user.jabatan}</p>
                        </div>
                        {user.id === currentUser.id && (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />
                        )}
                      </button>
                    ))}
                    {onLogout && (
                      <div className="pt-1 mt-1 border-t border-[#0e3a30]">
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

              <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] text-emerald-300/70">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                  AES-256 Validated
                </span>
                {onLogout ? (
                  <button
                    onClick={onLogout}
                    className="text-emerald-300/70 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                    title="Keluar dari akun"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <span>Tahun Ajaran 2026/2027</span>
                )}
              </div>
            </>
          ) : (
            /* Collapsed Icon-Only Footer */
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-10 h-10 rounded-xl bg-[#0a2f26] hover:bg-[#0e3d32] border border-[#14483c] transition flex items-center justify-center cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                    {currentUser.nama.slice(0, 2).toUpperCase()}
                  </div>
                </button>

                {/* Floating User Tooltip */}
                <div className="fixed left-20 bottom-12 ml-2 px-3 py-2 bg-[#051c17] text-white text-xs font-semibold rounded-lg shadow-2xl border border-emerald-500/40 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-60">
                  <p className="font-bold text-emerald-200">{currentUser.nama}</p>
                  <p className="text-[10px] text-emerald-300/70">{roleInfo.label}</p>
                </div>

                {/* Role Switcher Menu in collapsed mode */}
                {roleDropdownOpen && (
                  <div className="fixed left-20 bottom-14 ml-2 w-64 bg-[#092b23] border border-[#14483c] rounded-xl shadow-2xl py-1.5 z-60 max-h-60 overflow-y-auto custom-scrollbar-dark">
                    <div className="px-3 py-1.5 border-b border-[#0e3a30] text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider">
                      Simulasi Peran Pengguna
                    </div>
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#0e3d32] transition cursor-pointer ${
                          user.id === currentUser.id ? 'bg-emerald-600/30 text-emerald-200 font-semibold' : 'text-emerald-100/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.nama}</p>
                          <p className="text-[10px] text-emerald-300/60 truncate">{user.jabatan}</p>
                        </div>
                        {user.id === currentUser.id && (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {onLogout && (
                <div className="relative group">
                  <button
                    onClick={onLogout}
                    className="p-2 text-emerald-300/70 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title="Logout (Keluar dari Akun)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  <div className="fixed left-20 bottom-4 ml-2 px-2.5 py-1 bg-[#051c17] text-rose-300 text-xs font-semibold rounded shadow-2xl border border-rose-500/30 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-60">
                    Logout
                  </div>
                </div>
              )}
            </div>
          )}
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
    <header className="h-16 bg-white border-b border-emerald-100/90 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
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
          <div className="flex items-center gap-1.5 text-xs bg-emerald-50/80 text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200/80 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Periode: <strong className="text-emerald-950 font-semibold">Agustus 2026</strong></span>
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
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
              {currentUser.nama.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                {currentUser.nama}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold truncate capitalize">
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
                      user.id === currentUser.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">
                      {user.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.nama}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.jabatan}</p>
                    </div>
                    {user.id === currentUser.id && (
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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

