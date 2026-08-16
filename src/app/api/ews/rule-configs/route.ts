import { NextResponse } from "next/server"

import { ewsRuleConfigStore } from "@/lib/data/ews"

export async function GET() {
  return NextResponse.json({ data: ewsRuleConfigStore.getAll() })
}
