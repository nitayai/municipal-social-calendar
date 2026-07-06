"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/actions/org";
import { notifyNewTask } from "@/lib/email";
import type { OpenTask, OpenTaskInsert, OpenTaskUpdate, OpenTaskAttachment } from "@/types";

type TasksResult = { data: OpenTask[] | null; error: string | null };
type TaskResult = { data: OpenTask | null; error: string | null };

async function getOrgIdForCurrentUser(): Promise<{ orgId: string | null; isSuperAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { orgId: null, isSuperAdmin: false };
  const { data: profile } = await supabase.from("profiles")
    .select("role, organization_id, full_name").eq("id", user.id)
    .single<{ role: string; organization_id: string | null; full_name: string | null }>();
  if (!profile) return { orgId: null, isSuperAdmin: false };
  if (profile.role === "super_admin") {
    const activeOrgId = await getActiveOrgId();
    return { orgId: activeOrgId ?? profile.organization_id, isSuperAdmin: true };
  }
  return { orgId: profile.organization_id, isSuperAdmin: false };
}

export async function getOpenTasks(): Promise<TasksResult> {
  const supabase = await createClient();
  const { orgId } = await getOrgIdForCurrentUser();
  let query = supabase.from("open_tasks").select("*").order("created_at", { ascending: false });
  if (orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query.returns<OpenTask[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createOpenTask(task: Omit<OpenTaskInsert, "created_by" | "organization_id" | "creator_name">): Promise<TaskResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles")
    .select("role, organization_id, full_name").eq("id", user.id)
    .single<{ role: string; organization_id: string | null; full_name: string | null }>();

  let orgId = profile?.organization_id ?? null;
  if (profile?.role === "super_admin") {
    const activeOrgId = await getActiveOrgId();
    if (activeOrgId) orgId = activeOrgId;
  }

  const { data, error } = await supabase.from("open_tasks")
    .insert({
      ...task,
      created_by: user.id,
      organization_id: orgId,
      creator_name: profile?.full_name || user.email || null,
    } as never).select().single<OpenTask>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/open-tasks");

  // Fire-and-forget email notification
  if (data) {
    const orgRes = orgId
      ? await supabase.from("organizations").select("name").eq("id", orgId).single<{ name: string }>()
      : null;
    const orgName = orgRes?.data?.name ?? "הארגון";
    notifyNewTask({
      taskId: data.id,
      taskTitle: data.title,
      creatorName: profile?.full_name || user.email || "משתמש",
      orgName,
      notes: data.notes,
    }).catch(console.error);
  }

  return { data, error: null };
}

export async function updateOpenTask(id: string, updates: OpenTaskUpdate): Promise<TaskResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("open_tasks")
    .update(updates as never).eq("id", id).select().single<OpenTask>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/open-tasks");
  return { data, error: null };
}

export async function deleteOpenTask(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("open_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/open-tasks");
  return { error: null };
}

// ── Attachments ────────────────────────────────────────────────────────────────

export async function getTaskAttachments(taskId: string): Promise<{ data: OpenTaskAttachment[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("open_task_attachments")
    .select("*").eq("task_id", taskId).order("created_at", { ascending: true })
    .returns<OpenTaskAttachment[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function addTaskLink(taskId: string, url: string, name: string | null): Promise<{ data: OpenTaskAttachment | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("open_task_attachments")
    .insert({ task_id: taskId, type: "link", url, name: name || null } as never)
    .select().single<OpenTaskAttachment>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/open-tasks");
  return { data, error: null };
}

export async function deleteTaskAttachment(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  // Check if it is an upload so we can delete from storage
  const { data: att } = await supabase.from("open_task_attachments")
    .select("type, url").eq("id", id).single<{ type: string; url: string }>();
  if (att?.type === "upload") {
    const bucketPath = att.url.split("/post-attachments/")[1];
    if (bucketPath) await supabase.storage.from("post-attachments").remove([bucketPath]);
  }
  const { error } = await supabase.from("open_task_attachments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/open-tasks");
  return { error: null };
}

export async function uploadTaskFile(taskId: string, file: File): Promise<{ data: OpenTaskAttachment | null; error: string | null }> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "bin";
  const filename = `tasks/${taskId}/${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("post-attachments")
    .upload(filename, file, { contentType: file.type });
  if (uploadErr) return { data: null, error: uploadErr.message };
  const { data: { publicUrl } } = supabase.storage.from("post-attachments").getPublicUrl(filename);
  const { data, error } = await supabase.from("open_task_attachments")
    .insert({ task_id: taskId, type: "upload", url: publicUrl, name: file.name } as never)
    .select().single<OpenTaskAttachment>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/open-tasks");
  return { data, error: null };
}
