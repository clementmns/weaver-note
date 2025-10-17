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
