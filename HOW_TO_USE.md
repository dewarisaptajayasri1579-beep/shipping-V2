# Panduan Penggunaan Template - PT Seven Smarts

Dokumen ini menjelaskan langkah-langkah praktis untuk menggunakan boilerplate template admin Next.js + TailwindCSS ini sebagai starter proyek baru.

---

## Langkah 1: Duplikasi Template
Salin seluruh isi folder boilerplate ini ke folder proyek baru Anda:
```bash
# Salin folder template ke folder proyek baru
cp -R os-template proyek-baru-anda
cd proyek-baru-anda

# Install dependensi proyek
npm install
```

---

## Langkah 2: Konfigurasi Branding & Global Settings
Ubah nama aplikasi, deskripsi, logo, dan preferensi lainnya secara global melalui berkas konfigurasi di:
* `src/lib/app-config.ts`

Semua judul halaman, meta tag SEO, logo navbar, hak cipta footer, dan nama aplikasi di email akan otomatis diperbarui mengikuti berkas konfigurasi tersebut.

---

## Langkah 3: Sesuaikan Menu Navigasi Sidebar
Atur daftar menu samping (sidebar) dan bilah navigasi mobile di berkas:
* `src/lib/nav-config.ts`

Ubah array objek navigasi pada grup `Contoh Menu` dengan rute aplikasi riil Anda, serta sematkan ikon Lucide yang sesuai.

---

## Langkah 4: Pembersihan Kode Demo (Clean Up)
Setelah Anda memahami penggunaan komponen UI kit yang disediakan, Anda dapat menghapus berkas-berkas demo untuk merampingkan ukuran bundle proyek:
* Hapus folder `src/app/contoh/` (berisi demo formulir, tabel, grafik, utilitas, ikon, dsb.).
* Hapus folder `src/app/dokumentasi/` (halaman katalog visual dokumentasi).

Mulai buat rute halaman aplikasi riil Anda di bawah direktori `src/app/` (misalnya `src/app/produk/page.tsx`, dsb.).

---

## Langkah 5: Integrasi Database & Autentikasi
1. Salin berkas `.env.example` ke `.env.local` dan masukkan string koneksi database Anda (Prisma/Postgres/MySQL).
2. Boilerplate ini menggunakan sesi otentikasi berbasis cookie JWT di `src/lib/auth.ts` dan fungsi session server-side `src/lib/current-user.ts`.
3. Hubungkan fungsi `getSessionUser` dan API endpoint otentikasi di `/api/auth/*` dengan tabel database pengguna riil Anda.

---

## Mengembangkan dengan AI Agent
Proyek ini dilengkapi konfigurasi agen di folder `.agents/AGENTS.md`. Jika Anda berkolaborasi dengan AI coding assistant (seperti Antigravity), agen tersebut secara otomatis akan membaca berkas tersebut sebagai pedoman pembuatan kode agar tetap konsisten menggunakan UI Kit standard Seven Smarts.
