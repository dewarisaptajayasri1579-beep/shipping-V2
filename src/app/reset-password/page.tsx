"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Input, Button, Alert } from "@/components/ui";
import { Lock, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Sandi baru minimal 6 karakter!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi sandi tidak cocok!");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card variant="panel" padding="lg" className="w-full max-w-md shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-fg tracking-tight">
            Reset Password Baru
          </h2>
          <p className="text-sm text-slate-500 dark:text-fg-muted font-medium mt-1.5">
            Buat kata sandi baru untuk akun sistem internal Anda.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <Alert variant="success" title="Sandi Diperbarui!">
              Kata sandi Anda berhasil disetel ulang. Silakan login kembali dengan sandi baru.
            </Alert>
            <Link href="/login" className="block">
              <Button variant="primary" fullWidth>
                Masuk ke Aplikasi
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="error" title="Kesalahan Pembuatan">
                {error}
              </Alert>
            )}

            <Input
              label="Sandi Baru"
              isPassword
              placeholder="Min. 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Konfirmasi Sandi Baru"
              isPassword
              placeholder="Ulangi sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Perbarui Kata Sandi
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs font-bold text-blue-600 dark:text-[#60A5FA] hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Batal &amp; Kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
