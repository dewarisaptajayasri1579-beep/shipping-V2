# Revisi / Update List

Status: catatan mentah dari user, belum dibahas & belum dieksekusi. Akan dibahas dan dieksekusi satu per satu.

Tanggal dicatat: 2026-09-07

1. OK KPI Utama tidak perlu 
2. OK Pembayaran
3. OK Monitoring Iluvia digabung saja seperti yang lain
4. Early Warning System -> dipicu saat ETA barang sampai di Pelabuhan Indonesia (bukan ETA Gudang)
5. Update Delivery = Tgl Pickup di Vendor, ETD (keberangkatan dari Expedisi), ETA (Sampai di Pelabuhan Indonesia), Tgl ETA Gudang (sdh sampai di gudang PT)
6. Rata-rata GAP untuk Vendor Indonesia = rata-rata dari (Tgl sampai di Pelabuhan / ETA sd Tgl sampai di Gudang kantor) — sama datanya dengan poin 7, cuma dirata-ratakan per vendor
7. Gap Indo Vendor = Tgl ETA Indonesia sd Tgl ETA Gudang
8. Gap ETD sd ETA Gudang
9. Rekomendasi Vendor = Hapus
10. Import Shipment Dashboard
11. Tambah Shipment supaya tidak terjadi duplikasi data -> No PIB tidak mungkin, No Shipment ->
12. Saat tambah shipment -> bisa upload -> Invoice, PO, PIB
13. NO PIB diubah jadi PIB, semua gak perlu pakai "No"
14. 1 Invoice bisa beberapa PO, 1 PO bisa beberapa item
15. Rekap Excel
16. Bisa upload scan PO, Invoice, dll -> ke sistem -> nanti ke Google Drive

## Status Pembahasan

- [x] 1 — Menu "KPI Utama" dihapus dari sidebar & route /dashboard/kpi dihapus
- [x] 2 — Menu "Pembayaran" di Laporan dihapus dari sidebar & route /laporan/pembayaran dihapus
- [x] 3 — Menu "Monitoring Illuvia" dihapus dari sidebar, route /dashboard/illuvia & komponennya dihapus
- [x] 4 — EWS "eta-mendekat" & "pib-belum-lengkap" pakai ETA Pelabuhan Indonesia (bukan ETA Gudang)
- [x] 5 — Field tanggal Shipment diubah jadi 4: Tgl Pickup, ETD, ETA (Pelabuhan Indonesia), ETA Gudang
- [x] 6 — Tabel "Rata-rata Gap Vendor Indonesia (Forwarder)" ditambahkan di Laporan > Performa Vendor DTD
- [x] 7 — "Gap Indo Vendor" (ETA Pelabuhan → ETA Gudang) ditampilkan per shipment di baris detail tabel Shipment
- [x] 8 — "Gap ETD → ETA Gudang" ditampilkan per shipment di baris detail tabel Shipment
- [x] 9 — Menu "Rekomendasi Vendor" dihapus dari sidebar, route & komponennya dihapus (formula scoring tetap dipakai di Laporan Scoring Vendor)
- [ ] 10
- [x] 11 — Data model diubah jadi Shipment (header) -> Invoice[] -> PO[] -> Item[], No Invoice/No PO/PIB gak diulang lagi per baris item
- [x] 12 — Form Tambah/Kelola Shipment bisa upload scan PIB/Invoice/PO (disimpan lokal dulu, lihat poin 16)
- [x] 13 — Label "No Invoice/No PO/No PIB" jadi "Invoice/PO/PIB" (tanpa prefix "No") di seluruh UI
- [x] 14 — Sudah bisa 1 Invoice banyak PO, 1 PO banyak Item lewat halaman detail shipment
- [x] 15 — Tombol "Export Rekap Excel" ditambahkan langsung di halaman Input Shipment/Import (1 baris per item, CSV yang bisa dibuka di Excel)
- [~] 16 — Upload dokumen sudah jalan, tapi disimpan lokal (public/uploads) karena belum ada credentials Google Drive — tinggal ganti isi /api/upload kalau credentials sudah siap
