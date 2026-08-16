import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getApiUser } from "@/lib/current-user"
import { IS_DUMMY_MODE, updateDummyUser, deleteDummyUser } from "@/lib/dummy-data"

async function requireOwner() {
  const currentUser = await getApiUser()
  if (!currentUser || currentUser.role !== "owner") return null
  return currentUser
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireOwner()
  if (!currentUser) return NextResponse.json({ error: "Cuma Owner yang boleh mengubah pengguna" }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : undefined
  const role = body?.role === "owner" || body?.role === "admin" || body?.role === "user" ? body.role : undefined
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() || null : undefined

  if (IS_DUMMY_MODE) {
    const user = updateDummyUser(id, { name, role, phoneNumber })
    if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 })
    return NextResponse.json({ ok: true, user, dummyMode: true })
  }

  const user = await prisma.user.update({ where: { id }, data: { name, role, phoneNumber } }).catch(() => null)
  if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 })

  return NextResponse.json({ ok: true, user })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireOwner()
  if (!currentUser) return NextResponse.json({ error: "Cuma Owner yang boleh menghapus pengguna" }, { status: 403 })

  const { id } = await params
  if (id === currentUser.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 })
  }

  if (IS_DUMMY_MODE) {
    const ok = deleteDummyUser(id)
    if (!ok) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 })
    return NextResponse.json({ ok: true, dummyMode: true })
  }

  await prisma.user.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
