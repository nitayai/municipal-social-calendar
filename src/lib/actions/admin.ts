"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string | null;
};

export type ProfileWithOrg = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  organization_id: string | null;
  org_name: string | null;
};

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (profile?.role !== "super_admin") throw new Error("Unauthorized");
  return supabase;
}

export async function getOrganizations(): Promise<{ data: Organization[] | null; error: string | null }> {
  try {
    const supabase = await assertSuperAdmin();
    const { data, error } = await supabase.from("organizations").select("*").order("name").returns<Organization[]>();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e: unknown) { return { data: null, error: (e as Error).message }; }
}

export async function createOrganization(name: string, slug: string): Promise<{ data: Organization | null; error: string | null }> {
  try {
    const supabase = await assertSuperAdmin();
    const { data, error } = await supabase.from("organizations").insert({ name, slug } as never).select().single<Organization>();
    if (error) return { data: null, error: error.message };
    revalidatePath("/admin");
    return { data, error: null };
  } catch (e: unknown) { return { data: null, error: (e as Error).message }; }
}

export async function updateOrganization(id: string, updates: Partial<Pick<Organization, "name" | "logo_url">>): Promise<{ error: string | null }> {
  try {
    const supabase = await assertSuperAdmin();
    const { error } = await supabase.from("organizations").update(updates as never).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/dashboard/home");
    return { error: null };
  } catch (e: unknown) { return { error: (e as Error).message }; }
}

export async function deleteOrganization(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = await assertSuperAdmin();
    const { error } = await supabase.from("organizations").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    return { error: null };
  } catch (e: unknown) { return { error: (e as Error).message }; }
}

export async function getProfiles(): Promise<{ data: ProfileWithOrg[] | null; error: string | null }> {
  try {
    const supabase = await assertSuperAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, organization_id, organizations(name)")
      .order("email")
      .returns<Array<{ id: string; email: string; full_name: string | null; role: string; organization_id: string | null; organizations: { name: string } | null }>>();
    if (error) return { data: null, error: error.message };
    const mapped: ProfileWithOrg[] = (data ?? []).map(p => ({
      id: p.id, email: p.email, full_name: p.full_name, role: p.role,
      organization_id: p.organization_id,
      org_name: p.organizations?.name ?? null,
    }));
    return { data: mapped, error: null };
  } catch (e: unknown) { return { data: null, error: (e as Error).message }; }
}

export async function updateProfile(id: string, updates: { role?: string; organization_id?: string | null }): Promise<{ error: string | null }> {
  try {
    const supabase = await assertSuperAdmin();
    const { error } = await supabase.from("profiles").update(updates as never).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    return { error: null };
  } catch (e: unknown) { return { error: (e as Error).message }; }
}

export async function getOrgForCurrentUser(): Promise<{ name: string | null; logo_url: string | null } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single<{ organization_id: string | null }>();
    if (!profile?.organization_id) return null;
    const { data: org } = await supabase.from("organizations").select("name, logo_url").eq("id", profile.organization_id).single<{ name: string; logo_url: string | null }>();
    return org ?? null;
  } catch { return null; }
}
