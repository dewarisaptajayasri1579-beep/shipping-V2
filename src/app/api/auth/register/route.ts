import { NextResponse } from "next/server"

import { createSession, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { IS_DUMMY_MODE } from "@/lib/dummy-data"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const phoneNumber = typeof body?.phoneNumber === "string" && body.phoneNumber.trim() ? body.phoneNumber.trim() : null
  const password = typeof body?.password === "string" ? body.password : ""

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 })
  }

  if (IS_DUMMY_MODE) {
    // Tidak ada DB sama sekali di mode ini, jadi pendaftaran tidak benar-benar disimpan —
    // cukup kasih tahu di UI supaya tidak terlihat seperti gagal diam-diam.
    return NextResponse.json({
      ok: true,
      dummyMode: true,
      message: "Mode demo: pendaftaran tidak disimpan. Silakan login dengan owner@demo.local / admin@demo.local (password demo123).",
    })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 })

  const user = await prisma.user.create({
    data: { name, email, phoneNumber, role: "user", passwordHash: hashPassword(password) },
  })

  await createSession(user.id)

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
}
