import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, brandStore, countryStore, itemStore, forwarderStore, warehouseStore } from "@/lib/data/master"
import { QuickEntryForm } from "@/components/purchase/QuickEntryForm"

export const dynamic = "force-dynamic"

export default async function QuickEntryPage() {
  const user = await getCurrentUser()
  const suppliers = supplierStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()
  const forwarders = forwarderStore.getAll()
  const warehouses = warehouseStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Input Cepat" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Input Cepat</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Satu tempat input, mirip sheet Excel — di belakang otomatis dibuatkan Purchase Order, Supplier Invoice, dan
            Shipment sekaligus. Untuk kasus khusus (invoice/shipment parsial, banyak PO digabung 1 shipment), pakai menu
            Purchase / Shipment biasa.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <QuickEntryForm
            supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
            countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
            itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
            forwarderOptions={forwarders.map((f) => ({ value: f.id, label: f.name }))}
            warehouseOptions={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
