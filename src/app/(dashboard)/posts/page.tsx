import Link from "next/link";
import { getPosts, getCurrentUserRole } from "@/lib/actions/posts";
import { getPlatformLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeletePostButton } from "@/components/ui/delete-post-button";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const [{ data: posts, error }, userRole] = await Promise.all([
    getPosts(),
    getCurrentUserRole(),
  ]);

  const isManager = userRole === "manager" || userRole === "super_admin";

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">פוסטים</h2>
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

      {posts && posts.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8 sm:p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">אין פוסטים עדיין</p>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            צור פוסט ראשון
          </Link>
        </div>
      )}

      {posts && posts.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="relative bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 hover:shadow-md transition-shadow">
                <DeletePostButton postId={post.id} className="absolute top-3 left-3 text-red-500 hover:text-red-700 dark:text-red-400 text-xs" label="✕" />
              <Link
                href={`/posts/${post.id}`}
                className="block"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getPlatformLabel(post.platform)}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{post.department}</span>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span>{new Date(post.scheduled_date).toLocaleDateString("he-IL")}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span dir="ltr">{post.scheduled_time.slice(0, 5)}</span>
                </div>
                {post.content && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {post.content}
                  </p>
                )}
              </Link>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    תאריך
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    שעה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    פלטפורמה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    מחלקה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(post.scheduled_date).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" dir="ltr">
                      {post.scheduled_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getPlatformLabel(post.platform)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {post.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/posts/${post.id}`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          {post.status === "draft" ? "עריכה" : "צפייה"}
                        </Link>
                        {isManager && post.status === "pending_approval" && (
                          <Link
                            href={`/posts/${post.id}`}
                            className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors"
                          >
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
