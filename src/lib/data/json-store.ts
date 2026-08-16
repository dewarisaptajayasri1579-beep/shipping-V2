import fs from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), "data")

/** Record dasar yang wajib dipunyai tiap entitas yang disimpan lewat store ini. */
export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
}

/** Factory layer data berbasis file JSON — dipakai untuk semua entitas shipping-v2
 *  (Master Data, Transaksi, dst) selama belum pindah ke Postgres/Prisma.
 *
 *  Baca & tulis langsung ke file di tiap operasi (bukan cache di memory) karena Next.js
 *  dev server jalan multi-worker — tiap worker punya module state sendiri-sendiri, jadi
 *  data yang ditulis di satu request bisa "hilang" kalau request berikutnya nyasar ke
 *  worker lain. Pola sama seperti src/lib/dummy-data.ts. */
export function createJsonStore<T extends BaseRecord>(fileName: string, seed: T[] = []) {
  const filePath = path.join(DATA_DIR, fileName)

  function readAll(): T[] {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[]
    } catch {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(seed, null, 2))
      return seed
    }
  }

  function writeAll(records: T[]) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2))
  }

  function getAll(): T[] {
    return readAll()
  }

  function getById(id: string): T | null {
    return readAll().find((r) => r.id === id) ?? null
  }

  function create(record: Omit<T, "id" | "createdAt" | "updatedAt">): T {
    const now = new Date().toISOString()
    const records = readAll()
    const newRecord = { ...record, id: crypto.randomUUID(), createdAt: now, updatedAt: now } as T
    records.push(newRecord)
    writeAll(records)
    return newRecord
  }

  function update(id: string, patch: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): T | null {
    const records = readAll()
    const record = records.find((r) => r.id === id)
    if (!record) return null
    Object.assign(record, patch, { updatedAt: new Date().toISOString() })
    writeAll(records)
    return record
  }

  function remove(id: string): boolean {
    const records = readAll()
    const index = records.findIndex((r) => r.id === id)
    if (index === -1) return false
    records.splice(index, 1)
    writeAll(records)
    return true
  }

  return { getAll, getById, create, update, remove }
}
