import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { countryStore, forwarderStore, warehouseStore, itemStore } from "@/lib/data/master"
import { supplierInvoiceData, shipmentData, shippedQtyByInvoiceItem, computeShipmentStatus, arrivalToWarehouseGapDays } from "@/lib/data/purchase"
import { ShipmentTable } from "@/components/purchase/ShipmentTable"

function toDateStr(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null
}

export default async function ShipmentPage() {
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

  const rows = shipments.map((s) => ({
    id: s.id,
    shipmentNo: s.shipmentNo,
    shipmentDate: toDateStr(s.shipmentDate),
    originCountryId: s.originCountryId,
    mode: s.mode as "AIR" | "SEA",
    forwarderId: s.forwarderId,
    destinationWarehouseId: s.destinationWarehouseId,
    originPort: s.originPort,
    destinationPort: s.destinationPort,
    notes: s.notes,
    isDraft: s.isDraft,
    plannedPickupDate: toDateStr(s.plannedPickupDate),
    actualPickupDate: toDateStr(s.actualPickupDate),
    etd: toDateStr(s.etd),
    atd: toDateStr(s.atd),
    eta: toDateStr(s.eta),
    ata: toDateStr(s.ata),
    customsReleaseDate: toDateStr(s.customsReleaseDate),
    warehouseReceiptDate: toDateStr(s.warehouseReceiptDate),
    actualWarehouseId: s.actualWarehouseId,
    receivedBy: s.receivedBy,
    receivingNotes: s.receivingNotes,
    receivingDocumentUrl: s.receivingDocumentUrl,
    pib: s.pib,
    nopen: s.nopen,
    pibDate: toDateStr(s.pibDate),
    notul: s.notul,
    notulNotes: s.notulNotes,
    customsBillingValue: s.customsBillingValue ?? 0,
    customsBillingDate: toDateStr(s.customsBillingDate),
    customsPaymentStatus: s.customsPaymentStatus as "BELUM DIBAYAR" | "SUDAH DIBAYAR",
    customsPaymentDate: toDateStr(s.customsPaymentDate),
    customsDocumentUrl: s.customsDocumentUrl,
    forwarderInvoiceNumber: s.forwarderInvoiceNumber,
    forwarderInvoiceDate: toDateStr(s.forwarderInvoiceDate),
    forwarderBillingValue: s.forwarderBillingValue ?? 0,
    forwarderDocStatus: s.forwarderDocStatus as "BELUM ADA INVOICE" | "INVOICE DITERIMA" | "DOKUMEN KE FINANCE" | "WAITING PAYMENT" | "PAID",
    forwarderDocDate: toDateStr(s.forwarderDocDate),
    forwarderPaymentStatus: s.forwarderPaymentStatus as "BELUM DIBAYAR" | "SUDAH DIBAYAR",
    forwarderPaymentDate: toDateStr(s.forwarderPaymentDate),
    forwarderDocumentUrl: s.forwarderDocumentUrl,
    items: s.items.map((it) => ({ id: it.id, invoiceItemId: it.invoiceItemId, qtyShipped: it.qtyShipped, qtyReceived: it.qtyReceived })),
    status: computeShipmentStatus(s),
    arrivalToWarehouseGapDays: arrivalToWarehouseGapDays(s),
  }))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Shipment" }, { label: "Daftar Shipment" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Daftar Shipment</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Dibuat dari Invoice Item — bisa gabung dari beberapa Invoice sekaligus. Status dihitung otomatis dari milestone aktual.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <ShipmentTable
            rows={rows}
            invoices={invoicesForForm}
            countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
            forwarderOptions={forwarders.map((f) => ({ value: f.id, label: f.name }))}
            warehouseOptions={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
