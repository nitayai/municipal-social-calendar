"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Post, PostInsert, PostUpdate, UserRole } from "@/types";

type PostsResult = { data: Post[] | null; error: string | null };
type PostResult = { data: Post | null; error: string | null };

export async function getPosts(): Promise<PostsResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .returns<Post[]>();

  if (error) {
    console.error("Error fetching posts:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getPostsByMonth(year: number, month: number): Promise<PostsResult> {
  const supabase = await createClient();

  // month is 0-indexed (0=Jan), build first/last day strings
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_time", { ascending: true })
    .returns<Post[]>();

  if (error) {
    console.error("Error fetching posts by month:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getPostsByDateRange(startDate: string, endDate: string): Promise<PostsResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .returns<Post[]>();

  if (error) {
    console.error("Error fetching posts by date range:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getPost(id: string): Promise<PostResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single<Post>();

  if (error) {
    console.error("Error fetching post:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createPost(post: Omit<PostInsert, "created_by">): Promise<PostResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Get user's profile to get organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single<{ organization_id: string | null }>();

  const insertData: PostInsert = {
    ...post,
    created_by: user.id,
    organization_id: profile?.organization_id ?? null,
  };

  const { data, error } = await supabase
    .from("posts")
    .insert(insertData as never)
    .select()
    .single<Post>();

  if (error) {
    console.error("Error creating post:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/posts");
  return { data, error: null };
}

export async function updatePost(id: string, updates: PostUpdate): Promise<PostResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single<Post>();

  if (error) {
    console.error("Error updating post:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  return { data, error: null };
}

export async function deletePost(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting post:", error);
    return { error: error.message };
  }

  revalidatePath("/posts");
  return { error: null };
}

export async function submitForApproval(id: string): Promise<PostResult> {
  return updatePost(id, { status: "pending_approval" });
}

export async function approvePost(id: string, comment?: string): Promise<PostResult> {
  const supabase = await createClient();

  // Verify user is manager or super_admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["manager", "super_admin"].includes(profile.role)) {
    return { data: null, error: "Unauthorized: Only managers can approve posts" };
  }

  return updatePost(id, {
    status: "approved",
    approval_comment: comment || null
  });
}

export async function rejectPost(id: string, comment: string): Promise<PostResult> {
  const supabase = await createClient();

  // Verify user is manager or super_admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["manager", "super_admin"].includes(profile.role)) {
    return { data: null, error: "Unauthorized: Only managers can reject posts" };
  }

  return updatePost(id, {
    status: "rejected",
    approval_comment: comment
  });
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  return profile?.role ?? "user";
}

export async function uploadAttachment(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { url: null, error: "Not authenticated" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { url: null, error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { url: null, error: "סוג קובץ לא נתמך. יש להעלות PDF, תמונה או מסמך Word" };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const filename = `${user.id}/${timestamp}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("post-attachments")
    .upload(filename, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from("post-attachments")
    .getPublicUrl(filename);

  return { url: urlData.publicUrl, error: null };
}
