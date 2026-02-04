"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PLATFORMS } from "@/lib/constants";
import type { PostPlatform, PostStatus, Department } from "@/types";

interface FieldErrors {
  scheduled_date?: string;
  scheduled_time?: string;
  platform?: string;
  department_id?: string;
  content?: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [formData, setFormData] = useState({
    department_id: "",
    platform: "" as PostPlatform | "",
    scheduled_date: "",
    scheduled_time: "",
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
          // Auto-select default department
          const defaultDept = data.find(d => d.is_default);
          if (defaultDept) {
            setFormData(prev => ({ ...prev, department_id: defaultDept.id }));
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

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "scheduled_date":
        return !value ? "תאריך פרסום הוא שדה חובה" : undefined;
      case "scheduled_time":
        return !value ? "שעת פרסום היא שדה חובה" : undefined;
      case "platform":
        return !value ? "פלטפורמה היא שדה חובה" : undefined;
      case "department_id":
        return !value ? "מחלקה היא שדה חובה" : undefined;
      case "content":
        return !value.trim() ? "תוכן הפוסט הוא שדה חובה" : undefined;
      default:
        return undefined;
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

  const isFormValid = (): boolean => {
    return !!(
      formData.scheduled_date &&
      formData.scheduled_time &&
      formData.platform &&
      formData.department_id &&
      formData.content.trim()
    );
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name as keyof typeof formData];
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = async (status: PostStatus) => {
    // Mark all fields as touched
    setTouched({
      scheduled_date: true,
      scheduled_time: true,
      platform: true,
      department_id: true,
      content: true,
    });

    if (!validateAll()) {
      return;
    }

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

      const selectedDept = departments.find(d => d.id === formData.department_id);

      const { createPost } = await import("@/lib/actions/posts");
      const { error } = await createPost({
        department: selectedDept?.name || "כללי",
        department_id: formData.department_id || null,
        platform: formData.platform as PostPlatform,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        content: formData.content,
        external_link: formData.external_link || null,
        attachment_url: attachmentUrl,
        status,
      });

      if (error) {
        setError(error);
        setLoading(false);
      } else {
        router.push("/posts");
      }
    } catch {
      setError("שגיאה ביצירת הפוסט");
      setLoading(false);
    }
  };

  const RequiredMark = () => <span className="text-red-500 mr-1">*</span>;

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">פוסט חדש</h2>

      <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 sm:p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium mb-1">
                <RequiredMark />
                תאריך פרסום
              </label>
              <input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                onBlur={() => handleBlur("scheduled_date")}
                className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.scheduled_date && fieldErrors.scheduled_date
                    ? "border-red-500"
                    : "border-gray-300 dark:border-[#3a3a3a]"
                }`}
                dir="ltr"
              />
              {touched.scheduled_date && fieldErrors.scheduled_date && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.scheduled_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium mb-1">
                <RequiredMark />
                שעת פרסום
              </label>
              <input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                onBlur={() => handleBlur("scheduled_time")}
                className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.scheduled_time && fieldErrors.scheduled_time
                    ? "border-red-500"
                    : "border-gray-300 dark:border-[#3a3a3a]"
                }`}
                dir="ltr"
              />
              {touched.scheduled_time && fieldErrors.scheduled_time && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.scheduled_time}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium mb-1">
                <RequiredMark />
                פלטפורמה
              </label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as PostPlatform })}
                onBlur={() => handleBlur("platform")}
                className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.platform && fieldErrors.platform
                    ? "border-red-500"
                    : "border-gray-300 dark:border-[#3a3a3a]"
                }`}
              >
                <option value="">בחר פלטפורמה</option>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {touched.platform && fieldErrors.platform && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.platform}</p>
              )}
            </div>

            <div>
              <label htmlFor="department_id" className="block text-sm font-medium mb-1">
                <RequiredMark />
                מחלקה
              </label>
              <select
                id="department_id"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                onBlur={() => handleBlur("department_id")}
                disabled={loadingDepartments}
                className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
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
                <p className="mt-1 text-sm text-red-500">{fieldErrors.department_id}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              <RequiredMark />
              תוכן הפוסט
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              onBlur={() => handleBlur("content")}
              rows={6}
              className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                touched.content && fieldErrors.content
                  ? "border-red-500"
                  : "border-gray-300 dark:border-[#3a3a3a]"
              }`}
              placeholder="כתוב את תוכן הפוסט כאן..."
            />
            {touched.content && fieldErrors.content && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.content}</p>
            )}
          </div>

          <div>
            <label htmlFor="external_link" className="block text-sm font-medium mb-1">
              קישור חיצוני (אופציונלי)
            </label>
            <input
              id="external_link"
              type="url"
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="attachment" className="block text-sm font-medium mb-1">
              קובץ מצורף (אופציונלי)
            </label>
            <input
              id="attachment"
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-200"
            />
            {selectedFile && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                נבחר: {selectedFile.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              PDF, תמונות (JPG, PNG, GIF, WebP), מסמכי Word
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "שומר..." : "שמור כטיוטה"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("pending_approval")}
              disabled={loading || !isFormValid()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isFormValid() ? "יש למלא את כל שדות החובה" : ""}
            >
              {loading ? "שולח..." : "שלח לאישור"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/posts")}
              disabled={loading}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
