import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { ewsRuleConfigStore } from "@/lib/data/ews"
import { ThresholdSettings } from "@/components/ews/ThresholdSettings"

export default async function ThresholdPage() {
  const user = await getCurrentUser()
  const configs = ewsRuleConfigStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Smart Fitur (EWS)" }, { label: "Pengaturan Aturan/Threshold" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Pengaturan Aturan/Threshold</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Atur ambang hari (H-berapa) dan ambang persentase per jenis alert — configurable, bukan hardcode.
          </p>
        </div>

        <ThresholdSettings configs={configs.map((c) => ({ ruleId: c.ruleId, enabled: c.enabled, params: c.params }))} />
      </div>
    </AppLayout>
  )
}
