"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Organization, ProfileWithOrg } from "@/lib/actions/admin";

const ROLE_LABELS: Record<string, string> = {
  user: "משתמש", manager: "מנהל", super_admin: "סופר אדמין",
};
const ROLE_COLORS: Record<string, string> = {
  user: "bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400",
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

  // Org form
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Edit org
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgLogo, setEditOrgLogo] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Invite user
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteOrgId, setInviteOrgId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError(null);
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
      setError((e as Error).message || "שגיאה");
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
    if (!confirm("למחוק ארגון זה? לא ניתן לשחזר.")) return;
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

  async function handleInviteUser() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { inviteUser } = await import("@/lib/actions/admin");
      const { error: err } = await inviteUser(inviteEmail.trim(), inviteRole, inviteOrgId || null);
      if (err) { setError(err); return; }
      setInviteSuccess(true);
      setInviteEmail(""); setInviteRole("user"); setInviteOrgId("");
      setTimeout(() => setInviteSuccess(false), 3000);
      await loadData();
    } finally { setInviting(false); }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`למחוק את המשתמש ${email}? הפעולה בלתי הפיכה.`)) return;
    const { deleteUser } = await import("@/lib/actions/admin");
    const { error: err } = await deleteUser(userId);
    if (err) { setError(err); return; }
    setProfiles(prev => prev.filter(p => p.id !== userId));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-gray-400 dark:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ניהול מערכת</h1>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Super Admin</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 mr-2">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-white/[0.08]">
        {([["orgs", "🏢 ארגונים"], ["users", "👤 משתמשים"]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            {label} ({tab === "orgs" ? orgs.length : profiles.length})
          </button>
        ))}
      </div>

      {/* ── Organizations tab ───────────────────────────────────────────── */}
      {activeTab === "orgs" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4">
            <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">ארגון חדש</h2>
            <div className="flex gap-2 flex-wrap">
              <input type="text" value={newOrgName} onChange={e => setNewOrgName(e.target.value)}
                placeholder="שם הארגון"
                className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-xl bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={newOrgSlug} onChange={e => setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="slug"
                className="w-32 px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-xl bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              <button onClick={handleCreateOrg} disabled={creatingOrg || !newOrgName.trim() || !newOrgSlug.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors disabled:opacity-50 font-medium">
                {creatingOrg ? "יוצר..." : "+ צור ארגון"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            {orgs.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-600 py-10 text-sm">אין ארגונים עדיין</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02]">
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">ארגון</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">לוגו URL</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {orgs.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-gray-100 dark:bg-white/[0.06]" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                              {org.name.charAt(0)}
                            </div>
                          )}
                          {editingOrgId === org.id ? (
                            <input value={editOrgName} onChange={e => setEditOrgName(e.target.value)}
                              className="px-2 py-1 text-sm border border-blue-400 rounded-lg bg-white dark:bg-white/[0.06] text-gray-900 dark:text-gray-100 focus:outline-none" />
                          ) : (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{org.name}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-600 font-mono" dir="ltr">{org.slug}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingOrgId === org.id ? (
                          <input value={editOrgLogo} onChange={e => setEditOrgLogo(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2 py-1 text-sm border border-blue-400 rounded-lg bg-white dark:bg-white/[0.06] text-gray-900 dark:text-gray-100 focus:outline-none" dir="ltr" />
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600 truncate block max-w-[180px]" dir="ltr">
                            {org.logo_url || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingOrgId === org.id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleSaveOrg(org.id)} disabled={savingOrg}
                              className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium">
                              {savingOrg ? "שומר..." : "שמור"}
                            </button>
                            <button onClick={() => setEditingOrgId(null)}
                              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                              ביטול
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingOrgId(org.id); setEditOrgName(org.name); setEditOrgLogo(org.logo_url ?? ""); }}
                              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                              עריכה
                            </button>
                            <button onClick={() => handleDeleteOrg(org.id)}
                              className="px-3 py-1.5 text-xs border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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

      {/* ── Users tab ────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Invite user panel */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">הוסף משתמש</h2>
              <button onClick={() => setShowInvite(!showInvite)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {showInvite ? "סגור" : "+ הוסף"}
              </button>
            </div>

            {inviteSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm">
                ✓ המשתמש נוצר. שלח לו את קישור ה<a href="/register" target="_blank" className="underline mx-1">הרשמה</a>עם האימייל שלו להגדרת סיסמה.
              </div>
            )}

            {showInvite && (
              <div className="flex flex-wrap gap-2">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="אימייל"
                  className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-xl bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-xl bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="user">משתמש</option>
                  <option value="manager">מנהל</option>
                  <option value="super_admin">סופר אדמין</option>
                </select>
                <select value={inviteOrgId} onChange={e => setInviteOrgId(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-xl bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">ללא ארגון</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <button onClick={handleInviteUser} disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors disabled:opacity-50 font-medium">
                  {inviting ? "מוסיף..." : "הוסף משתמש"}
                </button>
              </div>
            )}
          </div>

          {/* Users list */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">משתמש</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">תפקיד</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">ארגון</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile.full_name || "—"}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-600" dir="ltr">{profile.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select value={profile.role}
                          onChange={e => handleUpdateRole(profile.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-200 dark:border-white/[0.08] rounded-lg bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="user">משתמש</option>
                          <option value="manager">מנהל</option>
                          <option value="super_admin">סופר אדמין</option>
                        </select>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[profile.role] ?? ROLE_COLORS.user}`}>
                          {ROLE_LABELS[profile.role] ?? profile.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={profile.organization_id ?? ""}
                        onChange={e => handleUpdateOrg(profile.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-200 dark:border-white/[0.08] rounded-lg bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">ללא ארגון</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteUser(profile.id, profile.email)}
                        className="px-3 py-1.5 text-xs border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
