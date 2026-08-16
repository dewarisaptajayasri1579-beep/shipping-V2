import { countryStore, type Country } from "@/lib/data/master"
import { updateDeleteHandlers, requiredString } from "@/lib/data/api-helpers"

export const { PATCH, DELETE } = updateDeleteHandlers<Country, { name: string }>(countryStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Negara wajib diisi" }
  return { name }
})
