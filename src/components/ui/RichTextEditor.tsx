"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3 } from "lucide-react";

export interface RichTextEditorProps {
  label?: string;
  helperText?: string;
  error?: string;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const ToolbarButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode; label: string }> = ({
  active,
  onClick,
  children,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
      active ? "bg-[#0544cc] text-white" : "text-slate-600 dark:text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, helperText, error, value, onChange, placeholder, className = "" }) => {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder ?? "" })],
    content: value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rte-content focus:outline-none min-h-[140px] text-sm text-slate-800 dark:text-fg",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-fg-secondary select-none">{label}</label>}

      <div
        className={`w-full rounded-2xl bg-white/60 dark:bg-[var(--field-bg)] border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] backdrop-blur-md shadow-[0_2px_6px_rgba(0,0,0,0.02)] dark:shadow-none overflow-hidden ${
          error ? "border-red-500" : ""
        }`}
      >
        {editor && (
          <div className="flex items-center gap-1 px-2.5 py-2 border-b border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] bg-white/50 dark:bg-surface">
            <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
          </div>
        )}
        <div className="px-4 py-3">
          <EditorContent editor={editor} />
        </div>
      </div>

      {error ? (
        <span className="text-xs font-semibold text-red-500 dark:text-red-400">{error}</span>
      ) : helperText ? (
        <span className="text-xs font-medium text-slate-500 dark:text-fg-muted">{helperText}</span>
      ) : null}
    </div>
  );
};
