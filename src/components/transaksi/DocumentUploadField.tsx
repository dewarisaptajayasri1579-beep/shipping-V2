"use client";

import React, { useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { FileUpload, useToast } from "@/components/ui";

/** Upload scan dokumen (PO/Invoice/PIB) — file langsung dikirim ke /api/upload begitu
 *  dipilih, hasil `url`-nya yang disimpan di form (bukan File object-nya). */
export const DocumentUploadField: React.FC<{
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}> = ({ label, value, onChange }) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal unggah file");
        return;
      }
      onChange(data.url);
      toast.success("File berhasil diunggah");
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <FileUpload
        label={label}
        onFilesChange={handleFiles}
        disabled={uploading}
        accept="image/*,.pdf"
        helperText={uploading ? "Mengunggah..." : "PDF atau gambar, maks 10MB."}
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-[var(--accent-primary)] hover:underline"
        >
          <FileText className="w-3.5 h-3.5" /> Lihat file terunggah <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
