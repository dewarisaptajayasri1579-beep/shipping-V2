import { NextResponse } from "next/server"

import { waSettingStore } from "@/lib/data/ews"
import { stringArray } from "@/lib/data/api-helpers"

export async function PATCH(request: Request, { params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params
  const body = await request.json().catch(() => null)
  const input = body as { targetNumbers?: unknown; active?: unknown; roles?: unknown } | null

  const patch: { targetNumbers?: string[]; active?: boolean; roles?: string[] } = {}
  if (input?.targetNumbers !== undefined) patch.targetNumbers = stringArray(input.targetNumbers)
  if (typeof input?.active === "boolean") patch.active = input.active
  if (input?.roles !== undefined) patch.roles = stringArray(input.roles)

  const record = waSettingStore.update(ruleId, patch)
  if (!record) return NextResponse.json({ error: "Pengaturan tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ data: record })
}
