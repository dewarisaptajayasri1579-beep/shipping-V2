"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, type LucideIcon } from "lucide-react";
import type { NavItem } from "@/lib/nav-config";

function isItemActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/") || (pathname === "/" && href === "/dashboard");
}

export interface MobileQuickSheetProps {
  title: string;
  icon?: LucideIcon;
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const MobileQuickSheet: React.FC<MobileQuickSheetProps> = ({ title, icon: Icon, items, isOpen, onClose }) => {
  const pathname = usePathname() || "/dashboard";

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="glass-dropdown absolute bottom-0 inset-x-0 max-h-[70vh] rounded-t-3xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/60 dark:border-line flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-5 h-5 text-blue-700 dark:text-[var(--accent-primary)]" />}
            <span className="font-black text-base text-slate-800 dark:text-fg">{title}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-surface-hover dark:hover:bg-surface-hover text-slate-600 dark:text-fg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onClose}
              className={`block px-3.5 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                isItemActive(pathname, item.href)
                  ? "text-blue-700 bg-blue-50 dark:bg-[rgba(59,130,246,0.10)] dark:text-[#60A5FA]"
                  : "text-slate-700 dark:text-fg-secondary hover:bg-slate-100 dark:hover:bg-surface-hover"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
