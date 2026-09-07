"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Trash2 } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, Modal, Select, Textarea, DatePicker, useToast } from "@/components/ui";
import { STATUS_PEMBAYARAN, PAYMENT_TYPES, PAYMENT_TYPE_LABEL, type StatusPembayaran, type PaymentType } from "@/lib/data/transaksi-constants";

export interface PaymentShipmentRow {
  id: string;
  shipmentName: string;
  po: string;
  statusPembayaranFO: StatusPembayaran;
}

export interface PaymentInvoiceRow {
  id: string;
  invoice: string;
  statusPembayaranPI: StatusPembayaran;
  shipments: PaymentShipmentRow[];
}

export interface PaymentLogRow {
  id: string;
  invoiceId: string;
  shipmentId: string | null;
  paymentType: PaymentType;
  status: StatusPembayaran;
  note: string | null;
  changedAt: string;
}

const STATUS_BADGE: Record<StatusPembayaran, "warning" | "success"> = {
  "BELUM DIBAYAR": "warning",
  "SUDAH DIBAYAR": "success",
};

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

interface FormState {
  paymentType: PaymentType;
  shipmentId: string;
  status: StatusPembayaran;
  note: string;
  changedAt: string;
}

const emptyForm = (shipmentId = ""): FormState => ({
  paymentType: "PI",
  shipmentId,
  status: "SUDAH DIBAYAR",
  note: "",
  changedAt: new Date().toISOString().slice(0, 10),
});

export const PaymentStatusTable: React.FC<{ rows: PaymentInvoiceRow[]; logs: PaymentLogRow[] }> = ({ rows, logs }) => {
  const router = useRouter();
  const toast = useToast();

  const [updateTarget, setUpdateTarget] = useState<PaymentInvoiceRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  const openUpdate = (r: PaymentInvoiceRow) => {
    setForm(emptyForm(r.shipments[0]?.id ?? ""));
    setUpdateTarget(r);
  };

  const submitUpdate = async () => {
    if (!updateTarget) return;
    if (form.paymentType === "FO" && !form.shipmentId) {
      toast.error("Shipment (PO) wajib dipilih untuk pembayaran FO");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/transaksi/payment-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: updateTarget.id, ...form }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan status pembayaran");
        return;
      }
      toast.success("Status pembayaran diperbarui");
      setUpdateTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLog = async (logId: string) => {
    setDeletingLogId(logId);
    try {
      const res = await fetch(`/api/transaksi/payment-logs/${logId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus log");
        return;
      }
      toast.success("Log dihapus");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setDeletingLogId(null);
    }
  };

  const columns: FilterableColumn<PaymentInvoiceRow>[] = [
    { key: "invoice", header: "Invoice", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.invoice}</span>, filterValue: (r) => r.invoice },
    {
      key: "statusPI",
      header: "Bayar Supplier (PI)",
      cell: (r) => <Badge variant={STATUS_BADGE[r.statusPembayaranPI]}>{r.statusPembayaranPI}</Badge>,
      filterOptions: toOptions(STATUS_PEMBAYARAN),
      filterValue: (r) => r.statusPembayaranPI,
    },
    {
      key: "shipments",
      header: "Bayar Forwarder (FO) per Shipment",
      cell: (r) =>
        r.shipments.length === 0 ? (
          "-"
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {r.shipments.map((s) => (
              <Badge key={s.id} variant={STATUS_BADGE[s.statusPembayaranFO]}>
                {s.po || s.shipmentName || "(tanpa no)"}: {s.statusPembayaranFO}
              </Badge>
            ))}
          </div>
        ),
      filterValue: (r) => r.shipments.map((s) => s.po).join(" "),
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) => (
        <Button variant="outline" size="sm" leftIcon={<Wallet className="w-3.5 h-3.5" />} onClick={() => openUpdate(r)}>
          Update
        </Button>
      ),
    },
  ];

  return (
    <>
      <FilterableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari no invoice..."
        renderExpandableRow={(r) => {
          const myLogs = logs.filter((l) => l.invoiceId === r.id).sort((a, b) => b.changedAt.localeCompare(a.changedAt));
          const shipmentLabel = (shipmentId: string | null) => r.shipments.find((s) => s.id === shipmentId)?.po ?? null;
          return (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Histori Perubahan Status Pembayaran</h4>
              {myLogs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-fg-muted">Belum ada histori.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-surface-hover">
                      <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                        <th className="px-3 py-2">Tanggal</th>
                        <th className="px-3 py-2">Jenis</th>
                        <th className="px-3 py-2">PO</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Catatan</th>
                        <th className="px-3 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {myLogs.map((l) => (
                        <tr key={l.id} className="border-t border-slate-100 dark:border-line">
                          <td className="px-3 py-2">{l.changedAt}</td>
                          <td className="px-3 py-2">{PAYMENT_TYPE_LABEL[l.paymentType]}</td>
                          <td className="px-3 py-2">{shipmentLabel(l.shipmentId) || "-"}</td>
                          <td className="px-3 py-2">
                            <Badge variant={STATUS_BADGE[l.status]}>{l.status}</Badge>
                          </td>
                          <td className="px-3 py-2">{l.note || "-"}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              disabled={deletingLogId === l.id}
                              onClick={() => deleteLog(l.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 dark:text-fg-muted cursor-pointer disabled:opacity-50"
                              aria-label="Hapus log"
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
            </div>
          );
        }}
      />

      <Modal
        isOpen={updateTarget !== null}
        onClose={() => setUpdateTarget(null)}
        title={`Update Status Pembayaran — Invoice ${updateTarget?.invoice ?? ""}`}
        footer={
          <div className="flex flex-row-reverse items-center justify-start gap-3 w-full">
            <Button variant="primary" isLoading={submitting} onClick={submitUpdate}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setUpdateTarget(null)}>
              Batal
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Jenis Pembayaran"
            options={PAYMENT_TYPES.map((p) => ({ value: p, label: PAYMENT_TYPE_LABEL[p] }))}
            value={form.paymentType}
            onChange={(v) => setForm((f) => ({ ...f, paymentType: v as PaymentType }))}
            searchable={false}
          />
          {form.paymentType === "FO" && (
            <Select
              label="Shipment (PO)"
              options={(updateTarget?.shipments ?? []).map((s) => ({ value: s.id, label: s.po || s.shipmentName || "(tanpa no)" }))}
              value={form.shipmentId}
              onChange={(v) => setForm((f) => ({ ...f, shipmentId: v }))}
              placeholder="Pilih shipment"
              searchable={false}
            />
          )}
          <Select
            label="Status Baru"
            options={toOptions(STATUS_PEMBAYARAN)}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v as StatusPembayaran }))}
            searchable={false}
          />
          <DatePicker label="Tanggal" value={form.changedAt} onChange={(e) => setForm((f) => ({ ...f, changedAt: e.target.value }))} />
          <Textarea label="Catatan (opsional)" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        </div>
      </Modal>
    </>
  );
};
