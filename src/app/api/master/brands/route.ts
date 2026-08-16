import { brandStore, type Brand } from "@/lib/data/master"
import { listCreateHandlers, requiredString } from "@/lib/data/api-helpers"

export const { GET, POST } = listCreateHandlers<Brand, { name: string }>(brandStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Brand wajib diisi" }
  return { name }
})
