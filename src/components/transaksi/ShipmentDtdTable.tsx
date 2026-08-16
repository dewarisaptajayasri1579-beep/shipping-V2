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
import { STATUS_DTD, type StatusDtd } from "@/lib/data/transaksi-constants";
import { calcGapDays } from "@/lib/gap";

export interface ShipmentDtdRow {
  id: string;
  shipmentName: string;
  projectId: string | null;
  countryId: string | null;
  brandId: string | null;
  itemNumber: string;
  description: string;
  qty: number;
  price: number;
  kg: number | null;
  sampeAgent: string | null;
  sampeMche: string | null;
  vendorId: string | null;
  status: StatusDtd;
  cost: number;
  internalCode: string | null;
}

type OptionList = { value: string; label: string }[];

interface FormState {
  shipmentName: string;
  projectId: string;
  countryId: string;
  brandId: string;
  itemNumber: string;
  description: string;
  qty: number;
  price: number;
  kg: string;
  sampeAgent: string;
  sampeMche: string;
  vendorId: string;
  status: StatusDtd;
  cost: number;
  internalCode: string;
}

const emptyForm: FormState = {
  shipmentName: "",
  projectId: "",
  countryId: "",
  brandId: "",
  itemNumber: "",
  description: "",
  qty: 0,
  price: 0,
  kg: "",
  sampeAgent: "",
  sampeMche: "",
  vendorId: "",
  status: "ON PRODUCING",
  cost: 0,
  internalCode: "",
};

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

const STATUS_BADGE: Record<StatusDtd, "info" | "warning" | "success"> = {
  "ON PRODUCING": "info",
  "ON GOING": "warning",
  "MENUNGGU PEMBAYARAN FW": "warning",
  DONE: "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const ShipmentDtdTable: React.FC<{
  rows: ShipmentDtdRow[];
  projectOptions: OptionList;
  countryOptions: OptionList;
  brandOptions: OptionList;
  vendorOptions: OptionList;
}> = ({ rows, projectOptions, countryOptions, brandOptions, vendorOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: ShipmentDtdRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShipmentDtdRow | ShipmentDtdRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: "create" });
  };

  const openEdit = (r: ShipmentDtdRow) => {
    setForm({
      shipmentName: r.shipmentName,
      projectId: r.projectId ?? "",
      countryId: r.countryId ?? "",
      brandId: r.brandId ?? "",
      itemNumber: r.itemNumber,
      description: r.description,
      qty: r.qty,
      price: r.price,
      kg: r.kg === null ? "" : String(r.kg),
      sampeAgent: r.sampeAgent ?? "",
      sampeMche: r.sampeMche ?? "",
      vendorId: r.vendorId ?? "",
      status: r.status,
      cost: r.cost,
      internalCode: r.internalCode ?? "",
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
          ? await fetch("/api/transaksi/shipments-dtd", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            })
          : await fetch(`/api/transaksi/shipments-dtd/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan shipment DTD");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Shipment DTD ditambahkan" : "Shipment DTD diperbarui");
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/transaksi/shipments-dtd/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : "Shipment DTD dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<ShipmentDtdRow>[] = [
    { key: "shipmentName", header: "Shipment", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.shipmentName}</span>, filterValue: (r) => r.shipmentName },
    { key: "brand", header: "Brand", cell: (r) => labelOf(brandOptions, r.brandId), filterValue: (r) => labelOf(brandOptions, r.brandId), filterOptions: brandOptions },
    { key: "vendor", header: "Vendor", cell: (r) => labelOf(vendorOptions, r.vendorId), filterValue: (r) => labelOf(vendorOptions, r.vendorId), filterOptions: vendorOptions },
    { key: "sampeAgent", header: "Sampe Agent", cell: (r) => r.sampeAgent || "-" },
    { key: "sampeMche", header: "Sampe MCHE", cell: (r) => r.sampeMche || "-" },
    {
      key: "gap",
      header: "GAP (hari)",
      cell: (r) => {
        const gap = calcGapDays(r.sampeAgent, r.sampeMche);
        return gap === null ? <span className="text-slate-400 dark:text-fg-muted">-</span> : <Badge variant={gap <= 14 ? "success" : "warning"}>{gap} hari</Badge>;
      },
    },
    { key: "cost", header: "Cost", cell: (r) => formatRupiah(r.cost) },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>,
      filterOptions: toOptions(STATUS_DTD),
      filterValue: (r) => r.status,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Shipment DTD">
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
          Tambah Shipment DTD
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari shipment, item number..."
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
              <span className="text-slate-500 dark:text-fg-muted">Project</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{labelOf(projectOptions, r.projectId)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Negara Asal</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{labelOf(countryOptions, r.countryId)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Item Number</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.itemNumber || "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 dark:text-fg-muted">Deskripsi</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.description || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Kode Internal (Illuvia)</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.internalCode || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Qty</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.qty.toLocaleString("id-ID")}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Price</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{formatRupiah(r.price)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-fg-muted">Berat (KG)</span>
              <p className="font-semibold text-slate-800 dark:text-fg">{r.kg ?? "-"}</p>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Shipment DTD" : "Edit Shipment DTD"}
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
          <Select label="Project" options={projectOptions} value={form.projectId} onChange={(v) => setForm((f) => ({ ...f, projectId: v }))} placeholder="Pilih project" />
          <Select label="Negara Asal" options={countryOptions} value={form.countryId} onChange={(v) => setForm((f) => ({ ...f, countryId: v }))} placeholder="Pilih negara" />
          <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(v) => setForm((f) => ({ ...f, brandId: v }))} placeholder="Pilih brand" />
          <Select label="Vendor" options={vendorOptions} value={form.vendorId} onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))} placeholder="Pilih vendor" />
          <Input label="Item Number" value={form.itemNumber} onChange={(e) => setForm((f) => ({ ...f, itemNumber: e.target.value }))} />
          <Input label="Kode Internal (Illuvia)" value={form.internalCode} onChange={(e) => setForm((f) => ({ ...f, internalCode: e.target.value }))} />
          <div className="sm:col-span-2">
            <Input label="Deskripsi" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <Input type="number" label="Qty" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
          <CurrencyInput label="Price" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
          <Input type="number" label="Berat (KG)" value={form.kg} onChange={(e) => setForm((f) => ({ ...f, kg: e.target.value }))} />
          <CurrencyInput label="Cost" value={form.cost} onChange={(v) => setForm((f) => ({ ...f, cost: v }))} />
          <DatePicker label="Sampe Agent" value={form.sampeAgent} onChange={(e) => setForm((f) => ({ ...f, sampeAgent: e.target.value }))} />
          <DatePicker label="Sampe MCHE" value={form.sampeMche} onChange={(e) => setForm((f) => ({ ...f, sampeMche: e.target.value }))} />
          <Select label="Status" options={toOptions(STATUS_DTD)} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v as StatusDtd }))} searchable={false} />
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
