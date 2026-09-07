# Dokumentasi Final — Import Shipment Monitoring & Early Warning System

## 1. Tujuan Dokumen
Dokumen ini menjadi dasar implementasi untuk AI Coding Agent (Claude) dalam membangun modul transaksi, monitoring shipment, reminder/EWS, dan laporan untuk aplikasi monitoring impor.

Aplikasi tidak boleh sekadar memindahkan Excel menjadi form panjang. Data harus dipecah berdasarkan entitas bisnis dan alur transaksi yang benar.

Prinsip utama sistem:

> Input sekali di awal → update berdasarkan milestone → sistem otomatis menghitung status, gap, reminder, early warning, dan laporan.

---

# 2. Konsep Bisnis Utama

Alur transaksi utama:

1. Input Purchase Order (PO)
2. Input Supplier Invoice
3. Create Shipment
4. Update Progress Shipment
5. Update Customs / PIB
6. Update Warehouse Receiving
7. Update Forwarder / Finance
8. Shipment selesai
9. Sistem menghasilkan Reminder, EWS, KPI, dan Report

Urutan konsep:

```text
PURCHASE ORDER
    ↓
SUPPLIER INVOICE
    ↓
SHIPMENT
    ↓
PICKUP VENDOR
    ↓
ATD / DEPARTURE
    ↓
ATA INDONESIA
    ↓
CUSTOMS / PIB
    ↓
CUSTOMS RELEASE
    ↓
TIBA GUDANG
    ↓
FORWARDER / FINANCE
    ↓
DONE
```

PO adalah akar data transaksi.
Shipment adalah pusat monitoring operasional.

---

# 3. Masalah pada Excel Existing

Excel existing menggunakan flat table, sehingga satu baris mencampur banyak entitas sekaligus:

- Shipment
- Brand
- Country
- No Invoice
- No PO
- Item Code
- HS Code
- Description
- Qty
- Price Satuan
- Total Price
- No PIB
- No PIB NOPEN
- AIR/SEA
- Gudang
- Status Barang
- Tanggal Kedatangan
- Status Pembayaran PIB
- Nilai Billing
- Forwarder
- Status Pembayaran Forwarder
- Nilai Forwarder
- Status Shipment
- NOTUL
- Month
- Year
- Code Item Intern
- Tanggal Tiba MCHE

Masalah utama:

- No PO berulang pada setiap baris item.
- No Invoice berulang pada setiap baris item.
- Data shipment berulang pada setiap baris item.
- Status manual berpotensi tidak konsisten.
- Sulit menangani partial invoice, partial shipment, dan partial receiving.
- Sulit menghitung outstanding.
- Sulit melakukan reminder otomatis.
- Sulit melakukan analisa lead time.

Aplikasi baru tidak boleh menggunakan pola `1 row Excel = 1 transaksi`.

---

# 4. Struktur Entitas Bisnis

## 4.1 Master Data
Minimal master yang diperlukan:

- Supplier / Vendor
- Brand
- Country
- Item
- Warehouse / Gudang
- Forwarder
- User
- Optional: Port / Airport

Master Item minimal menyimpan:

- Item Code Supplier
- Internal Item Code
- Description
- Brand
- HS Code
- UOM
- Active/Inactive

Catatan:
- `CODE ITEM INTERN` dari Excel dipindahkan ke Master Item.
- `MONTH` dan `YEAR` tidak perlu diinput; dihitung otomatis dari tanggal transaksi/report.

---

# 5. Relasi Data yang Harus Didukung

Jangan membuat relasi kaku 1 PO = 1 Invoice = 1 Shipment.

Sistem harus mendukung:

- 1 PO memiliki banyak PO Item.
- 1 PO dapat memiliki beberapa Invoice.
- 1 Invoice memiliki banyak Invoice Item.
- 1 Invoice Item harus dapat merujuk ke PO Item.
- 1 Invoice dapat dikirim dalam beberapa Shipment.
- 1 Shipment dapat membawa beberapa Invoice atau beberapa Invoice Item.
- Shipment Item harus dapat merujuk ke Invoice Item.
- Qty Received dapat lebih kecil dari Qty Shipped.

