import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileMenu } from "@/components/ui/mobile-menu";
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

  const isManager = profile?.role === "manager" || profile?.role === "super_admin";

  const navLinks = [
    { href: "/posts", label: "פוסטים" },
    { href: "/calendar", label: "גאנט פרסומים" },
    ...(isManager ? [{ href: "/settings/departments", label: "מחלקות" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0f0f0f]">
      <header className="border-b border-gray-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-4 sm:gap-8">
              <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                מערכת עירונית
              </Link>
              {/* Desktop navigation */}
              <nav className="hidden md:flex gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
