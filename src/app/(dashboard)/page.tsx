import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">ברוך הבא למערכת</h2>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">פרטי משתמש</h3>
          <dl className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <dt className="font-medium sm:w-24 text-sm sm:text-base">דוא״ל:</dt>
              <dd className="text-gray-600 dark:text-gray-400 text-sm break-all" dir="ltr">
                {user?.email}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <dt className="font-medium sm:w-24 text-sm sm:text-base">מזהה:</dt>
              <dd className="text-gray-600 dark:text-gray-400 text-xs break-all" dir="ltr">
                {user?.id}
              </dd>
            </div>
          </dl>
        </div>

        <Link
          href="/posts"
          className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow group"
        >
          <h3 className="text-base sm:text-lg font-medium mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">ניהול פוסטים</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            צור, ערוך ונהל פוסטים לרשתות החברתיות
          </p>
        </Link>
      </div>
    </div>
  );
}
