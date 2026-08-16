import { calcGapDays } from "./gap"

export interface ScoringShipmentDtd {
  id: string
  vendorId: string | null
  itemNumber: string
  price: number
  sampeAgent: string | null
  sampeMche: string | null
}

export interface ScoringVendor {
  id: string
  name: string
}

export interface ScoringAlertLog {
  refType: string
  refId: string
  status: string
}

export interface VendorScore {
  vendorId: string
  vendorName: string
  shipmentCount: number
  avgGap: number | null
  priceIndex: number | null
  gapStdDev: number | null
  speedScore: number
  priceScore: number
  consistencyScore: number
  redFlagCount: number
  finalScore: number
  dataSufficient: boolean
  reasons: string[]
}

/** Bobot formula gabungan (disepakati dengan user): 40% kecepatan (GAP), 40% harga,
 *  20% konsistensi (variasi GAP). Red flag EWS memotong skor akhir 10% per red flag aktif.
 *  Dipakai bareng oleh Laporan Penilaian/Scoring Vendor & Rekomendasi Vendor supaya
 *  konsisten (docs/menu.md catatan implementasi). */
const WEIGHTS = { speed: 0.4, price: 0.4, consistency: 0.2 }
const RED_FLAG_PENALTY = 0.1
const MIN_SHIPMENT_COUNT = 2

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = average(values)
  const variance = average(values.map((v) => (v - avg) ** 2))
  return Math.sqrt(variance)
}

/** Skala 0-100 di mana nilai LEBIH KECIL = lebih baik (dipakai untuk GAP & harga). */
function normalizeLowerIsBetter(value: number, min: number, max: number): number {
  if (max === min) return 100
  return Math.round((100 * (max - value)) / (max - min))
}

export function computeVendorScores(
  shipmentsDtd: ScoringShipmentDtd[],
  vendors: ScoringVendor[],
  alertLogs: ScoringAlertLog[]
): VendorScore[] {
  // Indeks harga relatif per item: rata-rata harga item ini di semua vendor / harga vendor tsb.
  // >1 berarti vendor ini lebih murah dari rata-rata pasar untuk item tersebut.
  const priceByItem = new Map<string, number[]>()
  shipmentsDtd.forEach((s) => {
    if (!s.itemNumber || s.price <= 0) return
    priceByItem.set(s.itemNumber, [...(priceByItem.get(s.itemNumber) ?? []), s.price])
  })

  const raw = vendors.map((vendor) => {
    const rows = shipmentsDtd.filter((s) => s.vendorId === vendor.id)
    const gaps = rows.map((s) => calcGapDays(s.sampeAgent, s.sampeMche)).filter((g): g is number => g !== null)
    const avgGap = gaps.length > 0 ? average(gaps) : null
    const gapStdDev = gaps.length >= 2 ? stdDev(gaps) : null

    const priceRatios = rows
      .filter((s) => s.price > 0 && priceByItem.has(s.itemNumber))
      .map((s) => average(priceByItem.get(s.itemNumber)!) / s.price)
    const priceIndex = priceRatios.length > 0 ? average(priceRatios) : null

    const redFlagCount = alertLogs.filter(
      (a) => a.status === "BELUM DITANGANI" && a.refType === "shipment_dtd" && rows.some((r) => r.id === a.refId)
    ).length

    return { vendor, rows, gaps, avgGap, gapStdDev, priceIndex, redFlagCount }
  })

  const gapValues = raw.map((r) => r.avgGap).filter((v): v is number => v !== null)
  const gapMin = gapValues.length > 0 ? Math.min(...gapValues) : 0
  const gapMax = gapValues.length > 0 ? Math.max(...gapValues) : 0

  const priceValues = raw.map((r) => r.priceIndex).filter((v): v is number => v !== null)
  const priceMin = priceValues.length > 0 ? Math.min(...priceValues) : 0
  const priceMax = priceValues.length > 0 ? Math.max(...priceValues) : 0

  const stdDevValues = raw.map((r) => r.gapStdDev).filter((v): v is number => v !== null)
  const stdDevMin = stdDevValues.length > 0 ? Math.min(...stdDevValues) : 0
  const stdDevMax = stdDevValues.length > 0 ? Math.max(...stdDevValues) : 0

  return raw.map(({ vendor, rows, avgGap, gapStdDev, priceIndex, redFlagCount }): VendorScore => {
    const speedScore = avgGap !== null ? normalizeLowerIsBetter(avgGap, gapMin, gapMax) : 0
    // priceIndex: makin besar makin murah (kebalikan dari normalizeLowerIsBetter), jadi dibalik langsung.
    const priceScore = priceIndex !== null && priceMax > priceMin ? Math.round((100 * (priceIndex - priceMin)) / (priceMax - priceMin)) : priceIndex !== null ? 100 : 0
    const consistencyScore = gapStdDev !== null ? normalizeLowerIsBetter(gapStdDev, stdDevMin, stdDevMax) : 0

    const baseScore = speedScore * WEIGHTS.speed + priceScore * WEIGHTS.price + consistencyScore * WEIGHTS.consistency
    const finalScore = Math.max(0, Math.round(baseScore * (1 - RED_FLAG_PENALTY * redFlagCount)))

    const reasons: string[] = []
    if (avgGap !== null) reasons.push(`rata-rata GAP ${avgGap.toFixed(1)} hari`)
    if (priceIndex !== null) reasons.push(priceIndex >= 1 ? `harga ~${((priceIndex - 1) * 100).toFixed(0)}% lebih murah dari rata-rata` : `harga ~${((1 - priceIndex) * 100).toFixed(0)}% lebih mahal dari rata-rata`)
    if (gapStdDev !== null) reasons.push(`variasi GAP ${gapStdDev.toFixed(1)} hari (makin kecil makin stabil)`)
    if (redFlagCount > 0) reasons.push(`${redFlagCount} red flag EWS aktif — skor dipotong ${redFlagCount * RED_FLAG_PENALTY * 100}%`)

    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      shipmentCount: rows.length,
      avgGap,
      priceIndex,
      gapStdDev,
      speedScore,
      priceScore,
      consistencyScore,
      redFlagCount,
      finalScore,
      dataSufficient: rows.length >= MIN_SHIPMENT_COUNT,
      reasons,
    }
  })
}
