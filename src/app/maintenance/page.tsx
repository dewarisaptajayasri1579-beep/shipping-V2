import React from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { Construction, RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card variant="panel" padding="lg" className="w-full max-w-md shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto scale-110">
          <Construction className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-fg tracking-tight">Under Maintenance</h1>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-fg-muted mt-2 tracking-tight">
            Pemeliharaan Sistem Berkala
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-fg-muted font-medium mt-3 leading-relaxed">
            Kami sedang memperbarui cluster server database untuk meningkatkan performa core aplikasi. Kami akan segera kembali online dalam beberapa menit!
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard" className="block">
            <Button variant="primary" fullWidth leftIcon={<RefreshCw className="w-4 h-4" />}>
              Muat Ulang Aplikasi
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
