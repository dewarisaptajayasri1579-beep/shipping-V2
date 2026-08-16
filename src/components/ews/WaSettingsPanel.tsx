"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card, Badge, Switch, TagInput, Input, Button, useToast } from "@/components/ui";
import { EWS_RULES, type EwsRuleDef } from "@/lib/data/ews-constants";

export interface WaSettingRow {
  ruleId: string;
  targetNumbers: string[];
  active: boolean;
  roles: string[];
}

const RuleWaCard: React.FC<{ rule: EwsRuleDef; setting: WaSettingRow }> = ({ rule, setting }) => {
  const router = useRouter();
  const toast = useToast();
  const [active, setActive] = useState(setting.active);
  const [targetNumbers, setTargetNumbers] = useState<string[]>(setting.targetNumbers);
  const [rolesText, setRolesText] = useState(setting.roles.join(", "));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ews/wa-settings/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active,
          targetNumbers,
          roles: rolesText
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan pengaturan");
        return;
      }
      toast.success("Pengaturan notifikasi disimpan");
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
        </div>
        <Switch checked={active} onChange={(e) => setActive(e.target.checked)} />
      </div>

      <TagInput label="Nomor/Grup WhatsApp Tujuan" value={targetNumbers} onChange={setTargetNumbers} placeholder="628xxxx atau nama grup, Enter untuk tambah" />
      <Input label="Role Penerima (pisahkan koma)" value={rolesText} onChange={(e) => setRolesText(e.target.value)} placeholder="operasional, manajemen" />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} isLoading={saving} onClick={save}>
          Simpan
        </Button>
      </div>
    </Card>
  );
};

export const WaSettingsPanel: React.FC<{ settings: WaSettingRow[] }> = ({ settings }) => {
  const settingMap = Object.fromEntries(settings.map((s) => [s.ruleId, s]));

  return (
    <div className="space-y-4">
      {EWS_RULES.map((r) => (
        <RuleWaCard key={r.id} rule={r} setting={settingMap[r.id]} />
      ))}
    </div>
  );
};
