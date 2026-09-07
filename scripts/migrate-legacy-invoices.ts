/** Migrasi 1x-jalan: data/invoices.json (model lama Invoice -> Shipment(PO) -> Item,
 *  dipakai halaman "Transaksi > Input Shipment/Import" lama) -> tabel PurchaseOrder /
 *  SupplierInvoice / Shipment yang baru (Postgres, docs/tahapan-input-shipment.md Fase 1-3).
 *
 *  Aman dijalankan berkali-kali? TIDAK — bikin PO/Invoice/Shipment baru tiap dipanggil.
 *  Jalankan sekali: npx tsx scripts/migrate-legacy-invoices.ts
 *
 *  Data lama gak punya konsep PO terpisah, jadi 1 old-Shipment (yang punya field `po`)
 *  dijadikan 1 PurchaseOrder baru. Tanggal yang di model lama sebenarnya sudah aktual
 *  (bukan estimasi) dipetakan ke field actual/warehouse-receipt yang baru; field yang
 *  gak ada padanannya (ATD, Customs Release Date, dll) dibiarkan kosong -- bukan dikarang.
 */
import fs from "node:fs"
import path from "node:path"
import { prisma } from "../src/lib/prisma"

interface LegacyItem {
  itemId: string | null
  qty: number
  priceSatuan: number
}
interface LegacyShipment {
  shipmentName: string
  po: string
  documentUrl: string | null
  pib: string
  pibDocumentUrl: string | null
  airSea: "AIR" | "SEA"
  warehouseId: string | null
  statusBarang: string
  tanggalPickup: string | null
  etd: string | null
  eta: string | null
  etaGudang: string | null
  forwarderId: string | null
  statusPembayaranFO: "BELUM DIBAYAR" | "SUDAH DIBAYAR"
  nilaiForwarder: number
  dueDateFO: string | null
  statusShipment: string
  items: LegacyItem[]
}
interface LegacyInvoice {
  invoice: string
  brandId: string | null
  countryId: string | null
  documentUrl: string | null
  statusPembayaranPI: "BELUM DIBAYAR" | "SUDAH DIBAYAR"
  dueDatePI: string | null
  shipments: LegacyShipment[]
}

function toDate(v: string | null): Date | null {
  return v ? new Date(v) : null
}

async function nextShipmentNo(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.shipment.count({ where: { shipmentNo: { startsWith: `SHP-${year}-` } } })
  return `SHP-${year}-${String(count + 1).padStart(5, "0")}`
}

async function main() {
  const filePath = path.join(process.cwd(), "data", "invoices.json")
  const legacy: LegacyInvoice[] = JSON.parse(fs.readFileSync(filePath, "utf-8"))

  let migratedInvoices = 0
  let migratedShipments = 0
  let skipped = 0

  for (const inv of legacy) {
    if (inv.shipments.length === 0) {
      console.log(`SKIP (tanpa data PO/shipment, kemungkinan data uji coba): Invoice ${inv.invoice}`)
      skipped++
      continue
    }

    for (const shp of inv.shipments) {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: shp.po || `PO-LEGACY-${inv.invoice}`,
          poDate: null,
          supplierId: null,
          brandId: inv.brandId,
          countryId: inv.countryId,
          currency: "USD",
          notes: `Dimigrasikan otomatis dari data lama (Invoice ${inv.invoice}, ${new Date().toISOString().slice(0, 10)}).`,
          items: { create: shp.items.map((it) => ({ itemId: it.itemId, qtyOrder: it.qty, unitPrice: it.priceSatuan })) },
        },
        include: { items: true },
      })

      const newInvoice = await prisma.supplierInvoice.create({
        data: {
          invoiceNumber: inv.invoice,
          invoiceDate: null,
          purchaseOrderId: po.id,
          countryId: inv.countryId,
          currency: "USD",
          notes: "Dimigrasikan otomatis dari data lama.",
          documentUrl: inv.documentUrl,
          paymentStatus: inv.statusPembayaranPI,
          dueDate: toDate(inv.dueDatePI),
          paymentDate: null,
          items: {
            create: po.items.map((poItem, idx) => ({
              purchaseOrderItemId: poItem.id,
              qty: shp.items[idx].qty,
              unitPrice: shp.items[idx].priceSatuan,
            })),
          },
        },
        include: { items: true },
      })

      const arrived = shp.statusBarang === "BARANG SUDAH DATANG"
      await prisma.shipment.create({
        data: {
          shipmentNo: await nextShipmentNo(),
          shipmentDate: null,
          originCountryId: inv.countryId,
          mode: shp.airSea,
          forwarderId: shp.forwarderId,
          destinationWarehouseId: shp.warehouseId,
          notes: `Dimigrasikan dari data lama. Nama shipment lama: "${shp.shipmentName}". Status lama: ${shp.statusBarang} / ${shp.statusShipment}.`,
          isDraft: false,
          actualPickupDate: toDate(shp.tanggalPickup),
          etd: toDate(shp.etd),
          eta: toDate(shp.eta),
          ata: arrived ? toDate(shp.eta) : null,
          warehouseReceiptDate: toDate(shp.etaGudang),
          actualWarehouseId: shp.warehouseId,
          pib: shp.pib || null,
          customsDocumentUrl: shp.pibDocumentUrl,
          forwarderBillingValue: shp.nilaiForwarder,
          forwarderDocStatus: shp.statusPembayaranFO === "SUDAH DIBAYAR" ? "PAID" : "BELUM ADA INVOICE",
          forwarderPaymentStatus: shp.statusPembayaranFO,
          items: {
            create: newInvoice.items.map((invItem, idx) => ({
              invoiceItemId: invItem.id,
              qtyShipped: shp.items[idx].qty,
              qtyReceived: arrived ? shp.items[idx].qty : null,
            })),
          },
        },
      })

      migratedShipments++
    }
    migratedInvoices++
  }

  console.log(`\nSelesai: ${migratedInvoices} invoice / ${migratedShipments} shipment berhasil dimigrasi, ${skipped} dilewati (tanpa data PO/shipment).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
