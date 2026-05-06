import type { PostPlatform, PostStatus } from "@/types";

export const PLATFORMS: { value: PostPlatform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
];

export const POST_STATUSES: { value: PostStatus; label: string; color: string }[] = [
  { value: "draft", label: "טיוטה", color: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300" },
  { value: "pending_approval", label: "ממתין לאישור", color: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
  { value: "rejected", label: "נדחה", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
  { value: "approved", label: "מאושר", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  { value: "published", label: "פורסם", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
];

export function getPlatformLabel(value: PostPlatform): string {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export function getStatusInfo(value: PostStatus) {
  return POST_STATUSES.find((s) => s.value === value) ?? POST_STATUSES[0];
}
