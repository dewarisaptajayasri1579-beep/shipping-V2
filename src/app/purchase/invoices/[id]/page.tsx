import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, countryStore, itemStore } from "@/lib/data/master"
import { purchaseOrderData, supplierInvoiceData, purchaseOrdersForInvoiceForm } from "@/lib/data/purchase"
import { SupplierInvoiceForm } from "@/components/purchase/SupplierInvoiceForm"

export default async function EditSupplierInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const [invoice, orders, invoices] = await Promise.all([supplierInvoiceData.getById(id), purchaseOrderData.getAll(), supplierInvoiceData.getAll()])
  if (!invoice) notFound()

  const suppliers = supplierStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  const purchaseOrdersForForm = purchaseOrdersForInvoiceForm(orders, invoices)

  const record = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.toISOString().slice(0, 10) : null,
    purchaseOrderId: invoice.purchaseOrderId,
    countryId: invoice.countryId,
    currency: invoice.currency,
    notes: invoice.notes,
    documentUrl: invoice.documentUrl,
    paymentStatus: invoice.paymentStatus as "BELUM DIBAYAR" | "SUDAH DIBAYAR",
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
    paymentDate: invoice.paymentDate ? invoice.paymentDate.toISOString().slice(0, 10) : null,
    items: invoice.items.map((it) => ({ id: it.id, purchaseOrderItemId: it.purchaseOrderItemId, qty: it.qty, unitPrice: it.unitPrice })),
    status: "DRAFT" as const,
  }

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Purchase" }, { label: "Supplier Invoice", href: "/purchase/invoices" }, { label: invoice.invoiceNumber }]} />
        <Link
          href="/purchase/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-fg-muted hover:text-blue-700 dark:hover:text-[var(--accent-highlight)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Supplier Invoice
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Edit Supplier Invoice</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">{invoice.invoiceNumber}</p>
        </div>

        <SupplierInvoiceForm
          mode="edit"
          record={record}
          purchaseOrders={purchaseOrdersForForm}
          supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
