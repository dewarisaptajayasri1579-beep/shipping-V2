import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data-access layer buat Purchase Order -> Supplier Invoice -> Shipment (Postgres
// via Prisma) — beda dari master data/transaksi lain di app ini yang masih pakai
// createJsonStore (file JSON), lihat docs/tahapan-input-shipment.md Fase 1.
//
// Status PO/Invoice/Shipment TIDAK disimpan sebagai kolom, dihitung di sini dari
// qty & tanggal (spec §16 & §30 — "jangan minta user pilih status manual kalau
// bisa diturunkan").
// ---------------------------------------------------------------------------

/** Field tanggal dari form cuma "YYYY-MM-DD" (dari <input type="date">), tapi Prisma
 *  DateTime butuh ISO-8601 lengkap — convert di sini biar tiap create/update gak perlu
 *  ingat-ingat konversinya sendiri-sendiri. */
function toDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const poWithItems = { include: { items: true } } satisfies Prisma.PurchaseOrderDefaultArgs
export type PurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<typeof poWithItems>

const invoiceWithItems = {
  include: { items: { include: { purchaseOrderItem: true } }, purchaseOrder: true },
} satisfies Prisma.SupplierInvoiceDefaultArgs
export type SupplierInvoiceWithItems = Prisma.SupplierInvoiceGetPayload<typeof invoiceWithItems>

const shipmentWithItems = {
  include: { items: { include: { invoiceItem: { include: { purchaseOrderItem: true, supplierInvoice: true } } } } },
} satisfies Prisma.ShipmentDefaultArgs
export type ShipmentWithItems = Prisma.ShipmentGetPayload<typeof shipmentWithItems>

// --- Purchase Order ---------------------------------------------------------

export interface PurchaseOrderItemInput {
  id?: string
  itemId: string | null
  qtyOrder: number
  unitPrice: number
}

export interface PurchaseOrderInput {
  poNumber: string
  poDate: string | null
  supplierId: string | null
  brandId: string | null
  countryId: string | null
  currency: string
  notes: string | null
  documentUrl: string | null
  items: PurchaseOrderItemInput[]
}

function poHeaderData(input: PurchaseOrderInput) {
  return {
    poNumber: input.poNumber,
    poDate: toDate(input.poDate),
    supplierId: input.supplierId,
    brandId: input.brandId,
    countryId: input.countryId,
    currency: input.currency,
    notes: input.notes,
    documentUrl: input.documentUrl,
  }
}

export const purchaseOrderData = {
  getAll: () => prisma.purchaseOrder.findMany({ ...poWithItems, orderBy: { createdAt: "desc" } }),
  getById: (id: string) => prisma.purchaseOrder.findUnique({ where: { id }, ...poWithItems }),
  create: (input: PurchaseOrderInput) =>
    prisma.purchaseOrder.create({
      data: {
        ...poHeaderData(input),
        items: { create: input.items.map((it) => ({ itemId: it.itemId, qtyOrder: it.qtyOrder, unitPrice: it.unitPrice })) },
      },
      ...poWithItems,
    }),
  update: (id: string, input: PurchaseOrderInput) =>
    prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id },
        data: poHeaderData(input),
      })
      // Replace-all-items: sederhana & konsisten sama pola nested update di model
      // JSON-store lain di app ini (PATCH ngirim ulang seluruh array item).
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
      if (input.items.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: input.items.map((it) => ({ purchaseOrderId: id, itemId: it.itemId, qtyOrder: it.qtyOrder, unitPrice: it.unitPrice })),
        })
      }
      return tx.purchaseOrder.findUniqueOrThrow({ where: { id }, ...poWithItems })
    }),
  remove: (id: string) => prisma.purchaseOrder.delete({ where: { id } }),
}

/** Qty PO yang sudah masuk Invoice, per PO Item. */
export function invoicedQtyByPoItem(po: PurchaseOrderWithItems, invoices: SupplierInvoiceWithItems[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of po.items) result[item.id] = 0
  for (const inv of invoices) {
    if (inv.purchaseOrderId !== po.id) continue
    for (const item of inv.items) {
      result[item.purchaseOrderItemId] = (result[item.purchaseOrderItemId] ?? 0) + item.qty
    }
  }
  return result
}

export function purchaseOrderTotals(po: PurchaseOrderWithItems) {
  const orderedQty = po.items.reduce((sum, it) => sum + it.qtyOrder, 0)
  const orderedValue = po.items.reduce((sum, it) => sum + it.qtyOrder * it.unitPrice, 0)
  return { orderedQty, orderedValue }
}

