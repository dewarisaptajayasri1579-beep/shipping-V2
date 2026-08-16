"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, Input, MultiSelect, useToast } from "@/components/ui";

export interface SupplierRow {
  id: string;
  name: string;
  brandIds: string[];
}

interface FormState {
  name: string;
  brandIds: string[];
}

const emptyForm: FormState = { name: "", brandIds: [] };

export const SupplierTable: React.FC<{ rows: SupplierRow[]; brandOptions: { value: string; label: string }[] }> = ({ rows, brandOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const brandLabel = (id: string) => brandOptions.find((b) => b.value === id)?.label ?? id;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: SupplierRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | SupplierRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: "create" });
  };

  const openEdit = (record: SupplierRow) => {
    setForm({ name: record.name, brandIds: record.brandIds });
    setFormModal({ mode: "edit", record });
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast.error("Nama Supplier wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/master/suppliers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            })
          : await fetch(`/api/master/suppliers/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan Supplier");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Supplier ditambahkan" : "Supplier diperbarui");
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/master/suppliers/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : "Supplier dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<SupplierRow>[] = [
    { key: "name", header: "Nama Supplier", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.name}</span>, filterValue: (r) => r.name },
    {
      key: "brands",
      header: "Brand",
      cell: (r) =>
        r.brandIds.length ? (
          <div className="flex flex-wrap gap-1.5">
            {r.brandIds.map((id) => (
              <Badge key={id} variant="secondary">
                {brandLabel(id)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-fg-muted">-</span>
        ),
      filterValue: (r) => r.brandIds.map(brandLabel).join(" "),
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Supplier">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            { label: "Edit", icon: Pencil, onClick: () => openEdit(r) },
            { label: "Hapus", icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Tambah Supplier
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari supplier..."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteTarget(rows.filter((r) => keys.has(r.id)))}>
            Hapus Terpilih
          </Button>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Supplier" : "Edit Supplier"}
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
          <Input label="Nama Supplier" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <MultiSelect label="Brand" options={brandOptions} value={form.brandIds} onChange={(brandIds) => setForm((f) => ({ ...f, brandIds }))} placeholder="Pilih brand yang disupply" />
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
