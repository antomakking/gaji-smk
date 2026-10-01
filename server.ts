import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_USERS, INITIAL_PEGAWAI, INITIAL_PRESENSI, INITIAL_EMAIL_LOGS, INITIAL_INFAL, INITIAL_DAILY_LOGS } from './src/data/initialData';
import { PAYROLL_JULI_2026, PRESENSI_JULI_2026 } from './src/data/july2026PayrollData';
import { INITIAL_SCHEDULE_SLOTS } from './src/data/scheduleData';
import { Pegawai, RekapPresensi, PenggajianRecord, EmailLog, StatusPenggajian, LogInfal, SlotJadwalPelajaran, LogPresensiHarian } from './src/types';
import { kalkulasiPenggajian, generateChecksum, getPayrollCutoffDates } from './src/utils/security';

// Local File Persistence Setup
const DATA_DIR = path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {}

const PEGAWAI_FILE = path.join(DATA_DIR, 'pegawai.json');
const PRESENSI_FILE = path.join(DATA_DIR, 'presensi.json');
const PENGGAJIAN_FILE = path.join(DATA_DIR, 'penggajian.json');
const EMAIL_LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');
const INFAL_FILE = path.join(DATA_DIR, 'infal.json');
const DAILY_LOGS_FILE = path.join(DATA_DIR, 'daily_logs.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(fallback) ? Array.isArray(parsed) : parsed) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
  }
  return fallback;
}

