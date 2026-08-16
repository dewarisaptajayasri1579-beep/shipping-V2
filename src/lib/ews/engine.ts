import { shipmentStore, shipmentDtdStore, type Shipment, type ShipmentDtd } from "@/lib/data/transaksi"
import { forwarderStore, forwarderRateStore, brandStore, type ForwarderRate } from "@/lib/data/master"
import { ewsRuleConfigStore, waSettingStore, alertLogStore, type AlertSeverity } from "@/lib/data/ews"
import { calcGapDays } from "@/lib/gap"
import { sendWhatsAppNotification } from "./notify"

const DAY_MS = 1000 * 60 * 60 * 24

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

function daysUntil(dateStr: string, now: Date): number {
  return daysBetween(now, new Date(dateStr))
}

function daysSince(dateStr: string, now: Date): number {
  return daysBetween(new Date(dateStr), now)
}

interface Trigger {
  ruleId: string
  refType: "shipment" | "shipment_dtd" | "forwarder_rate"
  refId: string
  message: string
  severity: AlertSeverity
}

function getTop20ShipmentIds(shipments: Shipment[]): Set<string> {
  return new Set(
    [...shipments]
      .sort((a, b) => b.qty * b.priceSatuan - a.qty * a.priceSatuan)
      .slice(0, 20)
      .map((s) => s.id)
  )
}