Struktur konseptual:

```text
Purchase Order
└── Purchase Order Items
      ↓
Supplier Invoice
└── Invoice Items
      ↓
Shipment
└── Shipment Items
      ↓
Warehouse Receiving
```

Contoh:

```text
PO Qty        : 1,000
Invoice Qty   :   700
Shipment Qty  :   500
Received Qty  :   480
```

Sistem harus dapat menghitung:

- Belum di-Invoice = 300
- Sudah Invoice tapi belum Shipment = 200
- Shipped tapi belum Received = 20
- Received = 480

---

# 6. Menu Utama Aplikasi

Struktur menu yang disarankan:

```text
Dashboard

Purchase
├── Purchase Orders
└── Supplier Invoices

Shipment
├── Active Shipments
├── Draft Shipments
├── Completed Shipments
└── Shipment Calendar

Customs
├── PIB / NOPEN
├── Billing
└── NOTUL

Receiving
└── Warehouse Receiving

Finance
├── Customs / PIB Payment
└── Forwarder Payment

Reports
├── Shipment Summary
├── Arrival-to-Warehouse Lead Time
├── Customs Lead Time
├── Forwarder Performance
├── Outstanding PO / Invoice / Shipment
├── Delay & Early Warning
└── Cost / Payment Report
```

Catatan UX:
- User tidak harus selalu masuk melalui menu.
- Di halaman PO harus ada tombol `Create Invoice`.
- Di halaman Invoice harus ada tombol `Create Shipment`.
- Di halaman Shipment harus ada tombol `Update Progress`.

---

# 7. TRANSAKSI 1 — PURCHASE ORDER

## 7.1 Tujuan
Mencatat barang yang dipesan ke supplier/vendor.

PO merupakan akar transaksi.

## 7.2 PO Header
Field minimal:

- No PO
- Tanggal PO
- Supplier / Vendor
- Brand (opsional jika supplier sudah mewakili brand)
- Country / Country of Origin
- Currency
- Catatan
- Status PO (otomatis)

## 7.3 PO Detail
Per item:

- Item Code
- Description (auto dari Master Item)
- HS Code (auto dari Master Item)
- Qty Order
- Unit Price (jika PO mencatat harga)
- Total

## 7.4 Status PO
Status sebaiknya dihitung otomatis:

- DRAFT
- OPEN
- PARTIALLY INVOICED
- FULLY INVOICED
- PARTIALLY SHIPPED
- FULLY SHIPPED
- PARTIALLY RECEIVED
- COMPLETED
- CANCELLED

## 7.5 Informasi Ringkasan PO
Di detail PO tampilkan:

- Ordered Qty
- Invoiced Qty
- Shipped Qty
- Received Qty
- Outstanding Invoice Qty
- Outstanding Shipment Qty
- Outstanding Receiving Qty

---

# 8. TRANSAKSI 2 — SUPPLIER INVOICE

## 8.1 Tujuan
Mencatat invoice/tagihan supplier berdasarkan PO.

## 8.2 Cara Input
Admin memilih PO terlebih dahulu.

Setelah PO dipilih, sistem menampilkan semua PO Item yang masih memiliki outstanding.

User tidak perlu input ulang Item Code/Description dari nol.

## 8.3 Invoice Header
Field minimal:

- No Invoice
- Invoice Date
- Supplier
- Referensi PO
- Country
- Currency
- Catatan
- Attachment Invoice (opsional)

## 8.4 Invoice Detail
Per item:

- PO Item Reference
- Item Code
- Description
- Qty PO
- Qty Already Invoiced
- Qty Invoice Sekarang
- Remaining Qty
- Unit Price
- Total Price

## 8.5 Validasi
- Qty Invoice tidak boleh melebihi sisa Qty PO, kecuali ada hak override dengan alasan.
- Duplicate invoice number untuk supplier yang sama harus dicegah atau diberi warning.
- Total Invoice dihitung otomatis dari detail.

