"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card, Badge, Switch, Input, Button, useToast } from "@/components/ui";
import { EWS_RULES, type EwsRuleDef } from "@/lib/data/ews-constants";

export interface RuleConfigRow {
  ruleId: string;
  enabled: boolean;
  params: Record<string, number>;
}

const RuleCard: React.FC<{ rule: EwsRuleDef; config: RuleConfigRow }> = ({ rule, config }) => {
  const router = useRouter();
  const toast = useToast();
  const [enabled, setEnabled] = useState(config.enabled);
  const [params, setParams] = useState<Record<string, number>>(config.params);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ews/rule-configs/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, params }),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan pengaturan");
        return;
      }
      toast.success("Pengaturan disimpan");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="panel" padding="lg" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-fg">{rule.label}</h3>
            <Badge variant={rule.category === "fraud" ? "danger" : "warning"}>{rule.category === "fraud" ? "Fraud" : "Keterlambatan"}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-fg-muted mt-1">{rule.description}</p>
        </div>
        <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
      </div>

      {Object.entries(rule.params).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(rule.params).map(([key, def]) => (
            <Input
              key={key}
              type="number"
              label={`${def.label} (${def.suffix})`}
              value={params[key] ?? def.default}
              onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} isLoading={saving} onClick={save}>
          Simpan
        </Button>
      </div>
    </Card>
  );
};

export const ThresholdSettings: React.FC<{ configs: RuleConfigRow[] }> = ({ configs }) => {
  const configMap = Object.fromEntries(configs.map((c) => [c.ruleId, c]));
  const keterlambatan = EWS_RULES.filter((r) => r.category === "keterlambatan");
  const fraud = EWS_RULES.filter((r) => r.category === "fraud");

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-fg">5.1 Peringatan Dini Keterlambatan</h2>
        <div className="space-y-4">
          {keterlambatan.map((r) => (
            <RuleCard key={r.id} rule={r} config={configMap[r.id]} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-fg">5.2 Deteksi Dini Indikasi Fraud</h2>
        <div className="space-y-4">
          {fraud.map((r) => (
            <RuleCard key={r.id} rule={r} config={configMap[r.id]} />
          ))}
        </div>
      </div>
    </div>
  );
};
