import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb, Card, StatTile } from "@/components/ui"
import { LineChartCard } from "@/components/ui/charts"
import { TrendingUp, Gauge, AlertTriangle } from "lucide-react"
import { getCurrentUser } from "@/lib/current-user"
import { shipmentStore, shipmentDtdStore } from "@/lib/data/transaksi"
import { calcGapDays } from "@/lib/gap"

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)
}

export default async function KpiUtamaPage() {
  const user = await getCurrentUser()
  const shipments = shipmentStore.getAll()
  const shipmentsDtd = shipmentDtdStore.getAll()

  const totalNilaiImpor = shipments.reduce((sum, s) => sum + s.qty * s.priceSatuan, 0)

  const gaps = shipmentsDtd.map((s) => calcGapDays(s.sampeAgent, s.sampeMche)).filter((g): g is number => g !== null)
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null

  const outstandingBilling = shipments.filter((s) => s.statusPembayaranPI === "BELUM DIBAYAR").reduce((sum, s) => sum + s.nilaiBilling, 0)
  const outstandingForwarder = shipments.filter((s) => s.statusPembayaranFO === "BELUM DIBAYAR").reduce((sum, s) => sum + s.nilaiForwarder, 0)
  const totalOutstanding = outstandingBilling + outstandingForwarder

  const perMonth = MONTH_LABELS.map((label, i) => {
    const rows = shipments.filter((s) => s.tanggalKedatangan && new Date(s.tanggalKedatangan).getMonth() === i)
    const total = rows.reduce((sum, s) => sum + s.qty * s.priceSatuan, 0)
    return { month: label, "Nilai Impor": Math.round(total) }
  })

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 sm:space-y-8">
        <Breadcrumb items={[{ label: "Dashboard" }, { label: "KPI Utama" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">KPI Utama</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Total nilai impor, rata-rata GAP pengiriman, dan total outstanding pembayaran — turunan dari data Shipment &amp; Shipment DTD.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <StatTile label="Total Nilai Impor" value={formatRupiah(totalNilaiImpor)} icon={TrendingUp} color="blue" />
          <StatTile label="Rata-rata GAP Pengiriman" value={avgGap !== null ? `${avgGap.toFixed(1)} hari` : "-"} icon={Gauge} color="purple" />
          <StatTile label="Total Outstanding Pembayaran" value={formatRupiah(totalOutstanding)} icon={AlertTriangle} color="rose" />
        </div>

        <LineChartCard title="Total Nilai Impor per Bulan" data={perMonth} xKey="month" series={[{ key: "Nilai Impor", label: "Nilai Impor (Rp)" }]} />

        <Card variant="panel" padding="lg">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-2">Rincian Outstanding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-hover">
              <span className="text-slate-600 dark:text-fg-muted">Outstanding ke Supplier (Billing)</span>
              <span className="font-bold text-slate-800 dark:text-fg">{formatRupiah(outstandingBilling)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-hover">
              <span className="text-slate-600 dark:text-fg-muted">Outstanding ke Forwarder</span>
              <span className="font-bold text-slate-800 dark:text-fg">{formatRupiah(outstandingForwarder)}</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
