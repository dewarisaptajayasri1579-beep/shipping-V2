"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { focusAdjacentField, focusFirstField } from "@/lib/focus-nav";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  closeOnBackdropClick = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Efek terpisah dari listener Escape di bawah, dan sengaja cuma depend ke `isOpen` —
  // bukan `onClose` juga — supaya CUMA jalan saat modal beneran baru kebuka, bukan tiap
  // parent re-render (mis. tiap ketikan di form manggil setState, yang bikin `onClose`
  // jadi closure baru tiap render kalau dia ikut jadi dependency; efek ini jadi re-run
  // tiap keystroke dan focusFirstField() nge-select ulang teks yang lagi diketik).
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    // Fokus field pertama begitu modal kebuka, biar bisa langsung ngetik tanpa klik.
    // Discope ke body content (bukan seluruh panel) supaya gak kepentok tombol close (X).
    requestAnimationFrame(() => {
      if (bodyRef.current) focusFirstField(bodyRef.current);
    });
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Enter di input teks biasa = pindah ke field berikutnya (kayak Tab), bukan diam.
  // Textarea (butuh newline), tombol (biar klik/buka-dropdown native jalan), dan search
  // box di dalam Select (Select ngurus advance-nya sendiri) sengaja gak disentuh di sini.
  const handleEnterAdvance = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.hasAttribute("data-select-search")) return;
    if (!(target instanceof HTMLInputElement)) return;
    e.preventDefault();
    focusAdjacentField(target, 1);
  };

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] h-[90vh]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Card */}
      <div
        ref={panelRef}
        data-modal-panel
        onKeyDown={handleEnterAdvance}
        className={`relative w-full ${sizeClasses[size]} glass-modal p-6 sm:p-8 rounded-[32px] shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between pb-4 border-b border-slate-200/60 dark:border-line mb-5 gap-4">
            <div>
              {title && typeof title === "string" ? (
                <h3 className="text-xl font-bold text-slate-800 dark:text-fg tracking-tight">{title}</h3>
              ) : (
                title
              )}
              {subtitle && typeof subtitle === "string" ? (
                <p className="text-sm text-slate-600 dark:text-fg-muted font-medium mt-1">{subtitle}</p>
              ) : (
                subtitle
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100/80 dark:bg-surface-hover hover:bg-slate-200/80 dark:hover:bg-surface-hover text-slate-600 dark:text-fg-secondary flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-5 mt-5 border-t border-slate-200/60 dark:border-line flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