## 8.6 Status Invoice
- DRAFT
- READY TO SHIP
- PARTIALLY SHIPPED
- FULLY SHIPPED
- CANCELLED

---

# 9. TRANSAKSI 3 — CREATE SHIPMENT

## 9.1 Tujuan
Membuat satu shipment dari satu atau beberapa Invoice/Invoice Item.

Shipment adalah pusat monitoring operasional setelah dibuat.

## 9.2 Cara Input
Admin dapat membuat Shipment dari:

- halaman Invoice → tombol `Create Shipment`, atau
- menu Shipment → `Create Shipment` → pilih Invoice/Invoice Item.

## 9.3 Shipment Header
Field awal:

- Shipment No (otomatis, contoh `SHP-2026-00125`)
- Shipment Date / Created Date
- Origin Country
- Mode: AIR / SEA
- Forwarder
- Destination Warehouse
- Origin Port/Airport (opsional)
- Destination Port/Airport (opsional)
- Planned Pickup Date (opsional)
- ETD
- ETA
- Catatan

## 9.4 Shipment Items
Sistem membawa item dari Invoice terpilih.

Per item:

- Invoice Reference
- PO Reference
- Item Code
- Description
- Invoice Qty Available
- Qty Shipped

## 9.5 Validasi
- Qty Shipped tidak boleh melebihi Qty Invoice yang masih tersedia.
- Shipment harus dapat membawa sebagian item dari Invoice.
- Shipment dapat membawa item dari beberapa Invoice jika dibutuhkan.

## 9.6 Draft Shipment
Sediakan Draft Shipment untuk kondisi operasional di mana shipment sudah direncanakan tetapi Invoice final belum lengkap.

Namun normal flow tetap:

`PO → Invoice → Shipment`.

---

# 10. UPDATE PROGRESS SHIPMENT

Setelah Shipment dibuat, user tidak membuat transaksi baru setiap ada perubahan. User membuka shipment yang sama kemudian mengisi milestone/progress.

Prinsip:

> Admin menginput fakta/tanggal aktual. Sistem yang menentukan status.

Kolom Excel existing yang berubah menjadi progress antara lain:

- No PIB
- No PIB NOPEN
- Status Barang
- Tanggal Kedatangan
- Status Pembayaran PIB
- Nilai Billing
- Status Pembayaran Forwarder
- Nilai Forwarder
- Status Shipment
- NOTUL
- Tanggal Tiba MCHE (jika memang masih relevan setelah konfirmasi bisnis)

Namun struktur baru harus menggunakan milestone yang lebih jelas.

---

# 11. MILESTONE SHIPMENT

## 11.1 Milestone 1 — Pickup Vendor
Field:

- Planned Pickup Date (opsional)
- Actual Pickup Date
- Catatan

Label UI disarankan:

`Tanggal Pickup Vendor`

Status setelah aktual pickup terisi:

`PICKED UP`

---

## 11.2 Milestone 2 — Departure dari Origin
Field:

- ETD — Estimated Time/Date of Departure
- ATD — Actual Time/Date of Departure

Label UI:

- `ETD / Estimasi Berangkat`
- `ATD / Aktual Berangkat`

Jika ATD terisi dan ATA belum ada:

`IN TRANSIT`

---

## 11.3 Milestone 3 — Arrival Indonesia
Field:

- ETA — Estimated Time/Date of Arrival
- ATA — Actual Time/Date of Arrival

Label UI:

- Untuk SEA: `Tiba Pelabuhan Indonesia / ATA`
- Untuk AIR: `Tiba Bandara Indonesia / ATA`

ATA Indonesia adalah **START KPI TERPENTING** dalam aplikasi.

---

# 12. KPI PALING PENTING — ARRIVAL TO WAREHOUSE GAP

KPI utama aplikasi adalah gap antara:

1. Barang tiba di pelabuhan/bandara Indonesia (`ATA Indonesia`)
2. Barang tiba dan diterima di gudang kantor (`Warehouse Receipt Date`)

