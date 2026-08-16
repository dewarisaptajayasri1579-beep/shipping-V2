import { shipmentDtdStore, type ShipmentDtd, STATUS_DTD } from "@/lib/data/transaksi"
import { listCreateHandlers, requiredString, optionalString, numberOrZero, enumValue } from "@/lib/data/api-helpers"

type ShipmentDtdInput = Omit<ShipmentDtd, "id" | "createdAt" | "updatedAt">

function sanitize(body: unknown) {
  const input = body as Record<string, unknown>
  const shipmentName = requiredString(input?.shipmentName)
  if (!shipmentName) return { error: "Nama Shipment wajib diisi" }

  const kgRaw = input?.kg
  const kg = kgRaw === "" || kgRaw === null || kgRaw === undefined ? null : numberOrZero(kgRaw)

  const result: ShipmentDtdInput = {
    shipmentName,
    projectId: optionalString(input?.projectId),
    countryId: optionalString(input?.countryId),
    brandId: optionalString(input?.brandId),
    itemNumber: requiredString(input?.itemNumber),
    description: requiredString(input?.description),
    qty: numberOrZero(input?.qty),
    price: numberOrZero(input?.price),
    kg,
    sampeAgent: optionalString(input?.sampeAgent),
    sampeMche: optionalString(input?.sampeMche),
    vendorId: optionalString(input?.vendorId),
    status: enumValue(STATUS_DTD, input?.status, "ON PRODUCING"),
    cost: numberOrZero(input?.cost),
    internalCode: optionalString(input?.internalCode),
  }
  return result
}

export const { GET, POST } = listCreateHandlers<ShipmentDtd, ShipmentDtdInput>(shipmentDtdStore, sanitize)
