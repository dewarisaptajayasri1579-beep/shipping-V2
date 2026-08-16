# Struktur Menu Aplikasi Import Dashboard

Dasar penyusunan: hasil analisis workbook `DASHBOARD IMPORT.xlsx` di [alur-penjelasan.md](alur-penjelasan.md). Struktur menu dibagi 5 kelompok besar: **Master Data, Transaksi, Laporan, Dashboard, Smart Fitur**.

## 1. Master Data

Data referensi yang jarang berubah, dipakai berulang oleh menu Transaksi.

| Menu | Keterangan | Asal di Excel |
|---|---|---|
| Brand | FLUKE, SOCOMEC, ALLWAY, KINGLUMI, ILLUVIA, OBO, dst | kolom BRAND di DATABASE |
| Supplier/Vendor | data supplier per brand | kolom VENDOR di DATABASE DTD |
| Forwarder | FEDEX, RICA, INTERLINK, dst + rate per charge type (Handling, Trucking, Meal, Dokumen, PIB EDI) per ukuran kontainer (20'/40'/40HC/LCL) dan incoterm (CIF/EXW/FOB) — dengan histori perubahan harga | sheet RATE FW |
| Gudang | YASUNLITEX, dst | kolom GUDANG di DATABASE |
| Item/Produk | kode item, HS Code, deskripsi, kode internal (khusus lini Illuvia) | kolom ITEM CODE, HS CODE, DESCRIPTION di DATABASE; KODE INTERNAL di DATABASE DTD |
| Negara Asal | COUNTRY | kolom COUNTRY |
| Project/Kategori Shipment | contoh: LAUNCHING | kolom PROJECT di DATABASE DTD |

## 2. Transaksi

Input data operasional harian, mengganti input manual di sheet DATABASE/SPREADSHEET/DATABASE DTD.

| Menu | Keterangan | Asal di Excel |
|---|---|---|
| Input Shipment/Import | no invoice, no PO, item, qty, harga, no PIB, jalur AIR/SEA, status barang, tanggal kedatangan | sheet DATABASE (gabung dengan SPREADSHEET jadi satu sumber data, hilangkan duplikasi) |
| Input Shipment DTD/Launching | tanggal sampai agent, tanggal sampai gudang MCH, GAP dihitung otomatis oleh sistem (bukan manual) | sheet DATABASE DTD |
| Update Status Pembayaran | status & histori pembayaran ke supplier (PI) dan ke forwarder (FO) — dicatat sebagai log/transaksi, bukan cuma field status, agar ada audit trail | kolom STATUS PEMBAYARAN PI, STATUS PEMBAYARAN FO |
| Perbandingan Rate Forwarder | membandingkan rate antar forwarder saat memilih forwarder untuk sebuah shipment | sheet COMPARE |

## 3. Laporan

Rekap data untuk kebutuhan analisis & pelaporan ke pihak lain, mengganti pivot table manual.

| Menu | Keterangan | Asal di Excel |
|---|---|---|
| Laporan Shipment per Status/Bulan/Brand | jumlah shipment per status barang, per bulan, per brand | sheet PIV |
| Laporan Performa Vendor DTD | Count/Sum/Average GAP per vendor, untuk menilai kecepatan vendor | sheet PIV DTD |
| Laporan Pembayaran | outstanding payment ke supplier & forwarder | kolom STATUS PEMBAYARAN PI/FO, NILAI BILLING, NILAI FORWARDER |
| Top 20 Shipment Bernilai Tertinggi | ranking shipment/item berdasarkan nilai | sheet TOP 20 HIGHEST |
| **Penilaian/Scoring Vendor** | ranking & skor vendor gabungan dari 2 faktor: **kecepatan** (rata-rata GAP hari sampai agent → sampai gudang, makin kecil makin baik) dan **harga** (rata-rata/total harga yang ditawarkan vendor tsb, makin kompetitif makin baik) — dipakai untuk memutuskan vendor mana yang diprioritaskan untuk order berikutnya | perluasan dari sheet PIV DTD (yang selama ini baru sebatas Count/Sum/Average GAP per vendor, belum menggabungkan faktor harga) |
| Export Excel/PDF | ekspor laporan untuk dibagikan ke pihak yang belum pakai aplikasi | - |

## 4. Dashboard

Tampilan ringkas & interaktif untuk manajemen, real-time (tanpa perlu refresh manual seperti pivot Excel).

| Menu | Keterangan | Asal di Excel |
|---|---|---|
| Ringkasan Status Barang | filter interaktif status barang belum datang / on going / sudah datang, per brand/bulan | sheet DASHBOARD (slicer + pivot) |
| Monitoring Illuvia | dashboard khusus lini produk Illuvia | sheet ILLUVIA MONITORING |
| KPI Utama | total nilai impor per bulan, rata-rata GAP pengiriman, total outstanding pembayaran | turunan dari DATABASE + DATABASE DTD |

