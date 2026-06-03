import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number): string {
  return `AED ${price.toFixed(2)}`
}

export function formatPurity(purity: number): string {
  return `${purity}%`
}
