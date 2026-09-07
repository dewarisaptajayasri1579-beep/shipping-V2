# Tahapan Implementasi — Import Shipment Monitoring & EWS

Acuan: `docs/import-shipment-monitoring-final-spec.md`. Dokumen ini memecah spec itu jadi
tahapan kerja konkret (file/entitas apa yang disentuh), dari kondisi aplikasi **sekarang**
(model `Invoice → Shipment(=PO) → Item`, dibangun bertahap sebelum spec ini ada) sampai ke
model final di spec (`PO → Supplier Invoice → Shipment → Customs → Receiving → Finance`).

Status: **belum dieksekusi** — ini rencana kerja, dibahas & dieksekusi bertahap per fase
(sama seperti pola kerja di `docs/rev.md`).

---

## 0. Kondisi Sekarang vs Target

| | Sekarang | Target (spec) |
|---|---|---|
| Entitas transaksi | `Invoice → Shipment(PO) → Item` (2 level, Shipment nested di 1 Invoice) | `PO → Invoice → Shipment → Receiving` (PO jadi akar sendiri, Shipment bisa gabung dari beberapa Invoice) |
| Qty | 1 angka per item | Qty Order → Qty Invoiced → Qty Shipped → Qty Received, tiap level ada outstanding |
| Tanggal | Cuma estimasi (ETD, ETA, ETA Gudang) | Planned vs Actual per milestone (ATD, ATA, Customs Release Date, Warehouse Receipt Date) |
| Status Shipment | Dipilih manual dari dropdown | Dihitung otomatis dari milestone yang sudah terisi |
| Customs/PIB | 1 field PIB nempel di Shipment | Entitas Customs sendiri: PIB, NOPEN, NOTUL, Billing, Payment |
| Receiving | Belum ada | Entitas sendiri: Qty Received per item + discrepancy |
| Forwarder Finance | 1 field status + nilai | Entitas sendiri: invoice forwarder, status dokumen, status bayar, tanggal |
| EWS severity | trigger/tidak (binary) | NORMAL / ATTENTION / WARNING / CRITICAL |
| Audit trail | Cuma log status pembayaran | Semua field penting: siapa, kapan, dari apa ke apa, alasan |

Karena gap-nya besar, migrasi dipecah 6 fase mengikuti urutan prioritas di spec §37, dan
tiap fase bisa dipakai (usable) sendiri — bukan nunggu semua fase selesai baru bisa dipakai.

---

## Fase 0 — Persiapan Master Data

Sebelum PO bisa dibuat, master data yang jadi rujukannya harus lengkap dulu.

- [ ] **Master Item** — tambah field yang belum ada: `Unit Price default` (opsional, buat prefill), pastikan `HS Code`, `Kode Internal`, `Active/Inactive` sudah lengkap (sebagian sudah ada dari `docs/menu.md`, cek `src/lib/data/master.ts`).
- [ ] **Master Supplier/Vendor** — sudah ada (`supplierStore`), cek field `Currency default` per supplier kalau mau prefill Currency di PO.
- [ ] (Opsional) **Master Port/Airport** — spec §4.1 tandai opsional, skip dulu kecuali dibutuhkan buat Origin/Destination Port di Shipment header.

File: `src/lib/data/master.ts`, halaman-halaman di `src/app/master/*`.

---

## Fase 1 — Core Transaction: PO → Invoice → Shipment

Ini fase paling besar — restrukturisasi total dari model `Invoice → Shipment → Item` yang
ada sekarang.

### 1.1 Purchase Order (entitas baru)
- [ ] Data model `PurchaseOrder` (header: No PO, Tanggal PO, Supplier, Brand, Country, Currency, Catatan, Status otomatis) + `PurchaseOrderItem[]` (Item, Qty Order, Unit Price, Total — auto).
- [ ] Status PO otomatis: DRAFT / OPEN / PARTIALLY INVOICED / FULLY INVOICED / PARTIALLY SHIPPED / FULLY SHIPPED / PARTIALLY RECEIVED / COMPLETED / CANCELLED — dihitung dari qty outstanding di level bawahnya (butuh Invoice & Shipment jalan dulu, jadi status penuh baru akurat setelah 1.2–1.3 selesai).
- [ ] Halaman list + detail PO (ringkasan Ordered/Invoiced/Shipped/Received Qty & Outstanding).
- [ ] API `POST/PATCH/DELETE /api/purchase/orders`.