## 5. Smart Fitur (Early Warning System)

Prinsip utama: EWS harus **prediktif** — memberi peringatan **sebelum** keterlambatan/fraud benar-benar terjadi, berdasarkan aturan ambang hari (threshold) yang bisa diatur, bukan notifikasi setelah masalah sudah terjadi. Tiap aturan punya 3 komponen: **kapan alert dikirim** (H- berapa dari batas waktu), **ke siapa**, dan **tindakan yang diharapkan** dilakukan penerima. Notifikasi dikirim ke **WhatsApp** lewat server Baileys milik sendiri (self-hosted).

### 5.1 Peringatan Dini Keterlambatan

| Aturan | Kapan Alert Terkirim | Tindakan yang Diharapkan | Sumber Data |
|---|---|---|---|
| Estimasi kedatangan barang mendekati batas | H-3 dan H-1 sebelum TANGGAL KEDATANGAN, jika STATUS BARANG masih "BELUM DATANG"/"ON GOING" — lalu alert eskalasi kalau sudah lewat H+0 dan status belum berubah | tim terkait mengecek status ke forwarder/agent sebelum benar-benar telat | STATUS BARANG, TANGGAL KEDATANGAN |
| Proyeksi GAP DTD akan melebihi rata-rata vendor | dikirim saat SAMPE AGENT sudah tercatat tapi SAMPE MCHE belum, dan durasi berjalan sudah mendekati (misal 80%) rata-rata GAP historis vendor tsb — bukan menunggu sampai benar-benar melebihi | tim follow up ke vendor sebelum keterlambatan terjadi | DATABASE DTD (SAMPE AGENT, SAMPE MCHE) + baseline Penilaian/Scoring Vendor |
| Jatuh tempo pembayaran mendekat | H-7, H-3, H-1 sebelum tanggal jatuh tempo pembayaran ke supplier/forwarder (field baru, perlu ditambahkan — belum ada di Excel saat ini); eskalasi ke atasan jika lewat H+0 belum dibayar | finance menyiapkan/memproses pembayaran sebelum telat, hindari denda/relasi rusak dengan vendor | STATUS PEMBAYARAN PI/FO + tanggal jatuh tempo |
| Dokumen PIB belum lengkap menjelang kedatangan | H-5 sebelum TANGGAL KEDATANGAN jika NO PIB masih kosong | tim customs mengurus PIB lebih awal agar barang tidak tertahan di pelabuhan | NO PIB, TANGGAL KEDATANGAN |
| Shipment bernilai tinggi berisiko macet | jika shipment termasuk Top 20 (nilai tinggi) dan sudah X hari tanpa perubahan status (threshold lebih ketat utk nilai lebih besar) | manajemen/PIC terkait cek langsung, prioritaskan penyelesaian | TOTAL PRICE, STATUS BARANG/SHIPMENT |

### 5.2 Deteksi Dini Indikasi Fraud

| Aturan | Kapan Alert Terkirim | Tindakan yang Diharapkan | Sumber Data |
|---|---|---|---|
| Invoice ganda (duplikat) | saat NO INVOICE yang sama diinput lebih dari sekali untuk shipment berbeda | verifikasi manual sebelum pembayaran diproses, cegah pembayaran dobel | NO INVOICE |
| Harga item menyimpang dari histori | saat PRICE SATUAN item dari vendor yang sama berbeda signifikan (misal >X%) dari harga historis item tsb, tanpa perubahan yang wajar | approval tambahan/verifikasi sebelum transaksi disetujui | PRICE SATUAN historis per ITEM CODE + VENDOR |
| Kenaikan rate forwarder tidak wajar | rate forwarder naik signifikan dibanding histori sebelum dipakai di shipment baru | verifikasi ke forwarder, bandingkan dgn kompetitor di menu Perbandingan Rate | histori rate di RATE FW |
| Pembayaran tercatat lunas sebelum barang tercatat datang | STATUS PEMBAYARAN PI/FO = "SUDAH DIBAYAR" padahal STATUS BARANG belum "SUDAH DATANG" — red flag urutan proses terbalik | audit internal cek kesesuaian dokumen & bukti kirim | STATUS PEMBAYARAN PI/FO, STATUS BARANG |
| Perubahan data setelah status "DONE"/selesai | shipment yang sudah berstatus selesai tapi field harga/qty/no invoice-nya diubah kemudian | audit log siapa yang mengubah & kenapa | log perubahan (audit trail) pada data shipment |
| Vendor baru dengan nilai transaksi besar tanpa histori | shipment pertama dari vendor baru dengan TOTAL PRICE di atas ambang tertentu | approval berjenjang sebelum transaksi disetujui | VENDOR (histori transaksi), TOTAL PRICE |

