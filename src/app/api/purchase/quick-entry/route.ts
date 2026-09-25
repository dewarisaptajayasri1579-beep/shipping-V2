import { NextResponse } from "next/server"
import { createQuickEntryBatch } from "@/lib/data/purchase"
import { sanitizeQuickEntryRows } from "@/lib/data/purchase-sanitize"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = sanitizeQuickEntryRows(body)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  const summary = await createQuickEntryBatch(result)
  return NextResponse.json({ data: summary }, { status: 201 })
}
