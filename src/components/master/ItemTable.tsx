"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, Input, Select, useToast } from "@/components/ui";

export interface ItemRow {
  id: string;
  itemCode: string;
  hsCode: string;
  description: string;
  internalCode: string | null;
  brandId: string | null;
}

interface FormState {
  itemCode: string;
  hsCode: string;
  description: string;
  internalCode: string;
  brandId: string;
}

const emptyForm: FormState = { itemCode: "", hsCode: "", description: "", internalCode: "", brandId: "" };

export const ItemTable: React.FC<{ rows: ItemRow[]; brandOptions: { value: string; label: string }[] }> = ({ rows, brandOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const brandLabel = (id: string | null) => (id ? brandOptions.find((b) => b.value === id)?.label ?? id : "-");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: ItemRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ItemRow | ItemRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: "create" });
  };

  const openEdit = (record: ItemRow) => {
    setForm({
      itemCode: record.itemCode,
      hsCode: record.hsCode,
      description: record.description,
      internalCode: record.internalCode ?? "",
      brandId: record.brandId ?? "",
    });
    setFormModal({ mode: "edit", record });
  };

  const submitForm = async () => {
    if (!form.itemCode.trim()) {
      toast.error("Kode Item wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/master/items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            })
          : await fetch(`/api/master/items/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan Item");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Item ditambahkan" : "Item diperbarui");
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/master/items/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : "Item dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<ItemRow>[] = [
    { key: "itemCode", header: "Kode Item", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.itemCode}</span>, filterValue: (r) => r.itemCode },
    { key: "hsCode", header: "HS Code", cell: (r) => r.hsCode || "-", filterValue: (r) => r.hsCode },
    { key: "description", header: "Deskripsi", cell: (r) => r.description || "-", filterValue: (r) => r.description },
    { key: "internalCode", header: "Kode Internal (Illuvia)", cell: (r) => r.internalCode || "-", filterValue: (r) => r.internalCode ?? "" },
    {
      key: "brand",
      header: "Brand",
      cell: (r) => (r.brandId ? <Badge variant="secondary">{brandLabel(r.brandId)}</Badge> : <span className="text-slate-400 dark:text-fg-muted">-</span>),
      filterValue: (r) => brandLabel(r.brandId),
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Item">
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
          Tambah Item
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari kode item atau deskripsi..."
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
        title={formModal?.mode === "create" ? "Tambah Item" : "Edit Item"}
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
          <Input label="Kode Item" value={form.itemCode} onChange={(e) => setForm((f) => ({ ...f, itemCode: e.target.value }))} />
          <Input label="HS Code" value={form.hsCode} onChange={(e) => setForm((f) => ({ ...f, hsCode: e.target.value }))} />
          <Input label="Deskripsi" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input
            label="Kode Internal (khusus Illuvia)"
            value={form.internalCode}
            onChange={(e) => setForm((f) => ({ ...f, internalCode: e.target.value }))}
          />
          <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(brandId) => setForm((f) => ({ ...f, brandId }))} placeholder="Pilih brand" />
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
