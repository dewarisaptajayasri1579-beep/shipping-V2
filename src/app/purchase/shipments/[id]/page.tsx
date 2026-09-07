import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { countryStore, forwarderStore, warehouseStore, itemStore } from "@/lib/data/master"
import { supplierInvoiceData, shipmentData, shippedQtyByInvoiceItem, computeShipmentStatus, arrivalToWarehouseGapDays } from "@/lib/data/purchase"
import { ShipmentForm } from "@/components/purchase/ShipmentForm"

function toDateStr(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null
}

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const [shipment, invoices] = await Promise.all([shipmentData.getById(id), supplierInvoiceData.getAll()])
  if (!shipment) notFound()

  const allShipments = await shipmentData.getAll()
  const countries = countryStore.getAll()
  const forwarders = forwarderStore.getAll()
  const warehouses = warehouseStore.getAll()
  const items = itemStore.getAll()

  const invoicesForForm = invoices.map((inv) => {
    const shippedByItem = shippedQtyByInvoiceItem(inv, allShipments)
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

  const record = {
    id: shipment.id,
    shipmentNo: shipment.shipmentNo,
    shipmentDate: toDateStr(shipment.shipmentDate),
    originCountryId: shipment.originCountryId,
    mode: shipment.mode as "AIR" | "SEA",
    forwarderId: shipment.forwarderId,
    destinationWarehouseId: shipment.destinationWarehouseId,
    originPort: shipment.originPort,
    destinationPort: shipment.destinationPort,
    notes: shipment.notes,
    isDraft: shipment.isDraft,
    plannedPickupDate: toDateStr(shipment.plannedPickupDate),
    actualPickupDate: toDateStr(shipment.actualPickupDate),
    etd: toDateStr(shipment.etd),
    atd: toDateStr(shipment.atd),
    eta: toDateStr(shipment.eta),
    ata: toDateStr(shipment.ata),
    customsReleaseDate: toDateStr(shipment.customsReleaseDate),
    warehouseReceiptDate: toDateStr(shipment.warehouseReceiptDate),
    actualWarehouseId: shipment.actualWarehouseId,
    receivedBy: shipment.receivedBy,
    receivingNotes: shipment.receivingNotes,
    receivingDocumentUrl: shipment.receivingDocumentUrl,
    pib: shipment.pib,
    nopen: shipment.nopen,
    pibDate: toDateStr(shipment.pibDate),
    notul: shipment.notul,
    notulNotes: shipment.notulNotes,
    customsBillingValue: shipment.customsBillingValue ?? 0,
    customsBillingDate: toDateStr(shipment.customsBillingDate),
    customsPaymentStatus: shipment.customsPaymentStatus as "BELUM DIBAYAR" | "SUDAH DIBAYAR",
    customsPaymentDate: toDateStr(shipment.customsPaymentDate),
    customsDocumentUrl: shipment.customsDocumentUrl,
    forwarderInvoiceNumber: shipment.forwarderInvoiceNumber,
    forwarderInvoiceDate: toDateStr(shipment.forwarderInvoiceDate),
    forwarderBillingValue: shipment.forwarderBillingValue ?? 0,
    forwarderDocStatus: shipment.forwarderDocStatus as "BELUM ADA INVOICE" | "INVOICE DITERIMA" | "DOKUMEN KE FINANCE" | "WAITING PAYMENT" | "PAID",
    forwarderDocDate: toDateStr(shipment.forwarderDocDate),
    forwarderPaymentStatus: shipment.forwarderPaymentStatus as "BELUM DIBAYAR" | "SUDAH DIBAYAR",
    forwarderPaymentDate: toDateStr(shipment.forwarderPaymentDate),
    forwarderDocumentUrl: shipment.forwarderDocumentUrl,
    items: shipment.items.map((it) => ({ id: it.id, invoiceItemId: it.invoiceItemId, qtyShipped: it.qtyShipped, qtyReceived: it.qtyReceived })),
    status: computeShipmentStatus(shipment),
    arrivalToWarehouseGapDays: arrivalToWarehouseGapDays(shipment),
  }

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Shipment" }, { label: "Daftar Shipment", href: "/purchase/shipments" }, { label: shipment.shipmentNo }]} />
        <Link
          href="/purchase/shipments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-fg-muted hover:text-blue-700 dark:hover:text-[var(--accent-highlight)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Shipment
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Edit Shipment / Update Progress</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">{shipment.shipmentNo}</p>
        </div>

        <ShipmentForm
          mode="edit"
          record={record}
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
