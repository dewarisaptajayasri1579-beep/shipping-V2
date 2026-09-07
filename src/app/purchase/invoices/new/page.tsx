import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, countryStore, itemStore } from "@/lib/data/master"
import { purchaseOrderData, supplierInvoiceData, purchaseOrdersForInvoiceForm } from "@/lib/data/purchase"
import { SupplierInvoiceForm } from "@/components/purchase/SupplierInvoiceForm"

export default async function NewSupplierInvoicePage() {
  const user = await getCurrentUser()
  const [orders, invoices] = await Promise.all([purchaseOrderData.getAll(), supplierInvoiceData.getAll()])
  const suppliers = supplierStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  const purchaseOrdersForForm = purchaseOrdersForInvoiceForm(orders, invoices)

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Purchase" }, { label: "Supplier Invoice", href: "/purchase/invoices" }, { label: "Tambah" }]} />
        <Link
          href="/purchase/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-fg-muted hover:text-blue-700 dark:hover:text-[var(--accent-highlight)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Supplier Invoice
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Tambah Supplier Invoice</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Pilih supplier dulu, lalu PO supplier itu yang masih ada sisa qty muncul buat dipilih.
          </p>
        </div>

        <SupplierInvoiceForm
          mode="create"
          purchaseOrders={purchaseOrdersForForm}
          supplierOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
