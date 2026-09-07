"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus, ListTree, FileDown } from "lucide-react";
import {
  FilterableTable,
  type FilterableColumn,
  Badge,
  Button,
  Dropdown,
  Modal,
  Input,
  Select,
  CurrencyInput,
  DatePicker,
  useToast,
} from "@/components/ui";
import { calcGapDays } from "@/lib/gap";
import { shipmentTotalValue } from "@/lib/shipment-helpers";
import { exportToCsv } from "@/lib/export-csv";
import { DocumentUploadField } from "./DocumentUploadField";
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

export interface ShipmentItemRow {
  id: string;
  itemId: string | null;
  qty: number;
  priceSatuan: number;
}

export interface ShipmentPoRow {
  id: string;
  po: string;
  documentUrl: string | null;
  items: ShipmentItemRow[];
}

export interface ShipmentInvoiceRow {
  id: string;
  invoice: string;
  nilaiBilling: number;
  statusPembayaranPI: StatusPembayaran;
  dueDatePI: string | null;
  documentUrl: string | null;
  purchaseOrders: ShipmentPoRow[];
}

/** Baris di tabel "Input Shipment/Import" ini cuma bagian header (1 shipment). Isi
 *  Invoice > PO > Item dikelola di halaman detail (/transaksi/shipment/[id]) supaya
 *  formnya tidak sesak — lihat ShipmentDetailView. */
export interface ShipmentRow {
  id: string;
  shipmentName: string;
  brandId: string | null;
  countryId: string | null;
  pib: string;
  pibDocumentUrl: string | null;
  airSea: AirSea;
  warehouseId: string | null;
  statusBarang: StatusBarang;
  tanggalPickup: string | null;
  etd: string | null;
  eta: string | null;
  etaGudang: string | null;
  forwarderId: string | null;
  statusPembayaranFO: StatusPembayaran;
  nilaiForwarder: number;
  dueDateFO: string | null;
  statusShipment: StatusShipment;
  invoices: ShipmentInvoiceRow[];
}

type OptionList = { value: string; label: string }[];

interface FormState {
  shipmentName: string;
  brandId: string;
  countryId: string;
  pib: string;
  pibDocumentUrl: string | null;
  airSea: AirSea;
  warehouseId: string;
  statusBarang: StatusBarang;
  tanggalPickup: string;
  etd: string;
  eta: string;
  etaGudang: string;
  forwarderId: string;
  statusPembayaranFO: StatusPembayaran;
  nilaiForwarder: number;
  dueDateFO: string;
  statusShipment: StatusShipment;
}

const emptyForm: FormState = {
  shipmentName: "",
  brandId: "",
  countryId: "",
  pib: "",
  pibDocumentUrl: null,
  airSea: "AIR",
  warehouseId: "",
  statusBarang: "BELUM DATANG",
  tanggalPickup: "",
  etd: "",
  eta: "",
  etaGudang: "",
  forwarderId: "",
  statusPembayaranFO: "BELUM DIBAYAR",
  nilaiForwarder: 0,
  dueDateFO: "",
  statusShipment: "PENDING INVOICE FW",
};

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

const STATUS_BARANG_BADGE: Record<StatusBarang, "warning" | "info" | "success"> = {
  "BELUM DATANG": "warning",
  "ON GOING": "info",
  "BARANG SUDAH DATANG": "success",
};

const STATUS_BAYAR_BADGE: Record<StatusPembayaran, "warning" | "success"> = {
  "BELUM DIBAYAR": "warning",
  "SUDAH DIBAYAR": "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function gapLabel(days: number | null) {
  return days === null ? "-" : `${days} hari`;
}

