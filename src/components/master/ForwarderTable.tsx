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
import { CHARGE_TYPES, CONTAINER_SIZES, INCOTERMS, type ChargeType, type ContainerSize, type Incoterm } from "@/lib/data/master-constants";

export interface ForwarderRow {
  id: string;
  name: string;
}

export interface ForwarderRateRow {
  id: string;
  forwarderId: string;
  chargeType: ChargeType;
  containerSize: ContainerSize;
  incoterm: Incoterm;
  amount: number;
  effectiveDate: string;
}

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

const emptyRateForm = {
  chargeType: CHARGE_TYPES[0] as ChargeType,
  containerSize: CONTAINER_SIZES[0] as ContainerSize,
  incoterm: INCOTERMS[0] as Incoterm,
  amount: 0,
  effectiveDate: new Date().toISOString().slice(0, 10),
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

/** Histori rate satu forwarder — dirender inline lewat renderExpandableRow di tabel utama.
 *  Rate cuma bisa ditambah/dihapus, tidak diedit, supaya histori harga tetap utuh. */
const ForwarderRateHistory: React.FC<{ forwarderId: string; rates: ForwarderRateRow[] }> = ({ forwarderId, rates }) => {
  const router = useRouter();
  const toast = useToast();
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateForm, setRateForm] = useState(emptyRateForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForwarderRateRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const myRates = rates
    .filter((r) => r.forwarderId === forwarderId)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  const submitRate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/master/forwarder-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rateForm, forwarderId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan rate");
        return;
      }
      toast.success("Rate ditambahkan");
      setRateModalOpen(false);
      setRateForm(emptyRateForm);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/master/forwarder-rates/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus rate");
        return;
      }
      toast.success("Rate dihapus");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Histori Rate</h4>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setRateModalOpen(true)}>
          Tambah Rate
        </Button>
      </div>

      {myRates.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-fg-muted">Belum ada rate untuk forwarder ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-line">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-surface-hover">
              <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                <th className="px-3 py-2">Berlaku Sejak</th>
                <th className="px-3 py-2">Charge Type</th>
                <th className="px-3 py-2">Kontainer</th>
                <th className="px-3 py-2">Incoterm</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {myRates.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-line">
                  <td className="px-3 py-2">{r.effectiveDate}</td>
                  <td className="px-3 py-2">{r.chargeType}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary">{r.containerSize}</Badge>
                  </td>
                  <td className="px-3 py-2">{r.incoterm}</td>
                  <td className="px-3 py-2 font-bold text-slate-800 dark:text-fg">{formatRupiah(r.amount)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer"
                      aria-label="Hapus rate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title="Tambah Rate Forwarder"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setRateModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" isLoading={submitting} onClick={submitRate}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Charge Type"
            options={toOptions(CHARGE_TYPES)}
            value={rateForm.chargeType}
            onChange={(v) => setRateForm((f) => ({ ...f, chargeType: v as ChargeType }))}
            searchable={false}
          />
          <Select
            label="Ukuran Kontainer"
            options={toOptions(CONTAINER_SIZES)}
            value={rateForm.containerSize}
            onChange={(v) => setRateForm((f) => ({ ...f, containerSize: v as ContainerSize }))}
            searchable={false}
          />
          <Select
            label="Incoterm"
            options={toOptions(INCOTERMS)}
            value={rateForm.incoterm}
            onChange={(v) => setRateForm((f) => ({ ...f, incoterm: v as Incoterm }))}
            searchable={false}
          />
          <CurrencyInput label="Rate" value={rateForm.amount} onChange={(amount) => setRateForm((f) => ({ ...f, amount }))} />
          <DatePicker
            label="Berlaku Sejak"
            value={rateForm.effectiveDate}
            onChange={(e) => setRateForm((f) => ({ ...f, effectiveDate: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Rate?"
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
        <p className="text-sm text-slate-600 dark:text-fg-muted font-medium">Entri rate ini akan hilang dari histori. Data yang sudah dihapus tidak dapat dikembalikan.</p>
      </Modal>
    </div>
  );
};

export const ForwarderTable: React.FC<{ rows: ForwarderRow[]; rates: ForwarderRateRow[] }> = ({ rows, rates }) => {
  const router = useRouter();
  const toast = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; record?: ForwarderRow } | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForwarderRow | ForwarderRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setName("");
    setFormModal({ mode: "create" });
  };

  const openEdit = (record: ForwarderRow) => {
    setName(record.name);
    setFormModal({ mode: "edit", record });
  };

  const submitForm = async () => {
    if (!name.trim()) {
      toast.error("Nama Forwarder wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res =
        formModal?.mode === "create"
          ? await fetch("/api/master/forwarders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            })
          : await fetch(`/api/master/forwarders/${formModal?.record?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan Forwarder");
        return;
      }

      toast.success(formModal?.mode === "create" ? "Forwarder ditambahkan" : "Forwarder diperbarui");
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
      const results = await Promise.all(targets.map((r) => fetch(`/api/master/forwarders/${r.id}`, { method: "DELETE" })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} data gagal dihapus`);
      else toast.success(targets.length > 1 ? "Data terpilih dihapus" : "Forwarder dihapus");
      setSelected(new Set());
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeleting(false);
    }
  };

  const columns: FilterableColumn<ForwarderRow>[] = [
    { key: "name", header: "Nama Forwarder", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.name}</span>, filterValue: (r) => r.name },
    {
      key: "rateCount",
      header: "Jumlah Rate",
      cell: (r) => <Badge variant="secondary">{rates.filter((rt) => rt.forwarderId === r.id).length} rate</Badge>,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Dropdown
          trigger={
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer" aria-label="Aksi Forwarder">
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
          Tambah Forwarder
        </Button>
      </div>

      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari forwarder..."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteTarget(rows.filter((r) => keys.has(r.id)))}>
            Hapus Terpilih
          </Button>
        )}
        renderExpandableRow={(r) => <ForwarderRateHistory forwarderId={r.id} rates={rates} />}
      />

      <Modal
        isOpen={formModal !== null}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "create" ? "Tambah Forwarder" : "Edit Forwarder"}
        size="sm"
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
        <Input label="Nama Forwarder" value={name} onChange={(e) => setName(e.target.value)} />
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
