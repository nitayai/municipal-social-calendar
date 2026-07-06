"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/actions/org";
import { notifyPostApproved } from "@/lib/email";
import type { Post, PostInsert, PostUpdate, PostAttachment, PostAttachmentInsert, UserRole, PostHistory } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  pending_approval: "ממתין לאישור",
  approved: "מאושר",
  published: "פורסם",
  rejected: "נדחה",
};

type PostsResult = { data: Post[] | null; error: string | null };
type PostResult = { data: Post | null; error: string | null };
type AttachmentsResult = { data: PostAttachment[] | null; error: string | null };

// Returns the org_id to filter by for this user.
// For super_admin: uses the active org cookie.
// For regular users: RLS handles it automatically (pass null = no extra filter).
async function getFilterOrgId(): Promise<{ orgId: string | null; isSuperAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { orgId: null, isSuperAdmin: false };
  const { data: profile } = await supabase.from("profiles")
    .select("role, organization_id").eq("id", user.id)
    .single<{ role: string; organization_id: string | null }>();
  if (!profile) return { orgId: null, isSuperAdmin: false };
  if (profile.role === "super_admin") {
    const activeOrgId = await getActiveOrgId();
    return { orgId: activeOrgId ?? profile.organization_id, isSuperAdmin: true };
  }
  return { orgId: null, isSuperAdmin: false }; // RLS handles regular users
}

