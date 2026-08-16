import { countryStore, type Country } from "@/lib/data/master"
import { listCreateHandlers, requiredString } from "@/lib/data/api-helpers"

export const { GET, POST } = listCreateHandlers<Country, { name: string }>(countryStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Negara wajib diisi" }
  return { name }
})
