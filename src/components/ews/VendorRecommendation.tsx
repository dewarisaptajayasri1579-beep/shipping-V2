"use client";

import React, { useMemo, useState } from "react";
import { Card, Select, Badge } from "@/components/ui";
import { Trophy } from "lucide-react";
import type { VendorScore } from "@/lib/vendor-scoring";

type OptionList = { value: string; label: string }[];

export const VendorRecommendation: React.FC<{
  scores: VendorScore[];
  vendorBrandIds: Record<string, string[]>;
  brandOptions: OptionList;
}> = ({ scores, vendorBrandIds, brandOptions }) => {
  const [brandFilter, setBrandFilter] = useState("");

  const filtered = useMemo(() => {
    const rows = brandFilter ? scores.filter((s) => (vendorBrandIds[s.vendorId] ?? []).includes(brandFilter)) : scores;
    return [...rows].filter((s) => s.shipmentCount > 0).sort((a, b) => b.finalScore - a.finalScore);
  }, [scores, vendorBrandIds, brandFilter]);

  return (
    <div className="space-y-6">
      <Card variant="panel" padding="lg" className="max-w-md">
        <Select label="Brand/Item" options={brandOptions} value={brandFilter} onChange={setBrandFilter} placeholder="Semua brand" />
      </Card>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-fg-muted">Belum ada vendor dengan histori transaksi untuk filter ini.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((s, i) => (
            <Card key={s.vendorId} variant="panel" padding="lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {i === 0 && s.dataSufficient && <Trophy className="w-5 h-5 text-amber-500" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800 dark:text-fg">{s.vendorName}</h3>
                      {!s.dataSufficient && <Badge variant="warning">Data belum cukup</Badge>}
                      {s.redFlagCount > 0 && <Badge variant="danger">{s.redFlagCount} red flag</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-fg-muted mt-1">
                      {s.reasons.length > 0 ? s.reasons.join(" · ") : "Belum ada data histori yang cukup untuk dijelaskan"}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-fg">{s.finalScore}</p>
                  <p className="text-[11px] text-slate-500 dark:text-fg-muted">skor rekomendasi</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
