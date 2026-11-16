"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`bg-white w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} rounded-t-lg sm:rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.2)] max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="font-semibold text-xl text-ink">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted row-hover"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
