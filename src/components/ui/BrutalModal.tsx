"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BrutalButton } from "./BrutalButton";

type ModalVariant = "correct" | "incorrect" | "info" | "reset";

interface BrutalModalProps {
  open: boolean;
  variant?: ModalVariant;
  title: string;
  message: string;
  explanation?: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmLabel?: string;
  showReset?: boolean;
  onReset?: () => void;
}

const variantConfig: Record<
  ModalVariant,
  { accent: string; icon: string; headerBg: string }
> = {
  correct: {
    accent: "border-[#a3e635]",
    icon: "✅",
    headerBg: "bg-[#a3e635]",
  },
  incorrect: {
    accent: "border-[#f472b6]",
    icon: "❌",
    headerBg: "bg-[#f472b6]",
  },
  info: {
    accent: "border-[#22d3ee]",
    icon: "💡",
    headerBg: "bg-[#22d3ee]",
  },
  reset: {
    accent: "border-[#facc15]",
    icon: "🔄",
    headerBg: "bg-[#facc15]",
  },
};

function BrutalModal({
  open,
  variant = "info",
  title,
  message,
  explanation,
  onConfirm,
  onClose,
  confirmLabel = "Lanjutkan",
  showReset = false,
  onReset,
}: BrutalModalProps) {
  const config = variantConfig[variant];
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal content */}
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={cn(
              "relative z-50 w-full max-w-sm",
              "bg-white border-2 border-black",
              "shadow-[10px_10px_0_1px_#000]",
              config.accent
            )}
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-5 py-4",
                "border-b-2 border-black",
                config.headerBg
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {config.icon}
                </span>
                <h2
                  id="modal-title"
                  className="text-lg font-extrabold text-black leading-tight font-[family-name:var(--font-head)]"
                >
                  {title}
                </h2>
              </div>
              <button
                ref={firstFocusRef}
                onClick={onClose}
                aria-label="Tutup modal"
                className={cn(
                  "p-1.5 border-2 border-transparent",
                  "hover:bg-black/10 hover:border-black",
                  "transition-all duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                )}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-6 space-y-4">
              <p className="text-base leading-relaxed text-[#5A5A5A] font-[family-name:var(--font-sans)]">
                {message}
              </p>

              {explanation && (
                <div className="border-2 border-black p-4 bg-[#F5F5F0] shadow-[3px_3px_0_0_#000]">
                  <p className="text-sm font-semibold text-black mb-1 uppercase tracking-wide">
                    Penjelasan
                  </p>
                  <p className="text-sm leading-relaxed text-[#5A5A5A] font-[family-name:var(--font-sans)]">
                    {explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={cn(
                "flex gap-3 px-5 py-4",
                "border-t-2 border-black",
                showReset ? "flex-col" : "flex-row justify-end"
              )}
            >
              {showReset && onReset && (
                <BrutalButton
                  variant="danger"
                  size="base"
                  fullWidth
                  onClick={onReset}
                >
                  🔄 Reset Sesi
                </BrutalButton>
              )}
              <BrutalButton
                variant={variant === "correct" ? "lime" : variant === "incorrect" ? "pink" : "brand"}
                size="base"
                fullWidth={showReset}
                onClick={onConfirm}
              >
                {confirmLabel}
              </BrutalButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { BrutalModal };
export type { BrutalModalProps, ModalVariant };
