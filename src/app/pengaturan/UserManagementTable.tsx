"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import {
  FilterableTable,
  type FilterableColumn,
  Badge,
  Button,
  Dropdown,
  Modal,
  Input,
  Select,
  useToast,
} from "@/components/ui";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber: string | null;
}

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

const ROLE_BADGE_VARIANT: Record<string, "primary" | "secondary" | "success"> = {
  owner: "primary",
  admin: "success",
  user: "secondary",
};

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber: string;
}

const emptyForm: FormState = { name: "", email: "", password: "", role: "user", phoneNumber: "" };

export const UserManagementTable: React.FC<{ users: ManagedUser[]; currentUserId: string }> = ({ users, currentUserId }) => {
  const router = useRouter();
  const toast = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; user?: ManagedUser } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | ManagedUser[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: "create" });
  };

  const openEdit = (user: ManagedUser) => {
    setForm({ name: user.name, email: user.email, password: "", role: user.role, phoneNumber: user.phoneNumber ?? "" });
    setFormModal({ mode: "edit", user });
  };

  const submitForm = async () => {
    if (!form.name.trim() || (formModal?.mode === "create" && (!form.email.trim() || !form.password))) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            })
          : await fetch(`/api/users/${formModal?.user?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: form.name, role: form.role, phoneNumber: form.phoneNumber }),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan pengguna");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Pengguna ditambahkan" : "Pengguna diperbarui");
      if (data?.dummyMode && formModal?.mode === "create") {
        toast.info("Mode demo: password baru tidak berlaku, tetap pakai demo123 untuk login.");
      }
      setFormModal(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targets = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];

    setDeleting(true);
    try {
      const results = await Promise.all(targets.map((u) => fetch(`/api/users/${u.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} pengguna gagal dihapus`);
      else toast.success(targets.length > 1 ? "Pengguna terpilih dihapus" : "Pengguna dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<ManagedUser>[] = [
    { key: "name", header: "Nama", cell: (u) => <span className="font-bold text-slate-800 dark:text-fg">{u.name}</span>, filterValue: (u) => u.name },
    { key: "email", header: "Email", cell: (u) => u.email, filterValue: (u) => u.email },
    {
      key: "role",
      header: "Role",
      cell: (u) => <Badge variant={ROLE_BADGE_VARIANT[u.role] ?? "secondary"}>{u.role}</Badge>,
      filterValue: (u) => u.role,
      filterOptions: ROLE_OPTIONS,
    },
    { key: "phone", header: "No. Telepon", cell: (u) => u.phoneNumber || "-" },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (u) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi pengguna">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            { label: "Edit", icon: Pencil, onClick: () => openEdit(u) },
            { label: "Hapus", icon: Trash2, danger: true, disabled: u.id === currentUserId, onClick: () => setDeleteTarget(u) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Tambah Pengguna
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        searchPlaceholder="Cari nama atau email..."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setDeleteTarget(users.filter((u) => keys.has(u.id) && u.id !== currentUserId))}
          >
            Hapus Terpilih
          </Button>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Pengguna" : "Edit Pengguna"}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setFormModal(null)}>
              Batal
            </Button>
            <Button variant="primary" isLoading={submitting} onClick={submitForm}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nama" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input
            label="Email"
            type="email"
            value={form.email}
            disabled={formModal?.mode === "edit"}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          {formModal?.mode === "create" && (
            <Input
              label="Password"
              isPassword
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          )}
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(value) => setForm((f) => ({ ...f, role: value }))}
            searchable={false}
          />
          <Input label="No. Telepon" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Data?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" isLoading={deleting} onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-fg-muted font-medium">Data yang sudah dihapus tidak dapat dikembalikan.</p>
      </Modal>
    </>
  );
};
