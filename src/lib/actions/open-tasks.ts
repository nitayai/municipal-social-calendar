"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OpenTask, OpenTaskInsert, OpenTaskUpdate } from "@/types";

type TasksResult = { data: OpenTask[] | null; error: string | null };
type TaskResult = { data: OpenTask | null; error: string | null };

export async function getOpenTasks(): Promise<TasksResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_tasks").select("*")
    .order("created_at", { ascending: false })
    .returns<OpenTask[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createOpenTask(task: Omit<OpenTaskInsert, "created_by">): Promise<TaskResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data, error } = await supabase.from("open_tasks")
    .insert({ ...task, created_by: user.id } as never).select().single<OpenTask>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/open-tasks");
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
