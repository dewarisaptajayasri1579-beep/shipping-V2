import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { projectStore, brandStore, supplierStore } from "@/lib/data/master"
import { shipmentDtdStore } from "@/lib/data/transaksi"
import { IlluviaMonitoringView } from "@/components/dashboard/IlluviaMonitoringView"

export default async function IlluviaMonitoringPage() {
  const user = await getCurrentUser()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const projects = projectStore.getAll()
  const brands = brandStore.getAll()
  const suppliers = supplierStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 sm:space-y-8">
        <Breadcrumb items={[{ label: "Dashboard Khusus" }, { label: "Monitoring Illuvia" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Monitoring Import — Illuvia</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Dashboard khusus lini produk Illuvia, dari data Shipment DTD/Launching.</p>
        </div>

        <IlluviaMonitoringView
          rows={shipmentsDtd.map((r) => ({
            id: r.id,
            shipmentName: r.shipmentName,
            projectId: r.projectId,
            countryId: r.countryId,
            brandId: r.brandId,
            vendorId: r.vendorId,
            sampeAgent: r.sampeAgent,
            sampeMche: r.sampeMche,
            status: r.status,
            cost: r.cost,
          }))}
          projectOptions={projects.map((p) => ({ value: p.id, label: p.name }))}
          brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))}
          vendorOptions={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
    </AppLayout>
  )
}
