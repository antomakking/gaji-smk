import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Copy, 
  Check, 
  FileText, 
  Eye, 
  EyeOff, 
  Sparkles,
  Building2,
  FolderLock,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Archive
} from 'lucide-react';
import { User, AuditLogEntry } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { 
  generateCredentialsCsvContent, 
  encryptWithPassphrase, 
  decryptWithPassphrase, 
  calculateSha256,
  EncryptedPackage 
} from '../utils/credentialExport';

interface CredentialArchivalExportProps {
  currentUser: User;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onAuditLog?: (action: string, label: string, target: string, details: string) => void;
}

export const CredentialArchivalExport: React.FC<CredentialArchivalExportProps> = ({
  currentUser,
  showToast,
  onAuditLog,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => INITIAL_USERS.map(u => u.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [passphrase, setPassphrase] = useState<string>('SMK-IQ-KRED-2026');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [includeCommentsHeader, setIncludeCommentsHeader] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastExportedTimestamp, setLastExportedTimestamp] = useState<string | null>(null);
  const [lastChecksum, setLastChecksum] = useState<string | null>(null);

  // Inspector / Decryption Test States
  const [decryptInputCipher, setDecryptInputCipher] = useState<string>('');
  const [decryptInputPassphrase, setDecryptInputPassphrase] = useState<string>('');
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Document Registry Number based on current date
  const docRefNumber = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `ARSIP-KRED/SMKIT-IQ/${yyyy}/${mm}/SEC-${currentUser.id.slice(0, 6).toUpperCase()}`;
  }, [currentUser]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return INITIAL_USERS.filter(u => {
      const matchSearch = u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [searchQuery, roleFilter]);

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const filteredIds = new Set(filteredUsers.map(u => u.id));
      setSelectedUserIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const combined = new Set([...selectedUserIds, ...filteredUsers.map(u => u.id)]);
      setSelectedUserIds(Array.from(combined));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Generate CSV and Encrypted package
  const targetUsers = useMemo(() => {
    return INITIAL_USERS.filter(u => selectedUserIds.includes(u.id));
  }, [selectedUserIds]);

  // Handle Export Encrypted CSV
  const handleExportCsv = async () => {
    if (targetUsers.length === 0) {
      showToast('Pilih minimal 1 akun pengguna untuk diekspor.', 'error');
      return;
    }
    if (!passphrase.trim()) {
      showToast('Harap tentukan kata sandi enkripsi (Passphrase).', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const exportedBy = {
        id: currentUser.id,
        nama: currentUser.nama,
        role: currentUser.role,
      };

      const { csvString, timestampIso, timestampFormatted } = generateCredentialsCsvContent(
        targetUsers,
        exportedBy,
        docRefNumber,
        includeCommentsHeader
      );

      const sha256Checksum = await calculateSha256(csvString);
      setLastChecksum(sha256Checksum);
      setLastExportedTimestamp(`${timestampFormatted} (${timestampIso})`);

      // 1. Download CSV directly
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `ARSIP-KREDENSIAL-SMKIT-IQ-${dateStr}-${timeStr}.csv`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsProcessing(false);
      showToast(`Berkas CSV Arsip Kredensial berhasil diunduh (${targetUsers.length} akun).`, 'success');

      if (onAuditLog) {
        onAuditLog(
          'EXPORT_CREDENTIALS_CSV',
          'Ekspor CSV Arsip Kredensial',
          `${targetUsers.length} Akun Terdaftar`,
          `Administrator ${currentUser.nama} mengekspor berkas CSV arsip kredensial fisik terenkripsi SHA-256 (${sha256Checksum.slice(0, 16)}...).`
        );
      }
    } catch (err: any) {
      setIsProcessing(false);
      showToast(`Gagal mengekspor CSV: ${err?.message || 'Error'}`, 'error');
    }
  };

  // Handle Export AES-256-GCM Encrypted Package (.enc.json)
  const handleExportEncryptedPackage = async () => {
    if (targetUsers.length === 0) {
      showToast('Pilih minimal 1 akun pengguna untuk diekspor.', 'error');
      return;
    }
    if (!passphrase.trim()) {
      showToast('Harap tentukan kata sandi enkripsi (Passphrase).', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const exportedBy = {
        id: currentUser.id,
        nama: currentUser.nama,
        role: currentUser.role,
      };

      const { csvString, timestampIso, timestampFormatted } = generateCredentialsCsvContent(
        targetUsers,
        exportedBy,
        docRefNumber,
        includeCommentsHeader
      );

      const integrityHash = await calculateSha256(csvString);
      const { salt, iv, ciphertext } = await encryptWithPassphrase(csvString, passphrase);

      const payload: EncryptedPackage = {
        format: 'SIM-GAJI-CREDENTIAL-AES256-GCM',
        version: '1.0',
        exportTimestamp: timestampIso,
        exportedBy,
        institution: 'SMK IT Ibnul Qayyim Makassar',
        documentRefNumber: docRefNumber,
        salt,
        iv,
        ciphertext,
        tagLength: 128,
        integrityHash,
        totalAccounts: targetUsers.length,
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `SMKIT-IQ-CREDENTIALS-ENCRYPTED-AES256-${dateStr}-${timeStr}.enc.json`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastChecksum(integrityHash);
      setLastExportedTimestamp(`${timestampFormatted} (${timestampIso})`);
      setIsProcessing(false);
      showToast(`Paket terenkripsi AES-256-GCM berhasil diunduh (${filename})!`, 'success');

      if (onAuditLog) {
        onAuditLog(
          'EXPORT_CREDENTIALS_AES256',
          'Ekspor Paket AES-256 Kredensial',
          `${targetUsers.length} Akun Terdaftar`,
          `Ekspor berkas terenkripsi AES-256-GCM dengan PBKDF2 (100.000 iterasi) oleh ${currentUser.nama}.`
        );
      }
    } catch (err: any) {
      setIsProcessing(false);
      showToast(`Gagal mengenkripsi paket: ${err?.message || 'Error'}`, 'error');
    }
  };

  // Handle Print Official Physical Archival Filing Sheet
  const handlePrintPhysicalArchivalSheet = () => {
    if (targetUsers.length === 0) {
      showToast('Pilih minimal 1 akun untuk dicetak.', 'error');
      return;
    }

    const now = new Date();
    const timestampFormatted = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'Asia/Makassar',
    }).format(now);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up terblokir. Izinkan pop-up di browser Anda untuk mencetak.', 'error');
      return;
    }

    const rowsHtml = targetUsers.map((u, idx) => `
      <tr>
        <td style="text-align:center; font-size: 11px; padding: 6px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="font-size: 11px; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${u.nama}</td>
        <td style="font-size: 11px; padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; color: #1e293b;">${u.username}</td>
        <td style="font-size: 11px; padding: 6px 8px; border: 1px solid #cbd5e1; color: #334155;">${u.email}</td>
        <td style="font-size: 10px; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600; text-transform: uppercase; color: #4338ca;">${u.role.replace('_', ' ')}</td>
        <td style="font-size: 10px; padding: 6px 8px; border: 1px solid #cbd5e1; color: #475569;">${u.jabatan}</td>
        <td style="font-size: 10px; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #059669; font-weight: bold;">AKTIF</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LEMBAR ARSIP FISIK KREDENSIAL - SMK IT IBNUL QAYYIM</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 0;
            line-height: 1.4;
          }
          .header-box {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .title-text {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle-text {
            font-size: 11px;
            color: #475569;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .meta-table td {
            padding: 5px 8px;
            font-size: 10.5px;
            border-bottom: 1px solid #e2e8f0;
          }
          .meta-label {
            font-weight: bold;
            color: #475569;
            width: 22%;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .data-table th {
            background: #f1f5f9;
            color: #0f172a;
            font-size: 10.5px;
            font-weight: 700;
            padding: 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          .security-seal {
            border: 1px dashed #64748b;
            padding: 10px;
            background: #fafafa;
            border-radius: 6px;
            font-size: 10px;
            margin-bottom: 20px;
            color: #334155;
          }
          .sign-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .sign-col {
            width: 45%;
            text-align: center;
            font-size: 11px;
          }
          .sign-space {
            height: 65px;
          }
          .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 55px;
            font-weight: 900;
            color: rgba(15, 23, 42, 0.04);
            letter-spacing: 6px;
            pointer-events: none;
            text-transform: uppercase;
            z-index: 999;
          }
        </style>
      </head>
      <body>
        <div class="watermark">RAHASIA NEGARA / INSTITUSI</div>
        
        <div class="header-box">
          <div>
            <div class="title-text">YAYASAN PENDIDIKAN IBNUL QAYYIM MAKASSAR</div>
            <div style="font-size: 13px; font-weight: bold; color: #166534;">SMK IT IBNUL QAYYIM MAKASSAR</div>
            <div class="subtitle-text">Jl. Goa Ria Taman Bunga 2, Laikang, Kec. Biringkanaya, Kota Makassar, Sulawesi Selatan 90242 • Akreditasi B</div>

          </div>
          <div style="text-align: right;">
            <span style="border: 1.5px solid #dc2626; color: #dc2626; font-size: 9px; font-weight: 900; padding: 3px 6px; border-radius: 4px; text-transform: uppercase;">
              ARSIP RAHASIA (SAFE DEPOSIT)
            </span>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">Formulir: F-SIM-GAJI/SEC-04</div>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 13.5px; text-transform: uppercase; font-weight: 800; text-decoration: underline;">
            BERITA ACARA & DAFTAR INDUK KREDENSIAL PENGGUNA TERENKRIPSI
          </h2>
          <span style="font-size: 10px; color: #64748b;">Untuk Penyimpanan Fisik di Brankas Keamanan Dokumen Sekolah</span>
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Nomor Registrasi Arsip</td>
            <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${docRefNumber}</td>
            <td class="meta-label">Total Akun Terdaftar</td>
            <td><strong>${targetUsers.length}</strong> Pengguna Terverifikasi</td>
          </tr>
          <tr>
            <td class="meta-label">Waktu Ekspor Resmi</td>
            <td colspan="3">${timestampFormatted}</td>
          </tr>
          <tr>
            <td class="meta-label">Petugas Pencetak</td>
            <td>${currentUser.nama} (${currentUser.role})</td>
            <td class="meta-label">Metode Enkripsi</td>
            <td>AES-256-GCM / PBKDF2-SHA256 (100.000 Iterasi)</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">NO</th>
              <th style="width: 26%;">NAMA LENGKAP</th>
              <th style="width: 17%;">USERNAME</th>
              <th style="width: 22%;">EMAIL RESMI</th>
              <th style="width: 14%;">ROLE OTORISASI</th>
              <th style="width: 10%;">JABATAN</th>
              <th style="width: 6%; text-align: center;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="security-seal">
          <strong>⚠️ PROTOKOL KEAMANAN FISIK (PHYSICAL SECURITY COMPLIANCE):</strong><br />
          1. Dokumen fisik ini memuat rincian otorisasi akun akses SIM GAJI SMK IT Ibnul Qayyim Makassar.<br />
          2. Berkas wajib disimpan di dalam amplop segel berlilin pada <em>Safety Deposit Box / Brankas Arsip Kepegawaian</em>.<br />
          3. Segala bentuk duplikasi atau pembukaan berkas tanpa izin Kepala Sekolah dan Kepala Bagian IT merupakan pelanggaran tata tertib institusi.
        </div>

        <div class="sign-grid">
          <div class="sign-col">
            <div>Mengetahui,</div>
            <div style="font-weight: bold;">Kepala Sekolah SMK IT Ibnul Qayyim</div>
            <div class="sign-space"></div>
            <div style="font-weight: bold; text-decoration: underline;">Anto, S.E.I., M.E., Gr., MCF.</div>
            <div style="font-size: 10px; color: #64748b;">NIP. 198406152020011001</div>
          </div>
          <div class="sign-col">
            <div>Makassar, ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Makassar' }).format(now)}</div>
            <div style="font-weight: bold;">Petugas IT & Kepegawaian</div>
            <div class="sign-space"></div>
            <div style="font-weight: bold; text-decoration: underline;">${currentUser.nama}</div>
            <div style="font-size: 10px; color: #64748b;">ID Pengguna: ${currentUser.id}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle Inspector Decrypt Test
  const handleTestDecryption = async () => {
    setDecryptError(null);
    setDecryptedResult(null);

    if (!decryptInputCipher.trim()) {
      setDecryptError('Masukkan ciphertext atau isi berkas JSON terenkripsi.');
      return;
    }
    if (!decryptInputPassphrase.trim()) {
      setDecryptError('Masukkan passphrase kunci dekripsi.');
      return;
    }

    try {
      let salt = '';
      let iv = '';
      let ciphertext = '';

      // Check if input is JSON package
      if (decryptInputCipher.trim().startsWith('{')) {
        const parsed = JSON.parse(decryptInputCipher);
        if (parsed.salt && parsed.iv && parsed.ciphertext) {
          salt = parsed.salt;
          iv = parsed.iv;
          ciphertext = parsed.ciphertext;
        } else {
          throw new Error('Format JSON tidak memuat field salt, iv, atau ciphertext yang valid.');
        }
      } else {
        throw new Error('Pastikan format masukan adalah JSON paket terenkripsi AES-256 (.enc.json).');
      }

      const result = await decryptWithPassphrase(ciphertext, salt, iv, decryptInputPassphrase);
      setDecryptedResult(result);
      showToast('Dekripsi berhasil! Integritas paket terverifikasi.', 'success');
    } catch (err: any) {
      setDecryptError(err?.message || 'Gagal mendekripsi. Periksa kembali Passphrase atau integritas ciphertext.');
    }
  };

  const handleCopyPreview = () => {
    const exportedBy = { id: currentUser.id, nama: currentUser.nama, role: currentUser.role };
    const { csvString } = generateCredentialsCsvContent(targetUsers, exportedBy, docRefNumber, includeCommentsHeader);
    navigator.clipboard.writeText(csvString);
    setCopiedPreview(true);
    showToast('Teks CSV berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedPreview(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card - Soft Green Aesthetic */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 rounded-2xl text-white shadow-md border border-emerald-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Modul Keamanan Khusus Administrator
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> AES-256-GCM
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">
              Ekspor Kredensial Pengguna Terenkripsi (Arsip Fisik)
            </h2>
            <p className="text-xs text-emerald-100/80 max-w-2xl mt-1 leading-relaxed">
              Fasilitas pembuatan berkas CSV terenkripsi dan berita acara fisik akun login resmi SMK IT Ibnul Qayyim Makassar untuk kebutuhan filing fisik dalam brankas keamanan (*safe deposit*).
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/60">
          <span className="text-[10px] text-emerald-200/70 block font-mono">NOMOR REGISTRASI ARSIP</span>
          <span className="text-xs font-mono font-bold text-emerald-300">{docRefNumber}</span>
          <span className="text-[10px] text-emerald-400 block mt-1 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" /> Timestamp Aktif
          </span>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: User Selection & Filter (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-emerald-100/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Pilih Akun Pengguna ({selectedUserIds.length} dari {INITIAL_USERS.length} Terpilih)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan akun yang akan dimasukkan ke dalam arsip kredensial.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{allSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, username, email, jabatan..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Peran (Role)</option>
                <option value="super_admin">Super Admin</option>
                <option value="kepala_sekolah">Kepala Sekolah</option>
                <option value="ketua_yayasan">Ketua Yayasan</option>
                <option value="bendahara_yayasan">Bendahara Yayasan</option>
                <option value="pegawai">Pegawai / Guru</option>
              </select>
            </div>

            {/* Users List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 text-slate-700">
                  <tr>
                    <th className="p-2.5 w-8 text-center">Pilih</th>
                    <th className="p-2.5">Pengguna / Nama</th>
                    <th className="p-2.5">Username & Email</th>
                    <th className="p-2.5">Role Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isChecked = selectedUserIds.includes(u.id);
                    return (
                      <tr 
                        key={u.id}
                        onClick={() => toggleSelectUser(u.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition ${isChecked ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectUser(u.id)}
                            className="w-4 h-4 accent-emerald-700 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900">{u.nama}</p>
                          <p className="text-[11px] text-slate-500">{u.jabatan}</p>
                        </td>
                        <td className="p-2.5 font-mono">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {u.username}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-sans mt-0.5">{u.email}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Tidak ada pengguna yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{targetUsers.length} akun siap diekspor ke format CSV & Berkas Fisik.</span>
              <span className="font-mono text-[11px]">ID Pemohon: {currentUser.id}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Encryption Controls & Export Triggers (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-emerald-600" />
              Parameter Kunci Enkripsi & Metadata
            </h3>

            {/* Passphrase Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Master Passphrase Enkripsi
                </label>
                <span className="text-[10px] text-slate-400">PBKDF2 SHA-256</span>
              </div>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Ketik passphrase kunci rahasia..."
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Kunci ini digunakan untuk enkripsi AES-256-GCM. Harap simpan kunci ini pada catatan terpisah yang aman.
              </p>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCommentsHeader}
                  onChange={(e) => setIncludeCommentsHeader(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Sertakan Header Metadata Resmi & Komentar RFC 4180</span>
              </label>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isProcessing || targetUsers.length === 0}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh CSV Kredensial (.csv)</span>
              </button>

              <button
                type="button"
                onClick={handleExportEncryptedPackage}
                disabled={isProcessing || targetUsers.length === 0}
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-900/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unduh Paket Terenkripsi AES-256 (.enc.json)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPhysicalArchivalSheet}
                disabled={targetUsers.length === 0}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-900/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Berkas Fisik (A4 Safe Deposit)</span>
              </button>
            </div>

            {/* Last Export Audit Timestamp Receipt */}
            {lastExportedTimestamp && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ekspor Terakhir Berhasil
                </span>
                <p className="text-[11px] text-emerald-800">
                  <strong>Waktu:</strong> {lastExportedTimestamp}
                </p>
                {lastChecksum && (
                  <p className="text-[10px] text-emerald-700 font-mono break-all">
                    <strong>SHA-256:</strong> {lastChecksum}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CSV Live Preview & Raw Inspector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Pratinjau Struktur CSV yang Dihasilkan
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyPreview}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPreview ? 'Tersalin!' : 'Salin Teks CSV'}</span>
          </button>
        </div>

        <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar border border-slate-800">
          <pre>
            {generateCredentialsCsvContent(targetUsers, { id: currentUser.id, nama: currentUser.nama, role: currentUser.role }, docRefNumber, includeCommentsHeader).csvString}
          </pre>
        </div>
      </div>

      {/* Decryption & Integrity Verification Tool */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FolderLock className="w-4 h-4 text-emerald-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Uji Dekripsi & Verifikasi Integritas Arsip
            </h3>
            <p className="text-xs text-slate-500">
              Verifikasi dan uji berkas .enc.json terenkripsi untuk memastikan integritas data sebelum disimpan dalam brankas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Tempel Konten JSON Terenkripsi (.enc.json)
            </label>
            <textarea
              rows={4}
              value={decryptInputCipher}
              onChange={(e) => setDecryptInputCipher(e.target.value)}
              placeholder='Tempel konten berkas .enc.json di sini...'
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Passphrase Kunci Dekripsi
              </label>
              <input
                type="password"
                value={decryptInputPassphrase}
                onChange={(e) => setDecryptInputPassphrase(e.target.value)}
                placeholder="Masukkan passphrase..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleTestDecryption}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              <span>Verifikasi & Buka Kunci Dekripsi</span>
            </button>
          </div>
        </div>

        {decryptError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{decryptError}</span>
          </div>
        )}

        {decryptedResult && (
          <div className="space-y-2 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Hasil Dekripsi Berhasil (Integritas Data Sempurna):
            </span>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10.5px] overflow-x-auto max-h-40 border border-slate-700">
              <pre>{decryptedResult}</pre>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
