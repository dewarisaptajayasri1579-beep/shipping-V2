import { createJsonStore, type BaseRecord } from "./json-store"
import type { AirSea, StatusBarang, StatusPembayaran, StatusShipment, StatusDtd, PaymentType } from "./transaksi-constants"

export {
  AIR_SEA,
  STATUS_BARANG,
  STATUS_PEMBAYARAN,
  STATUS_SHIPMENT,
  STATUS_DTD,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABEL,
  type AirSea,
  type StatusBarang,
  type StatusPembayaran,
  type StatusShipment,
  type StatusDtd,
  type PaymentType,
} from "./transaksi-constants"

// ---------------------------------------------------------------------------
// Input Shipment/Import — gabungan sheet DATABASE + SPREADSHEET lama
// ---------------------------------------------------------------------------

export interface Shipment extends BaseRecord {
  shipmentName: string
  brandId: string | null
  countryId: string | null
  noInvoice: string
  noPO: string
  itemId: string | null
  qty: number
  priceSatuan: number
  noPIB: string
  airSea: AirSea
  warehouseId: string | null
  statusBarang: StatusBarang
  tanggalKedatangan: string | null
  statusPembayaranPI: StatusPembayaran
  nilaiBilling: number
  /** Tanggal jatuh tempo pembayaran ke supplier — field baru, belum ada di Excel lama,
   *  ditambahkan supaya aturan EWS "Jatuh tempo pembayaran mendekat" bisa jalan. */
  dueDatePI: string | null
  forwarderId: string | null
  statusPembayaranFO: StatusPembayaran
  nilaiForwarder: number
  /** Tanggal jatuh tempo pembayaran ke forwarder — sama alasannya dengan dueDatePI. */
  dueDateFO: string | null
  statusShipment: StatusShipment
}
export const shipmentStore = createJsonStore<Shipment>("shipments.json")

// ---------------------------------------------------------------------------
// Input Shipment DTD/Launching — sheet DATABASE DTD. GAP (sampeMche - sampeAgent)
// dihitung otomatis saat dibaca (lihat lib/gap.ts), bukan disimpan manual.
// ---------------------------------------------------------------------------

export interface ShipmentDtd extends BaseRecord {
  shipmentName: string
  projectId: string | null
  countryId: string | null
  brandId: string | null
  itemNumber: string
  description: string
  qty: number
  price: number
  kg: number | null
  sampeAgent: string | null
  sampeMche: string | null
  vendorId: string | null
  status: StatusDtd
  cost: number
  internalCode: string | null
}
export const shipmentDtdStore = createJsonStore<ShipmentDtd>("shipments_dtd.json")

// ---------------------------------------------------------------------------
// Update Status Pembayaran — log/histori perubahan status pembayaran ke
// supplier (PI) & forwarder (FO), bukan cuma field status, supaya ada audit trail.
// ---------------------------------------------------------------------------

export interface PaymentLog extends BaseRecord {
  shipmentId: string
  paymentType: PaymentType
  status: StatusPembayaran
  note: string | null
  changedAt: string
}
export const paymentLogStore = createJsonStore<PaymentLog>("payment_logs.json")
