import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore, countryStore, forwarderStore, supplierStore } from "@/lib/data/master"
import { invoiceStore, shipmentDtdStore } from "@/lib/data/transaksi"
import { calcGapDays } from "@/lib/gap"
import { ExportPanel } from "@/components/laporan/ExportPanel"

export default async function ExportPage() {
  const user = await getCurrentUser()
  const invoices = invoiceStore.getAll()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const forwarders = forwarderStore.getAll()
  const suppliers = supplierStore.getAll()

  const brandLabel = (id: string | null) => (id ? brands.find((b) => b.id === id)?.name ?? id : "")
  const countryLabel = (id: string | null) => (id ? countries.find((c) => c.id === id)?.name ?? id : "")
  const forwarderLabel = (id: string | null) => (id ? forwarders.find((f) => f.id === id)?.name ?? id : "")
  const vendorLabel = (id: string | null) => (id ? suppliers.find((s) => s.id === id)?.name ?? id : "")

  const datasets = [
    {
      key: "shipment",
      label: "Input Shipment/Import",
      description: "Seluruh data shipment beserta status barang & pembayaran.",
      rows: invoices.flatMap((inv) =>
        inv.shipments.flatMap((s) =>
          s.items.map((it) => ({
            Shipment: s.shipmentName,
            Brand: brandLabel(inv.brandId),
            Negara: countryLabel(inv.countryId),
            Invoice: inv.invoice,
            PO: s.po,
            Qty: it.qty,
            "Price Satuan": it.priceSatuan,
            "Total Price": it.qty * it.priceSatuan,
            "AIR/SEA": s.airSea,
            PIB: s.pib,
            "Status Barang": s.statusBarang,
            "Tgl Pickup": s.tanggalPickup,
            ETD: s.etd,
            "ETA Pelabuhan": s.eta,
            "ETA Gudang": s.etaGudang,
            "Status Bayar PI": inv.statusPembayaranPI,
            Forwarder: forwarderLabel(s.forwarderId),
            "Status Bayar FO": s.statusPembayaranFO,
            "Nilai Forwarder": s.nilaiForwarder,
            "Status Shipment": s.statusShipment,
          }))
        )
      ),
    },
    {
      key: "shipment-dtd",
      label: "Input Shipment DTD/Launching",
      description: "Data shipment door-to-door beserta GAP hari yang dihitung otomatis.",
      rows: shipmentsDtd.map((s) => ({
        Shipment: s.shipmentName,
        Brand: brandLabel(s.brandId),
        "Item Number": s.itemNumber,
        Deskripsi: s.description,
        Qty: s.qty,
        Price: s.price,
        "Sampe Agent": s.sampeAgent,
        "Sampe MCHE": s.sampeMche,
        "GAP (hari)": calcGapDays(s.sampeAgent, s.sampeMche),
        Vendor: vendorLabel(s.vendorId),
        Status: s.status,
        Cost: s.cost,
      })),
    },
  ]

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Export Excel/PDF" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Export Excel/PDF</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Ekspor data untuk dibagikan ke pihak yang belum pakai aplikasi. File CSV bisa langsung dibuka di Excel.
          </p>
        </div>

        <ExportPanel datasets={datasets} />
      </div>
    </AppLayout>
  )
}
