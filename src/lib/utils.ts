import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind merge
 * @param inputs - Class names to combine
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert PostgreSQL int4[] data to Uint8Array
 * @param data - Array of integers or stringified array
 * @returns Uint8Array representation of the data
 */
export function int4ToUint8Array(
  data: number[] | string | unknown,
): Uint8Array {
  if (data == null) return new Uint8Array(0);

  if (Array.isArray(data)) return new Uint8Array(data);

  if (typeof data === "string") {
    if (data.trim().startsWith("[") && data.trim().endsWith("]")) {
      try {
        return new Uint8Array(JSON.parse(data));
      } catch {}
    }

    const cleanedData = data.trim().replace(/^\\x/, "");
    const bytes = new Uint8Array(Math.floor(cleanedData.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanedData.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  console.error("Unknown data type in int4ToUint8Array:", typeof data);
  return new Uint8Array(0);
}

/**
 * Convert Uint8Array to string
 * @param data - Uint8Array to convert
 * @returns String representation of the data
 */
export function uint8ArrayToString(data: Uint8Array): string {
  if (!data || data.length === 0) return "";

  return Array.from(data)
    .map((byte) => String.fromCharCode(byte))
    .join("");
}
