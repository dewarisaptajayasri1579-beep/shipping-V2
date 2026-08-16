import { NextResponse } from "next/server"

import { alertLogStore } from "@/lib/data/ews"

export async function GET() {
  return NextResponse.json({ data: alertLogStore.getAll() })
}
