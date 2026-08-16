import React from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { ServerCrash, ArrowLeft } from "lucide-react";

export default function Error500Page() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card variant="panel" padding="lg" className="w-full max-w-md shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto scale-110">
          <ServerCrash className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-fg tracking-tight">500</h1>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-fg-secondary mt-2 tracking-tight">
            Internal Server Error
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-fg-muted font-medium mt-2 leading-relaxed">
            Terjadi kesalahan teknis internal pada database atau server kami. Mohon muat ulang halaman beberapa saat lagi.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="flex-1">
            <Button variant="primary" fullWidth leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Ke Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
