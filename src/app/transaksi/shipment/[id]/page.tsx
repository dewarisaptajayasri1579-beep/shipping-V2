import { notFound } from "next/navigation"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Badge } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { itemStore, warehouseStore, forwarderStore, brandStore, countryStore } from "@/lib/data/master"
import { invoiceStore } from "@/lib/data/transaksi"
import { invoiceTotalValue } from "@/lib/shipment-helpers"
import { ShipmentDetailView } from "@/components/transaksi/ShipmentDetailView"

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const invoice = invoiceStore.getById(id)
  if (!invoice) notFound()

  const items = itemStore.getAll()
  const warehouses = warehouseStore.getAll()
  const forwarders = forwarderStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const brandLabel = brands.find((b) => b.id === invoice.brandId)?.name ?? "-"
  const countryLabel = countries.find((c) => c.id === invoice.countryId)?.name ?? "-"

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: "Transaksi" }, { label: "Input Shipment/Import", href: "/transaksi/shipment" }, { label: invoice.invoice }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Invoice {invoice.invoice}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
              Kelola Shipment (PO) dan Item invoice ini — 1 Invoice bisa dikirim beberapa kali (beberapa PO), 1 PO bisa punya beberapa Item.
            </p>
          </div>
          <Badge variant="info">Nilai Billing: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(invoiceTotalValue(invoice))}</Badge>
        </div>

        <Card variant="panel" padding="lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Brand</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{brandLabel}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Negara Asal</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{countryLabel}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Status Bayar PI</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{invoice.statusPembayaranPI}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Jatuh Tempo PI</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{invoice.dueDatePI || "-"}</p>
            </div>
          </div>
        </Card>

        <ShipmentDetailView
          invoice={invoice}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
          warehouseOptions={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          forwarderOptions={forwarders.map((f) => ({ value: f.id, label: f.name }))}
        />
      </div>
    </AppLayout>
  )
}
