import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the public ID from a Cloudinary URL.
 * @param url The Cloudinary URL.
 * @returns The public ID or null if not found.
 */
export function getPublicIdFromUrl(url: string): string | null {
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
