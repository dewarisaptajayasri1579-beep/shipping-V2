"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Button, Alert } from "../ui";
import { Mail, Lock, User, Phone } from "lucide-react";

export const RegisterForm: React.FC<{ showTopLockIcon?: boolean; className?: string; isDummyMode?: boolean }> = ({
  showTopLockIcon = true,
  className = "",
  isDummyMode = false,
}) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Nama, email, dan password wajib diisi");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phoneNumber, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Gagal mendaftar");
        setIsLoading(false);
        return;
      }
      if (data?.dummyMode) {
        setSuccess(data?.message || "Mode demo: pendaftaran tidak disimpan. Silakan login dengan akun demo.");
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
            <User className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>
      )}

      <h2 className="text-center font-bold text-[#1e293b] dark:text-fg text-lg sm:text-xl mb-6 tracking-tight">Buat akun baru</h2>

      {isDummyMode && !error && !success && (
        <Alert variant="info" className="mb-4">
          Mode demo (tanpa database): pendaftaran akan diterima tapi tidak benar-benar disimpan.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && <Alert variant="success">{success}</Alert>}

        <Input placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} leftIcon={<User className="w-5 h-5 text-slate-600 dark:text-fg-muted" />} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="w-5 h-5 text-slate-600 dark:text-fg-muted" />} />
        <Input placeholder="No. Telepon (opsional)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} leftIcon={<Phone className="w-5 h-5 text-slate-600 dark:text-fg-muted" />} />
        <Input placeholder="Password" isPassword value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Lock className="w-5 h-5 text-slate-600 dark:text-fg-muted" />} />

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} loadingText="Memproses...">
            Daftar
          </Button>
        </div>
      </form>

      <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-fg-muted font-semibold mt-5">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-blue-700 dark:text-[var(--accent-primary)] hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};
