import { NextResponse } from "next/server"

import { waSettingStore } from "@/lib/data/ews"

export async function GET() {
  return NextResponse.json({ data: waSettingStore.getAll() })
}