// --- Supplier Invoice --------------------------------------------------------

export interface InvoiceItemInput {
  id?: string
  purchaseOrderItemId: string
  qty: number
  unitPrice: number
}

export interface SupplierInvoiceInput {
  invoiceNumber: string
  invoiceDate: string | null
  purchaseOrderId: string
  countryId: string | null
  currency: string
  notes: string | null
  documentUrl: string | null
  paymentStatus: "BELUM DIBAYAR" | "SUDAH DIBAYAR"
  dueDate: string | null
  paymentDate: string | null
  items: InvoiceItemInput[]
}

/** spec §8.5: Qty Invoice tidak boleh melebihi sisa Qty PO. `excludeInvoiceId` dipakai
 *  pas edit, supaya qty invoice yang lagi diedit sendiri gak dihitung dobel. */
export async function validateInvoiceQty(input: SupplierInvoiceInput, excludeInvoiceId?: string): Promise<string | null> {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: input.purchaseOrderId }, ...poWithItems })
  if (!po) return "PO tidak ditemukan"

  const otherInvoices = await prisma.supplierInvoice.findMany({
    where: { purchaseOrderId: input.purchaseOrderId, id: excludeInvoiceId ? { not: excludeInvoiceId } : undefined },
    ...invoiceWithItems,
  })
  const alreadyInvoiced: Record<string, number> = {}
  for (const inv of otherInvoices) {
    for (const item of inv.items) alreadyInvoiced[item.purchaseOrderItemId] = (alreadyInvoiced[item.purchaseOrderItemId] ?? 0) + item.qty
  }

  for (const line of input.items) {
    const poItem = po.items.find((it) => it.id === line.purchaseOrderItemId)
    if (!poItem) return "Item PO tidak ditemukan"
    const remaining = poItem.qtyOrder - (alreadyInvoiced[poItem.id] ?? 0)
    if (line.qty > remaining) return `Qty invoice item ini (${line.qty}) melebihi sisa Qty PO (${remaining})`
  }
  return null
}

function invoiceHeaderData(input: SupplierInvoiceInput) {
  return {
    invoiceNumber: input.invoiceNumber,
    invoiceDate: toDate(input.invoiceDate),
    countryId: input.countryId,
    currency: input.currency,
    notes: input.notes,
    documentUrl: input.documentUrl,
    paymentStatus: input.paymentStatus,
    dueDate: toDate(input.dueDate),
    paymentDate: toDate(input.paymentDate),
  }
}

export const supplierInvoiceData = {
  getAll: () => prisma.supplierInvoice.findMany({ ...invoiceWithItems, orderBy: { createdAt: "desc" } }),
  getById: (id: string) => prisma.supplierInvoice.findUnique({ where: { id }, ...invoiceWithItems }),
  getByPurchaseOrder: (purchaseOrderId: string) => prisma.supplierInvoice.findMany({ where: { purchaseOrderId }, ...invoiceWithItems }),
  create: (input: SupplierInvoiceInput) =>
    prisma.supplierInvoice.create({
      data: {
        ...invoiceHeaderData(input),
        purchaseOrderId: input.purchaseOrderId,
        items: { create: input.items.map((it) => ({ purchaseOrderItemId: it.purchaseOrderItemId, qty: it.qty, unitPrice: it.unitPrice })) },
      },
      ...invoiceWithItems,
    }),
  update: (id: string, input: SupplierInvoiceInput) =>
    prisma.$transaction(async (tx) => {
      await tx.supplierInvoice.update({
        where: { id },
        data: invoiceHeaderData(input),
      })
      await tx.invoiceItem.deleteMany({ where: { supplierInvoiceId: id } })
      if (input.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: input.items.map((it) => ({ supplierInvoiceId: id, purchaseOrderItemId: it.purchaseOrderItemId, qty: it.qty, unitPrice: it.unitPrice })),
        })
      }
      return tx.supplierInvoice.findUniqueOrThrow({ where: { id }, ...invoiceWithItems })
    }),
  remove: (id: string) => prisma.supplierInvoice.delete({ where: { id } }),
}

/** Qty Invoice yang sudah masuk Shipment, per Invoice Item. */
export function shippedQtyByInvoiceItem(invoice: SupplierInvoiceWithItems, shipments: ShipmentWithItems[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of invoice.items) result[item.id] = 0
  for (const shp of shipments) {
    for (const item of shp.items) {
      if (item.invoiceItem.supplierInvoiceId !== invoice.id) continue
      result[item.invoiceItemId] = (result[item.invoiceItemId] ?? 0) + item.qtyShipped
    }
  }
  return result
}

