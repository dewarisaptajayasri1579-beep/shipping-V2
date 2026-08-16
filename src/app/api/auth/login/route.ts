import { NextResponse } from "next/server"

import { createSession, verifyPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DUMMY_PASSWORD, IS_DUMMY_MODE, findDummyUserByEmail } from "@/lib/dummy-data"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 })
  }

  if (IS_DUMMY_MODE) {
    const user = findDummyUserByEmail(email)
    if (!user || password !== DUMMY_PASSWORD) {
      return NextResponse.json({ error: "Email atau password salah (mode demo: password = demo123)" }, { status: 401 })
    }
    await createSession(user.id)
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 })
  }

  await createSession(user.id)

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
}
