import {
  forwarderRateStore,
  type ForwarderRate,
  CHARGE_TYPES,
  CONTAINER_SIZES,
  INCOTERMS,
} from "@/lib/data/master"
import { listCreateHandlers, requiredString } from "@/lib/data/api-helpers"

interface ForwarderRateInput {
  forwarderId: string
  chargeType: (typeof CHARGE_TYPES)[number]
  containerSize: (typeof CONTAINER_SIZES)[number]
  incoterm: (typeof INCOTERMS)[number]
  amount: number
  effectiveDate: string
}

export const { GET, POST } = listCreateHandlers<ForwarderRate, ForwarderRateInput>(forwarderRateStore, (body) => {
  const input = body as Record<string, unknown>
  const forwarderId = requiredString(input?.forwarderId)
  const chargeType = CHARGE_TYPES.find((c) => c === input?.chargeType)
  const containerSize = CONTAINER_SIZES.find((c) => c === input?.containerSize)
  const incoterm = INCOTERMS.find((c) => c === input?.incoterm)
  const amount = typeof input?.amount === "number" ? input.amount : Number(input?.amount)
  const effectiveDate = requiredString(input?.effectiveDate)

  if (!forwarderId) return { error: "Forwarder wajib dipilih" }
  if (!chargeType) return { error: "Charge type tidak valid" }
  if (!containerSize) return { error: "Ukuran kontainer tidak valid" }
  if (!incoterm) return { error: "Incoterm tidak valid" }
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Nominal rate harus lebih dari 0" }
  if (!effectiveDate) return { error: "Tanggal berlaku wajib diisi" }

  return { forwarderId, chargeType, containerSize, incoterm, amount, effectiveDate }
})
