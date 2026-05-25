"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setActiveOrg(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("active_org_id", orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function getActiveOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("active_org_id")?.value ?? null;
}

export async function getCurrentUserRole(): Promise<{ role: string; orgId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: "user", orgId: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single<{ organization_id: string | null; role: string }>();
  return {
    role: profile?.role ?? "user",
    orgId: profile?.organization_id ?? null,
  };
}
