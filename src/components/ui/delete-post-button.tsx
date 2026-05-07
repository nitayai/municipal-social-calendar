"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeletePostButtonProps {
  postId: string;
  redirectAfter?: string;
  className?: string;
  label?: string;
}

export function DeletePostButton({
  postId,
  redirectAfter,
  className,
  label = "מחק",
}: DeletePostButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הפוסט? פעולה זו אינה הפיכה.")) return;
    setLoading(true);
    try {
      const { deletePost } = await import("@/lib/actions/posts");
      const { error } = await deletePost(postId);
      if (error) {
        alert(`שגיאה במחיקה: ${error}`);
        setLoading(false);
        return;
      }
      if (redirectAfter) {
        router.push(redirectAfter);
      } else {
        router.refresh();
      }
    } catch {
      alert("שגיאה במחיקת הפוסט");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={
        className ??
        "text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
      }
    >
      {loading ? "מוחק..." : label}
    </button>
  );
}
