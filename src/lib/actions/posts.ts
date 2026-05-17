"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Post, PostInsert, PostUpdate, PostAttachment, PostAttachmentInsert, UserRole } from "@/types";

type PostsResult = { data: Post[] | null; error: string | null };
type PostResult = { data: Post | null; error: string | null };
type AttachmentsResult = { data: PostAttachment[] | null; error: string | null };

export async function getPosts(): Promise<PostsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts").select("*")
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPostsByMonth(year: number, month: number): Promise<PostsResult> {
  const supabase = await createClient();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { data, error } = await supabase.from("posts").select("*")
    .gte("scheduled_date", startDate).lte("scheduled_date", endDate)
    .order("scheduled_time", { ascending: true }).returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPostsByDateRange(startDate: string, endDate: string): Promise<PostsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*")
    .gte("scheduled_date", startDate).lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true }).returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPost(id: string): Promise<PostResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single<Post>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPostAttachments(postId: string): Promise<AttachmentsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_attachments").select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<PostAttachment[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createAttachment(attachment: PostAttachmentInsert): Promise<{ data: PostAttachment | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("post_attachments").insert(attachment as never).select().single<PostAttachment>();
  if (error) return { data: null, error: error.message };
  revalidatePath(`/posts/${attachment.post_id}`);
  return { data, error: null };
}

export async function deleteAttachment(id: string, postId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("post_attachments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}`);
  return { error: null };
}

export async function createPost(post: Omit<PostInsert, "created_by">): Promise<PostResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("organization_id")
    .eq("id", user.id).single<{ organization_id: string | null }>();
  const insertData: PostInsert = { ...post, created_by: user.id, organization_id: profile?.organization_id ?? null };
  const { data, error } = await supabase.from("posts").insert(insertData as never).select().single<Post>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/posts");
  return { data, error: null };
}

export async function updatePost(id: string, updates: PostUpdate): Promise<PostResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").update(updates as never)
    .eq("id", id).select().single<Post>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  return { data, error: null };
}

export async function deletePost(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "אין הרשאה למחוק פוסט זה" };
  revalidatePath("/posts");
  return { error: null };
}

export async function revertToDraft(id: string): Promise<PostResult> {
  return updatePost(id, { status: "draft" });
}

export async function updateScheduled(id: string, isScheduled: boolean, platformScheduledTime: string | null): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts")
    .update({ is_scheduled: isScheduled, platform_scheduled_time: platformScheduledTime } as never).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  return { error: null };
}

export async function submitForApproval(id: string): Promise<PostResult> {
  return updatePost(id, { status: "pending_approval" });
}

export async function approvePost(id: string, comment?: string): Promise<PostResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (!profile || !["manager", "super_admin"].includes(profile.role))
    return { data: null, error: "Unauthorized" };
  return updatePost(id, { status: "approved", approval_comment: comment || null });
}

export async function rejectPost(id: string, comment: string): Promise<PostResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (!profile || !["manager", "super_admin"].includes(profile.role))
    return { data: null, error: "Unauthorized" };
  return updatePost(id, { status: "rejected", approval_comment: comment });
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: UserRole }>();
  return profile?.role ?? "user";
}
