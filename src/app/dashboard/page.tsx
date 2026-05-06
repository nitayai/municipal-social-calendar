import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  const isManager = profile?.role === "manager" || profile?.role === "super_admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold hover:text-gray-700 dark:hover:text-gray-300">
                מערכת עירונית
              </Link>
              <nav className="flex gap-6">
                <Link
                  href="/posts"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  פוסטים
                </Link>
                <Link
                  href="/calendar"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  לוח חודשי
                </Link>
                {isManager && (
                  <Link
                    href="/settings/departments"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    מחלקות
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  התנתק
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-2">דאשבורד</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          ברוך הבא למערכת ניהול התוכן העירונית
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/posts"
            className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">פוסטים</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              צור, ערוך ונהל פוסטים לרשתות החברתיות
            </p>
          </Link>

          <Link
            href="/calendar"
            className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">לוח שנה</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              צפה בלוח הזמנים של הפוסטים המתוכננים
            </p>
          </Link>

          {isManager && (
            <Link
              href="/settings/departments"
              className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium mb-2">ניהול מחלקות</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                הוסף, ערוך ומחק מחלקות בארגון
              </p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
