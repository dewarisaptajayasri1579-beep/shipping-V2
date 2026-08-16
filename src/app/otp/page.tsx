"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Button, Alert } from "@/components/ui";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function OtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const nextOtp = [...otp];
    nextOtp[index] = element.value;
    setOtp(nextOtp);

    // Auto-focus next input
    if (element.value !== "" && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      // Focus previous input
      const target = e.target as HTMLInputElement;
      if (target.previousSibling) {
        (target.previousSibling as HTMLInputElement).focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length < 6) {
      setError("Mohon lengkapi kode verifikasi OTP 6 digit!");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    if (code === "123456") {
      setIsSuccess(true);
    } else {
      setError("Kode OTP salah! Gunakan kode demo '123456'.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card variant="panel" padding="lg" className="w-full max-w-md shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-fg tracking-tight">
            Verifikasi OTP
          </h2>
          <p className="text-sm text-slate-500 dark:text-fg-muted font-medium mt-1.5">
            Masukkan 6 digit kode yang dikirim ke nomor WhatsApp/Email Anda.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <Alert variant="success" title="Otentikasi Berhasil!">
              Kode verifikasi cocok. Akses login Anda telah disetujui.
            </Alert>
            <Link href="/dashboard" className="block">
              <Button variant="primary" fullWidth>
                Masuk ke Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error" title="Otentikasi Gagal">
                {error}
              </Alert>
            )}

            <div className="flex justify-between gap-2 max-w-xs mx-auto">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  name="otp"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-lg font-bold border border-slate-200/80 dark:border-line rounded-xl bg-white/60 dark:bg-surface focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-0 dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] text-slate-800 dark:text-fg transition-all"
                />
              ))}
            </div>

            <p className="text-xs text-slate-500 dark:text-fg-muted text-center font-medium leading-normal">
              Petunjuk Demo: Ketik kode <strong>123456</strong> untuk mensimulasikan login OTP yang sukses.
            </p>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Verifikasi Kode OTP
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
