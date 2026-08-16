import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { getApiUser } from "@/lib/current-user"
import { IS_DUMMY_MODE, findDummyUserByEmail, addDummyUser } from "@/lib/dummy-data"

export async function POST(request: Request) {
  const currentUser = await getApiUser()
  if (!currentUser || currentUser.role !== "owner") {
    return NextResponse.json({ error: "Cuma Owner yang boleh menambah pengguna" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const role = body?.role === "owner" || body?.role === "admin" || body?.role === "user" ? body.role : "user"
  const phoneNumber = typeof body?.phoneNumber === "string" && body.phoneNumber.trim() ? body.phoneNumber.trim() : null

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 })
  }

  if (IS_DUMMY_MODE) {
    if (findDummyUserByEmail(email)) {
      return NextResponse.json({ error: "Email sudah dipakai" }, { status: 409 })
    }
    const user = addDummyUser({ name, email, role, phoneNumber })
    return NextResponse.json({ ok: true, user, dummyMode: true })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email sudah dipakai" }, { status: 409 })

  const user = await prisma.user.create({
    data: { name, email, role, phoneNumber, passwordHash: hashPassword(password) },
  })

  return NextResponse.json({ ok: true, user })
}
