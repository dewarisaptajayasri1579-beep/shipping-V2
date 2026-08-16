"use client";

import React, { useMemo, useState } from "react";
import { Select, Badge } from "@/components/ui";
import { CHARGE_TYPES, CONTAINER_SIZES, INCOTERMS, type ChargeType, type ContainerSize, type Incoterm } from "@/lib/data/master-constants";

export interface RateRow {
  id: string;
  forwarderId: string;
  chargeType: ChargeType;
  containerSize: ContainerSize;
  incoterm: Incoterm;
  amount: number;
  effectiveDate: string;
}

type OptionList = { value: string; label: string }[];

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

/** Ambil rate terbaru (effectiveDate terbesar) per kombinasi forwarder+charge type,
 *  untuk containerSize & incoterm yang lagi difilter. */
function latestRate(rates: RateRow[], forwarderId: string, chargeType: ChargeType, containerSize: ContainerSize, incoterm: Incoterm): RateRow | null {
  const candidates = rates.filter(
    (r) => r.forwarderId === forwarderId && r.chargeType === chargeType && r.containerSize === containerSize && r.incoterm === incoterm
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, r) => (r.effectiveDate > latest.effectiveDate ? r : latest));
}

export const RateComparison: React.FC<{ rates: RateRow[]; forwarderOptions: OptionList }> = ({ rates, forwarderOptions }) => {
  const [containerSize, setContainerSize] = useState<ContainerSize>(CONTAINER_SIZES[0]);
  const [incoterm, setIncoterm] = useState<Incoterm>(INCOTERMS[0]);

  const totals = useMemo(() => {
    return forwarderOptions.map((fw) => {
      const perCharge = CHARGE_TYPES.map((ct) => ({ chargeType: ct, rate: latestRate(rates, fw.value, ct, containerSize, incoterm) }));
      const total = perCharge.reduce((sum, c) => sum + (c.rate?.amount ?? 0), 0);
      const hasAnyRate = perCharge.some((c) => c.rate !== null);
      return { forwarderId: fw.value, forwarderName: fw.label, perCharge, total, hasAnyRate };
    });
  }, [rates, forwarderOptions, containerSize, incoterm]);

  const withRate = totals.filter((t) => t.hasAnyRate);
  const cheapestId = withRate.length > 0 ? withRate.reduce((min, t) => (t.total < min.total ? t : min)).forwarderId : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Select label="Ukuran Kontainer" options={toOptions(CONTAINER_SIZES)} value={containerSize} onChange={(v) => setContainerSize(v as ContainerSize)} searchable={false} />
        <Select label="Incoterm" options={toOptions(INCOTERMS)} value={incoterm} onChange={(v) => setIncoterm(v as Incoterm)} searchable={false} />
      </div>

      {withRate.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-fg-muted">Belum ada rate untuk kombinasi kontainer/incoterm ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-line">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-surface-hover">
              <tr className="text-left text-xs font-bold text-slate-600 dark:text-fg-muted">
                <th className="px-4 py-3">Forwarder</th>
                {CHARGE_TYPES.map((ct) => (
                  <th key={ct} className="px-4 py-3">
                    {ct}
                  </th>
                ))}
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.forwarderId} className="border-t border-slate-100 dark:border-line">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-fg">
                    <div className="flex items-center gap-2">
                      {t.forwarderName}
                      {t.forwarderId === cheapestId && <Badge variant="success">Termurah</Badge>}
                    </div>
                  </td>
                  {t.perCharge.map((c) => (
                    <td key={c.chargeType} className="px-4 py-3">
                      {c.rate ? formatRupiah(c.rate.amount) : <span className="text-slate-400 dark:text-fg-muted">-</span>}
                    </td>
                  ))}
                  <td className={`px-4 py-3 font-extrabold ${t.forwarderId === cheapestId ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-fg"}`}>
                    {t.hasAnyRate ? formatRupiah(t.total) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
