"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { Card, Badge, Button, Dropdown, Modal, Input, Select, CurrencyInput, DatePicker, useToast } from "@/components/ui";
import { DocumentUploadField } from "./DocumentUploadField";
import { shipmentTotalValue } from "@/lib/shipment-helpers";
import {
  AIR_SEA,
  STATUS_BARANG,
  STATUS_PEMBAYARAN,
  STATUS_SHIPMENT,
  type AirSea,
  type StatusBarang,
  type StatusPembayaran,
  type StatusShipment,
} from "@/lib/data/transaksi-constants";
import type { InvoiceRow, ShipmentRow, ShipmentItemRow } from "./InvoiceTable";

type OptionList = { value: string; label: string }[];

const STATUS_BARANG_BADGE: Record<StatusBarang, "warning" | "info" | "success"> = {
  "BELUM DATANG": "warning",
  "ON GOING": "info",
  "BARANG SUDAH DATANG": "success",
};

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

const emptyShipmentForm = {
  shipmentName: "",
  po: "",
  documentUrl: null as string | null,
  pib: "",
  pibDocumentUrl: null as string | null,
  airSea: "AIR" as AirSea,
  warehouseId: "",
  statusBarang: "BELUM DATANG" as StatusBarang,
  tanggalPickup: "",
  etd: "",
  eta: "",
  etaGudang: "",
  forwarderId: "",
  statusPembayaranFO: "BELUM DIBAYAR" as StatusPembayaran,
  nilaiForwarder: 0,
  dueDateFO: "",
  statusShipment: "PENDING INVOICE FW" as StatusShipment,
};
const emptyItemForm = { itemId: "", qty: 0, priceSatuan: 0 };

/** Kelola Shipment (PO, 1 PO = 1 kali kirim) > Item milik 1 Invoice. Tiap perubahan
 *  nge-PATCH seluruh objek Invoice (bukan endpoint granular per-shipment/item) — lebih
 *  simpel karena layer data masih JSON file per invoice, bukan tabel relasional terpisah. */
