/** Konstanta & tipe murni (tanpa import fs) — aman diimpor dari Client Component.
 *  Layer store (src/lib/data/transaksi.ts) memakai node:fs sehingga hanya boleh
 *  diimpor dari Server Component. */

export const AIR_SEA = ["AIR", "SEA"] as const
export type AirSea = (typeof AIR_SEA)[number]

export const STATUS_BARANG = ["BELUM DATANG", "ON GOING", "BARANG SUDAH DATANG"] as const
export type StatusBarang = (typeof STATUS_BARANG)[number]

export const STATUS_PEMBAYARAN = ["BELUM DIBAYAR", "SUDAH DIBAYAR"] as const
export type StatusPembayaran = (typeof STATUS_PEMBAYARAN)[number]

export const STATUS_SHIPMENT = ["PENDING INVOICE FW", "PENDING PEMBAYARAN FW", "ON GOING", "DONE"] as const
export type StatusShipment = (typeof STATUS_SHIPMENT)[number]

export const STATUS_DTD = ["ON PRODUCING", "ON GOING", "MENUNGGU PEMBAYARAN FW", "DONE"] as const
export type StatusDtd = (typeof STATUS_DTD)[number]

export const PAYMENT_TYPES = ["PI", "FO"] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  PI: "Pembayaran ke Supplier (PI)",
  FO: "Pembayaran ke Forwarder (FO)",
}
