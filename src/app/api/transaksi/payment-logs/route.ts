import { NextResponse } from "next/server"

import { paymentLogStore, shipmentStore, PAYMENT_TYPES, STATUS_PEMBAYARAN } from "@/lib/data/transaksi"
import { requiredString, optionalString, enumValue } from "@/lib/data/api-helpers"

export async function GET() {
  return NextResponse.json({ data: paymentLogStore.getAll() })
}

/** Nyimpen log perubahan status pembayaran (audit trail) SEKALIGUS update field
 *  status terkini di shipment-nya, supaya tabel Input Shipment tetap nunjukin status
 *  terbaru tanpa harus join ke log tiap kali render. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const input = body as Record<string, unknown> | null

  const shipmentId = requiredString(input?.shipmentId)
  if (!shipmentId) return NextResponse.json({ error: "Shipment wajib dipilih" }, { status: 400 })

  const shipment = shipmentStore.getById(shipmentId)
  if (!shipment) return NextResponse.json({ error: "Shipment tidak ditemukan" }, { status: 404 })

  const paymentType = PAYMENT_TYPES.find((p) => p === input?.paymentType)
  if (!paymentType) return NextResponse.json({ error: "Jenis pembayaran tidak valid" }, { status: 400 })

  const status = enumValue(STATUS_PEMBAYARAN, input?.status, "BELUM DIBAYAR")
  const note = optionalString(input?.note)
  const changedAt = requiredString(input?.changedAt) || new Date().toISOString().slice(0, 10)

  const log = paymentLogStore.create({ shipmentId, paymentType, status, note, changedAt })

  shipmentStore.update(shipmentId, paymentType === "PI" ? { statusPembayaranPI: status } : { statusPembayaranFO: status })

  return NextResponse.json({ data: log }, { status: 201 })
}
