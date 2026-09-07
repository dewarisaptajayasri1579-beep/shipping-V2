import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore, countryStore } from "@/lib/data/master"
import { invoiceStore } from "@/lib/data/transaksi"
import { flattenShipments, shipmentTotalValue } from "@/lib/shipment-helpers"
import { DashboardView } from "@/components/dashboard/DashboardView"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const invoices = invoiceStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const invoiceById = Object.fromEntries(invoices.map((inv) => [inv.id, inv]))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 sm:space-y-8">
        <Breadcrumb items={[{ label: "Dashboard" }, { label: "Ringkasan Status Barang" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Import Shipment Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Ringkasan status barang, real-time dari data Transaksi.</p>
        </div>

        <DashboardView
          shipments={flattenShipments(invoices).map((s) => ({
            id: s.id,
            shipmentName: s.shipmentName,
            brandId: invoiceById[s.invoiceId]?.brandId ?? null,
            countryId: invoiceById[s.invoiceId]?.countryId ?? null,
            airSea: s.airSea,
            statusBarang: s.statusBarang,
            eta: s.eta,
            nilaiBilling: shipmentTotalValue(s),
            nilaiForwarder: s.nilaiForwarder,
            statusShipment: s.statusShipment,
          }))}
          brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
          countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>
    </AppLayout>
  )
}
