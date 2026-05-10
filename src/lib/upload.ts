"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadFileToStorage(file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "משתמש לא מחובר" };

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

  const extension = file.name.split(".").pop();
  const filename = `${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("post-attachments")
    .upload(filename, file, { contentType: file.type });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from("post-attachments")
    .getPublicUrl(filename);

  return { url: urlData.publicUrl, error: null };
}
