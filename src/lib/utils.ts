import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Standard shadcn/ui utility — used throughout the component library.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
