/** Helper murni (tanpa node:fs) untuk hitung total & meratakan struktur Invoice ->
 *  Shipment[] -> Item[]. Dipakai dari Server Component (lib/data/transaksi.ts) maupun
 *  Client Component (InvoiceTable dkk yang punya tipe row sendiri), makanya ditulis
 *  generik lewat duck-typing, bukan import langsung tipe Invoice. */

export interface ShipmentItemLike {
  id: string
  itemId: string | null
  qty: number
  priceSatuan: number
}

export interface ShipmentLike {
  id: string
  shipmentName: string
  items: ShipmentItemLike[]
}

export interface InvoiceWithShipmentsLike {
  id: string
  invoice: string
  shipments: ShipmentLike[]
}

/** Total 1 Shipment (PO) = jumlah qty x price semua item di dalamnya. */
export function shipmentTotalValue(s: Pick<ShipmentLike, "items">): number {
  return s.items.reduce((sum, it) => sum + it.qty * it.priceSatuan, 0)
}

/** Nilai Billing 1 Invoice = jumlah Total semua Shipment (PO) di dalamnya — dihitung
 *  otomatis dari data item, bukan input manual (supaya gak dobel-input dgn data PO). */
export function invoiceTotalValue(inv: Pick<InvoiceWithShipmentsLike, "shipments">): number {
  return inv.shipments.reduce((sum, s) => sum + shipmentTotalValue(s), 0)
}

export interface FlatShipmentItem {
  invoiceId: string
  invoice: string
  shipmentId: string
  shipmentName: string
  itemId: string | null
  qty: number
  priceSatuan: number
}

/** Ratakan Invoice[] -> 1 baris per item, dipakai untuk ranking/agregasi (Top 20, cek
 *  harga menyimpang, dst) yang sebelumnya operasi langsung di baris Shipment flat. */
export function flattenInvoiceItems(invoices: InvoiceWithShipmentsLike[]): FlatShipmentItem[] {
  return invoices.flatMap((inv) =>
    inv.shipments.flatMap((s) =>
      s.items.map((it) => ({
        invoiceId: inv.id,
        invoice: inv.invoice,
        shipmentId: s.id,
        shipmentName: s.shipmentName,
        itemId: it.itemId,
        qty: it.qty,
        priceSatuan: it.priceSatuan,
      }))
    )
  )
}
