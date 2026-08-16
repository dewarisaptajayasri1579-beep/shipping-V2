import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Badge, Alert, Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore } from "@/lib/data/master"
import { shipmentDtdStore } from "@/lib/data/transaksi"
import { alertLogStore } from "@/lib/data/ews"
import { computeVendorScores } from "@/lib/vendor-scoring"

export default async function ScoringVendorPage() {
  const user = await getCurrentUser()
  const suppliers = supplierStore.getAll()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const alertLogs = alertLogStore.getAll()

  const scores = computeVendorScores(shipmentsDtd, suppliers, alertLogs)
    .filter((s) => s.shipmentCount > 0)
    .sort((a, b) => b.finalScore - a.finalScore)

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Penilaian/Scoring Vendor" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Penilaian/Scoring Vendor</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Skor gabungan: 40% kecepatan (GAP), 40% harga, 20% konsistensi — dipotong 10% per red flag EWS aktif.
          </p>
        </div>

        <Alert variant="info">
          Vendor dengan histori kurang dari 2 shipment ditandai &quot;Data belum cukup&quot; — belum direkomendasikan berdasar
          sampel kecil yang bisa menyesatkan (lihat docs/menu.md 5.4).
        </Alert>

        <Card variant="panel" padding="none">
          <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Skor Kecepatan</TableHead>
                  <TableHead>Skor Harga</TableHead>
                  <TableHead>Skor Konsistensi</TableHead>
                  <TableHead>Red Flag</TableHead>
                  <TableHead>Skor Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 dark:text-fg-muted py-8">
                      Belum ada data shipment DTD dengan vendor.
                    </TableCell>
                  </TableRow>
                ) : (
                  scores.map((s, i) => (
                    <TableRow key={s.vendorId}>
                      <TableCell>
                        <Badge variant={i === 0 && s.dataSufficient ? "success" : "secondary"}>#{i + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-fg">
                        {s.vendorName}
                        {!s.dataSufficient && (
                          <Badge variant="warning" className="ml-2">
                            Data belum cukup
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{s.shipmentCount}</TableCell>
                      <TableCell>{s.speedScore}</TableCell>
                      <TableCell>{s.priceScore}</TableCell>
                      <TableCell>{s.consistencyScore}</TableCell>
                      <TableCell>{s.redFlagCount > 0 ? <Badge variant="danger">{s.redFlagCount}</Badge> : "-"}</TableCell>
                      <TableCell className="font-extrabold text-slate-800 dark:text-fg">{s.finalScore}</TableCell>
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
