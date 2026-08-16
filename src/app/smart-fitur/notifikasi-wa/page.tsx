import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb, Alert } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { waSettingStore } from "@/lib/data/ews"
import { WaSettingsPanel } from "@/components/ews/WaSettingsPanel"

export default async function NotifikasiWaPage() {
  const user = await getCurrentUser()
  const settings = waSettingStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Smart Fitur (EWS)" }, { label: "Pengaturan Notifikasi WhatsApp" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Pengaturan Notifikasi WhatsApp</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Atur nomor/grup tujuan per jenis alert, aktif/nonaktifkan per role.
          </p>
        </div>

        <Alert variant="info">
          Notifikasi dikirim lewat server WhatsApp Baileys self-hosted milik sendiri. Selama environment variable{" "}
          <code className="bg-slate-100 dark:bg-surface px-1 py-0.5 rounded">BAILEYS_WEBHOOK_URL</code> belum di-set, pengiriman
          disimulasikan (tercatat di Log Riwayat Alert dengan status &quot;belum terkirim&quot;) supaya tidak pura-pura terhubung
          ke server yang belum dikonfigurasi.
        </Alert>

        <WaSettingsPanel settings={settings.map((s) => ({ ruleId: s.ruleId, targetNumbers: s.targetNumbers, active: s.active, roles: s.roles }))} />
      </div>
    </AppLayout>
  )
}
