import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

/** Upload scan dokumen (PO/Invoice/PIB) dari form Tambah/Kelola Shipment. Disimpan lokal
 *  di public/uploads/ dulu — belum ada credentials Google Drive, jadi integrasi Drive
 *  menyusul (tinggal ganti isi handler ini, bentuk response { url, name } bisa tetap sama). */
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null)
  const file = formData?.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File wajib diisi" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 })
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const ext = path.extname(file.name).slice(0, 10)
  const safeName = `${crypto.randomUUID()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer)

  return NextResponse.json({ url: `/uploads/${safeName}`, name: file.name }, { status: 201 })
}