export async function getPosts(): Promise<PostsResult> {
  const supabase = await createClient();
  const { orgId, isSuperAdmin } = await getFilterOrgId();
  let query = supabase.from("posts").select("*")
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });
  if (isSuperAdmin && orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query.returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getActivePosts(): Promise<PostsResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { orgId, isSuperAdmin } = await getFilterOrgId();
  let query = supabase.from("posts").select("*")
    .gte("scheduled_date", today)
    .order("updated_at", { ascending: false });
  if (isSuperAdmin && orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query.returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getArchivedPosts(): Promise<PostsResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { orgId, isSuperAdmin } = await getFilterOrgId();
  let query = supabase.from("posts").select("*")
    .lt("scheduled_date", today)
    .order("scheduled_date", { ascending: false });
  if (isSuperAdmin && orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query.returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function cleanupArchivedAttachments(): Promise<{ deletedCount: number; error: string | null }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: archivedPosts, error: postsErr } = await supabase
    .from("posts").select("id").lt("scheduled_date", today);
  if (postsErr) return { deletedCount: 0, error: postsErr.message };
  if (!archivedPosts || archivedPosts.length === 0) return { deletedCount: 0, error: null };
  const archivedIds = archivedPosts.map((p: { id: string }) => p.id);
  const { data: attachments, error: attErr } = await supabase
    .from("post_attachments").select("id, url")
    .in("post_id", archivedIds).eq("type", "upload")
    .returns<Array<{ id: string; url: string }>>();
  if (attErr) return { deletedCount: 0, error: attErr.message };
  if (!attachments || attachments.length === 0) return { deletedCount: 0, error: null };
  let deletedCount = 0;
  const deletedIds: string[] = [];
  for (const att of attachments) {
    const bucketPath = att.url.split("/post-attachments/")[1];
    if (bucketPath) {
      const { error: storageErr } = await supabase.storage.from("post-attachments").remove([bucketPath]);
      if (!storageErr) { deletedIds.push(att.id); deletedCount++; }
    } else {
      deletedIds.push(att.id); deletedCount++;
    }
  }
  if (deletedIds.length > 0) {
    await supabase.from("post_attachments").delete().in("id", deletedIds);
  }
  return { deletedCount, error: null };
}

export async function getPostsByMonth(year: number, month: number): Promise<PostsResult> {
  const supabase = await createClient();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { orgId, isSuperAdmin } = await getFilterOrgId();
  let query = supabase.from("posts").select("*")
    .gte("scheduled_date", startDate).lte("scheduled_date", endDate)
    .order("scheduled_time", { ascending: true });
  if (isSuperAdmin && orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query.returns<Post[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPostsByDateRange(startDate: string, endDate: string): Promise<PostsResult> {
  const supabase = await createClient();
  const { orgId, isSuperAdmin } = await getFilterOrgId();
  let query = supabase.from("posts").select("*")
    .gte("scheduled_date", startDate).lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });
  if (isSuperAdmin && orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query.returns<Post[]>();
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
    .eq("post_id", postId).order("created_at", { ascending: true })
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
  const { data: profile } = await supabase.from("profiles")
    .select("organization_id, full_name, role").eq("id", user.id)
    .single<{ organization_id: string | null; full_name: string | null; role: string }>();

  // For super_admin: use the active org cookie
  let orgId = profile?.organization_id ?? null;
  if (profile?.role === "super_admin") {
    const activeOrgId = await getActiveOrgId();
    if (activeOrgId) orgId = activeOrgId;
  }

  const insertData: PostInsert = {
    ...post,
    created_by: user.id,
    organization_id: orgId,
    created_by_name: profile?.full_name || user.email || null,
  };
  const { data, error } = await supabase.from("posts").insert(insertData as never).select().single<Post>();
  if (error) return { data: null, error: error.message };
  revalidatePath("/posts");
  return { data, error: null };
}

export async function updatePost(id: string, updates: PostUpdate): Promise<PostResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userName: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles")
      .select("full_name").eq("id", user.id).single<{ full_name: string | null }>();
    userName = profile?.full_name || user.email || null;
  }
  const { data, error } = await supabase.from("posts").update(updates as never)
    .eq("id", id).select().single<Post>();
  if (error) return { data: null, error: error.message };
  if (user) {
    const action = updates.status
      ? `שינוי סטטוס → ${STATUS_LABELS[updates.status as string] || updates.status}`
      : "עדכון פוסט";
    await supabase.from("post_history").insert({
      post_id: id, user_id: user.id, user_name: userName, action,
    } as never);
  }
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  return { data, error: null };
}

export async function getPostHistory(postId: string): Promise<{ data: PostHistory[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_history").select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .returns<PostHistory[]>();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updatePublishedUrl(postId: string, url: string | null): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ published_url: url } as never).eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}`);
  return { error: null };
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
  let scheduledByName: string | null = null;
  if (isScheduled) {
    const authData = await supabase.auth.getUser();
    const user = authData.data.user;
    if (user) {
      const profileRes = await supabase.from("profiles")
        .select("full_name").eq("id", user.id)
        .single<{ full_name: string | null }>();
      scheduledByName = profileRes.data?.full_name || user.email || null;
    }
  }
  const updateFields: Record<string, unknown> = {
    is_scheduled: isScheduled,
    platform_scheduled_time: platformScheduledTime,
  };
  if (isScheduled && scheduledByName) updateFields.scheduled_by_name = scheduledByName;
  const { error } = await supabase.from("posts").update(updateFields as never).eq("id", id);
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
  const authData = await supabase.auth.getUser();
  const user = authData.data.user;
  if (!user) return { data: null, error: "Not authenticated" };
  const profileRes = await supabase.from("profiles")
    .select("role, full_name").eq("id", user.id)
    .single<{ role: string; full_name: string | null }>();
  const profile = profileRes.data;
  if (!profile || !["manager", "super_admin"].includes(profile.role))
    return { data: null, error: "Unauthorized" };

  const result = await updatePost(id, {
    status: "approved",
    approval_comment: comment || null,
    approved_by: user.id,
    approved_by_name: profile.full_name || user.email || null,
  });

  if (!result.error && result.data) {
    const post = result.data;
    // Fetch org name for notification
    const orgRes = post.organization_id
      ? await supabase.from("organizations").select("name").eq("id", post.organization_id).single<{ name: string }>()
      : null;
    const orgName = orgRes?.data?.name ?? "הארגון";
    const approverName = profile.full_name || user.email || "מנהל";
    notifyPostApproved({
      postId: id,
      postTitle: post.title,
      postContent: post.content,
      approverName,
      orgName,
    }).catch(console.error);
  }

  return result;
}

export async function rejectPost(id: string, comment: string): Promise<PostResult> {
  const supabase = await createClient();
  const authData = await supabase.auth.getUser();
  const user = authData.data.user;
  if (!user) return { data: null, error: "Not authenticated" };
  const profileRes = await supabase.from("profiles")
    .select("role").eq("id", user.id).single<{ role: string }>();
  const profile = profileRes.data;
  if (!profile || !["manager", "super_admin"].includes(profile.role))
    return { data: null, error: "Unauthorized" };
  return updatePost(id, { status: "rejected", approval_comment: comment });
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const authData = await supabase.auth.getUser();
  const user = authData.data.user;
  if (!user) return null;
  const profileRes = await supabase.from("profiles")
    .select("role").eq("id", user.id).single<{ role: UserRole }>();
  return profileRes.data?.role ?? "user";
}
