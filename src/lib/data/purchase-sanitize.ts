import { requiredString, optionalString, numberOrZero, enumValue } from "./api-helpers"
import type { PurchaseOrderInput, SupplierInvoiceInput, ShipmentInput } from "./purchase"

const STATUS_PEMBAYARAN = ["BELUM DIBAYAR", "SUDAH DIBAYAR"] as const
const FORWARDER_DOC_STATUS = ["BELUM ADA INVOICE", "INVOICE DITERIMA", "DOKUMEN KE FINANCE", "WAITING PAYMENT", "PAID"] as const

function sanitizePoItem(body: unknown) {
  const input = body as Record<string, unknown>
  return {
    id: optionalString(input?.id) ?? undefined,
    itemId: optionalString(input?.itemId),
    qtyOrder: numberOrZero(input?.qtyOrder),
    unitPrice: numberOrZero(input?.unitPrice),
  }
}

export function sanitizePurchaseOrder(body: unknown): PurchaseOrderInput | { error: string } {
  const input = body as Record<string, unknown>
  const poNumber = requiredString(input?.poNumber)
  if (!poNumber) return { error: "No PO wajib diisi" }

  return {
    poNumber,
    poDate: optionalString(input?.poDate),
    supplierId: optionalString(input?.supplierId),
    brandId: optionalString(input?.brandId),
    countryId: optionalString(input?.countryId),
    currency: requiredString(input?.currency) || "USD",
    notes: optionalString(input?.notes),
    documentUrl: optionalString(input?.documentUrl),
    items: Array.isArray(input?.items) ? input.items.map(sanitizePoItem) : [],
  }
}

function sanitizeInvoiceItem(body: unknown) {
  const input = body as Record<string, unknown>
  return {
    id: optionalString(input?.id) ?? undefined,
    purchaseOrderItemId: requiredString(input?.purchaseOrderItemId),
    qty: numberOrZero(input?.qty),
    unitPrice: numberOrZero(input?.unitPrice),
  }
}

export function sanitizeSupplierInvoice(body: unknown): SupplierInvoiceInput | { error: string } {
  const input = body as Record<string, unknown>
  const invoiceNumber = requiredString(input?.invoiceNumber)
  if (!invoiceNumber) return { error: "No Invoice wajib diisi" }
  const purchaseOrderId = requiredString(input?.purchaseOrderId)
  if (!purchaseOrderId) return { error: "PO wajib dipilih" }

  return {
    invoiceNumber,
    invoiceDate: optionalString(input?.invoiceDate),
    purchaseOrderId,
    countryId: optionalString(input?.countryId),
    currency: requiredString(input?.currency) || "USD",
    notes: optionalString(input?.notes),
    documentUrl: optionalString(input?.documentUrl),
    paymentStatus: enumValue(STATUS_PEMBAYARAN, input?.paymentStatus, "BELUM DIBAYAR"),
    dueDate: optionalString(input?.dueDate),
    paymentDate: optionalString(input?.paymentDate),
    items: Array.isArray(input?.items) ? input.items.map(sanitizeInvoiceItem) : [],
  }
}

function sanitizeShipmentItem(body: unknown) {
  const input = body as Record<string, unknown>
  const qtyReceived = input?.qtyReceived
  return {
    id: optionalString(input?.id) ?? undefined,
    invoiceItemId: requiredString(input?.invoiceItemId),
    qtyShipped: numberOrZero(input?.qtyShipped),
    qtyReceived: qtyReceived === null || qtyReceived === undefined || qtyReceived === "" ? null : numberOrZero(qtyReceived),
  }
}

export function sanitizeShipment(body: unknown): ShipmentInput | { error: string } {
  const input = body as Record<string, unknown>

  return {
    shipmentDate: optionalString(input?.shipmentDate),
    originCountryId: optionalString(input?.originCountryId),
    mode: enumValue(["AIR", "SEA"] as const, input?.mode, "AIR"),
    forwarderId: optionalString(input?.forwarderId),
    destinationWarehouseId: optionalString(input?.destinationWarehouseId),
    originPort: optionalString(input?.originPort),
    destinationPort: optionalString(input?.destinationPort),
    notes: optionalString(input?.notes),
    isDraft: input?.isDraft === true,
    plannedPickupDate: optionalString(input?.plannedPickupDate),
    actualPickupDate: optionalString(input?.actualPickupDate),
    etd: optionalString(input?.etd),
    atd: optionalString(input?.atd),
    eta: optionalString(input?.eta),
    ata: optionalString(input?.ata),
    customsReleaseDate: optionalString(input?.customsReleaseDate),
    warehouseReceiptDate: optionalString(input?.warehouseReceiptDate),
    actualWarehouseId: optionalString(input?.actualWarehouseId),
    receivedBy: optionalString(input?.receivedBy),
    receivingNotes: optionalString(input?.receivingNotes),
    receivingDocumentUrl: optionalString(input?.receivingDocumentUrl),
    pib: optionalString(input?.pib),
    nopen: optionalString(input?.nopen),
    pibDate: optionalString(input?.pibDate),
    notul: input?.notul === true,
    notulNotes: optionalString(input?.notulNotes),
    customsBillingValue: numberOrZero(input?.customsBillingValue),
    customsBillingDate: optionalString(input?.customsBillingDate),
    customsPaymentStatus: enumValue(STATUS_PEMBAYARAN, input?.customsPaymentStatus, "BELUM DIBAYAR"),
    customsPaymentDate: optionalString(input?.customsPaymentDate),
    customsDocumentUrl: optionalString(input?.customsDocumentUrl),
    forwarderInvoiceNumber: optionalString(input?.forwarderInvoiceNumber),
    forwarderInvoiceDate: optionalString(input?.forwarderInvoiceDate),
    forwarderBillingValue: numberOrZero(input?.forwarderBillingValue),
    forwarderDocStatus: enumValue(FORWARDER_DOC_STATUS, input?.forwarderDocStatus, "BELUM ADA INVOICE"),
    forwarderDocDate: optionalString(input?.forwarderDocDate),
    forwarderPaymentStatus: enumValue(STATUS_PEMBAYARAN, input?.forwarderPaymentStatus, "BELUM DIBAYAR"),
    forwarderPaymentDate: optionalString(input?.forwarderPaymentDate),
    forwarderDocumentUrl: optionalString(input?.forwarderDocumentUrl),
    items: Array.isArray(input?.items) ? input.items.map(sanitizeShipmentItem) : [],
  }
}
