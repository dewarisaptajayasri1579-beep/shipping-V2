"use client";

import React, { useMemo, useState } from "react";
import { Ship, Clock, PackageCheck, Wallet } from "lucide-react";
import { Card, StatTile, MultiSelect, Badge, FilterableTable, type FilterableColumn } from "@/components/ui";
import { BarChartCard } from "@/components/ui/charts";
import { STATUS_DTD, type StatusDtd } from "@/lib/data/transaksi-constants";
import { calcGapDays } from "@/lib/gap";

export interface IlluviaShipmentRow {
  id: string;
  shipmentName: string;
  projectId: string | null;
  countryId: string | null;
  brandId: string | null;
  vendorId: string | null;
  sampeAgent: string | null;
  sampeMche: string | null;
  status: StatusDtd;
  cost: number;
}

type OptionList = { value: string; label: string }[];

const STATUS_BADGE: Record<StatusDtd, "info" | "warning" | "success"> = {
  "ON PRODUCING": "info",
  "ON GOING": "warning",
  "MENUNGGU PEMBAYARAN FW": "warning",
  DONE: "success",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const IlluviaMonitoringView: React.FC<{
  rows: IlluviaShipmentRow[];
  projectOptions: OptionList;
  brandOptions: OptionList;
  vendorOptions: OptionList;
}> = ({ rows, projectOptions, brandOptions, vendorOptions }) => {
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "-");

  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (projectFilter.length > 0 && !projectFilter.includes(r.projectId ?? "")) return false;
      if (brandFilter.length > 0 && !brandFilter.includes(r.brandId ?? "")) return false;
      if (vendorFilter.length > 0 && !vendorFilter.includes(r.vendorId ?? "")) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false;
      return true;
    });
  }, [rows, projectFilter, brandFilter, vendorFilter, statusFilter]);

  const totalShipment = filtered.length;
  const onGoing = filtered.filter((r) => r.status === "ON GOING" || r.status === "ON PRODUCING").length;
  const done = filtered.filter((r) => r.status === "DONE").length;
  const totalCost = filtered.reduce((sum, r) => sum + r.cost, 0);

  const avgGapByVendor = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filtered.forEach((r) => {
      const gap = calcGapDays(r.sampeAgent, r.sampeMche);
      if (gap === null) return;
      const label = labelOf(vendorOptions, r.vendorId);
      const entry = map.get(label) ?? { total: 0, count: 0 };
      entry.total += gap;
      entry.count += 1;
      map.set(label, entry);
    });
    return Array.from(map.entries()).map(([vendor, { total, count }]) => ({ vendor, "Rata-rata GAP": Math.round(total / count) }));
  }, [filtered, vendorOptions]);

  const columns: FilterableColumn<IlluviaShipmentRow>[] = [
    { key: "shipmentName", header: "Shipment", cell: (r) => <span className="font-bold text-slate-800 dark:text-fg">{r.shipmentName}</span>, filterValue: (r) => r.shipmentName },
    { key: "brand", header: "Brand", cell: (r) => labelOf(brandOptions, r.brandId), filterValue: (r) => labelOf(brandOptions, r.brandId) },
    { key: "sampeAgent", header: "Sampe Agent", cell: (r) => r.sampeAgent || "-" },
    { key: "sampeMche", header: "Sampe MCHE", cell: (r) => r.sampeMche || "-" },
    {
      key: "gap",
      header: "GAP",
      cell: (r) => {
        const gap = calcGapDays(r.sampeAgent, r.sampeMche);
        return gap === null ? <span className="text-slate-400 dark:text-fg-muted">-</span> : `${gap} hari`;
      },
    },
    { key: "vendor", header: "Vendor", cell: (r) => labelOf(vendorOptions, r.vendorId), filterValue: (r) => labelOf(vendorOptions, r.vendorId) },
    { key: "status", header: "Status", cell: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>, filterOptions: STATUS_DTD.map((s) => ({ value: s, label: s })), filterValue: (r) => r.status },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <Card variant="panel" padding="lg" className="space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Slicer</h3>
          <MultiSelect label="Project" options={projectOptions} value={projectFilter} onChange={setProjectFilter} placeholder="Semua project" />
          <MultiSelect label="Brand" options={brandOptions} value={brandFilter} onChange={setBrandFilter} placeholder="Semua brand" />
          <MultiSelect label="Vendor" options={vendorOptions} value={vendorFilter} onChange={setVendorFilter} placeholder="Semua vendor" />
          <MultiSelect label="Status" options={STATUS_DTD.map((s) => ({ value: s, label: s }))} value={statusFilter} onChange={setStatusFilter} placeholder="Semua status" />
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatTile label="Total Shipment" value={totalShipment} icon={Ship} color="blue" />
            <StatTile label="On Going" value={onGoing} icon={Clock} color="amber" />
            <StatTile label="Done" value={done} icon={PackageCheck} color="emerald" />
            <StatTile label="Cost" value={formatRupiah(totalCost)} icon={Wallet} color="purple" />
          </div>

          <Card variant="panel" padding="lg">
            <FilterableTable columns={columns} rows={filtered} rowKey={(r) => r.id} searchPlaceholder="Cari shipment..." />
          </Card>

          <BarChartCard title="Rata-rata GAP Hari per Vendor" data={avgGapByVendor} xKey="vendor" series={[{ key: "Rata-rata GAP", label: "Hari" }]} />
        </div>
      </div>
    </div>
  );
};