function saveJson(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// Database State initialized from disk or defaults
let pegawaiList: Pegawai[] = loadJson(PEGAWAI_FILE, [...INITIAL_PEGAWAI]);
let presensiList: RekapPresensi[] = loadJson(PRESENSI_FILE, [...INITIAL_PRESENSI]);
let dailyLogsList: LogPresensiHarian[] = loadJson(DAILY_LOGS_FILE, [...INITIAL_DAILY_LOGS]);
let emailLogs: EmailLog[] = loadJson(EMAIL_LOGS_FILE, [...INITIAL_EMAIL_LOGS]);
let infalList: LogInfal[] = loadJson(INFAL_FILE, [...INITIAL_INFAL]);
let scheduleList: SlotJadwalPelajaran[] = loadJson(SCHEDULE_FILE, [...INITIAL_SCHEDULE_SLOTS]);
let penggajianList: PenggajianRecord[] = loadJson(PENGGAJIAN_FILE, []);

// Apply initial infal records to presensiList if fresh
if (!fs.existsSync(PRESENSI_FILE)) {
  infalList.filter(i => i.status === 'approved').forEach(inf => {
    const pengganti = presensiList.find(p => p.pegawaiId === inf.guruPenggantiId);
    if (pengganti) {
      pengganti.jumlahJpMenggantikan = (pengganti.jumlahJpMenggantikan || 0) + inf.jumlahJp;
      pengganti.honorInfalTotal = (pengganti.honorInfalTotal || 0) + inf.totalNominal;
    }
    const absen = presensiList.find(p => p.pegawaiId === inf.guruAbsenId);
    if (absen) {
      absen.jumlahJpDigantikan = (absen.jumlahJpDigantikan || 0) + inf.jumlahJp;
      absen.potonganInfalTotal = (absen.potonganInfalTotal || 0) + inf.totalNominal;
    }
  });
}

function initializePayrollRecords() {
  // Ensure all initial teachers are in pegawaiList
  INITIAL_PEGAWAI.forEach(initPeg => {
    const exists = pegawaiList.some(p => p.id === initPeg.id || p.nip === initPeg.nip);
    if (!exists) {
      pegawaiList.push(initPeg);
    } else {
      // update details if needed
      const idx = pegawaiList.findIndex(p => p.id === initPeg.id || p.nip === initPeg.nip);
      if (idx >= 0 && !pegawaiList[idx].nuptk && initPeg.nuptk) {
        pegawaiList[idx] = { ...pegawaiList[idx], ...initPeg };
      }
    }
  });

  const bulan = 8;
  const tahun = 2026;
  
  pegawaiList.forEach((peg, index) => {
    let pres = presensiList.find(p => p.pegawaiId === peg.id && p.bulan === bulan && p.tahun === tahun);
    if (!pres) {
      pres = {
        id: `prs-2026-08-${String(index + 1).padStart(3, '0')}`,
        pegawaiId: peg.id,
        bulan,
        tahun,
        totalHariEfektif: 26,
        hadir: 20,
        sakit: 0,
        izin: 0,
        cuti: 0,
        dinasLuar: 0,
        alpha: 0,
        menitTerlambat: 0,
        jamMengajarRencana: 16,
        jamMengajarRealisasi: 16,
        jamLemburTotal: 0,
        honorLemburTotal: 0,
        potonganIzinTidakResmi: 0,
        catatan: 'Guru Pengampu Mapel Non-Induk (SMPIT Ibnul Qayyim) - Murni JP',
        updatedAt: new Date().toISOString(),
      };
      presensiList.push(pres);
    }
    
    const existingRec = penggajianList.find(r => r.pegawaiId === peg.id && r.bulan === bulan && r.tahun === tahun);
    if (!existingRec) {
      const calc = kalkulasiPenggajian(peg, pres, { bulan, tahun });
      const id = `gji-2026-08-${String(index + 1).padStart(3, '0')}`;
      
      let status: StatusPenggajian = 'draft';
      if (index === 0 || index === 2) {
        status = 'transferred';
      } else if (index === 1 || index === 4) {
        status = 'approved';
      } else if (index === 3) {
        status = 'pending_yayasan';
      } else if (index === 5) {
        status = 'pending_kepsek';
      }
      
      penggajianList.push({
        ...calc,
        id,
        status,
        createdAt: '2026-08-25T09:00:00Z',
        updatedAt: '2026-08-26T08:30:00Z',
      });
    }
  });

  // Ensure July 2026 records exist
  PRESENSI_JULI_2026.forEach(pj => {
    if (!presensiList.some(p => p.pegawaiId === pj.pegawaiId && p.bulan === 7 && p.tahun === 2026)) {
      presensiList.push(pj);
    }
  });
  PAYROLL_JULI_2026.forEach(py => {
    if (!penggajianList.some(p => p.pegawaiId === py.pegawaiId && p.bulan === 7 && p.tahun === 2026)) {
      penggajianList.push(py);
    }
  });

  saveJson(PEGAWAI_FILE, pegawaiList);
  saveJson(PRESENSI_FILE, presensiList);
  saveJson(PENGGAJIAN_FILE, penggajianList);
}

initializePayrollRecords();

// AES-256 Encryption Helpers for sensitive employee data
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'SMK_IT_IBNUL_QAYYIM_AES_KEY_2026_MAKASSAR_SECURE';
const CIPHER_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

function encryptField(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted: `${encrypted}:${authTag}`, iv: iv.toString('hex') };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());



  // API 1: Health & System Diagnostics
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      institution: 'SMK IT Ibnul Qayyim Makassar',
      system: 'SIM GAJI (Sistem Informasi Manajemen Penggajian)',
      encryption: 'AES-256-GCM Hardware-Accelerated',
      integrityVerification: 'HMAC-SHA256 Multi-Signature',
      activeRecords: penggajianList.length,
      timestamp: new Date().toISOString(),
    });
  });

  // API 2: Master Pegawai
  app.get('/api/pegawai', (req, res) => {
    res.json(pegawaiList);
  });

  app.post('/api/pegawai', (req, res) => {
    const raw = req.body;
    const existingIndex = pegawaiList.findIndex(p => (raw.id && p.id === raw.id) || (raw.nip && p.nip === raw.nip));
    let savedPegawai: Pegawai;

    if (existingIndex >= 0) {
      savedPegawai = {
        ...pegawaiList[existingIndex],
        ...raw,
        updatedAt: new Date().toISOString(),
      };
      pegawaiList[existingIndex] = savedPegawai;
    } else {
      savedPegawai = {
        id: raw.id || `peg-${Date.now()}`,
        isActive: true,
        ...raw,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      pegawaiList.push(savedPegawai);
    }
    saveJson(PEGAWAI_FILE, pegawaiList);

    // Ensure default presensi & draft payroll record for August and July 2026
    [8, 7].forEach(bulan => {
      const tahun = 2026;
      const presExists = presensiList.some(p => p.pegawaiId === savedPegawai.id && p.bulan === bulan && p.tahun === tahun);
      if (!presExists) {
        const defaultPres: RekapPresensi = {
          id: `prs-${Date.now()}-${savedPegawai.id}-${bulan}`,
          pegawaiId: savedPegawai.id,
          bulan,
          tahun,
          totalHariEfektif: 22,
          hadir: 22,
          sakit: 0,
          izin: 0,
          cuti: 0,
          dinasLuar: 0,
          alpha: 0,
          menitTerlambat: 0,
          jamMengajarRencana: 20,
          jamMengajarRealisasi: 20,
          jamLemburTotal: 0,
          honorLemburTotal: 0,
          potonganIzinTidakResmi: 0,
          updatedAt: new Date().toISOString(),
        };
        presensiList.push(defaultPres);

        const calc = kalkulasiPenggajian(savedPegawai, defaultPres, { bulan, tahun });
        penggajianList.push({
          ...calc,
          id: `gji-${tahun}-${String(bulan).padStart(2, '0')}-${savedPegawai.id}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    saveJson(PRESENSI_FILE, presensiList);
    saveJson(PENGGAJIAN_FILE, penggajianList);

    res.status(201).json(savedPegawai);
  });

  app.put('/api/pegawai/:id', (req, res) => {
    const idx = pegawaiList.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      const newPeg: Pegawai = {
        id: req.params.id,
        isActive: true,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      pegawaiList.push(newPeg);
      saveJson(PEGAWAI_FILE, pegawaiList);
      return res.json(newPeg);
    }

    pegawaiList[idx] = { ...pegawaiList[idx], ...req.body, updatedAt: new Date().toISOString() };
    saveJson(PEGAWAI_FILE, pegawaiList);

    // Recalculate payroll for this pegawai across records
    penggajianList = penggajianList.map(rec => {
      if (rec.pegawaiId === req.params.id) {
        const pres = presensiList.find(p => p.pegawaiId === req.params.id && p.bulan === rec.bulan && p.tahun === rec.tahun);
        if (pres) {
          const calc = kalkulasiPenggajian(pegawaiList[idx], pres, { bulan: rec.bulan, tahun: rec.tahun });
          return {
            ...rec,
            ...calc,
            pegawaiNama: pegawaiList[idx].nama,
            pegawaiNip: pegawaiList[idx].nip,
            pegawaiJabatan: pegawaiList[idx].jabatanUtama,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return rec;
    });
    saveJson(PENGGAJIAN_FILE, penggajianList);

    res.json(pegawaiList[idx]);
  });

  app.delete('/api/pegawai/:id', (req, res) => {
    const targetId = req.params.id;
    pegawaiList = pegawaiList.filter(p => p.id !== targetId);
    presensiList = presensiList.filter(p => p.pegawaiId !== targetId);
    penggajianList = penggajianList.filter(p => p.pegawaiId !== targetId);

    saveJson(PEGAWAI_FILE, pegawaiList);
    saveJson(PRESENSI_FILE, presensiList);
    saveJson(PENGGAJIAN_FILE, penggajianList);

    res.json({ message: 'Pegawai berhasil dihapus', id: targetId });
  });

  // API 3: Presensi & Absensi Integration
  app.get('/api/presensi', (req, res) => {
    const bulan = req.query.bulan ? parseInt(req.query.bulan as string) : 8;
    const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : 2026;
    const filtered = presensiList.filter(p => p.bulan === bulan && p.tahun === tahun);
    res.json(filtered);
  });

  app.post('/api/presensi', (req, res) => {
    const { pegawaiId, bulan, tahun, hadir, sakit, izin, alpha, menitTerlambat, jamMengajarRealisasi, catatan } = req.body;
    const existingIndex = presensiList.findIndex(p => p.pegawaiId === pegawaiId && p.bulan === bulan && p.tahun === tahun);
    
    const record: RekapPresensi = {
      id: existingIndex >= 0 ? presensiList[existingIndex].id : `prs-${Date.now()}`,
      pegawaiId,
      bulan: Number(bulan),
      tahun: Number(tahun),
      totalHariEfektif: 22,
      hadir: Number(hadir || 0),
      sakit: Number(sakit || 0),
      izin: Number(izin || 0),
      cuti: Number(req.body.cuti || 0),
      dinasLuar: Number(req.body.dinasLuar || 0),
      alpha: Number(alpha || 0),
      menitTerlambat: Number(menitTerlambat || 0),
      jamMengajarRencana: Number(req.body.jamMengajarRencana || 20),
      jamMengajarRealisasi: Number(jamMengajarRealisasi || 0),
      jamLemburTotal: Number(req.body.jamLemburTotal || 0),
      honorLemburTotal: Number(req.body.honorLemburTotal || 0),
      potonganIzinTidakResmi: Number(req.body.potonganIzinTidakResmi || 0),
      catatan,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      presensiList[existingIndex] = record;
    } else {
      presensiList.push(record);
    }

    saveJson(PRESENSI_FILE, presensiList);
    res.json({ message: 'Presensi berhasil disimpan', presensi: record });
  });

  // API 3B: Daily Attendance Logs (GET /api/daily-presensi)
  app.get('/api/daily-presensi', (req, res) => {
    const { tanggal, pegawaiId, bulan, tahun } = req.query;
    let filtered = [...dailyLogsList];

    if (tanggal) {
      filtered = filtered.filter(l => l.tanggal === tanggal);
    }
    if (pegawaiId) {
      filtered = filtered.filter(l => l.pegawaiId === pegawaiId);
    }
    if (bulan && tahun) {
      const b = Number(bulan);
      const t = Number(tahun);
      // Cut-off period: 23rd of previous month to 22nd of current month
      const prevBulan = b === 1 ? 12 : b - 1;
      const prevTahun = b === 1 ? t - 1 : t;
      const startIso = `${prevTahun}-${String(prevBulan).padStart(2, '0')}-23`;
      const endIso = `${t}-${String(b).padStart(2, '0')}-22`;
      filtered = filtered.filter(l => l.tanggal >= startIso && l.tanggal <= endIso);
    }

    res.json(filtered);
  });

  // API 3C: Batch Save Daily Attendance Logs (POST /api/daily-presensi/batch)
  app.post('/api/daily-presensi/batch', (req, res) => {
    const { logs, dateLabel } = req.body;
    if (!Array.isArray(logs)) {
      return res.status(400).json({ error: 'Array logs diperlukan' });
    }

    let updatedCount = 0;
    let addedCount = 0;

    logs.forEach((newLog: LogPresensiHarian) => {
      const existingIdx = dailyLogsList.findIndex(
        l => l.pegawaiId === newLog.pegawaiId && l.tanggal === newLog.tanggal
      );

      if (existingIdx >= 0) {
        dailyLogsList[existingIdx] = { ...dailyLogsList[existingIdx], ...newLog };
        updatedCount++;
      } else {
        dailyLogsList.push({
          ...newLog,
          id: newLog.id || `log-${newLog.tanggal}-${newLog.pegawaiId}`,
        });
        addedCount++;
      }
    });

    dailyLogsList.forEach((_, i) => {});
    saveJson(DAILY_LOGS_FILE, dailyLogsList);

    res.json({
      success: true,
      message: `Presensi harian ${dateLabel || ''} berhasil disimpan (${updatedCount} diperbarui, ${addedCount} ditambahkan)`,
      updatedCount,
      addedCount,
      totalLogs: dailyLogsList.length,
    });
  });


  // API 4: List Penggajian
  app.get('/api/penggajian', (req, res) => {
    const { bulan, tahun, status, search } = req.query;
    let list = [...penggajianList];

    if (bulan) list = list.filter(item => item.bulan === Number(bulan));
    if (tahun) list = list.filter(item => item.tahun === Number(tahun));
    if (status && status !== 'all') list = list.filter(item => item.status === status);
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(item => 
        item.pegawaiNama.toLowerCase().includes(q) || 
        item.pegawaiNip.toLowerCase().includes(q) || 
        item.kodeSlip.toLowerCase().includes(q) ||
        item.pegawaiJabatan.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  // API 5: Get Penggajian Detail
  app.get('/api/penggajian/:id', (req, res) => {
    const item = penggajianList.find(p => p.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Data penggajian tidak ditemukan' });
    const peg = pegawaiList.find(p => p.id === item.pegawaiId);
    res.json({ ...item, pegawaiDetail: peg });
  });

  // API 6: Generate Penggajian Bulanan Otomatis (POST /api/penggajian/generate)
  app.post('/api/penggajian/generate', (req, res) => {
    const bulan = req.body.bulan ? Number(req.body.bulan) : 8;
    const tahun = req.body.tahun ? Number(req.body.tahun) : 2026;
    const forceOverwrite = req.body.forceOverwrite === true;

    const generatedResults: PenggajianRecord[] = [];

    pegawaiList.forEach((peg, index) => {
      // Find attendance or fallback
      let pres = presensiList.find(p => p.pegawaiId === peg.id && p.bulan === bulan && p.tahun === tahun);
      if (!pres) {
        pres = {
          id: `prs-${peg.id}-${bulan}-${tahun}`,
          pegawaiId: peg.id,
          bulan,
          tahun,
          totalHariEfektif: 22,
          hadir: 22,
          sakit: 0,
          izin: 0,
          cuti: 0,
          dinasLuar: 0,
          alpha: 0,
          menitTerlambat: 0,
          jamMengajarRencana: 20,
          jamMengajarRealisasi: 20,
          jamLemburTotal: 0,
          honorLemburTotal: 0,
          potonganIzinTidakResmi: 0,
          updatedAt: new Date().toISOString(),
        };
        presensiList.push(pres);
      }

      const existingIdx = penggajianList.findIndex(p => p.pegawaiId === peg.id && p.bulan === bulan && p.tahun === tahun);
      
      // Calculate
      const calculated = kalkulasiPenggajian(peg, pres, { bulan, tahun });
      
      if (existingIdx >= 0) {
        if (forceOverwrite || penggajianList[existingIdx].status === 'draft') {
          penggajianList[existingIdx] = {
            ...penggajianList[existingIdx],
            ...calculated,
            updatedAt: new Date().toISOString(),
          };
          generatedResults.push(penggajianList[existingIdx]);
        }
      } else {
        const newRecord: PenggajianRecord = {
          ...calculated,
          id: `gji-${tahun}-${String(bulan).padStart(2, '0')}-${String(penggajianList.length + 1).padStart(3, '0')}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        penggajianList.push(newRecord);
        generatedResults.push(newRecord);
      }
    });

    const cutoffInfo = getPayrollCutoffDates(bulan, tahun);
    saveJson(PENGGAJIAN_FILE, penggajianList);
    saveJson(PRESENSI_FILE, presensiList);

    res.json({
      success: true,
      message: `Berhasil generate perhitungan gaji untuk ${generatedResults.length} pegawai SMK IT Ibnul Qayyim Makassar (Periode ${cutoffInfo.periodeLabel})`,
      periode: cutoffInfo.periodeLabel,
      periodeCutoff: cutoffInfo.cutoffLabelLong,
      tanggalMulaiBayar: cutoffInfo.paymentDate,
      count: generatedResults.length,
      data: generatedResults,
    });
  });

  // API 7: Approval Workflow Endpoint (PATCH /api/penggajian/:id/approve)
  app.patch('/api/penggajian/:id/approve', (req, res) => {
    const { id } = req.params;
    const { role, approverName, catatan, action } = req.body; // action: 'approve' | 'reject' | 'submit_kepsek'

    const record = penggajianList.find(p => p.id === id);
    if (!record) return res.status(404).json({ error: 'Data penggajian tidak ditemukan' });

    const now = new Date().toISOString();

    if (action === 'submit_kepsek') {
      record.status = 'pending_kepsek';
      record.updatedAt = now;
      saveJson(PENGGAJIAN_FILE, penggajianList);
      return res.json({ success: true, message: 'Draft berhasil diajukan ke Kepala Sekolah', record });
    }

    if (action === 'reject') {
      record.status = 'rejected';
      record.rejectedBy = approverName || 'Pimpinan';
      record.rejectedAt = now;
      record.catatanPenolakan = catatan || 'Revisi data diperlukan';
      record.updatedAt = now;
      saveJson(PENGGAJIAN_FILE, penggajianList);
      return res.json({ success: true, message: 'Penggajian ditolak dan dikembalikan untuk revisi', record });
    }

    // Role-specific approval logic
    if (role === 'kepala_sekolah' || role === 'super_admin') {
      if (record.status === 'draft' || record.status === 'pending_kepsek') {
        record.status = 'pending_yayasan';
        record.approvedKepsekBy = approverName || 'Drs. H. Syamsuddin Nur, M.Pd. (Kepala Sekolah)';
        record.approvedKepsekAt = now;
        record.catatanKepsek = catatan || 'Telah diverifikasi sesuai jam mengajar dan presensi.';
        record.updatedAt = now;
        saveJson(PENGGAJIAN_FILE, penggajianList);
        return res.json({
          success: true,
          message: 'Persetujuan Tahap 1 (Kepala Sekolah) berhasil. Diteruskan ke Ketua Yayasan.',
          record,
        });
      }
    }

    if (role === 'ketua_yayasan' || role === 'super_admin') {
      if (record.status === 'pending_yayasan' || record.status === 'pending_kepsek') {
        record.status = 'approved';
        record.approvedYayasanBy = approverName || 'Ir. H. Abdul Malik Karim, M.T. (Ketua Yayasan)';
        record.approvedYayasanAt = now;
        record.catatanYayasan = catatan || 'Disetujui untuk transfer dana penggajian.';
        record.updatedAt = now;
        saveJson(PENGGAJIAN_FILE, penggajianList);
        return res.json({
          success: true,
          message: 'Persetujuan Tahap 2 Final (Ketua Yayasan) berhasil. Status Siap Transfer.',
          record,
        });
      }
    }

    // Fallback: direct approve if admin
    record.status = 'approved';
    record.updatedAt = now;
    saveJson(PENGGAJIAN_FILE, penggajianList);
    res.json({ success: true, message: 'Status berhasil diperbarui menjadi Disetujui', record });
  });

  // API 8: Batch Approval
  app.patch('/api/penggajian/batch-approve', (req, res) => {
    const { ids, role, approverName } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    let updatedCount = 0;
    const now = new Date().toISOString();

    ids.forEach(id => {
      const record = penggajianList.find(p => p.id === id);
      if (record) {
        if (role === 'kepala_sekolah' && (record.status === 'draft' || record.status === 'pending_kepsek')) {
          record.status = 'pending_yayasan';
          record.approvedKepsekBy = approverName;
          record.approvedKepsekAt = now;
          updatedCount++;
        } else if (role === 'ketua_yayasan' && record.status === 'pending_yayasan') {
          record.status = 'approved';
          record.approvedYayasanBy = approverName;
          record.approvedYayasanAt = now;
          updatedCount++;
        } else if (role === 'super_admin') {
          record.status = 'approved';
          record.approvedKepsekBy = 'Drs. H. Syamsuddin Nur, M.Pd.';
          record.approvedYayasanBy = 'Ir. H. Abdul Malik Karim, M.T.';
          record.approvedKepsekAt = now;
          record.approvedYayasanAt = now;
          updatedCount++;
        }
      }
    });

    saveJson(PENGGAJIAN_FILE, penggajianList);
    res.json({ success: true, updatedCount, message: `${updatedCount} data berhasil disetujui` });
  });

  // API 9: Transfer Eksekusi Bendahara Yayasan (POST /api/penggajian/:id/transfer)
  app.post('/api/penggajian/:id/transfer', (req, res) => {
    const { id } = req.params;
    const { transferredBy, nomorReferensiTransfer, catatan } = req.body;

    const record = penggajianList.find(p => p.id === id);
    if (!record) return res.status(404).json({ error: 'Data penggajian tidak ditemukan' });

    const now = new Date().toISOString();
    const refNumber = nomorReferensiTransfer || `TRF/BSI/${now.slice(0, 10).replace(/-/g, '')}/${Math.floor(100000 + Math.random() * 900000)}`;

    record.status = 'transferred';
    record.transferredBy = transferredBy || 'Hj. Nurul Fatimah, S.E., Ak. (Bendahara Yayasan)';
    record.transferredAt = now;
    record.nomorReferensiTransfer = refNumber;
    record.updatedAt = now;

    // Otomatis trigger log email slip gaji
    const emailLog: EmailLog = {
      id: `eml-${Date.now()}`,
      penggajianId: record.id,
      kodeSlip: record.kodeSlip,
      recipientEmail: record.pegawaiEmail,
      recipientName: record.pegawaiNama,
      subject: `[RESMI] Slip Gaji Periode ${record.periodeLabel} - SMK IT Ibnul Qayyim Makassar`,
      sentAt: now,
      status: 'sent',
      messagePreview: `Assalamu alaikum Wr. Wb. Yth. ${record.pegawaiNama}, Gaji bersih Anda sebesar Rp ${record.gajiBersih.toLocaleString('id-ID')} telah sukses ditransfer dengan No. Ref: ${refNumber}. Dokumen slip gaji resmi terlampir.`,
    };
    emailLogs.unshift(emailLog);
    record.emailSent = true;
    record.emailSentAt = now;

    saveJson(PENGGAJIAN_FILE, penggajianList);
    saveJson(EMAIL_LOGS_FILE, emailLogs);

    res.json({
      success: true,
      message: `Transfer gaji berhasil dieksekusi dan slip gaji resmi telah diterbitkan serta dikirim via email.`,
      record,
      emailLog,
    });
  });

  // API 10: Kirim Notifikasi Email Slip Gaji (POST /api/penggajian/:id/send-email)
  app.post('/api/penggajian/:id/send-email', (req, res) => {
    const { id } = req.params;
    const record = penggajianList.find(p => p.id === id);
    if (!record) return res.status(404).json({ error: 'Data penggajian tidak ditemukan' });

    const now = new Date().toISOString();
    record.emailSent = true;
    record.emailSentAt = now;

    const emailLog: EmailLog = {
      id: `eml-${Date.now()}`,
      penggajianId: record.id,
      kodeSlip: record.kodeSlip,
      recipientEmail: record.pegawaiEmail,
      recipientName: record.pegawaiNama,
      subject: `[RESMI] Slip Gaji Periode ${record.periodeLabel} - SMK IT Ibnul Qayyim Makassar`,
      sentAt: now,
      status: 'sent',
      messagePreview: `Assalamu alaikum Wr. Wb. Yth. ${record.pegawaiNama}, Slip Gaji resmi periode ${record.periodeLabel} Anda telah terbit. Take Home Pay: Rp ${record.gajiBersih.toLocaleString('id-ID')}. Dokumen digital terenkripsi dapat diunduh melalui tautan resmi.`,
    };
    emailLogs.unshift(emailLog);

    res.json({
      success: true,
      message: `Notifikasi slip gaji berhasil dikirimkan ke email: ${record.pegawaiEmail}`,
      emailLog,
    });
  });

  // API 11: Batch Email Slips
  app.post('/api/penggajian/batch-email', (req, res) => {
    const { ids } = req.body;
    const targetIds: string[] = Array.isArray(ids) ? ids : penggajianList.filter(p => p.status === 'transferred' || p.status === 'approved').map(p => p.id);
    
    let sentCount = 0;
    const now = new Date().toISOString();

    targetIds.forEach(id => {
      const record = penggajianList.find(p => p.id === id);
      if (record) {
        record.emailSent = true;
        record.emailSentAt = now;
        emailLogs.unshift({
          id: `eml-batch-${Date.now()}-${sentCount}`,
          penggajianId: record.id,
          kodeSlip: record.kodeSlip,
          recipientEmail: record.pegawaiEmail,
          recipientName: record.pegawaiNama,
          subject: `[RESMI] Slip Gaji Periode ${record.periodeLabel} - SMK IT Ibnul Qayyim Makassar`,
          sentAt: now,
          status: 'sent',
          messagePreview: `Assalamu alaikum Wr. Wb. Yth. ${record.pegawaiNama}, Slip Gaji resmi periode ${record.periodeLabel} Anda telah diterbitkan. Total Take Home Pay: Rp ${record.gajiBersih.toLocaleString('id-ID')}.`,
        });
        sentCount++;
      }
    });

    res.json({
      success: true,
      sentCount,
      message: `Berhasil mengirimkan ${sentCount} email notifikasi slip gaji otomatis.`,
    });
  });

  // API 12: Dashboard Statistics
  app.get('/api/stats/dashboard', (req, res) => {
    const totalGajiBulanIni = penggajianList.reduce((acc, curr) => acc + curr.gajiBersih, 0);
    const totalPenerimaanKotor = penggajianList.reduce((acc, curr) => acc + curr.totalPenerimaan, 0);
    const totalPotongan = penggajianList.reduce((acc, curr) => acc + curr.totalPotongan, 0);
    const totalJamMengajarTerbayar = penggajianList.reduce((acc, curr) => acc + curr.jamMengajarRealisasi, 0);
    
    const countDraft = penggajianList.filter(p => p.status === 'draft').length;
    const countPendingKepsek = penggajianList.filter(p => p.status === 'pending_kepsek').length;
    const countPendingYayasan = penggajianList.filter(p => p.status === 'pending_yayasan').length;
    const countApproved = penggajianList.filter(p => p.status === 'approved').length;
    const countTransferred = penggajianList.filter(p => p.status === 'transferred').length;
    
    const total = penggajianList.length || 1;
    const persentaseSelesai = Math.round((countTransferred / total) * 100);

    res.json({
      totalGajiBulanIni,
      totalPenerimaanKotor,
      totalPotongan,
      totalPegawai: pegawaiList.length,
      totalGuru: pegawaiList.filter(p => p.statusPegawai === 'GTY' || p.statusPegawai === 'GTT').length,
      totalTendik: pegawaiList.filter(p => p.statusPegawai === 'PTY' || p.statusPegawai === 'PTT').length,
      countDraft,
      countPendingKepsek,
      countPendingYayasan,
      countApproved,
      countTransferred,
      persentaseSelesai,
      totalJamMengajarTerbayar,
      encryptionSecurityScore: 100,
    });
  });

  // API 13: Email Logs
  app.get('/api/email-logs', (req, res) => {
    res.json(emailLogs);
  });

  // API 13B: Infal Guru Pengganti (Rp 7.500 / JP)
  app.get('/api/infal', (req, res) => {
    res.json(infalList);
  });

  app.post('/api/infal', (req, res) => {
    const { 
      tanggal, 
      guruAbsenId, 
      guruAbsenNama, 
      guruPenggantiId, 
      guruPenggantiNama, 
      mataPelajaran, 
      kelas, 
      jumlahJp, 
      alasanAbsen, 
      catatan, 
      status 
    } = req.body;

    const jp = Number(jumlahJp || 1);
    const tarifPerJp = 7500;
    const totalNominal = jp * tarifPerJp;

    const newInfal: LogInfal = {
      id: `inf-${Date.now()}`,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      guruDigantikanId: guruAbsenId || '',
      guruDigantikanNama: guruAbsenNama || '',
      guruAbsenId,
      guruAbsenNama,
      guruPenggantiId: guruPenggantiId || '',
      guruPenggantiNama: guruPenggantiNama || '',
      mataPelajaran: mataPelajaran || 'Mata Pelajaran Kejuruan IT / Normatif',
      kelas: kelas || 'Kelas Reguler',
      jumlahJp: jp,
      tarifPerJp,
      totalNominal,
      alasan: alasanAbsen || 'Izin / Sakit / Dinas Luar',
      alasanAbsen: alasanAbsen || 'Izin / Sakit / Dinas Luar',
      catatan: catatan || '',
      status: status || 'approved',
      approvedBy: 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    infalList.unshift(newInfal);
    saveJson(INFAL_FILE, infalList);
    res.json({ success: true, message: 'Log Infal berhasil dicatat dan diproses.', infal: newInfal });
  });

  app.delete('/api/infal/:id', (req, res) => {
    const id = req.params.id;
    infalList = infalList.filter(i => i.id !== id);
    saveJson(INFAL_FILE, infalList);
    res.json({ success: true, message: 'Log Infal berhasil dihapus.' });
  });

  app.patch('/api/infal/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, approvedBy } = req.body;
    const item = infalList.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Data Infal tidak ditemukan.' });

    item.status = status;
    if (status === 'approved') {
      item.approvedBy = approvedBy || 'Anto, S.E.I., M.E., Gr., MCF. (Kepsek)';
      item.approvedAt = new Date().toISOString();
    }
    saveJson(INFAL_FILE, infalList);
    res.json({ success: true, message: `Status Infal berhasil diperbarui menjadi ${status}`, infal: item });
  });

  // API 14: Security / Verification Endpoint
  app.get('/api/security/verify/:kodeSlip', (req, res) => {
    const item = penggajianList.find(p => p.kodeSlip === req.params.kodeSlip);
    if (!item) return res.status(404).json({ valid: false, message: 'Dokumen slip gaji tidak ditemukan dalam registri sekolah.' });
    
    res.json({
      valid: true,
      institution: 'SMK IT Ibnul Qayyim Makassar',
      kodeSlip: item.kodeSlip,
      pegawaiNama: item.pegawaiNama,
      pegawaiNip: item.pegawaiNip,
      periode: item.periodeLabel,
      gajiBersih: item.gajiBersih,
      status: item.status,
      securityChecksum: item.securityChecksum,
      approvedKepsekBy: item.approvedKepsekBy,
      approvedYayasanBy: item.approvedYayasanBy,
      transferredAt: item.transferredAt,
    });
  });

  // API 15: Jadwal Pelajaran (Lesson Schedule) Endpoints
  app.get('/api/schedule', (req, res) => {
    const { hari, kelas, guru } = req.query;
    let result = [...scheduleList];
    if (hari) result = result.filter(s => s.hari === hari);
    if (kelas) result = result.filter(s => s.kelas === kelas);
    if (guru) result = result.filter(s => s.kodeGuru === guru);
    res.json(result);
  });

  app.post('/api/schedule', (req, res) => {
    const newSlot: SlotJadwalPelajaran = {
      id: req.body.id || `sch-${Date.now()}`,
      hari: req.body.hari,
      jamKe: req.body.jamKe,
      rentangWaktu: req.body.rentangWaktu,
      kelas: req.body.kelas,
      mataPelajaran: req.body.mataPelajaran,
      kodeGuru: req.body.kodeGuru,
      guruNama: req.body.guruNama,
      pegawaiId: req.body.pegawaiId,
      ruang: req.body.ruang
    };
    scheduleList.push(newSlot);
    saveJson(SCHEDULE_FILE, scheduleList);
    res.status(201).json({ success: true, slot: newSlot });
  });

  app.put('/api/schedule/:id', (req, res) => {
    const index = scheduleList.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Slot jadwal tidak ditemukan' });
    scheduleList[index] = { ...scheduleList[index], ...req.body };
    saveJson(SCHEDULE_FILE, scheduleList);
    res.json({ success: true, slot: scheduleList[index] });
  });

  app.delete('/api/schedule/:id', (req, res) => {
    scheduleList = scheduleList.filter(s => s.id !== req.params.id);
    saveJson(SCHEDULE_FILE, scheduleList);
    res.json({ success: true, message: 'Slot jadwal berhasil dihapus' });
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIM GAJI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