Nama KPI yang disarankan:

- `Arrival-to-Warehouse Lead Time`
- atau UI Indonesia: `Lead Time Tiba Indonesia → Gudang`

Formula:

```text
Arrival-to-Warehouse Lead Time
= Warehouse Receipt Date - ATA Indonesia
```

Admin tidak boleh menginput nilai gap secara manual.

Sistem harus menghitung otomatis.

Contoh:

```text
ATA Indonesia  : 10 Sep 2026
Tiba Gudang    : 16 Sep 2026
Gap            : 6 Hari
```

KPI ini harus muncul di:

- Dashboard
- Shipment Detail
- EWS
- Report
- Forwarder Performance

---

# 13. CUSTOMS / PIB

Setelah barang tiba di Indonesia, sistem masuk ke proses Customs.

## 13.1 Field Customs
Minimal:

- No PIB
- No NOPEN
- PIB Date (opsional)
- NOTUL: Ya/Tidak
- Catatan NOTUL
- Nilai Billing
- Billing Date
- Status Pembayaran PIB
- Payment Date
- Customs Release Date

## 13.2 Customs Release Date
Field ini sangat penting untuk menjelaskan di mana delay terjadi.

Dengan data:

```text
ATA Indonesia
↓
Customs Release
↓
Tiba Gudang
```

sistem dapat menghitung:

### Customs Lead Time

```text
Customs Lead Time
= Customs Release Date - ATA Indonesia
```

### Post-Customs Delivery Lead Time

```text
Post-Customs Delivery Lead Time
= Warehouse Receipt Date - Customs Release Date
```

### Total Arrival-to-Warehouse

```text
Arrival-to-Warehouse Lead Time
= Warehouse Receipt Date - ATA Indonesia
```

Dengan demikian manajemen dapat mengetahui apakah delay terjadi di customs atau di pengiriman lokal setelah clearance.

---

# 14. WAREHOUSE RECEIVING

## 14.1 Field
- Warehouse Destination
- Actual Warehouse
- Warehouse Receipt Date
- Received By
- Qty Received per Item
- Difference Qty / Shortage
- Condition / Notes
- Attachment Proof of Receipt (opsional)

## 14.2 Validasi
Qty Received dapat berbeda dari Qty Shipped.

Sistem harus mencatat discrepancy.

Contoh:

```text
Shipped : 500
Received: 480
Difference: -20
```

Perbedaan tidak boleh sekadar mengubah qty shipment; harus tercatat sebagai discrepancy/audit.

---

# 15. FORWARDER / FINANCE

Kolom Excel terkait forwarder:

- Forwarder
- Status Pembayaran Forwarder
- Nilai Forwarder
- Status Shipment (`PENDING PEMBAYARAN FW`)

Di aplikasi, pecah menjadi lebih jelas.

## 15.1 Field
- Forwarder
- Forwarder Invoice Number (opsional)
- Forwarder Invoice Date
- Nilai Tagihan Forwarder
- Status Dokumen
- Tanggal Dokumen ke Finance
- Status Pembayaran
- Tanggal Pembayaran
- Attachment Invoice/Proof (opsional)

## 15.2 Status Dokumen Forwarder
Contoh:

- BELUM ADA INVOICE
- INVOICE DITERIMA
- DOKUMEN KE FINANCE
- WAITING PAYMENT
- PAID

---

# 16. STATUS SHIPMENT — HARUS OTOMATIS

Jangan meminta user memilih `Status Shipment` secara manual jika status dapat ditentukan dari milestone.

Rule contoh:

```text
Actual Pickup kosong
→ WAITING PICKUP

Actual Pickup terisi
ATD kosong
→ WAITING DEPARTURE

ATD terisi
ATA kosong
→ IN TRANSIT

ATA terisi
Customs Release kosong
→ CUSTOMS PROCESS

Customs Release terisi
Warehouse Receipt kosong
→ DELIVERY TO WAREHOUSE

Warehouse Receipt terisi
Forwarder belum selesai
→ PENDING FORWARDER PAYMENT

Warehouse Receipt terisi
PIB/payment selesai
Forwarder payment selesai
→ DONE
```

