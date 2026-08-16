import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { forwarderStore, forwarderRateStore } from "@/lib/data/master"
import { ForwarderTable } from "@/components/master/ForwarderTable"

export default async function ForwarderPage() {
  const user = await getCurrentUser()
  const forwarders = forwarderStore.getAll()
  const rates = forwarderRateStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Master Data" }, { label: "Forwarder" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Forwarder</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Data forwarder beserta histori rate per charge type, ukuran kontainer, dan incoterm. Klik baris untuk lihat/tambah rate.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <ForwarderTable rows={forwarders} rates={rates} />
        </Card>
      </div>
    </AppLayout>
  )
}
