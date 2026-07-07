"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/actions/org";
import { notifyNewTask } from "@/lib/email";
import type { OpenTask, OpenTaskInsert, OpenTaskUpdate, OpenTaskAttachment, OpenTaskHistory } from "@/types";

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

async function getCurrentUserInfo(): Promise<{ userId: string | null; userName: string | null; orgId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, userName: null, orgId: null };
  const { data: profile } = await supabase.from("profiles")
    .select("role, organization_id, full_name").eq("id", user.id)
    .single<{ role: string; organization_id: string | null; full_name: string | null }>();
  let orgId = profile?.organization_id ?? null;
  if (profile?.role === "super_admin") {
    const activeOrgId = await getActiveOrgId();
    if (activeOrgId) orgId = activeOrgId;
  }
  return {
    userId: user.id,
    userName: profile?.full_name || user.email || null,
    orgId,
  };
}

async function logTaskHistory(supabase: Awaited<ReturnType<typeof createClient>>, taskId: string, userId: string | null, userName: string | null, action: string) {
  try {
    await supabase.from("open_task_history").insert({
      task_id: taskId,
      user_id: userId,
      user_name: userName,
      action,
    } as never);
  } catch { /* ignore history errors */ }
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
  const { userId, userName, orgId } = await getCurrentUserInfo();
  if (!userId) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase.from("open_tasks")
    .insert({
      ...task,
      created_by: userId,
      organization_id: orgId,
      creator_name: userName,
    } as never).select().single<OpenTask>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/open-tasks");

  if (data) {
    await logTaskHistory(supabase, data.id, userId, userName, "יצירת נושא");

    const orgRes = orgId
      ? await supabase.from("organizations").select("name").eq("id", orgId).single<{ name: string }>()
      : null;
    const orgName = orgRes?.data?.name ?? "הארגון";
    notifyNewTask({
      taskId: data.id,
      taskTitle: data.title,
      creatorName: userName || "משתמש",
      orgName,
      notes: data.notes,
    }).catch(console.error);
  }

  return { data, error: null };
}

export async function updateOpenTask(id: string, updates: OpenTaskUpdate): Promise<TaskResult> {
  const supabase = await createClient();
  const { userId, userName } = await getCurrentUserInfo();

  const parts: string[] = [];
  if (updates.title !== undefined) parts.push("עדכון כותרת");
  if (updates.notes !== undefined) parts.push("עדכון הערות");
  if (updates.priority !== undefined) {
    const labels: Record<string, string> = { high: "גבוה", normal: "רגיל", low: "נמוך" };
    parts.push(`שינוי עדיפות → ${labels[updates.priority as string] ?? updates.priority}`);
  }
  const action = parts.length > 0 ? parts.join(", ") : "עדכון נושא";

  const { data, error } = await supabase.from("open_tasks")
    .update(updates as never).eq("id", id).select().single<OpenTask>();
  if (error) return { data: null, error: error.message };

  if (userId) await logTaskHistory(supabase, id, userId, userName, action);

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

export async function getTaskHistory(taskId: string): Promise<{ data: OpenTaskHistory[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_task_history").select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .returns<OpenTaskHistory[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// -- Attachments ---------------------------------------------------------------

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

  const { userId, userName } = await getCurrentUserInfo();
  if (userId) await logTaskHistory(supabase, taskId, userId, userName, `הוספת קישור: ${name || url}`);

  revalidatePath("/open-tasks");
  return { data, error: null };
}

export async function deleteTaskAttachment(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: att } = await supabase.from("open_task_attachments")
    .select("type, url, task_id, name").eq("id", id).single<{ type: string; url: string; task_id: string; name: string | null }>();
  if (att?.type === "upload") {
    const bucketPath = att.url.split("/post-attachments/")[1];
    if (bucketPath) await supabase.storage.from("post-attachments").remove([bucketPath]);
  }
  const { error } = await supabase.from("open_task_attachments").delete().eq("id", id);
  if (error) return { error: error.message };

  if (att?.task_id) {
    const { userId, userName } = await getCurrentUserInfo();
    if (userId) await logTaskHistory(supabase, att.task_id, userId, userName, `מחיקת ${att.type === "link" ? "קישור" : "קובץ"}: ${att.name || ""}`);
  }

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

  const { userId, userName } = await getCurrentUserInfo();
  if (userId) await logTaskHistory(supabase, taskId, userId, userName, `העלאת קובץ: ${file.name}`);

  revalidatePath("/open-tasks");
  return { data, error: null };
}

// Called after client-side upload — just creates the DB record + logs history
export async function createTaskAttachmentRecord(
  taskId: string,
  url: string,
  name: string,
): Promise<{ data: OpenTaskAttachment | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("open_task_attachments")
    .insert({ task_id: taskId, type: "upload", url, name } as never)
    .select().single<OpenTaskAttachment>();
  if (error) return { data: null, error: error.message };

  const { userId, userName } = await getCurrentUserInfo();
  if (userId) await logTaskHistory(supabase, taskId, userId, userName, `העלאת קובץ: ${name}`);

  revalidatePath("/open-tasks");
  return { data, error: null };
}
