import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ReasoningStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export function getReasoningStyle(text: string | undefined): ReasoningStyle {
  if (!text) {
    return {
      backgroundColor: "bg-gray-500/10",
      textColor: "text-gray-700 dark:text-gray-300",
      borderColor: "border-gray-500/30",
    };
  }

  if (text.includes("🔥")) {
    return {
      backgroundColor: "bg-orange-500/10",
      textColor: "text-green-700 dark:text-green-300",
      borderColor: "border-orange-500/30",
    };
  }

  if (text.includes("⚠️")) {
    return {
      backgroundColor: "bg-red-500/10",
      textColor: "text-red-700 dark:text-red-300",
      borderColor: "border-red-500/30",
    };
  }

  return {
    backgroundColor: "bg-blue-500/10",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-500/30",
  };
}
