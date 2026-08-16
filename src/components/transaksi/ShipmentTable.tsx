"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
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

export interface ShipmentRow {
  id: string;
  shipmentName: string;
  brandId: string | null;
  countryId: string | null;
  noInvoice: string;
  noPO: string;
  itemId: string | null;
  qty: number;
  priceSatuan: number;
  noPIB: string;
  airSea: AirSea;
  warehouseId: string | null;
  statusBarang: StatusBarang;
  tanggalKedatangan: string | null;
  statusPembayaranPI: StatusPembayaran;
  nilaiBilling: number;
  dueDatePI: string | null;
  forwarderId: string | null;
  statusPembayaranFO: StatusPembayaran;
  nilaiForwarder: number;
  dueDateFO: string | null;
  statusShipment: StatusShipment;
}

type OptionList = { value: string; label: string }[];

interface FormState {
  shipmentName: string;
  brandId: string;
  countryId: string;
  noInvoice: string;
  noPO: string;
  itemId: string;
  qty: number;
  priceSatuan: number;
  noPIB: string;
  airSea: AirSea;
  warehouseId: string;
  statusBarang: StatusBarang;
  tanggalKedatangan: string;
  statusPembayaranPI: StatusPembayaran;
  nilaiBilling: number;
  dueDatePI: string;
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
  noInvoice: "",
  noPO: "",
  itemId: "",
  qty: 0,
  priceSatuan: 0,
  noPIB: "",
  airSea: "AIR",
  warehouseId: "",
  statusBarang: "BELUM DATANG",
  tanggalKedatangan: "",
  statusPembayaranPI: "BELUM DIBAYAR",
  nilaiBilling: 0,
  dueDatePI: "",
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

export const ShipmentTable: React.FC<{
  rows: ShipmentRow[];
  brandOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
  warehouseOptions: OptionList;
  forwarderOptions: OptionList;
}> = ({ rows, brandOptions, countryOptions, itemOptions, warehouseOptions, forwarderOptions }) => {
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
      noInvoice: r.noInvoice,
      noPO: r.noPO,
      itemId: r.itemId ?? "",
      qty: r.qty,
      priceSatuan: r.priceSatuan,
      noPIB: r.noPIB,
      airSea: r.airSea,
      warehouseId: r.warehouseId ?? "",
      statusBarang: r.statusBarang,
      tanggalKedatangan: r.tanggalKedatangan ?? "",
      statusPembayaranPI: r.statusPembayaranPI,
      nilaiBilling: r.nilaiBilling,
      dueDatePI: r.dueDatePI ?? "",
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

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/transaksi/shipments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            })
          : await fetch(`/api/transaksi/shipments/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan shipment");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Shipment ditambahkan" : "Shipment diperbarui");
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

  const columns: FilterableColumn<ShipmentRow>[] = [
    { key: "shipmentName", header: "Shipment", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.shipmentName}</span>, filterValue: (r) => r.shipmentName },
    { key: "brand", header: "Brand", cell: (r) => labelOf(brandOptions, r.brandId), filterValue: (r) => labelOf(brandOptions, r.brandId), filterOptions: brandOptions },
    { key: "item", header: "Item", cell: (r) => labelOf(itemOptions, r.itemId), filterValue: (r) => labelOf(itemOptions, r.itemId) },
    { key: "qty", header: "Qty", cell: (r) => r.qty.toLocaleString("id-ID") },
    { key: "total", header: "Total Price", cell: (r) => formatRupiah(r.qty * r.priceSatuan) },
    { key: "airSea", header: "AIR/SEA", cell: (r) => <Badge variant="secondary">{r.airSea}</Badge>, filterOptions: toOptions(AIR_SEA), filterValue: (r) => r.airSea },
    {
      key: "statusBarang",
      header: "Status Barang",
      cell: (r) => <Badge variant={STATUS_BARANG_BADGE[r.statusBarang]}>{r.statusBarang}</Badge>,
      filterOptions: toOptions(STATUS_BARANG),
      filterValue: (r) => r.statusBarang,
    },
    { key: "tanggalKedatangan", header: "Tgl Kedatangan", cell: (r) => r.tanggalKedatangan || "-" },
    {
      key: "statusPI",
      header: "Bayar PI",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.statusPembayaranPI]}>{r.statusPembayaranPI}</Badge>,
      filterOptions: toOptions(STATUS_PEMBAYARAN),
      filterValue: (r) => r.statusPembayaranPI,
    },
    {
      key: "statusFO",
      header: "Bayar FO",
      cell: (r) => <Badge variant={STATUS_BAYAR_BADGE[r.statusPembayaranFO]}>{r.statusPembayaranFO}</Badge>,
      filterOptions: toOptions(STATUS_PEMBAYARAN),
      filterValue: (r) => r.statusPembayaranFO,
    },
    { key: "forwarder", header: "Forwarder", cell: (r) => labelOf(forwarderOptions, r.forwarderId), filterValue: (r) => labelOf(forwarderOptions, r.forwarderId) },
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Negara Asal</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{labelOf(countryOptions, r.countryId)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">No Invoice</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.noInvoice || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">No PO</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.noPO || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">No PIB</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.noPIB || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Gudang</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{labelOf(warehouseOptions, r.warehouseId)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Price Satuan</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{formatRupiah(r.priceSatuan)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Nilai Billing</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{formatRupiah(r.nilaiBilling)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Nilai Forwarder</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{formatRupiah(r.nilaiForwarder)}</p>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Shipment" : "Edit Shipment"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nama Shipment" value={form.shipmentName} onChange={(e) => setForm((f) => ({ ...f, shipmentName: e.target.value }))} />
          </div>
          <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(v) => setForm((f) => ({ ...f, brandId: v }))} placeholder="Pilih brand" />
          <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
          <Input label="No Invoice" value={form.noInvoice} onChange={(e) => setForm((f) => ({ ...f, noInvoice: e.target.value }))} />
          <Input label="No PO" value={form.noPO} onChange={(e) => setForm((f) => ({ ...f, noPO: e.target.value }))} />
          <Select label="Item" options={itemOptions} value={form.itemId} onChange={(v) => setForm((f) => ({ ...f, itemId: v }))} placeholder="Pilih item" />
          <Input label="No PIB" value={form.noPIB} onChange={(e) => setForm((f) => ({ ...f, noPIB: e.target.value }))} />
          <Input type="number" label="Qty" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
          <CurrencyInput label="Price Satuan" value={form.priceSatuan} onChange={(v) => setForm((f) => ({ ...f, priceSatuan: v }))} />
          <Select label="AIR/SEA" options={toOptions(AIR_SEA)} value={form.airSea} onChange={(v) => setForm((f) => ({ ...f, airSea: v as AirSea }))} searchable={false} />
          <Select label="Gudang" options={warehouseOptions} value={form.warehouseId} onChange={(v) => setForm((f) => ({ ...f, warehouseId: v }))} placeholder="Pilih gudang" />
          <Select
            label="Status Barang"
            options={toOptions(STATUS_BARANG)}
            value={form.statusBarang}
            onChange={(v) => setForm((f) => ({ ...f, statusBarang: v as StatusBarang }))}
            searchable={false}
          />
          <DatePicker label="Tanggal Kedatangan" value={form.tanggalKedatangan} onChange={(e) => setForm((f) => ({ ...f, tanggalKedatangan: e.target.value }))} />
          <Select
            label="Status Pembayaran PI"
            options={toOptions(STATUS_PEMBAYARAN)}
            value={form.statusPembayaranPI}
            onChange={(v) => setForm((f) => ({ ...f, statusPembayaranPI: v as StatusPembayaran }))}
            searchable={false}
          />
          <CurrencyInput label="Nilai Billing" value={form.nilaiBilling} onChange={(v) => setForm((f) => ({ ...f, nilaiBilling: v }))} />
          <Select label="Forwarder" options={forwarderOptions} value={form.forwarderId} onChange={(v) => setForm((f) => ({ ...f, forwarderId: v }))} placeholder="Pilih forwarder" />
          <Select
            label="Status Pembayaran FO"
            options={toOptions(STATUS_PEMBAYARAN)}
            value={form.statusPembayaranFO}
            onChange={(v) => setForm((f) => ({ ...f, statusPembayaranFO: v as StatusPembayaran }))}
            searchable={false}
          />
          <CurrencyInput label="Nilai Forwarder" value={form.nilaiForwarder} onChange={(v) => setForm((f) => ({ ...f, nilaiForwarder: v }))} />
          <Select
            label="Status Shipment"
            options={toOptions(STATUS_SHIPMENT)}
            value={form.statusShipment}
            onChange={(v) => setForm((f) => ({ ...f, statusShipment: v as StatusShipment }))}
            searchable={false}
          />
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
