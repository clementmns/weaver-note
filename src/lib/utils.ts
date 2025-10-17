import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const copyToClipboard = (text: string, message: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(message);
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
};

export const getGuestId = () => {
  try {
    const key = "weave_guest_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `guest_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch (_err: unknown) {
    console.error(_err);
    return `guest_${Math.random().toString(36).slice(2, 10)}`;
  }
};
