import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore, itemStore } from "@/lib/data/master"
import { invoiceStore } from "@/lib/data/transaksi"
import { flattenInvoiceItems } from "@/lib/shipment-helpers"
import { Top20View } from "@/components/laporan/Top20View"

export default async function Top20Page() {
  const user = await getCurrentUser()
  const invoices = invoiceStore.getAll()
  const brands = brandStore.getAll()
  const items = itemStore.getAll()
  const invoiceById = Object.fromEntries(invoices.map((inv) => [inv.id, inv]))
  const shipmentById = Object.fromEntries(invoices.flatMap((inv) => inv.shipments).map((s) => [s.id, s]))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Top 20 Shipment" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Top 20 Shipment Bernilai Tertinggi</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Ranking produk terbanyak diimpor, dengan slicer Year/Month/Brand — mirror mockup TOP 20 HIGHEST.
          </p>
        </div>

        <Top20View
          shipments={flattenInvoiceItems(invoices).map((it) => ({
            id: it.id,
            shipmentName: it.shipmentName,
            brandId: invoiceById[it.invoiceId]?.brandId ?? null,
            itemId: it.itemId,
            qty: it.qty,
            priceSatuan: it.priceSatuan,
            eta: shipmentById[it.shipmentId]?.eta ?? null,
          }))}
          brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
