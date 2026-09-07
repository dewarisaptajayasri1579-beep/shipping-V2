"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Card, Button, Input, Select, DatePicker, CurrencyInput, Switch, useToast } from "@/components/ui";
import { useFormKeyboardNav } from "@/lib/focus-nav";
import { DocumentUploadField } from "@/components/transaksi/DocumentUploadField";
import type { InvoiceForShipment, ShipmentRow, StatusPembayaran, ForwarderDocStatus } from "./ShipmentTable";

type OptionList = { value: string; label: string }[];

interface ItemLineForm {
  invoiceItemId: string;
  qtyShipped: number;
  qtyReceived: number | null;
}

interface FormState {
  shipmentDate: string;
  originCountryId: string;
  mode: "AIR" | "SEA";
  forwarderId: string;
  destinationWarehouseId: string;
  originPort: string;
  destinationPort: string;
  notes: string;
  isDraft: boolean;
  plannedPickupDate: string;
  actualPickupDate: string;
  etd: string;
  atd: string;
  eta: string;
  ata: string;
  customsReleaseDate: string;
  warehouseReceiptDate: string;
  actualWarehouseId: string;
  receivedBy: string;
  receivingNotes: string;
  receivingDocumentUrl: string | null;
  pib: string;
  nopen: string;
  pibDate: string;
  notul: boolean;
  notulNotes: string;
  customsBillingValue: number;
  customsBillingDate: string;
  customsPaymentStatus: StatusPembayaran;
  customsPaymentDate: string;
  customsDocumentUrl: string | null;
  forwarderInvoiceNumber: string;
  forwarderInvoiceDate: string;
  forwarderBillingValue: number;
  forwarderDocStatus: ForwarderDocStatus;
  forwarderDocDate: string;
  forwarderPaymentStatus: StatusPembayaran;
  forwarderPaymentDate: string;
  forwarderDocumentUrl: string | null;
  lines: ItemLineForm[];
}

const toForm = (r?: ShipmentRow): FormState =>
  r
    ? {
        shipmentDate: r.shipmentDate ?? "",
        originCountryId: r.originCountryId ?? "",
        mode: r.mode,
        forwarderId: r.forwarderId ?? "",
        destinationWarehouseId: r.destinationWarehouseId ?? "",
        originPort: r.originPort ?? "",
        destinationPort: r.destinationPort ?? "",
        notes: r.notes ?? "",
        isDraft: r.isDraft,
        plannedPickupDate: r.plannedPickupDate ?? "",
        actualPickupDate: r.actualPickupDate ?? "",
        etd: r.etd ?? "",
        atd: r.atd ?? "",
        eta: r.eta ?? "",
        ata: r.ata ?? "",
        customsReleaseDate: r.customsReleaseDate ?? "",
        warehouseReceiptDate: r.warehouseReceiptDate ?? "",
        actualWarehouseId: r.actualWarehouseId ?? "",
        receivedBy: r.receivedBy ?? "",
        receivingNotes: r.receivingNotes ?? "",
        receivingDocumentUrl: r.receivingDocumentUrl,
        pib: r.pib ?? "",
        nopen: r.nopen ?? "",
        pibDate: r.pibDate ?? "",
        notul: r.notul,
        notulNotes: r.notulNotes ?? "",
        customsBillingValue: r.customsBillingValue,
        customsBillingDate: r.customsBillingDate ?? "",
        customsPaymentStatus: r.customsPaymentStatus,
        customsPaymentDate: r.customsPaymentDate ?? "",
        customsDocumentUrl: r.customsDocumentUrl,
        forwarderInvoiceNumber: r.forwarderInvoiceNumber ?? "",
        forwarderInvoiceDate: r.forwarderInvoiceDate ?? "",
        forwarderBillingValue: r.forwarderBillingValue,
        forwarderDocStatus: r.forwarderDocStatus,
        forwarderDocDate: r.forwarderDocDate ?? "",
        forwarderPaymentStatus: r.forwarderPaymentStatus,
        forwarderPaymentDate: r.forwarderPaymentDate ?? "",
        forwarderDocumentUrl: r.forwarderDocumentUrl,
        lines: r.items.map((it) => ({ invoiceItemId: it.invoiceItemId, qtyShipped: it.qtyShipped, qtyReceived: it.qtyReceived })),
      }
    : {
        shipmentDate: "",
        originCountryId: "",
        mode: "AIR",
        forwarderId: "",
        destinationWarehouseId: "",
        originPort: "",
        destinationPort: "",
        notes: "",
        isDraft: false,
        plannedPickupDate: "",
        actualPickupDate: "",
        etd: "",
        atd: "",
        eta: "",
        ata: "",
        customsReleaseDate: "",
        actualWarehouseId: "",
        receivedBy: "",
        receivingNotes: "",
        receivingDocumentUrl: null,
        warehouseReceiptDate: "",
        pib: "",
        nopen: "",
        pibDate: "",
        notul: false,
        notulNotes: "",
        customsBillingValue: 0,
        customsBillingDate: "",
        customsPaymentStatus: "BELUM DIBAYAR",
        customsPaymentDate: "",
        customsDocumentUrl: null,
        forwarderInvoiceNumber: "",
        forwarderInvoiceDate: "",
        forwarderBillingValue: 0,
        forwarderDocStatus: "BELUM ADA INVOICE",
        forwarderDocDate: "",
        forwarderPaymentStatus: "BELUM DIBAYAR",
        forwarderPaymentDate: "",
        forwarderDocumentUrl: null,
        lines: [],
      };

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

