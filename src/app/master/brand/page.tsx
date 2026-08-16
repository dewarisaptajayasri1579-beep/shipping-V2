import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore } from "@/lib/data/master"
import { SimpleMasterTable } from "@/components/master/SimpleMasterTable"

export default async function BrandPage() {
  const user = await getCurrentUser()
  const brands = brandStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Master Data" }, { label: "Brand" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Brand</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Daftar brand yang diimpor, mis. FLUKE, SOCOMEC, ALLWAY, KINGLUMI, ILLUVIA, OBO.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <SimpleMasterTable apiResource="brands" entityLabel="Brand" rows={brands} />
        </Card>
      </div>
    </AppLayout>
  )
}
