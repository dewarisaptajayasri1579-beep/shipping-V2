"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, useToast } from "@/components/ui";

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
  documentUrl: string | null;
  items: PoItemRow[];
  status: "DRAFT" | "OPEN" | "PARTIALLY INVOICED" | "FULLY INVOICED";
}

type OptionList = { value: string; label: string }[];

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
}> = ({ rows, supplierOptions, brandOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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
            { label: "Edit", icon: Pencil, onClick: () => router.push(`/purchase/orders/${r.id}`) },
            { label: "Hapus", icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push("/purchase/orders/new")}>
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
