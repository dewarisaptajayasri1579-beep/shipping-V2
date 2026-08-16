"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Input, Button, Alert } from "@/components/ui";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card variant="panel" padding="lg" className="w-full max-w-md shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-fg tracking-tight">
            Lupa Password?
          </h2>
          <p className="text-sm text-slate-500 dark:text-fg-muted font-medium mt-1.5">
            Masukkan email Anda untuk menerima instruksi pemulihan kata sandi.
          </p>
        </div>

        {isSent ? (
          <div className="space-y-4">
            <Alert variant="success" title="Link Dikirim!">
              Kami telah mengirimkan link reset password ke <strong>{email}</strong>. Cek kotak masuk Anda.
            </Alert>
            <Link href="/login" className="block">
              <Button variant="secondary" fullWidth leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Kirim Link Pemulihan
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs font-bold text-blue-600 dark:text-[#60A5FA] hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
