import { supplierStore, type Supplier } from "@/lib/data/master"
import { updateDeleteHandlers, requiredString, stringArray } from "@/lib/data/api-helpers"

interface SupplierInput {
  name: string
  brandIds: string[]
}

export const { PATCH, DELETE } = updateDeleteHandlers<Supplier, SupplierInput>(supplierStore, (body) => {
  const input = body as { name?: unknown; brandIds?: unknown }
  const name = requiredString(input?.name)
  if (!name) return { error: "Nama Supplier wajib diisi" }
  return { name, brandIds: stringArray(input?.brandIds) }
})
