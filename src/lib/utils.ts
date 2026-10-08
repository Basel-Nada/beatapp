import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "ر.س"): string {
  return `${amount.toLocaleString("ar-SA")} ${currency}`;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Clean phone and return in readable format
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}

export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}
