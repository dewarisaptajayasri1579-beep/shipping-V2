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
    price: "Rp 33.750.000",
    priceNote: "sekali bayar, harga final",
    description: "Source code & hasil deploy kami serahkan sepenuhnya kepada Anda. Cocok jika Anda ingin memegang kendali penuh atas sistem dan hosting sendiri.",
    icon: Package,
    highlight: false,
    features: [
      "Source code menjadi milik Anda sepenuhnya",
      "Setup & deploy awal ke server/hosting Anda",
      "Dokumentasi sistem lengkap",
      "Dukungan maintenance selama 1 bulan",
      "Tidak ada biaya bulanan setelah masa dukungan berakhir",
    ],
  },
  {
    key: "maintenance",
    title: "Jual + Maintenance Bulanan",
    badge: "Berlangganan",
    price: "DP Rp 12.500.000",
    priceNote: "+ Rp 1.900.000 / bulan (ditagih per 3 bulan)",
    description: "Hosting & server kami yang kelola, Anda tinggal pakai. Sistem didampingi penuh selama 1 bulan pertama, baru masuk siklus pemeliharaan rutin.",
    icon: RefreshCw,
    highlight: true,
    features: [
      "Hosting & server dikelola sepenuhnya oleh kami",
      "1 bulan pendampingan penuh setelah sistem live",
      "Biaya pemeliharaan Rp 1.900.000/bulan, ditagih tiap 3 bulan (Rp 5.700.000)",
      "Backup data & monitoring rutin",
      "Prioritas dukungan lebih cepat",
      "Paket bisa disesuaikan sewaktu-waktu dengan kebutuhan Anda",
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
            Pilih paket yang paling sesuai dengan kebutuhan Anda.
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
          <p>Ada kebutuhan khusus di luar paket di atas? Hubungi kami untuk konsultasi dan penyesuaian lebih lanjut.</p>
        </Card>
      </div>
    </AppLayout>
  )
}
