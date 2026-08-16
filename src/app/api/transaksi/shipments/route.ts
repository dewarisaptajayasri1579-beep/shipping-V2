import { shipmentStore, type Shipment } from "@/lib/data/transaksi"
import { listCreateHandlers } from "@/lib/data/api-helpers"
import { sanitizeShipment, type ShipmentInput } from "@/lib/data/shipment-sanitize"

export const { GET, POST } = listCreateHandlers<Shipment, ShipmentInput>(shipmentStore, sanitizeShipment)
