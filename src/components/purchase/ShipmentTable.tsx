"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, useToast } from "@/components/ui";

export interface InvoiceItemForShipment {
  id: string; // invoiceItemId
  itemId: string | null;
  qty: number;
  unitPrice: number;
  /** Qty invoice item ini yang sudah kepakai di shipment lain (global). */
  alreadyShipped: number;
}

export interface InvoiceForShipment {
  id: string;
  invoiceNumber: string;
  items: InvoiceItemForShipment[];
}

export interface ShipmentItemRow {
  id: string;
  invoiceItemId: string;
  qtyShipped: number;
  qtyReceived: number | null;
}

export type ShipmentStatus =
  | "WAITING PICKUP"
  | "WAITING DEPARTURE"
  | "IN TRANSIT"
  | "CUSTOMS PROCESS"
  | "DELIVERY TO WAREHOUSE"
  | "PENDING FORWARDER PAYMENT"
  | "DONE";

export type StatusPembayaran = "BELUM DIBAYAR" | "SUDAH DIBAYAR";
export type ForwarderDocStatus = "BELUM ADA INVOICE" | "INVOICE DITERIMA" | "DOKUMEN KE FINANCE" | "WAITING PAYMENT" | "PAID";

export interface ShipmentRow {
  id: string;
  shipmentNo: string;
  shipmentDate: string | null;
  originCountryId: string | null;
  mode: "AIR" | "SEA";
  forwarderId: string | null;
  destinationWarehouseId: string | null;
  originPort: string | null;
  destinationPort: string | null;
  notes: string | null;
  isDraft: boolean;
  plannedPickupDate: string | null;
  actualPickupDate: string | null;
  etd: string | null;
  atd: string | null;
  eta: string | null;
  ata: string | null;
  customsReleaseDate: string | null;
  warehouseReceiptDate: string | null;
  actualWarehouseId: string | null;
  receivedBy: string | null;
  receivingNotes: string | null;
  receivingDocumentUrl: string | null;
  pib: string | null;
  nopen: string | null;
  pibDate: string | null;
  notul: boolean;
  notulNotes: string | null;
  customsBillingValue: number;
  customsBillingDate: string | null;
  customsPaymentStatus: StatusPembayaran;
  customsPaymentDate: string | null;
  customsDocumentUrl: string | null;
  forwarderInvoiceNumber: string | null;
  forwarderInvoiceDate: string | null;
  forwarderBillingValue: number;
  forwarderDocStatus: ForwarderDocStatus;
  forwarderDocDate: string | null;
  forwarderPaymentStatus: StatusPembayaran;
  forwarderPaymentDate: string | null;
  forwarderDocumentUrl: string | null;
  items: ShipmentItemRow[];
  status: ShipmentStatus;
  /** KPI paling penting (spec §12) — Warehouse Receipt Date - ATA, dihitung server-side. */
  arrivalToWarehouseGapDays: number | null;
}

type OptionList = { value: string; label: string }[];

const STATUS_BADGE: Record<ShipmentStatus, "warning" | "info" | "success"> = {
  "WAITING PICKUP": "warning",
  "WAITING DEPARTURE": "warning",
  "IN TRANSIT": "info",
  "CUSTOMS PROCESS": "info",
  "DELIVERY TO WAREHOUSE": "info",
  "PENDING FORWARDER PAYMENT": "warning",
  DONE: "success",
};

const STATUS_BAYAR_BADGE: Record<StatusPembayaran, "warning" | "success"> = {
  "BELUM DIBAYAR": "warning",
  "SUDAH DIBAYAR": "success",
};

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

export const ShipmentTable: React.FC<{
  rows: ShipmentRow[];
  invoices: InvoiceForShipment[];
  countryOptions: OptionList;
  forwarderOptions: OptionList;
  warehouseOptions: OptionList;
  itemOptions: OptionList;
}> = ({ rows, invoices, countryOptions, forwarderOptions, warehouseOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [deleteTarget, setDeleteTarget] = useState<ShipmentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/purchase/shipments/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus shipment");
        return;
      }
      toast.success("Shipment dihapus");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<ShipmentRow>[] = [
    { key: "shipmentNo", header: "Shipment No", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.shipmentNo}</span>, filterValue: (r) => r.shipmentNo },
    { key: "origin", header: "Origin", cell: (r) => labelOf(countryOptions, r.originCountryId) },
    { key: "mode", header: "Mode", cell: (r) => <Badge variant="secondary">{r.mode}</Badge>, filterOptions: toOptions(["AIR", "SEA"]), filterValue: (r) => r.mode },
    { key: "forwarder", header: "Forwarder", cell: (r) => labelOf(forwarderOptions, r.forwarderId) },
    { key: "warehouse", header: "Gudang Tujuan", cell: (r) => labelOf(warehouseOptions, r.destinationWarehouseId) },
    { key: "etd", header: "ETD", cell: (r) => r.etd || "-" },
    { key: "eta", header: "ETA", cell: (r) => r.eta || "-" },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          {r.isDraft && <Badge variant="secondary">DRAFT</Badge>}
          <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
        </div>
      ),
      filterOptions: toOptions(["WAITING PICKUP", "WAITING DEPARTURE", "IN TRANSIT", "CUSTOMS PROCESS", "DELIVERY TO WAREHOUSE", "PENDING FORWARDER PAYMENT", "DONE"]),
      filterValue: (r) => r.status,
    },
    {
      key: "gap",
      header: "Gap ATA→Gudang",
      cell: (r) => (r.arrivalToWarehouseGapDays === null ? "-" : <span className="font-semibold">{r.arrivalToWarehouseGapDays} hari</span>),
    },
    {
      key: "customsPayment",
      header: "Bayar PIB",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.customsPaymentStatus]}>{r.customsPaymentStatus}</Badge>,
      filterOptions: toOptions(["BELUM DIBAYAR", "SUDAH DIBAYAR"]),
      filterValue: (r) => r.customsPaymentStatus,
    },
    {
      key: "forwarderPayment",
      header: "Bayar Forwarder",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.forwarderPaymentStatus]}>{r.forwarderPaymentStatus}</Badge>,
      filterOptions: toOptions(["BELUM DIBAYAR", "SUDAH DIBAYAR"]),
      filterValue: (r) => r.forwarderPaymentStatus,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Shipment">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            { label: "Edit / Update Progress", icon: Pencil, onClick: () => router.push(`/purchase/shipments/${r.id}`) },
            { label: "Hapus", icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push("/purchase/shipments/new")}>
          Tambah Shipment
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari shipment no..."
        renderExpandableRow={(r) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Tgl Pickup</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.actualPickupDate || r.plannedPickupDate || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">ATD</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.atd || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">ATA</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.ata || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Customs Release</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.customsReleaseDate || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Warehouse Receipt</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.warehouseReceiptDate || "-"}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-surface-hover">
                  <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty Shipped</th>
                    <th className="px-3 py-2">Qty Received</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((it) => {
                    const invItem = invoices.flatMap((i) => i.items).find((x) => x.id === it.invoiceItemId);
                    return (
                      <tr key={it.id} className="border-t border-slate-100 dark:border-line">
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(invItem?.itemId ?? null)}</td>
                        <td className="px-3 py-2">{it.qtyShipped.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">{it.qtyReceived ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Shipment?"
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
