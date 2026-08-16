"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Button, Dropdown, Modal, Input, useToast } from "@/components/ui";
import { MoreVertical } from "lucide-react";

export interface SimpleMasterRecord {
  id: string;
  name: string;
}

export interface SimpleMasterTableProps {
  /** Slug resource API, mis. "brands" -> /api/master/brands. */
  apiResource: string;
  /** Label entitas untuk copy UI, mis. "Brand". */
  entityLabel: string;
  rows: SimpleMasterRecord[];
  searchPlaceholder?: string;
}

/** Tabel CRUD generik untuk entitas Master Data yang cuma punya field "nama"
 *  (Brand, Negara Asal, Gudang, Project/Kategori) — dedup 4 halaman yang identik. */
export const SimpleMasterTable: React.FC<SimpleMasterTableProps> = ({ apiResource, entityLabel, rows, searchPlaceholder }) => {
  const router = useRouter();
  const toast = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: SimpleMasterRecord } | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SimpleMasterRecord | SimpleMasterRecord[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setName("");
    setFormModal({ mode: "create" });
  };

  const openEdit = (record: SimpleMasterRecord) => {
    setName(record.name);
    setFormModal({ mode: "edit", record });
  };

  const submitForm = async () => {
    if (!name.trim()) {
      toast.error(`Nama ${entityLabel} wajib diisi`);
      return;
    }

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch(`/api/master/${apiResource}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            })
          : await fetch(`/api/master/${apiResource}/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || `Gagal menyimpan ${entityLabel}`);
        return;
      }

      toast.success(formModal?.mode === "create" ? `${entityLabel} ditambahkan` : `${entityLabel} diperbarui`);
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/master/${apiResource}/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : `${entityLabel} dihapus`);
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<SimpleMasterRecord>[] = [
    {
      key: "name",
      header: "Nama",
      cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.name}</span>,
      filterValue: (r) => r.name,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label={`Aksi ${entityLabel}`}>
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
          Tambah {entityLabel}
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder={searchPlaceholder ?? `Cari ${entityLabel.toLowerCase()}...`}
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setDeleteTarget(rows.filter((r) => keys.has(r.id)))}
          >
            Hapus Terpilih
          </Button>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? `Tambah ${entityLabel}` : `Edit ${entityLabel}`}
        size="sm"
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
        <Input label={`Nama ${entityLabel}`} value={name} onChange={(e) => setName(e.target.value)} />
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
