import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, brandStore, countryStore, itemStore } from "@/lib/data/master"
import { purchaseOrderData, supplierInvoiceData, invoicedQtyByPoItem, computePoStatus } from "@/lib/data/purchase"
import { PurchaseOrderTable } from "@/components/purchase/PurchaseOrderTable"

export default async function PurchaseOrderPage() {
  const user = await getCurrentUser()
  const [orders, invoices] = await Promise.all([purchaseOrderData.getAll(), supplierInvoiceData.getAll()])
  const suppliers = supplierStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  const rows = orders.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    poDate: po.poDate ? po.poDate.toISOString().slice(0, 10) : null,
    supplierId: po.supplierId,
    brandId: po.brandId,
    countryId: po.countryId,
    currency: po.currency,
    notes: po.notes,
    items: po.items.map((it) => ({ id: it.id, itemId: it.itemId, qtyOrder: it.qtyOrder, unitPrice: it.unitPrice })),
    status: computePoStatus(po, invoicedQtyByPoItem(po, invoices)),
  }))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Purchase" }, { label: "Purchase Order" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Purchase Order</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Akar transaksi — dari sini Supplier Invoice dibuat, tanpa ketik ulang item.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <PurchaseOrderTable
            rows={rows}
            supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
            countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
            itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
