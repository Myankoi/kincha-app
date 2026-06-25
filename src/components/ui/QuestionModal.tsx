"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Escape key handler & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            initial={{ y: "100vh", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100vh", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className={cn(
              "relative z-10 w-full max-w-lg max-h-[92vh] sm:max-h-[85vh]",
              "bg-white border-t-4 border-x-4 border-b-0 sm:border-b-4 border-black",
              "shadow-[0_-4px_0_0_#000] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
              "flex flex-col overflow-y-auto"
            )}
          >
            {/* Close Button Header */}
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={onClose}
                aria-label="Tutup pertanyaan"
                className={cn(
                  "p-2 bg-[#FFD600] border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000]",
                  "hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0px_0px_#000]",
                  "active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0px_0px_#000]",
                  "transition-all duration-100 focus:outline-none"
                )}
              >
                <X size={16} strokeWidth={3} className="text-black" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuestionModal;
