"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLATFORMS, getPlatformLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeletePostButton } from "@/components/ui/delete-post-button";
import type { Post, PostAttachment, PostPlatform, Department } from "@/types";

// ─── Platform styles ────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<PostPlatform, string> = {
  facebook: "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  instagram: "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
  tiktok: "border-gray-400 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300",
  whatsapp: "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  story: "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
  reels: "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
  digital_signage: "border-cyan-300 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300",
};

const PLATFORM_HEADER: Record<PostPlatform, { bg: string; label: string; icon: string }> = {
  facebook: { bg: "bg-blue-600", label: "Facebook", icon: "f" },
  instagram: { bg: "bg-gradient-to-r from-pink-500 to-purple-600", label: "Instagram", icon: "ig" },
  tiktok: { bg: "bg-gray-900", label: "TikTok", icon: "tk" },
  whatsapp: { bg: "bg-green-500", label: "WhatsApp", icon: "wa" },
  story: { bg: "bg-gradient-to-r from-yellow-400 to-pink-500", label: "Story", icon: "st" },
  reels: { bg: "bg-gradient-to-r from-purple-600 to-pink-600", label: "Reels", icon: "rl" },
  digital_signage: { bg: "bg-gradient-to-r from-cyan-600 to-teal-600", label: "שילוט דיגיטלי", icon: "ds" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getFileType(url: string): "image" | "video" | "pdf" | "other" {
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return "image";
  if (/\.(mp4|mov|avi|webm|wmv|mkv)(\?|$)/i.test(url)) return "video";
  if (/\.pdf(\?|$)/i.test(url)) return "pdf";
  return "other";
}

function isGoogleDriveUrl(url: string) {
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

function AttachmentPreview({ att, onDelete, canDelete }: { att: PostAttachment; onDelete?: () => void; canDelete?: boolean }) {
  const fileType = att.type === "upload" ? getFileType(att.url) : null;
  const displayName = att.name || (isGoogleDriveUrl(att.url) ? "Google Drive" : att.url.split("/").pop()?.split("?")[0] || att.url);

  return (
    <div className="flex items-center gap-2 group">
      {att.type === "link" ? (
        <a href={att.url} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline min-w-0">
          {isGoogleDriveUrl(att.url) ? (
            <svg className="w-4 h-4 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.433 22l4-6.93H22l-4 6.93H4.433zm3.566-6.93L2 4.433l4-6.928 6 10.395L7.999 15.07zm10.001 0L12 4.433h8l6 10.637H18z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          )}
          <span className="truncate">{displayName}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 shrink-0 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      ) : fileType === "image" ? (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <span className="truncate">{displayName}</span>
        </a>
      ) : fileType === "video" ? (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 text-purple-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span className="truncate">{displayName}</span>
        </a>
      ) : fileType === "pdf" ? (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span className="truncate">{displayName}</span>
        </a>
      ) : (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
          <span className="truncate">{displayName}</span>
        </a>
      )}
      {canDelete && onDelete && (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="מחק קובץ">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────────

function SocialPostPreview({ post, attachments }: { post: Post; attachments: PostAttachment[] }) {
  const ph = PLATFORM_HEADER[post.platforms?.[0] ?? "facebook"] ?? PLATFORM_HEADER.facebook;
  const uploadedFiles = attachments.filter(a => a.type === "upload");
  const links = attachments.filter(a => a.type === "link");
  const firstImage = uploadedFiles.find(a => getFileType(a.url) === "image");
  const firstPdf = uploadedFiles.find(a => getFileType(a.url) === "pdf");

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-sm">
      <div className={`${ph.bg} px-4 py-2.5 flex items-center gap-2`}>
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">{ph.icon}</span>
        <span className="text-white text-sm font-semibold">{ph.label}</span>
        {post.platforms && post.platforms.length > 1 && (
          <span className="text-white/70 text-xs">+{post.platforms.length - 1}</span>
        )}
        <span className="text-white/70 text-xs mr-auto">{post.department}</span>
      </div>
      <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-[#222]">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">עיריית יהוד-מונוסון</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{post.department} · {post.scheduled_date} {post.scheduled_time.slice(0, 5)}</div>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>
      {links.length > 0 && (
        <div className="mx-4 mb-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg divide-y divide-gray-100 dark:divide-[#2a2a2a] overflow-hidden">
          {links.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex-1">{link.name || link.url}</span>
            </a>
          ))}
        </div>
      )}
      {firstImage && (
        <div className="border-t border-gray-100 dark:border-[#222]">
          <a href={firstImage.url} target="_blank" rel="noopener noreferrer" className="block group">
            <img src={firstImage.url} alt="קובץ מצורף" className="w-full max-h-80 object-cover group-hover:opacity-90 transition-opacity" />
          </a>
        </div>
      )}
      {!firstImage && firstPdf && (
        <div className="border-t border-gray-100 dark:border-[#222]">
          <a href={firstPdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div><p className="text-sm font-medium text-red-700 dark:text-red-300">מסמך PDF מצורף</p></div>
          </a>
        </div>
      )}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-[#222]">
        <button className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
          </svg><span>אהבתי</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg><span>תגובה</span>
        </button>
      </div>
    </div>
  );
}

// ─── Field classes ────────────────────────────────────────────────────────────────

interface FieldErrors {
  scheduled_date?: string;
  platforms?: string;
  department_id?: string;
  content?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────────

interface PostDetailClientProps {
  post: Post;
  isManager: boolean;
  initialAttachments: PostAttachment[];
}

export function PostDetailClient({ post, isManager, initialAttachments }: PostDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [scheduledChecked, setScheduledChecked] = useState(post.is_scheduled ?? false);
  const [scheduledTime, setScheduledTime] = useState(post.platform_scheduled_time ?? "");
  const [savingScheduled, setSavingScheduled] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Attachments state
  const [attachments, setAttachments] = useState<PostAttachment[]>(initialAttachments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkName, setNewLinkName] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const canEdit = post.status === "draft" || (isManager && post.status === "pending_approval");
  const canApprove = isManager && post.status === "pending_approval";
  const isApproved = post.status === "approved" || post.status === "published";

  const [formData, setFormData] = useState({
    department_id: post.department_id || "",
    platforms: post.platforms ?? [],
    scheduled_date: post.scheduled_date,
    scheduled_time: post.scheduled_time,
    title: post.title || "",
    content: post.content,
  });

  useEffect(() => {
    async function loadDepartments() {
      try {
        const { getDepartments } = await import("@/lib/actions/departments");
        const { data } = await getDepartments();
        if (data) setDepartments(data);
      } catch (err) {
        console.error("Error loading departments:", err);
      } finally {
        setLoadingDepartments(false);
      }
    }
    loadDepartments();
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────────

  const validateField = (name: string, value: unknown): string | undefined => {
    if (name === "scheduled_date" && !value) return "תאריך פרסום הוא שדה חובה";
    if (name === "platforms" && (!value || (value as PostPlatform[]).length === 0)) return "יש לבחור לפחות פלטפורמה אחת";
    if (name === "department_id" && !value) return "מחלקה היא שדה חובה";
    if (name === "content" && !(value as string)?.trim()) return "תוכן הפוסט הוא שדה חובה";
    return undefined;
  };

  const validateAll = (): boolean => {
    const errors: FieldErrors = {
      scheduled_date: validateField("scheduled_date", formData.scheduled_date),
      platforms: validateField("platforms", formData.platforms),
      department_id: validateField("department_id", formData.department_id),
      content: validateField("content", formData.content),
    };
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors;
    setFieldErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  const handleBlur = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  const fieldClass = (name: string) =>
    `w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-[#1a1a1a] disabled:text-gray-500 dark:disabled:text-gray-500 ${
      touched[name] && fieldErrors[name as keyof FieldErrors]
        ? "border-red-400 dark:border-red-600"
        : "border-gray-300 dark:border-[#3a3a3a]"
    }`;

  const isFormValid = () =>
    !!(formData.scheduled_date && formData.platforms.length > 0 && formData.department_id && formData.content.trim());

  // ── Attachment actions ────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setError(null);
    try {
      const { uploadFileToStorage } = await import("@/lib/upload");
      const { url, error: uploadErr } = await uploadFileToStorage(file);
      if (uploadErr || !url) { setError(uploadErr || "שגיאה בהעלאת הקובץ"); setUploadingFile(false); return; }
      const { createAttachment } = await import("@/lib/actions/posts");
      const { data, error: attErr } = await createAttachment({ post_id: post.id, type: "upload", url, name: file.name });
      if (attErr || !data) { setError(attErr || "שגיאה בשמירת הקובץ"); }
      else { setAttachments(prev => [...prev, data]); }
    } catch { setError("שגיאה בהעלאת הקובץ"); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) return;
    setError(null);
    try {
      const linkName = newLinkName.trim() || (isGoogleDriveUrl(newLinkUrl) ? "Google Drive" : newLinkUrl);
      const { createAttachment } = await import("@/lib/actions/posts");
      const { data, error: attErr } = await createAttachment({ post_id: post.id, type: "link", url: newLinkUrl.trim(), name: linkName });
      if (attErr || !data) { setError(attErr || "שגיאה בהוספת הקישור"); }
      else { setAttachments(prev => [...prev, data]); setNewLinkUrl(""); setNewLinkName(""); setShowAddLink(false); }
    } catch { setError("שגיאה בהוספת הקישור"); }
  };

  const handleDeleteAttachment = async (att: PostAttachment) => {
    if (!confirm(att.type === "upload" ? "למחוק את הקובץ?" : "למחוק את הקישור?")) return;
    setDeletingAttachmentId(att.id);
    try {
      if (att.type === "upload") {
        const { deleteFileFromStorage } = await import("@/lib/upload");
        await deleteFileFromStorage(att.url);
      }
      const { deleteAttachment } = await import("@/lib/actions/posts");
      const { error: delErr } = await deleteAttachment(att.id, post.id);
      if (delErr) { setError(delErr); }
      else { setAttachments(prev => prev.filter(a => a.id !== att.id)); }
    } catch { setError("שגיאה במחיקת הקובץ"); }
    finally { setDeletingAttachmentId(null); }
  };

  // ── Platform toggle ───────────────────────────────────────────────────────────

  const togglePlatform = (platform: PostPlatform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
    setTouched(prev => ({ ...prev, platforms: true }));
    setFieldErrors(prev => ({ ...prev, platforms: undefined }));
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async (submitForApproval: boolean) => {
    setTouched({ scheduled_date: true, platforms: true, department_id: true, content: true });
    if (!validateAll()) return;
    setLoading(true);
    setError(null);
    try {
      const selectedDept = departments.find(d => d.id === formData.department_id);
      const newStatus = submitForApproval ? "pending_approval" : post.status === "pending_approval" ? "pending_approval" : "draft";
      const { updatePost } = await import("@/lib/actions/posts");
      const { error: saveError } = await updatePost(post.id, {
        department: selectedDept?.name || post.department,
        department_id: formData.department_id || null,
        platforms: formData.platforms,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || "00:00",
        title: formData.title.trim() || null,
        content: formData.content,
        status: newStatus,
      });
      if (saveError) { setError(saveError); setLoading(false); }
      else { router.push("/calendar"); }
    } catch { setError("שגיאה בעדכון הפוסט"); setLoading(false); }
  };

  const handleApprove = async () => {
    setLoading(true); setError(null);
    try {
      const { approvePost } = await import("@/lib/actions/posts");
      const { error: e } = await approvePost(post.id, approvalComment);
      if (e) { setError(e); setLoading(false); }
      else { router.push("/posts"); router.refresh(); }
    } catch { setError("שגיאה באישור הפוסט"); setLoading(false); }
  };

  const handleReject = async () => {
    if (!approvalComment.trim()) { setError("יש להוסיף הערה לדחייה"); return; }
    setLoading(true); setError(null);
    try {
      const { rejectPost } = await import("@/lib/actions/posts");
      const { error: e } = await rejectPost(post.id, approvalComment);
      if (e) { setError(e); setLoading(false); }
      else { router.push("/posts"); router.refresh(); }
    } catch { setError("שגיאה בדחיית הפוסט"); setLoading(false); }
  };

  const handleRevertToDraft = async () => {
    if (!confirm("להחזיר את הפוסט לטיוטה לצורך עריכה?")) return;
    setLoading(true); setError(null);
    try {
      const { revertToDraft } = await import("@/lib/actions/posts");
      const { error: e } = await revertToDraft(post.id);
      if (e) { setError(e); setLoading(false); }
      else { setLoading(false); router.refresh(); }
    } catch { setError("שגיאה בהחזרת הפוסט לטיוטה"); setLoading(false); }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleScheduledChange = async (checked: boolean) => {
    setScheduledChecked(checked);
    setSavingScheduled(true);
    try {
      const { updateScheduled } = await import("@/lib/actions/posts");
      await updateScheduled(post.id, checked, checked ? scheduledTime || null : null);
    } finally { setSavingScheduled(false); }
  };

  const handleScheduledTimeChange = async (time: string) => {
    setScheduledTime(time);
    if (!scheduledChecked) return;
    setSavingScheduled(true);
    try {
      const { updateScheduled } = await import("@/lib/actions/posts");
      await updateScheduled(post.id, true, time || null);
    } finally { setSavingScheduled(false); }
  };

  const RequiredMark = () => <span className="text-red-500 mr-1">*</span>;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <button type="button" onClick={() => router.back()}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500" aria-label="חזור">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">
          {canApprove ? "בדיקה ואישור פוסט" : canEdit ? "עריכת פוסט" : "צפייה בפוסט"}
        </h1>
        <div className="mr-auto flex items-center gap-2">
          <StatusBadge status={post.status} />
          {isApproved && !canEdit && (
            <button type="button" onClick={handleRevertToDraft} disabled={loading}
              className="px-3 py-1.5 text-xs border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50">
              עריכה מחדש
            </button>
          )}
          <button type="button" onClick={handleCopyText}
            className="px-3 py-1.5 text-xs border border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1">
            {copied ? "✓ הועתק" : "העתק טקסט"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* ── Left: Edit form ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4 sm:p-6 space-y-4">

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}תאריך פרסום</label>
                <input type="date" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})}
                  onBlur={() => handleBlur("scheduled_date")} disabled={!canEdit} className={fieldClass("scheduled_date")} dir="ltr" />
                {canEdit && touched.scheduled_date && fieldErrors.scheduled_date && <p className="mt-1 text-xs text-red-500">{fieldErrors.scheduled_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">שעת פרסום</label>
                <input type="time" value={formData.scheduled_time} onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
                  disabled={!canEdit} className={fieldClass("scheduled_time")} dir="ltr" />
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}פלטפורמות</label>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.platforms.includes(p.value)
                          ? "border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 ring-2 ring-blue-400"
                          : `${PLATFORM_COLORS[p.value]} hover:opacity-80`
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.platforms.map(p => (
                    <span key={p} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${PLATFORM_COLORS[p]}`}>
                      {getPlatformLabel(p)}
                    </span>
                  ))}
                </div>
              )}
              {canEdit && touched.platforms && fieldErrors.platforms && <p className="mt-1 text-xs text-red-500">{fieldErrors.platforms}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}מחלקה</label>
              <select value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}
                onBlur={() => handleBlur("department_id")} disabled={!canEdit || loadingDepartments} className={fieldClass("department_id")}>
                <option value="">בחר מחלקה...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {canEdit && touched.department_id && fieldErrors.department_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.department_id}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5">כותרת</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                disabled={!canEdit} className={fieldClass("title")} placeholder="כותרת הפוסט..." />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}תוכן הפוסט</label>
              <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                onBlur={() => handleBlur("content")} disabled={!canEdit} rows={6}
                className={`${fieldClass("content")} resize-none`} />
              {canEdit && touched.content && fieldErrors.content && <p className="mt-1 text-xs text-red-500">{fieldErrors.content}</p>}
            </div>

            {/* Attachments section */}
            <div>
              <label className="block text-sm font-medium mb-2">קבצים וקישורים</label>

              {/* Existing attachments */}
              {attachments.length > 0 && (
                <div className="space-y-1.5 mb-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                  {attachments.map(att => (
                    <div key={att.id} className={deletingAttachmentId === att.id ? "opacity-50" : ""}>
                      <AttachmentPreview att={att} canDelete={canEdit}
                        onDelete={() => handleDeleteAttachment(att)} />
                    </div>
                  ))}
                </div>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  {/* Upload file */}
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dashed border-gray-300 dark:border-[#3a3a3a] rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50">
                    {uploadingFile ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                      </svg>
                    )}
                    {uploadingFile ? "מעלה..." : "העלה קובץ"}
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,.doc,.mp4,.mov,.avi,.webm"
                    onChange={handleFileUpload} />

                  {/* Add link */}
                  <button type="button" onClick={() => setShowAddLink(!showAddLink)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dashed border-gray-300 dark:border-[#3a3a3a] rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-600 dark:text-gray-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    הוסף קישור
                  </button>
                </div>
              )}

              {/* Add link form */}
              {canEdit && showAddLink && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] space-y-2">
                  <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                    placeholder="https://drive.google.com/..." dir="ltr"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={newLinkName} onChange={e => setNewLinkName(e.target.value)}
                    placeholder="שם לקישור (אופציונלי)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddLink} disabled={!newLinkUrl.trim()}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
                      הוסף
                    </button>
                    <button type="button" onClick={() => { setShowAddLink(false); setNewLinkUrl(""); setNewLinkName(""); }}
                      className="px-3 py-1.5 text-xs border border-gray-300 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scheduling */}
            {(post.status === "approved" || post.status === "published") && (
              <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={scheduledChecked} onChange={e => handleScheduledChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm">מתוזמן לפרסום</span>
                  {savingScheduled && <span className="text-xs text-gray-400">שומר...</span>}
                </label>
                {scheduledChecked && (
                  <div className="mt-2">
                    <input type="time" value={scheduledTime} onChange={e => handleScheduledTimeChange(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Approval comment */}
            {canApprove && (
              <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                <label className="block text-sm font-medium mb-1.5">הערה (אופציונלי)</label>
                <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="הוסף הערה..." />
              </div>
            )}

            {/* Approval comment display */}
            {post.approval_comment && !canApprove && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">הערת מנהל:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{post.approval_comment}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <DeletePostButton postId={post.id} redirectAfter="/posts"
                  className="px-4 py-2 text-red-600 hover:text-red-700 text-sm disabled:opacity-50" label="מחק" />
                <button type="button" onClick={() => handleSave(false)} disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 disabled:opacity-50">
                  שמור שינויים
                </button>
                {post.status === "draft" && (
                  <button type="button" onClick={() => handleSave(true)} disabled={loading || !isFormValid()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {loading ? "שולח..." : "שלח לאישור"}
                  </button>
                )}
                {canApprove && (
                  <>
                    <button type="button" onClick={handleReject} disabled={loading}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-700 dark:text-red-400 rounded-lg text-sm disabled:opacity-50">
                      דחה
                    </button>
                    <button type="button" onClick={handleApprove} disabled={loading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      {loading ? "מאשר..." : "אשר פוסט"}
                    </button>
                  </>
                )}
              </>
            )}
            <Link href="/posts" className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              חזרה לרשימה
            </Link>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4 sm:p-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">תצוגה מקדימה</h2>
            <SocialPostPreview post={{ ...post, ...formData }} attachments={attachments} />
          </div>
        </div>
      </div>
    </div>
  );
}
