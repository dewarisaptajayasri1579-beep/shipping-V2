import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, brandStore } from "@/lib/data/master"
import { SupplierTable } from "@/components/master/SupplierTable"

export default async function SupplierPage() {
  const user = await getCurrentUser()
  const suppliers = supplierStore.getAll()
  const brands = brandStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Master Data" }, { label: "Supplier/Vendor" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Supplier/Vendor</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Data supplier per brand.</p>
        </div>

        <Card variant="panel" padding="lg">
          <SupplierTable rows={suppliers} brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))} />
        </Card>
      </div>
    </AppLayout>
  )
}
