import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { shipmentStore, paymentLogStore } from "@/lib/data/transaksi"
import { PaymentStatusTable } from "@/components/transaksi/PaymentStatusTable"

export default async function StatusPembayaranPage() {
  const user = await getCurrentUser()
  const shipments = shipmentStore.getAll()
  const logs = paymentLogStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Transaksi" }, { label: "Update Status Pembayaran" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Update Status Pembayaran</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Status & histori pembayaran ke supplier (PI) dan forwarder (FO) — tercatat sebagai log, bukan cuma field status, supaya ada audit trail.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <PaymentStatusTable
            rows={shipments.map((s) => ({
              id: s.id,
              shipmentName: s.shipmentName,
              noInvoice: s.noInvoice,
              statusPembayaranPI: s.statusPembayaranPI,
              statusPembayaranFO: s.statusPembayaranFO,
            }))}
            logs={logs}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
