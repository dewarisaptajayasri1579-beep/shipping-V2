# Alur Kerja "DASHBOARD IMPORT.xlsx" (Proses Manual Saat Ini)

Analisis dilakukan dengan membaca langsung isi workbook `DASHBOARD IMPORT.xlsx` (10 sheet, ~2.3MB, sheet terbesar berisi 1016 baris data).

## Gambaran umum

File ini adalah tracker impor barang & customs untuk beberapa brand (FLUKE, SOCOMEC, ALLWAY, KINGLUMI, OBO, dan lini produk ILLUVIA), melibatkan forwarder (FEDEX, RICA, INTERLINK), gudang (YASUNLITEX), dan proses PIB (Pemberitahuan Impor Barang / customs clearance). Semuanya dikelola lewat input manual + pivot table Excel yang harus di-refresh manual.

## Peta 10 sheet

| Sheet | Peran | Isi |
|---|---|---|
| **DATABASE** | Data induk (raw) | 1016 baris, 25 kolom: BULAN, SHIPMENT, BRAND, COUNTRY, NO INVOICE, NO PO, ITEM CODE, HS CODE, DESCRIPTION, QTY, PRICE, TOTAL PRICE, NO PIB, AIR/SEA, GUDANG, STATUS BARANG, TANGGAL KEDATANGAN, STATUS PEMBAYARAN PI (ke supplier), NILAI BILLING, FORWARDER, STATUS PEMBAYARAN FO (ke forwarder), NILAI FORWARDER, STATUS SHIPMENT |
| **SPREADSHEET** | Duplikat/sheet kerja dari DATABASE | Struktur kolom identik dengan DATABASE. Tampaknya jadi tempat input awal / staging sebelum disalin ke DATABASE — ditemukan indikasi sudah ada bug ringan (kolom BULAN terisi di SPREADSHEET tapi kosong di DATABASE pada baris yang sama) |
| **DATABASE DTD** | Data induk untuk shipment tipe "Door to Door" / launching produk | 412 baris: NO, SHIPMENT, PROJECT, COUNTRY, BRAND, ITEM NUMBER, DESCRIPTION, QTY, PRICE, TOTAL, KG, SAMPE AGENT (tgl), SAMPE MCHE (tgl), **GAP** (selisih hari agent→gudang MCH, dihitung manual), VENDOR, STATUS, kode internal produk Illuvia, dll |
| **PIV** | Pivot table dari DATABASE | Rekap Count of SHIPMENT per STATUS BARANG, per BRAND, per MONTH, dll — sumber untuk dashboard |
| **PIV DTD** | Pivot table dari DATABASE DTD | Rekap performa VENDOR (Count of GAP, Sum of GAP, Average GAP) + status shipment DTD |
| **RATE FW** | Tabel rate forwarder | Daftar biaya per charge type (Handling, Trucking, Meal, Dokumen, PIB EDI) per ukuran kontainer (20'/40'/40HC/LCL) dan incoterm (CIF/EXW/FOB), plus mini-pivot rate per kombinasi |
| **COMPARE** | Perbandingan rate forwarder | Membandingkan rate INTERLINK vs RICA per ukuran kontainer, dipakai untuk memilih forwarder termurah |
| **DASHBOARD** | Tampilan utama | Tidak berisi data mentah — isinya slicer (filter interaktif) yang terhubung ke pivot table PIV/PIV DTD |
| **TOP 20 HIGHEST** | Chart Top 20 shipment/item bernilai tertinggi | 3 chart, sumber dari pivot |
| **ILLUVIA MONITORING** | Dashboard khusus brand Illuvia | Sheet terpisah untuk monitoring lini produk Illuvia |

## Alur kerja manual saat ini

1. **Input per shipment** — staff mengetik manual tiap baris transaksi impor ke sheet SPREADSHEET/DATABASE: invoice, PO, item code, HS code, qty, harga, no PIB, jalur AIR/SEA, gudang tujuan, tanggal kedatangan, status pembayaran ke supplier, status pembayaran ke forwarder, dan status shipment keseluruhan.
2. **Input khusus DTD/launching** — untuk shipment door-to-door (produk baru/launching), dicatat terpisah di DATABASE DTD: tanggal barang sampai di agent, tanggal sampai di gudang MCH, lalu GAP (hari) dihitung manual untuk menilai kecepatan vendor.
3. **Input rate forwarder** — biaya per jenis charge & ukuran kontainer diketik manual di RATE FW, lalu dibandingkan antar forwarder di sheet COMPARE untuk memutuskan forwarder mana yang dipakai.
4. **Refresh pivot manual** — sheet PIV dan PIV DTD adalah PivotTable Excel yang harus di-refresh manual (klik kanan → Refresh) tiap kali DATABASE/DATABASE DTD berubah, untuk memperbarui rekap status, brand, bulan, dan performa vendor.
5. **Baca dashboard** — DASHBOARD, TOP 20 HIGHEST, dan ILLUVIA MONITORING menampilkan hasil pivot tadi via chart & slicer, dipakai manajemen untuk melihat status impor, top shipment bernilai tinggi, dan monitoring brand Illuvia — tapi semuanya bergantung pada langkah 1-4 sudah benar dan pivot sudah di-refresh.

## Masalah yang terlihat dari struktur manualnya

- **Duplikasi data**: DATABASE vs SPREADSHEET punya struktur sama tapi terpisah — rawan copy-paste error (sudah ketahuan ada selisih data di kolom BULAN).
- **Pivot manual**: dashboard bisa "basi" kalau lupa refresh pivot setelah update data.
- **Perhitungan GAP manual**: rentan salah karena bergantung format tanggal Excel dan input manual.
- **Rate & comparison forwarder** dikelola statis di 2 sheet berbeda, tidak ada histori perubahan harga.
- **Tidak ada single source of truth** untuk status shipment/pembayaran real-time — semua orang harus buka file Excel yang sama.
- **Skalabilitas**: sudah >1000 baris data, makin lama makin berat & rawan rusak formatnya.

## Implikasi untuk aplikasi pengganti

Aplikasi yang dibangun idealnya punya:
- 1 tabel master shipment (gantikan DATABASE + SPREADSHEET jadi satu sumber data).
- 1 tabel master shipment DTD/launching dengan GAP dihitung otomatis oleh sistem, bukan manual.
- Modul rate forwarder dengan histori harga & perbandingan otomatis antar forwarder.
- Dashboard real-time (bukan pivot manual) untuk status barang, top shipment bernilai tinggi, dan monitoring per brand.
- Role/status tracking (pembayaran ke supplier, pembayaran ke forwarder, status barang) sebagai field terstruktur dengan workflow, bukan teks bebas.