`STATUS BARANG` lama dari Excel juga sebaiknya diturunkan otomatis dari timeline, bukan diinput manual.

---

# 17. SHIPMENT DETAIL UI

Shipment Detail harus menjadi pusat monitoring.

Contoh struktur:

```text
SHP-2026-00125
France → Indonesia
SEA • RICA

PO      : SOC018/25
Invoice : INV142530885

Current Status: CUSTOMS PROCESS

TIMELINE
✓ Shipment Created
✓ Pickup Vendor      03 Sep 2026
✓ ATD                06 Sep 2026
✓ ATA Indonesia      30 Sep 2026
● Customs / PIB      In Progress
○ Customs Release
○ Tiba Gudang
○ Forwarder Payment
```

Tab yang disarankan:

- Overview
- Items
- Documents
- Timeline
- Customs
- Receiving
- Payments
- Activity Log

---

# 18. REMINDER SYSTEM

Reminder harus berjalan berdasarkan milestone dan due date.

Contoh reminder:

## 18.1 ETA Passed
Jika:

- ETA sudah lewat
- ATA masih kosong

Maka:

`Shipment terlambat tiba / ATA belum diupdate.`

## 18.2 ATA sudah ada tetapi PIB belum ada
Jika:

- ATA terisi
- No PIB kosong selama X hari

Maka warning customs.

## 18.3 Customs terlalu lama
Jika:

- ATA terisi
- Customs Release kosong
- elapsed > threshold

Maka:

`Customs Delay`.

## 18.4 Tiba Indonesia tetapi belum Gudang
Jika:

- ATA terisi
- Warehouse Receipt kosong

Sistem tampilkan Current Gap secara live:

```text
Current Arrival-to-Warehouse Gap: 6 Hari
```

## 18.5 Forwarder belum dibayar
Jika:

- Warehouse Receipt sudah ada
- Forwarder Payment belum paid

Maka reminder ke finance.

Threshold reminder tidak boleh hardcode. Buat konfigurasi melalui Settings / Business Rule.

---

# 19. EARLY WARNING SYSTEM (EWS)

EWS harus membedakan severity minimal:

- NORMAL
- ATTENTION
- WARNING
- CRITICAL

Contoh rule:

### ETA Delay
ETA lewat + ATA kosong → Warning/Critical.

### Customs Delay
ATA sudah X hari + Customs Release kosong → Warning/Critical.

### Arrival-to-Warehouse Delay
ATA sudah ada + Warehouse belum tiba + elapsed melebihi target → Warning/Critical.

### Payment Delay
Barang sudah diterima + Forwarder belum dibayar setelah X hari → Warning.

Semua threshold harus configurable.

---

# 20. DASHBOARD

Dashboard harus fokus pada kondisi operasional, bukan sekadar jumlah data.

## 20.1 KPI Cards
Minimal:

- Active Shipments
- In Transit
- Customs Process
- Delivery to Warehouse
- Delayed Shipments
- Pending Payment
- Completed Shipments
- Average Arrival-to-Warehouse Lead Time

## 20.2 Need Attention
Tampilkan shipment yang memerlukan tindakan.

Contoh:

```text
CRITICAL — SHP-00125
ATA: 01 Sep
Belum tiba gudang
Current Gap: 7 hari

WARNING — SHP-00139
ATA: 03 Sep
No PIB belum diinput

ATTENTION — SHP-00146
Barang sudah tiba gudang
Forwarder belum dibayar
```

## 20.3 Shipment Timeline Overview
Tampilkan jumlah shipment per tahap:

- Waiting Pickup
- Waiting Departure
- In Transit
- Customs
- Delivery to Warehouse
- Pending Finance
- Done

---

# 21. REPORT — SHIPMENT SUMMARY

Filter minimal:

- Periode
- Supplier
- Country
- Forwarder
- AIR/SEA
- Warehouse
- Status
- PO
- Invoice