export const ShipmentDetailView: React.FC<{
  invoice: InvoiceRow;
  itemOptions: OptionList;
  warehouseOptions: OptionList;
  forwarderOptions: OptionList;
}> = ({ invoice, itemOptions, warehouseOptions, forwarderOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [saving, setSaving] = useState(false);
  const [shipmentModal, setShipmentModal] = useState<{ mode: "create" | "edit"; shipment?: ShipmentRow } | null>(null);
  const [shipmentForm, setShipmentForm] = useState(emptyShipmentForm);
  const [itemModal, setItemModal] = useState<{ mode: "create" | "edit"; shipmentId: string; item?: ShipmentItemRow } | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "shipment" | "item"; shipmentId: string; itemId?: string; label: string } | null>(null);

  const patchShipments = async (shipments: ShipmentRow[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transaksi/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...invoice, shipments }),
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

  const openShipmentCreate = () => {
    setShipmentForm(emptyShipmentForm);
    setShipmentModal({ mode: "create" });
  };
  const openShipmentEdit = (s: ShipmentRow) => {
    setShipmentForm({
      shipmentName: s.shipmentName,
      po: s.po,
      documentUrl: s.documentUrl,
      pib: s.pib,
      pibDocumentUrl: s.pibDocumentUrl,
      airSea: s.airSea as AirSea,
      warehouseId: s.warehouseId ?? "",
      statusBarang: s.statusBarang as StatusBarang,
      tanggalPickup: s.tanggalPickup ?? "",
      etd: s.etd ?? "",
      eta: s.eta ?? "",
      etaGudang: s.etaGudang ?? "",
      forwarderId: s.forwarderId ?? "",
      statusPembayaranFO: s.statusPembayaranFO,
      nilaiForwarder: s.nilaiForwarder,
      dueDateFO: s.dueDateFO ?? "",
      statusShipment: s.statusShipment as StatusShipment,
    });
    setShipmentModal({ mode: "edit", shipment: s });
  };
  const saveShipment = async () => {
    if (!shipmentForm.po.trim()) {
      toast.error("No PO wajib diisi");
      return;
    }
    const shipments =
      shipmentModal?.mode === "create"
        ? [...invoice.shipments, { id: crypto.randomUUID(), ...shipmentForm, items: [] }]
        : invoice.shipments.map((s) => (s.id === shipmentModal?.shipment?.id ? { ...s, ...shipmentForm } : s));
    if (await patchShipments(shipments)) {
      toast.success("Shipment (PO) disimpan");
      setShipmentModal(null);
    }
  };

  const openItemCreate = (shipmentId: string) => {
    setItemForm(emptyItemForm);
    setItemModal({ mode: "create", shipmentId });
  };
  const openItemEdit = (shipmentId: string, item: ShipmentItemRow) => {
    setItemForm({ itemId: item.itemId ?? "", qty: item.qty, priceSatuan: item.priceSatuan });
    setItemModal({ mode: "edit", shipmentId, item });
  };
  const saveItem = async () => {
    if (!itemForm.itemId) {
      toast.error("Item wajib dipilih");
      return;
    }
    const shipments = invoice.shipments.map((s) => {
      if (s.id !== itemModal?.shipmentId) return s;
      const items =
        itemModal.mode === "create"
          ? [...s.items, { id: crypto.randomUUID(), ...itemForm }]
          : s.items.map((it) => (it.id === itemModal.item?.id ? { ...it, ...itemForm } : it));
      return { ...s, items };
    });
    if (await patchShipments(shipments)) {
      toast.success("Item disimpan");
      setItemModal(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const shipments =
      deleteTarget.kind === "shipment"
        ? invoice.shipments.filter((s) => s.id !== deleteTarget.shipmentId)
        : invoice.shipments.map((s) => (s.id !== deleteTarget.shipmentId ? s : { ...s, items: s.items.filter((it) => it.id !== deleteTarget.itemId) }));
    if (await patchShipments(shipments)) {
      toast.success("Data dihapus");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-fg">Shipment (PO) — 1 PO = 1 kali kirim</h2>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openShipmentCreate}>
          Tambah Shipment
        </Button>
      </div>

      {invoice.shipments.length === 0 ? (
        <Card variant="panel" padding="lg">
          <p className="text-sm text-slate-500 dark:text-fg-muted text-center">Belum ada shipment. Klik &quot;Tambah Shipment&quot; untuk mulai.</p>
        </Card>
      ) : (
        invoice.shipments.map((s) => (
          <Card key={s.id} variant="panel" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800 dark:text-fg">{s.shipmentName || s.po || "(shipment baru)"}</p>
                  <Badge variant={STATUS_BARANG_BADGE[s.statusBarang as StatusBarang]}>{s.statusBarang}</Badge>
                  <Badge variant="secondary">{s.airSea}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-fg-muted">
                  PO: <span className="font-semibold">{s.po || "-"}</span> · PIB: <span className="font-semibold">{s.pib || "-"}</span> · Gudang:{" "}
                  <span className="font-semibold">{labelOf(warehouseOptions, s.warehouseId)}</span> · Forwarder:{" "}
                  <span className="font-semibold">{labelOf(forwarderOptions, s.forwarderId)}</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-fg-muted">
                  Tgl Pickup: {s.tanggalPickup || "-"} · ETD: {s.etd || "-"} · ETA: {s.eta || "-"} · ETA Gudang: {s.etaGudang || "-"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {s.documentUrl && (
                    <a href={s.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-[var(--accent-primary)] hover:underline">
                      <FileText className="w-3.5 h-3.5" /> Scan PO <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {s.pibDocumentUrl && (
                    <a href={s.pibDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-[var(--accent-primary)] hover:underline">
                      <FileText className="w-3.5 h-3.5" /> Scan PIB <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <Dropdown
                trigger={
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Shipment">
                    <Pencil className="w-4 h-4" />
                  </button>
                }
                items={[
                  { label: "Edit Shipment", icon: Pencil, onClick: () => openShipmentEdit(s) },
                  {
                    label: "Hapus Shipment",
                    icon: Trash2,
                    danger: true,
                    onClick: () => setDeleteTarget({ kind: "shipment", shipmentId: s.id, label: s.shipmentName || s.po || "shipment ini" }),
                  },
                ]}
              />
            </div>

            <div className="mt-4 pl-4 border-l-2 border-slate-200 dark:border-line space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Item</h3>
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openItemCreate(s.id)}>
                  Tambah Item
                </Button>
              </div>

              {s.items.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-fg-muted">Belum ada item.</p>
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
                      {s.items.map((it) => (
                        <tr key={it.id} className="border-t border-slate-100 dark:border-line">
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(it.itemId)}</td>
                          <td className="px-3 py-2">{it.qty.toLocaleString("id-ID")}</td>
                          <td className="px-3 py-2">{formatRupiah(it.priceSatuan)}</td>
                          <td className="px-3 py-2 font-semibold">{formatRupiah(it.qty * it.priceSatuan)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => openItemEdit(s.id, it)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Edit item">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ kind: "item", shipmentId: s.id, itemId: it.id, label: itemLabel(it.itemId) })}
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
                          Total Shipment
                        </td>
                        <td className="px-3 py-2">{formatRupiah(shipmentTotalValue(s))}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        ))
      )}

      <Modal
        isOpen={shipmentModal !== null}
        onClose={() => setShipmentModal(null)}
        title={shipmentModal?.mode === "create" ? "Tambah Shipment" : "Edit Shipment"}
        size="lg"
        footer={
          <div className="flex flex-row-reverse items-center justify-start gap-3 w-full">
            <Button variant="primary" isLoading={saving} onClick={saveShipment}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setShipmentModal(null)}>
              Batal
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nama Shipment (label bebas)" value={shipmentForm.shipmentName} onChange={(e) => setShipmentForm((f) => ({ ...f, shipmentName: e.target.value }))} />
          </div>
          <Input label="PO" value={shipmentForm.po} onChange={(e) => setShipmentForm((f) => ({ ...f, po: e.target.value }))} />
          <Select label="AIR/SEA" options={toOptions(AIR_SEA)} value={shipmentForm.airSea} onChange={(v) => setShipmentForm((f) => ({ ...f, airSea: v as AirSea }))} searchable={false} />
          <Input label="PIB" value={shipmentForm.pib} onChange={(e) => setShipmentForm((f) => ({ ...f, pib: e.target.value }))} />
          <Select label="Gudang" options={warehouseOptions} value={shipmentForm.warehouseId} onChange={(v) => setShipmentForm((f) => ({ ...f, warehouseId: v }))} placeholder="Pilih gudang" />
          <Select
            label="Status Barang"
            options={toOptions(STATUS_BARANG)}
            value={shipmentForm.statusBarang}
            onChange={(v) => setShipmentForm((f) => ({ ...f, statusBarang: v as StatusBarang }))}
            searchable={false}
          />
          <Select
            label="Status Shipment"
            options={toOptions(STATUS_SHIPMENT)}
            value={shipmentForm.statusShipment}
            onChange={(v) => setShipmentForm((f) => ({ ...f, statusShipment: v as StatusShipment }))}
            searchable={false}
          />
          <DatePicker label="Tgl Pickup (Vendor)" value={shipmentForm.tanggalPickup} onChange={(e) => setShipmentForm((f) => ({ ...f, tanggalPickup: e.target.value }))} />
          <DatePicker label="ETD (Keberangkatan)" value={shipmentForm.etd} onChange={(e) => setShipmentForm((f) => ({ ...f, etd: e.target.value }))} />
          <DatePicker label="ETA (Sampai Pelabuhan Indonesia)" value={shipmentForm.eta} onChange={(e) => setShipmentForm((f) => ({ ...f, eta: e.target.value }))} />
          <DatePicker label="ETA Gudang (Sampai Gudang PT)" value={shipmentForm.etaGudang} onChange={(e) => setShipmentForm((f) => ({ ...f, etaGudang: e.target.value }))} />
          <Select label="Forwarder" options={forwarderOptions} value={shipmentForm.forwarderId} onChange={(v) => setShipmentForm((f) => ({ ...f, forwarderId: v }))} placeholder="Pilih forwarder" />
          <Select
            label="Status Pembayaran FO"
            options={toOptions(STATUS_PEMBAYARAN)}
            value={shipmentForm.statusPembayaranFO}
            onChange={(v) => setShipmentForm((f) => ({ ...f, statusPembayaranFO: v as StatusPembayaran }))}
            searchable={false}
          />
          <CurrencyInput label="Nilai Forwarder" value={shipmentForm.nilaiForwarder} onChange={(v) => setShipmentForm((f) => ({ ...f, nilaiForwarder: v }))} />
          <DatePicker label="Jatuh Tempo Pembayaran FO" value={shipmentForm.dueDateFO} onChange={(e) => setShipmentForm((f) => ({ ...f, dueDateFO: e.target.value }))} />
          <div className="sm:col-span-2">
            <DocumentUploadField label="Scan PO" value={shipmentForm.documentUrl} onChange={(url) => setShipmentForm((f) => ({ ...f, documentUrl: url }))} />
          </div>
          <div className="sm:col-span-2">
            <DocumentUploadField label="Scan PIB" value={shipmentForm.pibDocumentUrl} onChange={(url) => setShipmentForm((f) => ({ ...f, pibDocumentUrl: url }))} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={itemModal !== null}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === "create" ? "Tambah Item" : "Edit Item"}
        footer={
          <div className="flex flex-row-reverse items-center justify-start gap-3 w-full">
            <Button variant="primary" isLoading={saving} onClick={saveItem}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setItemModal(null)}>
              Batal
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
