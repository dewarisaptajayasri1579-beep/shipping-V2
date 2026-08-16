import { NextResponse } from "next/server"

import { alertLogStore, ALERT_STATUS } from "@/lib/data/ews"
import { enumValue } from "@/lib/data/api-helpers"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = enumValue(ALERT_STATUS, (body as { status?: unknown } | null)?.status, "SUDAH DITANGANI")

  const record = alertLogStore.update(id, { status })
  if (!record) return NextResponse.json({ error: "Log tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ data: record })
}
