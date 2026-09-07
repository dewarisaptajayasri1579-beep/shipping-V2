import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, brandStore, countryStore, itemStore } from "@/lib/data/master"
import { PurchaseOrderForm } from "@/components/purchase/PurchaseOrderForm"

export default async function NewPurchaseOrderPage() {
  const user = await getCurrentUser()
  const suppliers = supplierStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Purchase" }, { label: "Purchase Order", href: "/purchase/orders" }, { label: "Tambah" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Tambah Purchase Order</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Akar transaksi — dari sini Supplier Invoice dibuat.</p>
        </div>

        <PurchaseOrderForm
          mode="create"
          supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
          countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
