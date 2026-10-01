# 🚀 Panduan Deployment SIM GAJI SMK IT Ibnul Qayyim Makassar ke Hostinger

Dokumen ini berisi panduan lengkap untuk melakukan *push* repository ke **GitHub** dan melakukan **deployment otomatis ke Hostinger** tanpa error.

---

## 📋 Ringkasan Konfigurasi yang Telah Disiapkan

1. **SPA Routing `.htaccess`**:
   - Berkas `public/.htaccess` otomatis disalin ke dalam folder `dist/` saat build, memastikan URL routing tidak menghasilkan error `404 Not Found` pada Apache/LiteSpeed Hostinger.
   - Dilengkapi *Force HTTPS*, *Gzip Compression*, dan *Security Headers*.
2. **Multi-Environment Port (`server.ts`)**:
   - Port server menggunakan `process.env.PORT || 3000` sehingga kompatibel dengan Node.js runtime Hostinger / Cloud.
3. **GitHub Actions CI/CD (`.github/workflows/deploy.yml`)**:
   - Otomatis memvalidasi type check (`tsc --noEmit`), melakukan compile (`npm run build`), dan menyinkronkan berkas ke Hostinger via FTP/SFTP setiap kali ada *commit* baru ke branch `main`.

---

## 🛠️ Langkah 1: Push Project ke GitHub

Buka terminal di komputer Anda, lalu jalankan perintah berikut:

```bash
# 1. Inisialisasi Git (jika belum)
git init

# 2. Tambahkan semua berkas
git add .

# 3. Buat commit pertama
git commit -m "feat: inisialisasi SIM GAJI SMK IT Ibnul Qayyim Makassar siap deploy Hostinger"

# 4. Hubungkan ke repository GitHub Anda
git remote add origin https://github.com/USERNAME_ANDA/sim-gaji-smkit.git

# 5. Push ke branch main
git branch -M main
git push -u origin main
```

---

## 🌐 Langkah 2: Pilihan Metode Deployment di Hostinger

### Opsi A: Deployment Otomatis via GitHub Actions (Sangat Direkomendasikan)

1. Buka **hPanel Hostinger** > Pilih Website Anda > Menu **Akses FTP**.
2. Catat informasi:
   - **Host FTP**: contoh `ftp.domainanda.com`
   - **Username FTP**: contoh `u123456789`
   - **Password FTP**: password akun FTP Anda
3. Buka repository Anda di **GitHub** > Masuk ke tab **Settings** > **Secrets and variables** > **Actions**.
4. Klik **New repository secret** dan tambahkan 3 secret berikut:
   - `FTP_SERVER` = Host FTP Hostinger Anda
   - `FTP_USERNAME` = Username FTP Hostinger Anda
   - `FTP_PASSWORD` = Password FTP Hostinger Anda
   - *(Opsional)* `VITE_SUPABASE_URL` = URL Supabase project Anda
   - *(Opsional)* `VITE_SUPABASE_ANON_KEY` = Anon Public Key Supabase Anda
5. Setiap kali Anda melakukan `git push` ke branch `main`, GitHub Actions akan otomatis melakukan kompilasi dan mengunggah hasil build langsung ke direktori `public_html` Hostinger!

---

### Opsi B: Fitur Git Deployment Bawaan Hostinger hPanel

1. Buka **hPanel Hostinger** > Pilih Website > Menu **Tingkat Lanjut (Advanced)** > **Git**.
2. Masukkan URL Repository GitHub Anda: `https://github.com/USERNAME_ANDA/sim-gaji-smkit.git`.
3. Pilih Branch: `main`.
4. Jalankan perintah build otomatis atau upload direktori `dist/` ke `public_html`.

---

### Opsi C: Hostinger Node.js Application (Jika Menggunakan Fullstack Express)

1. Buka **hPanel Hostinger** > Menu **Node.js**.
2. Buat aplikasi Node.js baru:
   - **Versi Node.js**: 18.x atau 20.x
   - **Application Root**: `/`
   - **Application Startup File**: `dist/server.cjs`
3. Jalankan `npm install` dan `npm run build` di terminal SSH Hostinger.
4. Klik **Start Application**.

---

## 🔐 Konfigurasi Database Supabase di Hostinger

Aplikasi ini mendukung penyimpanan persistent Supabase. Anda dapat mengisi kredensial langsung melalui:
1. File `.env` pada server:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```
2. Atau langsung melalui antarmuka web:
   - Masuk ke menu **Pengaturan (Settings) > Kredensial Supabase** pada aplikasi SIM GAJI.
   - Masukkan URL dan Anon Key lalu klik **Simpan & Uji Koneksi**.
