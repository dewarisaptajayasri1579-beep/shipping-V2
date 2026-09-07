import { notFound } from "next/navigation"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Badge } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { itemStore } from "@/lib/data/master"
import { shipmentStore } from "@/lib/data/transaksi"
import { shipmentTotalValue } from "@/lib/shipment-helpers"
import { ShipmentDetailView } from "@/components/transaksi/ShipmentDetailView"

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const shipment = shipmentStore.getById(id)
  if (!shipment) notFound()

  const items = itemStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: "Transaksi" }, { label: "Input Shipment/Import", href: "/transaksi/shipment" }, { label: shipment.shipmentName }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">{shipment.shipmentName}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
              Kelola Invoice, PO, dan Item shipment ini — 1 Invoice bisa punya beberapa PO, 1 PO bisa punya beberapa Item.
            </p>
          </div>
          <Badge variant="info">Total Nilai Barang: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(shipmentTotalValue(shipment))}</Badge>
        </div>

        <Card variant="panel" padding="lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-slate-500 dark:text-fg-muted">PIB</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{shipment.pib || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">AIR/SEA</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{shipment.airSea}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Status Barang</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{shipment.statusBarang}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Status Shipment</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{shipment.statusShipment}</p>
            </div>
          </div>
        </Card>

        <ShipmentDetailView shipment={shipment} itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))} />
      </div>
    </AppLayout>
  )
}
