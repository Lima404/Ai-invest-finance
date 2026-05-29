import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper padrao do shadcn-vue para compor classes Tailwind
export function cn (...inputs) {
  return twMerge(clsx(inputs))
}
