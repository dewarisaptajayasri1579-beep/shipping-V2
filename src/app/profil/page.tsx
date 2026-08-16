import { AppLayout } from "@/components/layout/AppLayout"
import { Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { ProfileForms } from "./ProfileForms"

export default async function ProfilPage() {
  const user = await getCurrentUser()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profil" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Profil</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Kelola data diri dan keamanan akun Anda.</p>
        </div>

        <ProfileForms user={{ id: user.id, name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber }} />
      </div>
    </AppLayout>
  )
}
