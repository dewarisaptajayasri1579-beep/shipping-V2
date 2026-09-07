import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { brandStore, countryStore, itemStore } from "@/lib/data/master"
import { invoiceStore } from "@/lib/data/transaksi"
import { InvoiceTable } from "@/components/transaksi/InvoiceTable"

export default async function ShipmentPage() {
  const user = await getCurrentUser()
  const invoices = invoiceStore.getAll()
  const brands = brandStore.getAll()
  const countries = countryStore.getAll()
  const items = itemStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Transaksi" }, { label: "Input Shipment/Import" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Input Shipment/Import</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Data operasional harian per Invoice — menggantikan sheet DATABASE/SPREADSHEET Excel. 1 Invoice bisa dikirim beberapa kali.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <InvoiceTable
            rows={invoices}
            brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
            countryOptions={countries.map((c) => ({ value: c.id, label: c.name }))}
            itemOptions={items.map((i) => ({ value: i.id, label: `${i.itemCode} - ${i.description}` }))}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
