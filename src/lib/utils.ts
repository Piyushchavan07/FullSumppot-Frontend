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

/**
 * Returns the best available banner for a community:
 * 1. Uploaded banner (getAssetUrl resolved)
 * 2. YouTube thumbnail derived from the latest link URL
 * 3. null (caller should render the gradient fallback)
 */
export function getCommunityBanner(bannerUrl?: string, latestLinkUrl?: string): string | null {
  if (bannerUrl) return getAssetUrl(bannerUrl);
  if (latestLinkUrl) {
    const videoId = latestLinkUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return null;
}

/**
 * Determines the support tier label and styling for a supporter
 * based on how many clicks they've given to a single link.
 */
export function getSupportTier(clickCount: number): {
  label: string;
  emoji: string;
  className: string;
} {
  if (clickCount >= 10) return { label: 'Champion',        emoji: '👑', className: 'bg-yellow-950/60 text-yellow-300 border-yellow-700/60' };
  if (clickCount >= 5)  return { label: 'Top Supporter',   emoji: '⭐', className: 'bg-orange-950/60 text-orange-300 border-orange-700/60' };
  if (clickCount >= 3)  return { label: 'Active Supporter', emoji: '🔥', className: 'bg-red-950/50 text-red-300 border-red-800/50' };
  return                       { label: 'Supporter',        emoji: '🤝', className: 'bg-surfaceHover text-textSecondary border-border' };
}
