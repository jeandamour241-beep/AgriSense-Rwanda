import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}

export function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
    xl: "px-8 py-4 text-base sm:text-lg gap-3 shadow-lg",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-emerald-950/30 hover:shadow-emerald-500/25 active:scale-[0.98] focus-visible:ring-emerald-400 focus-visible:ring-offset-emerald-950",
    secondary:
      "bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm focus-visible:ring-emerald-500",
    outline:
      "border border-white/30 text-white hover:bg-white/10 backdrop-blur-xs focus-visible:ring-white",
    ghost:
      "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-emerald-500",
  };

  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
}
