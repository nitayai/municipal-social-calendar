import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { OrgSwitcher } from "@/components/ui/org-switcher";
import { getOrgForCurrentUser, getOrganizations } from "@/lib/actions/admin";
import { getActiveOrgId } from "@/lib/actions/org";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const isSuperAdmin = profile?.role === "super_admin";

  const org = await getOrgForCurrentUser();

  let allOrgs: import("@/lib/actions/admin").Organization[] = [];
  let activeOrgId: string | null = null;
  if (isSuperAdmin) {
    const { data: orgsData } = await getOrganizations();
    allOrgs = orgsData ?? [];
    activeOrgId = await getActiveOrgId() ?? org?.id ?? null;
  }

  const navLinks = [
    { href: "/posts", label: "פוסטים" },
    { href: "/calendar", label: "גאנט פרסומים" },
    { href: "/open-tasks", label: "רעיונות ומשימות" },
    { href: "/settings/departments", label: "ניהול מחלקות" },
    ...(isSuperAdmin ? [{ href: "/admin", label: "ניהול מערכת" }] : []),
  ];

  const orgName = org?.name ?? null;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#080808]">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-white/[0.06] bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-4">

            {/* ── Brand ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <Link href="/dashboard/home" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity shrink-0">
                {org?.logo_url ? (
                  <img src={org.logo_url} alt={orgName ?? ""} className="h-7 w-auto max-w-[60px] object-contain rounded" />
                ) : null}
                <div className="leading-tight">
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
                      מערכת שיווק
                    </span>
                    {orgName && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700 text-xs">|</span>
                        <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                          {orgName}
                        </span>
                      </>
                    )}
                  </div>
                  <a
                    href="https://nitay.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    by nitay.ai
                  </a>
                </div>
              </Link>

              {/* Org switcher for super admin */}
              {isSuperAdmin && allOrgs.length > 1 && (
                <OrgSwitcher orgs={allOrgs} activeOrgId={activeOrgId} />
              )}

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      link.href === "/admin"
                        ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── Actions ──────────────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-600 truncate max-w-[160px]">
                {user.email}
              </span>
              <div className="w-px h-4 bg-gray-200 dark:bg-white/10" />
              <ThemeToggle />
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  התנתק
                </button>
              </form>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <MobileMenu links={navLinks} userEmail={user.email || ""} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
