import { createJsonStore, type BaseRecord } from "./json-store"
import type { ChargeType, ContainerSize, Incoterm } from "./master-constants"

export { CHARGE_TYPES, CONTAINER_SIZES, INCOTERMS, type ChargeType, type ContainerSize, type Incoterm } from "./master-constants"

// ---------------------------------------------------------------------------
// Entitas "nama saja" — Brand, Negara Asal, Gudang, Project/Kategori
// ---------------------------------------------------------------------------

export interface Brand extends BaseRecord {
  name: string
}
export const brandStore = createJsonStore<Brand>("brands.json")

export interface Country extends BaseRecord {
  name: string
}
export const countryStore = createJsonStore<Country>("countries.json")

export interface Warehouse extends BaseRecord {
  name: string
}
export const warehouseStore = createJsonStore<Warehouse>("warehouses.json")

export interface Project extends BaseRecord {
  name: string
}
export const projectStore = createJsonStore<Project>("projects.json")

// ---------------------------------------------------------------------------
// Supplier/Vendor — data supplier per brand
// ---------------------------------------------------------------------------

export interface Supplier extends BaseRecord {
  name: string
  brandIds: string[]
}
export const supplierStore = createJsonStore<Supplier>("suppliers.json")

// ---------------------------------------------------------------------------
// Item/Produk
// ---------------------------------------------------------------------------

export interface Item extends BaseRecord {
  itemCode: string
  hsCode: string
  description: string
  /** Kode internal khusus lini produk Illuvia. */
  internalCode: string | null
  brandId: string | null
}
export const itemStore = createJsonStore<Item>("items.json")

// ---------------------------------------------------------------------------
// Forwarder + histori Rate
// ---------------------------------------------------------------------------

export interface Forwarder extends BaseRecord {
  name: string
}
export const forwarderStore = createJsonStore<Forwarder>("forwarders.json")

/** Satu baris = satu entri rate yang pernah berlaku. Rate baru untuk kombinasi
 *  charge/kontainer/incoterm yang sama = baris baru (bukan overwrite baris lama),
 *  supaya histori perubahan harga tetap tersimpan. */
export interface ForwarderRate extends BaseRecord {
  forwarderId: string
  chargeType: ChargeType
  containerSize: ContainerSize
  incoterm: Incoterm
  amount: number
  /** Tanggal rate ini mulai berlaku. */
  effectiveDate: string
}
export const forwarderRateStore = createJsonStore<ForwarderRate>("forwarder_rates.json")
