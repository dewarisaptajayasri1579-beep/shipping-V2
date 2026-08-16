"use client";

import React, { useMemo, useState } from "react";
import { Ship, RefreshCw, Wallet, Receipt } from "lucide-react";
import { Card, StatTile, MultiSelect, Badge, Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { BarChartCard, PieChartCard } from "@/components/ui/charts";
import { STATUS_BARANG, STATUS_SHIPMENT, type StatusBarang, type StatusShipment } from "@/lib/data/transaksi-constants";

export interface DashboardShipment {
  id: string;
  shipmentName: string;
  brandId: string | null;
  countryId: string | null;
  qty: number;
  priceSatuan: number;
  airSea: "AIR" | "SEA";
  statusBarang: StatusBarang;
  tanggalKedatangan: string | null;
  nilaiBilling: number;
  nilaiForwarder: number;
  statusShipment: StatusShipment;
}

type OptionList = { value: string; label: string }[];

const STATUS_BARANG_BADGE: Record<StatusBarang, "warning" | "info" | "success"> = {
  "BELUM DATANG": "warning",
  "ON GOING": "info",
  "BARANG SUDAH DATANG": "success",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export const DashboardView: React.FC<{
  shipments: DashboardShipment[];
  brandOptions: OptionList;
  countryOptions: OptionList;
}> = ({ shipments, brandOptions, countryOptions }) => {
  const labelOf = (opts: OptionList, id: string | null) => (id ? opts.find((o) => o.value === id)?.label ?? id : "Tanpa Brand");

  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [statusBarangFilter, setStatusBarangFilter] = useState<string[]>([]);
  const [statusShipmentFilter, setStatusShipmentFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (brandFilter.length > 0 && !brandFilter.includes(s.brandId ?? "")) return false;
      if (statusBarangFilter.length > 0 && !statusBarangFilter.includes(s.statusBarang)) return false;
      if (statusShipmentFilter.length > 0 && !statusShipmentFilter.includes(s.statusShipment)) return false;
      return true;
    });
  }, [shipments, brandFilter, statusBarangFilter, statusShipmentFilter]);

  const totalShipment = filtered.length;
  const onGoing = filtered.filter((s) => s.statusShipment === "ON GOING" || s.statusBarang !== "BARANG SUDAH DATANG").length;
  const costForwarder = filtered.reduce((sum, s) => sum + s.nilaiForwarder, 0);
  const costBilling = filtered.reduce((sum, s) => sum + s.nilaiBilling, 0);

  const perMonth = useMemo(() => {
    const counts = new Array(12).fill(0);
    filtered.forEach((s) => {
      if (!s.tanggalKedatangan) return;
      const month = new Date(s.tanggalKedatangan).getMonth();
      if (!Number.isNaN(month)) counts[month] += 1;
    });
    return MONTH_LABELS.map((label, i) => ({ month: label, Shipment: counts[i] }));
  }, [filtered]);

  const byBrand = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((s) => {
      const label = labelOf(brandOptions, s.brandId);
      map.set(label, (map.get(label) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filtered, brandOptions]);

  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((s) => {
      const label = labelOf(countryOptions, s.countryId);
      map.set(label, (map.get(label) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([label, count]) => ({ country: label, Shipment: count }));
  }, [filtered, countryOptions]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatTile label="Total Shipment" value={totalShipment} icon={Ship} color="blue" />
        <StatTile label="On Going" value={onGoing} icon={RefreshCw} color="amber" />
        <StatTile label="Cost Forwarder" value={formatRupiah(costForwarder)} icon={Wallet} color="rose" />
        <StatTile label="Cost Billing" value={formatRupiah(costBilling)} icon={Receipt} color="emerald" />
      </div>

      <Card variant="panel" padding="lg">
        <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-4">Filter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MultiSelect label="Brand" options={brandOptions} value={brandFilter} onChange={setBrandFilter} placeholder="Semua brand" />
          <MultiSelect label="Status Barang" options={STATUS_BARANG.map((s) => ({ value: s, label: s }))} value={statusBarangFilter} onChange={setStatusBarangFilter} placeholder="Semua status" />
          <MultiSelect
            label="Status Shipment"
            options={STATUS_SHIPMENT.map((s) => ({ value: s, label: s }))}
            value={statusShipmentFilter}
            onChange={setStatusShipmentFilter}
            placeholder="Semua status"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <BarChartCard title="Shipment per Bulan" data={perMonth} xKey="month" series={[{ key: "Shipment", label: "Shipment" }]} />
        <PieChartCard title="Shipment per Brand" data={byBrand} donut />
      </div>

      <BarChartCard title="Shipment per Negara Asal" data={byCountry} xKey="country" series={[{ key: "Shipment", label: "Shipment" }]} />

      <Card variant="panel" padding="none">
        <div className="p-5 sm:p-6 pb-0">
          <h3 className="text-sm font-bold text-slate-700 dark:text-fg-secondary mb-1">Shipment Tracking</h3>
        </div>
        <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Negara</TableHead>
                <TableHead>AIR/SEA</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Status Barang</TableHead>
                <TableHead>Status Shipment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 dark:text-fg-muted py-8">
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold text-slate-800 dark:text-fg">{s.shipmentName}</TableCell>
                    <TableCell>{labelOf(brandOptions, s.brandId)}</TableCell>
                    <TableCell>{labelOf(countryOptions, s.countryId)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.airSea}</Badge>
                    </TableCell>
                    <TableCell>{s.tanggalKedatangan || "BELUM ADA ETA"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BARANG_BADGE[s.statusBarang]}>{s.statusBarang}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{s.statusShipment}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