Kolom report:

- Shipment No
- PO
- Invoice
- Supplier
- Origin
- Mode
- Forwarder
- ETD
- ATD
- ETA
- ATA
- Customs Release
- Warehouse Receipt
- Current Status
- Arrival-to-Warehouse Lead Time

---

# 22. REPORT — ARRIVAL TO WAREHOUSE LEAD TIME

Ini report prioritas utama.

## 22.1 KPI
- Average Lead Time
- Median Lead Time
- Minimum
- Maximum
- Total Shipment
- On Target
- Over Target

## 22.2 Breakdown
Harus dapat dianalisa berdasarkan:

- Forwarder
- AIR vs SEA
- Country Origin
- Supplier
- Warehouse
- Month
- Year

Contoh:

```text
RICA   : 3.7 hari average
FEDEX  : 2.4 hari average
```

Threshold target berasal dari konfigurasi perusahaan.

---

# 23. REPORT — CUSTOMS LEAD TIME

Formula:

```text
Customs Lead Time
= Customs Release Date - ATA Indonesia
```

Informasi:

- Avg Customs Lead Time
- Fastest
- Slowest
- Shipment > Target
- Shipment dengan NOTUL
- Billing belum dibayar

Breakdown:

- Forwarder
- Country
- AIR/SEA
- Month

---

# 24. REPORT — POST CUSTOMS DELIVERY

Formula:

```text
Post-Customs Delivery
= Warehouse Receipt Date - Customs Release Date
```

Tujuannya memisahkan masalah customs dari masalah local delivery.

---

# 25. REPORT — FORWARDER PERFORMANCE

Per Forwarder tampilkan:

- Total Shipment
- Average ATD → ATA
- Average ATA → Customs Release
- Average Customs Release → Warehouse
- Average Arrival → Warehouse
- On-Time %
- Delayed Shipment Count
- Average Forwarder Cost
- Pending Payment Count

Catatan:
Jangan menyimpulkan forwarder buruk hanya dari satu shipment. Report adalah statistik, bukan judgement otomatis.

---

# 26. REPORT — OUTSTANDING

## 26.1 Outstanding PO
- PO Qty
- Invoiced Qty
- Outstanding Invoice Qty

## 26.2 Outstanding Invoice
- Invoice Qty
- Shipped Qty
- Outstanding Shipment Qty

## 26.3 Outstanding Shipment
- Shipped Qty
- Received Qty
- Outstanding Receiving Qty

Sediakan drill-down sampai Item Code.

---

# 27. REPORT — PAYMENT

## PIB / Customs
- Billing Value
- Paid / Unpaid
- Payment Date
- Aging

## Forwarder
- Forwarder Invoice
- Forwarder Value
- Document Status
- Paid / Unpaid
- Aging

---

# 28. FIELD MAPPING EXCEL → SISTEM BARU

| Excel | Sistem Baru |
|---|---|
| SHIPMENT | Shipment No / Display Name |
| BRAND | Master Brand / Supplier |
| COUNTRY | Supplier / Origin Country |
| NO INVOICE | Supplier Invoice Header |
| NO PO | Purchase Order Header |
| ITEM CODE | Master Item / Transaction Item Ref |
| HS CODE | Master Item / Customs Override |
| DESCRIPTION | Master Item |
| QTY | Invoice Item / Shipment Item Qty sesuai konteks |
| PRICE SATUAN | Invoice Item |
| TOTAL PRICE | Invoice Item Auto Calculation |
| NO PIB | Customs Progress |
| NO PIB NOPEN | Customs Progress |
| AIR/SEA | Shipment Header |
| GUDANG | Shipment Destination / Receiving |
| STATUS BARANG | Auto Derived Status |
| TANGGAL KEDATANGAN | Dipecah menjadi ETA/ATA/Warehouse Receipt |
| STATUS PEMBAYARAN PIB | Customs Finance |
| NILAI BILLING | Customs Finance |
| FORWARDER | Shipment Header |
| STATUS PEMBAYARAN FORWARDER | Forwarder Finance |
| NILAI FORWARDER | Forwarder Finance |
| STATUS SHIPMENT | Auto Derived Status |
| NOTUL | Customs |
| MONTH | Auto Derived Report Field |
| YEAR | Auto Derived Report Field |
| CODE ITEM INTERN | Master Item |
| TANGGAL TIBA MCHE | Milestone internal; pertahankan hanya jika bisnis mengonfirmasi fungsinya |

