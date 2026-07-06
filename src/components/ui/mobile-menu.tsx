"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Organization } from "@/lib/actions/admin";

interface MobileMenuProps {
  links: { href: string; label: string }[];
  userEmail: string;
  orgs?: Organization[];
  activeOrgId?: string | null;
}

export function MobileMenu({ links, userEmail, orgs, activeOrgId }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    startTransition(async () => {
      const { setActiveOrg } = await import("@/lib/actions/org");
      await setActiveOrg(orgId);
      window.location.reload();
    });
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Menu panel */}
          <div className="fixed top-14 left-0 right-0 bg-background border-b border-gray-200 dark:border-[#2a2a2a] shadow-lg dark:shadow-none z-50 animate-in slide-in-from-top-2 duration-200">
            <nav className="max-w-7xl mx-auto px-4 py-4">
              {/* Org switcher for super admin */}
              {orgs && orgs.length > 1 && (
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1.5">ארגון פעיל</p>
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    <select
                      value={activeOrgId ?? ""}
                      onChange={handleOrgChange}
                      disabled={isPending}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-60"
                    >
                      {orgs.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {links.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : link.href === "/admin"
                          ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f1f1f]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                <p className="px-4 text-sm text-gray-500 dark:text-gray-400 truncate mb-3">
                  {userEmail}
                </p>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    התנתק
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
