import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GanttChart } from "@/components/ui/gantt-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">ברוך הבא למערכת</h2>
        <Link
          href="/posts/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          פוסט חדש
        </Link>
      </div>

      {/* Weekly Gantt — compact preview */}
      <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">גאנט שבועי</h3>
          <Link
            href="/calendar"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            לתצוגה מלאה &larr;
          </Link>
        </div>
        <GanttChart compact defaultView="weekly" showViewToggle={false} showTitle={false} />
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-3">
        <Link
          href="/posts"
          className="group bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-xl p-5 hover:shadow-md dark:hover:border-gray-600 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">ניהול פוסטים</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">צור, ערוך ונהל פוסטים</p>
            </div>
          </div>
        </Link>

        <Link
          href="/calendar"
          className="group bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-xl p-5 hover:shadow-md dark:hover:border-gray-600 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-600 dark:text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">גאנט פרסומים</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">לוח שבועי וחודשי</p>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 dark:text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">חשבון</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[160px]" dir="ltr">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
