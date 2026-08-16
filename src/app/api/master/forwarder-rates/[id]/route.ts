import { NextResponse } from "next/server"

import { forwarderRateStore } from "@/lib/data/master"

/** Rate hanya bisa dihapus, bukan diedit — histori perubahan harga harus tetap utuh.
 *  Kalau rate salah input, hapus lalu tambah entri baru. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = forwarderRateStore.remove(id)
  if (!ok) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