---

# 29. TANGGAL SHIPMENT YANG WAJIB DISTANDARKAN

Gunakan istilah dan field berikut:

1. Planned Pickup Date
2. Actual Pickup Date
3. ETD — Estimated Departure
4. ATD — Actual Departure
5. ETA — Estimated Arrival Indonesia
6. ATA — Actual Arrival Indonesia
7. Customs Release Date
8. Warehouse Receipt Date

Optional:

- Gate Out Date
- Local Delivery Start Date
- MCHE Arrival Date jika memang merupakan milestone internal terpisah

---

# 30. DATA DERIVED / OTOMATIS

Field berikut tidak boleh diinput manual jika dapat dihitung:

- Total Price = Qty × Unit Price
- Month
- Year
- Current Shipment Status
- Current Item Outstanding
- PO Outstanding
- Invoice Outstanding
- Shipment Outstanding
- ATD → ATA Transit Time
- ATA → Customs Release Lead Time
- Customs Release → Warehouse Lead Time
- ATA → Warehouse Lead Time
- Delay Days
- Aging Payment
- EWS Severity

---

# 31. AUDIT TRAIL

Semua update penting harus tercatat.

Minimal log:

- siapa melakukan update
- kapan
- field yang berubah
- nilai sebelum
- nilai sesudah
- alasan perubahan jika edit data historis

Contoh:

```text
07 Sep 2026 14:20
Admin A
ATA changed
Old: 05 Sep 2026
New: 06 Sep 2026
Reason: Correction from forwarder document
```

Jangan hard delete transaksi yang sudah digunakan downstream.
Gunakan cancel/reversal atau status inactive sesuai konteks.

---

# 32. DOKUMEN / ATTACHMENT

Aplikasi sebaiknya menyediakan attachment pada masing-masing tahap.

Contoh:

PO:
- PO Document

Invoice:
- Commercial Invoice
- Packing List

Shipment:
- AWB / BL
- Forwarder Document

Customs:
- PIB
- NOPEN
- Billing
- NOTUL

Receiving:
- Proof of Delivery
- Goods Receipt

Finance:
- Forwarder Invoice
- Payment Proof

---

# 33. SEARCH & FILTER

Global search minimal dapat mencari berdasarkan:

- Shipment No
- No PO
- No Invoice
- Item Code
- Supplier
- Forwarder
- PIB
- NOPEN

List harus memiliki filter dan saved filter jika memungkinkan.

---

# 34. IMPORT DATA EXCEL EXISTING

Saat migrasi data existing:

1. Jangan import setiap Excel row sebagai Shipment baru.
2. Group berdasarkan No PO.
3. Buat Invoice berdasarkan No Invoice.
4. Group detail Item berdasarkan Invoice.
5. Bentuk Shipment berdasarkan kombinasi logistik yang relevan dari data existing.
6. Mapping milestone tanggal existing.
7. Month/Year diabaikan sebagai input karena akan dihitung ulang.
8. Status Shipment lama digunakan hanya sebagai referensi migrasi; status baru harus dihitung ulang jika data milestone cukup.

Perlu data-cleaning untuk duplicate, blank, dan value `0` yang sebenarnya berarti kosong.

---

# 35. BUSINESS RULE PENTING