### 1.2 Supplier Invoice (rombak dari "Invoice" yang sekarang)
- [ ] Cara input: pilih PO dulu → sistem tampilkan PO Item yang masih outstanding → user isi Qty Invoice Sekarang per item (bukan ketik ulang item/qty dari nol).
- [ ] Data model `SupplierInvoice` (header: No Invoice, Invoice Date, Supplier, ref PO, Country, Currency, attachment) + `InvoiceItem[]` (ref PO Item, Qty PO, Qty Already Invoiced, Qty Invoice Sekarang, Remaining Qty, Unit Price, Total — auto).
- [ ] Validasi: Qty Invoice ≤ sisa Qty PO (kecuali override + alasan); No Invoice duplikat untuk supplier sama → warning.
- [ ] Status Invoice otomatis: DRAFT / READY TO SHIP / PARTIALLY SHIPPED / FULLY SHIPPED / CANCELLED.

### 1.3 Shipment (rombak dari "Shipment(=PO)" yang sekarang)
- [ ] Cara input: dari halaman Invoice → tombol "Create Shipment" (pilih Invoice/Invoice Item, bisa gabung dari beberapa Invoice sekaligus), atau dari menu Shipment langsung.
- [ ] Data model `Shipment` (header: Shipment No otomatis `SHP-2026-00125`, Shipment Date, Origin Country, Mode AIR/SEA, Forwarder, Destination Warehouse, Origin/Destination Port opsional, Planned Pickup, ETD, ETA, Catatan) + `ShipmentItem[]` (ref Invoice Item + PO Item, Invoice Qty Available, Qty Shipped).
- [ ] Validasi: Qty Shipped ≤ Qty Invoice yang masih tersedia.
- [ ] Draft Shipment: shipment sudah direncanakan tapi Invoice final belum lengkap — tetap simpan normal flow PO → Invoice → Shipment sebagai jalur utama.

### 1.4 Outstanding Engine
- [ ] Fungsi hitung otomatis (mirip `shipment-helpers.ts` sekarang, diperluas): Outstanding Invoice Qty (PO), Outstanding Shipment Qty (Invoice), Outstanding Receiving Qty (Shipment) — dipakai di detail PO/Invoice/Shipment dan di Laporan Outstanding (Fase 5).

**Migrasi data lama:** data `invoices.json` yang sekarang (hasil migrasi sebelumnya dari Excel)
perlu di-split ulang jadi 3 file (`purchase_orders.json`, `supplier_invoices.json`,
`shipments.json`) — grouping by No PO dulu (jadi PO), lalu No Invoice di dalamnya (jadi
Invoice), baru Shipment dari kombinasi logistik yang ada.

---

## Fase 2 — Shipment Monitoring: Milestone & Status Otomatis

### 2.1 Milestone tanggal (ganti 4 field tanggal sekarang jadi pasangan planned/actual)
- [ ] Pickup Vendor: Planned Pickup Date (opsional) + **Actual Pickup Date**.
- [ ] Departure: **ETD** (sudah ada) + **ATD** (baru, aktual).
- [ ] Arrival Indonesia: **ETA** (sudah ada) + **ATA** (baru, aktual — ini START KPI terpenting).
- [ ] Customs Release Date (baru, milestone sendiri, beda dari ETA Gudang).
- [ ] Warehouse Receipt Date (ganti nama dari "ETA Gudang" yang sekarang, jadi tanggal aktual, bukan estimasi).

### 2.2 Status Shipment & Status Barang otomatis
- [ ] Ganti dropdown manual `Status Shipment`/`Status Barang` jadi fungsi turunan dari milestone terisi (rule di spec §16): WAITING PICKUP → WAITING DEPARTURE → IN TRANSIT → CUSTOMS PROCESS → DELIVERY TO WAREHOUSE → PENDING FORWARDER PAYMENT → DONE.
- [ ] Update EWS engine (`src/lib/ews/engine.ts`) & semua tempat yang baca `statusBarang`/`statusShipment` manual, ganti ke hasil fungsi turunan ini.

### 2.3 Warehouse Receiving (entitas baru)
- [ ] Data model `WarehouseReceiving` (Warehouse Destination, Actual Warehouse, Warehouse Receipt Date, Received By, Qty Received per item, Difference/Shortage, Condition/Notes, attachment Proof of Receipt).
- [ ] Qty Received boleh beda dari Qty Shipped — simpan sebagai discrepancy tercatat, bukan overwrite qty shipment.

