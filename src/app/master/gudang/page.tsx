import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { warehouseStore } from "@/lib/data/master"
import { SimpleMasterTable } from "@/components/master/SimpleMasterTable"

export default async function GudangPage() {
  const user = await getCurrentUser()
  const warehouses = warehouseStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Master Data" }, { label: "Gudang" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Gudang</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Gudang tujuan penerimaan barang, mis. YASUNLITEX.</p>
        </div>

        <Card variant="panel" padding="lg">
          <SimpleMasterTable apiResource="warehouses" entityLabel="Gudang" rows={warehouses} />
        </Card>
      </div>
    </AppLayout>
  )
}
