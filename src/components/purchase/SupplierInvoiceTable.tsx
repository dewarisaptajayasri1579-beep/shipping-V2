"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, Input, Select, CurrencyInput, DatePicker, useToast } from "@/components/ui";
import { DocumentUploadField } from "@/components/transaksi/DocumentUploadField";

export interface PoItemForInvoice {
  id: string;
  itemId: string | null;
  qtyOrder: number;
  unitPrice: number;
  /** Qty PO ini yang sudah kepakai di invoice lain (global, termasuk invoice yang lagi diedit kalau ada). */
  alreadyInvoiced: number;
}

export interface PurchaseOrderForInvoice {
  id: string;
  poNumber: string;
  supplierId: string | null;
  items: PoItemForInvoice[];
}

export interface InvoiceItemRow {
  id: string;
  purchaseOrderItemId: string;
  qty: number;
  unitPrice: number;
}

export interface SupplierInvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: string | null;
  purchaseOrderId: string;
  countryId: string | null;
  currency: string;
  notes: string | null;
  documentUrl: string | null;
  items: InvoiceItemRow[];
  status: "DRAFT" | "READY TO SHIP" | "PARTIALLY SHIPPED" | "FULLY SHIPPED";
}

type OptionList = { value: string; label: string }[];

interface ItemLineForm {
  purchaseOrderItemId: string;
  qty: number;
  unitPrice: number;
}

interface FormState {
  invoiceNumber: string;
  invoiceDate: string;
  purchaseOrderId: string;
  countryId: string;
  currency: string;
  notes: string;
  documentUrl: string | null;
  lines: ItemLineForm[];
}

const emptyForm = (): FormState => ({
  invoiceNumber: "",
  invoiceDate: "",
  purchaseOrderId: "",
  countryId: "",
  currency: "USD",
  notes: "",
  documentUrl: null,
  lines: [],
});

