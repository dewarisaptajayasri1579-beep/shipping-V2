import { itemStore, type Item } from "@/lib/data/master"
import { listCreateHandlers, requiredString, optionalString } from "@/lib/data/api-helpers"

interface ItemInput {
  itemCode: string
  hsCode: string
  description: string
  internalCode: string | null
  brandId: string | null
}

export const { GET, POST } = listCreateHandlers<Item, ItemInput>(itemStore, (body) => {
  const input = body as Record<string, unknown>
  const itemCode = requiredString(input?.itemCode)
  if (!itemCode) return { error: "Kode Item wajib diisi" }
  return {
    itemCode,
    hsCode: requiredString(input?.hsCode),
    description: requiredString(input?.description),
    internalCode: optionalString(input?.internalCode),
    brandId: optionalString(input?.brandId),
  }
})
