import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { projectStore, countryStore, brandStore, supplierStore } from "@/lib/data/master"
import { shipmentDtdStore } from "@/lib/data/transaksi"
import { ShipmentDtdTable } from "@/components/transaksi/ShipmentDtdTable"

export default async function ShipmentDtdPage() {
  const user = await getCurrentUser()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const projects = projectStore.getAll()
  const countries = countryStore.getAll()
  const brands = brandStore.getAll()
  const suppliers = supplierStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Transaksi" }, { label: "Input Shipment DTD/Launching" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Input Shipment DTD/Launching</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Shipment door-to-door untuk produk baru/launching. GAP (sampe agent → sampe gudang) dihitung otomatis, bukan input manual.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <ShipmentDtdTable
            rows={shipmentsDtd}
            projectOptions={projects.map((p) => ({ value: p.id, label: p.name }))}
            countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
            brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
            vendorOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
