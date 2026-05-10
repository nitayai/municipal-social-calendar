"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLATFORMS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeletePostButton } from "@/components/ui/delete-post-button";
import type { Post, PostPlatform, Department } from "@/types";

const PLATFORM_HEADER: Record<PostPlatform, { bg: string; label: string; icon: string }> = {
  facebook: { bg: "bg-blue-600", label: "Facebook", icon: "f" },
  instagram: { bg: "bg-gradient-to-r from-pink-500 to-purple-600", label: "Instagram", icon: "ig" },
  tiktok: { bg: "bg-gray-900", label: "TikTok", icon: "tk" },
  whatsapp: { bg: "bg-green-500", label: "WhatsApp", icon: "wa" },
  story: { bg: "bg-gradient-to-r from-yellow-400 to-pink-500", label: "Story", icon: "st" },
  reels: { bg: "bg-gradient-to-r from-purple-600 to-pink-600", label: "Reels", icon: "rl" },
};

function SocialPostPreview({ post }: { post: Post }) {
  const ph = PLATFORM_HEADER[post.platform] ?? PLATFORM_HEADER.facebook;
  const isImage = post.attachment_url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(post.attachment_url);
  const isPdf = post.attachment_url && /\.pdf(\?|$)/i.test(post.attachment_url);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-sm">
      <div className={`${ph.bg} px-4 py-2.5 flex items-center gap-2`}>
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">{ph.icon}</span>
        <span className="text-white text-sm font-semibold">{ph.label}</span>
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
      {post.external_link && (
        <div className="mx-4 mb-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
          <a href={post.external_link} target="_blank" rel="noopener noreferrer" className="block px-3 py-2.5 bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex-1">{post.external_link}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-gray-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      )}
      {post.attachment_url && (
        <div className="border-t border-gray-100 dark:border-[#222]">
          {isImage ? (
            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="block group">
              <div className="relative">
                <img src={post.attachment_url} alt="קובץ מצורף" className="w-full max-h-80 object-cover group-hover:opacity-90 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">פתח בחלון חדש</span>
                </div>
              </div>
            </a>
          ) : isPdf ? (
            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">מסמך PDF מצורף</p>
                <p className="text-xs text-red-500 dark:text-red-400">לחץ לפתיחה בחלון חדש</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400 mr-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          ) : (
            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1f1f1f] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">קובץ מצורף</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">לחץ לפתיחה בחלון חדש</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 mr-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      )}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-[#222]">
        <button className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
          </svg>
          <span>אהבתי</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <span>תגובה</span>
        </button>
      </div>
    </div>
  );
}

interface FieldErrors {
  scheduled_date?: string;
  scheduled_time?: string;
  platform?: string;
  department_id?: string;
  content?: string;
}

interface PostDetailClientProps {
  post: Post;
  isManager: boolean;
}

export function PostDetailClient({ post, isManager }: PostDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [scheduledChecked, setScheduledChecked] = useState(post.is_scheduled ?? false);
  const [scheduledTime, setScheduledTime] = useState(post.platform_scheduled_time ?? "");
  const [savingScheduled, setSavingScheduled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const canEdit = post.status === "draft" || (isManager && post.status === "pending_approval");
  const canApprove = isManager && post.status === "pending_approval";
  const isApproved = post.status === "approved" || post.status === "published";

  const [formData, setFormData] = useState({
    department_id: post.department_id || "",
    platform: post.platform,
    scheduled_date: post.scheduled_date,
    scheduled_time: post.scheduled_time,
    title: post.title || "",
    content: post.content,
    external_link: post.external_link || "",
  });

  useEffect(() => {
    async function loadDepartments() {
      try {
        const { getDepartments } = await import("@/lib/actions/departments");
        const { data } = await getDepartments();
        if (data) {
          setDepartments(data);
          if (!post.department_id) {
            const match = data.find((d) => d.name === post.department);
            const defaultDept = data.find((d) => d.is_default);
            if (match) setFormData((prev) => ({ ...prev, department_id: match.id }));
            else if (defaultDept) setFormData((prev) => ({ ...prev, department_id: defaultDept.id }));
          }
        }
      } catch (err) {
        console.error("Error loading departments:", err);
      } finally {
        setLoadingDepartments(false);
      }
    }
    loadDepartments();
  }, [post.department_id, post.department]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "scheduled_date": return !value ? "תאריך פרסום הוא שדה חובה" : undefined;
      case "scheduled_time": return !value ? "שעת פרסום היא שדה חובה" : undefined;
      case "platform": return !value ? "פלטפורמה היא שדה חובה" : undefined;
      case "department_id": return !value ? "מחלקה היא שדה חובה" : undefined;
      case "content": return !value.trim() ? "תוכן הפוסט הוא שדה חובה" : undefined;
      default: return undefined;
    }
  };

  const validateAll = (): boolean => {
    const errors: FieldErrors = {
      scheduled_date: validateField("scheduled_date", formData.scheduled_date),
      scheduled_time: validateField("scheduled_time", formData.scheduled_time),
      platform: validateField("platform", formData.platform),
      department_id: validateField("department_id", formData.department_id),
      content: validateField("content", formData.content),
    };
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const isFormValid = () =>
    !!(formData.scheduled_date && formData.scheduled_time && formData.platform && formData.department_id && formData.content.trim());

  const handleBlur = (name: string) => {
    if (!canEdit) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const value = formData[name as keyof typeof formData];
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const getAttachmentUrl = async (): Promise<string | null | undefined> => {
    if (!selectedFile) return post.attachment_url;
    const { uploadFileToStorage } = await import("@/lib/upload");
    const result = await uploadFileToStorage(selectedFile);
    if (result.error) { setError(result.error); return undefined; }
    return result.url;
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (submitForApproval) {
      setTouched({ scheduled_date: true, scheduled_time: true, platform: true, department_id: true, content: true });
      if (!validateAll()) return;
    }
    setLoading(true);
    setError(null);
    try {
      const attachmentUrl = await getAttachmentUrl();
      if (attachmentUrl === undefined) { setLoading(false); return; }
      const selectedDept = departments.find((d) => d.id === formData.department_id);
      const newStatus = submitForApproval ? "pending_approval" : post.status === "pending_approval" ? "pending_approval" : "draft";
      const { updatePost } = await import("@/lib/actions/posts");
      const { error } = await updatePost(post.id, {
        department: selectedDept?.name || post.department,
        department_id: formData.department_id || null,
        platform: formData.platform,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        title: formData.title.trim() || null,
        content: formData.content,
        external_link: formData.external_link || null,
        attachment_url: attachmentUrl,
        status: newStatus,
      });
      if (error) { setError(error); setLoading(false); }
      else { router.push("/posts"); router.refresh(); }
    } catch { setError("שגיאה בעדכון הפוסט"); setLoading(false); }
  };

  const handleApprove = async () => {
    setTouched({ scheduled_date: true, scheduled_time: true, platform: true, department_id: true, content: true });
    if (!validateAll()) return;
    setLoading(true);
    setError(null);
    try {
      const attachmentUrl = await getAttachmentUrl();
      if (attachmentUrl === undefined) { setLoading(false); return; }
      const selectedDept = departments.find((d) => d.id === formData.department_id);
      const { updatePost } = await import("@/lib/actions/posts");
      const { error: updateError } = await updatePost(post.id, {
        department: selectedDept?.name || post.department,
        department_id: formData.department_id || null,
        platform: formData.platform,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        title: formData.title.trim() || null,
        content: formData.content,
        external_link: formData.external_link || null,
        attachment_url: attachmentUrl,
      });
      if (updateError) { setError(updateError); setLoading(false); return; }
      const { approvePost } = await import("@/lib/actions/posts");
      const { error } = await approvePost(post.id, approvalComment || undefined);
      if (error) { setError(error); setLoading(false); }
      else { router.push("/posts"); router.refresh(); }
    } catch { setError("שגיאה באישור הפוסט"); setLoading(false); }
  };

  const handleReject = async () => {
    if (!approvalComment.trim()) { setError("יש להוסיף הערה בעת דחיית פוסט"); return; }
    setLoading(true);
    setError(null);
    try {
      const { rejectPost } = await import("@/lib/actions/posts");
      const { error } = await rejectPost(post.id, approvalComment);
      if (error) { setError(error); setLoading(false); }
      else { router.push("/posts"); router.refresh(); }
    } catch { setError("שגיאה בדחיית הפוסט"); setLoading(false); }
  };

  const handleRevertToDraft = async () => {
    if (!confirm("להחזיר את הפוסט לטיוטה לצורך עריכה?")) return;
    setLoading(true);
    setError(null);
    try {
      const { revertToDraft } = await import("@/lib/actions/posts");
      const { error } = await revertToDraft(post.id);
      if (error) { setError(error); setLoading(false); }
      else { router.refresh(); }
    } catch { setError("שגיאה בהחזרת הפוסט לטיוטה"); setLoading(false); }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("שגיאה בהעתקה");
    }
  };

  const handleScheduledChange = async (checked: boolean) => {
    setScheduledChecked(checked);
    if (!checked) {
      setSavingScheduled(true);
      try {
        const { updateScheduled } = await import("@/lib/actions/posts");
        await updateScheduled(post.id, false, null);
        setScheduledTime("");
      } finally {
        setSavingScheduled(false);
      }
    }
  };

  const handleScheduledTimeSave = async () => {
    setSavingScheduled(true);
    try {
      const { updateScheduled } = await import("@/lib/actions/posts");
      await updateScheduled(post.id, true, scheduledTime || null);
    } finally {
      setSavingScheduled(false);
    }
  };

  const RequiredMark = () => <span className="text-red-500 mr-1">*</span>;
  const fieldClass = (name: string) =>
    `w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${touched[name] && fieldErrors[name as keyof FieldErrors] ? "border-red-500" : "border-gray-300 dark:border-[#3a3a3a]"}`;

  const previewPost: Post = {
    ...post,
    title: formData.title || post.title,
    content: formData.content || post.content,
    platform: formData.platform || post.platform,
    external_link: formData.external_link || post.external_link,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold">
            {canApprove ? "בדיקה ואישור פוסט" : canEdit ? "עריכת פוסט" : "צפייה בפוסט"}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={post.status} />
          {/* Copy button — always visible */}
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            title="העתק טקסט הפוסט"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400">הועתק!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                <span>העתק</span>
              </>
            )}
          </button>
          {/* Edit button for approved posts */}
          {isApproved && (
            <button
              type="button"
              onClick={handleRevertToDraft}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-colors disabled:opacity-50"
              title="החזר לטיוטה לצורך עריכה"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              <span>עריכה מחדש</span>
            </button>
          )}
        </div>
      </div>

      <div className={`flex flex-col ${canApprove || post.status !== "draft" ? "lg:flex-row" : ""} gap-6`}>
        {/* Edit / view form */}
        <div className={`${canApprove || post.status !== "draft" ? "lg:w-1/2" : "max-w-2xl"} bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-xl p-4 sm:p-6`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}תאריך פרסום</label>
                <input id="scheduled_date" type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} onBlur={() => handleBlur("scheduled_date")} disabled={!canEdit} className={fieldClass("scheduled_date")} dir="ltr" />
                {canEdit && touched.scheduled_date && fieldErrors.scheduled_date && <p className="mt-1 text-xs text-red-500">{fieldErrors.scheduled_date}</p>}
              </div>
              <div>
                <label htmlFor="scheduled_time" className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}שעת פרסום</label>
                <input id="scheduled_time" type="time" value={formData.scheduled_time} onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })} onBlur={() => handleBlur("scheduled_time")} disabled={!canEdit} className={fieldClass("scheduled_time")} dir="ltr" />
                {canEdit && touched.scheduled_time && fieldErrors.scheduled_time && <p className="mt-1 text-xs text-red-500">{fieldErrors.scheduled_time}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="platform" className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}פלטפורמה</label>
                <select id="platform" value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value as PostPlatform })} onBlur={() => handleBlur("platform")} disabled={!canEdit} className={fieldClass("platform")}>
                  <option value="">בחר פלטפורמה</option>
                  {PLATFORMS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
                {canEdit && touched.platform && fieldErrors.platform && <p className="mt-1 text-xs text-red-500">{fieldErrors.platform}</p>}
              </div>
              <div>
                <label htmlFor="department_id" className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}מחלקה</label>
                <select id="department_id" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} onBlur={() => handleBlur("department_id")} disabled={!canEdit || loadingDepartments} className={fieldClass("department_id")}>
                  <option value="">בחר מחלקה</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
                {canEdit && touched.department_id && fieldErrors.department_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.department_id}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1.5">כותרת <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">(מופיעה בגאנט)</span></label>
              <input id="title" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} disabled={!canEdit} className={fieldClass("title")} placeholder="כותרת הפוסט..." />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1.5">{canEdit && <RequiredMark />}תוכן הפוסט</label>
              <textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} onBlur={() => handleBlur("content")} disabled={!canEdit} rows={6} className={`${fieldClass("content")} resize-none`} />
              {canEdit && touched.content && fieldErrors.content && <p className="mt-1 text-xs text-red-500">{fieldErrors.content}</p>}
            </div>
            <div>
              <label htmlFor="external_link" className="block text-sm font-medium mb-1.5">קישור חיצוני <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">(אופציונלי)</span></label>
              {canEdit ? (
                <input id="external_link" type="url" value={formData.external_link} onChange={(e) => setFormData({ ...formData, external_link: e.target.value })} className={fieldClass("external_link")} placeholder="https://example.com" dir="ltr" />
              ) : post.external_link ? (
                <a href={post.external_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  פתח קישור
                </a>
              ) : <p className="text-sm text-gray-400">לא הוגדר קישור</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">קובץ מצורף <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">(אופציונלי)</span></label>
              {canEdit ? (
                <>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-sm text-gray-500 dark:text-gray-400 file:ml-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="mt-1 text-xs text-gray-400">תמונות (JPG, PNG, GIF, WebP), PDF, מסמכי Word</p>
                  {selectedFile && <p className="mt-1 text-xs text-gray-500">קובץ חדש: {selectedFile.name}</p>}
                  {post.attachment_url && !selectedFile && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">קובץ קיים מצורף</p>}
                </>
              ) : post.attachment_url ? (
                <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  פתח קובץ מצורף
                </a>
              ) : <p className="text-sm text-gray-400">לא צורף קובץ</p>}
            </div>

            {/* Scheduling checkbox — visible for approved/published posts */}
            {isApproved && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_scheduled"
                    checked={scheduledChecked}
                    onChange={(e) => handleScheduledChange(e.target.checked)}
                    disabled={savingScheduled}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <label htmlFor="is_scheduled" className="text-sm font-medium text-emerald-800 dark:text-emerald-300 cursor-pointer select-none">
                    הפוסט תוזמן בפלטפורמה
                  </label>
                  {savingScheduled && <span className="text-xs text-gray-400">שומר...</span>}
                </div>
                {scheduledChecked && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-emerald-700 dark:text-emerald-400 shrink-0">שעת תזמון:</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      onBlur={handleScheduledTimeSave}
                      className="px-2 py-1 text-sm border border-emerald-300 dark:border-emerald-700 rounded-md bg-white dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleScheduledTimeSave}
                      disabled={savingScheduled}
                      className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md disabled:opacity-50"
                    >
                      {savingScheduled ? "..." : "שמור"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {post.approval_comment && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">הערת מנהל:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{post.approval_comment}</p>
              </div>
            )}
            {canApprove && (
              <div>
                <label htmlFor="approval_comment" className="block text-sm font-medium mb-1.5">הערה <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">(חובה בדחייה)</span></label>
                <textarea id="approval_comment" value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="הוסף הערה..." />
              </div>
            )}
            {error && <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>}
            <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-[#2a2a2a] flex-wrap">
              {canEdit && !canApprove && (
                <>
                  <button type="button" onClick={() => handleSave(false)} disabled={loading} className="px-4 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 disabled:opacity-50">{loading ? "שומר..." : "שמור"}</button>
                  {post.status === "draft" && <button type="button" onClick={() => handleSave(true)} disabled={loading || !isFormValid()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? "שולח..." : "שלח לאישור"}</button>}
                  <DeletePostButton postId={post.id} redirectAfter="/posts" className="px-4 py-2 text-red-600 hover:text-red-700 text-sm disabled:opacity-50" label="מחק" />
                </>
              )}
              {canApprove && (
                <>
                  <button type="button" onClick={handleApprove} disabled={loading || !isFormValid()} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{loading ? "מאשר..." : "✓ אשר פוסט"}</button>
                  <button type="button" onClick={handleReject} disabled={loading} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{loading ? "דוחה..." : "✕ דחה פוסט"}</button>
                  <button type="button" onClick={() => handleSave(false)} disabled={loading} className="px-4 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 disabled:opacity-50">שמור שינויים</button>
                </>
              )}
              <Link href="/posts" className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">חזרה לרשימה</Link>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        {(canApprove || post.status !== "draft") && (
          <div className={`${canApprove || post.status !== "draft" ? "lg:w-1/2" : "max-w-2xl"}`}>
            <div className="sticky top-20">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">תצוגה מקדימה</p>
              <SocialPostPreview post={previewPost} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
