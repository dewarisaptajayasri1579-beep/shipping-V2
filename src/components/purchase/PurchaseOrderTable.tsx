"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus, X } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, Input, Select, CurrencyInput, DatePicker, useToast } from "@/components/ui";

export interface PoItemRow {
  id: string;
  itemId: string | null;
  qtyOrder: number;
  unitPrice: number;
}

export interface PurchaseOrderRow {
  id: string;
  poNumber: string;
  poDate: string | null;
  supplierId: string | null;
  brandId: string | null;
  countryId: string | null;
  currency: string;
  notes: string | null;
  items: PoItemRow[];
  status: "DRAFT" | "OPEN" | "PARTIALLY INVOICED" | "FULLY INVOICED";
}

type OptionList = { value: string; label: string }[];

interface ItemRowForm {
  key: string;
  itemId: string;
  qtyOrder: number;
  unitPrice: number;
}

interface FormState {
  poNumber: string;
  poDate: string;
  supplierId: string;
  brandId: string;
  countryId: string;
  currency: string;
  notes: string;
  items: ItemRowForm[];
}

const newItemRow = (): ItemRowForm => ({ key: crypto.randomUUID(), itemId: "", qtyOrder: 0, unitPrice: 0 });

const emptyForm = (): FormState => ({
  poNumber: "",
  poDate: "",
  supplierId: "",
  brandId: "",
  countryId: "",
  currency: "USD",
  notes: "",
  items: [newItemRow()],
});

const STATUS_BADGE: Record<PurchaseOrderRow["status"], "warning" | "info" | "success"> = {
  DRAFT: "warning",
  OPEN: "info",
  "PARTIALLY INVOICED": "info",
  "FULLY INVOICED": "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const PurchaseOrderTable: React.FC<{
  rows: PurchaseOrderRow[];
  supplierOptions: OptionList;
  brandOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
}> = ({ rows, supplierOptions, brandOptions, countryOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: PurchaseOrderRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm());
    setFormModal({ mode: "create" });
  };

  const openEdit = (r: PurchaseOrderRow) => {
    setForm({
      poNumber: r.poNumber,
      poDate: r.poDate ?? "",
      supplierId: r.supplierId ?? "",
      brandId: r.brandId ?? "",
      countryId: r.countryId ?? "",
      currency: r.currency,
      notes: r.notes ?? "",
      items: r.items.length > 0 ? r.items.map((it) => ({ key: it.id, itemId: it.itemId ?? "", qtyOrder: it.qtyOrder, unitPrice: it.unitPrice })) : [newItemRow()],
    });
    setFormModal({ mode: "edit", record: r });
  };

  const updateItem = (key: string, patch: Partial<ItemRowForm>) => {
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) }));
  };
  const addItemRow = () => setForm((f) => ({ ...f, items: [...f.items, newItemRow()] }));
  const removeItemRow = (key: string) => setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((it) => it.key !== key) : f.items }));

  const submitForm = async () => {
    if (!form.poNumber.trim()) {
      toast.error("No PO wajib diisi");
      return;
    }
    const items = form.items.filter((it) => it.itemId);
    if (items.length === 0) {
      toast.error("Minimal 1 item wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const body = { ...form, items };
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/purchase/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await fetch(`/api/purchase/orders/${formModal?.record?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan PO");
        return;
      }
      toast.success(formModal?.mode === "create" ? "PO ditambahkan" : "PO diperbarui");
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
    setDeleting(true);
    try {
      const res = await fetch(`/api/purchase/orders/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus — mungkin sudah punya Invoice");
        return;
      }
      toast.success("PO dihapus");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<PurchaseOrderRow>[] = [
    { key: "poNumber", header: "No PO", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.poNumber}</span>, filterValue: (r) => r.poNumber },
    { key: "poDate", header: "Tanggal PO", cell: (r) => r.poDate || "-" },
    { key: "supplier", header: "Supplier", cell: (r) => labelOf(supplierOptions, r.supplierId), filterValue: (r) => labelOf(supplierOptions, r.supplierId) },
    { key: "brand", header: "Brand", cell: (r) => labelOf(brandOptions, r.brandId), filterValue: (r) => labelOf(brandOptions, r.brandId), filterOptions: brandOptions },
    { key: "qty", header: "Ordered Qty", cell: (r) => r.items.reduce((s, it) => s + it.qtyOrder, 0).toLocaleString("id-ID") },
    { key: "value", header: "Ordered Value", cell: (r) => formatRupiah(r.items.reduce((s, it) => s + it.qtyOrder * it.unitPrice, 0)) },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>,
      filterOptions: ["DRAFT", "OPEN", "PARTIALLY INVOICED", "FULLY INVOICED"].map((s) => ({ value: s, label: s })),
      filterValue: (r) => r.status,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi PO">
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
          Tambah PO
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari No PO..."
        renderExpandableRow={(r) => (
          <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-surface-hover">
                <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty Order</th>
                  <th className="px-3 py-2">Unit Price</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-100 dark:border-line">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(it.itemId)}</td>
                    <td className="px-3 py-2">{it.qtyOrder.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2">{formatRupiah(it.unitPrice)}</td>
                    <td className="px-3 py-2 font-semibold">{formatRupiah(it.qtyOrder * it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Purchase Order" : "Edit Purchase Order"}
        size="xl"
        footer={
          <div className="flex flex-row-reverse items-center justify-start gap-3 w-full">
            <Button variant="primary" isLoading={submitting} onClick={submitForm}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setFormModal(null)}>
              Batal
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="No PO" value={form.poNumber} onChange={(e) => setForm((f) => ({ ...f, poNumber: e.target.value }))} />
            <DatePicker label="Tanggal PO" value={form.poDate} onChange={(e) => setForm((f) => ({ ...f, poDate: e.target.value }))} />
            <Select label="Supplier" options={supplierOptions} value={form.supplierId} onChange={(v) => setForm((f) => ({ ...f, supplierId: v }))} placeholder="Pilih supplier" />
            <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(v) => setForm((f) => ({ ...f, brandId: v }))} placeholder="Pilih brand" />
            <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
            <Input label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Item</h3>
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addItemRow}>
                Tambah Baris
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((it) => (
                <div key={it.key} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_160px_32px] gap-2 items-end">
                  <Select label="Item" options={itemOptions} value={it.itemId} onChange={(v) => updateItem(it.key, { itemId: v })} placeholder="Pilih item" />
                  <Input type="number" label="Qty Order" value={it.qtyOrder} onChange={(e) => updateItem(it.key, { qtyOrder: Number(e.target.value) })} />
                  <CurrencyInput label="Unit Price" value={it.unitPrice} onChange={(v) => updateItem(it.key, { unitPrice: v })} />
                  <button
                    type="button"
                    onClick={() => removeItemRow(it.key)}
                    className="h-14 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                    aria-label="Hapus baris"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus PO?"
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
        <p className="text-sm text-slate-600 dark:text-fg-muted font-medium">Data yang sudah dihapus tidak dapat dikembalikan. PO yang sudah punya Invoice tidak bisa dihapus.</p>
      </Modal>
    </>
  );
};
