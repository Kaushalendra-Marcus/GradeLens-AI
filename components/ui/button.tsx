import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      default: "bg-[#1A1A1A] text-white hover:bg-black",
      ghost: "bg-transparent hover:bg-zinc-100",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-50",
    };
    const sizes: Record<string, string> = {
      default: "h-10 px-6 py-2",
      sm: "h-8 px-4 text-xs",
      icon: "h-9 w-9",
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  }
);
Button.displayName = "Button";
