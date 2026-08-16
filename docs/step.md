# Step by Step Pengerjaan shipping-v2

Acuan: [menu.md](menu.md) untuk struktur menu, [alur-penjelasan.md](alur-penjelasan.md) untuk konteks data lama, mockup di [../mockup/](../mockup/) untuk tampilan dashboard.

## Fase 0 — Setup Project

1. **Scaffold project** — copy struktur `os-template` (Next.js + Tailwind + UI kit) ke `shipping-v2`, tanpa halaman login/auth (langsung ke dashboard).
2. **Bikin layer data JSON** — folder `data/*.json` + `src/lib/data/` berisi fungsi `read/write/add/update/delete` per entitas, pola sama seperti `dummy-data.ts` di template (baca-tulis langsung ke file tiap request).
3. **Setup nav menu** — isi `nav-config.ts` dengan 5 grup sesuai menu.md: Master Data, Transaksi, Laporan, Dashboard, Smart Fitur.

## Fase 1 — Master Data

4. **Brand** — CRUD sederhana (nama).
5. **Negara Asal** — CRUD sederhana (nama).
6. **Gudang** — CRUD sederhana (nama).
7. **Supplier/Vendor** — CRUD + relasi ke Brand.
8. **Project/Kategori Shipment** — CRUD sederhana (nama).
9. **Item/Produk** — CRUD (kode item, HS code, deskripsi, kode internal khusus Illuvia).
10. **Forwarder** — CRUD data forwarder (nama).
11. **Rate Forwarder** — sub-menu Forwarder: input rate per charge type × ukuran kontainer × incoterm, dengan histori perubahan harga (bukan overwrite).

## Fase 2 — Transaksi

12. **Input Shipment/Import** — form + tabel input transaksi harian (gabungan DATABASE+SPREADSHEET lama jadi satu sumber).
13. **Input Shipment DTD/Launching** — form + tabel, GAP (sampai gudang − sampai agent) dihitung otomatis saat ditampilkan, bukan input manual.
14. **Update Status Pembayaran** — form update status bayar ke supplier (PI) & forwarder (FO), disimpan sebagai log histori (audit trail), bukan overwrite field.
15. **Perbandingan Rate Forwarder** — halaman query & bandingkan rate antar forwarder dari data Rate Forwarder (fase 1), bantu pilih forwarder termurah.

## Fase 3 — Dashboard & Laporan

16. **Dashboard Utama** — mirror [shipping-dashboard.png](../mockup/shipping-dashboard.png): stat cards (total shipment, on going, cost forwarder, cost billing), chart shipment per bulan, pie supplier, bar by country, filter panel, tabel tracking shipment.
17. **Monitoring Illuvia** — mirror [shipping-iluvia-monitoring.png](../mockup/shipping-iluvia-monitoring.png): filter project/brand/vendor/status, stat cards, tabel shipment DTD + GAP, chart rata-rata GAP per forwarder.
18. **Top 20 Shipment Bernilai Tertinggi** — redesign baru (mockup lama masih placeholder), ranking shipment/item berdasar nilai.
19. **Laporan Shipment per Status/Bulan/Brand** — rekap jumlah shipment, filter interaktif.
20. **Laporan Performa Vendor DTD** — count/sum/average GAP per vendor.
21. **Laporan Pembayaran** — outstanding payment ke supplier & forwarder.
22. **Penilaian/Scoring Vendor** — ranking vendor gabungan kecepatan (GAP) + harga — **butuh keputusan bobot dari user dulu sebelum dikerjakan**.
23. **Export Excel/PDF** — export laporan-laporan di atas.

## Fase 4 — Smart Fitur (EWS)

24. **Pengaturan Aturan/Threshold** — halaman admin atur H- dan ambang persen per jenis alert.
25. **Pengaturan Notifikasi WhatsApp** — atur nomor/grup tujuan, jam kirim, role per jenis alert.
26. **Cron job pengecekan trigger** — job harian cek kondisi alert (keterlambatan, fraud) terhadap data transaksi.
27. **Integrasi WhatsApp (Baileys)** — kirim notifikasi ke server Baileys self-hosted yang sudah ada.
28. **Log Riwayat Alert** — simpan histori alert terkirim + status tindak lanjut, cegah alert dobel.
29. **Rekomendasi Vendor** — saran vendor saat input transaksi, skor dari harga + kecepatan + konsistensi + penalti red flag EWS.

## Catatan

- Fase 2 baru bisa jalan setelah Fase 1 terisi (relasi ke Master Data).
- Fase 3 (Dashboard/Laporan) query langsung dari data Transaksi, bukan tabel pivot terpisah — supaya real-time.
- Fase 4 dikerjakan paling akhir, setelah data Transaksi & Laporan berjalan stabil.
</content>
