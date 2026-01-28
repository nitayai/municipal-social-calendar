"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Department, DepartmentInsert, DepartmentUpdate } from "@/types";

type DepartmentsResult = { data: Department[] | null; error: string | null };
type DepartmentResult = { data: Department | null; error: string | null };

export async function getDepartments(): Promise<DepartmentsResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true })
    .returns<Department[]>();

  if (error) {
    console.error("Error fetching departments:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getDepartment(id: string): Promise<DepartmentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single<Department>();

  if (error) {
    console.error("Error fetching department:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createDepartment(
  department: Omit<DepartmentInsert, "organization_id">
): Promise<DepartmentResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Check if user is manager or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single<{ role: string; organization_id: string | null }>();

  if (!profile || !["manager", "super_admin"].includes(profile.role)) {
    return { data: null, error: "Unauthorized: Only managers can create departments" };
  }

  const { data, error } = await supabase
    .from("departments")
    .insert({
      ...department,
      organization_id: profile.organization_id,
    } as never)
    .select()
    .single<Department>();

  if (error) {
    console.error("Error creating department:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/(dashboard)/settings/departments");
  revalidatePath("/(dashboard)/posts");
  return { data, error: null };
}

export async function updateDepartment(
  id: string,
  updates: DepartmentUpdate
): Promise<DepartmentResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Check if user is manager or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["manager", "super_admin"].includes(profile.role)) {
    return { data: null, error: "Unauthorized: Only managers can update departments" };
  }

  const { data, error } = await supabase
    .from("departments")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single<Department>();

  if (error) {
    console.error("Error updating department:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/(dashboard)/settings/departments");
  revalidatePath("/(dashboard)/posts");
  return { data, error: null };
}

export async function deleteDepartment(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is manager or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["manager", "super_admin"].includes(profile.role)) {
    return { error: "Unauthorized: Only managers can delete departments" };
  }

  // Check if department is default
  const { data: dept } = await supabase
    .from("departments")
    .select("is_default")
    .eq("id", id)
    .single<{ is_default: boolean }>();

  if (dept?.is_default) {
    return { error: "Cannot delete default department" };
  }

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting department:", error);
    return { error: error.message };
  }

  revalidatePath("/(dashboard)/settings/departments");
  revalidatePath("/(dashboard)/posts");
  return { error: null };
}

export async function ensureDefaultDepartment(): Promise<DepartmentResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single<{ organization_id: string | null }>();

  // Check if default department exists
  const { data: existing } = await supabase
    .from("departments")
    .select("*")
    .eq("is_default", true)
    .eq("organization_id", profile?.organization_id ?? "")
    .single<Department>();

  if (existing) {
    return { data: existing, error: null };
  }

  // Create default department
  const { data, error } = await supabase
    .from("departments")
    .insert({
      name: "כללי",
      is_default: true,
      organization_id: profile?.organization_id,
    } as never)
    .select()
    .single<Department>();

  if (error) {
    console.error("Error creating default department:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
