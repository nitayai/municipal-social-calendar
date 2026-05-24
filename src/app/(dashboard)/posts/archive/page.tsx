import Link from "next/link";
import { getArchivedPosts, cleanupArchivedAttachments, getCurrentUserRole } from "@/lib/actions/posts";
import { getPlatformLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeletePostButton } from "@/components/ui/delete-post-button";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  // Run cleanup of stored files for archived posts, then load the archive list
  const [cleanupResult, { data: posts, error }, userRole] = await Promise.all([
    cleanupArchivedAttachments(),
    getArchivedPosts(),
    getCurrentUserRole(),
  ]);

  const isManager = userRole === "manager" || userRole === "super_admin";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Link href="/posts"
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500" aria-label="חזור">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">ארכיון פוסטים</h1>
        <span className="text-sm text-gray-400">פוסטים שתאריכם עבר</span>
      </div>

      {/* Cleanup notice */}
      {cleanupResult.deletedCount > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          נוקו {cleanupResult.deletedCount} קבצי storage מפוסטים ישנים לחיסכון במקום
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">{error}</div>
      )}

      {(!posts || posts.length === 0) && (
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-8 sm:p-12 text-center">
          <div className="text-gray-300 dark:text-gray-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-14 h-14 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">הארכיון ריק — אין פוסטים עם תאריך שעבר</p>
        </div>
      )}

      {posts && posts.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="relative bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 opacity-80 hover:opacity-100 transition-opacity">
                <DeletePostButton postId={post.id} className="absolute top-3 left-3 text-red-500 hover:text-red-700 dark:text-red-400 text-xs" label="✕" />
                <Link href={`/posts/${post.id}`} className="block">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className="text-sm font-medium">{post.platforms?.map(p => getPlatformLabel(p)).join(" + ") || ""}</span>
                    <StatusBadge status={post.status} />
                  </div>
                  {post.title && <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate">{post.title}</p>}
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                    <span>{new Date(post.scheduled_date).toLocaleDateString("he-IL")}</span>
                    <span>|</span>
                    <span>{post.department}</span>
                    {post.created_by_name && <span className="text-gray-400">נוצר ע״י: {post.created_by_name}</span>}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">פלטפורמה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">מחלקה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">כותרת</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">יוצר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors opacity-75 hover:opacity-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.scheduled_date).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{post.platforms?.map(p => getPlatformLabel(p)).join(" + ") || ""}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{post.department}</td>
                    <td className="px-6 py-4 text-sm max-w-[200px]">
                      <span className="truncate block text-gray-700 dark:text-gray-300">
                        {post.title || <span className="text-gray-400 italic text-xs">ללא כותרת</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      <div className="space-y-0.5">
                        {post.created_by_name && <div>{post.created_by_name}</div>}
                        {post.approved_by_name && <div className="text-emerald-600 dark:text-emerald-500">✓ {post.approved_by_name}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <Link href={`/posts/${post.id}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-500 transition-colors">
                          צפייה
                        </Link>
                        {isManager && (
                          <DeletePostButton postId={post.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            {posts.length} פוסטים בארכיון · קבצים מצורפים נמחקים אוטומטית לחיסכון במקום
          </p>
        </>
      )}
    </div>
  );
}
