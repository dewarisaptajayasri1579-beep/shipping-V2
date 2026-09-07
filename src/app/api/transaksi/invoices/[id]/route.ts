import { invoiceStore, type Invoice } from "@/lib/data/transaksi"
import { updateDeleteHandlers } from "@/lib/data/api-helpers"
import { sanitizeInvoice, type InvoiceInput } from "@/lib/data/shipment-sanitize"

export const { PATCH, DELETE } = updateDeleteHandlers<Invoice, InvoiceInput>(invoiceStore, sanitizeInvoice)
