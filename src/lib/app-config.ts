import type { LucideIcon } from "lucide-react"
import { Ship, Bell, Gauge } from "lucide-react"

/** Satu sumber kebenaran untuk identitas aplikasi. Ganti nilai di sini saat
 *  template ini dipakai untuk aplikasi baru — tidak perlu cari-ganti manual
 *  di komponen (AppLogo, Sidebar, Header, AppLayout, AuthLayout). */
export const APP_CONFIG = {
  name: "Shipping Control",
  tagline: "Import Shipment Dashboard",
  subTagline: "Master Data, Transaksi, Laporan & Early Warning System",
  /** Kalimat promosi di halaman login/register (sisi kiri, desktop). */
  authDescription: "Kelola shipment, pembayaran, dan performa vendor impor dalam satu tempat.",
  /** 3 kartu fitur di halaman login/register (sisi kiri, desktop). */
  authFeatures: [
    { icon: Ship as LucideIcon, title: "Tracking Shipment", desc: "Status barang & GAP real-time" },
    { icon: Gauge as LucideIcon, title: "Performa Vendor", desc: "Scoring kecepatan & harga" },
    { icon: Bell as LucideIcon, title: "Early Warning System", desc: "Alert keterlambatan & fraud via WhatsApp" },
  ],
} as const