function evaluate(now: Date): Trigger[] {
  const configs = Object.fromEntries(ewsRuleConfigStore.getAll().map((c) => [c.ruleId, c]))
  const enabled = (ruleId: string) => configs[ruleId]?.enabled !== false
  const param = (ruleId: string, key: string, fallback: number) => configs[ruleId]?.params?.[key] ?? fallback

  const shipments = shipmentStore.getAll()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const rates = forwarderRateStore.getAll()
  const forwarders = forwarderStore.getAll()
  const brands = brandStore.getAll()
  const forwarderLabel = (id: string | null) => forwarders.find((f) => f.id === id)?.name ?? "forwarder tak dikenal"
  const brandLabel = (id: string | null) => brands.find((b) => b.id === id)?.name ?? "brand tak dikenal"

  const triggers: Trigger[] = []

  // 1. eta-mendekat
  if (enabled("eta-mendekat")) {
    const hMinus = param("eta-mendekat", "hMinus", 3)
    for (const s of shipments) {
      if (s.statusBarang === "BARANG SUDAH DATANG" || !s.tanggalKedatangan) continue
      const diff = daysUntil(s.tanggalKedatangan, now)
      if (diff <= hMinus) {
        triggers.push({
          ruleId: "eta-mendekat",
          refType: "shipment",
          refId: s.id,
          severity: diff < 0 ? "critical" : diff <= 1 ? "warning" : "info",
          message:
            diff < 0
              ? `${s.shipmentName}: ETA ${s.tanggalKedatangan} sudah lewat ${-diff} hari, status barang masih "${s.statusBarang}"`
              : `${s.shipmentName}: ETA ${s.tanggalKedatangan} (H-${diff}), status barang masih "${s.statusBarang}" — cek ke forwarder/agent`,
        })
      }
    }
  }

  // 2. gap-dtd-proyeksi
  if (enabled("gap-dtd-proyeksi")) {
    const percentThreshold = param("gap-dtd-proyeksi", "percentThreshold", 80)
    for (const d of shipmentsDtd) {
      if (!d.sampeAgent || d.sampeMche || !d.vendorId) continue
      const vendorGaps = shipmentsDtd
        .filter((x) => x.vendorId === d.vendorId && x.id !== d.id)
        .map((x) => calcGapDays(x.sampeAgent, x.sampeMche))
        .filter((g): g is number => g !== null)
      if (vendorGaps.length === 0) continue
      const avgGap = vendorGaps.reduce((a, b) => a + b, 0) / vendorGaps.length
      const runningDays = daysSince(d.sampeAgent, now)
      if (avgGap > 0 && runningDays >= (percentThreshold / 100) * avgGap) {
        triggers.push({
          ruleId: "gap-dtd-proyeksi",
          refType: "shipment_dtd",
          refId: d.id,
          severity: runningDays >= avgGap ? "critical" : "warning",
          message: `${d.shipmentName}: sudah ${runningDays} hari sejak sampe agent, mendekati/melebihi rata-rata GAP vendor (${avgGap.toFixed(1)} hari) — follow up ke vendor`,
        })
      }
    }
  }

  // 3. jatuh-tempo-pembayaran
  if (enabled("jatuh-tempo-pembayaran")) {
    const hMinus = param("jatuh-tempo-pembayaran", "hMinus", 7)
    for (const s of shipments) {
      if (s.statusPembayaranPI === "BELUM DIBAYAR" && s.dueDatePI) {
        const diff = daysUntil(s.dueDatePI, now)
        if (diff <= hMinus) {
          triggers.push({
            ruleId: "jatuh-tempo-pembayaran",
            refType: "shipment",
            refId: `${s.id}-PI`,
            severity: diff < 0 ? "critical" : "warning",
            message:
              diff < 0
                ? `${s.shipmentName}: pembayaran ke supplier (PI) sudah lewat jatuh tempo ${-diff} hari — eskalasi ke atasan`
                : `${s.shipmentName}: pembayaran ke supplier (PI) jatuh tempo ${s.dueDatePI} (H-${diff}) — siapkan pembayaran`,
          })
        }
      }
      if (s.statusPembayaranFO === "BELUM DIBAYAR" && s.dueDateFO) {
        const diff = daysUntil(s.dueDateFO, now)
        if (diff <= hMinus) {
          triggers.push({
            ruleId: "jatuh-tempo-pembayaran",
            refType: "shipment",
            refId: `${s.id}-FO`,
            severity: diff < 0 ? "critical" : "warning",
            message:
              diff < 0
                ? `${s.shipmentName}: pembayaran ke forwarder (FO) sudah lewat jatuh tempo ${-diff} hari — eskalasi ke atasan`
                : `${s.shipmentName}: pembayaran ke forwarder (FO) jatuh tempo ${s.dueDateFO} (H-${diff}) — siapkan pembayaran`,
          })
        }
      }
    }
  }

  // 4. pib-belum-lengkap
  if (enabled("pib-belum-lengkap")) {
    const hMinus = param("pib-belum-lengkap", "hMinus", 5)
    for (const s of shipments) {
      if (s.noPIB || !s.tanggalKedatangan || s.statusBarang === "BARANG SUDAH DATANG") continue
      const diff = daysUntil(s.tanggalKedatangan, now)
      if (diff <= hMinus) {
        triggers.push({
          ruleId: "pib-belum-lengkap",
          refType: "shipment",
          refId: s.id,
          severity: diff < 0 ? "critical" : "warning",
          message: `${s.shipmentName}: No PIB masih kosong, ETA ${s.tanggalKedatangan} — urus PIB sebelum barang tertahan di pelabuhan`,
        })
      }
    }
  }

  // 5. shipment-tinggi-macet
  if (enabled("shipment-tinggi-macet")) {
    const daysNoChange = param("shipment-tinggi-macet", "daysNoChange", 14)
    const top20Ids = getTop20ShipmentIds(shipments)
    for (const s of shipments) {
      if (!top20Ids.has(s.id) || s.statusShipment === "DONE") continue
      const idleDays = daysSince(s.updatedAt, now)
      if (idleDays >= daysNoChange) {
        triggers.push({
          ruleId: "shipment-tinggi-macet",
          refType: "shipment",
          refId: s.id,
          severity: "warning",
          message: `${s.shipmentName}: shipment bernilai tinggi, sudah ${idleDays} hari tanpa perubahan status ("${s.statusShipment}") — prioritaskan penyelesaian`,
        })
      }
    }
  }

  // 6. invoice-ganda
  if (enabled("invoice-ganda")) {
    const byInvoice = new Map<string, Shipment[]>()
    for (const s of shipments) {
      if (!s.noInvoice) continue
      byInvoice.set(s.noInvoice, [...(byInvoice.get(s.noInvoice) ?? []), s])
    }
    for (const [noInvoice, rows] of byInvoice) {
      const distinctPO = new Set(rows.map((r) => r.noPO))
      if (distinctPO.size > 1) {
        triggers.push({
          ruleId: "invoice-ganda",
          refType: "shipment",
          refId: `invoice-${noInvoice}`,
          severity: "critical",
          message: `No Invoice "${noInvoice}" dipakai untuk ${distinctPO.size} No PO berbeda (${Array.from(distinctPO).join(", ")}) — verifikasi manual sebelum pembayaran`,
        })
      }
    }
  }

  // 7. harga-menyimpang
  if (enabled("harga-menyimpang")) {
    const percentThreshold = param("harga-menyimpang", "percentThreshold", 20)
    for (const s of shipments) {
      if (!s.itemId) continue
      const others = shipments.filter((x) => x.itemId === s.itemId && x.id !== s.id)
      if (others.length === 0) continue
      const avg = others.reduce((sum, x) => sum + x.priceSatuan, 0) / others.length
      if (avg <= 0) continue
      const deviation = (Math.abs(s.priceSatuan - avg) / avg) * 100
      if (deviation >= percentThreshold) {
        triggers.push({
          ruleId: "harga-menyimpang",
          refType: "shipment",
          refId: s.id,
          severity: "warning",
          message: `${s.shipmentName}: harga satuan ${s.priceSatuan} menyimpang ${deviation.toFixed(0)}% dari rata-rata historis item ini (${avg.toFixed(2)}) — perlu verifikasi tambahan`,
        })
      }
    }
  }

  // 8. rate-forwarder-naik
  if (enabled("rate-forwarder-naik")) {
    const percentThreshold = param("rate-forwarder-naik", "percentThreshold", 15)
    const groups = new Map<string, ForwarderRate[]>()
    for (const r of rates) {
      const key = `${r.forwarderId}|${r.chargeType}|${r.containerSize}|${r.incoterm}`
      groups.set(key, [...(groups.get(key) ?? []), r])
    }
    for (const group of groups.values()) {
      const sorted = [...group].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        if (prev.amount <= 0) continue
        const increase = ((curr.amount - prev.amount) / prev.amount) * 100
        if (increase >= percentThreshold) {
          triggers.push({
            ruleId: "rate-forwarder-naik",
            refType: "forwarder_rate",
            refId: curr.id,
            severity: "warning",
            message: `Rate ${forwarderLabel(curr.forwarderId)} (${curr.chargeType}, ${curr.containerSize}, ${curr.incoterm}) naik ${increase.toFixed(0)}% dari Rp${prev.amount.toLocaleString("id-ID")} jadi Rp${curr.amount.toLocaleString("id-ID")} — bandingkan dgn kompetitor`,
          })
        }
      }
    }
  }

  // 9. bayar-sebelum-datang
  if (enabled("bayar-sebelum-datang")) {
    for (const s of shipments) {
      if (s.statusBarang === "BARANG SUDAH DATANG") continue
      if (s.statusPembayaranPI === "SUDAH DIBAYAR" || s.statusPembayaranFO === "SUDAH DIBAYAR") {
        triggers.push({
          ruleId: "bayar-sebelum-datang",
          refType: "shipment",
          refId: s.id,
          severity: "critical",
          message: `${s.shipmentName}: status pembayaran sudah "Sudah Dibayar" padahal status barang masih "${s.statusBarang}" — urutan proses terbalik, audit kesesuaian dokumen`,
        })
      }
    }
  }

  // 10. perubahan-setelah-done
  if (enabled("perubahan-setelah-done")) {
    const minHoursDiff = param("perubahan-setelah-done", "minHoursDiff", 24)
    const checkRecord = (id: string, name: string, status: string, createdAt: string, updatedAt: string, refType: "shipment" | "shipment_dtd") => {
      if (status !== "DONE") return
      const hoursDiff = (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
      if (hoursDiff >= minHoursDiff) {
        triggers.push({
          ruleId: "perubahan-setelah-done",
          refType,
          refId: id,
          severity: "warning",
          message: `${name}: data diubah ${hoursDiff.toFixed(0)} jam setelah status "DONE" — audit siapa yang mengubah & kenapa`,
        })
      }
    }
    for (const s of shipments) checkRecord(s.id, s.shipmentName, s.statusShipment, s.createdAt, s.updatedAt, "shipment")
    for (const d of shipmentsDtd) checkRecord(d.id, d.shipmentName, d.status, d.createdAt, d.updatedAt, "shipment_dtd")
  }

  // 11. vendor-baru-nilai-besar
  if (enabled("vendor-baru-nilai-besar")) {
    const valueThreshold = param("vendor-baru-nilai-besar", "valueThreshold", 5000000)
    const minHistoryCount = param("vendor-baru-nilai-besar", "minHistoryCount", 2)
    for (const d of shipmentsDtd) {
      if (!d.vendorId) continue
      const historyCount = shipmentsDtd.filter((x) => x.vendorId === d.vendorId).length
      if (historyCount < minHistoryCount && d.cost >= valueThreshold) {
        triggers.push({
          ruleId: "vendor-baru-nilai-besar",
          refType: "shipment_dtd",
          refId: d.id,
          severity: "warning",
          message: `${d.shipmentName} (${brandLabel(d.brandId)}): vendor baru dengan histori ${historyCount} shipment, nilai transaksi Rp${d.cost.toLocaleString("id-ID")} — perlu approval berjenjang`,
        })
      }
    }
  }

  return triggers
}

