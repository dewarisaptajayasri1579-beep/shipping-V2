import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getApiUser } from "@/lib/current-user"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { IS_DUMMY_MODE } from "@/lib/dummy-data"

export async function POST(request: Request) {
  const currentUser = await getApiUser()
  if (!currentUser) return NextResponse.json({ error: "Belum login" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : ""
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : ""

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Password lama dan baru wajib diisi" }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 })
  }

  if (IS_DUMMY_MODE) {
    return NextResponse.json({
      ok: true,
      dummyMode: true,
      message: "Mode demo: ubah password tidak benar-benar disimpan, tetap pakai demo123.",
    })
  }

  const user = await prisma.user.findUnique({ where: { id: currentUser.id } })
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 401 })
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } })

  return NextResponse.json({ ok: true })
}
