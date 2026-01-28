"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { getPlatformLabel, getStatusInfo } from "@/lib/constants";
import { getHebrewInfoForDates, type HebrewDateInfo } from "@/lib/hebrew-calendar";
import { getSpecialDaysForDates } from "@/lib/special-days";
import type { Post } from "@/types";

const DAYS_OF_WEEK = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// Stable department color palette
const DEPT_COLORS = [
  "bg-blue-200 dark:bg-blue-800",
  "bg-emerald-200 dark:bg-emerald-800",
  "bg-teal-200 dark:bg-teal-800",
  "bg-amber-200 dark:bg-amber-800",
  "bg-rose-200 dark:bg-rose-800",
  "bg-cyan-200 dark:bg-cyan-800",
  "bg-indigo-200 dark:bg-indigo-800",
  "bg-lime-200 dark:bg-lime-800",
];

function getDeptColor(department: string, deptMap: Map<string, number>): string {
  if (!deptMap.has(department)) {
    deptMap.set(department, deptMap.size);
  }
  return DEPT_COLORS[deptMap.get(department)! % DEPT_COLORS.length];
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  dateStr: string; // YYYY-MM-DD
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sunday
  const daysInMonth = lastDay.getDate();

  const grid: CalendarDay[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    grid.push({
      date: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      date: d,
      isCurrentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  // Next month padding to fill last row
  const remaining = 7 - (grid.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      grid.push({
        date: d,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
  }

  return grid;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { getPostsByMonth } = await import("@/lib/actions/posts");
      const { data } = await getPostsByMonth(year, month);
      setPosts(data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
  };

  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Pre-compute Hebrew info & special days for all visible dates
  const allDateStrs = useMemo(() => grid.map((c) => c.dateStr), [grid]);
  const hebrewMap = useMemo(() => getHebrewInfoForDates(allDateStrs), [allDateStrs]);
  const specialMap = useMemo(() => getSpecialDaysForDates(allDateStrs), [allDateStrs]);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const key = post.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  // Build stable department color map
  const { deptColorMap, allDepts } = useMemo(() => {
    const m = new Map<string, number>();
    const depts = [...new Set(posts.map((p) => p.department))].sort();
    depts.forEach((d, i) => m.set(d, i));
    return { deptColorMap: m, allDepts: depts };
  }, [posts]);

  const selectedPosts = selectedDay ? (postsByDate.get(selectedDay) ?? []) : [];
  const selectedHebrew = selectedDay ? hebrewMap.get(selectedDay) : undefined;
  const selectedSpecial = selectedDay ? specialMap.get(selectedDay) : undefined;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold">לוח חודשי</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            &larr; הקודם
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            היום
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            הבא &rarr;
          </button>
          <span className="text-lg font-semibold min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">טוען...</div>
      )}

      {!loading && (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {grid.map((cell, idx) => {
              const dayPosts = postsByDate.get(cell.dateStr) ?? [];
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDay;
              const hebrewInfo: HebrewDateInfo | undefined = hebrewMap.get(cell.dateStr);
              const specialDay = specialMap.get(cell.dateStr);

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() =>
                    setSelectedDay(cell.dateStr === selectedDay ? null : cell.dateStr)
                  }
                  className={`
                    min-h-[110px] border border-gray-100 dark:border-gray-800 p-1.5 text-right align-top
                    transition-colors cursor-pointer
                    ${!cell.isCurrentMonth ? "bg-gray-50 dark:bg-gray-950 opacity-40" : ""}
                    ${isSelected ? "ring-2 ring-blue-500 ring-inset" : ""}
                    ${hebrewInfo?.isShabbat && cell.isCurrentMonth ? "bg-gray-50/60 dark:bg-gray-800/40" : ""}
                    hover:bg-gray-50 dark:hover:bg-gray-800
                  `}
                >
                  <div className="flex flex-col h-full gap-0.5">
                    {/* Gregorian date */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`
                          text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0
                          ${isToday ? "bg-blue-600 text-white" : ""}
                        `}
                      >
                        {cell.date}
                      </span>
                      {hebrewInfo?.isShabbat && cell.isCurrentMonth && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">שבת</span>
                      )}
                    </div>

                    {/* Hebrew date */}
                    {hebrewInfo && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight px-0.5">
                        {hebrewInfo.display}
                      </span>
                    )}

                    {/* Jewish holiday */}
                    {hebrewInfo?.holiday && cell.isCurrentMonth && (
                      <div
                        className="text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        title={hebrewInfo.holiday}
                      >
                        {hebrewInfo.holiday}
                      </div>
                    )}

                    {/* Special / international day */}
                    {specialDay && cell.isCurrentMonth && (
                      <div
                        className="text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        title={specialDay}
                      >
                        {specialDay}
                      </div>
                    )}

                    {/* Posts */}
                    {cell.isCurrentMonth && dayPosts.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-auto">
                        {dayPosts.slice(0, 2).map((post) => {
                          const deptColor = getDeptColor(post.department, deptColorMap);
                          return (
                            <div
                              key={post.id}
                              className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${deptColor}`}
                              title={`${getPlatformLabel(post.platform)} - ${post.department}`}
                            >
                              {getPlatformLabel(post.platform)}
                            </div>
                          );
                        })}
                        {dayPosts.length > 2 && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
                            +{dayPosts.length - 2} נוספים
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected day detail panel */}
      {selectedDay && !loading && (
        <div className="mt-6 bg-white dark:bg-gray-900 shadow rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {new Date(selectedDay + "T00:00:00").toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              {selectedHebrew && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedHebrew.display}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedHebrew?.holiday && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {selectedHebrew.holiday}
                </span>
              )}
              {selectedSpecial && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {selectedSpecial}
                </span>
              )}
              {selectedHebrew?.isShabbat && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  שבת
                </span>
              )}
            </div>
          </div>

          {selectedPosts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">אין פרסומים מתוכננים</p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedPosts.map((post) => {
                const statusInfo = getStatusInfo(post.status);
                const deptColor = getDeptColor(post.department, deptColorMap);

                return (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${deptColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {getPlatformLabel(post.platform)}
                        </span>
                        <span
                          className="text-xs text-gray-500 dark:text-gray-400"
                          dir="ltr"
                        >
                          {post.scheduled_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {post.department}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px] hidden sm:block">
                      {post.content}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {!loading && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          {/* Holiday & special day legend */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900" />
            <span>חג יהודי</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900" />
            <span>יום מיוחד</span>
          </div>
          {/* Department legend */}
          {allDepts.map((dept) => {
            const color = getDeptColor(dept, deptColorMap);
            return (
              <div key={dept} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span>{dept}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
