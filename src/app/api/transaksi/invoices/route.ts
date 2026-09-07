import { invoiceStore, type Invoice } from "@/lib/data/transaksi"
import { listCreateHandlers } from "@/lib/data/api-helpers"
import { sanitizeInvoice, type InvoiceInput } from "@/lib/data/shipment-sanitize"

export const { GET, POST } = listCreateHandlers<Invoice, InvoiceInput>(invoiceStore, sanitizeInvoice)
