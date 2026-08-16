import { forwarderStore, type Forwarder } from "@/lib/data/master"
import { updateDeleteHandlers, requiredString } from "@/lib/data/api-helpers"

export const { PATCH, DELETE } = updateDeleteHandlers<Forwarder, { name: string }>(forwarderStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Forwarder wajib diisi" }
  return { name }
})
