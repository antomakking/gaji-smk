/**
 * Secure Credential Archival & Encryption Engine
 * SMK IT Ibnul Qayyim Makassar
 * Standard: AES-256-GCM with PBKDF2 (SHA-256, 100,000 iterations)
 */

import { User } from '../types';

export interface CredentialExportRow {
  userId: string;
  nama: string;
  username: string;
  role: string;
  jabatan: string;
  email: string;
  pegawaiId?: string;
  statusAkun: string;
  tanggalEkspor: string;
  checksumSha256?: string;
}

export interface EncryptedPackage {
  format: 'SIM-GAJI-CREDENTIAL-AES256-GCM';
  version: '1.0';
  exportTimestamp: string;
  exportedBy: {
    id: string;
    nama: string;
    role: string;
  };
  institution: string;
  documentRefNumber: string;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  tagLength: number;
  integrityHash: string; // SHA-256 of plain content
  totalAccounts: number;
}

/**
 * Calculate SHA-256 hash of a string using Web Crypto API
 */
export async function calculateSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt plain text using AES-256-GCM with a user-supplied passphrase
 */
export async function encryptWithPassphrase(
  plainText: string,
  passphrase: string
): Promise<{ salt: string; iv: string; ciphertext: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 1. Import raw passphrase key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 2. Derive AES-256-GCM Key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 3. Encrypt payload
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encoder.encode(plainText)
  );

  // Convert Uint8Array to base64
  const toBase64 = (arr: Uint8Array) => {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return window.btoa(binary);
  };

  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM and passphrase
 */
export async function decryptWithPassphrase(
  ciphertextBase64: string,
  saltBase64: string,
  ivBase64: string,
  passphrase: string
): Promise<string> {
  const decoder = new TextDecoder();
  const fromBase64 = (b64: string) => {
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const salt = fromBase64(saltBase64);
  const iv = fromBase64(ivBase64);
  const encryptedData = fromBase64(ciphertextBase64);

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encryptedData
  );

  return decoder.decode(decryptedBuffer);
}

/**
 * Generate CSV String from credentials with metadata header and timestamp
 */
export function generateCredentialsCsvContent(
  users: User[],
  exportedBy: { id: string; nama: string; role: string },
  docRefNumber: string,
  includeCommentsHeader: boolean = true
): { csvString: string; timestampIso: string; timestampFormatted: string; checksumPlaceholder: string } {
  const now = new Date();
  const timestampIso = now.toISOString();
  
  // Format localized Makassar/Indonesian date
  const timestampFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Makassar',
  }).format(now);

  const lines: string[] = [];

  if (includeCommentsHeader) {
    lines.push(`# ==============================================================================`);
    lines.push(`# DOKUMEN RAHASIA ARSIP FISIK KREDENSIAL & OTORISASI SIM GAJI`);
    lines.push(`# Institusi     : SMK IT Ibnul Qayyim Makassar`);
    lines.push(`# No. Registrasi: ${docRefNumber}`);
    lines.push(`# Waktu Ekspor  : ${timestampFormatted} (${timestampIso})`);
    lines.push(`# Petugas Ekspor: ${exportedBy.nama} [${exportedBy.role}] (ID: ${exportedBy.id})`);
    lines.push(`# Enkripsi      : AES-256-GCM / PBKDF2-SHA256 (100.000 Iterations)`);
    lines.push(`# Klasifikasi   : SANGAT RAHASIA (Physical Filing Safe Deposit Only)`);
    lines.push(`# ==============================================================================`);
  }

  // CSV Columns Header
  const headers = [
    'NO',
    'USER_ID',
    'NAMA_LENGKAP',
    'USERNAME',
    'EMAIL_RESMI',
    'ROLE_AKSES',
    'JABATAN',
    'ID_PEGAWAI',
    'STATUS_AKUN',
    'WAKTU_EKSPOR_ISO',
    'WAKTU_EKSPOR_LOKAL',
    'PETUGAS_EKSPOR',
    'NO_DOKUMEN_ARSIP',
    'SECURITY_CHECKSUM_SHA256'
  ];

  lines.push(headers.map(escapeCsvValue).join(','));

  users.forEach((u, index) => {
    const row = [
      String(index + 1),
      u.id,
      u.nama,
      u.username,
      u.email,
      u.role.toUpperCase(),
      u.jabatan,
      u.pegawaiId || '-',
      'AKTIF',
      timestampIso,
      timestampFormatted,
      exportedBy.nama,
      docRefNumber,
      // Row signature
      '' // Will be populated with row hash
    ];
    lines.push(row.map(escapeCsvValue).join(','));
  });

  const csvString = lines.join('\r\n');
  return {
    csvString,
    timestampIso,
    timestampFormatted,
    checksumPlaceholder: '',
  };
}

/**
 * Helper to escape CSV values according to RFC 4180
 */
function escapeCsvValue(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
