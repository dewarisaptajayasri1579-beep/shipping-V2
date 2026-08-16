import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { requirePageRole } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { IS_DUMMY_MODE, getDummyUsers } from "@/lib/dummy-data"
import { UserManagementTable } from "./UserManagementTable"

export default async function PengaturanPage() {
  const user = await requirePageRole(["owner"])

  const users = IS_DUMMY_MODE
    ? getDummyUsers()
    : await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
      })

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pengaturan" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Pengaturan</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Kelola pengguna dan sistem.</p>
        </div>

        <Card variant="panel" padding="lg">
          <h3 className="text-lg font-bold text-slate-800 dark:text-fg mb-4">Manajemen Pengguna</h3>
          <UserManagementTable
            users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phoneNumber: u.phoneNumber }))}
            currentUserId={user.id}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
