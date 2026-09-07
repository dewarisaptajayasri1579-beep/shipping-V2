"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus, ListTree, FileDown } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Dropdown, Modal, Input, Select, DatePicker, useToast } from "@/components/ui";
import { invoiceTotalValue } from "@/lib/shipment-helpers";
import { exportToCsv } from "@/lib/export-csv";
import { DocumentUploadField } from "./DocumentUploadField";
import { STATUS_PEMBAYARAN, type StatusPembayaran } from "@/lib/data/transaksi-constants";

export interface ShipmentItemRow {
  id: string;
  itemId: string | null;
  qty: number;
  priceSatuan: number;
}

/** 1 PO = 1 kali kirim, jadi info pengiriman (PIB, AIR/SEA, tanggal-tanggal, Forwarder)
 *  nempel di sini, bukan di header Invoice — lihat docs/rev.md poin 11-14. */
export interface ShipmentRow {
  id: string;
  shipmentName: string;
  po: string;
  documentUrl: string | null;
  pib: string;
  pibDocumentUrl: string | null;
  airSea: "AIR" | "SEA";
  warehouseId: string | null;
  statusBarang: "BELUM DATANG" | "ON GOING" | "BARANG SUDAH DATANG";
  tanggalPickup: string | null;
  etd: string | null;
  eta: string | null;
  etaGudang: string | null;
  forwarderId: string | null;
  statusPembayaranFO: StatusPembayaran;
  nilaiForwarder: number;
  dueDateFO: string | null;
  statusShipment: "PENDING INVOICE FW" | "PENDING PEMBAYARAN FW" | "ON GOING" | "DONE";
  items: ShipmentItemRow[];
}

/** Baris di tabel "Input Shipment/Import" ini level Invoice — 1 Invoice bisa dikirim
 *  beberapa kali (beberapa Shipment/PO). Isi Shipment/PO > Item dikelola di halaman
 *  detail (/transaksi/shipment/[id]) supaya formnya tidak sesak. */
export interface InvoiceRow {
  id: string;
  invoice: string;
  brandId: string | null;
  countryId: string | null;
  documentUrl: string | null;
  statusPembayaranPI: StatusPembayaran;
  dueDatePI: string | null;
  shipments: ShipmentRow[];
}

type OptionList = { value: string; label: string }[];

interface FormState {
  invoice: string;
  brandId: string;
  countryId: string;
  documentUrl: string | null;
  statusPembayaranPI: StatusPembayaran;
  dueDatePI: string;
}

const emptyForm: FormState = {
  invoice: "",
  brandId: "",
  countryId: "",
  documentUrl: null,
  statusPembayaranPI: "BELUM DIBAYAR",
  dueDatePI: "",
};

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

