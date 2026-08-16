"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Check, Trash2 } from "lucide-react";
import { FilterableTable, type FilterableColumn, Badge, Button, StatTile, useToast } from "@/components/ui";
import { AlertTriangle, Bell, CheckCircle2, MessageCircleOff } from "lucide-react";
import { EWS_RULE_MAP, ALERT_STATUS, type AlertStatus, type AlertSeverity } from "@/lib/data/ews-constants";

export interface AlertLogRow {
  id: string;
  ruleId: string;
  refType: string;
  refId: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: string;
  notified: boolean;
}

const SEVERITY_BADGE: Record<AlertSeverity, "info" | "warning" | "danger"> = {
  info: "info",
  warning: "warning",
  critical: "danger",
};

const STATUS_BADGE: Record<AlertStatus, "warning" | "success"> = {
  "BELUM DITANGANI": "warning",
  "SUDAH DITANGANI": "success",
};

export const AlertLogTable: React.FC<{ logs: AlertLogRow[] }> = ({ logs }) => {
  const router = useRouter();
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const belumDitangani = logs.filter((l) => l.status === "BELUM DITANGANI").length;
  const critical = logs.filter((l) => l.severity === "critical" && l.status === "BELUM DITANGANI").length;
  const notified = logs.filter((l) => l.notified).length;

  const runCheck = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/ews/run", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error("Gagal menjalankan pengecekan");
        return;
      }
      const r = data?.data;
      toast.success(`Pengecekan selesai: ${r?.newAlertsCount ?? 0} alert baru, ${r?.dedupedCount ?? 0} sudah pernah dikirim (di-skip)`);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setRunning(false);
    }
  };

  const markHandled = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/ews/alert-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUDAH DITANGANI" }),
      });
      if (!res.ok) {
        toast.error("Gagal update status");
        return;
      }
      toast.success("Alert ditandai sudah ditangani");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: FilterableColumn<AlertLogRow>[] = [
    { key: "triggeredAt", header: "Tanggal", cell: (r) => r.triggeredAt },
    {
      key: "rule",
      header: "Aturan",
      cell: (r) => EWS_RULE_MAP[r.ruleId]?.label ?? r.ruleId,
      filterValue: (r) => EWS_RULE_MAP[r.ruleId]?.label ?? r.ruleId,
    },
    { key: "message", header: "Pesan", cell: (r) => <span className="text-sm">{r.message}</span>, filterValue: (r) => r.message },
    {
      key: "severity",
      header: "Severity",
      cell: (r) => <Badge variant={SEVERITY_BADGE[r.severity]}>{r.severity}</Badge>,
      filterOptions: [
        { value: "info", label: "info" },
        { value: "warning", label: "warning" },
        { value: "critical", label: "critical" },
      ],
      filterValue: (r) => r.severity,
    },
    {
      key: "notified",
      header: "WA",
      cell: (r) => (r.notified ? <Badge variant="success">Terkirim</Badge> : <Badge variant="secondary">Simulasi</Badge>),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>,
      filterOptions: ALERT_STATUS.map((s) => ({ value: s, label: s })),
      filterValue: (r) => r.status,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-10",
      cell: (r) =>
        r.status === "BELUM DITANGANI" ? (
          <Button variant="outline" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />} isLoading={updatingId === r.id} onClick={() => markHandled(r.id)}>
            Tandai Ditangani
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatTile label="Belum Ditangani" value={belumDitangani} icon={Bell} color="amber" />
        <StatTile label="Critical (Belum Ditangani)" value={critical} icon={AlertTriangle} color="rose" />
        <StatTile label="Notifikasi Terkirim" value={notified} icon={CheckCircle2} color="emerald" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-fg-muted flex items-center gap-1.5">
          <MessageCircleOff className="w-3.5 h-3.5" /> Di produksi ini dijalankan cron harian — sekarang trigger manual dulu.
        </p>
        <Button variant="primary" size="sm" leftIcon={<PlayCircle className="w-4 h-4" />} isLoading={running} onClick={runCheck}>
          Jalankan Pengecekan Sekarang
        </Button>
      </div>

      <FilterableTable columns={columns} rows={logs} rowKey={(r) => r.id} searchPlaceholder="Cari pesan alert..." pageSize={15} />
    </div>
  );
};
