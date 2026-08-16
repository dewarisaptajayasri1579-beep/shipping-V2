import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb, Alert } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { supplierStore, brandStore } from "@/lib/data/master"
import { shipmentDtdStore } from "@/lib/data/transaksi"
import { alertLogStore } from "@/lib/data/ews"
import { computeVendorScores } from "@/lib/vendor-scoring"
import { VendorRecommendation } from "@/components/ews/VendorRecommendation"

export default async function RekomendasiVendorPage() {
  const user = await getCurrentUser()
  const suppliers = supplierStore.getAll()
  const brands = brandStore.getAll()
  const shipmentsDtd = shipmentDtdStore.getAll()
  const alertLogs = alertLogStore.getAll()

  const scores = computeVendorScores(shipmentsDtd, suppliers, alertLogs)
  const vendorBrandIds = Object.fromEntries(suppliers.map((s) => [s.id, s.brandIds]))

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Smart Fitur (EWS)" }, { label: "Rekomendasi Vendor" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Rekomendasi Vendor</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Saran vendor berdasar histori — sama formulanya dengan Laporan Scoring Vendor (harga, kecepatan, konsistensi, penalti red flag).
          </p>
        </div>

        <Alert variant="info">
          Filter per brand untuk melihat vendor mana yang paling direkomendasikan saat membuat shipment/PO baru untuk brand tsb.
        </Alert>

        <VendorRecommendation scores={scores} vendorBrandIds={vendorBrandIds} brandOptions={brands.map((b) => ({ value: b.id, label: b.name }))} />
      </div>
    </AppLayout>
  )
}