### 2.4 KPI Arrival-to-Warehouse Gap
- [ ] Fungsi otomatis: `Arrival-to-Warehouse Lead Time = Warehouse Receipt Date - ATA Indonesia` (pola sama seperti `calcGapDays` yang sudah ada di `src/lib/gap.ts`, tinggal disesuaikan field-nya).
- [ ] Tampilkan di: Dashboard, Shipment Detail, EWS, Report, Forwarder Performance.

---

## Fase 3 — Finance (Customs & Forwarder)

### 3.1 Customs/PIB (entitas baru, pisah dari Shipment header)
- [ ] Field: No PIB, No NOPEN, PIB Date, NOTUL (Ya/Tidak + catatan), Nilai Billing, Billing Date, Status Pembayaran PIB, Payment Date, **Customs Release Date**.
- [ ] KPI turunan: `Customs Lead Time = Customs Release Date - ATA`, `Post-Customs Delivery Lead Time = Warehouse Receipt Date - Customs Release Date`.

### 3.2 Forwarder Finance (pisah dari field `nilaiForwarder`/`statusPembayaranFO` yang sekarang)
- [ ] Field: Forwarder, Forwarder Invoice Number, Forwarder Invoice Date, Nilai Tagihan, Status Dokumen (BELUM ADA INVOICE → INVOICE DITERIMA → DOKUMEN KE FINANCE → WAITING PAYMENT → PAID), Tanggal Dokumen ke Finance, Status Pembayaran, Tanggal Pembayaran, attachment.
- [ ] Rombak `PaymentStatusTable`/`payment-logs` API yang sekarang jadi 2 alur terpisah: Pembayaran Customs/PIB dan Pembayaran Forwarder (masing-masing tetap dengan audit log seperti sekarang).

---

## Fase 4 — Intelligence (Reminder, EWS, Dashboard)

- [ ] **Reminder Engine** — threshold configurable lewat Settings (bukan hardcode), reuse pola `ewsRuleConfigStore` yang sudah ada.
- [ ] **EWS rewrite** — tambah severity NORMAL/ATTENTION/WARNING/CRITICAL (sekarang cuma info/warning/critical, cek `src/lib/data/ews-constants.ts` & `AlertSeverity`), rule baru: ETA Delay, Customs Delay, Arrival-to-Warehouse Delay, Payment Delay — sebagian rule lama (`eta-mendekat`, `pib-belum-lengkap`) tinggal disesuaikan ke milestone baru.
- [ ] **Dashboard** — KPI cards baru (Active/In Transit/Customs Process/Delivery to Warehouse/Delayed/Pending Payment/Completed/Avg Lead Time), section "Need Attention" (list shipment CRITICAL/WARNING/ATTENTION), Shipment Timeline Overview (jumlah per tahap).

---

## Fase 5 — Reports

- [ ] Shipment Summary (rombak "Shipment per Status/Bulan/Brand" yang sekarang).
- [ ] **Arrival-to-Warehouse Lead Time** (baru — report prioritas utama menurut spec §22): avg/median/min/max, breakdown per Forwarder/AIR-SEA/Country/Supplier/Warehouse/Month.
- [ ] Customs Lead Time (baru).
- [ ] Forwarder Performance (rombak "Performa Vendor DTD" bagian forwarder yang sudah ada jadi laporan sendiri, lebih lengkap: on-time %, avg cost, pending payment count).
- [ ] Outstanding Report (baru — PO/Invoice/Shipment, drill-down sampai item).
- [ ] Payment Report (baru — PIB & Forwarder, dengan aging).
- [ ] Yang sudah ada & tetap dipakai: Top 20 Shipment Bernilai Tertinggi, Penilaian/Scoring Vendor (DTD), Export Excel/PDF generik.

---

## Fase 6 — Hardening

- [ ] **Audit Trail generik** — siapa/kapan/field apa/nilai lama→baru/alasan, untuk semua entitas (bukan cuma payment log seperti sekarang). Kemungkinan butuh 1 store baru `audit_logs.json` + helper `logChange()` dipanggil dari tiap API PATCH.
- [ ] **Attachment per tahap** — sudah ada infra upload lokal (`/api/upload`, `DocumentUploadField`) dari kerjaan sebelumnya, tinggal dipasang di tiap entitas baru (PO doc, Commercial Invoice, Packing List, AWB/BL, PIB, NOPEN, Billing, NOTUL, Proof of Receipt, Forwarder Invoice, Payment Proof).
- [ ] **Excel Migration** — script migrasi resmi ikut aturan spec §34 (group by No PO dulu, bukan by shipment name kayak migrasi sementara sebelumnya).
- [ ] Permission/Role — cek kebutuhan lebih detail dari role owner/admin/user yang sudah ada sekarang.
- [ ] Export Report — pastikan semua laporan baru di Fase 5 juga bisa di-export (reuse `exportToCsv`).

