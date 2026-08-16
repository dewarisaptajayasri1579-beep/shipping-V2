import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore, itemStore } from "@/lib/data/master"
import { shipmentStore } from "@/lib/data/transaksi"
import { Top20View } from "@/components/laporan/Top20View"

export default async function Top20Page() {
  const user = await getCurrentUser()
  const shipments = shipmentStore.getAll()
  const brands = brandStore.getAll()
  const items = itemStore.getAll()

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
          shipments={shipments.map((s) => ({
            id: s.id,
            shipmentName: s.shipmentName,
            brandId: s.brandId,
            itemId: s.itemId,
            qty: s.qty,
            priceSatuan: s.priceSatuan,
            tanggalKedatangan: s.tanggalKedatangan,
          }))}
          brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
          itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
        />
      </div>
    </AppLayout>
  )
}
