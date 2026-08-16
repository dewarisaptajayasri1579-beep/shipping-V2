"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Button, Alert } from "../ui";
import { Mail, Lock } from "lucide-react";

export const LoginForm: React.FC<{ showTopLockIcon?: boolean; className?: string; isDummyMode?: boolean }> = ({
  showTopLockIcon = true,
  className = "",
  isDummyMode = false,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Silakan masukkan email");
      return;
    }
    if (!password.trim()) {
      setError("Silakan masukkan password");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Email atau password salah");
        setIsLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal menghubungi server, coba lagi");
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showTopLockIcon && (
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f0f5ff] dark:bg-blue-500/10 text-[#0544cc] dark:text-[var(--accent-primary)] border border-blue-100 dark:border-blue-500/30 flex items-center justify-center shadow-sm">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>
      )}

      <h2 className="text-center font-bold text-[#1e293b] dark:text-fg text-lg sm:text-xl mb-6 tracking-tight">
        Masuk untuk melanjutkan
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isDummyMode && !error && (
          <Alert variant="info">
            Mode demo (tanpa database): owner@demo.local / admin@demo.local, password <strong>demo123</strong>.
          </Alert>
        )}
        {error && (
          <Alert variant="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5 text-slate-600 dark:text-fg-muted" />}
        />

        <Input
          placeholder="Password"
          isPassword
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5 text-slate-600 dark:text-fg-muted" />}
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} loadingText="Memproses...">
            Login
          </Button>
        </div>
      </form>

      <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-fg-muted font-semibold mt-5">
        Belum punya akun?{" "}
        <Link href="/register" className="text-blue-700 dark:text-[var(--accent-primary)] hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  );
};
