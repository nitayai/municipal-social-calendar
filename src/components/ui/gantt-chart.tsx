"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStatusInfo, PLATFORMS } from "@/lib/constants";
import { getHebrewDateInfo } from "@/lib/hebrew-calendar";
import { getSpecialDay } from "@/lib/special-days";
import type { Post, PostPlatform, PostStatus } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const PLATFORM_STYLE: Record<PostPlatform, { header: string; chip: string; chipSelected: string; dot: string }> = {
  facebook: {
    header: "bg-blue-600 text-white",
    chip: "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
    chipSelected: "ring-2 ring-blue-400",
    dot: "bg-blue-600",
  },
  instagram: {
    header: "bg-gradient-to-r from-pink-500 to-purple-500 text-white",
    chip: "bg-pink-50 text-pink-800 border border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700",
    chipSelected: "ring-2 ring-pink-400",
    dot: "bg-pink-500",
  },
  tiktok: {
    header: "bg-gray-900 text-white",
    chip: "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600",
    chipSelected: "ring-2 ring-gray-400",
    dot: "bg-gray-700 dark:bg-gray-300",
  },
  whatsapp: {
    header: "bg-green-500 text-white",
    chip: "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700",
    chipSelected: "ring-2 ring-green-400",
    dot: "bg-green-500",
  },
  story: {
    header: "bg-gradient-to-r from-yellow-400 to-pink-500 text-white",
    chip: "bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-700",
    chipSelected: "ring-2 ring-yellow-400",
    dot: "bg-yellow-500",
  },
  reels: {
    header: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
    chip: "bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
    chipSelected: "ring-2 ring-purple-400",
    dot: "bg-purple-600",
  },
};

