import { NextResponse } from "next/server"

import type { BaseRecord } from "./json-store"

type Store<T extends BaseRecord> = {
  getAll: () => T[]
  getById: (id: string) => T | null
  create: (record: Omit<T, "id" | "createdAt" | "updatedAt">) => T
  update: (id: string, patch: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>) => T | null
  remove: (id: string) => boolean
}

type Sanitized<C> = C | { error: string }

/** Bikin handler GET (list) + POST (create) untuk `route.ts` sebuah resource master data.
 *  `sanitize` bertugas validasi + pilih field yang boleh diisi dari body request. */
export function listCreateHandlers<T extends BaseRecord, C extends object>(
  store: Store<T>,
  sanitize: (body: unknown) => Sanitized<C>
) {
  async function GET() {
    return NextResponse.json({ data: store.getAll() })
  }

  async function POST(request: Request) {
    const body = await request.json().catch(() => null)
    const result = sanitize(body)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
    const record = store.create(result as unknown as Omit<T, "id" | "createdAt" | "updatedAt">)
    return NextResponse.json({ data: record }, { status: 201 })
  }

  return { GET, POST }
}

/** Bikin handler PATCH (update) + DELETE untuk `route.ts` sebuah resource master data. */
export function updateDeleteHandlers<T extends BaseRecord, U extends object>(
  store: Store<T>,
  sanitize: (body: unknown) => Sanitized<U>
) {
  async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json().catch(() => null)
    const result = sanitize(body)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
    const record = store.update(id, result as unknown as Partial<Omit<T, "id" | "createdAt" | "updatedAt">>)
    if (!record) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    return NextResponse.json({ data: record })
  }

  async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const ok = store.remove(id)
    if (!ok) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  return { PATCH, DELETE }
}

export function requiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function optionalString(value: unknown): string | null {
  const str = typeof value === "string" ? value.trim() : ""
  return str || null
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
}

export function numberOrZero(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function enumValue<T extends readonly string[]>(allowed: T, value: unknown, fallback: T[number]): T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback
}