export function supplierInvoiceTotals(invoice: SupplierInvoiceWithItems) {
  const invoicedQty = invoice.items.reduce((sum, it) => sum + it.qty, 0)
  const invoicedValue = invoice.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
  return { invoicedQty, invoicedValue }
}

// --- Shipment -----------------------------------------------------------------

export interface ShipmentItemInput {
  id?: string
  invoiceItemId: string
  qtyShipped: number
  qtyReceived: number | null
}

export interface ShipmentInput {
  shipmentDate: string | null
  originCountryId: string | null
  mode: "AIR" | "SEA"
  forwarderId: string | null
  destinationWarehouseId: string | null
  originPort: string | null
  destinationPort: string | null
  notes: string | null
  isDraft: boolean
  plannedPickupDate: string | null
  actualPickupDate: string | null
  etd: string | null
  atd: string | null
  eta: string | null
  ata: string | null
  customsReleaseDate: string | null
  warehouseReceiptDate: string | null
  actualWarehouseId: string | null
  receivedBy: string | null
  receivingNotes: string | null
  receivingDocumentUrl: string | null
  pib: string | null
  nopen: string | null
  pibDate: string | null
  notul: boolean
  notulNotes: string | null
  customsBillingValue: number
  customsBillingDate: string | null
  customsPaymentStatus: "BELUM DIBAYAR" | "SUDAH DIBAYAR"
  customsPaymentDate: string | null
  customsDocumentUrl: string | null
  forwarderInvoiceNumber: string | null
  forwarderInvoiceDate: string | null
  forwarderBillingValue: number
  forwarderDocStatus: "BELUM ADA INVOICE" | "INVOICE DITERIMA" | "DOKUMEN KE FINANCE" | "WAITING PAYMENT" | "PAID"
  forwarderDocDate: string | null
  forwarderPaymentStatus: "BELUM DIBAYAR" | "SUDAH DIBAYAR"
  forwarderPaymentDate: string | null
  forwarderDocumentUrl: string | null
  items: ShipmentItemInput[]
}

/** spec §9.5: Qty Shipped tidak boleh melebihi Qty Invoice yang masih tersedia.
 *  `excludeShipmentId` dipakai pas edit, sama pola kayak validateInvoiceQty. */
export async function validateShipmentQty(input: ShipmentInput, excludeShipmentId?: string): Promise<string | null> {
  const invoiceItemIds = input.items.map((it) => it.invoiceItemId)
  if (invoiceItemIds.length === 0) return null

  const invoiceItems = await prisma.invoiceItem.findMany({ where: { id: { in: invoiceItemIds } } })
  const otherShipmentItems = await prisma.shipmentItem.findMany({
    where: { invoiceItemId: { in: invoiceItemIds }, shipmentId: excludeShipmentId ? { not: excludeShipmentId } : undefined },
  })
  const alreadyShipped: Record<string, number> = {}
  for (const si of otherShipmentItems) alreadyShipped[si.invoiceItemId] = (alreadyShipped[si.invoiceItemId] ?? 0) + si.qtyShipped

  for (const line of input.items) {
    const invItem = invoiceItems.find((it) => it.id === line.invoiceItemId)
    if (!invItem) return "Invoice Item tidak ditemukan"
    const remaining = invItem.qty - (alreadyShipped[invItem.id] ?? 0)
    if (line.qtyShipped > remaining) return `Qty shipped item ini (${line.qtyShipped}) melebihi sisa Qty Invoice (${remaining})`
  }
  return null
}

async function nextShipmentNo(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.shipment.count({ where: { shipmentNo: { startsWith: `SHP-${year}-` } } })
  return `SHP-${year}-${String(count + 1).padStart(5, "0")}`
}

/** Field header Shipment yang sama persis dipakai di create & update — dipisah ke
 *  fungsi ini biar gak nulis 25+ field dua kali. */
