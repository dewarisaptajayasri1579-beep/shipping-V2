/** Konstanta & tipe murni (tanpa import fs) — aman diimpor dari Client Component. */

export type EwsCategory = "keterlambatan" | "fraud"

export interface EwsRuleDef {
  id: string
  category: EwsCategory
  label: string
  description: string
  /** Parameter threshold yang bisa diatur admin, key -> {label, default, suffix}. */
  params: Record<string, { label: string; default: number; suffix: string }>
}

/** Katalog aturan EWS — logika & jumlah aturan mengikuti docs/menu.md bagian 5.1 & 5.2.
 *  Admin cuma bisa atur threshold & enable/disable per aturan (lihat halaman
 *  Pengaturan Aturan/Threshold), bukan bikin aturan baru — logikanya tetap sesuai desain. */
export const EWS_RULES: EwsRuleDef[] = [
  {
    id: "eta-mendekat",
    category: "keterlambatan",
    label: "Estimasi kedatangan barang mendekati batas",
    description: "H-3 & H-1 sebelum Tanggal Kedatangan kalau Status Barang masih Belum Datang/On Going, eskalasi kalau sudah lewat H+0.",
    params: { hMinus: { label: "Kirim mulai H-", default: 3, suffix: "hari" } },
  },
  {
    id: "gap-dtd-proyeksi",
    category: "keterlambatan",
    label: "Proyeksi GAP DTD akan melebihi rata-rata vendor",
    description: "Sampe Agent tercatat tapi Sampe MCHE belum, dan durasi berjalan sudah mendekati rata-rata GAP historis vendor.",
    params: { percentThreshold: { label: "Ambang persen dari rata-rata vendor", default: 80, suffix: "%" } },
  },
  {
    id: "jatuh-tempo-pembayaran",
    category: "keterlambatan",
    label: "Jatuh tempo pembayaran mendekat",
    description: "H-7, H-3, H-1 sebelum tanggal jatuh tempo pembayaran ke supplier/forwarder, eskalasi ke atasan kalau lewat H+0 belum dibayar.",
    params: { hMinus: { label: "Kirim mulai H-", default: 7, suffix: "hari" } },
  },
  {
    id: "pib-belum-lengkap",
    category: "keterlambatan",
    label: "Dokumen PIB belum lengkap menjelang kedatangan",
    description: "H-5 sebelum Tanggal Kedatangan kalau No PIB masih kosong.",
    params: { hMinus: { label: "Kirim mulai H-", default: 5, suffix: "hari" } },
  },
  {
    id: "shipment-tinggi-macet",
    category: "keterlambatan",
    label: "Shipment bernilai tinggi berisiko macet",
    description: "Shipment termasuk Top 20 (nilai tinggi) dan sudah X hari tanpa perubahan status.",
    params: { daysNoChange: { label: "Tanpa perubahan status selama", default: 14, suffix: "hari" } },
  },
  {
    id: "invoice-ganda",
    category: "fraud",
    label: "Invoice ganda (duplikat)",
    description: "No Invoice yang sama dipakai untuk No PO yang berbeda — indikasi input dobel untuk shipment berbeda.",
    params: {},
  },
  {
    id: "harga-menyimpang",
    category: "fraud",
    label: "Harga item menyimpang dari histori",
    description: "Price satuan item dari brand yang sama berbeda signifikan dari rata-rata harga historis item tsb.",
    params: { percentThreshold: { label: "Ambang deviasi harga", default: 20, suffix: "%" } },
  },
  {
    id: "rate-forwarder-naik",
    category: "fraud",
    label: "Kenaikan rate forwarder tidak wajar",
    description: "Rate forwarder (kombinasi charge/kontainer/incoterm) naik signifikan dibanding entri histori sebelumnya.",
    params: { percentThreshold: { label: "Ambang kenaikan rate", default: 15, suffix: "%" } },
  },
  {
    id: "bayar-sebelum-datang",
    category: "fraud",
    label: "Pembayaran tercatat lunas sebelum barang tercatat datang",
    description: "Status Pembayaran PI/FO = Sudah Dibayar padahal Status Barang belum Barang Sudah Datang — urutan proses terbalik.",
    params: {},
  },
  {
    id: "perubahan-setelah-done",
    category: "fraud",
    label: "Perubahan data setelah status DONE/selesai",
    description: "Shipment berstatus DONE tapi field-nya diubah kemudian (heuristik: updated jauh setelah dibuat).",
    params: { minHoursDiff: { label: "Anggap perubahan mencurigakan setelah", default: 24, suffix: "jam" } },
  },
  {
    id: "vendor-baru-nilai-besar",
    category: "fraud",
    label: "Vendor baru dengan nilai transaksi besar tanpa histori",
    description: "Shipment DTD pertama dari vendor baru dengan Cost di atas ambang tertentu.",
    params: {
      valueThreshold: { label: "Ambang nilai transaksi", default: 5000000, suffix: "Rp" },
      minHistoryCount: { label: "Dianggap 'baru' jika histori shipment kurang dari", default: 2, suffix: "shipment" },
    },
  },
]

export const EWS_RULE_MAP = Object.fromEntries(EWS_RULES.map((r) => [r.id, r]))

export const ALERT_STATUS = ["BELUM DITANGANI", "SUDAH DITANGANI"] as const
export type AlertStatus = (typeof ALERT_STATUS)[number]

export const ALERT_SEVERITY = ["info", "warning", "critical"] as const
export type AlertSeverity = (typeof ALERT_SEVERITY)[number]
