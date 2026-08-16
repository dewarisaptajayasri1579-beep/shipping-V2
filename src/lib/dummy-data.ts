import fs from "node:fs"
import path from "node:path"

/** Mode demo tanpa database — aktif otomatis kalau DATABASE_URL belum di-set (mis. lagi
 *  ngetes tampilan template sebelum konek ke Postgres beneran). Login pakai salah satu
 *  email di bawah + password DUMMY_PASSWORD, atau lewat "Login cepat" di halaman login.
 *
 *  Datanya disimpan di file JSON (bukan cuma variabel in-memory) karena Next.js dev server
 *  jalan multi-worker — tiap worker punya module state sendiri-sendiri, jadi user baru yang
 *  dibuat di satu request bisa "hilang" kalau request berikutnya nyasar ke worker lain. Baca/tulis
 *  langsung ke file di setiap operasi supaya semua worker/proses lihat data yang sama. */
export const IS_DUMMY_MODE = !process.env.DATABASE_URL

export const DUMMY_PASSWORD = "demo123"

export interface DummyUser {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "user"
  phoneNumber: string | null
  createdAt: string
}

const DATA_FILE = path.join(process.cwd(), ".dummy-users.json")

const SEED_USERS: DummyUser[] = [
  { id: "dummy-owner", name: "Owner Demo", email: "owner@demo.local", role: "owner", phoneNumber: "081200000001", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "dummy-admin", name: "Admin Demo", email: "admin@demo.local", role: "admin", phoneNumber: "081200000002", createdAt: "2026-01-02T00:00:00.000Z" },
]

function readUsers(): DummyUser[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as DummyUser[]
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_USERS, null, 2))
    return SEED_USERS
  }
}

function writeUsers(users: DummyUser[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2))
}

export function getDummyUsers(): DummyUser[] {
  return readUsers()
}

export function findDummyUserById(id: string): DummyUser | null {
  return readUsers().find((u) => u.id === id) ?? null
}

export function findDummyUserByEmail(email: string): DummyUser | null {
  return readUsers().find((u) => u.email === email) ?? null
}

export function addDummyUser(user: Omit<DummyUser, "id" | "createdAt">): DummyUser {
  const users = readUsers()
  const newUser: DummyUser = { ...user, id: `dummy-${Date.now()}`, createdAt: new Date().toISOString() }
  users.push(newUser)
  writeUsers(users)
  return newUser
}

export function updateDummyUser(id: string, patch: Partial<Omit<DummyUser, "id" | "createdAt">>): DummyUser | null {
  const users = readUsers()
  const user = users.find((u) => u.id === id)
  if (!user) return null
  Object.assign(user, patch)
  writeUsers(users)
  return user
}

export function deleteDummyUser(id: string): boolean {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return false
  users.splice(index, 1)
  writeUsers(users)
  return true
}
