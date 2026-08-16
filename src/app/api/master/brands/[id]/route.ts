import { brandStore, type Brand } from "@/lib/data/master"
import { updateDeleteHandlers, requiredString } from "@/lib/data/api-helpers"

export const { PATCH, DELETE } = updateDeleteHandlers<Brand, { name: string }>(brandStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Brand wajib diisi" }
  return { name }
})
