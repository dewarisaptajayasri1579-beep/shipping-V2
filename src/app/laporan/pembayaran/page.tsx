import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Badge, StatTile, Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui"
import { Wallet, AlertTriangle } from "lucide-react"
import { getCurrentUser } from "@/lib/current-user"
import { forwarderStore } from "@/lib/data/master"
import { shipmentStore } from "@/lib/data/transaksi"

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)
}

export default async function LaporanPembayaranPage() {
  const user = await getCurrentUser()
  const shipments = shipmentStore.getAll()
  const forwarders = forwarderStore.getAll()
  const forwarderLabel = (id: string | null) => (id ? forwarders.find((f) => f.id === id)?.name ?? id : "-")

  const outstandingPI = shipments.filter((s) => s.statusPembayaranPI === "BELUM DIBAYAR")
  const outstandingFO = shipments.filter((s) => s.statusPembayaranFO === "BELUM DIBAYAR")
  const totalOutstandingBilling = outstandingPI.reduce((sum, s) => sum + s.nilaiBilling, 0)
  const totalOutstandingForwarder = outstandingFO.reduce((sum, s) => sum + s.nilaiForwarder, 0)

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Pembayaran" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Laporan Pembayaran</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Outstanding payment ke supplier (PI) &amp; forwarder (FO).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatTile label="Outstanding PI (Supplier)" value={outstandingPI.length} icon={AlertTriangle} color="amber" />
          <StatTile label="Nilai Outstanding Billing" value={formatRupiah(totalOutstandingBilling)} icon={Wallet} color="rose" />
          <StatTile label="Outstanding FO (Forwarder)" value={outstandingFO.length} icon={AlertTriangle} color="amber" />
          <StatTile label="Nilai Outstanding Forwarder" value={formatRupiah(totalOutstandingForwarder)} icon={Wallet} color="rose" />
        </div>

        <Card variant="panel" padding="lg">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-4">Outstanding ke Supplier (PI)</h3>
          <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment</TableHead>
                  <TableHead>No Invoice</TableHead>
                  <TableHead>Nilai Billing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingPI.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 dark:text-fg-muted py-6">
                      Tidak ada outstanding.
                    </TableCell>
                  </TableRow>
                ) : (
                  outstandingPI.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold text-slate-800 dark:text-fg">{s.shipmentName}</TableCell>
                      <TableCell>{s.noInvoice || "-"}</TableCell>
                      <TableCell>{formatRupiah(s.nilaiBilling)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card variant="panel" padding="lg">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-4">Outstanding ke Forwarder (FO)</h3>
          <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Forwarder</TableHead>
                  <TableHead>
                    <Badge variant="secondary">Nilai Forwarder</Badge>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingFO.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 dark:text-fg-muted py-6">
                      Tidak ada outstanding.
                    </TableCell>
                  </TableRow>
                ) : (
                  outstandingFO.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold text-slate-800 dark:text-fg">{s.shipmentName}</TableCell>
                      <TableCell>{forwarderLabel(s.forwarderId)}</TableCell>
                      <TableCell>{formatRupiah(s.nilaiForwarder)}</TableCell>
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