const STATUS_BAYAR_BADGE: Record<StatusPembayaran, "warning" | "success"> = {
  "BELUM DIBAYAR": "warning",
  "SUDAH DIBAYAR": "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const InvoiceTable: React.FC<{
  rows: InvoiceRow[];
  brandOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
}> = ({ rows, brandOptions, countryOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: InvoiceRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | InvoiceRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: "create" });
  };

  const openEdit = (r: InvoiceRow) => {
    setForm({
      invoice: r.invoice,
      brandId: r.brandId ?? "",
      countryId: r.countryId ?? "",
      documentUrl: r.documentUrl,
      statusPembayaranPI: r.statusPembayaranPI,
      dueDatePI: r.dueDatePI ?? "",
    });
    setFormModal({ mode: "edit", record: r });
  };

  const submitForm = async () => {
    if (!form.invoice.trim()) {
      toast.error("No Invoice wajib diisi");
      return;
    }

    // Form ini cuma nyunting field header invoice. Shipment/PO yang sudah ada (kalau mode
    // edit) wajib disertakan lagi di body PATCH, kalau tidak akan ke-reset kosong.
    const body = { ...form, shipments: formModal?.mode === "edit" ? formModal.record?.shipments ?? [] : [] };

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/transaksi/invoices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`/api/transaksi/invoices/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan invoice");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Invoice ditambahkan" : "Invoice diperbarui");
      setFormModal(null);
      if (formModal?.mode === "create" && data?.data?.id) {
        router.push(`/transaksi/shipment/${data.data.id}`);
      } else {
        router.refresh();
      }
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/transaksi/invoices/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : "Invoice dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const exportRekap = () => {
    const exportRows = rows.flatMap((r) =>
      r.shipments.flatMap((s) =>
        s.items.map((it) => ({
          Invoice: r.invoice,
          Brand: labelOf(brandOptions, r.brandId),
          Negara: labelOf(countryOptions, r.countryId),
          Shipment: s.shipmentName,
          PO: s.po,
          Item: itemLabel(it.itemId),
          Qty: it.qty,
          "Harga Satuan": it.priceSatuan,
          "Total Price": it.qty * it.priceSatuan,
          "AIR/SEA": s.airSea,
          PIB: s.pib,
          "Status Barang": s.statusBarang,
          "Tgl Pickup": s.tanggalPickup,
          ETD: s.etd,
          "ETA Pelabuhan": s.eta,
          "ETA Gudang": s.etaGudang,
          "Status Bayar PI": r.statusPembayaranPI,
          "Status Bayar FO": s.statusPembayaranFO,
          "Nilai Forwarder": s.nilaiForwarder,
          "Status Shipment": s.statusShipment,
        }))
      )
    );
    if (exportRows.length === 0) {
      toast.error("Belum ada data item untuk diekspor");
      return;
    }
    exportToCsv(`rekap-shipment-${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
  };

  const columns: FilterableColumn<InvoiceRow>[] = [
    { key: "invoice", header: "Invoice", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.invoice}</span>, filterValue: (r) => r.invoice },
    { key: "brand", header: "Brand", cell: (r) => labelOf(brandOptions, r.brandId), filterValue: (r) => labelOf(brandOptions, r.brandId), filterOptions: brandOptions },
    { key: "negara", header: "Negara Asal", cell: (r) => labelOf(countryOptions, r.countryId), filterValue: (r) => labelOf(countryOptions, r.countryId) },
    { key: "shipmentCount", header: "Jumlah Kirim", cell: (r) => `${r.shipments.length}x` },
    { key: "total", header: "Nilai Billing", cell: (r) => formatRupiah(invoiceTotalValue(r)) },
    {
      key: "statusPI",
      header: "Bayar PI",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.statusPembayaranPI]}>{r.statusPembayaranPI}</Badge>,
      filterOptions: toOptions(STATUS_PEMBAYARAN),
      filterValue: (r) => r.statusPembayaranPI,
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
            { label: "Kelola Shipment/PO/Item", icon: ListTree, onClick: () => router.push(`/transaksi/shipment/${r.id}`) },
            { label: "Edit Header", icon: Pencil, onClick: () => openEdit(r) },
            { label: "Hapus", icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" leftIcon={<FileDown className="w-4 h-4" />} onClick={exportRekap}>
          Export Rekap Excel
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Tambah Invoice
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari no invoice..."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteTarget(rows.filter((r) => keys.has(r.id)))}>
            Hapus Terpilih
          </Button>
        )}
        renderExpandableRow={(r) => (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-500 dark:text-fg-muted">Shipment (PO)</span>
              {r.shipments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-fg-muted mt-1">Belum ada shipment — kelola lewat &quot;Kelola Shipment/PO/Item&quot;.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {r.shipments.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.po || "(tanpa no)"} · {s.airSea} · {s.statusBarang}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {r.dueDatePI && (
              <p className="text-sm text-slate-500 dark:text-fg-muted">
                Jatuh Tempo PI: <span className="font-semibold text-slate-800 dark:text-fg">{r.dueDatePI}</span>
              </p>
            )}
          </div>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Invoice" : "Edit Header Invoice"}
        footer={
          <div className="flex flex-row-reverse items-center justify-start gap-3 w-full">
            {/* Simpan duluan di DOM (Tab/Enter dari field terakhir langsung ke sini),
                row-reverse cuma buat urutan visual: Batal tetap kiri, Simpan tetap kanan. */}
            <Button variant="primary" isLoading={submitting} onClick={submitForm}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setFormModal(null)}>
              Batal
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formModal?.mode === "create" && (
            <p className="text-xs font-medium text-slate-500 dark:text-fg-muted bg-slate-50 dark:bg-surface-hover rounded-xl px-3 py-2">
              Isi info dasar dulu. Shipment (PO) dan Item — 1 Invoice bisa dikirim beberapa kali — diisi di halaman berikutnya setelah invoice ini dibuat.
            </p>
          )}
          <Input label="No Invoice" value={form.invoice} onChange={(e) => setForm((f) => ({ ...f, invoice: e.target.value }))} />
          <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(v) => setForm((f) => ({ ...f, brandId: v }))} placeholder="Pilih brand" />
          <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />

          {formModal?.mode === "edit" && (
            <>
              <div className="pt-2 border-t border-slate-200/80 dark:border-line">
                <p className="text-xs font-bold text-slate-500 dark:text-fg-muted uppercase tracking-wide pt-3 pb-1">Isi belakangan, begitu datanya ada</p>
              </div>
              <Select
                label="Status Pembayaran PI"
                options={toOptions(STATUS_PEMBAYARAN)}
                value={form.statusPembayaranPI}
                onChange={(v) => setForm((f) => ({ ...f, statusPembayaranPI: v as StatusPembayaran }))}
                searchable={false}
              />
              <DatePicker label="Jatuh Tempo Pembayaran PI" value={form.dueDatePI} onChange={(e) => setForm((f) => ({ ...f, dueDatePI: e.target.value }))} />
              <DocumentUploadField label="Scan Invoice" value={form.documentUrl} onChange={(url) => setForm((f) => ({ ...f, documentUrl: url }))} />
            </>
          )}
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
