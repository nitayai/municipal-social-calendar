"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLATFORMS } from "@/lib/constants";
import type { Department, PostPlatform, PostStatus, UserRole } from "@/types";

const PLATFORM_COLORS: Record<PostPlatform, string> = {
  facebook: "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  instagram: "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
  tiktok: "border-gray-400 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300",
  whatsapp: "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  story: "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
  reels: "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
  digital_signage: "border-cyan-300 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300",
};

const PLATFORM_SELECTED_COLORS: Record<PostPlatform, string> = {
  facebook: "border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 ring-2 ring-blue-400 dark:ring-blue-600",
  instagram: "border-pink-500 bg-pink-100 dark:border-pink-400 dark:bg-pink-800/40 text-pink-800 dark:text-pink-200 ring-2 ring-pink-400 dark:ring-pink-600",
  tiktok: "border-gray-600 bg-gray-100 dark:border-gray-400 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 ring-2 ring-gray-400 dark:ring-gray-500",
  whatsapp: "border-green-500 bg-green-100 dark:border-green-400 dark:bg-green-800/40 text-green-800 dark:text-green-200 ring-2 ring-green-400 dark:ring-green-600",
  story: "border-yellow-500 bg-yellow-100 dark:border-yellow-400 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200 ring-2 ring-yellow-400 dark:ring-yellow-600",
  reels: "border-purple-500 bg-purple-100 dark:border-purple-400 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 ring-2 ring-purple-400 dark:ring-purple-600",
  digital_signage: "border-cyan-500 bg-cyan-100 dark:border-cyan-400 dark:bg-cyan-800/40 text-cyan-800 dark:text-cyan-200 ring-2 ring-cyan-400 dark:ring-cyan-600",
};

interface FieldErrors {
  scheduled_date?: string;
  platforms?: string;
  department_id?: string;
  title?: string;
  content?: string;
}

interface PendingAttachment {
  type: "file" | "link";
  file?: File;
  url?: string;
  name?: string;
  previewName: string;
}

