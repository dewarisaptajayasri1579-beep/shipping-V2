/** Konstanta & tipe murni (tanpa import fs) — aman diimpor dari Client Component.
 *  Layer store (src/lib/data/master.ts) memakai node:fs sehingga hanya boleh
 *  diimpor dari Server Component. */

export const CHARGE_TYPES = ["Handling", "Trucking", "Meal", "Dokumen", "PIB EDI"] as const
export type ChargeType = (typeof CHARGE_TYPES)[number]

export const CONTAINER_SIZES = ["20'", "40'", "40HC", "LCL"] as const
export type ContainerSize = (typeof CONTAINER_SIZES)[number]

export const INCOTERMS = ["CIF", "EXW", "FOB"] as const
export type Incoterm = (typeof INCOTERMS)[number]
