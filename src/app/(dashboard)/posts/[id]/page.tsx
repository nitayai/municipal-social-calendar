import { notFound } from "next/navigation";
import { getPost, getCurrentUserRole } from "@/lib/actions/posts";
import { PostDetailClient } from "./post-detail-client";

export const dynamic = "force-dynamic";

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const [{ data: post, error }, userRole] = await Promise.all([
    getPost(id),
    getCurrentUserRole(),
  ]);

  if (error || !post) {
    notFound();
  }

  const isManager = userRole === "manager" || userRole === "super_admin";

  return <PostDetailClient post={post} isManager={isManager} />;
}
