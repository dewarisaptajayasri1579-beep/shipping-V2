import { NextResponse } from "next/server"
import { shipmentData, validateShipmentQty } from "@/lib/data/purchase"
import { sanitizeShipment } from "@/lib/data/purchase-sanitize"

export async function GET() {
  return NextResponse.json({ data: await shipmentData.getAll() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = sanitizeShipment(body)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  const qtyError = await validateShipmentQty(result)
  if (qtyError) return NextResponse.json({ error: qtyError }, { status: 400 })
  const record = await shipmentData.create(result)
  return NextResponse.json({ data: record }, { status: 201 })
}
