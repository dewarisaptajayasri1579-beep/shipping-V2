"use client";

import React, { useMemo, useState } from "react";
import { Card, MultiSelect, Badge, Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { BarChartCard } from "@/components/ui/charts";

export interface Top20Shipment {
  id: string;
  shipmentName: string;
  brandId: string | null;
  itemId: string | null;
  qty: number;
  priceSatuan: number;
  tanggalKedatangan: string | null;
}

type OptionList = { value: string; label: string }[];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const Top20View: React.FC<{
  shipments: Top20Shipment[];
  brandOptions: OptionList;
  itemOptions: OptionList;
}> = ({ shipments, brandOptions, itemOptions }) => {
  const brandLabel = (id: string | null) => (id ? brandOptions.find((o) => o.value === id)?.label ?? id : "Tanpa Brand");
  const itemLabel = (id: string | null) => (id ? itemOptions.find((o) => o.value === id)?.label ?? id : "Tanpa Item");

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    shipments.forEach((s) => {
      if (s.tanggalKedatangan) years.add(String(new Date(s.tanggalKedatangan).getFullYear()));
    });
    return Array.from(years)
      .sort()
      .map((y) => ({ value: y, label: y }));
  }, [shipments]);

  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (brandFilter.length > 0 && !brandFilter.includes(s.brandId ?? "")) return false;
      if (!s.tanggalKedatangan) return yearFilter.length === 0 && monthFilter.length === 0;
      const date = new Date(s.tanggalKedatangan);
      if (yearFilter.length > 0 && !yearFilter.includes(String(date.getFullYear()))) return false;
      if (monthFilter.length > 0 && !monthFilter.includes(MONTH_LABELS[date.getMonth()])) return false;
      return true;
    });
  }, [shipments, yearFilter, monthFilter, brandFilter]);

  const top20Items = useMemo(() => {
    const map = new Map<string, { itemId: string | null; qty: number; total: number }>();
    filtered.forEach((s) => {
      const key = s.itemId ?? `__${s.shipmentName}`;
      const entry = map.get(key) ?? { itemId: s.itemId, qty: 0, total: 0 };
      entry.qty += s.qty;
      entry.total += s.qty * s.priceSatuan;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 20);
  }, [filtered]);

  const chartData = top20Items.map((r) => ({ item: itemLabel(r.itemId).slice(0, 20), Qty: r.qty }));

  const byYear = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((s) => {
      if (!s.tanggalKedatangan) return;
      const year = String(new Date(s.tanggalKedatangan).getFullYear());
      map.set(year, (map.get(year) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, Shipment: count }));
  }, [filtered]);

  const byMonth = useMemo(() => {
    const counts = new Array(12).fill(0);
    filtered.forEach((s) => {
      if (!s.tanggalKedatangan) return;
      counts[new Date(s.tanggalKedatangan).getMonth()] += 1;
    });
    return MONTH_LABELS.map((label, i) => ({ month: label, Shipment: counts[i] }));
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <Card variant="panel" padding="lg" className="space-y-4 h-fit">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary">Slicer</h3>
        <MultiSelect label="Year" options={yearOptions} value={yearFilter} onChange={setYearFilter} placeholder="Semua tahun" />
        <MultiSelect label="Month" options={MONTH_LABELS.map((m) => ({ value: m, label: m }))} value={monthFilter} onChange={setMonthFilter} placeholder="Semua bulan" />
        <MultiSelect label="Brand" options={brandOptions} value={brandFilter} onChange={setBrandFilter} placeholder="Semua brand" />
      </Card>

      <div className="space-y-6">
        <BarChartCard title="20 Most Import Product" description="Ranking item berdasarkan total qty yang diimpor" data={chartData} xKey="item" series={[{ key: "Qty", label: "Qty" }]} height={340} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <BarChartCard title="Shipment by Year" data={byYear} xKey="year" series={[{ key: "Shipment", label: "Shipment" }]} height={260} />
          <BarChartCard title="Shipment by Month" data={byMonth} xKey="month" series={[{ key: "Shipment", label: "Shipment" }]} height={260} />
        </div>

        <Card variant="panel" padding="none">
          <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top20Items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 dark:text-fg-muted py-8">
                      Tidak ada data untuk filter ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  top20Items.map((r, i) => (
                    <TableRow key={r.itemId ?? i}>
                      <TableCell>
                        <Badge variant={i < 3 ? "warning" : "secondary"}>#{i + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-fg">{itemLabel(r.itemId)}</TableCell>
                      <TableCell>{r.qty.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="font-extrabold">{formatRupiah(r.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </div>
  );
};