export interface RunEwsResult {
  checkedAt: string
  triggeredCount: number
  newAlertsCount: number
  dedupedCount: number
}

/** Jalankan pengecekan seluruh aturan EWS terhadap data transaksi saat ini. Dipanggil manual
 *  dari halaman Log Riwayat Alert (tombol "Jalankan Pengecekan Sekarang") — di produksi ini
 *  yang dipanggil oleh cron job harian (lihat catatan di docs/menu.md: "sebaiknya jalan lewat
 *  scheduled job"), tapi karena tidak ada infra cron di dev environment ini, dipicu manual dulu. */
export async function runEwsCheck(): Promise<RunEwsResult> {
  const now = new Date()
  const triggers = evaluate(now)
  const existingOpen = alertLogStore.getAll().filter((a) => a.status === "BELUM DITANGANI")
  const waSettings = Object.fromEntries(waSettingStore.getAll().map((w) => [w.ruleId, w]))

  let newAlertsCount = 0
  let dedupedCount = 0

  for (const t of triggers) {
    const alreadyOpen = existingOpen.some((a) => a.ruleId === t.ruleId && a.refId === t.refId)
    if (alreadyOpen) {
      dedupedCount++
      continue
    }

    const waSetting = waSettings[t.ruleId]
    const notified = waSetting?.active ? await sendWhatsAppNotification(waSetting.targetNumbers, t.message) : false

    alertLogStore.create({
      ruleId: t.ruleId,
      refType: t.refType,
      refId: t.refId,
      message: t.message,
      severity: t.severity,
      status: "BELUM DITANGANI",
      triggeredAt: now.toISOString().slice(0, 10),
      notified,
    })
    newAlertsCount++
  }

  return { checkedAt: now.toISOString(), triggeredCount: triggers.length, newAlertsCount, dedupedCount }
}
