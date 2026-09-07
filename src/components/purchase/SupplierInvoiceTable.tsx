"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, useToast } from "@/components/ui";

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
  poDate: string | null;
  supplierId: string | null;
  items: PoItemForInvoice[];
  status: "DRAFT" | "OPEN" | "PARTIALLY INVOICED" | "FULLY INVOICED";
}

export interface InvoiceItemRow {
  id: string;
  purchaseOrderItemId: string;
  qty: number;
  unitPrice: number;
}

export type StatusPembayaran = "BELUM DIBAYAR" | "SUDAH DIBAYAR";

export interface SupplierInvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: string | null;
  purchaseOrderId: string;
  countryId: string | null;
  currency: string;
  notes: string | null;
  documentUrl: string | null;
  paymentStatus: StatusPembayaran;
  dueDate: string | null;
  paymentDate: string | null;
  items: InvoiceItemRow[];
  status: "DRAFT" | "READY TO SHIP" | "PARTIALLY SHIPPED" | "FULLY SHIPPED";
}

type OptionList = { value: string; label: string }[];

const STATUS_BADGE: Record<SupplierInvoiceRow["status"], "warning" | "info" | "success"> = {
  DRAFT: "warning",
  "READY TO SHIP": "info",
  "PARTIALLY SHIPPED": "info",
  "FULLY SHIPPED": "success",
};

const STATUS_BAYAR_BADGE: Record<StatusPembayaran, "warning" | "success"> = {
  "BELUM DIBAYAR": "warning",
  "SUDAH DIBAYAR": "success",
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

  const [deleteTarget, setDeleteTarget] = useState<SupplierInvoiceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      key: "paymentStatus",
      header: "Bayar Supplier (PI)",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.paymentStatus]}>{r.paymentStatus}</Badge>,
      filterOptions: ["BELUM DIBAYAR", "SUDAH DIBAYAR"].map((s) => ({ value: s, label: s })),
      filterValue: (r) => r.paymentStatus,
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
            { label: "Edit", icon: Pencil, onClick: () => router.push(`/purchase/invoices/${r.id}`) },
            { label: "Hapus", icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push("/purchase/invoices/new")}>
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
