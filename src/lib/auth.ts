import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"
import { IS_DUMMY_MODE } from "@/lib/dummy-data"

const SESSION_COOKIE = "session_id"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 hari

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, "hex")
  const candidate = scryptSync(password, salt, 64)
  if (candidate.length !== hashBuffer.length) return false
  return timingSafeEqual(candidate, hashBuffer)
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  // Mode dummy: tidak ada tabel session di DB (tidak ada DB sama sekali), jadi cookie-nya
  // langsung menyimpan userId, bukan id session yang dicatat di Postgres.
  const cookieValue = IS_DUMMY_MODE ? userId : (await prisma.session.create({ data: { userId, expiresAt } })).id

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  return { id: cookieValue, userId, expiresAt }
}

export async function destroySession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId && !IS_DUMMY_MODE) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
  }
  cookieStore.delete(SESSION_COOKIE)
}

/** shipping-v2 fase awal: auth dilewati dulu (lihat docs/step.md fase 0), jadi selalu
 *  kembalikan user bawaan ini tanpa cek cookie/session. Hapus blok ini dan aktifkan
 *  logic session di bawah kalau auth mau dipakai lagi. */
const SKIP_AUTH_USER = {
  id: "guest",
  name: "Guest",
  email: "guest@shipping-v2.local",
  role: "owner" as const,
  phoneNumber: null,
  createdAt: new Date(0).toISOString(),
}

export async function getSessionUser() {
  return SKIP_AUTH_USER
}
