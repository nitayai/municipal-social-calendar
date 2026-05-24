"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getPlatformLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeletePostButton } from "@/components/ui/delete-post-button";
import type { Post } from "@/types";

type SortField = "scheduled_date" | "platform" | "department" | "title" | "status" | "updated_at";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  pending_approval: 0, draft: 1, approved: 2, published: 3, rejected: 4,
};

interface PostsListProps {
  posts: Post[];
  error: string | null;
  userRole: string | null;
}

export function PostsList({ posts, error, userRole }: PostsListProps) {
  const isManager = userRole === "manager" || userRole === "super_admin";
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "scheduled_date" || field === "updated_at" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "scheduled_date":
          cmp = `${a.scheduled_date}${a.scheduled_time}`.localeCompare(`${b.scheduled_date}${b.scheduled_time}`);
          break;
        case "platform":
          cmp = (a.platforms?.[0] ? getPlatformLabel(a.platforms[0]) : "").localeCompare(b.platforms?.[0] ? getPlatformLabel(b.platforms[0]) : "", "he");
          break;
        case "department":
          cmp = (a.department || "").localeCompare(b.department || "", "he");
          break;
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "", "he");
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          break;
        case "updated_at":
          cmp = (a.updated_at || "").localeCompare(b.updated_at || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [posts, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="opacity-30 text-xs">↕</span>;
    return <span className="text-blue-600 dark:text-blue-400 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const ThSort = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center justify-end gap-1">
        {label} <SortIcon field={field} />
      </span>
    </th>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">פוסטים</h2>
          <Link href="/posts/archive"
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border border-gray-200 dark:border-[#3a3a3a] rounded-md px-2 py-1 transition-colors">
            ארכיון
          </Link>
        </div>
        <Link
          href="/posts/new"
          className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-md transition-colors"
        >
          פוסט חדש
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8 sm:p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">אין פוסטים עדיין</p>
          <Link href="/posts/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            צור פוסט ראשון
          </Link>
        </div>
      )}

      {posts.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {sorted.map((post) => (
              <div key={post.id} className="relative bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 hover:shadow-md transition-shadow">
                <DeletePostButton postId={post.id} className="absolute top-3 left-3 text-red-500 hover:text-red-700 dark:text-red-400 text-xs" label="✕" />
                <Link href={`/posts/${post.id}`} className="block">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.platforms?.map(p => getPlatformLabel(p)).join(" + ") || ""}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{post.department}</span>
                    </div>
                    <StatusBadge status={post.status} />
                  </div>
                  {post.title && <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate">{post.title}</p>}
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                    <span>{new Date(post.scheduled_date).toLocaleDateString("he-IL")}</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span dir="ltr">{post.scheduled_time.slice(0, 5)}</span>
                    {post.is_scheduled && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-0.5">
                        🕐 מתוזמן{post.platform_scheduled_time ? ` ${post.platform_scheduled_time.slice(0,5)}` : ""}
                      </span>
                    )}
                  </div>
                  {post.content && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.content}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    {post.created_by_name && <span>נוצר ע״י: {post.created_by_name}</span>}
                    {post.approved_by_name && <span className="text-emerald-600 dark:text-emerald-500">אושר ע״י: {post.approved_by_name}</span>}
                    {post.updated_at && <span className="mr-auto">{new Date(post.updated_at).toLocaleDateString("he-IL")}</span>}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <ThSort field="scheduled_date" label="תאריך ושעה" />
                  <ThSort field="platform" label="פלטפורמה" />
                  <ThSort field="department" label="מחלקה" />
                  <ThSort field="title" label="כותרת" />
                  <ThSort field="status" label="סטטוס" />
                  <ThSort field="updated_at" label="עריכה" />
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">יוצר</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sorted.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <div>{new Date(post.scheduled_date).toLocaleDateString("he-IL")}</div>
                      <div className="text-xs text-gray-400" dir="ltr">{post.scheduled_time.slice(0, 5)}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{post.platforms?.map(p => getPlatformLabel(p)).join(", ") || ""}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{post.department}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className="truncate block max-w-[160px] text-gray-700 dark:text-gray-300">
                        {post.title || <span className="text-gray-400 dark:text-gray-600 italic text-xs">ללא כותרת</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <StatusBadge status={post.status} />
                        {post.is_scheduled && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400" title="מתוזמן בפלטפורמה">🕐</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {post.updated_at ? new Date(post.updated_at).toLocaleDateString("he-IL") : "—"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                      <div className="space-y-0.5">
                        {post.created_by_name && <div className="text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{post.created_by_name}</div>}
                        {post.approved_by_name && <div className="text-emerald-600 dark:text-emerald-500 truncate max-w-[100px]">✓ {post.approved_by_name}</div>}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/posts/${post.id}`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          {post.status === "draft" ? "עריכה" : "צפייה"}
                        </Link>
                        {isManager && post.status === "pending_approval" && (
                          <Link href={`/posts/${post.id}`} className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors">
                            אישור
                          </Link>
                        )}
                        <DeletePostButton postId={post.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
