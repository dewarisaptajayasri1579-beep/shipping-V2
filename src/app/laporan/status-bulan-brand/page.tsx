import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore } from "@/lib/data/master"
import { shipmentStore } from "@/lib/data/transaksi"
import { STATUS_BARANG } from "@/lib/data/transaksi-constants"

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export default async function LaporanStatusBulanBrandPage() {
  const user = await getCurrentUser()
  const shipments = shipmentStore.getAll()
  const brands = brandStore.getAll()

  const byBrandStatus = brands.map((b) => {
    const rows = shipments.filter((s) => s.brandId === b.id)
    const counts = Object.fromEntries(STATUS_BARANG.map((st) => [st, rows.filter((r) => r.statusBarang === st).length]))
    return { brand: b.name, total: rows.length, counts }
  })

  const byMonth = MONTH_LABELS.map((label, i) => {
    const rows = shipments.filter((s) => s.tanggalKedatangan && new Date(s.tanggalKedatangan).getMonth() === i)
    return { month: label, total: rows.length }
  })

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Shipment per Status/Bulan/Brand" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Shipment per Status / Bulan / Brand</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Rekap jumlah shipment, query real-time dari data Transaksi.</p>
        </div>

        <Card variant="panel" padding="lg">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-4">Per Brand × Status Barang</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-line">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-surface-hover">
                <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                  <th className="px-4 py-3">Brand</th>
                  {STATUS_BARANG.map((st) => (
                    <th key={st} className="px-4 py-3">
                      {st}
                    </th>
                  ))}
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {byBrandStatus.map((r) => (
                  <tr key={r.brand} className="border-t border-slate-100 dark:border-line">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-fg">{r.brand}</td>
                    {STATUS_BARANG.map((st) => (
                      <td key={st} className="px-4 py-3">
                        {r.counts[st]}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-extrabold">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card variant="panel" padding="lg">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-4">Per Bulan</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-line">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-surface-hover">
                <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="px-4 py-3">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 dark:border-line">
                  {byMonth.map((m) => (
                    <td key={m.month} className="px-4 py-3 font-bold text-slate-800 dark:text-fg">
                      {m.total}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
