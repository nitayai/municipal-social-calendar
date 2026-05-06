"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLATFORMS } from "@/lib/constants";
import type { PostPlatform, PostStatus, Department } from "@/types";

const PLATFORM_COLORS: Record<PostPlatform, string> = {
  facebook: "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  instagram: "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
  tiktok: "border-gray-400 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300",
  whatsapp: "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700 dark:text-green-300",
};

const PLATFORM_SELECTED_COLORS: Record<PostPlatform, string> = {
  facebook: "border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 ring-2 ring-blue-400 dark:ring-blue-600",
  instagram: "border-pink-500 bg-pink-100 dark:border-pink-400 dark:bg-pink-800/40 text-pink-800 dark:text-pink-200 ring-2 ring-pink-400 dark:ring-pink-600",
  tiktok: "border-gray-600 bg-gray-100 dark:border-gray-400 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 ring-2 ring-gray-400 dark:ring-gray-500",
  whatsapp: "border-green-500 bg-green-100 dark:border-green-400 dark:bg-green-800/40 text-green-800 dark:text-green-200 ring-2 ring-green-400 dark:ring-green-600",
};

interface FieldErrors {
  scheduled_date?: string;
  scheduled_time?: string;
  platforms?: string;
  department_id?: string;
  title?: string;
  content?: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PostPlatform[]>([]);

  const [formData, setFormData] = useState({
    department_id: "",
    scheduled_date: prefillDate,
    scheduled_time: "",
    title: "",
    content: "",
    external_link: "",
  });

  useEffect(() => {
    async function loadDepartments() {
      try {
        const { getDepartments, ensureDefaultDepartment } = await import("@/lib/actions/departments");
        await ensureDefaultDepartment();
        const { data } = await getDepartments();
        if (data) {
          setDepartments(data);
          const defaultDept = data.find((d) => d.is_default);
          if (defaultDept) {
            setFormData((prev) => ({ ...prev, department_id: defaultDept.id }));
          }
        }
      } catch (err) {
        console.error("Error loading departments:", err);
      } finally {
        setLoadingDepartments(false);
      }
    }
    loadDepartments();
  }, []);

  const togglePlatform = (platform: PostPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
    setTouched((prev) => ({ ...prev, platforms: true }));
    setFieldErrors((prev) => ({ ...prev, platforms: undefined }));
  };

