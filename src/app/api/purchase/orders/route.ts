import { NextResponse } from "next/server"
import { purchaseOrderData } from "@/lib/data/purchase"
import { sanitizePurchaseOrder } from "@/lib/data/purchase-sanitize"

export async function GET() {
  return NextResponse.json({ data: await purchaseOrderData.getAll() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = sanitizePurchaseOrder(body)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  const record = await purchaseOrderData.create(result)
  return NextResponse.json({ data: record }, { status: 201 })
}
