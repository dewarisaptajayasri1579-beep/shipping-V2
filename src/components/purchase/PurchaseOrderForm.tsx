"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Card, Button, Input, Select, CurrencyInput, DatePicker, useToast } from "@/components/ui";
import { useFormKeyboardNav } from "@/lib/focus-nav";
import type { PurchaseOrderRow } from "./PurchaseOrderTable";

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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

const toForm = (r?: PurchaseOrderRow): FormState =>
  r
    ? {
        poNumber: r.poNumber,
        poDate: r.poDate ?? "",
        supplierId: r.supplierId ?? "",
        brandId: r.brandId ?? "",
        countryId: r.countryId ?? "",
        currency: r.currency,
        notes: r.notes ?? "",
        items: r.items.length > 0 ? r.items.map((it) => ({ key: it.id, itemId: it.itemId ?? "", qtyOrder: it.qtyOrder, unitPrice: it.unitPrice })) : [newItemRow()],
      }
    : {
        poNumber: "",
        poDate: "",
        supplierId: "",
        brandId: "",
        countryId: "",
        currency: "USD",
        notes: "",
        items: [newItemRow()],
      };

/** Form Tambah/Edit PO — halaman penuh (bukan modal, item repeater-nya bisa panjang).
 *  Dipakai dari /purchase/orders/new dan /purchase/orders/[id]. */
export const PurchaseOrderForm: React.FC<{
  mode: "create" | "edit";
  record?: PurchaseOrderRow;
  supplierOptions: OptionList;
  brandOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
}> = ({ mode, record, supplierOptions, brandOptions, countryOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const { panelRef, handleEnterAdvance } = useFormKeyboardNav<HTMLDivElement>();

  const [form, setForm] = useState<FormState>(() => toForm(record));
  const [submitting, setSubmitting] = useState(false);

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
        mode === "create"
          ? await fetch("/api/purchase/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await fetch(`/api/purchase/orders/${record?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan PO");
        return;
      }
      toast.success(mode === "create" ? "PO ditambahkan" : "PO diperbarui");
      router.push("/purchase/orders");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={panelRef} data-modal-panel onKeyDown={handleEnterAdvance} className="space-y-6">
      <Card variant="panel" padding="lg" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="No PO" value={form.poNumber} onChange={(e) => setForm((f) => ({ ...f, poNumber: e.target.value }))} />
          <DatePicker label="Tanggal PO" value={form.poDate} onChange={(e) => setForm((f) => ({ ...f, poDate: e.target.value }))} />
          <Select label="Supplier" options={supplierOptions} value={form.supplierId} onChange={(v) => setForm((f) => ({ ...f, supplierId: v }))} placeholder="Pilih supplier" />
          <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(v) => setForm((f) => ({ ...f, brandId: v }))} placeholder="Pilih brand" />
          <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
          <Input label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
        </div>
      </Card>

      <Card variant="panel" padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Item</h3>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addItemRow}>
            Tambah Baris
          </Button>
        </div>
        <div className="space-y-2">
          {form.items.map((it) => (
            <div key={it.key} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_160px_140px_32px] gap-2 items-end">
              <Select label="Item" options={itemOptions} value={it.itemId} onChange={(v) => updateItem(it.key, { itemId: v })} placeholder="Pilih item" />
              <Input type="number" label="Qty Order" value={it.qtyOrder} onChange={(e) => updateItem(it.key, { qtyOrder: Number(e.target.value) })} />
              <CurrencyInput label="Unit Price" value={it.unitPrice} onChange={(v) => updateItem(it.key, { unitPrice: v })} />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-fg-secondary select-none">Subtotal</span>
                <p className="h-14 flex items-center px-1 text-sm font-semibold text-slate-700 dark:text-fg-secondary">{formatRupiah(it.qtyOrder * it.unitPrice)}</p>
              </div>
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
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-line">
          <span className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Total Nominal</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-fg">
            {formatRupiah(form.items.reduce((sum, it) => sum + it.qtyOrder * it.unitPrice, 0))}
          </span>
        </div>
      </Card>

      <div className="flex flex-row-reverse items-center justify-start gap-3">
        <Button variant="primary" isLoading={submitting} onClick={submitForm}>
          Simpan
        </Button>
        <Button variant="ghost" onClick={() => router.push("/purchase/orders")}>
          Batal
        </Button>
      </div>
    </div>
  );
};