function shipmentHeaderData(input: ShipmentInput) {
  return {
    shipmentDate: toDate(input.shipmentDate),
    originCountryId: input.originCountryId,
    mode: input.mode,
    forwarderId: input.forwarderId,
    destinationWarehouseId: input.destinationWarehouseId,
    originPort: input.originPort,
    destinationPort: input.destinationPort,
    notes: input.notes,
    isDraft: input.isDraft,
    plannedPickupDate: toDate(input.plannedPickupDate),
    actualPickupDate: toDate(input.actualPickupDate),
    etd: toDate(input.etd),
    atd: toDate(input.atd),
    eta: toDate(input.eta),
    ata: toDate(input.ata),
    customsReleaseDate: toDate(input.customsReleaseDate),
    warehouseReceiptDate: toDate(input.warehouseReceiptDate),
    actualWarehouseId: input.actualWarehouseId,
    receivedBy: input.receivedBy,
    receivingNotes: input.receivingNotes,
    receivingDocumentUrl: input.receivingDocumentUrl,
    pib: input.pib,
    nopen: input.nopen,
    pibDate: toDate(input.pibDate),
    notul: input.notul,
    notulNotes: input.notulNotes,
    customsBillingValue: input.customsBillingValue,
    customsBillingDate: toDate(input.customsBillingDate),
    customsPaymentStatus: input.customsPaymentStatus,
    customsPaymentDate: toDate(input.customsPaymentDate),
    customsDocumentUrl: input.customsDocumentUrl,
    forwarderInvoiceNumber: input.forwarderInvoiceNumber,
    forwarderInvoiceDate: toDate(input.forwarderInvoiceDate),
    forwarderBillingValue: input.forwarderBillingValue,
    forwarderDocStatus: input.forwarderDocStatus,
    forwarderDocDate: toDate(input.forwarderDocDate),
    forwarderPaymentStatus: input.forwarderPaymentStatus,
    forwarderPaymentDate: toDate(input.forwarderPaymentDate),
    forwarderDocumentUrl: input.forwarderDocumentUrl,
  }
}

export const shipmentData = {
  getAll: () => prisma.shipment.findMany({ ...shipmentWithItems, orderBy: { createdAt: "desc" } }),
  getById: (id: string) => prisma.shipment.findUnique({ where: { id }, ...shipmentWithItems }),
  create: async (input: ShipmentInput) =>
    prisma.shipment.create({
      data: {
        shipmentNo: await nextShipmentNo(),
        ...shipmentHeaderData(input),
        items: { create: input.items.map((it) => ({ invoiceItemId: it.invoiceItemId, qtyShipped: it.qtyShipped, qtyReceived: it.qtyReceived })) },
      },
      ...shipmentWithItems,
    }),
  update: (id: string, input: ShipmentInput) =>
    prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id },
        data: shipmentHeaderData(input),
      })
      await tx.shipmentItem.deleteMany({ where: { shipmentId: id } })
      if (input.items.length > 0) {
        await tx.shipmentItem.createMany({
          data: input.items.map((it) => ({ shipmentId: id, invoiceItemId: it.invoiceItemId, qtyShipped: it.qtyShipped, qtyReceived: it.qtyReceived })),
        })
      }
      return tx.shipment.findUniqueOrThrow({ where: { id }, ...shipmentWithItems })
    }),
  remove: (id: string) => prisma.shipment.delete({ where: { id } }),
}

export function shipmentTotals(shipment: ShipmentWithItems) {
  const shippedQty = shipment.items.reduce((sum, it) => sum + it.qtyShipped, 0)
  const shippedValue = shipment.items.reduce((sum, it) => sum + it.qtyShipped * it.invoiceItem.unitPrice, 0)
  return { shippedQty, shippedValue }
}

const DAY_MS = 1000 * 60 * 60 * 24

/** KPI paling penting di spec (§12): Warehouse Receipt Date - ATA Indonesia. Null kalau
 *  salah satu tanggalnya belum ada — jangan pernah diinput manual, cuma dihitung dari sini. */
export function arrivalToWarehouseGapDays(s: Pick<ShipmentWithItems, "ata" | "warehouseReceiptDate">): number | null {
  if (!s.ata || !s.warehouseReceiptDate) return null
  return Math.round((s.warehouseReceiptDate.getTime() - s.ata.getTime()) / DAY_MS)
}

/** KPI pendukung (§13.2): ATA -> Customs Release, dan Customs Release -> Warehouse — buat
 *  misahin delay-nya terjadi di Customs atau di pengiriman lokal setelah clearance. */
export function customsLeadTimeDays(s: Pick<ShipmentWithItems, "ata" | "customsReleaseDate">): number | null {
  if (!s.ata || !s.customsReleaseDate) return null
  return Math.round((s.customsReleaseDate.getTime() - s.ata.getTime()) / DAY_MS)
}

export function postCustomsDeliveryDays(s: Pick<ShipmentWithItems, "customsReleaseDate" | "warehouseReceiptDate">): number | null {
  if (!s.customsReleaseDate || !s.warehouseReceiptDate) return null
  return Math.round((s.warehouseReceiptDate.getTime() - s.customsReleaseDate.getTime()) / DAY_MS)
}

