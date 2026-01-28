import type { PostPlatform, PostStatus } from "@/types";

export const PLATFORMS: { value: PostPlatform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
];

export const POST_STATUSES: { value: PostStatus; label: string; color: string }[] = [
  { value: "draft", label: "טיוטה", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
  { value: "pending_approval", label: "ממתין לאישור", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { value: "rejected", label: "נדחה", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  { value: "approved", label: "מאושר", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { value: "published", label: "פורסם", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
];

export function getPlatformLabel(value: PostPlatform): string {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export function getStatusInfo(value: PostStatus) {
  return POST_STATUSES.find((s) => s.value === value) ?? POST_STATUSES[0];
}
