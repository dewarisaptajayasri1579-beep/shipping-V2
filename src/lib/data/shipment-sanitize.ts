import type { Shipment } from "./transaksi"
import { AIR_SEA, STATUS_BARANG, STATUS_PEMBAYARAN, STATUS_SHIPMENT } from "./transaksi"
import { requiredString, optionalString, numberOrZero, enumValue } from "./api-helpers"

export type ShipmentInput = Omit<Shipment, "id" | "createdAt" | "updatedAt">

export function sanitizeShipment(body: unknown): ShipmentInput | { error: string } {
  const input = body as Record<string, unknown>
  const shipmentName = requiredString(input?.shipmentName)
  if (!shipmentName) return { error: "Nama Shipment wajib diisi" }

  return {
    shipmentName,
    brandId: optionalString(input?.brandId),
    countryId: optionalString(input?.countryId),
    noInvoice: requiredString(input?.noInvoice),
    noPO: requiredString(input?.noPO),
    itemId: optionalString(input?.itemId),
    qty: numberOrZero(input?.qty),
    priceSatuan: numberOrZero(input?.priceSatuan),
    noPIB: requiredString(input?.noPIB),
    airSea: enumValue(AIR_SEA, input?.airSea, "AIR"),
    warehouseId: optionalString(input?.warehouseId),
    statusBarang: enumValue(STATUS_BARANG, input?.statusBarang, "BELUM DATANG"),
    tanggalKedatangan: optionalString(input?.tanggalKedatangan),
    statusPembayaranPI: enumValue(STATUS_PEMBAYARAN, input?.statusPembayaranPI, "BELUM DIBAYAR"),
    nilaiBilling: numberOrZero(input?.nilaiBilling),
    dueDatePI: optionalString(input?.dueDatePI),
    forwarderId: optionalString(input?.forwarderId),
    statusPembayaranFO: enumValue(STATUS_PEMBAYARAN, input?.statusPembayaranFO, "BELUM DIBAYAR"),
    nilaiForwarder: numberOrZero(input?.nilaiForwarder),
    dueDateFO: optionalString(input?.dueDateFO),
    statusShipment: enumValue(STATUS_SHIPMENT, input?.statusShipment, "PENDING INVOICE FW"),
  }
}