/** Form Tambah/Edit Shipment — halaman penuh (bukan modal, item repeater dari beberapa
 *  Invoice bisa panjang). Dipakai dari /purchase/shipments/new dan /purchase/shipments/[id]. */
export const ShipmentForm: React.FC<{
  mode: "create" | "edit";
  record?: ShipmentRow;
  invoices: InvoiceForShipment[];
  countryOptions: OptionList;
  forwarderOptions: OptionList;
  warehouseOptions: OptionList;
  itemOptions: OptionList;
}> = ({ mode, record, invoices, countryOptions, forwarderOptions, warehouseOptions, itemOptions }) => {
  const router = useRouter();
  const toast = useToast();
  const { panelRef, handleEnterAdvance } = useFormKeyboardNav<HTMLDivElement>();
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "-");

  const [form, setForm] = useState<FormState>(() => toForm(record));
  const [itemFilter, setItemFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pas edit, qty shipment ini sendiri ditambah balik ke "sisa" (sama pola kayak Invoice edit).
  const ownQtyByInvoiceItem = mode === "edit" && record ? Object.fromEntries(record.items.map((it) => [it.invoiceItemId, it.qtyShipped])) : {};

  const flatInvoiceItems = useMemo(
    () =>
      invoices.flatMap((inv) =>
        inv.items.map((it) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceItemId: it.id,
          itemId: it.itemId,
          unitPrice: it.unitPrice,
          remaining: it.qty - it.alreadyShipped + (ownQtyByInvoiceItem[it.id] ?? 0),
        }))
      ),
    [invoices, ownQtyByInvoiceItem]
  );

  const visibleItems = flatInvoiceItems.filter((it) => {
    if (!itemFilter.trim()) return true;
    const needle = itemFilter.toLowerCase();
    return it.invoiceNumber.toLowerCase().includes(needle) || itemLabel(it.itemId).toLowerCase().includes(needle);
  });

  const lineFor = (invoiceItemId: string) => form.lines.find((l) => l.invoiceItemId === invoiceItemId);
  const updateLineQty = (invoiceItemId: string, qty: number) => {
    setForm((f) => {
      const exists = f.lines.some((l) => l.invoiceItemId === invoiceItemId);
      if (qty <= 0) return { ...f, lines: f.lines.filter((l) => l.invoiceItemId !== invoiceItemId) };
      if (exists) return { ...f, lines: f.lines.map((l) => (l.invoiceItemId === invoiceItemId ? { ...l, qtyShipped: qty } : l)) };
      return { ...f, lines: [...f.lines, { invoiceItemId, qtyShipped: qty, qtyReceived: null }] };
    });
  };
  const updateLineReceived = (invoiceItemId: string, qty: number | null) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.invoiceItemId === invoiceItemId ? { ...l, qtyReceived: qty } : l)) }));
  };

  const submitForm = async () => {
    const items = form.lines.filter((l) => l.qtyShipped > 0);
    if (items.length === 0) {
      toast.error("Pilih minimal 1 item invoice untuk dikirim");
      return;
    }

    setSubmitting(true);
    try {
      const body = { ...form, items: items.map((l) => ({ invoiceItemId: l.invoiceItemId, qtyShipped: l.qtyShipped, qtyReceived: l.qtyReceived })) };
      const res =
        mode === "create"
          ? await fetch("/api/purchase/shipments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await fetch(`/api/purchase/shipments/${record?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan shipment");
        return;
      }
      toast.success(mode === "create" ? "Shipment ditambahkan" : "Shipment diperbarui");
      router.push("/purchase/shipments");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={panelRef} data-modal-panel onKeyDown={handleEnterAdvance} className="space-y-6">
      <Card variant="panel" padding="lg" className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Info Dasar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker label="Shipment Date" value={form.shipmentDate} onChange={(e) => setForm((f) => ({ ...f, shipmentDate: e.target.value }))} />
          <Select label="Mode" options={toOptions(["AIR", "SEA"])} value={form.mode} onChange={(v) => setForm((f) => ({ ...f, mode: v as "AIR" | "SEA" }))} searchable={false} />
          <Select label="Origin Country" options={countryOptions} value={form.originCountryId} onChange={(v) => setForm((f) => ({ ...f, originCountryId: v }))} placeholder="Pilih negara" />
          <Select label="Forwarder" options={forwarderOptions} value={form.forwarderId} onChange={(v) => setForm((f) => ({ ...f, forwarderId: v }))} placeholder="Pilih forwarder" />
          <Select
            label="Gudang Tujuan"
            options={warehouseOptions}
            value={form.destinationWarehouseId}
            onChange={(v) => setForm((f) => ({ ...f, destinationWarehouseId: v }))}
            placeholder="Pilih gudang"
          />
          <Input label="Origin Port (opsional)" value={form.originPort} onChange={(e) => setForm((f) => ({ ...f, originPort: e.target.value }))} />
          <Input label="Destination Port (opsional)" value={form.destinationPort} onChange={(e) => setForm((f) => ({ ...f, destinationPort: e.target.value }))} />
          <DatePicker label="Planned Pickup Date" value={form.plannedPickupDate} onChange={(e) => setForm((f) => ({ ...f, plannedPickupDate: e.target.value }))} />
          <DatePicker label="ETD" value={form.etd} onChange={(e) => setForm((f) => ({ ...f, etd: e.target.value }))} />
          <DatePicker label="ETA" value={form.eta} onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))} />
        </div>
        <Switch
          label="Draft (belum final, Invoice masih bisa berubah)"
          checked={form.isDraft}
          onChange={(e) => setForm((f) => ({ ...f, isDraft: e.target.checked }))}
        />
      </Card>

      {mode === "edit" && (
        <Card variant="panel" padding="lg" className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Progress / Milestone Aktual</h3>
            <p className="text-xs text-slate-500 dark:text-fg-muted mt-0.5">Isi tanggal aktual begitu kejadian — Status Shipment dihitung otomatis dari sini.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker label="Actual Pickup Date" value={form.actualPickupDate} onChange={(e) => setForm((f) => ({ ...f, actualPickupDate: e.target.value }))} />
            <DatePicker label="ATD (Aktual Berangkat)" value={form.atd} onChange={(e) => setForm((f) => ({ ...f, atd: e.target.value }))} />
            <DatePicker label="ATA (Aktual Tiba Indonesia)" value={form.ata} onChange={(e) => setForm((f) => ({ ...f, ata: e.target.value }))} />
            <DatePicker label="Customs Release Date" value={form.customsReleaseDate} onChange={(e) => setForm((f) => ({ ...f, customsReleaseDate: e.target.value }))} />
            <DatePicker label="Warehouse Receipt Date" value={form.warehouseReceiptDate} onChange={(e) => setForm((f) => ({ ...f, warehouseReceiptDate: e.target.value }))} />
          </div>
        </Card>
      )}

      {mode === "edit" && (
        <Card variant="panel" padding="lg" className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Warehouse Receiving</h3>
            <p className="text-xs text-slate-500 dark:text-fg-muted mt-0.5">
              Qty Received per item diisi di tabel Item di bawah — boleh beda dari Qty Shipped, dicatat sebagai discrepancy.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Gudang Aktual (kalau beda dari rencana)"
              options={warehouseOptions}
              value={form.actualWarehouseId}
              onChange={(v) => setForm((f) => ({ ...f, actualWarehouseId: v }))}
              placeholder="Sama seperti Gudang Tujuan"
            />
            <Input label="Diterima Oleh" value={form.receivedBy} onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))} />
            <div className="sm:col-span-2">
              <Input label="Catatan Kondisi Barang" value={form.receivingNotes} onChange={(e) => setForm((f) => ({ ...f, receivingNotes: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <DocumentUploadField label="Proof of Receipt" value={form.receivingDocumentUrl} onChange={(url) => setForm((f) => ({ ...f, receivingDocumentUrl: url }))} />
            </div>
          </div>
        </Card>
      )}

      {mode === "edit" && (
        <Card variant="panel" padding="lg" className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Customs / PIB</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="PIB" value={form.pib} onChange={(e) => setForm((f) => ({ ...f, pib: e.target.value }))} />
            <Input label="NOPEN" value={form.nopen} onChange={(e) => setForm((f) => ({ ...f, nopen: e.target.value }))} />
            <DatePicker label="Tanggal PIB" value={form.pibDate} onChange={(e) => setForm((f) => ({ ...f, pibDate: e.target.value }))} />
            <Switch label="NOTUL" checked={form.notul} onChange={(e) => setForm((f) => ({ ...f, notul: e.target.checked }))} />
            {form.notul && (
              <div className="sm:col-span-2">
                <Input label="Catatan NOTUL" value={form.notulNotes} onChange={(e) => setForm((f) => ({ ...f, notulNotes: e.target.value }))} />
              </div>
            )}
            <CurrencyInput label="Nilai Billing Customs" value={form.customsBillingValue} onChange={(v) => setForm((f) => ({ ...f, customsBillingValue: v }))} />
            <DatePicker label="Tanggal Billing" value={form.customsBillingDate} onChange={(e) => setForm((f) => ({ ...f, customsBillingDate: e.target.value }))} />
            <Select
              label="Status Pembayaran PIB"
              options={toOptions(["BELUM DIBAYAR", "SUDAH DIBAYAR"])}
              value={form.customsPaymentStatus}
              onChange={(v) => setForm((f) => ({ ...f, customsPaymentStatus: v as StatusPembayaran }))}
              searchable={false}
            />
            <DatePicker label="Tanggal Pembayaran PIB" value={form.customsPaymentDate} onChange={(e) => setForm((f) => ({ ...f, customsPaymentDate: e.target.value }))} />
            <div className="sm:col-span-2">
              <DocumentUploadField label="Scan PIB/NOPEN" value={form.customsDocumentUrl} onChange={(url) => setForm((f) => ({ ...f, customsDocumentUrl: url }))} />
            </div>
          </div>
        </Card>
      )}

      {mode === "edit" && (
        <Card variant="panel" padding="lg" className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Forwarder Finance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="No Invoice Forwarder" value={form.forwarderInvoiceNumber} onChange={(e) => setForm((f) => ({ ...f, forwarderInvoiceNumber: e.target.value }))} />
            <DatePicker label="Tanggal Invoice Forwarder" value={form.forwarderInvoiceDate} onChange={(e) => setForm((f) => ({ ...f, forwarderInvoiceDate: e.target.value }))} />
            <CurrencyInput label="Nilai Tagihan Forwarder" value={form.forwarderBillingValue} onChange={(v) => setForm((f) => ({ ...f, forwarderBillingValue: v }))} />
            <Select
              label="Status Dokumen"
              options={toOptions(["BELUM ADA INVOICE", "INVOICE DITERIMA", "DOKUMEN KE FINANCE", "WAITING PAYMENT", "PAID"])}
              value={form.forwarderDocStatus}
              onChange={(v) => setForm((f) => ({ ...f, forwarderDocStatus: v as ForwarderDocStatus }))}
              searchable={false}
            />
            <DatePicker label="Tanggal Dokumen ke Finance" value={form.forwarderDocDate} onChange={(e) => setForm((f) => ({ ...f, forwarderDocDate: e.target.value }))} />
            <Select
              label="Status Pembayaran Forwarder"
              options={toOptions(["BELUM DIBAYAR", "SUDAH DIBAYAR"])}
              value={form.forwarderPaymentStatus}
              onChange={(v) => setForm((f) => ({ ...f, forwarderPaymentStatus: v as StatusPembayaran }))}
              searchable={false}
            />
            <DatePicker label="Tanggal Pembayaran Forwarder" value={form.forwarderPaymentDate} onChange={(e) => setForm((f) => ({ ...f, forwarderPaymentDate: e.target.value }))} />
            <div className="sm:col-span-2">
              <DocumentUploadField label="Scan Invoice/Bukti Bayar Forwarder" value={form.forwarderDocumentUrl} onChange={(url) => setForm((f) => ({ ...f, forwarderDocumentUrl: url }))} />
            </div>
          </div>
        </Card>
      )}

      <Card variant="panel" padding="lg" className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Item dari Invoice — bisa gabung dari beberapa Invoice</h3>
        <Input leftIcon={<Search className="w-4 h-4" />} placeholder="Cari no invoice / item..." value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} data-skip-nav />
        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-surface-hover sticky top-0">
              <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Sisa</th>
                <th className="px-3 py-2 w-32">Qty Shipped</th>
                {mode === "edit" && <th className="px-3 py-2 w-32">Qty Received</th>}
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((it) => {
                const line = lineFor(it.invoiceItemId);
                return (
                  <tr key={it.invoiceItemId} className="border-t border-slate-100 dark:border-line">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{it.invoiceNumber}</td>
                    <td className="px-3 py-2">{itemLabel(it.itemId)}</td>
                    <td className="px-3 py-2">{it.remaining.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={line?.qtyShipped ?? 0}
                        max={it.remaining}
                        min={0}
                        disabled={it.remaining <= 0}
                        onChange={(e) => updateLineQty(it.invoiceItemId, Number(e.target.value))}
                        className="w-24 h-10 px-2 rounded-lg border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] bg-white/60 dark:bg-[var(--field-bg)] text-sm disabled:opacity-40"
                      />
                    </td>
                    {mode === "edit" && (
                      <td className="px-3 py-2">
                        {line && (
                          <input
                            type="number"
                            value={line.qtyReceived ?? ""}
                            min={0}
                            onChange={(e) => updateLineReceived(it.invoiceItemId, e.target.value === "" ? null : Number(e.target.value))}
                            className="w-24 h-10 px-2 rounded-lg border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] bg-white/60 dark:bg-[var(--field-bg)] text-sm"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card variant="panel" padding="lg">
        <Input label="Catatan (opsional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </Card>

      <div className="flex flex-row-reverse items-center justify-start gap-3">
        <Button variant="primary" isLoading={submitting} onClick={submitForm}>
          Simpan
        </Button>
        <Button variant="ghost" onClick={() => router.push("/purchase/shipments")}>
          Batal
        </Button>
      </div>
    </div>
  );
};
