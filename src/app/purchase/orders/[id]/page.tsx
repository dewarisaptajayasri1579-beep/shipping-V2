import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, brandStore, countryStore, itemStore } from "@/lib/data/master"
import { purchaseOrderData, supplierInvoiceData, invoicedQtyByPoItem, computePoStatus } from "@/lib/data/purchase"
import { PurchaseOrderForm } from "@/components/purchase/PurchaseOrderForm"

export default async function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const [po, invoices] = await Promise.all([purchaseOrderData.getById(id), supplierInvoiceData.getAll()])
  if (!po) notFound()

  const suppliers = supplierStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  const record = {
    id: po.id,
    poNumber: po.poNumber,
    poDate: po.poDate ? po.poDate.toISOString().slice(0, 10) : null,
    supplierId: po.supplierId,
    brandId: po.brandId,
    countryId: po.countryId,
    currency: po.currency,
    notes: po.notes,
    documentUrl: po.documentUrl,
    items: po.items.map((it) => ({ id: it.id, itemId: it.itemId, qtyOrder: it.qtyOrder, unitPrice: it.unitPrice })),
    status: computePoStatus(po, invoicedQtyByPoItem(po, invoices)),
  }

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Purchase" }, { label: "Purchase Order", href: "/purchase/orders" }, { label: po.poNumber }]} />
        <Link
          href="/purchase/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-fg-muted hover:text-blue-700 dark:hover:text-[var(--accent-highlight)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Purchase Order
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Edit Purchase Order</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">{po.poNumber}</p>
        </div>

        <PurchaseOrderForm
          mode="edit"
          record={record}
          supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
          countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
