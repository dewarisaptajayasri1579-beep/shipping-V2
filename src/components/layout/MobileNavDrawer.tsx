"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { NAV_GROUPS, type NavGroup, type NavItem } from "@/lib/nav-config";
import { AppLogo } from "../ui/AppLogo";
import { APP_CONFIG } from "@/lib/app-config";

function isItemActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/") || (pathname === "/" && href === "/dashboard");
}

function containsActiveChild(pathname: string, item: NavItem): boolean {
  return item.children?.some((child) => isItemActive(pathname, child.href)) ?? false;
}

const DrawerNavItem: React.FC<{ item: NavItem; pathname: string; onNavigate: () => void }> = ({
  item,
  pathname,
  onNavigate,
}) => {
  const hasChildren = !!item.children?.length;
  const activeChild = hasChildren && containsActiveChild(pathname, item);
  const [isOpen, setIsOpen] = useState(activeChild);
  const isActive = isItemActive(pathname, item.href);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-colors ${
            activeChild ? "text-blue-700 bg-blue-50 dark:bg-[rgba(59,130,246,0.10)] dark:text-[#60A5FA]" : "text-slate-700 dark:text-fg-secondary hover:bg-slate-100 dark:hover:bg-surface-hover"
          }`}
        >
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="mt-1 ml-4 pl-4 border-l border-slate-200 dark:border-line space-y-1">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href!}
                onClick={onNavigate}
                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isItemActive(pathname, child.href)
                    ? "text-blue-700 bg-blue-50 dark:bg-[rgba(59,130,246,0.10)] dark:text-[#60A5FA]"
                    : "text-slate-600 dark:text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-hover"
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-colors ${
        isActive
          ? "text-white bg-gradient-to-r from-[#0544cc] to-[#2563eb]"
          : "text-slate-700 dark:text-fg-secondary hover:bg-slate-100 dark:hover:bg-surface-hover"
      }`}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span>{item.label}</span>
    </Link>
  );
};

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: NavGroup[];
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose, groups = NAV_GROUPS }) => {
  const pathname = usePathname() || "/dashboard";

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="glass-dropdown absolute bottom-0 inset-x-0 max-h-[85vh] rounded-t-3xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/60 dark:border-line flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" iconOnly={true} />
            <span className="font-black text-base text-slate-800 dark:text-fg">{APP_CONFIG.name}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-surface-hover dark:hover:bg-surface-hover text-slate-600 dark:text-fg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={group.group ?? groupIndex} className="space-y-1">
              {group.group && (
                <p className="px-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-fg-muted">{group.group}</p>
              )}
              {group.items.map((item) => (
                <DrawerNavItem key={item.label} item={item} pathname={pathname} onNavigate={onClose} />
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};
