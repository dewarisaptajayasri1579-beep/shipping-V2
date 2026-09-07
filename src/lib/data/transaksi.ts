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
// Input Shipment/Import — gabungan sheet DATABASE + SPREADSHEET lama, ditambah kolom
// Tgl Pickup/ETD/ETA/ETA Gudang (dulu cuma 1 kolom TANGGAL KEDATANGAN).
//
// Hierarki (dasarnya tetap sheet DATABASE, cuma dikelompokkan biar No Invoice/No PO/PIB
// gak diulang di tiap baris item seperti Excel-nya):
//   Invoice   — 1 Invoice bisa dikirim beberapa kali (No Invoice, Brand, Negara Asal,
//               status & jatuh tempo bayar PI — Nilai Billing dihitung otomatis)
//     Shipment  — 1 PO = 1 kali kirim (No PO, PIB, AIR/SEA, Gudang, Forwarder, Nilai
//                 Forwarder, status & jatuh tempo bayar FO, status barang/shipment,
//                 Tgl Pickup/ETD/ETA/ETA Gudang — Total dihitung otomatis)
//       Item      — itemId, Qty, Harga Satuan (Subtotal dihitung otomatis)
// ---------------------------------------------------------------------------

export interface ShipmentItem extends BaseRecord {
  itemId: string | null
  qty: number
  priceSatuan: number
}

/** 1 PO = 1 kali kirim (delivery/pengiriman fisik), makanya PIB, AIR/SEA, tanggal-tanggal,
 *  dan Forwarder nempel di sini — bukan lagi di header terpisah di atas Invoice. */
export interface Shipment extends BaseRecord {
  shipmentName: string
  /** No PO, ditulis tanpa prefix "No" di UI. */
  po: string
  /** URL/path scan dokumen PO — disimpan lokal dulu, nanti dipindah ke Google Drive. */
  documentUrl: string | null
  /** PIB, ditulis tanpa prefix "No" di UI — 1 PIB per kedatangan fisik barang (per Shipment). */
  pib: string
  /** URL/path scan dokumen PIB — disimpan lokal dulu, nanti dipindah ke Google Drive. */
  pibDocumentUrl: string | null
  airSea: AirSea
  warehouseId: string | null
  statusBarang: StatusBarang
  /** Tgl pickup barang dari vendor/supplier di negara asal. */
  tanggalPickup: string | null
  /** ETD — tanggal keberangkatan dari ekspedisi/forwarder. */
  etd: string | null
  /** ETA — tanggal sampai di Pelabuhan Indonesia. EWS "eta-mendekat" & "pib-belum-lengkap" pakai field ini. */
  eta: string | null
  /** ETA Gudang — tanggal sampai di gudang PT Mitra (setelah proses pelabuhan selesai). */
  etaGudang: string | null
  forwarderId: string | null
  statusPembayaranFO: StatusPembayaran
  nilaiForwarder: number
  dueDateFO: string | null
  statusShipment: StatusShipment
  items: ShipmentItem[]
}

/** Invoice = level teratas. 1 Invoice bisa dikirim beberapa kali (beberapa PO/Shipment). */
export interface Invoice extends BaseRecord {
  /** No Invoice, ditulis tanpa prefix "No" di UI. */
  invoice: string
  brandId: string | null
  countryId: string | null
  /** URL/path scan dokumen Invoice — disimpan lokal dulu, nanti dipindah ke Google Drive. */
  documentUrl: string | null
  statusPembayaranPI: StatusPembayaran
  dueDatePI: string | null
  shipments: Shipment[]
}
export const invoiceStore = createJsonStore<Invoice>("invoices.json")

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
  invoiceId: string
  /** Shipment (PO) yang statusnya diubah — cuma diisi untuk paymentType "FO" (PI tetap per-invoice). */
  shipmentId: string | null
  paymentType: PaymentType
  status: StatusPembayaran
  note: string | null
  changedAt: string
}
export const paymentLogStore = createJsonStore<PaymentLog>("payment_logs.json")
