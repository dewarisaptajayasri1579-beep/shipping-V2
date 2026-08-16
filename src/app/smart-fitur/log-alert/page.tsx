import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { alertLogStore } from "@/lib/data/ews"
import { AlertLogTable } from "@/components/ews/AlertLogTable"

export default async function LogAlertPage() {
  const user = await getCurrentUser()
  const logs = alertLogStore.getAll().sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Smart Fitur (EWS)" }, { label: "Log Riwayat Alert" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Log Riwayat Alert</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Histori semua alert yang pernah terkirim beserta status tindak lanjutnya — mencegah alert yang sama dikirim berulang kali.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <AlertLogTable logs={logs} />
        </Card>
      </div>
    </AppLayout>
  )
}