function isGoogleDriveUrl(url: string) {
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date") ?? "";
  const prefillPlatform = searchParams.get("platform") as PostPlatform | null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PostPlatform[]>(
    prefillPlatform ? [prefillPlatform] : []
  );

  // Attachment state
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkName, setNewLinkName] = useState("");

  const [formData, setFormData] = useState({
    department_id: "",
    scheduled_date: prefillDate,
    scheduled_time: "",
    title: "",
    content: "",
    notes: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { getDepartments, ensureDefaultDepartment } = await import("@/lib/actions/departments");
        const { getCurrentUserRole } = await import("@/lib/actions/posts");
        await ensureDefaultDepartment();
        const [{ data }, role] = await Promise.all([getDepartments(), getCurrentUserRole()]);
        if (data) {
          setDepartments(data);
          const defaultDept = data.find((d) => d.is_default);
          if (defaultDept) setFormData(prev => ({ ...prev, department_id: defaultDept.id }));
        }
        setUserRole(role);
      } catch { /* ignore */ }
      finally { setLoadingDepartments(false); }
    }
    loadData();
  }, []);

  const isManager = userRole === "manager" || userRole === "super_admin";

  const togglePlatform = (platform: PostPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
    setTouched(prev => ({ ...prev, platforms: true }));
    setFieldErrors(prev => ({ ...prev, platforms: undefined }));
  };

  const validateAll = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.scheduled_date) errors.scheduled_date = "תאריך פרסום הוא שדה חובה";
    if (selectedPlatforms.length === 0) errors.platforms = "יש לבחור לפחות פלטפורמה אחת";
    if (!formData.department_id) errors.department_id = "מחלקה היא שדה חובה";
    if (!formData.title.trim()) errors.title = "כותרת הפוסט היא שדה חובה";
    if (!formData.content.trim()) errors.content = "תוכן הפוסט הוא שדה חובה";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  const fieldClass = (name: string) =>
    `w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-[#1a1a1a] disabled:text-gray-500 ${
      touched[name] && fieldErrors[name as keyof FieldErrors]
        ? "border-red-400 dark:border-red-600"
        : "border-gray-300 dark:border-[#3a3a3a]"
    }`;

  // Attachment helpers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: PendingAttachment[] = files.map(f => ({
      type: "file", file: f, previewName: f.name,
    }));
    setPendingAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const name = newLinkName.trim() || (isGoogleDriveUrl(newLinkUrl) ? "Google Drive" : newLinkUrl);
    setPendingAttachments(prev => [...prev, { type: "link", url: newLinkUrl.trim(), name, previewName: name }]);
    setNewLinkUrl(""); setNewLinkName(""); setShowAddLink(false);
  };

  const removePendingAttachment = (idx: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (status: PostStatus) => {
    setTouched({ scheduled_date: true, platforms: true, department_id: true, title: true, content: true });
    if (!validateAll()) return;
    setLoading(true);
    setError(null);

    try {
      const selectedDept = departments.find(d => d.id === formData.department_id);
      const { createPost } = await import("@/lib/actions/posts");

      const { data: newPost, error: createError } = await createPost({
        department: selectedDept?.name || "כללי",
        department_id: formData.department_id || null,
        platforms: selectedPlatforms,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || "00:00",
        title: formData.title.trim() || null,
        content: formData.content,
        notes: formData.notes.trim() || null,
        status,
      });

      if (createError || !newPost) {
        setError(createError || "שגיאה ביצירת הפוסט");
        setLoading(false);
        return;
      }

      // Upload pending attachments
      if (pendingAttachments.length > 0) {
        const { createAttachment } = await import("@/lib/actions/posts");
        const { uploadFileToStorage } = await import("@/lib/upload");

        for (const att of pendingAttachments) {
          if (att.type === "file" && att.file) {
            const { url, error: uploadErr } = await uploadFileToStorage(att.file);
            if (!uploadErr && url) {
              await createAttachment({ post_id: newPost.id, type: "upload", url, name: att.file.name });
            }
          } else if (att.type === "link" && att.url) {
            await createAttachment({ post_id: newPost.id, type: "link", url: att.url, name: att.name ?? att.url });
          }
        }
      }

      router.push("/calendar");
    } catch {
      setError("שגיאה ביצירת הפוסט");
      setLoading(false);
    }
  };

  const isFormValid = () =>
    !!(formData.scheduled_date && selectedPlatforms.length > 0 && formData.department_id && formData.title.trim() && formData.content.trim());

  const RequiredMark = () => <span className="text-red-500 mr-1">*</span>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <button type="button" onClick={() => router.back()}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500" aria-label="חזור">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">פוסט חדש</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4 sm:p-6 space-y-4">

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5"><RequiredMark />תאריך פרסום</label>
              <input type="date" value={formData.scheduled_date}
                onChange={e => setFormData({...formData, scheduled_date: e.target.value})}
                onBlur={() => handleBlur("scheduled_date")} className={fieldClass("scheduled_date")} dir="ltr" />
              {touched.scheduled_date && fieldErrors.scheduled_date && <p className="mt-1 text-xs text-red-500">{fieldErrors.scheduled_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">שעת פרסום</label>
              <input type="time" value={formData.scheduled_time}
                onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
                className={fieldClass("scheduled_time")} dir="ltr" />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium mb-1.5"><RequiredMark />פלטפורמות</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedPlatforms.includes(p.value)
                      ? PLATFORM_SELECTED_COLORS[p.value]
                      : `${PLATFORM_COLORS[p.value]} hover:opacity-80`
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            {touched.platforms && fieldErrors.platforms && <p className="mt-1 text-xs text-red-500">{fieldErrors.platforms}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1.5"><RequiredMark />מחלקה</label>
            <select value={formData.department_id}
              onChange={e => setFormData({...formData, department_id: e.target.value})}
              onBlur={() => handleBlur("department_id")}
              disabled={loadingDepartments} className={fieldClass("department_id")}>
              <option value="">בחר מחלקה...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {touched.department_id && fieldErrors.department_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.department_id}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5"><RequiredMark />כותרת</label>
            <input type="text" value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              onBlur={() => handleBlur("title")} className={fieldClass("title")} placeholder="כותרת הפוסט..." />
            {touched.title && fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1.5"><RequiredMark />תוכן הפוסט</label>
            <textarea value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              onBlur={() => handleBlur("content")} rows={6}
              className={`${fieldClass("content")} resize-none`} placeholder="כתוב כאן את תוכן הפוסט..." />
            {touched.content && fieldErrors.content && <p className="mt-1 text-xs text-red-500">{fieldErrors.content}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">הערה <span className="text-xs font-normal text-gray-400">(אופציונלי)</span></label>
            <textarea value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="הערה פנימית על הפוסט..." />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium mb-2">קבצים וקישורים <span className="text-xs font-normal text-gray-400">(אופציונלי)</span></label>

            {/* Pending attachments list */}
            {pendingAttachments.length > 0 && (
              <div className="space-y-1.5 mb-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                {pendingAttachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <span className="text-xs text-gray-400 shrink-0">
                      {att.type === "link" ? (isGoogleDriveUrl(att.url ?? "") ? "🗂️" : "🔗") : "📎"}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{att.previewName}</span>
                    <button type="button" onClick={() => removePendingAttachment(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all" title="הסר">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dashed border-gray-300 dark:border-[#3a3a3a] rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-600 dark:text-gray-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                העלאת קבצים
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,.doc,.mp4,.mov,.avi,.webm"
                onChange={handleFileSelect} />
              <button type="button" onClick={() => setShowAddLink(!showAddLink)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dashed border-gray-300 dark:border-[#3a3a3a] rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-600 dark:text-gray-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                הוספת קישור
              </button>
            </div>

            {showAddLink && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] space-y-2">
                <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/..." dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={newLinkName} onChange={e => setNewLinkName(e.target.value)}
                  placeholder="שם לקישור (אופציונלי)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddLink} disabled={!newLinkUrl.trim()}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">הוסף</button>
                  <button type="button" onClick={() => { setShowAddLink(false); setNewLinkUrl(""); setNewLinkName(""); }}
                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">ביטול</button>
                </div>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-400">PDF, תמונות, סרטונים, Word · גם קישורי Google Drive</p>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>
          )}

          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
            <button type="button" onClick={() => handleSubmit("draft")} disabled={loading}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
              {loading ? "שומר..." : "שמירה כטיוטה"}
            </button>
            <button type="button" onClick={() => handleSubmit("pending_approval")} disabled={loading || !isFormValid()}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
              {loading ? "שולח..." : "שליחה לאישור"}
            </button>
            {isManager && (
              <button type="button" onClick={() => handleSubmit("approved")} disabled={loading || !isFormValid()}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
                {loading ? "שומר..." : "אישור פוסט"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
