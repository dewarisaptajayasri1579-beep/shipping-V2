"use client";

import React from "react";
import { FileDown } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { exportToCsv } from "@/lib/export-csv";

export interface ExportDataset {
  key: string;
  label: string;
  description: string;
  rows: Record<string, unknown>[];
}

export const ExportPanel: React.FC<{ datasets: ExportDataset[] }> = ({ datasets }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {datasets.map((d) => (
        <Card key={d.key} variant="panel" padding="lg" className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-fg">{d.label}</h3>
            <p className="text-xs text-slate-500 dark:text-fg-muted mt-1">{d.description}</p>
            <p className="text-xs text-slate-400 dark:text-fg-muted mt-2">{d.rows.length} baris</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileDown className="w-4 h-4" />}
            disabled={d.rows.length === 0}
            onClick={() => exportToCsv(`${d.key}-${new Date().toISOString().slice(0, 10)}.csv`, d.rows)}
          >
            Export CSV
          </Button>
        </Card>
      ))}
    </div>
  );
};
