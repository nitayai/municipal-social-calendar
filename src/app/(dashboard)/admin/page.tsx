"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Organization, ProfileWithOrg } from "@/lib/actions/admin";

const ROLE_LABELS: Record<string, string> = {
  user: "משתמש", manager: "מנהל", super_admin: "סופר אדמין",
};
const ROLE_COLORS: Record<string, string> = {
  user: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  manager: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  super_admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
};

export default function AdminPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<ProfileWithOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orgs" | "users">("orgs");

  // New org form
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Edit org
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgLogo, setEditOrgLogo] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { getOrganizations, getProfiles } = await import("@/lib/actions/admin");
      const [{ data: orgsData, error: orgsErr }, { data: profilesData, error: profilesErr }] = await Promise.all([
        getOrganizations(), getProfiles(),
      ]);
      if (orgsErr) { setError(orgsErr); return; }
      if (profilesErr) { setError(profilesErr); return; }
      setOrgs(orgsData ?? []);
      setProfiles(profilesData ?? []);
    } catch (e: unknown) {
      setError((e as Error).message || "שגיאה בטעינת הנתונים");
    } finally { setLoading(false); }
  }

  async function handleCreateOrg() {
    if (!newOrgName.trim() || !newOrgSlug.trim()) return;
    setCreatingOrg(true);
    try {
      const { createOrganization } = await import("@/lib/actions/admin");
      const { data, error: err } = await createOrganization(newOrgName.trim(), newOrgSlug.trim());
      if (err) { setError(err); return; }
      if (data) setOrgs(prev => [...prev, data]);
      setNewOrgName(""); setNewOrgSlug("");
    } finally { setCreatingOrg(false); }
  }

  async function handleSaveOrg(id: string) {
    setSavingOrg(true);
    try {
      const { updateOrganization } = await import("@/lib/actions/admin");
      const { error: err } = await updateOrganization(id, { name: editOrgName, logo_url: editOrgLogo || null });
      if (err) { setError(err); return; }
      setOrgs(prev => prev.map(o => o.id === id ? { ...o, name: editOrgName, logo_url: editOrgLogo || null } : o));
      setEditingOrgId(null);
    } finally { setSavingOrg(false); }
  }

  async function handleDeleteOrg(id: string) {
    if (!confirm("למחוק ארגון זה?")) return;
    const { deleteOrganization } = await import("@/lib/actions/admin");
    const { error: err } = await deleteOrganization(id);
    if (err) { setError(err); return; }
    setOrgs(prev => prev.filter(o => o.id !== id));
  }

  async function handleUpdateRole(userId: string, role: string) {
    const { updateProfile } = await import("@/lib/actions/admin");
    const { error: err } = await updateProfile(userId, { role });
    if (err) { setError(err); return; }
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role } : p));
  }

  async function handleUpdateOrg(userId: string, orgId: string) {
    const { updateProfile } = await import("@/lib/actions/admin");
    const { error: err } = await updateProfile(userId, { organization_id: orgId || null });
    if (err) { setError(err); return; }
    const org = orgs.find(o => o.id === orgId);
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, organization_id: orgId || null, org_name: org?.name ?? null } : p));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.back()}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">ניהול מערכת</h1>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Super Admin</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="mr-2 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-[#2a2a2a]">
        {([["orgs", "ארגונים"], ["users", "משתמשים"]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            {label} {tab === "orgs" ? `(${orgs.length})` : `(${profiles.length})`}
          </button>
        ))}
      </div>

      {/* Organizations tab */}
      {activeTab === "orgs" && (
        <div className="space-y-4">
          {/* Create org form */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
            <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">ארגון חדש</h2>
            <div className="flex gap-2 flex-wrap">
              <input type="text" value={newOrgName} onChange={e => setNewOrgName(e.target.value)}
                placeholder="שם הארגון"
                className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={newOrgSlug} onChange={e => setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="slug (ייחודי)"
                className="w-36 px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              <button onClick={handleCreateOrg} disabled={creatingOrg || !newOrgName.trim() || !newOrgSlug.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
                {creatingOrg ? "יוצר..." : "צור ארגון"}
              </button>
            </div>
          </div>

          {/* Orgs list */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            {orgs.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">אין ארגונים עדיין</p>
            ) : (
              <table className="w-full divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">ארגון</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">לוגו URL</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {orgs.map(org => (
                    <tr key={org.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-gray-100 dark:bg-gray-800" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                              {org.name.charAt(0)}
                            </div>
                          )}
                          {editingOrgId === org.id ? (
                            <input value={editOrgName} onChange={e => setEditOrgName(e.target.value)}
                              className="px-2 py-1 text-sm border border-blue-400 rounded bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none" />
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.name}</div>
                              <div className="text-xs text-gray-400" dir="ltr">{org.slug}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingOrgId === org.id ? (
                          <input value={editOrgLogo} onChange={e => setEditOrgLogo(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2 py-1 text-sm border border-blue-400 rounded bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none" dir="ltr" />
                        ) : (
                          <span className="text-xs text-gray-400 truncate block max-w-[200px]" dir="ltr">
                            {org.logo_url || <span className="italic">ללא לוגו</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingOrgId === org.id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleSaveOrg(org.id)} disabled={savingOrg}
                              className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50">
                              {savingOrg ? "שומר..." : "שמור"}
                            </button>
                            <button onClick={() => setEditingOrgId(null)}
                              className="px-3 py-1 text-xs border border-gray-300 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              ביטול
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingOrgId(org.id); setEditOrgName(org.name); setEditOrgLogo(org.logo_url ?? ""); }}
                              className="px-3 py-1 text-xs border border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              עריכה
                            </button>
                            <button onClick={() => handleDeleteOrg(org.id)}
                              className="px-3 py-1 text-xs border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              מחק
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
          <table className="w-full divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">משתמש</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">תפקיד</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">ארגון</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
              {profiles.map(profile => (
                <tr key={profile.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile.full_name || "—"}</div>
                    <div className="text-xs text-gray-400" dir="ltr">{profile.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={profile.role}
                      onChange={e => handleUpdateRole(profile.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="user">משתמש</option>
                      <option value="manager">מנהל</option>
                      <option value="super_admin">סופר אדמין</option>
                    </select>
                    <span className={`mr-2 inline-block px-2 py-0.5 text-xs rounded-full ${ROLE_COLORS[profile.role] ?? ROLE_COLORS.user}`}>
                      {ROLE_LABELS[profile.role] ?? profile.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={profile.organization_id ?? ""}
                      onChange={e => handleUpdateOrg(profile.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">ללא ארגון</option>
                      {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
