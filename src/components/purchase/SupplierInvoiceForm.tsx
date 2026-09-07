"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, Button, Input, Select, DatePicker, Badge, useToast } from "@/components/ui";
import { useFormKeyboardNav } from "@/lib/focus-nav";
import { DocumentUploadField } from "@/components/transaksi/DocumentUploadField";
import type { PurchaseOrderForInvoice, SupplierInvoiceRow, StatusPembayaran } from "./SupplierInvoiceTable";

type OptionList = { value: string; label: string }[];

interface ItemLineForm {
  purchaseOrderItemId: string;
  qty: number;
  unitPrice: number;
}

interface FormState {
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  purchaseOrderId: string;
  countryId: string;
  currency: string;
  notes: string;
  documentUrl: string | null;
  paymentStatus: StatusPembayaran;
  dueDate: string;
  paymentDate: string;
  lines: ItemLineForm[];
}

const STATUS_BADGE: Record<PurchaseOrderForInvoice["status"], "warning" | "info" | "success"> = {
  DRAFT: "warning",
  OPEN: "info",
  "PARTIALLY INVOICED": "info",
  "FULLY INVOICED": "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

const toForm = (r?: SupplierInvoiceRow, poSupplierId?: string): FormState =>
  r
    ? {
        supplierId: poSupplierId ?? "",
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate ?? "",
        purchaseOrderId: r.purchaseOrderId,
        countryId: r.countryId ?? "",
        currency: r.currency,
        notes: r.notes ?? "",
        documentUrl: r.documentUrl,
        paymentStatus: r.paymentStatus,
        dueDate: r.dueDate ?? "",
        paymentDate: r.paymentDate ?? "",
        lines: r.items.map((it) => ({ purchaseOrderItemId: it.purchaseOrderItemId, qty: it.qty, unitPrice: it.unitPrice })),
      }
    : {
        supplierId: "",
        invoiceNumber: "",
        invoiceDate: "",
        purchaseOrderId: "",
        countryId: "",
        currency: "USD",
        notes: "",
        documentUrl: null,
        paymentStatus: "BELUM DIBAYAR",
        dueDate: "",
        paymentDate: "",
        lines: [],
      };

/** Form Tambah/Edit Supplier Invoice — halaman penuh. Alur pilih PO: Supplier dulu, baru
 *  PO-PO supplier itu yang masih OPEN/PARTIALLY INVOICED muncul sebagai daftar (bisa di-expand
 *  buat intip itemnya duluan) — bukan dropdown PO datar dari semua supplier sekaligus.
 *  Dipakai dari /purchase/invoices/new dan /purchase/invoices/[id]. */
export const SupplierInvoiceForm: React.FC<{
  mode: "create" | "edit";
  record?: SupplierInvoiceRow;
  purchaseOrders: PurchaseOrderForInvoice[];
  supplierOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
}> = ({ mode, record, purchaseOrders, supplierOptions, countryOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const editingPo = mode === "edit" && record ? purchaseOrders.find((p) => p.id === record.purchaseOrderId) : undefined;

  const [form, setForm] = useState<FormState>(() => toForm(record, editingPo?.supplierId ?? undefined));
  const [expandedPoIds, setExpandedPoIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Pas edit, qty invoice ini sendiri ditambah balik ke "sisa" (sama pola kayak Shipment edit).
  const ownQtyByPoItem = mode === "edit" && record ? Object.fromEntries(record.items.map((it) => [it.purchaseOrderItemId, it.qty])) : {};
  const remainingForPoItem = (poItem: PurchaseOrderForInvoice["items"][number]) => poItem.qtyOrder - poItem.alreadyInvoiced + (ownQtyByPoItem[poItem.id] ?? 0);

  const selectedPo = purchaseOrders.find((p) => p.id === form.purchaseOrderId);

  // PO yang bisa dipilih: milik supplier terpilih, masih ada sisa qty (bukan FULLY INVOICED) —
  // kecuali PO yang lagi diedit sekarang, itu tetap boleh tampil walau statusnya sudah berubah.
  const selectablePos = purchaseOrders.filter(
    (p) => p.supplierId === form.supplierId && (p.status !== "FULLY INVOICED" || p.id === record?.purchaseOrderId)
  );

  const togglePoExpand = (poId: string) => {
    setExpandedPoIds((s) => {
      const next = new Set(s);
      if (next.has(poId)) next.delete(poId);
      else next.add(poId);
      return next;
    });
  };

  const selectSupplier = (supplierId: string) => {
    setForm((f) => ({ ...f, supplierId, purchaseOrderId: "", lines: [] }));
  };

  const selectPo = (po: PurchaseOrderForInvoice) => {
    setForm((f) => ({ ...f, purchaseOrderId: po.id, lines: po.items.map((it) => ({ purchaseOrderItemId: it.id, qty: 0, unitPrice: it.unitPrice })) }));
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
        mode === "create"
          ? await fetch("/api/purchase/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await fetch(`/api/purchase/invoices/${record?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan invoice");
        return;
      }
      toast.success(mode === "create" ? "Invoice ditambahkan" : "Invoice diperbarui");
      router.push("/purchase/invoices");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const { panelRef, handleEnterAdvance } = useFormKeyboardNav<HTMLDivElement>(submitForm);

  return (
    <div ref={panelRef} data-modal-panel onKeyDown={handleEnterAdvance} className="space-y-6">
      <Card variant="panel" padding="lg" className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Info Dasar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="No Invoice" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
          <DatePicker label="Tanggal Invoice" value={form.invoiceDate} onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))} />
          <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
          <Input label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
        </div>
      </Card>

      <Card variant="panel" padding="lg" className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Supplier &amp; PO</h3>
          <p className="text-xs text-slate-500 dark:text-fg-muted mt-0.5">Pilih supplier dulu — PO milik supplier itu yang masih ada sisa qty akan muncul di bawah.</p>
        </div>
        <Select
          label="Supplier"
          options={supplierOptions}
          value={form.supplierId}
          onChange={selectSupplier}
          placeholder="Pilih supplier"
          disabled={mode === "edit"}
        />

        {form.supplierId && (
          <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line mt-2">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-surface-hover">
                <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2">No PO</th>
                  <th className="px-3 py-2">Ordered Qty</th>
                  <th className="px-3 py-2">Ordered Value</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {selectablePos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-500 dark:text-fg-muted">
                      Tidak ada PO supplier ini yang masih bisa di-invoice.
                    </td>
                  </tr>
                )}
                {selectablePos.map((po) => {
                  const expanded = expandedPoIds.has(po.id);
                  const isSelected = form.purchaseOrderId === po.id;
                  return (
                    <React.Fragment key={po.id}>
                      <tr className={`border-t border-slate-100 dark:border-line ${isSelected ? "bg-blue-50/60 dark:bg-blue-500/10" : ""}`}>
                        <td className="px-3 py-2">
                          <button type="button" data-skip-nav onClick={() => togglePoExpand(po.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-fg cursor-pointer" aria-label="Lihat item">
                            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-fg">{po.poNumber}</td>
                        <td className="px-3 py-2">{po.items.reduce((s, it) => s + it.qtyOrder, 0).toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">{formatRupiah(po.items.reduce((s, it) => s + it.qtyOrder * it.unitPrice, 0))}</td>
                        <td className="px-3 py-2">
                          <Badge variant={STATUS_BADGE[po.status]}>{po.status}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Button type="button" variant={isSelected ? "secondary" : "outline"} size="sm" data-skip-nav onClick={() => selectPo(po)}>
                            {isSelected ? "Terpilih" : "Pilih"}
                          </Button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-slate-100 dark:border-line">
                          <td colSpan={6} className="px-3 py-2 bg-slate-50/60 dark:bg-surface-hover">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                                  <th className="px-3 py-1.5">Item</th>
                                  <th className="px-3 py-1.5">Qty Order</th>
                                  <th className="px-3 py-1.5">Sisa</th>
                                  <th className="px-3 py-1.5">Unit Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {po.items.map((it) => (
                                  <tr key={it.id} className="border-t border-slate-200/60 dark:border-line">
                                    <td className="px-3 py-1.5 font-medium text-slate-800 dark:text-fg">{itemLabel(it.itemId)}</td>
                                    <td className="px-3 py-1.5">{it.qtyOrder.toLocaleString("id-ID")}</td>
                                    <td className="px-3 py-1.5">{remainingForPoItem(it).toLocaleString("id-ID")}</td>
                                    <td className="px-3 py-1.5">{formatRupiah(it.unitPrice)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedPo && (
        <Card variant="panel" padding="lg" className="space-y-3">
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
        </Card>
      )}

      {mode === "edit" && (
        <Card variant="panel" padding="lg" className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Pembayaran ke Supplier (PI)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status Pembayaran"
              options={[
                { value: "BELUM DIBAYAR", label: "BELUM DIBAYAR" },
                { value: "SUDAH DIBAYAR", label: "SUDAH DIBAYAR" },
              ]}
              value={form.paymentStatus}
              onChange={(v) => setForm((f) => ({ ...f, paymentStatus: v as StatusPembayaran }))}
              searchable={false}
            />
            <DatePicker label="Jatuh Tempo" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            <DatePicker label="Tanggal Dibayar" value={form.paymentDate} onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))} />
          </div>
        </Card>
      )}

      <Card variant="panel" padding="lg" className="space-y-4">
        <DocumentUploadField label="Scan Invoice" value={form.documentUrl} onChange={(url) => setForm((f) => ({ ...f, documentUrl: url }))} />
        <Input label="Catatan (opsional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </Card>

      <div className="flex flex-row-reverse items-center justify-start gap-3">
        <Button variant="primary" isLoading={submitting} onClick={submitForm}>
          Simpan
        </Button>
        <Button variant="ghost" onClick={() => router.push("/purchase/invoices")}>
          Batal
        </Button>
      </div>
    </div>
  );
};
