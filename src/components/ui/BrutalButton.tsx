"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant =
  | "brand"
  | "secondary"
  | "tertiary"
  | "success"
  | "danger"
  | "warning"
  | "dark"
  | "cyan"
  | "lime"
  | "pink"
  | "ghost";

type Size = "xs" | "sm" | "base" | "lg" | "xl";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  brand:
    "bg-[#FFDB33] text-black border-black hover:bg-[#FFCC00] focus-visible:ring-[#FAE583]",
  secondary:
    "bg-[#F5F5F0] text-black border-black hover:bg-[#EBEBEB] focus-visible:ring-[#EBEBEB]",
  tertiary:
    "bg-white text-black border-black hover:bg-[#F5F5F0] focus-visible:ring-[#EBEBEB]",
  success:
    "bg-[#16A34A] text-white border-black hover:bg-[#15803D] focus-visible:ring-[#DCFCE7]",
  danger:
    "bg-[#E63946] text-white border-black hover:bg-[#C41E30] focus-visible:ring-[#FECACA]",
  warning:
    "bg-[#F59E0B] text-black border-black hover:bg-[#D97706] focus-visible:ring-[#FEF3C7]",
  dark: "bg-black text-white border-black hover:bg-[#1A1A1A] focus-visible:ring-[#EBEBEB]",
  cyan: "bg-[#22d3ee] text-black border-black hover:bg-[#06b6d4] focus-visible:ring-[#22d3ee]",
  lime: "bg-[#a3e635] text-black border-black hover:bg-[#84cc16] focus-visible:ring-[#a3e635]",
  pink: "bg-[#f472b6] text-black border-black hover:bg-[#ec4899] focus-visible:ring-[#f472b6]",
  ghost:
    "bg-transparent text-black border-transparent hover:bg-[#F5F5F0] shadow-none focus-visible:ring-[#EBEBEB]",
};

const sizeClasses: Record<Size, string> = {
  xs: "text-xs px-3 py-1.5 min-h-[32px]",
  sm: "text-sm px-3 py-2 min-h-[36px]",
  base: "text-sm px-4 py-2.5 min-h-[44px]",
  lg: "text-base px-5 py-3 min-h-[48px]",
  xl: "text-base px-6 py-3.5 min-h-[52px]",
};

const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  (
    {
      variant = "brand",
      size = "lg",
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "border-2 font-semibold font-[family-name:var(--font-sans)]",
          "shadow-[3px_3px_0_0_#000]",
          "transition-all duration-100",
          "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000]",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000]",
          "focus-visible:outline-none focus-visible:ring-4",
          "cursor-pointer select-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          disabled &&
            "bg-[#F5F5F5] text-[#AEAEAE] border-[#BFBFBF] shadow-none cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none active:translate-x-0 active:translate-y-0",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BrutalButton.displayName = "BrutalButton";

export { BrutalButton };
export type { BrutalButtonProps, Variant as BrutalButtonVariant, Size as BrutalButtonSize };
