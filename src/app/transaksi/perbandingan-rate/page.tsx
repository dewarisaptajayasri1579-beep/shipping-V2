import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { forwarderStore, forwarderRateStore } from "@/lib/data/master"
import { RateComparison } from "@/components/transaksi/RateComparison"

export default async function PerbandinganRatePage() {
  const user = await getCurrentUser()
  const forwarders = forwarderStore.getAll()
  const rates = forwarderRateStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Transaksi" }, { label: "Perbandingan Rate Forwarder" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Perbandingan Rate Forwarder</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Bandingkan rate antar forwarder per ukuran kontainer &amp; incoterm untuk memutuskan forwarder mana yang dipakai.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <RateComparison rates={rates} forwarderOptions={forwarders.map((f) => ({ value: f.id, label: f.name }))} />
        </Card>
      </div>
    </AppLayout>
  )
}
