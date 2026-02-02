/**
 * Formatting Utilities
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success-600";
  if (score >= 60) return "text-primary-600";
  if (score >= 40) return "text-warning-600";
  return "text-danger-600";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-700";
    case "entry_hit":
      return "bg-primary-100 text-primary-700";
    case "target_hit":
      return "bg-success-50 text-success-600";
    case "sl_hit":
      return "bg-danger-50 text-danger-600";
    case "expired":
      return "bg-warning-50 text-warning-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "entry_hit":
      return "In Position";
    case "target_hit":
      return "Target Hit";
    case "sl_hit":
      return "Stop Loss";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}
