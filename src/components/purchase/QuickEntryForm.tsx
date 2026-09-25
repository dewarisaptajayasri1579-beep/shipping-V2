"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { Card, Button, Input, Select, CurrencyInput, DatePicker, useToast } from "@/components/ui";
import { useFormKeyboardNav } from "@/lib/focus-nav";

type OptionList = { value: string; label: string }[];

interface HeaderState {
  poNumber: string;
  poDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierId: string;
  brandId: string;
  countryId: string;
  currency: string;
  mode: "AIR" | "SEA";
  forwarderId: string;
  destinationWarehouseId: string;
  shipmentDate: string;
  notes: string;
}

interface StagedRow extends HeaderState {
  key: string;
  itemId: string;
  qty: number;
  unitPrice: number;
}

const ITEM_SELECT_ID = "qe-item-select";

const emptyHeader = (): HeaderState => ({
  poNumber: "",
  poDate: "",
  invoiceNumber: "",
  invoiceDate: "",
  supplierId: "",
  brandId: "",
  countryId: "",
  currency: "USD",
  mode: "AIR",
  forwarderId: "",
  destinationWarehouseId: "",
  shipmentDate: "",
  notes: "",
});

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

/** Halaman "Input Cepat" — satu tempat inputan flat mirip sheet DATABASE Excel lama, tapi
 *  di belakang otomatis bikin PurchaseOrder + SupplierInvoice + Shipment lewat grouping
 *  No PO/No Invoice (lihat createQuickEntryBatch di lib/data/purchase.ts).
 *
 *  No PO & No Invoice sengaja TIDAK di-reset setelah "Tambah Baris" — di lapangan, entri
 *  biasanya berurutan dalam PO/Invoice yang sama, jadi nilainya nempel dari baris
 *  sebelumnya sampai user sendiri yang mengetik ulang. Cuma Item/Qty/Harga yang di-reset
 *  karena itu yang biasanya beda tiap baris. */
