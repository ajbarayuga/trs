import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CtaButton — primary call-to-action button used across the app.
 *
 * Visual spec:
 *  - Background: bg-blue-900
 *  - Text: uppercase, font-medium, white
 *  - Shape: rounded-sm (rounded-xs equivalent in Tailwind v3)
 *  - Large variant (default): w-full max-w-sm h-14 text-base px-12
 *  - Active: slight scale-down for tactile feel
 *
 * Usage:
 *   <CtaButton href="/quote">Create a Quote Now</CtaButton>
 *   <CtaButton onClick={handleClick}>Begin</CtaButton>
 *   <CtaButton size="sm" href="/contact-sales">Talk to someone</CtaButton>
 */

interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  size?: "lg" | "sm";
  children: React.ReactNode;
  className?: string;
}

const BASE =
  "inline-flex items-center justify-center gap-2 bg-blue-900 text-white uppercase font-medium rounded-sm shadow-lg transition-all active:scale-95 hover:opacity-90";

const SIZES = {
  lg: "w-full max-w-sm h-14 text-base px-12 tracking-wide",
  sm: "h-9 text-xs px-6 tracking-widest",
};

export function CtaButton({
  href,
  size = "lg",
  children,
  className,
  ...props
}: CtaButtonProps) {
  const classes = cn(BASE, SIZES[size], className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
