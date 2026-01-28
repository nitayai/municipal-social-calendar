import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">ברוך הבא למערכת</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">פרטי משתמש</h3>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="font-medium w-24">דוא״ל:</dt>
              <dd className="text-gray-600 dark:text-gray-400" dir="ltr">
                {user?.email}
              </dd>
            </div>
            <div className="flex">
              <dt className="font-medium w-24">מזהה:</dt>
              <dd className="text-gray-600 dark:text-gray-400 text-sm" dir="ltr">
                {user?.id}
              </dd>
            </div>
          </dl>
        </div>

        <Link
          href="/posts"
          className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium mb-2">ניהול פוסטים</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            צור, ערוך ונהל פוסטים לרשתות החברתיות
          </p>
        </Link>
      </div>
    </div>
  );
}
