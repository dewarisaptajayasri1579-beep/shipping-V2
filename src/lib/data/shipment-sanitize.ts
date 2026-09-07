import type { Invoice, Shipment, ShipmentItem } from "./transaksi"
import { AIR_SEA, STATUS_BARANG, STATUS_PEMBAYARAN, STATUS_SHIPMENT } from "./transaksi"
import { requiredString, optionalString, numberOrZero, enumValue } from "./api-helpers"

export type InvoiceInput = Omit<Invoice, "id" | "createdAt" | "updatedAt">

function nowIso() {
  return new Date().toISOString()
}

function sanitizeItem(body: unknown): ShipmentItem {
  const input = body as Record<string, unknown>
  const now = nowIso()
  return {
    id: requiredString(input?.id) || crypto.randomUUID(),
    createdAt: requiredString(input?.createdAt) || now,
    updatedAt: now,
    itemId: optionalString(input?.itemId),
    qty: numberOrZero(input?.qty),
    priceSatuan: numberOrZero(input?.priceSatuan),
  }
}

function sanitizeShipment(body: unknown): Shipment {
  const input = body as Record<string, unknown>
  const now = nowIso()
  const items = Array.isArray(input?.items) ? input.items.map(sanitizeItem) : []
  return {
    id: requiredString(input?.id) || crypto.randomUUID(),
    createdAt: requiredString(input?.createdAt) || now,
    updatedAt: now,
    shipmentName: requiredString(input?.shipmentName),
    po: requiredString(input?.po),
    documentUrl: optionalString(input?.documentUrl),
    pib: requiredString(input?.pib),
    pibDocumentUrl: optionalString(input?.pibDocumentUrl),
    airSea: enumValue(AIR_SEA, input?.airSea, "AIR"),
    warehouseId: optionalString(input?.warehouseId),
    statusBarang: enumValue(STATUS_BARANG, input?.statusBarang, "BELUM DATANG"),
    tanggalPickup: optionalString(input?.tanggalPickup),
    etd: optionalString(input?.etd),
    eta: optionalString(input?.eta),
    etaGudang: optionalString(input?.etaGudang),
    forwarderId: optionalString(input?.forwarderId),
    statusPembayaranFO: enumValue(STATUS_PEMBAYARAN, input?.statusPembayaranFO, "BELUM DIBAYAR"),
    nilaiForwarder: numberOrZero(input?.nilaiForwarder),
    dueDateFO: optionalString(input?.dueDateFO),
    statusShipment: enumValue(STATUS_SHIPMENT, input?.statusShipment, "PENDING INVOICE FW"),
    items,
  }
}

export function sanitizeInvoice(body: unknown): InvoiceInput | { error: string } {
  const input = body as Record<string, unknown>
  const invoice = requiredString(input?.invoice)
  if (!invoice) return { error: "No Invoice wajib diisi" }

  const shipments = Array.isArray(input?.shipments) ? input.shipments.map(sanitizeShipment) : []

  return {
    invoice,
    brandId: optionalString(input?.brandId),
    countryId: optionalString(input?.countryId),
    documentUrl: optionalString(input?.documentUrl),
    statusPembayaranPI: enumValue(STATUS_PEMBAYARAN, input?.statusPembayaranPI, "BELUM DIBAYAR"),
    dueDatePI: optionalString(input?.dueDatePI),
    shipments,
  }
}