---

## Pekerjaan yang TIDAK berubah

- **Input Shipment DTD/Launching** (`shipmentDtdStore`) — beda alur bisnis (door-to-door, bukan impor customs biasa), spec ini tidak menyinggungnya, tetap seperti sekarang.
- **Perbandingan Rate Forwarder** — tetap seperti sekarang.
- **Master Data** (Brand, Supplier, Forwarder, Gudang, Item, Negara Asal, Project) — tetap, cuma ditambah field kecil di Fase 0.
- **Pricing** — halaman internal, tidak terkait spec ini.

---

## Menu Final — berapa banyak?

Spec §6 nyaranin struktur menu yang cukup granular (Shipment dipecah 4 menu: Active/Draft/
Completed/Calendar; Customs dipecah 3 menu: PIB-NOPEN/Billing/NOTUL). Supaya sidebar gak
kepanjangan, versi yang direkomendasikan di bawah **mengonsolidasi** yang granular itu jadi
1 halaman kerja dengan filter/tab di dalamnya (pola yang sudah dipakai di app ini, mis.
`FilterableTable` dengan `filterOptions` per status) — total tetap sama datanya, cuma lebih
sedikit klik.

Dikelompokkan jadi **9 grup sidebar**, urutannya ngikutin alur bisnis dulu (Purchase →
Shipment → Customs → Receiving → Finance), baru grup pendukung (Smart Fitur, Laporan,
Master Data, Lainnya):

```
Dashboard
└─ Ringkasan Status Barang                              [direvisi: KPI + Need Attention baru]

Purchase                                                  [BARU]
├─ Purchase Order
└─ Supplier Invoice

Shipment                                                   [rombak dari "Input Shipment/Import"]
└─ Daftar Shipment  (filter: Draft / Active / Completed)

Customs                                                    [BARU]
└─ PIB & Customs  (PIB, NOPEN, Billing, NOTUL — 1 halaman)

Receiving                                                   [BARU]
└─ Warehouse Receiving

Finance                                                     [rombak dari "Update Status Pembayaran"]
├─ Pembayaran Customs/PIB
└─ Pembayaran Forwarder

Smart Fitur (EWS)                                           [tetap]
├─ Pengaturan Aturan/Threshold
├─ Pengaturan Notifikasi WhatsApp
└─ Log Riwayat Alert

Transaksi Lain  (di luar cakupan spec ini)                  [tetap]
├─ Input Shipment DTD/Launching
└─ Perbandingan Rate Forwarder

Laporan
├─ Shipment Summary                    [rombak dari "Shipment per Status/Bulan/Brand"]
├─ Arrival-to-Warehouse Lead Time      [BARU — prioritas utama]
├─ Customs Lead Time                   [BARU]
├─ Forwarder Performance               [rombak dari bagian forwarder di "Performa Vendor DTD"]
├─ Outstanding Report                  [BARU]
├─ Payment Report                      [BARU]
├─ Top 20 Shipment Bernilai Tertinggi  [tetap]
├─ Penilaian/Scoring Vendor            [tetap]
└─ Export Excel/PDF                    [tetap]

Master Data                                                 [tetap, cuma field kecil nambah]
├─ Partner     — Supplier/Vendor, Forwarder
├─ Produk      — Brand, Item/Produk
├─ Lokasi      — Gudang, Negara Asal
└─ Lainnya     — Project/Kategori

Lainnya
└─ Pricing                                                  [tetap]
```

**Total: 30 menu** (versi konsolidasi di atas, direkomendasikan). Kalau ngikutin spec §6
literal — Shipment dipecah 4 menu (Active/Draft/Completed/Calendar) dan Customs dipecah 3
menu (PIB-NOPEN/Billing/NOTUL) — jadi **35 menu**.

2 menu lama yang hilang/gabung ke struktur baru: "Input Shipment/Import" (pecah jadi
Purchase + Shipment), "Update Status Pembayaran" (jadi Finance). Master Data, Smart Fitur
EWS, seluruh isi Laporan yang sudah ada, dan 2 sisa Transaksi (DTD & Rate Forwarder) tidak
berubah — cuma dikelompokkan ulang urutannya di sidebar.