const STATUS_DOT: Record<PostStatus, string> = {
  draft: "bg-gray-400",
  pending_approval: "bg-amber-500",
  approved: "bg-emerald-500",
  published: "bg-blue-500",
  rejected: "bg-red-500",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function buildMonthGrid(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const grid: { date: Date; isCurrentMonth: boolean }[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    grid.push({ date: new Date(y, m, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 7 - (grid.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      grid.push({ date: new Date(y, m, d), isCurrentMonth: false });
    }
  }
  return grid;
}

// ─── Post Title Chip ──────────────────────────────────────────────────────────

function PostTitleChip({ post, compact = false }: { post: Post; compact?: boolean }) {
  const statusInfo = getStatusInfo(post.status);
  const style = PLATFORM_STYLE[post.platform];
  const displayTitle = post.title || post.content.slice(0, 20) + (post.content.length > 20 ? "..." : "");

  return (
    <Link
      href={`/posts/${post.id}`}
      onClick={(e) => e.stopPropagation()}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium w-full
        hover:opacity-80 transition-opacity cursor-pointer select-none
        ${style.chip}
      `}
      title={`${displayTitle} — ${statusInfo.label} — ${post.scheduled_time.slice(0, 5)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status] ?? "bg-gray-400"}`} />
      <span className="truncate min-w-0 flex-1">{displayTitle}</span>
      {!compact && (
        <span className="text-[10px] opacity-60 shrink-0 tabular-nums">{post.scheduled_time.slice(0, 5)}</span>
      )}
    </Link>
  );
}

// ─── Weekly Gantt (full) ──────────────────────────────────────────────────────

function WeeklyGanttFull({
  weekDays,
  posts,
  todayStr,
}: {
  weekDays: Date[];
  posts: Post[];
  todayStr: string;
}) {
  const router = useRouter();
  const dayDateStrs = weekDays.map(formatDateStr);

  // Group posts by platform then by date
  const postsByPlatformAndDate = useMemo(() => {
    const map = new Map<PostPlatform, Map<string, Post[]>>();
    for (const platform of PLATFORMS) {
      map.set(platform.value, new Map());
    }
    for (const post of posts) {
      const platformMap = map.get(post.platform);
      if (platformMap) {
        if (!platformMap.has(post.scheduled_date)) platformMap.set(post.scheduled_date, []);
        platformMap.get(post.scheduled_date)!.push(post);
      }
    }
    return map;
  }, [posts]);

  // Only show platforms that have posts, plus always show all 4 for empty state
  const platformsToShow = PLATFORMS;

  const handleCellClick = (dateStr: string, platform: PostPlatform) => {
    router.push(`/posts/new?date=${dateStr}&platform=${platform}`);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
      <div className="min-w-[900px]">
        {/* Column headers */}
        <div className="grid grid-cols-[110px_repeat(7,minmax(110px,1fr))] bg-gray-50 dark:bg-[#131313] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-[#2a2a2a]">
            פלטפורמה
          </div>
          {weekDays.map((day, i) => {
            const isToday = dayDateStrs[i] === todayStr;
            const hebrewInfo = getHebrewDateInfo(day);
            const specialDay = getSpecialDay(dayDateStrs[i]);
            const holiday = hebrewInfo.holiday || specialDay;
            const isShabbat = hebrewInfo.isShabbat;
            return (
              <div
                key={i}
                className={`px-1 py-2 text-center border-l border-gray-200 dark:border-[#2a2a2a] ${
                  isToday ? "bg-blue-50 dark:bg-blue-900/20" :
                  isShabbat ? "bg-purple-50/40 dark:bg-purple-900/10" : ""
                }`}
              >
                <div className={`text-[11px] font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : isShabbat ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"}`}>
                  {DAYS_OF_WEEK[day.getDay()]}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${isToday ? "text-blue-600 dark:text-blue-400" : isShabbat ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-200"}`}>
                  {day.getDate()}/{day.getMonth() + 1}
                </div>
                <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 leading-tight truncate px-0.5" title={hebrewInfo.display}>
                  {hebrewInfo.display}
                </div>
                {holiday && (
                  <div className="text-[9px] text-red-600 dark:text-red-400 mt-0.5 leading-tight truncate px-0.5" title={holiday}>
                    {holiday}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Platform rows */}
        {platformsToShow.map((platform, pIdx) => {
          const platformMap = postsByPlatformAndDate.get(platform.value) ?? new Map<string, Post[]>();
          const style = PLATFORM_STYLE[platform.value];
          const isLast = pIdx === platformsToShow.length - 1;

          return (
            <div
              key={platform.value}
              className={`grid grid-cols-[110px_repeat(7,minmax(110px,1fr))] ${!isLast ? "border-b border-gray-200 dark:border-[#2a2a2a]" : ""}`}
            >
              {/* Platform label */}
              <div className={`flex items-center gap-2 px-3 py-2 border-l border-gray-200 dark:border-[#2a2a2a] bg-gray-50/60 dark:bg-[#161616]`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {platform.label}
                </span>
              </div>

              {/* Day cells */}
              {weekDays.map((day, i) => {
                const dateStr = dayDateStrs[i];
                const isToday = dateStr === todayStr;
                const dayPosts = platformMap.get(dateStr) ?? [];

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCellClick(dateStr, platform.value)}
                    className={`
                      min-h-[72px] px-1.5 py-1.5 border-l border-gray-200 dark:border-[#2a2a2a]
                      flex flex-col gap-1 items-stretch text-right overflow-hidden
                      transition-colors cursor-pointer
                      ${isToday ? "bg-blue-50/40 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"}
                    `}
                  >
                    {dayPosts.map((post) => (
                      <PostTitleChip key={post.id} post={post} />
                    ))}
                    {dayPosts.length === 0 && (
                      <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-300 dark:text-gray-700">+</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Footer — add buttons per day */}
        <div className="grid grid-cols-[110px_repeat(7,minmax(110px,1fr))] bg-gray-50/30 dark:bg-[#111] border-t border-gray-200 dark:border-[#2a2a2a]">
          <div className="border-l border-gray-200 dark:border-[#2a2a2a] px-3 py-2 text-[10px] text-gray-400">
            הוסף פוסט
          </div>
          {weekDays.map((day, i) => {
            const dateStr = dayDateStrs[i];
            return (
              <div key={i} className="border-l border-gray-200 dark:border-[#2a2a2a] py-2 flex items-center justify-center">
                <Link
                  href={`/posts/new?date=${dateStr}`}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium"
                  title={`הוסף פוסט ל-${dateStr}`}
                >
                  +
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Gantt (compact, dashboard) ───────────────────────────────────────

function WeeklyGanttCompact({
  weekDays,
  posts,
  todayStr,
}: {
  weekDays: Date[];
  posts: Post[];
  todayStr: string;
}) {
  const router = useRouter();
  const dayDateStrs = weekDays.map(formatDateStr);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      if (!map.has(post.scheduled_date)) map.set(post.scheduled_date, []);
      map.get(post.scheduled_date)!.push(post);
    }
    return map;
  }, [posts]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[440px]">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {weekDays.map((day, i) => {
            const dateStr = dayDateStrs[i];
            const isToday = dateStr === todayStr;
            return (
              <div key={i} className="text-center">
                <div className={`text-[10px] font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {DAYS_OF_WEEK[day.getDay()].slice(0, 2)}׳
                </div>
                <div className={`text-sm font-bold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        {/* Posts per day */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const dateStr = dayDateStrs[i];
            const isToday = dateStr === todayStr;
            const dayPosts = postsByDate.get(dateStr) ?? [];
            return (
              <button
                key={i}
                type="button"
                onClick={() => router.push(`/posts/new?date=${dateStr}`)}
                className={`
                  min-h-[64px] p-1 rounded-lg flex flex-col gap-0.5 items-stretch
                  border transition-colors cursor-pointer
                  ${isToday
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-900/10"
                    : "border-gray-200 dark:border-[#2a2a2a] hover:border-blue-300 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  }
                `}
              >
                {dayPosts.slice(0, 3).map((post) => {
                  const style = PLATFORM_STYLE[post.platform];
                  const displayTitle = post.title || post.content.slice(0, 12) + "...";
                  return (
                    <div
                      key={post.id}
                      className={`text-[9px] px-1 py-0.5 rounded truncate ${style.chip}`}
                      title={displayTitle}
                    >
                      {displayTitle}
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 px-1">
                    +{dayPosts.length - 3}
                  </span>
                )}
                {dayPosts.length === 0 && (
                  <span className="text-xs text-gray-300 dark:text-gray-700 self-center mt-auto mb-auto">+</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Monthly Gantt ────────────────────────────────────────────────────────────

function MonthlyGantt({
  year,
  month,
  posts,
  todayStr,
}: {
  year: number;
  month: number;
  posts: Post[];
  todayStr: string;
}) {
  const router = useRouter();
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      if (!map.has(post.scheduled_date)) map.set(post.scheduled_date, []);
      map.get(post.scheduled_date)!.push(post);
    }
    return map;
  }, [posts]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-[#131313] border-b border-gray-200 dark:border-[#2a2a2a]">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-white dark:bg-[#171717]">
        {grid.map(({ date, isCurrentMonth }, idx) => {
          const dateStr = formatDateStr(date);
          const isToday = dateStr === todayStr;
          const dayPosts = isCurrentMonth ? (postsByDate.get(dateStr) ?? []) : [];
          const hebrewInfo = isCurrentMonth ? getHebrewDateInfo(date) : null;
          const specialDay = isCurrentMonth ? getSpecialDay(dateStr) : null;
          const holiday = hebrewInfo?.holiday || specialDay;
          const isShabbat = date.getDay() === 6;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => isCurrentMonth && router.push(`/posts/new?date=${dateStr}`)}
              disabled={!isCurrentMonth}
              className={`
                min-h-[90px] border border-gray-100 dark:border-[#222] p-1.5 text-right align-top transition-colors
                ${!isCurrentMonth ? "opacity-30 cursor-default bg-gray-50 dark:bg-[#111]" :
                  isShabbat ? "bg-purple-50/30 dark:bg-purple-900/10 hover:bg-purple-50/60 dark:hover:bg-purple-900/20 cursor-pointer" :
                  "hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer"}
                ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}
              `}
            >
              <div className="flex flex-col gap-0.5 h-full">
                <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${isToday ? "bg-blue-600 text-white" : isShabbat ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {date.getDate()}
                </span>
                {hebrewInfo && (
                  <span className="text-[8px] text-amber-600 dark:text-amber-400 leading-tight truncate">
                    {hebrewInfo.display}
                  </span>
                )}
                {holiday && (
                  <span className="text-[8px] text-red-600 dark:text-red-400 leading-tight truncate" title={holiday}>
                    {holiday}
                  </span>
                )}
                {dayPosts.slice(0, 3).map((post) => (
                  <PostTitleChip key={post.id} post={post} compact />
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 px-1">+{dayPosts.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main GanttChart Component ────────────────────────────────────────────────

interface GanttChartProps {
  compact?: boolean;
  defaultView?: "weekly" | "monthly";
  showViewToggle?: boolean;
  showTitle?: boolean;
}

export function GanttChart({
  compact = false,
  defaultView = "weekly",
  showViewToggle = true,
  showTitle = true,
}: GanttChartProps) {
  const now = new Date();
  const todayStr = formatDateStr(now);

  const [view, setView] = useState<"weekly" | "monthly">(defaultView);
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(now));
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "weekly") {
        const startDate = formatDateStr(weekDays[0]);
        const endDate = formatDateStr(weekDays[6]);
        const { getPostsByDateRange } = await import("@/lib/actions/posts");
        const { data } = await getPostsByDateRange(startDate, endDate);
        setPosts(data ?? []);
      } else {
        const { getPostsByMonth } = await import("@/lib/actions/posts");
        const { data } = await getPostsByMonth(year, month);
        setPosts(data ?? []);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [view, weekDays, year, month]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const goToPrev = () => {
    if (view === "weekly") {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      setWeekStart(d);
    } else {
      if (month === 0) { setMonth(11); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (view === "weekly") {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setWeekStart(d);
    } else {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(now));
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const periodLabel = useMemo(() => {
    if (view === "monthly") return `${MONTH_NAMES[month]} ${year}`;
    const start = weekDays[0];
    const end = weekDays[6];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
  }, [view, weekDays, month, year]);

  return (
    <div>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}>
        {showTitle && (
          <h2 className={`font-bold ${compact ? "text-base" : "text-xl sm:text-2xl"}`}>
            גאנט פרסומים
          </h2>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              &larr;
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              היום
            </button>
            <button
              onClick={goToNext}
              className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              &rarr;
            </button>
          </div>

          {/* Period */}
          <span className={`font-semibold text-gray-700 dark:text-gray-200 ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
            {periodLabel}
          </span>

          {/* View toggle */}
          {showViewToggle && (
            <div className="flex rounded-lg border border-gray-300 dark:border-[#2a2a2a] overflow-hidden text-sm">
              <button
                onClick={() => setView("weekly")}
                className={`px-3 py-1.5 transition-colors ${view === "weekly" ? "bg-blue-600 text-white" : "hover:bg-gray-50 dark:hover:bg-[#222] text-gray-600 dark:text-gray-400"}`}
              >
                שבועי
              </button>
              <button
                onClick={() => setView("monthly")}
                className={`px-3 py-1.5 border-r border-gray-300 dark:border-[#2a2a2a] transition-colors ${view === "monthly" ? "bg-blue-600 text-white" : "hover:bg-gray-50 dark:hover:bg-[#222] text-gray-600 dark:text-gray-400"}`}
              >
                חודשי
              </button>
            </div>
          )}

          {!compact && (
            <Link
              href="/posts/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              פוסט חדש
            </Link>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          טוען...
        </div>
      )}

      {/* Content */}
      {!loading && view === "weekly" && !compact && (
        <WeeklyGanttFull weekDays={weekDays} posts={posts} todayStr={todayStr} />
      )}
      {!loading && view === "weekly" && compact && (
        <WeeklyGanttCompact weekDays={weekDays} posts={posts} todayStr={todayStr} />
      )}
      {!loading && view === "monthly" && (
        <MonthlyGantt year={year} month={month} posts={posts} todayStr={todayStr} />
      )}

      {/* Legend */}
      {!loading && !compact && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 items-center">
          <span className="font-medium text-gray-600 dark:text-gray-300">סטטוס:</span>
          {[
            { label: "טיוטה", color: "bg-gray-400" },
            { label: "ממתין", color: "bg-amber-500" },
            { label: "מאושר", color: "bg-emerald-500" },
            { label: "פורסם", color: "bg-blue-500" },
            { label: "נדחה", color: "bg-red-500" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

