import { NextResponse } from "next/server"

import { ewsRuleConfigStore } from "@/lib/data/ews"

export async function PATCH(request: Request, { params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params
  const body = await request.json().catch(() => null)
  const input = body as { enabled?: unknown; params?: unknown } | null

  const patch: { enabled?: boolean; params?: Record<string, number> } = {}
  if (typeof input?.enabled === "boolean") patch.enabled = input.enabled
  if (input?.params && typeof input.params === "object") {
    const cleaned: Record<string, number> = {}
    for (const [key, value] of Object.entries(input.params as Record<string, unknown>)) {
      const n = Number(value)
      if (Number.isFinite(n)) cleaned[key] = n
    }
    patch.params = cleaned
  }

  const record = ewsRuleConfigStore.update(ruleId, patch)
  if (!record) return NextResponse.json({ error: "Aturan tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ data: record })
}