const STATUS_BADGE: Record<SupplierInvoiceRow["status"], "warning" | "info" | "success"> = {
  DRAFT: "warning",
  "READY TO SHIP": "info",
  "PARTIALLY SHIPPED": "info",
  "FULLY SHIPPED": "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const SupplierInvoiceTable: React.FC<{
  rows: SupplierInvoiceRow[];
  purchaseOrders: PurchaseOrderForInvoice[];
  supplierOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
}> = ({ rows, purchaseOrders, supplierOptions, countryOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");
  const poLabel = (id: string) => purchaseOrders.find((p) => p.id === id)?.poNumber ?? id;

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: SupplierInvoiceRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierInvoiceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pas edit, qty invoice ini sendiri harus ditambahin balik ke "sisa" — biar gak
  // kepotong seolah-olah invoice ini juga "invoice lain" yang makan outstanding PO.
  const ownQtyByPoItem = formModal?.mode === "edit" ? Object.fromEntries(formModal.record!.items.map((it) => [it.purchaseOrderItemId, it.qty])) : {};

  const selectedPo = purchaseOrders.find((p) => p.id === form.purchaseOrderId);
  const poOptions: OptionList = purchaseOrders.map((p) => ({ value: p.id, label: `${p.poNumber} — ${labelOf(supplierOptions, p.supplierId)}` }));

  const remainingForPoItem = (poItem: PoItemForInvoice) => poItem.qtyOrder - poItem.alreadyInvoiced + (ownQtyByPoItem[poItem.id] ?? 0);

  const openCreate = () => {
    setForm(emptyForm());
    setFormModal({ mode: "create" });
  };

  const openEdit = (r: SupplierInvoiceRow) => {
    setForm({
      invoiceNumber: r.invoiceNumber,
      invoiceDate: r.invoiceDate ?? "",
      purchaseOrderId: r.purchaseOrderId,
      countryId: r.countryId ?? "",
      currency: r.currency,
      notes: r.notes ?? "",
      documentUrl: r.documentUrl,
      lines: r.items.map((it) => ({ purchaseOrderItemId: it.purchaseOrderItemId, qty: it.qty, unitPrice: it.unitPrice })),
    });
    setFormModal({ mode: "edit", record: r });
  };

  const selectPo = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    setForm((f) => ({
      ...f,
      purchaseOrderId: poId,
      lines: po ? po.items.map((it) => ({ purchaseOrderItemId: it.id, qty: 0, unitPrice: it.unitPrice })) : [],
    }));
  };

  const updateLineQty = (poItemId: string, qty: number) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.purchaseOrderItemId === poItemId ? { ...l, qty } : l)) }));
  };
  const updateLinePrice = (poItemId: string, unitPrice: number) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.purchaseOrderItemId === poItemId ? { ...l, unitPrice } : l)) }));
  };

  const submitForm = async () => {
    if (!form.invoiceNumber.trim()) {
      toast.error("No Invoice wajib diisi");
      return;
    }
    if (!form.purchaseOrderId) {
      toast.error("PO wajib dipilih");
      return;
    }
    const items = form.lines.filter((l) => l.qty > 0);
    if (items.length === 0) {
      toast.error("Isi minimal 1 Qty Invoice Sekarang");
      return;
    }

    setSubmitting(true);
    try {
      const body = { ...form, items };
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/purchase/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await fetch(`/api/purchase/invoices/${formModal?.record?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan invoice");
        return;
      }
      toast.success(formModal?.mode === "create" ? "Invoice ditambahkan" : "Invoice diperbarui");
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
      const res = await fetch(`/api/purchase/invoices/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus — mungkin sudah punya Shipment");
        return;
      }
      toast.success("Invoice dihapus");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<SupplierInvoiceRow>[] = [
    { key: "invoiceNumber", header: "No Invoice", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.invoiceNumber}</span>, filterValue: (r) => r.invoiceNumber },
    { key: "po", header: "PO", cell: (r) => poLabel(r.purchaseOrderId), filterValue: (r) => poLabel(r.purchaseOrderId) },
    { key: "invoiceDate", header: "Tanggal", cell: (r) => r.invoiceDate || "-" },
    { key: "qty", header: "Qty Invoice", cell: (r) => r.items.reduce((s, it) => s + it.qty, 0).toLocaleString("id-ID") },
    { key: "value", header: "Nilai Invoice", cell: (r) => formatRupiah(r.items.reduce((s, it) => s + it.qty * it.unitPrice, 0)) },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>,
      filterOptions: ["DRAFT", "READY TO SHIP", "PARTIALLY SHIPPED", "FULLY SHIPPED"].map((s) => ({ value: s, label: s })),
      filterValue: (r) => r.status,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Invoice">
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
          Tambah Invoice
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari no invoice..."
        renderExpandableRow={(r) => (
          <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-surface-hover">
                <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty Invoice</th>
                  <th className="px-3 py-2">Unit Price</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((it) => {
                  const poItem = purchaseOrders.find((p) => p.id === r.purchaseOrderId)?.items.find((pi) => pi.id === it.purchaseOrderItemId);
                  return (
                    <tr key={it.id} className="border-t border-slate-100 dark:border-line">
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(poItem?.itemId ?? null)}</td>
                      <td className="px-3 py-2">{it.qty.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2">{formatRupiah(it.unitPrice)}</td>
                      <td className="px-3 py-2 font-semibold">{formatRupiah(it.qty * it.unitPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Supplier Invoice" : "Edit Supplier Invoice"}
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
            <Input label="No Invoice" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
            <DatePicker label="Tanggal Invoice" value={form.invoiceDate} onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))} />
            <Select
              label="PO"
              options={poOptions}
              value={form.purchaseOrderId}
              onChange={selectPo}
              placeholder="Pilih PO"
              disabled={formModal?.mode === "edit"}
            />
            <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
            <Input label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
          </div>

          {selectedPo && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">
                Item dari PO {selectedPo.poNumber} — isi Qty Invoice Sekarang (item dengan sisa 0 gak perlu diisi)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-surface-hover">
                    <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty PO</th>
                      <th className="px-3 py-2">Sisa</th>
                      <th className="px-3 py-2 w-32">Qty Invoice Sekarang</th>
                      <th className="px-3 py-2 w-40">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPo.items.map((poItem) => {
                      const line = form.lines.find((l) => l.purchaseOrderItemId === poItem.id);
                      const remaining = remainingForPoItem(poItem);
                      return (
                        <tr key={poItem.id} className="border-t border-slate-100 dark:border-line">
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(poItem.itemId)}</td>
                          <td className="px-3 py-2">{poItem.qtyOrder.toLocaleString("id-ID")}</td>
                          <td className="px-3 py-2">{remaining.toLocaleString("id-ID")}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={line?.qty ?? 0}
                              max={remaining}
                              min={0}
                              onChange={(e) => updateLineQty(poItem.id, Number(e.target.value))}
                              className="w-24 h-10 px-2 rounded-lg border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] bg-white/60 dark:bg-[var(--field-bg)] text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={line?.unitPrice ?? 0}
                              onChange={(e) => updateLinePrice(poItem.id, Number(e.target.value))}
                              className="w-32 h-10 px-2 rounded-lg border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] bg-white/60 dark:bg-[var(--field-bg)] text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DocumentUploadField label="Scan Invoice" value={form.documentUrl} onChange={(url) => setForm((f) => ({ ...f, documentUrl: url }))} />
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Invoice?"
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
        <p className="text-sm text-slate-600 dark:text-fg-muted font-medium">Data yang sudah dihapus tidak dapat dikembalikan. Invoice yang sudah punya Shipment tidak bisa dihapus.</p>
      </Modal>
    </>
  );
};
