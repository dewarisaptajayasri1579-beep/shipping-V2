import { NextResponse } from "next/server"

import { paymentLogStore, invoiceStore, PAYMENT_TYPES, STATUS_PEMBAYARAN } from "@/lib/data/transaksi"
import { requiredString, optionalString, enumValue } from "@/lib/data/api-helpers"

export async function GET() {
  return NextResponse.json({ data: paymentLogStore.getAll() })
}

/** Nyimpen log perubahan status pembayaran (audit trail) SEKALIGUS update field status
 *  terkini di data invoice/shipment-nya, supaya tabel Input Shipment tetap nunjukin
 *  status terbaru tanpa harus join ke log tiap kali render. PI = status per Invoice
 *  (satu field, invoice-nya sendiri yang jadi baris), FO = status per Shipment/PO
 *  (nested di dalam invoice, jadi wajib pilih shipment-nya). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const input = body as Record<string, unknown> | null

  const invoiceId = requiredString(input?.invoiceId)
  if (!invoiceId) return NextResponse.json({ error: "Invoice wajib dipilih" }, { status: 400 })

  const invoice = invoiceStore.getById(invoiceId)
  if (!invoice) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 })

  const paymentType = PAYMENT_TYPES.find((p) => p === input?.paymentType)
  if (!paymentType) return NextResponse.json({ error: "Jenis pembayaran tidak valid" }, { status: 400 })

  const shipmentId = optionalString(input?.shipmentId)
  if (paymentType === "FO" && (!shipmentId || !invoice.shipments.some((s) => s.id === shipmentId))) {
    return NextResponse.json({ error: "Shipment (PO) wajib dipilih" }, { status: 400 })
  }

  const status = enumValue(STATUS_PEMBAYARAN, input?.status, "BELUM DIBAYAR")
  const note = optionalString(input?.note)
  const changedAt = requiredString(input?.changedAt) || new Date().toISOString().slice(0, 10)

  const log = paymentLogStore.create({ invoiceId, shipmentId: paymentType === "FO" ? shipmentId : null, paymentType, status, note, changedAt })

  if (paymentType === "PI") {
    invoiceStore.update(invoiceId, { statusPembayaranPI: status })
  } else {
    invoiceStore.update(invoiceId, {
      shipments: invoice.shipments.map((s) => (s.id === shipmentId ? { ...s, statusPembayaranFO: status } : s)),
    })
  }

  return NextResponse.json({ data: log }, { status: 201 })
}
