import { warehouseStore, type Warehouse } from "@/lib/data/master"
import { listCreateHandlers, requiredString } from "@/lib/data/api-helpers"

export const { GET, POST } = listCreateHandlers<Warehouse, { name: string }>(warehouseStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Gudang wajib diisi" }
  return { name }
})