export const QuickEntryForm: React.FC<{
  supplierOptions: OptionList;
  brandOptions: OptionList;
  countryOptions: OptionList;
  itemOptions: OptionList;
  forwarderOptions: OptionList;
  warehouseOptions: OptionList;
}> = ({ supplierOptions, brandOptions, countryOptions, itemOptions, forwarderOptions, warehouseOptions }) => {
  const router = useRouter();
  const toast = useToast();

  const [header, setHeader] = useState<HeaderState>(emptyHeader);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [rows, setRows] = useState<StagedRow[]>([]);
  const [showDetail, setShowDetail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const itemLabel = (id: string) => itemOptions.find((o) => o.value === id)?.label ?? id;

  const addRow = () => {
    if (!header.poNumber.trim()) {
      toast.error("No PO wajib diisi");
      return;
    }
    if (!header.invoiceNumber.trim()) {
      toast.error("No Invoice wajib diisi");
      return;
    }
    if (!itemId) {
      toast.error("Item wajib dipilih");
      return;
    }
    if (qty <= 0) {
      toast.error("Qty wajib lebih dari 0");
      return;
    }

    setRows((r) => [...r, { ...header, key: crypto.randomUUID(), itemId, qty, unitPrice }]);
    setItemId("");
    setQty(0);
    setUnitPrice(0);
    requestAnimationFrame(() => {
      document.getElementById(ITEM_SELECT_ID)?.focus();
    });
  };

  const removeRow = (key: string) => setRows((r) => r.filter((row) => row.key !== key));

  const handleUnitPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    addRow();
  };

  const totalNominal = rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0);

  const submitAll = async () => {
    if (rows.length === 0) {
      toast.error("Belum ada baris untuk disimpan");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase/quick-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan");
        return;
      }
      toast.success(`Tersimpan: ${data.data.purchaseOrders} PO, ${data.data.invoices} Invoice, ${data.data.shipments} Shipment`);
      setRows([]);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const { panelRef, handleEnterAdvance } = useFormKeyboardNav<HTMLDivElement>(submitAll);

  return (
    <div ref={panelRef} data-modal-panel onKeyDown={handleEnterAdvance} className="space-y-6">
      <Card variant="panel" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">No PO &amp; No Invoice</h3>
            <p className="text-xs text-slate-500 dark:text-fg-muted mt-0.5">
              Nilainya otomatis dipakai lagi untuk baris berikutnya sampai diganti — sesuai baris sebelumnya.
            </p>
          </div>
          <button
            type="button"
            data-skip-nav
            onClick={() => setShowDetail((s) => !s)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            {showDetail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Detail
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="No PO" value={header.poNumber} onChange={(e) => setHeader((h) => ({ ...h, poNumber: e.target.value }))} />
          <Input label="No Invoice" value={header.invoiceNumber} onChange={(e) => setHeader((h) => ({ ...h, invoiceNumber: e.target.value }))} />
        </div>
        {showDetail && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 dark:border-line">
            <DatePicker label="Tanggal PO" value={header.poDate} onChange={(e) => setHeader((h) => ({ ...h, poDate: e.target.value }))} />
            <DatePicker label="Tanggal Invoice" value={header.invoiceDate} onChange={(e) => setHeader((h) => ({ ...h, invoiceDate: e.target.value }))} />
            <Select label="Supplier" options={supplierOptions} value={header.supplierId} onChange={(v) => setHeader((h) => ({ ...h, supplierId: v }))} placeholder="Pilih supplier" />
            <Select label="Brand" options={brandOptions} value={header.brandId} onChange={(v) => setHeader((h) => ({ ...h, brandId: v }))} placeholder="Pilih brand" />
            <Select label="Negara Asal" options={countryOptions} value={header.countryId} onChange={(v) => setHeader((h) => ({ ...h, countryId: v }))} placeholder="Pilih negara" />
            <Input label="Currency" value={header.currency} onChange={(e) => setHeader((h) => ({ ...h, currency: e.target.value.toUpperCase() }))} />
            <Select
              label="Kirim"
              options={[
                { value: "AIR", label: "AIR" },
                { value: "SEA", label: "SEA" },
              ]}
              value={header.mode}
              onChange={(v) => setHeader((h) => ({ ...h, mode: v as "AIR" | "SEA" }))}
              searchable={false}
            />
            <Select label="Forwarder" options={forwarderOptions} value={header.forwarderId} onChange={(v) => setHeader((h) => ({ ...h, forwarderId: v }))} placeholder="Pilih forwarder" />
            <Select label="Gudang Tujuan" options={warehouseOptions} value={header.destinationWarehouseId} onChange={(v) => setHeader((h) => ({ ...h, destinationWarehouseId: v }))} placeholder="Pilih gudang" />
            <DatePicker label="Tanggal Kirim" value={header.shipmentDate} onChange={(e) => setHeader((h) => ({ ...h, shipmentDate: e.target.value }))} />
            <Input label="Catatan (opsional)" value={header.notes} onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))} />
          </div>
        )}
      </Card>

      <Card variant="panel" padding="lg" className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Tambah Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_160px_140px] gap-2 items-end">
          <Select id={ITEM_SELECT_ID} label="Item" options={itemOptions} value={itemId} onChange={setItemId} placeholder="Pilih item" />
          <Input type="number" label="Qty" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <CurrencyInput label="Harga Satuan" value={unitPrice} onChange={setUnitPrice} onKeyDown={handleUnitPriceKeyDown} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs sm:text-sm font-bold select-none opacity-0">.</span>
            <Button type="button" variant="outline" data-skip-nav onClick={addRow} leftIcon={<Plus className="w-3.5 h-3.5" />} className="h-14">
              Tambah Baris
            </Button>
          </div>
        </div>
      </Card>

      <Card variant="panel" padding="lg" className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Baris Tersimpan ({rows.length})</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-line">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-surface-hover">
              <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                <th className="px-3 py-2">No PO</th>
                <th className="px-3 py-2">No Invoice</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Harga</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-slate-500 dark:text-fg-muted">
                    Belum ada baris — isi Item/Qty/Harga di atas lalu Enter atau klik Tambah Baris.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-slate-100 dark:border-line">
                  <td className="px-3 py-2 font-bold text-slate-800 dark:text-fg">{r.poNumber}</td>
                  <td className="px-3 py-2">{r.invoiceNumber}</td>
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-fg">{itemLabel(r.itemId)}</td>
                  <td className="px-3 py-2">{r.qty.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2">{formatRupiah(r.unitPrice)}</td>
                  <td className="px-3 py-2 font-semibold">{formatRupiah(r.qty * r.unitPrice)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      data-skip-nav
                      onClick={() => removeRow(r.key)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg p-1 cursor-pointer"
                      aria-label="Hapus baris"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-line">
          <span className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Total Nominal</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-fg">{formatRupiah(totalNominal)}</span>
        </div>
      </Card>

      <div className="flex flex-row-reverse items-center justify-start gap-3">
        <Button variant="primary" isLoading={submitting} onClick={submitAll}>
          Simpan Semua
        </Button>
      </div>
    </div>
  );
};
