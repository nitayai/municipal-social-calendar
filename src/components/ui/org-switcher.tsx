"use client";

import { useTransition } from "react";
import type { Organization } from "@/lib/actions/admin";

interface OrgSwitcherProps {
  orgs: Organization[];
  activeOrgId: string | null;
}

export function OrgSwitcher({ orgs, activeOrgId }: OrgSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    startTransition(async () => {
      const { setActiveOrg } = await import("@/lib/actions/org");
      await setActiveOrg(orgId);
      // Hard reload so all client components (Gantt, posts) re-fetch with new org
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {isPending && (
        <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
      )}
      <select
        value={activeOrgId ?? ""}
        onChange={handleChange}
        disabled={isPending}
        className="text-xs px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-60"
        title="החלף ארגון פעיל"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  );
}
