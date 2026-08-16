import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { itemStore, brandStore } from "@/lib/data/master"
import { ItemTable } from "@/components/master/ItemTable"

export default async function ItemPage() {
  const user = await getCurrentUser()
  const items = itemStore.getAll()
  const brands = brandStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Master Data" }, { label: "Item/Produk" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Item/Produk</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Kode item, HS Code, deskripsi, dan kode internal khusus lini Illuvia.</p>
        </div>

        <Card variant="panel" padding="lg">
          <ItemTable rows={items} brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))} />
        </Card>
      </div>
    </AppLayout>
  )
}