1. PO dibuat sebelum Invoice pada normal flow.
2. Invoice dibuat dengan referensi PO.
3. Shipment dibuat dengan referensi Invoice/Invoice Item.
4. Shipment dapat partial.
5. Satu Invoice dapat mempunyai beberapa Shipment.
6. Satu Shipment dapat membawa beberapa Invoice/Invoice Item.
7. Qty tidak boleh melebihi source outstanding tanpa override resmi.
8. Admin mengisi milestone aktual; status dihitung sistem.
9. Arrival-to-Warehouse Gap dihitung otomatis dari ATA dan Warehouse Receipt Date.
10. Semua threshold warning harus configurable.
11. Semua perubahan kritis masuk audit trail.
12. Payment dan customs tidak boleh mengubah data barang secara langsung.
13. Jika data historis dikoreksi, semua derived KPI harus recalculated.

---

# 36. ACCEPTANCE CRITERIA UTAMA

Implementasi dianggap memenuhi kebutuhan jika:

- User dapat membuat PO dengan banyak item.
- User dapat membuat Invoice dari PO tanpa input item ulang.
- Sistem menghitung sisa Qty PO.
- User dapat membuat Shipment dari Invoice tanpa input item ulang.
- Sistem mendukung partial shipment.
- User dapat mengupdate Pickup, ATD, ATA, Customs, dan Warehouse secara bertahap.
- Status Shipment berubah otomatis berdasarkan milestone.
- Sistem menghitung `ATA → Warehouse` secara otomatis.
- Sistem dapat memisahkan `ATA → Customs Release` dan `Customs Release → Warehouse`.
- Sistem memberikan reminder untuk overdue milestone.
- Dashboard menampilkan shipment yang perlu perhatian.
- Report dapat difilter berdasarkan Forwarder, Country, AIR/SEA, Supplier, dan periode.
- Report dapat menampilkan average Arrival-to-Warehouse Lead Time.
- Sistem memiliki audit trail.
- Sistem tidak mengandalkan Month/Year manual.
- Data item tidak perlu diketik berulang di PO, Invoice, dan Shipment.

---

# 37. PRIORITAS IMPLEMENTASI UNTUK AI CODING AGENT

## Phase 1 — Core Transaction
1. Master Item / Supplier / Forwarder / Warehouse
2. Purchase Order
3. Supplier Invoice
4. Shipment
5. Shipment Items

## Phase 2 — Shipment Monitoring
6. Milestone Timeline
7. Pickup / ETD / ATD / ETA / ATA
8. Customs / PIB / NOPEN
9. Customs Release
10. Warehouse Receiving
11. Automatic Shipment Status

## Phase 3 — Finance
12. PIB Billing & Payment
13. Forwarder Invoice & Payment

## Phase 4 — Intelligence
14. Reminder Engine
15. EWS Rules
16. Arrival-to-Warehouse KPI
17. Dashboard Need Attention

## Phase 5 — Reports
18. Shipment Summary
19. Arrival-to-Warehouse Lead Time
20. Customs Lead Time
21. Forwarder Performance
22. Outstanding Report
23. Payment Report

## Phase 6 — Hardening
24. Audit Trail
25. Attachment
26. Excel Migration
27. Permission / Role
28. Export Report

---

# 38. INTI PRODUK

Aplikasi harus diposisikan sebagai:

> Import Shipment Monitoring & Early Warning System

Bukan sekadar aplikasi input data impor.

Nilai utama sistem:

1. Mengurangi input data berulang.
2. Menjaga relasi PO → Invoice → Shipment.
3. Menunjukkan posisi shipment saat ini.
4. Mengingatkan admin jika milestone terlambat.
5. Mengukur delay setelah barang tiba di Indonesia.
6. Menjelaskan apakah delay terjadi di Customs atau Local Delivery.
7. Mengukur performa forwarder berdasarkan data.
8. Memberikan laporan outstanding dan pembayaran.

KPI paling penting:

> **Arrival-to-Warehouse Lead Time = Tanggal Tiba Gudang - ATA Indonesia**

Dan KPI pendukung:

> **Customs Lead Time = Customs Release Date - ATA Indonesia**

> **Post-Customs Delivery Lead Time = Warehouse Receipt Date - Customs Release Date**

Dengan tiga KPI ini sistem dapat menunjukkan secara objektif sumber delay setelah barang tiba di Indonesia.
