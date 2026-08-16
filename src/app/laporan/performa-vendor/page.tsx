import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Badge, Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore } from "@/lib/data/master"
import { shipmentDtdStore } from "@/lib/data/transaksi"
import { calcGapDays } from "@/lib/gap"

export default async function LaporanPerformaVendorPage() {
  const user = await getCurrentUser()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const suppliers = supplierStore.getAll()

  const rows = suppliers
    .map((v) => {
      const gaps = shipmentsDtd
        .filter((s) => s.vendorId === v.id)
        .map((s) => calcGapDays(s.sampeAgent, s.sampeMche))
        .filter((g): g is number => g !== null)
      const count = gaps.length
      const sum = gaps.reduce((a, b) => a + b, 0)
      const avg = count > 0 ? sum / count : null
      return { vendor: v.name, count, sum, avg }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => (a.avg ?? Infinity) - (b.avg ?? Infinity))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Performa Vendor DTD" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Laporan Performa Vendor DTD</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Count/Sum/Average GAP (sampe agent → sampe gudang) per vendor — makin kecil rata-rata GAP, makin cepat vendornya.
          </p>
        </div>

        <Card variant="panel" padding="none">
          <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Jumlah Shipment</TableHead>
                  <TableHead>Total GAP (hari)</TableHead>
                  <TableHead>Rata-rata GAP (hari)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 dark:text-fg-muted py-8">
                      Belum ada shipment DTD dengan GAP lengkap.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => (
                    <TableRow key={r.vendor}>
                      <TableCell>
                        <Badge variant={i === 0 ? "success" : "secondary"}>#{i + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-fg">{r.vendor}</TableCell>
                      <TableCell>{r.count}</TableCell>
                      <TableCell>{r.sum}</TableCell>
                      <TableCell className="font-extrabold">{r.avg?.toFixed(1)} hari</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </AppLayout>
  )
}
