"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { Card, Badge, Button, Dropdown, Modal, Input, Select, CurrencyInput, DatePicker, useToast } from "@/components/ui";
import { DocumentUploadField } from "./DocumentUploadField";
import { STATUS_PEMBAYARAN, type StatusPembayaran } from "@/lib/data/transaksi-constants";
import type { ShipmentRow, ShipmentInvoiceRow, ShipmentPoRow, ShipmentItemRow } from "./ShipmentTable";

type OptionList = { value: string; label: string }[];

const STATUS_BAYAR_BADGE: Record<StatusPembayaran, "warning" | "success"> = {
  "BELUM DIBAYAR": "warning",
  "SUDAH DIBAYAR": "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

const emptyInvoiceForm = { invoice: "", nilaiBilling: 0, statusPembayaranPI: "BELUM DIBAYAR" as StatusPembayaran, dueDatePI: "", documentUrl: null as string | null };
const emptyPoForm = { po: "", documentUrl: null as string | null };
const emptyItemForm = { itemId: "", qty: 0, priceSatuan: 0 };

/** Kelola Invoice > PO > Item milik 1 shipment. Tiap perubahan nge-PATCH seluruh objek
 *  Shipment (bukan endpoint granular per-invoice/po/item) — lebih simpel karena layer
 *  data masih JSON file per shipment, bukan tabel relasional terpisah. */
export const ShipmentDetailView: React.FC<{ shipment: ShipmentRow; itemOptions: OptionList }> = ({ shipment, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [saving, setSaving] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<{ mode: "create" | "edit"; invoice?: ShipmentInvoiceRow } | null>(null);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [poModal, setPoModal] = useState<{ mode: "create" | "edit"; invoiceId: string; po?: ShipmentPoRow } | null>(null);
  const [poForm, setPoForm] = useState(emptyPoForm);
  const [itemModal, setItemModal] = useState<{ mode: "create" | "edit"; invoiceId: string; poId: string; item?: ShipmentItemRow } | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "invoice" | "po" | "item"; invoiceId: string; poId?: string; itemId?: string; label: string } | null>(null);

  const patchInvoices = async (invoices: ShipmentInvoiceRow[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transaksi/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...shipment, invoices }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan perubahan");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      toast.error("Gagal menghubungi server");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openInvoiceCreate = () => {
    setInvoiceForm(emptyInvoiceForm);
    setInvoiceModal({ mode: "create" });
  };
  const openInvoiceEdit = (inv: ShipmentInvoiceRow) => {
    setInvoiceForm({ invoice: inv.invoice, nilaiBilling: inv.nilaiBilling, statusPembayaranPI: inv.statusPembayaranPI, dueDatePI: inv.dueDatePI ?? "", documentUrl: inv.documentUrl });
    setInvoiceModal({ mode: "edit", invoice: inv });
  };
  const saveInvoice = async () => {
    if (!invoiceForm.invoice.trim()) {
      toast.error("Invoice wajib diisi");
      return;
    }
    const invoices =
      invoiceModal?.mode === "create"
        ? [...shipment.invoices, { id: crypto.randomUUID(), ...invoiceForm, purchaseOrders: [] }]
        : shipment.invoices.map((inv) => (inv.id === invoiceModal?.invoice?.id ? { ...inv, ...invoiceForm } : inv));
    if (await patchInvoices(invoices)) {
      toast.success("Invoice disimpan");
      setInvoiceModal(null);
    }
  };

  const openPoCreate = (invoiceId: string) => {
    setPoForm(emptyPoForm);
    setPoModal({ mode: "create", invoiceId });
  };
  const openPoEdit = (invoiceId: string, po: ShipmentPoRow) => {
    setPoForm({ po: po.po, documentUrl: po.documentUrl });
    setPoModal({ mode: "edit", invoiceId, po });
  };
  const savePo = async () => {
    if (!poForm.po.trim()) {
      toast.error("PO wajib diisi");
      return;
    }
    const invoices = shipment.invoices.map((inv) => {
      if (inv.id !== poModal?.invoiceId) return inv;
      const purchaseOrders =
        poModal.mode === "create"
          ? [...inv.purchaseOrders, { id: crypto.randomUUID(), ...poForm, items: [] }]
          : inv.purchaseOrders.map((po) => (po.id === poModal.po?.id ? { ...po, ...poForm } : po));
      return { ...inv, purchaseOrders };
    });
    if (await patchInvoices(invoices)) {
      toast.success("PO disimpan");
      setPoModal(null);
    }
  };

  const openItemCreate = (invoiceId: string, poId: string) => {
    setItemForm(emptyItemForm);
    setItemModal({ mode: "create", invoiceId, poId });
  };
  const openItemEdit = (invoiceId: string, poId: string, item: ShipmentItemRow) => {
    setItemForm({ itemId: item.itemId ?? "", qty: item.qty, priceSatuan: item.priceSatuan });
    setItemModal({ mode: "edit", invoiceId, poId, item });
  };
  const saveItem = async () => {
    if (!itemForm.itemId) {
      toast.error("Item wajib dipilih");
      return;
    }
    const invoices = shipment.invoices.map((inv) => {
      if (inv.id !== itemModal?.invoiceId) return inv;
      return {
        ...inv,
        purchaseOrders: inv.purchaseOrders.map((po) => {
          if (po.id !== itemModal?.poId) return po;
          const items =
            itemModal.mode === "create"
              ? [...po.items, { id: crypto.randomUUID(), ...itemForm }]
              : po.items.map((it) => (it.id === itemModal.item?.id ? { ...it, ...itemForm } : it));
          return { ...po, items };
        }),
      };
    });
    if (await patchInvoices(invoices)) {
      toast.success("Item disimpan");
      setItemModal(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    let invoices = shipment.invoices;
    if (deleteTarget.kind === "invoice") {
      invoices = invoices.filter((inv) => inv.id !== deleteTarget.invoiceId);
    } else if (deleteTarget.kind === "po") {
      invoices = invoices.map((inv) =>
        inv.id !== deleteTarget.invoiceId ? inv : { ...inv, purchaseOrders: inv.purchaseOrders.filter((po) => po.id !== deleteTarget.poId) }
      );
    } else {
      invoices = invoices.map((inv) => {
        if (inv.id !== deleteTarget.invoiceId) return inv;
        return {
          ...inv,
          purchaseOrders: inv.purchaseOrders.map((po) =>
            po.id !== deleteTarget.poId ? po : { ...po, items: po.items.filter((it) => it.id !== deleteTarget.itemId) }
          ),
        };
      });
    }
    if (await patchInvoices(invoices)) {
      toast.success("Data dihapus");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-fg">Invoice</h2>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openInvoiceCreate}>
          Tambah Invoice
        </Button>
      </div>

      {shipment.invoices.length === 0 ? (
        <Card variant="panel" padding="lg">
          <p className="text-sm text-slate-500 dark:text-fg-muted text-center">Belum ada invoice. Klik &quot;Tambah Invoice&quot; untuk mulai.</p>
        </Card>
      ) : (
        shipment.invoices.map((inv) => (
          <Card key={inv.id} variant="panel" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 dark:text-fg">{inv.invoice || "(tanpa no)"}</p>
                  <Badge variant={STATUS_BAYAR_BADGE[inv.statusPembayaranPI]}>{inv.statusPembayaranPI}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-fg-muted">
                  Nilai Billing: <span className="font-semibold">{formatRupiah(inv.nilaiBilling)}</span>
                  {inv.dueDatePI && <> · Jatuh tempo PI: {inv.dueDatePI}</>}
                </p>
                {inv.documentUrl && (
                  <a href={inv.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-[var(--accent-primary)] hover:underline">
                    <FileText className="w-3.5 h-3.5" /> Scan Invoice <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Dropdown
                trigger={
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Invoice">
                    <Pencil className="w-4 h-4" />
                  </button>
                }
                items={[
                  { label: "Edit Invoice", icon: Pencil, onClick: () => openInvoiceEdit(inv) },
                  {
                    label: "Hapus Invoice",
                    icon: Trash2,
                    danger: true,
                    onClick: () => setDeleteTarget({ kind: "invoice", invoiceId: inv.id, label: inv.invoice || "invoice ini" }),
                  },
                ]}
              />
            </div>

            <div className="mt-4 pl-4 border-l-2 border-slate-200 dark:border-line space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Purchase Order</h3>
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openPoCreate(inv.id)}>
                  Tambah PO
                </Button>
              </div>

              {inv.purchaseOrders.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-fg-muted">Belum ada PO di invoice ini.</p>
              ) : (
                inv.purchaseOrders.map((po) => {
                  const poTotal = po.items.reduce((sum, it) => sum + it.qty * it.priceSatuan, 0);
                  return (
                    <div key={po.id} className="rounded-xl border border-slate-200/80 dark:border-line p-3.5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 dark:text-fg">{po.po || "(tanpa no)"}</p>
                          {po.documentUrl && (
                            <a href={po.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-[var(--accent-primary)] hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Scan PO <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <Dropdown
                          trigger={
                            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi PO">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          }
                          items={[
                            { label: "Edit PO", icon: Pencil, onClick: () => openPoEdit(inv.id, po) },
                            {
                              label: "Hapus PO",
                              icon: Trash2,
                              danger: true,
                              onClick: () => setDeleteTarget({ kind: "po", invoiceId: inv.id, poId: po.id, label: po.po || "PO ini" }),
                            },
                          ]}
                        />
                      </div>

                      {po.items.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-fg-muted">Belum ada item.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-surface-hover">
                              <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                                <th className="px-3 py-2">Item</th>
                                <th className="px-3 py-2">Qty</th>
                                <th className="px-3 py-2">Harga Satuan</th>
                                <th className="px-3 py-2">Subtotal</th>
                                <th className="px-3 py-2 w-16" />
                              </tr>
                            </thead>
                            <tbody>
                              {po.items.map((it) => (
                                <tr key={it.id} className="border-t border-slate-100 dark:border-line">
                                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(it.itemId)}</td>
                                  <td className="px-3 py-2">{it.qty.toLocaleString("id-ID")}</td>
                                  <td className="px-3 py-2">{formatRupiah(it.priceSatuan)}</td>
                                  <td className="px-3 py-2 font-semibold">{formatRupiah(it.qty * it.priceSatuan)}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                      <button type="button" onClick={() => openItemEdit(inv.id, po.id, it)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Edit item">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteTarget({ kind: "item", invoiceId: inv.id, poId: po.id, itemId: it.id, label: itemLabel(it.itemId) })}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-surface-hover text-red-500 cursor-pointer"
                                        aria-label="Hapus item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t border-slate-100 dark:border-line font-bold">
                                <td className="px-3 py-2" colSpan={3}>
                                  Total PO
                                </td>
                                <td className="px-3 py-2">{formatRupiah(poTotal)}</td>
                                <td />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      <Button variant="ghost" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openItemCreate(inv.id, po.id)}>
                        Tambah Item
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        ))
      )}

      <Modal
        isOpen={invoiceModal !== null}
        onClose={() => setInvoiceModal(null)}
        title={invoiceModal?.mode === "create" ? "Tambah Invoice" : "Edit Invoice"}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setInvoiceModal(null)}>
              Batal
            </Button>
            <Button variant="primary" isLoading={saving} onClick={saveInvoice}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Invoice" value={invoiceForm.invoice} onChange={(e) => setInvoiceForm((f) => ({ ...f, invoice: e.target.value }))} />
          <CurrencyInput label="Nilai Billing" value={invoiceForm.nilaiBilling} onChange={(v) => setInvoiceForm((f) => ({ ...f, nilaiBilling: v }))} />
          <Select
            label="Status Pembayaran PI"
            options={STATUS_PEMBAYARAN.map((s) => ({ value: s, label: s }))}
            value={invoiceForm.statusPembayaranPI}
            onChange={(v) => setInvoiceForm((f) => ({ ...f, statusPembayaranPI: v as StatusPembayaran }))}
            searchable={false}
          />
          <DatePicker label="Jatuh Tempo Pembayaran PI" value={invoiceForm.dueDatePI} onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDatePI: e.target.value }))} />
          <DocumentUploadField label="Scan Invoice" value={invoiceForm.documentUrl} onChange={(url) => setInvoiceForm((f) => ({ ...f, documentUrl: url }))} />
        </div>
      </Modal>

      <Modal
        isOpen={poModal !== null}
        onClose={() => setPoModal(null)}
        title={poModal?.mode === "create" ? "Tambah PO" : "Edit PO"}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setPoModal(null)}>
              Batal
            </Button>
            <Button variant="primary" isLoading={saving} onClick={savePo}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="PO" value={poForm.po} onChange={(e) => setPoForm((f) => ({ ...f, po: e.target.value }))} />
          <DocumentUploadField label="Scan PO" value={poForm.documentUrl} onChange={(url) => setPoForm((f) => ({ ...f, documentUrl: url }))} />
        </div>
      </Modal>

      <Modal
        isOpen={itemModal !== null}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === "create" ? "Tambah Item" : "Edit Item"}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setItemModal(null)}>
              Batal
            </Button>
            <Button variant="primary" isLoading={saving} onClick={saveItem}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select label="Item" options={itemOptions} value={itemForm.itemId} onChange={(v) => setItemForm((f) => ({ ...f, itemId: v }))} placeholder="Pilih item" />
          <Input type="number" label="Qty" value={itemForm.qty} onChange={(e) => setItemForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
          <CurrencyInput label="Harga Satuan" value={itemForm.priceSatuan} onChange={(v) => setItemForm((f) => ({ ...f, priceSatuan: v }))} />
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
            <Button variant="danger" isLoading={saving} onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-fg-muted font-medium">
          {deleteTarget?.label} akan dihapus permanen{deleteTarget?.kind !== "item" ? " beserta isinya di bawahnya" : ""}.
        </p>
      </Modal>
    </div>
  );
};
