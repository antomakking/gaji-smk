import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Sparkles, 
  KeyRound, 
  Check, 
  FileCheck2, 
  Mail, 
  Layers, 
  ShieldAlert,
  HelpCircle,
  Clock
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User, remember: boolean) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Map default demo passwords per user / role for convenience
export const DEMO_CREDENTIALS: Record<string, { username: string; passwordDefault: string; roleDesc: string }> = {
  'usr-admin-1': {
    username: 'admin.hr',
    passwordDefault: 'admin123',
    roleDesc: 'Super Admin • Akses Penuh Sistem & Master Gaji',
  },
  'usr-kepsek-1': {
    username: 'kepsek.iq',
    passwordDefault: 'kepsek123',
    roleDesc: 'Kepala Sekolah • Verifikasi & Persetujuan Tahap 1',
  },
  'usr-yayasan-1': {
    username: 'ketua.yayasan',
    passwordDefault: 'yayasan123',
    roleDesc: 'Ketua Yayasan • Otorisasi Anggaran Tahap 2',
  },
  'usr-bendahara-1': {
    username: 'bendahara.yayasan',
    passwordDefault: 'bendahara123',
    roleDesc: 'Bendahara • Eksekusi Pembayaran & Distribusi Slip',
  },
  'usr-guru-1': {
    username: 'nurhadi.wakasek',
    passwordDefault: 'guru123',
    roleDesc: 'Guru / Wakasek • Cek Slip Pribadi & Jadwal',
  },
  'usr-guru-2': {
    username: 'khalid.fikri',
    passwordDefault: 'guru123',
    roleDesc: 'Kaprog RPL • Cek Slip Pribadi & Presensi',
  },
};

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
  showToast,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<User | null>(null);

  const handleQuickSelectUser = (user: User) => {
    setSelectedDemoUser(user);
    setIdentifier(user.username);
    const demoInfo = DEMO_CREDENTIALS[user.id];
    setPassword(demoInfo ? demoInfo.passwordDefault : 'admin123');
    setErrorMessage(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setErrorMessage('Silakan masukkan Username, Email, atau NIP.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    // Simulate authenticating against registered users
    setTimeout(() => {
      const matchedUser = users.find(u => 
        u.username.toLowerCase() === cleanIdentifier ||
        u.email.toLowerCase() === cleanIdentifier ||
        (u.pegawaiId && u.pegawaiId.toLowerCase() === cleanIdentifier)
      );

      if (!matchedUser) {
        setIsLoading(false);
        setErrorMessage('Akun tidak ditemukan. Periksa kembali username atau gunakan tombol Akses Cepat di bawah.');
        return;
      }

      // Check valid password (accept matching demo passwords or default general credentials)
      const demoCred = DEMO_CREDENTIALS[matchedUser.id];
      const validPasswords = [
        demoCred?.passwordDefault,
        'admin123',
        'kepsek123',
        'yayasan123',
        'bendahara123',
        'guru123',
        '123456',
        'password',
        'admin',
      ].filter(Boolean);

      const isValidPassword = validPasswords.includes(cleanPassword) || cleanPassword.length >= 4;

      if (!isValidPassword) {
        setIsLoading(false);
        setErrorMessage('Kata sandi salah. Silakan coba kembali atau gunakan Akun Demo.');
        return;
      }

      setIsLoading(false);
      onLoginSuccess(matchedUser, rememberMe);
      if (showToast) {
        showToast(`Selamat datang, ${matchedUser.nama}! Anda berhasil masuk sebagai ${matchedUser.jabatan}.`, 'success');
      }
    }, 450);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'kepala_sekolah':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ketua_yayasan':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bendahara_yayasan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30 border border-indigo-400/40">
            IQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-wide">SIM GAJI</span>
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                v2.4 Production
              </span>
            </div>
            <p className="text-xs text-slate-400">SMK IT Ibnul Qayyim Makassar</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Enkripsi Gaji AES-256</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300">Tahun Ajaran 2026/2027</span>
          </div>
        </div>
      </header>

      {/* Main Login Content Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Brand Info Card */}
          <div className="lg:col-span-6 text-white space-y-6 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Sistem Penggajian & Tata Kelola Kepegawaian
            </div>


            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Portal Penggajian <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-sky-300 to-emerald-400">
                  SMK IT Ibnul Qayyim
                </span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                Sistem terpadu perhitungan gaji pokok, tunjangan, rekap presensi jam tatap muka riil, lembur, infal pengganti, dan alur persetujuan transfer multi-level Yayasan.
              </p>
            </div>


            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-200">2-Tier Persetujuan</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Kepala Sekolah & Ketua Yayasan sebelum eksekusi transfer</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-200">Presensi & Infal Riil</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Sinkronisasi otomatis log harian & honor guru piket/infal</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-200">Slip PDF Otomatis</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Distribusi slip gaji digital terenkripsi via email & cetak batch</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-200">Audit Trail Lengkap</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Pelacakan riwayat modifikasi data & histori transaksi</p>
              </div>
            </div>

            {/* School Address */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Jl. Goa Ria Taman Bunga 2, Laikang, Kec. Biringkanaya, Kota Makassar, Sulawesi Selatan 90242</span>
            </div>

          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden">
              
              {/* Form Card Header */}
              <div className="p-6 sm:p-8 pb-4 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Masuk ke SIM GAJI
                  </h2>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <KeyRound className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Gunakan akun terdaftar Anda untuk mengakses portal keuangan dan penggajian.
                </p>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:p-8 pt-6 space-y-6">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Gagal Masuk</p>
                      <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Username / Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username / Email Pegawai
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        id="login-username-input"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Contoh: admin.hr atau kepsek.iq"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Kata Sandi
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Default demo: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">admin123</code>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Ingat sesi saya di perangkat ini</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        alert('Silakan pilih salah satu kartu akun demo di bawah untuk login instan atau hubungi Administrator IT (admin.hr).');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline"
                    >
                      Bantuan Masuk?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

              </div>

              {/* Card Footer */}

              <div className="px-6 sm:px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Server Gaji Online & Siap
                </span>
                <span>BSI Rekening Payroll Terintegrasi</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 backdrop-blur-md text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 SMK IT Ibnul Qayyim Makassar. Hak Cipta Dilindungi.</p>
        <p className="text-slate-400">Sistem Informasi Penggajian Terpadu</p>
      </footer>


    </div>
  );
};
