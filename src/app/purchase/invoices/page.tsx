import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, countryStore, itemStore } from "@/lib/data/master"
import {
  purchaseOrderData,
  supplierInvoiceData,
  shipmentData,
  invoicedQtyByPoItem,
  shippedQtyByInvoiceItem,
  computeInvoiceStatus,
} from "@/lib/data/purchase"
import { SupplierInvoiceTable } from "@/components/purchase/SupplierInvoiceTable"

export default async function SupplierInvoicePage() {
  const user = await getCurrentUser()
  const [orders, invoices, shipments] = await Promise.all([purchaseOrderData.getAll(), supplierInvoiceData.getAll(), shipmentData.getAll()])
  const suppliers = supplierStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  const purchaseOrdersForForm = orders.map((po) => {
    const invoicedByItem = invoicedQtyByPoItem(po, invoices)
    return {
      id: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      items: po.items.map((it) => ({ id: it.id, itemId: it.itemId, qtyOrder: it.qtyOrder, unitPrice: it.unitPrice, alreadyInvoiced: invoicedByItem[it.id] ?? 0 })),
    }
  })

  const rows = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate ? inv.invoiceDate.toISOString().slice(0, 10) : null,
    purchaseOrderId: inv.purchaseOrderId,
    countryId: inv.countryId,
    currency: inv.currency,
    notes: inv.notes,
    documentUrl: inv.documentUrl,
    items: inv.items.map((it) => ({ id: it.id, purchaseOrderItemId: it.purchaseOrderItemId, qty: it.qty, unitPrice: it.unitPrice })),
    status: computeInvoiceStatus(inv, shippedQtyByInvoiceItem(inv, shipments)),
  }))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Purchase" }, { label: "Supplier Invoice" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Supplier Invoice</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Dibuat dari PO — pilih PO dulu, item &amp; sisa qty-nya otomatis muncul, tidak perlu diketik ulang.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <SupplierInvoiceTable
            rows={rows}
            purchaseOrders={purchaseOrdersForForm}
            supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
            itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
