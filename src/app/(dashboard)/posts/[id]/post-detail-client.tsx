"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLATFORMS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Post, PostPlatform, Department } from "@/types";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const canEdit =
    post.status === "draft" ||
    (isManager && post.status === "pending_approval");
  const canApprove = isManager && post.status === "pending_approval";

  const [formData, setFormData] = useState({
    department_id: post.department_id || "",
    platform: post.platform,
    scheduled_date: post.scheduled_date,
    scheduled_time: post.scheduled_time,
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
          // If post has no department_id, try to match by name or use default
          if (!post.department_id) {
            const match = data.find(d => d.name === post.department);
            const defaultDept = data.find(d => d.is_default);
            if (match) {
              setFormData(prev => ({ ...prev, department_id: match.id }));
            } else if (defaultDept) {
              setFormData(prev => ({ ...prev, department_id: defaultDept.id }));
            }
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
    if (!canEdit) return;
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name as keyof typeof formData];
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (submitForApproval) {
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
    }

    setLoading(true);
    setError(null);

    try {
      let attachmentUrl: string | null = post.attachment_url;

      // Upload new file if selected
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

      const newStatus = submitForApproval
        ? "pending_approval"
        : post.status === "pending_approval"
          ? "pending_approval"
          : "draft";

      const { updatePost } = await import("@/lib/actions/posts");
      const { error } = await updatePost(post.id, {
        department: selectedDept?.name || post.department,
        department_id: formData.department_id || null,
        platform: formData.platform,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        content: formData.content,
        external_link: formData.external_link || null,
        attachment_url: attachmentUrl,
        status: newStatus,
      });

      if (error) {
        setError(error);
        setLoading(false);
      } else {
        router.push("/posts");
        router.refresh();
      }
    } catch {
      setError("שגיאה בעדכון הפוסט");
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    // Validate before approving
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
      // Save any field edits first
      let attachmentUrl: string | null = post.attachment_url;
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

      const { updatePost } = await import("@/lib/actions/posts");
      const { error: updateError } = await updatePost(post.id, {
        department: selectedDept?.name || post.department,
        department_id: formData.department_id || null,
        platform: formData.platform,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        content: formData.content,
        external_link: formData.external_link || null,
        attachment_url: attachmentUrl,
      });

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Then approve
      const { approvePost } = await import("@/lib/actions/posts");
      const { error } = await approvePost(post.id, approvalComment || undefined);

      if (error) {
        setError(error);
        setLoading(false);
      } else {
        router.push("/posts");
        router.refresh();
      }
    } catch {
      setError("שגיאה באישור הפוסט");
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!approvalComment.trim()) {
      setError("יש להוסיף הערה בעת דחיית פוסט");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { rejectPost } = await import("@/lib/actions/posts");
      const { error } = await rejectPost(post.id, approvalComment);

      if (error) {
        setError(error);
        setLoading(false);
      } else {
        router.push("/posts");
        router.refresh();
      }
    } catch {
      setError("שגיאה בדחיית הפוסט");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("האם למחוק את הפוסט?")) return;

    setLoading(true);
    try {
      const { deletePost } = await import("@/lib/actions/posts");
      const { error } = await deletePost(post.id);

      if (error) {
        setError(error);
        setLoading(false);
      } else {
        router.push("/posts");
      }
    } catch {
      setError("שגיאה במחיקת הפוסט");
      setLoading(false);
    }
  };

  const RequiredMark = () => <span className="text-red-500 mr-1">*</span>;

  const fieldClass = (name: string, base: string) =>
    `${base} ${
      touched[name] && fieldErrors[name as keyof FieldErrors]
        ? "border-red-500"
        : "border-gray-300 dark:border-[#3a3a3a]"
    }`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          {canEdit
            ? canApprove ? "בדיקה ואישור פוסט" : "עריכת פוסט"
            : "צפייה בפוסט"}
        </h2>
        <StatusBadge status={post.status} />
      </div>

      <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 sm:p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium mb-1">
                {canEdit && <RequiredMark />}
                תאריך פרסום
              </label>
              <input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                onBlur={() => handleBlur("scheduled_date")}
                disabled={!canEdit}
                className={fieldClass(
                  "scheduled_date",
                  "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                )}
                dir="ltr"
              />
              {canEdit && touched.scheduled_date && fieldErrors.scheduled_date && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.scheduled_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium mb-1">
                {canEdit && <RequiredMark />}
                שעת פרסום
              </label>
              <input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                onBlur={() => handleBlur("scheduled_time")}
                disabled={!canEdit}
                className={fieldClass(
                  "scheduled_time",
                  "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                )}
                dir="ltr"
              />
              {canEdit && touched.scheduled_time && fieldErrors.scheduled_time && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.scheduled_time}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium mb-1">
                {canEdit && <RequiredMark />}
                פלטפורמה
              </label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as PostPlatform })}
                onBlur={() => handleBlur("platform")}
                disabled={!canEdit}
                className={fieldClass(
                  "platform",
                  "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                <option value="">בחר פלטפורמה</option>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {canEdit && touched.platform && fieldErrors.platform && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.platform}</p>
              )}
            </div>

            <div>
              <label htmlFor="department_id" className="block text-sm font-medium mb-1">
                {canEdit && <RequiredMark />}
                מחלקה
              </label>
              <select
                id="department_id"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                onBlur={() => handleBlur("department_id")}
                disabled={!canEdit || loadingDepartments}
                className={fieldClass(
                  "department_id",
                  "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                <option value="">בחר מחלקה</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {canEdit && touched.department_id && fieldErrors.department_id && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.department_id}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              {canEdit && <RequiredMark />}
              תוכן הפוסט
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              onBlur={() => handleBlur("content")}
              disabled={!canEdit}
              rows={6}
              className={fieldClass(
                "content",
                "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            />
            {canEdit && touched.content && fieldErrors.content && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.content}</p>
            )}
          </div>

          <div>
            <label htmlFor="external_link" className="block text-sm font-medium mb-1">
              קישור חיצוני (אופציונלי)
            </label>
            {canEdit ? (
              <input
                id="external_link"
                type="url"
                value={formData.external_link}
                onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
                dir="ltr"
              />
            ) : post.external_link ? (
              <a
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                פתח קישור
              </a>
            ) : (
              <p className="text-sm text-gray-400">לא הוגדר קישור</p>
            )}
          </div>

          <div>
            <label htmlFor="attachment" className="block text-sm font-medium mb-1">
              קובץ מצורף (אופציונלי)
            </label>
            {canEdit ? (
              <>
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
                    קובץ חדש: {selectedFile.name}
                  </p>
                )}
                {post.attachment_url && !selectedFile && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    קובץ קיים מצורף
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  PDF, תמונות (JPG, PNG, GIF, WebP), מסמכי Word
                </p>
              </>
            ) : post.attachment_url ? (
              <a
                href={post.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                הורדת קובץ
              </a>
            ) : (
              <p className="text-sm text-gray-400">לא צורף קובץ</p>
            )}
          </div>

          {post.approval_comment && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm font-medium mb-1">הערת מנהל:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{post.approval_comment}</p>
            </div>
          )}

          {canApprove && (
            <div>
              <label htmlFor="approval_comment" className="block text-sm font-medium mb-1">
                הערה (חובה בדחייה)
              </label>
              <textarea
                id="approval_comment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="הוסף הערה..."
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 flex-wrap">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "שומר..." : "שמור"}
                </button>
                {post.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={loading || !isFormValid()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!isFormValid() ? "יש למלא את כל שדות החובה" : ""}
                  >
                    {loading ? "שולח..." : "שלח לאישור"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  מחק
                </button>
              </>
            )}

            {canApprove && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading || !isFormValid()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isFormValid() ? "יש למלא את כל שדות החובה" : ""}
                >
                  אשר פוסט
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  דחה פוסט
                </button>
              </>
            )}

            <Link
              href="/posts"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              חזרה לרשימה
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
