"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Input, Button, Alert } from "@/components/ui";
import { Lock, ArrowRight, LogOut } from "lucide-react";

export default function LockScreenPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== "admin123") {
      setError("Kata sandi salah! Gunakan sandi demo 'admin123'.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    setIsUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card variant="panel" padding="lg" className="w-full max-w-sm shadow-2xl relative z-10 text-center">
        {/* User Profile Info */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-[#60A5FA] flex items-center justify-center text-2xl font-extrabold border-4 border-white dark:border-surface shadow-md">
            A
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-fg mt-3 tracking-tight">
            Andi Wijaya
          </h3>
          <p className="text-xs text-slate-500 dark:text-fg-muted font-bold mt-0.5">
            Sesi Dikunci (Lock Screen)
          </p>
        </div>

        {isUnlocked ? (
          <div className="space-y-4">
            <Alert variant="success" title="Sesi Terbuka!">
              Sesi berhasil dibuka kembali. Mengalihkan Anda...
            </Alert>
            <Link href="/dashboard" className="block">
              <Button variant="primary" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="error" title="Gagal Membuka">
                {error}
              </Alert>
            )}

            <Input
              label="Masukkan Password"
              isPassword
              placeholder="Ketik password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Buka Kunci Sesi
            </Button>

            <div className="text-center pt-2 mt-4 border-t border-slate-100 dark:border-line">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-fg inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Masuk sebagai user lain
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