### 5.3 Manajemen EWS

| Menu | Keterangan |
|---|---|
| Pengaturan Aturan/Threshold | admin mengatur ambang hari (H-berapa) dan ambang persentase per jenis alert — configurable, bukan hardcode, karena tiap brand/vendor beda karakteristik |
| Pengaturan Notifikasi WhatsApp | atur nomor/grup tujuan per jenis alert, jam pengiriman, aktif/nonaktifkan per role (misal alert fraud hanya ke manajemen, alert keterlambatan ke staff operasional) |
| Log Riwayat Alert | histori semua alert yang pernah terkirim beserta status tindak lanjutnya (sudah ditangani / belum) — untuk audit & menghindari kirim ulang alert yang sama berkali-kali |

### 5.4 Rekomendasi Vendor

Sistem tidak hanya menilai vendor secara pasif (lihat Laporan Penilaian/Scoring Vendor), tapi aktif **menyarankan** vendor terbaik pada saat dibutuhkan, berdasarkan data historis.

| Menu | Keterangan | Sumber Data |
|---|---|---|
| Saran Vendor saat Input Transaksi | ketika staff membuat shipment/PO baru untuk item/brand/negara asal tertentu, sistem menampilkan ranking vendor yang pernah menangani item/brand sejenis, lengkap dengan alasannya (mis. "Vendor A rata-rata 5% lebih murah, Vendor B rata-rata 3 hari lebih cepat") | histori DATABASE + DATABASE DTD per ITEM/BRAND/VENDOR |
| Skor Rekomendasi | kombinasi 3 faktor: **harga** (rata-rata harga historis per item dibanding vendor lain), **kecepatan** (rata-rata GAP), dan **konsistensi/reliabilitas** (variasi GAP — vendor yang stabil lebih diprioritaskan daripada yang sesekali sangat cepat tapi sering sangat lambat) | Penilaian/Scoring Vendor (diperluas dengan faktor konsistensi) |
| Penyesuaian Skor karena Red Flag | skor rekomendasi otomatis diturunkan jika vendor tsb pernah kena alert fraud/keterlambatan berulang dari Smart Fitur EWS | Log Riwayat Alert |
| Minimal Data untuk Direkomendasikan | vendor baru dengan riwayat transaksi terlalu sedikit ditandai "data belum cukup" agar tidak direkomendasikan berdasarkan sampel kecil yang bisa menyesatkan | jumlah transaksi historis per vendor |

## Catatan implementasi

- Master Data harus dibuat/diisi lebih dulu sebelum Transaksi bisa jalan (relasi ke Brand, Forwarder, Item, dll).
- GAP (selisih hari sampai agent → sampai gudang) dan status shipment sebaiknya dihitung otomatis oleh sistem berdasarkan tanggal, bukan input manual — menghindari human error yang sudah terlihat di data Excel saat ini.
- Laporan & Dashboard sebaiknya query langsung dari data Transaksi (bukan tabel pivot terpisah yang perlu di-refresh), supaya selalu real-time.
- Penilaian/Scoring Vendor perlu formula bobot yang disepakati dulu (misal: 50% kecepatan GAP, 50% harga, atau bobot lain) — ini keputusan bisnis, bukan teknis, sebaiknya didiskusikan dengan user sebelum dikodekan.
- Smart Fitur (EWS) sebaiknya jalan lewat scheduled job (cron harian) yang mengecek kondisi trigger terhadap data transaksi, disimpan ke Log Riwayat Alert dulu sebelum dikirim — supaya alert yang sama tidak berulang kali dikirim tiap hari.
- EWS harus prediktif (kirim H- sebelum batas waktu), bukan reaktif (kirim setelah telat) — nilai H- dan ambang persentase tiap aturan sebaiknya configurable per brand/vendor, karena karakteristik pengiriman tiap vendor berbeda.
- Deteksi fraud butuh data historis yang cukup (harga, vendor, invoice) sebagai baseline pembanding — perlu masa "belajar" dari data lama sebelum aturan penyimpangan harga bisa akurat.
- Server WhatsApp Baileys sudah tersedia (self-hosted milik sendiri) — aplikasi cukup terhubung sebagai pengirim pesan ke server tersebut, tidak perlu setup provider WA Business API terpisah.
- Rekomendasi Vendor memakai formula & bobot yang sama dengan Penilaian/Scoring Vendor (harga, kecepatan) ditambah faktor konsistensi (variasi GAP) dan penalti red flag dari EWS — supaya kedua fitur konsisten dan tidak dihitung dengan logika berbeda.
