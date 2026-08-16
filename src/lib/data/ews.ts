import { createJsonStore, type BaseRecord } from "./json-store"
import { EWS_RULES, ALERT_STATUS, ALERT_SEVERITY, type AlertStatus, type AlertSeverity } from "./ews-constants"

export {
  EWS_RULES,
  EWS_RULE_MAP,
  ALERT_STATUS,
  ALERT_SEVERITY,
  type EwsCategory,
  type EwsRuleDef,
  type AlertStatus,
  type AlertSeverity,
} from "./ews-constants"

// ---------------------------------------------------------------------------
// Pengaturan Aturan/Threshold
// ---------------------------------------------------------------------------

export interface EwsRuleConfig extends BaseRecord {
  ruleId: string
  enabled: boolean
  params: Record<string, number>
}
const ewsRuleConfigSeed: EwsRuleConfig[] = EWS_RULES.map((r) => ({
  id: r.id,
  ruleId: r.id,
  enabled: true,
  params: Object.fromEntries(Object.entries(r.params).map(([key, p]) => [key, p.default])),
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}))
export const ewsRuleConfigStore = createJsonStore<EwsRuleConfig>("ews_rule_configs.json", ewsRuleConfigSeed)

// ---------------------------------------------------------------------------
// Pengaturan Notifikasi WhatsApp
// ---------------------------------------------------------------------------

export interface WaNotificationSetting extends BaseRecord {
  ruleId: string
  targetNumbers: string[]
  active: boolean
  /** Role penerima, mis. "operasional", "manajemen" — bebas teks, dipakai buat filter kirim. */
  roles: string[]
}
const waSettingSeed: WaNotificationSetting[] = EWS_RULES.map((r) => ({
  id: r.id,
  ruleId: r.id,
  targetNumbers: [],
  active: false,
  roles: r.category === "fraud" ? ["manajemen"] : ["operasional"],
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}))
export const waSettingStore = createJsonStore<WaNotificationSetting>("ews_wa_settings.json", waSettingSeed)

// ---------------------------------------------------------------------------
// Log Riwayat Alert
// ---------------------------------------------------------------------------

export interface AlertLog extends BaseRecord {
  ruleId: string
  refType: "shipment" | "shipment_dtd" | "forwarder_rate"
  refId: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  triggeredAt: string
  /** true kalau berhasil "dikirim" ke Baileys, false kalau cuma disimulasikan (belum ada
   *  BAILEYS_WEBHOOK_URL di env) — lihat src/lib/ews/notify.ts. */
  notified: boolean
}
export const alertLogStore = createJsonStore<AlertLog>("ews_alert_logs.json")
