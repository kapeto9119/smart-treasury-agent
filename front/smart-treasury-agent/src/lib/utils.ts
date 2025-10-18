import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-50",
    running: "text-blue-600 bg-blue-50",
    completed: "text-green-600 bg-green-50",
    failed: "text-red-600 bg-red-50",
    executed: "text-green-600 bg-green-50",
    cancelled: "text-gray-600 bg-gray-50",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
}

export function getRiskColor(risk: "low" | "medium" | "high"): string {
  const colors = {
    low: "text-green-600 bg-green-50",
    medium: "text-yellow-600 bg-yellow-50",
    high: "text-red-600 bg-red-50",
  };
  return colors[risk];
}
