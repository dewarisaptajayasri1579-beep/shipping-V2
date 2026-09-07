import { NextResponse } from "next/server"
import { supplierInvoiceData, validateInvoiceQty } from "@/lib/data/purchase"
import { sanitizeSupplierInvoice } from "@/lib/data/purchase-sanitize"

export async function GET() {
  return NextResponse.json({ data: await supplierInvoiceData.getAll() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = sanitizeSupplierInvoice(body)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  const qtyError = await validateInvoiceQty(result)
  if (qtyError) return NextResponse.json({ error: qtyError }, { status: 400 })
  const record = await supplierInvoiceData.create(result)
  return NextResponse.json({ data: record }, { status: 201 })
}
