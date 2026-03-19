import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate unique meeting code
export function generateMeetingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

// Check if user is on same network (for P2P detection)
export function isLocalNetwork(ip: string): boolean {
  const localRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
  ];
  return localRanges.some((range) => range.test(ip));
}

// Network speed classification
export type NetworkQuality = "excellent" | "good" | "poor" | "critical";

export function classifyNetwork(bandwidth: number): NetworkQuality {
  if (bandwidth >= 2000) return "excellent"; // > 2 Mbps - HD video
  if (bandwidth >= 500) return "good"; // > 500 Kbps - SD video
  if (bandwidth >= 100) return "poor"; // > 100 Kbps - Audio only
  return "critical"; // < 100 Kbps - Struggling
}

// Throttle function for rate limiting
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
