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

## Timeline / Urutan Eksekusi

Urutan di bawah ini **wajib** (bukan cuma nomor fase) — tiap baris butuh baris sebelumnya
yang jadi prasyaratnya selesai duluan, soalnya struktur datanya bertumpuk (PO → Invoice →
Shipment → Customs/Receiving/Finance → KPI turunan → Report).

| # | Pekerjaan | Fase | Prasyarat |
|---|---|---|---|
| 1 | Master Item & Supplier — field tambahan | 0 | — |
| 2 | Purchase Order (data model + halaman) | 1.1 | #1 |
| 3 | Supplier Invoice (pilih dari PO) | 1.2 | #2 |
| 4 | Shipment (dari Invoice, bisa gabung >1 Invoice) | 1.3 | #3 |
| 5 | Outstanding Engine (PO/Invoice/Shipment) | 1.4 | #2–4 |
| 6 | Migrasi data lama (`invoices.json` sekarang) ke PO/Invoice/Shipment baru | 1 | #2–5 |
| 7 | Milestone tanggal planned/actual (Pickup, ATD, ATA, dst) | 2.1 | #4 |
| 8 | Status Shipment/Barang otomatis dari milestone | 2.2 | #7 |
| 9 | Warehouse Receiving (entitas + Qty Received/discrepancy) | 2.3 | #4 |
| 10 | KPI Arrival-to-Warehouse Gap | 2.4 | #7, #9 |
| 11 | Customs/PIB (entitas + Customs Release Date) | 3.1 | #4, #7 |
| 12 | Forwarder Finance (entitas terpisah) | 3.2 | #4 |
| 13 | Reminder Engine + EWS rewrite (severity 4 level) | 4 | #7–12 |
| 14 | Dashboard baru (KPI cards, Need Attention, Timeline Overview) | 4 | #10, #13 |
| 15 | Reports (Shipment Summary, Lead Time x2, Outstanding, Payment, Forwarder Performance) | 5 | #2–14 |
| 16 | Hardening — Audit Trail, Attachment per tahap, migration script resmi, permission, export | 6 | bisa mulai paralel, tapi diselesaikan terakhir |

Praktiknya: **#1–6 (Fase 0 & 1) itu 1 paket kerja besar** yang harus selesai duluan sebelum
apa pun lainnya bisa jalan — ini yang direkomendasikan jadi target eksekusi berikutnya.

---

## Standar UX Input — wajib dipakai di SEMUA form baru

Setiap form baru yang dibangun di fase manapun (Tambah PO, Tambah Invoice, Tambah Shipment,
Update Milestone, Input Customs, Input Receiving, dst) **wajib** ikut pola keyboard-first
yang sudah dibangun & terbukti jalan di form Invoice sekarang — jangan bikin form baru yang
cuma bisa diisi pakai mouse.

Infra-nya sudah ada, reuse langsung (jangan bikin ulang):

- **`src/components/ui/Modal.tsx`** — begitu modal kebuka, field pertama otomatis fokus
  (`focusFirstField`, discope ke body content biar gak kepentok tombol close/X).
- **`src/lib/focus-nav.ts`** — `focusAdjacentField()`: Enter di kolom teks = pindah ke field
  berikutnya (kayak Tab), bukan diam/nyoba submit. `Tab` / `Shift+Tab` native browser tetap
  jalan sendiri asal urutan DOM field-nya sudah bener.
- **`src/components/ui/Select.tsx`** — dropdown otomatis kebuka begitu field dapat fokus
  (`onFocus` → `openDropdown()`), box pencarian langsung bisa diketik, **Panah Atas/Bawah**
  pilih opsi, **Enter** = pilih opsi **dan** otomatis lompat ke field berikutnya, **Escape**
  nutup dropdown & fokus balik ke kotaknya.
- **Urutan tombol footer modal**: tombol **Simpan** ditulis lebih dulu di DOM (baru
  `flex-row-reverse` biar visualnya tetap "Batal" kiri "Simpan" kanan) — supaya Enter dari
  field terakhir langsung nyampe ke Simpan, bukan mampir ke Batal dulu. Lihat contoh di
  `InvoiceTable.tsx` / `ShipmentDetailView.tsx` footer modal-nya.

