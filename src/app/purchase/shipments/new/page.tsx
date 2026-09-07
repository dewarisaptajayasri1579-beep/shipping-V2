import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { countryStore, forwarderStore, warehouseStore, itemStore } from "@/lib/data/master"
import { supplierInvoiceData, shipmentData, shippedQtyByInvoiceItem } from "@/lib/data/purchase"
import { ShipmentForm } from "@/components/purchase/ShipmentForm"

export default async function NewShipmentPage() {
  const user = await getCurrentUser()
  const [invoices, shipments] = await Promise.all([supplierInvoiceData.getAll(), shipmentData.getAll()])
  const countries = countryStore.getAll()
  const forwarders = forwarderStore.getAll()
  const warehouses = warehouseStore.getAll()
  const items = itemStore.getAll()

  const invoicesForForm = invoices.map((inv) => {
    const shippedByItem = shippedQtyByInvoiceItem(inv, shipments)
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      items: inv.items.map((it) => ({
        id: it.id,
        itemId: it.purchaseOrderItem.itemId,
        qty: it.qty,
        unitPrice: it.unitPrice,
        alreadyShipped: shippedByItem[it.id] ?? 0,
      })),
    }
  })

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Shipment" }, { label: "Daftar Shipment", href: "/purchase/shipments" }, { label: "Tambah" }]} />
        <Link
          href="/purchase/shipments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-fg-muted hover:text-blue-700 dark:hover:text-[var(--accent-highlight)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Shipment
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Tambah Shipment</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Dibuat dari Invoice Item — bisa gabung dari beberapa Invoice sekaligus.
          </p>
        </div>

        <ShipmentForm
          mode="create"
          invoices={invoicesForForm}
          countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
          forwarderOptions={forwarders.map((f) => ({ value: f.id, label: f.name }))}
          warehouseOptions={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
