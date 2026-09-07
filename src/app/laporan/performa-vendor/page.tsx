import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Badge, Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, forwarderStore } from "@/lib/data/master"
import { shipmentDtdStore, invoiceStore } from "@/lib/data/transaksi"
import { calcGapDays } from "@/lib/gap"

export default async function LaporanPerformaVendorPage() {
  const user = await getCurrentUser()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const shipments = invoiceStore.getAll().flatMap((inv) => inv.shipments)
  const suppliers = supplierStore.getAll()
  const forwarders = forwarderStore.getAll()

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

  // Vendor Indonesia = Forwarder yang urus dari pelabuhan sampai gudang PT (field `eta` -> `etaGudang`
  // di Shipment/Import), beda dengan tabel di atas yang datanya dari Shipment DTD (sampeAgent -> sampeMche).
  const forwarderRows = forwarders
    .map((f) => {
      const gaps = shipments
        .filter((s) => s.forwarderId === f.id)
        .map((s) => calcGapDays(s.eta, s.etaGudang))
        .filter((g): g is number => g !== null)
      const count = gaps.length
      const sum = gaps.reduce((a, b) => a + b, 0)
      const avg = count > 0 ? sum / count : null
      return { vendor: f.name, count, sum, avg }
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

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Rata-rata Gap Vendor Indonesia (Forwarder)</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Count/Sum/Average GAP (ETA Pelabuhan Indonesia → ETA Gudang) per forwarder, dari data Input Shipment/Import.
          </p>
        </div>

        <Card variant="panel" padding="none">
          <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Forwarder</TableHead>
                  <TableHead>Jumlah Shipment</TableHead>
                  <TableHead>Total GAP (hari)</TableHead>
                  <TableHead>Rata-rata GAP (hari)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forwarderRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 dark:text-fg-muted py-8">
                      Belum ada shipment dengan ETA Pelabuhan & ETA Gudang lengkap.
                    </TableCell>
                  </TableRow>
                ) : (
                  forwarderRows.map((r, i) => (
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
