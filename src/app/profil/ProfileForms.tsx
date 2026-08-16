"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
  Avatar,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
  Select,
  TableContainer,
} from "@/components/ui";

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber: string | null;
}

export const ProfileForms: React.FC<{ user: ProfileUser }> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();

  // Edit Profile States
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Account Settings States
  const [language, setLanguage] = useState("id");
  const [timezone, setTimezone] = useState("WIB");

  // Notification States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan profil");
        return;
      }
      toast.success(
        data?.dummyMode
          ? "Tersimpan sementara (mode demo, hilang saat server restart)"
          : "Profil diperbarui"
      );
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak sama");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal mengubah password");
        return;
      }
      toast[data?.dummyMode ? "info" : "success"](data?.message || "Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveAccountSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pengaturan akun berhasil disimpan!");
  };

  const saveNotificationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Preferensi notifikasi berhasil diperbarui!");
  };

  return (
    <Card variant="panel" padding="lg">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user.name} size="lg" />
        <div>
          <p className="text-lg font-black text-slate-900 dark:text-fg">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-fg-muted font-medium">{user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="profil">
        <TabList className="flex-wrap">
          <Tab value="profil">Edit Profil</Tab>
          <Tab value="keamanan">Ubah Sandi</Tab>
          <Tab value="settings">Pengaturan Akun</Tab>
          <Tab value="notifications">Notifikasi</Tab>
          <Tab value="details">Detail User</Tab>
        </TabList>
        
        <TabPanels>
          {/* 1. Edit Profile */}
          <TabPanel value="profil">
            <form onSubmit={saveProfile} className="space-y-4 max-w-md pt-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Edit Profil</CardTitle>
                <CardDescription>Nama dan nomor telepon yang ditampilkan di sistem.</CardDescription>
              </CardHeader>
              <Input label="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="No. Telepon" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              <Button type="submit" variant="primary" isLoading={savingProfile}>
                Simpan Perubahan
              </Button>
            </form>
          </TabPanel>

          {/* 2. Change Password */}
          <TabPanel value="keamanan">
            <form onSubmit={changePassword} className="space-y-4 max-w-md pt-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Ubah Kata Sandi</CardTitle>
                <CardDescription>Gunakan password lama untuk mengonfirmasi perubahan.</CardDescription>
              </CardHeader>
              <Input label="Password Saat Ini" isPassword value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <Input label="Password Baru" isPassword value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <Input label="Konfirmasi Password Baru" isPassword value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <Button type="submit" variant="primary" isLoading={savingPassword}>
                Ubah Password
              </Button>
            </form>
          </TabPanel>

          {/* 3. Account Setting */}
          <TabPanel value="settings">
            <form onSubmit={saveAccountSettings} className="space-y-4 max-w-md pt-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Pengaturan Regional &amp; Akun</CardTitle>
                <CardDescription>Sesuaikan preferensi bahasa dan waktu lokal.</CardDescription>
              </CardHeader>
              <Select
                label="Bahasa Sistem"
                value={language}
                onChange={(val) => setLanguage(val)}
                options={[
                  { value: "id", label: "Bahasa Indonesia" },
                  { value: "en", label: "English" },
                ]}
              />
              <Select
                label="Zona Waktu"
                value={timezone}
                onChange={(val) => setTimezone(val)}
                options={[
                  { value: "WIB", label: "Asia/Jakarta (WIB)" },
                  { value: "WITA", label: "Asia/Makassar (WITA)" },
                  { value: "WIT", label: "Asia/Jayapura (WIT)" },
                ]}
              />
              <Button type="submit" variant="primary">
                Simpan Pengaturan
              </Button>
            </form>
          </TabPanel>

          {/* 4. Notification Setting */}
          <TabPanel value="notifications">
            <form onSubmit={saveNotificationSettings} className="space-y-5 max-w-md pt-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Preferensi Notifikasi</CardTitle>
                <CardDescription>Kelola bagaimana Anda menerima pemberitahuan sistem.</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-200 dark:border-line focus:ring-blue-500/20"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-fg">Notifikasi Email</p>
                    <p className="text-xs text-slate-500 dark:text-fg-muted font-medium">Kirim laporan penjualan mingguan ke email.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-200 dark:border-line focus:ring-blue-500/20"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-fg">Push Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-fg-muted font-medium">Aktifkan pop-up real-time di browser desktop.</p>
                  </div>
                </label>
              </div>
              <Button type="submit" variant="primary">
                Simpan Preferensi
              </Button>
            </form>
          </TabPanel>

          {/* 5. User Detail */}
          <TabPanel value="details">
            <div className="space-y-4 pt-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Detail Informasi Pengguna</CardTitle>
                <CardDescription>Data internal hak akses akun yang tidak dapat diubah langsung.</CardDescription>
              </CardHeader>
              <TableContainer className="rounded-xl border border-slate-200 dark:border-line max-w-md">
                <table className="w-full text-sm text-left">
                  <tbody>
                    <tr className="border-b border-slate-200 dark:border-line">
                      <td className="p-3 font-bold text-slate-400 uppercase text-[10px]">User ID</td>
                      <td className="p-3 font-mono text-slate-700 dark:text-fg-secondary text-xs">{user.id}</td>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-line">
                      <td className="p-3 font-bold text-slate-400 uppercase text-[10px]">Hak Akses (Role)</td>
                      <td className="p-3 text-slate-700 dark:text-fg-secondary font-bold text-xs uppercase">{user.role}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-400 uppercase text-[10px]">Status Akun</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">AKTIF / TERVERIFIKASI</td>
                    </tr>
                  </tbody>
                </table>
              </TableContainer>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Card>
  );
};
