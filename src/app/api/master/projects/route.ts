import { projectStore, type Project } from "@/lib/data/master"
import { listCreateHandlers, requiredString } from "@/lib/data/api-helpers"

export const { GET, POST } = listCreateHandlers<Project, { name: string }>(projectStore, (body) => {
  const name = requiredString((body as { name?: unknown })?.name)
  if (!name) return { error: "Nama Project wajib diisi" }
  return { name }
})
