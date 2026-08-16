import { AuthLayout } from "@/components/layout/AuthLayout"
import { IS_DUMMY_MODE } from "@/lib/dummy-data"

export default function RegisterPage() {
  return <AuthLayout mode="register" isDummyMode={IS_DUMMY_MODE} />
}
