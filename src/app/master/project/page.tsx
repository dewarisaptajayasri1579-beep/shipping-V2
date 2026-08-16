import { AppLayout } from "@/components/layout/AppLayout"
import { Card, Breadcrumb } from "@/components/ui"
import { getCurrentUser } from "@/lib/current-user"
import { projectStore } from "@/lib/data/master"
import { SimpleMasterTable } from "@/components/master/SimpleMasterTable"

export default async function ProjectPage() {
  const user = await getCurrentUser()
  const projects = projectStore.getAll()

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Master Data" }, { label: "Project/Kategori" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-fg tracking-tight">Project/Kategori Shipment</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">Kategori shipment, mis. LAUNCHING.</p>
        </div>

        <Card variant="panel" padding="lg">
          <SimpleMasterTable apiResource="projects" entityLabel="Project" rows={projects} />
        </Card>
      </div>
    </AppLayout>
  )
}
