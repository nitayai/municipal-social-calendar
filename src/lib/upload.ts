"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadFileToStorage(file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "משתמש לא מחובר" };

  const allowedTypes = [
    "application/pdf",
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "video/mp4", "video/quicktime", "video/mov", "video/avi",
    "video/webm", "video/x-msvideo", "video/x-ms-wmv",
  ];

  if (!allowedTypes.includes(file.type) && !file.type.startsWith("video/")) {
    return { url: null, error: "סוג קובץ לא נתמך. מותר: PDF, תמונות, סרטונים, Word" };
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const filename = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("post-attachments")
    .upload(filename, file, { contentType: file.type });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data: urlData } = supabase.storage.from("post-attachments").getPublicUrl(filename);
  return { url: urlData.publicUrl, error: null };
}

export async function deleteFileFromStorage(url: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  // Extract path from public URL: .../post-attachments/USER_ID/FILENAME
  const bucketPath = url.split("/post-attachments/")[1];
  if (!bucketPath) return { error: null }; // not a storage file, skip
  const { error } = await supabase.storage.from("post-attachments").remove([bucketPath]);
  if (error) return { error: error.message };
  return { error: null };
}