export const ShipmentTable: React.FC<{
  rows: ShipmentRow[];
  brandOptions: OptionList;
  countryOptions: OptionList;
  warehouseOptions: OptionList;
  forwarderOptions: OptionList;
  itemOptions: OptionList;
}> = ({ rows, brandOptions, countryOptions, warehouseOptions, forwarderOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: ShipmentRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShipmentRow | ShipmentRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: "create" });
  };

  const openEdit = (r: ShipmentRow) => {
    setForm({
      shipmentName: r.shipmentName,
      brandId: r.brandId ?? "",
      countryId: r.countryId ?? "",
      pib: r.pib,
      pibDocumentUrl: r.pibDocumentUrl,
      airSea: r.airSea,
      warehouseId: r.warehouseId ?? "",
      statusBarang: r.statusBarang,
      tanggalPickup: r.tanggalPickup ?? "",
      etd: r.etd ?? "",
      eta: r.eta ?? "",
      etaGudang: r.etaGudang ?? "",
      forwarderId: r.forwarderId ?? "",
      statusPembayaranFO: r.statusPembayaranFO,
      nilaiForwarder: r.nilaiForwarder,
      dueDateFO: r.dueDateFO ?? "",
      statusShipment: r.statusShipment,
    });
    setFormModal({ mode: "edit", record: r });
  };

  const submitForm = async () => {
    if (!form.shipmentName.trim()) {
      toast.error("Nama Shipment wajib diisi");
      return;
    }

    // Form ini cuma nyunting field header. Invoice/PO/Item yang sudah ada (kalau mode edit)
    // wajib disertakan lagi di body PATCH, kalau tidak akan ke-reset kosong oleh sanitizer.
    const body = { ...form, invoices: formModal?.mode === "edit" ? formModal.record?.invoices ?? [] : [] };

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/transaksi/shipments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`/api/transaksi/shipments/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan shipment");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Shipment ditambahkan" : "Shipment diperbarui");
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/transaksi/shipments/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : "Shipment dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const exportRekap = () => {
    const exportRows = rows.flatMap((r) =>
      r.invoices.flatMap((inv) =>
        inv.purchaseOrders.flatMap((po) =>
          po.items.map((it) => ({
            Shipment: r.shipmentName,
            Brand: labelOf(brandOptions, r.brandId),
            Negara: labelOf(countryOptions, r.countryId),
            Invoice: inv.invoice,
            PO: po.po,
            Item: itemLabel(it.itemId),
            Qty: it.qty,
            "Harga Satuan": it.priceSatuan,
            "Total Price": it.qty * it.priceSatuan,
            "AIR/SEA": r.airSea,
            PIB: r.pib,
            "Status Barang": r.statusBarang,
            "Tgl Pickup": r.tanggalPickup,
            ETD: r.etd,
            "ETA Pelabuhan": r.eta,
            "ETA Gudang": r.etaGudang,
            "Status Bayar PI": inv.statusPembayaranPI,
            Forwarder: labelOf(forwarderOptions, r.forwarderId),
            "Status Bayar FO": r.statusPembayaranFO,
            "Nilai Forwarder": r.nilaiForwarder,
            "Status Shipment": r.statusShipment,
          }))
        )
      )
    );
    if (exportRows.length === 0) {
      toast.error("Belum ada data item untuk diekspor");
      return;
    }
    exportToCsv(`rekap-shipment-${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
  };

  const columns: FilterableColumn<ShipmentRow>[] = [
    { key: "shipmentName", header: "Shipment", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.shipmentName}</span>, filterValue: (r) => r.shipmentName },
    { key: "brand", header: "Brand", cell: (r) => labelOf(brandOptions, r.brandId), filterValue: (r) => labelOf(brandOptions, r.brandId), filterOptions: brandOptions },
    { key: "invoiceCount", header: "Invoice", cell: (r) => `${r.invoices.length} invoice` },
    { key: "total", header: "Total Nilai Barang", cell: (r) => formatRupiah(shipmentTotalValue(r)) },
    { key: "airSea", header: "AIR/SEA", cell: (r) => <Badge variant="secondary">{r.airSea}</Badge>, filterOptions: toOptions(AIR_SEA), filterValue: (r) => r.airSea },
    {
      key: "statusBarang",
      header: "Status Barang",
      cell: (r) => <Badge variant={STATUS_BARANG_BADGE[r.statusBarang]}>{r.statusBarang}</Badge>,
      filterOptions: toOptions(STATUS_BARANG),
      filterValue: (r) => r.statusBarang,
    },
    { key: "eta", header: "ETA Pelabuhan", cell: (r) => r.eta || "-" },
    { key: "etaGudang", header: "ETA Gudang", cell: (r) => r.etaGudang || "-" },
    { key: "forwarder", header: "Forwarder", cell: (r) => labelOf(forwarderOptions, r.forwarderId), filterValue: (r) => labelOf(forwarderOptions, r.forwarderId) },
    {
      key: "statusFO",
      header: "Bayar FO",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.statusPembayaranFO]}>{r.statusPembayaranFO}</Badge>,
      filterOptions: toOptions(STATUS_PEMBAYARAN),
      filterValue: (r) => r.statusPembayaranFO,
    },
    {
      key: "statusShipment",
      header: "Status Shipment",
      cell: (r) => <Badge variant="info">{r.statusShipment}</Badge>,
      filterOptions: toOptions(STATUS_SHIPMENT),
      filterValue: (r) => r.statusShipment,
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
            { label: "Kelola Invoice/PO/Item", icon: ListTree, onClick: () => router.push(`/transaksi/shipment/${r.id}`) },
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
          Tambah Shipment
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari shipment, no invoice..."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteTarget(rows.filter((r) => keys.has(r.id)))}>
            Hapus Terpilih
          </Button>
        )}
        renderExpandableRow={(r) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Negara Asal</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{labelOf(countryOptions, r.countryId)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">PIB</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.pib || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Gudang</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{labelOf(warehouseOptions, r.warehouseId)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Tgl Pickup</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.tanggalPickup || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">ETD</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{r.etd || "-"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Nilai Forwarder</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{formatRupiah(r.nilaiForwarder)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Gap Indo Vendor (ETA Pelabuhan → ETA Gudang)</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{gapLabel(calcGapDays(r.eta, r.etaGudang))}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-fg-muted">Gap ETD → ETA Gudang</span>
                <p className="font-semibold text-slate-800 dark:text-fg">{gapLabel(calcGapDays(r.etd, r.etaGudang))}</p>
              </div>
            </div>

            <div>
              <span className="text-sm text-slate-500 dark:text-fg-muted">Invoice</span>
              {r.invoices.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-fg-muted mt-1">Belum ada invoice — kelola lewat &quot;Kelola Invoice/PO/Item&quot;.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {r.invoices.map((inv) => (
                    <Badge key={inv.id} variant={STATUS_BAYAR_BADGE[inv.statusPembayaranPI]}>
                      {inv.invoice || "(tanpa no)"} · {inv.purchaseOrders.length} PO
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Shipment" : "Edit Header Shipment"}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setFormModal(null)}>
              Batal
            </Button>
            <Button variant="primary" isLoading={submitting} onClick={submitForm}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formModal?.mode === "create" && (
            <p className="text-xs font-medium text-slate-500 dark:text-fg-muted bg-slate-50 dark:bg-surface-hover rounded-xl px-3 py-2">
              Isi info dasar dulu — sisanya (PIB, Gudang, tanggal, Forwarder, dst) biasanya belum diketahui di awal, bisa diisi belakangan lewat &quot;Edit Header&quot; begitu datanya ada. Invoice, PO, dan Item diisi di halaman berikutnya setelah shipment ini dibuat.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nama Shipment" value={form.shipmentName} onChange={(e) => setForm((f) => ({ ...f, shipmentName: e.target.value }))} />
            </div>
            <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(v) => setForm((f) => ({ ...f, brandId: v }))} placeholder="Pilih brand" />
            <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
            <Select label="AIR/SEA" options={toOptions(AIR_SEA)} value={form.airSea} onChange={(v) => setForm((f) => ({ ...f, airSea: v as AirSea }))} searchable={false} />
          </div>

          {formModal?.mode === "edit" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 dark:border-line">
                <div className="sm:col-span-2 -mb-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-fg-muted uppercase tracking-wide pt-3">Isi belakangan, begitu datanya ada</p>
                </div>
                <Input label="PIB" value={form.pib} onChange={(e) => setForm((f) => ({ ...f, pib: e.target.value }))} />
                <Select label="Gudang" options={warehouseOptions} value={form.warehouseId} onChange={(v) => setForm((f) => ({ ...f, warehouseId: v }))} placeholder="Pilih gudang" />
                <Select
                  label="Status Barang"
                  options={toOptions(STATUS_BARANG)}
                  value={form.statusBarang}
                  onChange={(v) => setForm((f) => ({ ...f, statusBarang: v as StatusBarang }))}
                  searchable={false}
                />
                <DatePicker label="Tgl Pickup (Vendor)" value={form.tanggalPickup} onChange={(e) => setForm((f) => ({ ...f, tanggalPickup: e.target.value }))} />
                <DatePicker label="ETD (Keberangkatan)" value={form.etd} onChange={(e) => setForm((f) => ({ ...f, etd: e.target.value }))} />
                <DatePicker label="ETA (Sampai Pelabuhan Indonesia)" value={form.eta} onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))} />
                <DatePicker label="ETA Gudang (Sampai Gudang PT)" value={form.etaGudang} onChange={(e) => setForm((f) => ({ ...f, etaGudang: e.target.value }))} />
                <Select label="Forwarder" options={forwarderOptions} value={form.forwarderId} onChange={(v) => setForm((f) => ({ ...f, forwarderId: v }))} placeholder="Pilih forwarder" />
                <Select
                  label="Status Pembayaran FO"
                  options={toOptions(STATUS_PEMBAYARAN)}
                  value={form.statusPembayaranFO}
                  onChange={(v) => setForm((f) => ({ ...f, statusPembayaranFO: v as StatusPembayaran }))}
                  searchable={false}
                />
                <CurrencyInput label="Nilai Forwarder" value={form.nilaiForwarder} onChange={(v) => setForm((f) => ({ ...f, nilaiForwarder: v }))} />
                <DatePicker label="Jatuh Tempo Pembayaran FO" value={form.dueDateFO} onChange={(e) => setForm((f) => ({ ...f, dueDateFO: e.target.value }))} />
                <Select
                  label="Status Shipment"
                  options={toOptions(STATUS_SHIPMENT)}
                  value={form.statusShipment}
                  onChange={(v) => setForm((f) => ({ ...f, statusShipment: v as StatusShipment }))}
                  searchable={false}
                />
              </div>
              <DocumentUploadField label="Scan PIB" value={form.pibDocumentUrl} onChange={(url) => setForm((f) => ({ ...f, pibDocumentUrl: url }))} />
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
