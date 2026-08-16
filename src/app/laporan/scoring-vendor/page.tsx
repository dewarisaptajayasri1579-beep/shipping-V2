import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb, Alert } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"

export default async function ScoringVendorPage() {
  const user = await getCurrentUser()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Breadcrumb items={[{ label: "Laporan" }, { label: "Penilaian/Scoring Vendor" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Penilaian/Scoring Vendor</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Ranking &amp; skor vendor gabungan dari kecepatan (GAP) dan harga.
          </p>
        </div>

        <Card variant="panel" padding="lg">
          <Alert variant="info">
            Menu ini belum dikerjakan karena formula bobot penilaian (mis. 50% kecepatan GAP / 50% harga, atau bobot lain) adalah
            keputusan bisnis yang perlu disepakati dulu — bukan keputusan teknis (lihat catatan implementasi di docs/menu.md).
            Data mentahnya (GAP per vendor di Laporan Performa Vendor DTD, histori harga di Rate Forwarder) sudah tersedia dan siap
            dipakai begitu bobotnya ditentukan.
          </Alert>
        </Card>
      </div>
    </AppLayout>
  )
}
