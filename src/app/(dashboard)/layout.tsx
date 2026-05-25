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

  // For super admin: load all orgs + active org
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

  const displayName = org?.name ?? "מערכת שיווק";

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f]">
      <header className="border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Brand + org */}
              <Link href="/dashboard/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
                {org?.logo_url ? (
                  <img src={org.logo_url} alt={org.name ?? ""} className="h-8 w-auto max-w-[80px] object-contain rounded" />
                ) : null}
                <div className="flex flex-col leading-tight">
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                    {displayName}
                  </span>
                  <a href="https://nitay.ai" target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 dark:text-blue-500 hover:underline">
                    By nitay.ai
                  </a>
                </div>
              </Link>

              {/* Org switcher for super admin */}
              {isSuperAdmin && allOrgs.length > 1 && (
                <OrgSwitcher orgs={allOrgs} activeOrgId={activeOrgId} />
              )}

              {/* Desktop navigation */}
              <nav className="hidden md:flex gap-5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm transition-colors ${
                      link.href === "/admin"
                        ? "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                {user.email}
              </span>
              <ThemeToggle />
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  התנתק
                </button>
              </form>
            </div>

            {/* Mobile actions */}
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