export interface ReceivingDiscrepancy {
  invoiceItemId: string
  itemId: string | null
  qtyShipped: number
  qtyReceived: number
  difference: number
}

/** spec §14.2: qty received boleh beda dari qty shipped — dicatat sebagai discrepancy,
 *  bukan diam-diam nimpa data shipment. */
export function shipmentDiscrepancies(shipment: ShipmentWithItems): ReceivingDiscrepancy[] {
  return shipment.items
    .filter((it) => it.qtyReceived !== null && it.qtyReceived !== it.qtyShipped)
    .map((it) => ({
      invoiceItemId: it.invoiceItemId,
      itemId: it.invoiceItem.purchaseOrderItem.itemId,
      qtyShipped: it.qtyShipped,
      qtyReceived: it.qtyReceived!,
      difference: it.qtyReceived! - it.qtyShipped,
    }))
}

// --- Status turunan (spec §16 & §30 — bukan input manual) --------------------

export type PoStatus =
  | "DRAFT"
  | "OPEN"
  | "PARTIALLY INVOICED"
  | "FULLY INVOICED"

export function computePoStatus(po: PurchaseOrderWithItems, invoicedByItem: Record<string, number>): PoStatus {
  if (po.items.length === 0) return "DRAFT"
  const totalOrdered = po.items.reduce((sum, it) => sum + it.qtyOrder, 0)
  const totalInvoiced = po.items.reduce((sum, it) => sum + (invoicedByItem[it.id] ?? 0), 0)
  if (totalInvoiced <= 0) return "OPEN"
  if (totalInvoiced >= totalOrdered) return "FULLY INVOICED"
  return "PARTIALLY INVOICED"
}

/** PO + status + sisa qty per item, bentuk yang dipakai form Tambah/Edit Supplier Invoice buat
 *  nge-filter "PO supplier ini yang masih bisa di-invoice" (dipakai di 3 halaman: list, new, [id]). */
export function purchaseOrdersForInvoiceForm(orders: PurchaseOrderWithItems[], invoices: SupplierInvoiceWithItems[]) {
  return orders.map((po) => {
    const invoicedByItem = invoicedQtyByPoItem(po, invoices)
    return {
      id: po.id,
      poNumber: po.poNumber,
      poDate: po.poDate ? po.poDate.toISOString().slice(0, 10) : null,
      supplierId: po.supplierId,
      items: po.items.map((it) => ({ id: it.id, itemId: it.itemId, qtyOrder: it.qtyOrder, unitPrice: it.unitPrice, alreadyInvoiced: invoicedByItem[it.id] ?? 0 })),
      status: computePoStatus(po, invoicedByItem),
    }
  })
}

export type InvoiceStatus = "DRAFT" | "READY TO SHIP" | "PARTIALLY SHIPPED" | "FULLY SHIPPED"

export function computeInvoiceStatus(invoice: SupplierInvoiceWithItems, shippedByItem: Record<string, number>): InvoiceStatus {
  if (invoice.items.length === 0) return "DRAFT"
  const totalInvoiced = invoice.items.reduce((sum, it) => sum + it.qty, 0)
  const totalShipped = invoice.items.reduce((sum, it) => sum + (shippedByItem[it.id] ?? 0), 0)
  if (totalShipped <= 0) return "READY TO SHIP"
  if (totalShipped >= totalInvoiced) return "FULLY SHIPPED"
  return "PARTIALLY SHIPPED"
}

export type ShipmentStatus =
  | "WAITING PICKUP"
  | "WAITING DEPARTURE"
  | "IN TRANSIT"
  | "CUSTOMS PROCESS"
  | "DELIVERY TO WAREHOUSE"
  | "PENDING FORWARDER PAYMENT"
  | "DONE"

/** Rule persis sesuai spec §16 — admin isi tanggal aktual, status ditentukan sistem. */
export function computeShipmentStatus(
  s: Pick<ShipmentWithItems, "actualPickupDate" | "atd" | "ata" | "customsReleaseDate" | "warehouseReceiptDate" | "forwarderPaymentStatus">
): ShipmentStatus {
  if (!s.actualPickupDate) return "WAITING PICKUP"
  if (!s.atd) return "WAITING DEPARTURE"
  if (!s.ata) return "IN TRANSIT"
  if (!s.customsReleaseDate) return "CUSTOMS PROCESS"
  if (!s.warehouseReceiptDate) return "DELIVERY TO WAREHOUSE"
  if (s.forwarderPaymentStatus !== "SUDAH DIBAYAR") return "PENDING FORWARDER PAYMENT"
  return "DONE"
}