Checklist tiap bikin form/modal baru:
- [ ] Field pertama auto-focus saat modal dibuka (otomatis, gratis, dari `Modal.tsx`).
- [ ] Semua field pakai komponen `Input`/`Select`/`CurrencyInput`/`DatePicker` dari `components/ui` (bukan `<input>` mentah) — biar otomatis dapat behavior di atas.
- [ ] Footer modal: `Simpan` ditulis duluan di JSX + `flex-row-reverse`, `Batal` belakangan.
- [ ] Kalau ada field yang genuinely "isi belakangan" (kayak field lanjutan di Edit Header Invoice), tetap taruh di urutan Tab yang logis, jangan disisipkan di tengah alur field-field awal.

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

### 1.1 Purchase Order (entitas baru) — SELESAI, di Postgres
- [x] Data model `PurchaseOrder` + `PurchaseOrderItem[]` — tabel `purchase_orders`/`purchase_order_items` di Postgres (`prisma/schema.prisma`), bukan JSON.
- [x] Status PO otomatis: DRAFT / OPEN / PARTIALLY INVOICED / FULLY INVOICED (`computePoStatus` di `src/lib/data/purchase.ts`). PARTIALLY/FULLY SHIPPED, PARTIALLY RECEIVED, COMPLETED, CANCELLED belum — nyusul pas Shipment & Receiving jalan.
- [x] Halaman list PO (`/purchase/orders`, `PurchaseOrderTable.tsx`) dengan expand lihat item & total. Detail page terpisah belum dibuat (masih cukup lewat expand row).
- [x] API `POST/PATCH/DELETE /api/purchase/orders`.

### 1.2 Supplier Invoice (rombak dari "Invoice" yang sekarang) — SELESAI, di Postgres
- [x] Cara input: pilih PO dulu → sistem tampilkan PO Item + sisa qty → user isi Qty Invoice Sekarang per item.
- [x] Data model `SupplierInvoice` + `InvoiceItem[]` di Postgres.
- [x] Validasi: Qty Invoice ≤ sisa Qty PO (`validateInvoiceQty`, sudah dites — over-invoice ditolak 400). Override + alasan & warning duplikat No Invoice belum dibuat.
- [x] Status Invoice otomatis: DRAFT / READY TO SHIP / PARTIALLY SHIPPED / FULLY SHIPPED (`computeInvoiceStatus`). CANCELLED belum.

### 1.3 Shipment (rombak dari "Shipment(=PO)" yang sekarang) — SELESAI, di Postgres
- [x] Cara input: menu Shipment → "Tambah Shipment" → pilih item dari Invoice manapun (tabel gabungan semua Invoice, bisa multi-select lintas invoice) + isi header dasar.
- [x] Data model `Shipment` (Shipment No auto `SHP-2026-00001` — sudah dites, increment per tahun) + `ShipmentItem[]` (ref Invoice Item, Qty Shipped, Qty Received). Origin/Destination Port, Planned Pickup, ETD, ETA sudah ada; milestone aktual (ATD/ATA/Customs Release/Warehouse Receipt) juga sudah ada di form Edit (bagian "Progress/Milestone Aktual") — jadi Fase 1.3 & sebagian Fase 2.1/2.2 (status otomatis) sekalian kebangun barengan.
- [x] Validasi: Qty Shipped ≤ Qty Invoice yang masih tersedia (`validateShipmentQty`, sudah dites — over-ship ditolak 400).
- [x] Field `isDraft` (Switch di form) — belum ada halaman/filter "Draft Shipments" terpisah, tapi datanya sudah bisa ditandai.

### 1.4 Outstanding Engine — SELESAI (versi dasar)
- [x] `invoicedQtyByPoItem`, `shippedQtyByInvoiceItem` di `src/lib/data/purchase.ts` — dipakai buat validasi qty & hitung status otomatis. Belum ada tampilan "Outstanding Qty" eksplisit di kolom tabel PO/Invoice (baru dipakai internal buat validasi & status) — nyusul di Laporan Outstanding (Fase 5) kalau dibutuhkan tampilan drill-down.

**Catatan:** karena bangun dari nol (bukan rombak data lama), migrasi `invoices.json` lama
(punya sendiri di `data/invoices.json`, masih dipakai halaman "Input Shipment/Import" lama
di Transaksi) **belum dilakukan** — data lama & data PO/Invoice/Shipment baru saat ini
jalan **berdampingan**, bukan menggantikan. Migrasi/penonaktifan halaman lama nyusul
setelah Fase 2-3 (Milestone, Customs, Finance) selesai, supaya sekali pindah.

---

## Fase 2 — Shipment Monitoring: Milestone & Status Otomatis

