import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ErrorState, Button } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <ErrorState
      icon={ShieldAlert}
      code="403"
      title="Akses Ditolak"
      description="Anda tidak punya izin untuk membuka halaman ini."
      action={
        <Link href="/dashboard">
          <Button variant="primary" fullWidth>
            Kembali ke Dashboard
          </Button>
        </Link>
      }
    />
  );
}
