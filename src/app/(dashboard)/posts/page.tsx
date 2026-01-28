import Link from "next/link";
import { getPosts, getCurrentUserRole } from "@/lib/actions/posts";
import { getPlatformLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const [{ data: posts, error }, userRole] = await Promise.all([
    getPosts(),
    getCurrentUserRole(),
  ]);

  const isManager = userRole === "manager" || userRole === "super_admin";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">פוסטים</h2>
        <Link
          href="/posts/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          פוסט חדש
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {posts && posts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>אין פוסטים עדיין</p>
          <Link
            href="/posts/new"
            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            צור פוסט ראשון
          </Link>
        </div>
      )}

      {posts && posts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
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
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {post.status === "draft" ? "עריכה" : "צפייה"}
                    </Link>
                    {isManager && post.status === "pending_approval" && (
                      <Link
                        href={`/posts/${post.id}`}
                        className="text-green-600 hover:text-green-700 mr-4"
                      >
                        אישור
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
