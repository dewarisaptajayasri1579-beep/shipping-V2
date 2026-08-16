import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb, Card, Badge } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { Check, Package, RefreshCw } from "lucide-react"

interface PricingPlan {
  key: string
  title: string
  badge: string
  price: string
  priceNote: string
  description: string
  icon: typeof Package
  highlight: boolean
  features: string[]
}

const PLANS: PricingPlan[] = [
  {
    key: "putus",
    title: "Jual Putus",
    badge: "One-time",
    price: "Rp 15 – 35 juta",
    priceNote: "sekali bayar, nego sesuai scope akhir",
    description: "Source code & hasil deploy diserahkan penuh ke client. Cocok kalau client mau pegang kendali penuh atas sistem dan hostingnya sendiri.",
    icon: Package,
    highlight: false,
    features: [
      "Source code jadi milik client sepenuhnya",
      "Setup & deploy awal ke server/hosting client",
      "Training pemakaian untuk tim client",
      "Support bug-fix 1–3 bulan pertama",
      "Tidak ada biaya bulanan setelah serah terima",
    ],
  },
  {
    key: "maintenance",
    title: "Jual + Maintenance Bulanan",
    badge: "Berlangganan",
    price: "DP Rp 8 – 15 juta",
    priceNote: "+ Rp 500rb – 2 juta / bulan",
    description: "Kamu yang pegang hosting & server, client tinggal pakai. Cocok untuk relasi jangka panjang dan pendapatan berulang.",
    icon: RefreshCw,
    highlight: true,
    features: [
      "Hosting & server dikelola olehmu",
      "Update fitur & perbaikan bug berkelanjutan",
      "Backup data & monitoring rutin",
      "Prioritas support lebih cepat",
      "Bisa upgrade/downgrade paket sesuai kebutuhan client",
    ],
  },
]

export default async function PricingPage() {
  const user = await getCurrentUser()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pricing" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Pricing</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">
            Opsi harga untuk penawaran sistem ini ke client.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.key}
                variant={plan.highlight ? "solid" : "outline"}
                padding="lg"
                className={plan.highlight ? "border-2 border-blue-500/60 dark:border-blue-500/50 relative" : "relative"}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-[#0544cc] to-[#2563eb] shadow-md">
                    Rekomendasi
                  </span>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-700 dark:bg-[rgba(59,130,246,0.10)] dark:text-[#60A5FA]">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="font-extrabold text-lg text-slate-900 dark:text-fg">{plan.title}</h2>
                      <Badge variant="secondary" size="sm">{plan.badge}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-fg">{plan.price}</p>
                  <p className="text-xs text-slate-500 dark:text-fg-muted font-semibold mt-0.5">{plan.priceNote}</p>
                </div>

                <p className="text-sm text-slate-600 dark:text-fg-muted leading-relaxed mb-5">{plan.description}</p>

                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-fg-secondary">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-[#34D399] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>

        <Card variant="glass" padding="md" className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted leading-relaxed">
          <p>
            Kisaran harga di atas untuk penjualan satu client (custom build). Kalau sistem ini mau dipakai ulang sebagai
            template untuk beberapa client sekaligus, harga per client bisa ditekan lebih rendah karena biaya build sudah
            diamortisasi.
          </p>
        </Card>
      </div>
    </AppLayout>
  )
}
