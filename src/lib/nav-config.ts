import type { LucideIcon } from "lucide-react"
import { LayoutGrid, Tags, FileInput, BarChart3, Bell } from "lucide-react"

export interface NavItem {
  label: string
  /** Item dengan `children` (parent submenu) tidak perlu href — klik-nya cuma expand/collapse. */
  href?: string
  icon?: LucideIcon
  /** Submenu 1 level (parent + anak) — dirender expand/collapse di sidebar. */
  children?: NavItem[]
}

export interface NavGroup {
  /** Label section di sidebar. Kosongkan untuk grup tanpa header (section pertama). */
  group?: string
  items: NavItem[]
}

/** Satu sumber kebenaran untuk menu aplikasi shipping-v2 — dipakai oleh Sidebar, BottomBar,
 *  dan CommandPalette. Urutan grup: Dashboard, Smart Fitur, Transaksi, Laporan, Master Data —
 *  dari yang paling sering dipakai sehari-hari ke yang paling jarang (sesuai permintaan user,
 *  bukan urutan di docs/menu.md). Rute di bawah ini dibangun bertahap sesuai docs/step.md —
 *  sebelum halamannya ada, link akan menuju 404. */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        icon: LayoutGrid,
        children: [
          { label: "Ringkasan Status Barang", href: "/dashboard" },
          { label: "KPI Utama", href: "/dashboard/kpi" },
          { label: "Monitoring Illuvia", href: "/dashboard/illuvia" },
        ],
      },
    ],
  },
  {
    group: "Smart Fitur (EWS)",
    items: [
      {
        label: "Smart Fitur (EWS)",
        icon: Bell,
        children: [
          { label: "Pengaturan Aturan/Threshold", href: "/smart-fitur/threshold" },
          { label: "Pengaturan Notifikasi WhatsApp", href: "/smart-fitur/notifikasi-wa" },
          { label: "Log Riwayat Alert", href: "/smart-fitur/log-alert" },
          { label: "Rekomendasi Vendor", href: "/smart-fitur/rekomendasi-vendor" },
        ],
      },
    ],
  },
  {
    group: "Transaksi",
    items: [
      {
        label: "Transaksi",
        icon: FileInput,
        children: [
          { label: "Input Shipment/Import", href: "/transaksi/shipment" },
          { label: "Input Shipment DTD/Launching", href: "/transaksi/shipment-dtd" },
          { label: "Update Status Pembayaran", href: "/transaksi/status-pembayaran" },
          { label: "Perbandingan Rate Forwarder", href: "/transaksi/perbandingan-rate" },
        ],
      },
    ],
  },
  {
    group: "Laporan",
    items: [
      {
        label: "Laporan",
        icon: BarChart3,
        children: [
          { label: "Shipment per Status/Bulan/Brand", href: "/laporan/status-bulan-brand" },
          { label: "Performa Vendor DTD", href: "/laporan/performa-vendor" },
          { label: "Pembayaran", href: "/laporan/pembayaran" },
          { label: "Top 20 Shipment Bernilai Tertinggi", href: "/laporan/top-20" },
          { label: "Penilaian/Scoring Vendor", href: "/laporan/scoring-vendor" },
          { label: "Export Excel/PDF", href: "/laporan/export" },
        ],
      },
    ],
  },
  {
    group: "Master Data",
    items: [
      {
        label: "Master Data",
        icon: Tags,
        children: [
          { label: "Brand", href: "/master/brand" },
          { label: "Supplier/Vendor", href: "/master/supplier" },
          { label: "Forwarder", href: "/master/forwarder" },
          { label: "Gudang", href: "/master/gudang" },
          { label: "Item/Produk", href: "/master/item" },
          { label: "Negara Asal", href: "/master/negara-asal" },
          { label: "Project/Kategori", href: "/master/project" },
        ],
      },
    ],
  },
]

function flattenNavItems(items: NavItem[], parentLabel?: string): { label: string; href: string }[] {
  return items.flatMap((item) => {
    const label = parentLabel ? `${parentLabel} / ${item.label}` : item.label
    const own = item.href ? [{ label, href: item.href }] : []
    const nested = item.children ? flattenNavItems(item.children, item.label) : []
    return [...own, ...nested]
  })
}

export const FLAT_NAV_ITEMS = flattenNavItems(NAV_GROUPS.flatMap((g) => g.items))

/** 4 tombol tetap di bottom bar mobile: 3 shortcut ke section tersering dipakai + 1 "Lainnya"
 *  (hamburger) yang isinya grup-grup sisa. Kalau nama grup di atas berubah, sesuaikan di sini juga. */
export const BOTTOM_BAR_DASHBOARD = NAV_GROUPS[0].items[0]
export const BOTTOM_BAR_TRANSAKSI = NAV_GROUPS.find((g) => g.group === "Transaksi")!.items[0]
export const BOTTOM_BAR_LAPORAN = NAV_GROUPS.find((g) => g.group === "Laporan")!.items[0]
export const BOTTOM_BAR_MORE_GROUPS = NAV_GROUPS.filter(
  (g) => g.group !== "Transaksi" && g.group !== "Laporan" && g !== NAV_GROUPS[0]
)
