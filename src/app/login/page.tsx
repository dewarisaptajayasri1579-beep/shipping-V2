import { AuthLayout } from "@/components/layout/AuthLayout"
import { IS_DUMMY_MODE } from "@/lib/dummy-data"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ quick?: string }> }) {
  const params = await searchParams
  return <AuthLayout quickLogin={params.quick === "1"} isDummyMode={IS_DUMMY_MODE} />
}