  const validateAll = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.scheduled_date) errors.scheduled_date = "תאריך פרסום הוא שדה חובה";
    if (!formData.scheduled_time) errors.scheduled_time = "שעת פרסום היא שדה חובה";
    if (selectedPlatforms.length === 0) errors.platforms = "יש לבחור לפחות פלטפורמה אחת";
    if (!formData.department_id) errors.department_id = "מחלקה היא שדה חובה";
    if (!formData.title.trim()) errors.title = "כותרת הפוסט היא שדה חובה";
    if (!formData.content.trim()) errors.content = "תוכן הפוסט הוא שדה חובה";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (status: PostStatus) => {
    setTouched({
      scheduled_date: true,
      scheduled_time: true,
      platforms: true,
      department_id: true,
      title: true,
      content: true,
    });

    if (!validateAll()) return;

    setLoading(true);
    setError(null);

    try {
      let attachmentUrl: string | null = null;
      if (selectedFile) {
        const { uploadAttachment } = await import("@/lib/actions/posts");
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);
        const uploadResult = await uploadAttachment(fileFormData);
        if (uploadResult.error) {
          setError(uploadResult.error);
          setLoading(false);
          return;
        }
        attachmentUrl = uploadResult.url;
      }

      const selectedDept = departments.find((d) => d.id === formData.department_id);
      const { createPost } = await import("@/lib/actions/posts");

      const results = await Promise.all(
        selectedPlatforms.map((platform) =>
          createPost({
            department: selectedDept?.name || "כללי",
            department_id: formData.department_id || null,
            platform,
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            title: formData.title.trim() || null,
            content: formData.content,
            external_link: formData.external_link || null,
            attachment_url: attachmentUrl,
            status,
          })
        )
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        setError(`שגיאה ביצירת ${errors.length} פוסטים: ${errors[0].error}`);
        setLoading(false);
        return;
      }

      router.push("/posts");
    } catch {
      setError("שגיאה ביצירת הפוסט");
      setLoading(false);
    }
  };

  const RequiredMark = () => <span className="text-red-500 mr-1">*</span>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          aria-label="חזור"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-bold">פוסט חדש</h2>
      </div>

      <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-xl p-4 sm:p-6 max-w-2xl">
        <div className="space-y-5">

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium mb-1.5">
                <RequiredMark />
                תאריך פרסום
              </label>
              <input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                onBlur={() => handleBlur("scheduled_date")}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  touched.scheduled_date && fieldErrors.scheduled_date
                    ? "border-red-500"
                    : "border-gray-300 dark:border-[#3a3a3a]"
                }`}
                dir="ltr"
              />
              {touched.scheduled_date && fieldErrors.scheduled_date && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.scheduled_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium mb-1.5">
                <RequiredMark />
                שעת פרסום
              </label>
              <input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                onBlur={() => handleBlur("scheduled_time")}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  touched.scheduled_time && fieldErrors.scheduled_time
                    ? "border-red-500"
                    : "border-gray-300 dark:border-[#3a3a3a]"
                }`}
                dir="ltr"
              />
              {touched.scheduled_time && fieldErrors.scheduled_time && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.scheduled_time}</p>
              )}
            </div>
          </div>

          {/* Platform multi-select */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <RequiredMark />
              פלטפורמות
              {selectedPlatforms.length > 1 && (
                <span className="mr-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({selectedPlatforms.length} נבחרו — ייווצרו {selectedPlatforms.length} פוסטים)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-sm
                      transition-all duration-150 select-none
                      ${isSelected
                        ? PLATFORM_SELECTED_COLORS[p.value]
                        : `${PLATFORM_COLORS[p.value]} hover:opacity-80`
                      }
                    `}
                  >
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                    {p.label}
                  </button>
                );
              })}
            </div>
            {touched.platforms && fieldErrors.platforms && (
              <p className="mt-1.5 text-xs text-red-500">{fieldErrors.platforms}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department_id" className="block text-sm font-medium mb-1.5">
              <RequiredMark />
              מחלקה
            </label>
            <select
              id="department_id"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              onBlur={() => handleBlur("department_id")}
              disabled={loadingDepartments}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors ${
                touched.department_id && fieldErrors.department_id
                  ? "border-red-500"
                  : "border-gray-300 dark:border-[#3a3a3a]"
              }`}
            >
              <option value="">בחר מחלקה</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {touched.department_id && fieldErrors.department_id && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.department_id}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1.5">
              <RequiredMark />
              כותרת הפוסט
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-2">(תופיע בגאנט)</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => handleBlur("title")}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                touched.title && fieldErrors.title
                  ? "border-red-500"
                  : "border-gray-300 dark:border-[#3a3a3a]"
              }`}
              placeholder="לדוגמה: פוסט נחשים, פוסט ותיקים..."
            />
            {touched.title && fieldErrors.title && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1.5">
              <RequiredMark />
              תוכן הפוסט
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              onBlur={() => handleBlur("content")}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                touched.content && fieldErrors.content
                  ? "border-red-500"
                  : "border-gray-300 dark:border-[#3a3a3a]"
              }`}
              placeholder="כתוב את תוכן הפוסט כאן..."
            />
            {touched.content && fieldErrors.content && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.content}</p>
            )}
          </div>

          {/* External link */}
          <div>
            <label htmlFor="external_link" className="block text-sm font-medium mb-1.5">
              קישור חיצוני
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">(אופציונלי)</span>
            </label>
            <input
              id="external_link"
              type="url"
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>

          {/* File attachment */}
          <div>
            <label htmlFor="attachment" className="block text-sm font-medium mb-1.5">
              קובץ מצורף
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">(אופציונלי)</span>
            </label>
            <input
              id="attachment"
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 text-sm text-gray-500 dark:text-gray-400"
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                נבחר: {selectedFile.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
              PDF, תמונות (JPG, PNG, GIF, WebP), מסמכי Word
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "שומר..." : "שמור כטיוטה"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("pending_approval")}
              disabled={loading || !isFormValid()}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading
                ? "שולח..."
                : selectedPlatforms.length > 1
                ? `שלח לאישור (${selectedPlatforms.length} פוסטים)`
                : "שלח לאישור"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  function isFormValid(): boolean {
    return !!(
      formData.scheduled_date &&
      formData.scheduled_time &&
      selectedPlatforms.length > 0 &&
      formData.department_id &&
      formData.title.trim() &&
      formData.content.trim()
    );
  }
}
