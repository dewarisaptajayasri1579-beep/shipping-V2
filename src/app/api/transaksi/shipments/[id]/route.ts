import { shipmentStore, type Shipment } from "@/lib/data/transaksi"
import { updateDeleteHandlers } from "@/lib/data/api-helpers"
import { sanitizeShipment, type ShipmentInput } from "@/lib/data/shipment-sanitize"

export const { PATCH, DELETE } = updateDeleteHandlers<Shipment, ShipmentInput>(shipmentStore, sanitizeShipment)
