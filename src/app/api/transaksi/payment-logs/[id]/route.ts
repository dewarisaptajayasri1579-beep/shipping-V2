import { NextResponse } from "next/server"

import { paymentLogStore } from "@/lib/data/transaksi"

/** Log cuma bisa dihapus (koreksi salah input), bukan diedit — audit trail harus utuh. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = paymentLogStore.remove(id)
  if (!ok) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
