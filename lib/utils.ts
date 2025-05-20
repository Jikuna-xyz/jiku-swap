import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fungsi untuk memformat angka besar agar lebih mudah dibaca
export function formatNumber(value: bigint | number): string {
  return new Intl.NumberFormat('id-ID').format(Number(value))
}
