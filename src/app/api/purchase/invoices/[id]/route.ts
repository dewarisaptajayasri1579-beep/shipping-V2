import { NextResponse } from "next/server"
import { supplierInvoiceData, validateInvoiceQty } from "@/lib/data/purchase"
import { sanitizeSupplierInvoice } from "@/lib/data/purchase-sanitize"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = sanitizeSupplierInvoice(body)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  const qtyError = await validateInvoiceQty(result, id)
  if (qtyError) return NextResponse.json({ error: qtyError }, { status: 400 })
  const record = await supplierInvoiceData.update(id, result).catch(() => null)
  if (!record) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ data: record })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await supplierInvoiceData
    .remove(id)
    .then(() => true)
    .catch(() => false)
  if (!ok) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
