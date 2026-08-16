"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  BOTTOM_BAR_DASHBOARD,
  BOTTOM_BAR_TRANSAKSI,
  BOTTOM_BAR_LAPORAN,
  BOTTOM_BAR_MORE_GROUPS,
  type NavItem,
} from "@/lib/nav-config";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { MobileQuickSheet } from "./MobileQuickSheet";

type SheetKey = "dashboard" | "transaksi" | "laporan" | "more" | null;

function groupIsActive(pathname: string, item: NavItem): boolean {
  return item.children?.some((child) => child.href && (pathname === child.href || pathname.startsWith(child.href + "/"))) ?? false;
}

export const BottomBar: React.FC = () => {
  const pathname = usePathname() || "/dashboard";
  const [activeSheet, setActiveSheet] = useState<SheetKey>(null);

  const isDashboardActive = groupIsActive(pathname, BOTTOM_BAR_DASHBOARD) || pathname === "/" || pathname === "/dashboard";
  const isTransaksiActive = groupIsActive(pathname, BOTTOM_BAR_TRANSAKSI);
  const isLaporanActive = groupIsActive(pathname, BOTTOM_BAR_LAPORAN);
  const isMoreActive = BOTTOM_BAR_MORE_GROUPS.some((g) => g.items.some((item) => groupIsActive(pathname, item)));

  const tabs: { key: SheetKey; label: string; icon: NavItem["icon"]; isActive: boolean }[] = [
    { key: "dashboard", label: "Dashboard", icon: BOTTOM_BAR_DASHBOARD.icon, isActive: isDashboardActive },
    { key: "laporan", label: "Laporan", icon: BOTTOM_BAR_LAPORAN.icon, isActive: isLaporanActive },
    { key: "transaksi", label: "Transaksi", icon: BOTTOM_BAR_TRANSAKSI.icon, isActive: isTransaksiActive },
    { key: "more", label: "Lainnya", icon: Menu, isActive: isMoreActive },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1">
        <div className="glass-header flex items-center justify-around rounded-2xl border border-white/70 dark:border-line shadow-xl px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSheet(tab.key)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 min-w-[64px] cursor-pointer"
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    tab.isActive
                      ? "bg-gradient-to-r from-[#0544cc] to-[#2563eb] text-white shadow-lg shadow-blue-600/30 dark:shadow-[0_0_18px_-2px_rgba(37,99,235,0.7)]"
                      : "text-slate-500 dark:text-fg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                </span>
                <span className={`text-[11px] font-bold ${tab.isActive ? "text-blue-700 dark:text-[var(--accent-primary)]" : "text-slate-500 dark:text-fg-muted"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <MobileQuickSheet
        title="Dashboard"
        icon={BOTTOM_BAR_DASHBOARD.icon}
        items={BOTTOM_BAR_DASHBOARD.children ?? []}
        isOpen={activeSheet === "dashboard"}
        onClose={() => setActiveSheet(null)}
      />
      <MobileQuickSheet
        title="Laporan"
        icon={BOTTOM_BAR_LAPORAN.icon}
        items={BOTTOM_BAR_LAPORAN.children ?? []}
        isOpen={activeSheet === "laporan"}
        onClose={() => setActiveSheet(null)}
      />
      <MobileQuickSheet
        title="Transaksi"
        icon={BOTTOM_BAR_TRANSAKSI.icon}
        items={BOTTOM_BAR_TRANSAKSI.children ?? []}
        isOpen={activeSheet === "transaksi"}
        onClose={() => setActiveSheet(null)}
      />
      <MobileNavDrawer groups={BOTTOM_BAR_MORE_GROUPS} isOpen={activeSheet === "more"} onClose={() => setActiveSheet(null)} />
    </>
  );
};
