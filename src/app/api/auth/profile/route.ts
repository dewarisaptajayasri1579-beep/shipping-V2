import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getApiUser } from "@/lib/current-user"
import { IS_DUMMY_MODE, updateDummyUser } from "@/lib/dummy-data"

export async function PATCH(request: Request) {
  const currentUser = await getApiUser()
  if (!currentUser) return NextResponse.json({ error: "Belum login" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() || null : undefined

  if (!name) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 })

  if (IS_DUMMY_MODE) {
    const user = updateDummyUser(currentUser.id, { name, phoneNumber })
    return NextResponse.json({ ok: true, user, dummyMode: true })
  }

  const user = await prisma.user.update({ where: { id: currentUser.id }, data: { name, phoneNumber } })
  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
}
