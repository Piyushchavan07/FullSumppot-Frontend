import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from '../config';

/**
 * Combines Tailwind CSS classes safely with tailwind-merge and clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves the dynamic base origin from the API_BASE_URL config.
 */
const getBaseOrigin = (): string => {
  try {
    const url = new URL(API_BASE_URL);
    return url.origin;
  } catch {
    return 'http://localhost:5230';
  }
};

/**
 * Resolves raw asset URLs to absolute URLs using the configured API base origin.
 */
export function getAssetUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const origin = getBaseOrigin();
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
