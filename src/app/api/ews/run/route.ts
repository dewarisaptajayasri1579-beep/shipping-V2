import { NextResponse } from "next/server"

import { runEwsCheck } from "@/lib/ews/engine"

export async function POST() {
  const result = await runEwsCheck()
  return NextResponse.json({ data: result })
}