### 2.1 Milestone tanggal — SELESAI (kebangun barengan Fase 1.3)
- [x] Pickup Vendor: Planned Pickup Date + **Actual Pickup Date**.
- [x] Departure: **ETD** + **ATD**.
- [x] Arrival Indonesia: **ETA** + **ATA**.
- [x] Customs Release Date (milestone sendiri, beda dari Warehouse Receipt Date).
- [x] Warehouse Receipt Date (tanggal aktual, terpisah dari rencana).

### 2.2 Status Shipment & Status Barang otomatis — SELESAI
- [x] `computeShipmentStatus` di `src/lib/data/purchase.ts`: WAITING PICKUP → WAITING DEPARTURE → IN TRANSIT → CUSTOMS PROCESS → DELIVERY TO WAREHOUSE → DONE, dihitung dari milestone terisi. PENDING FORWARDER PAYMENT belum (nyusul pas Forwarder Finance di Fase 3.2).
- [ ] EWS engine (`src/lib/ews/engine.ts`) masih baca `statusBarang`/`statusShipment` manual dari model lama (Invoice→Shipment JSON) — belum disambungkan ke PO/Invoice/Shipment Postgres yang baru. Nyusul pas migrasi/pensiunan halaman lama.

### 2.3 Warehouse Receiving — SELESAI (versi ringkas, nempel di Shipment bukan entitas terpisah)
- [x] Field ditambahkan ke `Shipment`: `actualWarehouseId`, `receivedBy`, `receivingNotes`, `receivingDocumentUrl` (+ upload Proof of Receipt). `qtyReceived` per item sudah ada dari awal di `ShipmentItem`.
- [x] Qty Received boleh beda dari Qty Shipped — `shipmentDiscrepancies()` di `purchase.ts` menghitung selisihnya, tidak menimpa `qtyShipped`. Sudah dites (shipped 50, received 48 → tersimpan apa adanya).

### 2.4 KPI Arrival-to-Warehouse Gap — SELESAI
- [x] `arrivalToWarehouseGapDays()`, plus 2 KPI pendukung `customsLeadTimeDays()` & `postCustomsDeliveryDays()` di `purchase.ts`. Sudah dites: ATA 1 Sep → Warehouse Receipt 5 Sep = 4 hari.
- [x] Tampil sebagai kolom "Gap ATA→Gudang" di halaman Daftar Shipment. Belum tampil di Dashboard/Report (itu Fase 4 & 5).

---

## Fase 3 — Finance (Customs & Forwarder)

### 3.1 Customs/PIB — SELESAI (nempel di Shipment, bukan tabel terpisah — sama alasan kayak Warehouse Receiving)
- [x] Field: PIB, NOPEN, PIB Date, NOTUL (Ya/Tidak + catatan), Nilai Billing, Billing Date, Status Pembayaran PIB, Payment Date, scan dokumen. Customs Release Date sudah ada dari Fase 2.1.
- [x] KPI turunan: `customsLeadTimeDays()`, `postCustomsDeliveryDays()` di `purchase.ts` (ATA→Customs Release, Customs Release→Gudang). Belum ditampilkan di UI manapun (nyusul kalau Laporan dibahas).

### 3.2 Forwarder Finance — SELESAI (nempel di Shipment)
- [x] Field: No Invoice Forwarder, Tanggal Invoice, Nilai Tagihan, Status Dokumen (BELUM ADA INVOICE → INVOICE DITERIMA → DOKUMEN KE FINANCE → WAITING PAYMENT → PAID), Tanggal Dokumen ke Finance, Status & Tanggal Pembayaran, scan dokumen.
- [x] `computeShipmentStatus` diperbarui: status `DONE` sekarang butuh Forwarder Payment Status = SUDAH DIBAYAR juga (ada status baru "PENDING FORWARDER PAYMENT" di antara Delivery to Warehouse dan Done, sesuai rule spec §16).
- [ ] `PaymentStatusTable`/`payment-logs` (punya "Update Status Pembayaran" yang lama, buat model Invoice→Shipment JSON) **belum dirombak/disatuin** — Customs & Forwarder payment yang baru cuma bisa diupdate lewat form Edit Shipment ini, belum ada audit log/histori perubahan seperti yang lama. Nyusul di Fase 6 (Hardening) bareng Audit Trail generik.

**Sudah dites end-to-end:** PIB, NOPEN, NOTUL, Nilai Billing Customs, Status Bayar PIB, No Invoice Forwarder, Status Dokumen & Bayar Forwarder — semua tersimpan benar & tampil di kolom "Bayar PIB"/"Bayar Forwarder" di Daftar Shipment.

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
