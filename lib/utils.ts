import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Initialize Firebase
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
