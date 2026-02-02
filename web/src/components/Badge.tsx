/**
 * Badge Component
 */

import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "primary";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-success-50 text-success-600",
  danger: "bg-danger-50 text-danger-600",
  warning: "bg-warning-50 text-warning-600",
  primary: "bg-primary-100 text-primary-700",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
