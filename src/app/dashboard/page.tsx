import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore, countryStore } from "@/lib/data/master"
import { shipmentStore } from "@/lib/data/transaksi"
import { DashboardView } from "@/components/dashboard/DashboardView"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const shipments = shipmentStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 sm:space-y-8">
        <Breadcrumb items={[{ label: "Dashboard" }, { label: "Ringkasan Status Barang" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Import Shipment Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Ringkasan status barang, real-time dari data Transaksi.</p>
        </div>

        <DashboardView
          shipments={shipments.map((s) => ({
            id: s.id,
            shipmentName: s.shipmentName,
            brandId: s.brandId,
            countryId: s.countryId,
            qty: s.qty,
            priceSatuan: s.priceSatuan,
            airSea: s.airSea,
            statusBarang: s.statusBarang,
            tanggalKedatangan: s.tanggalKedatangan,
            nilaiBilling: s.nilaiBilling,
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
