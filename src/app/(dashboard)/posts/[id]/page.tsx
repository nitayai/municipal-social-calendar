import { notFound } from "next/navigation";
import { getPost, getCurrentUserRole, getPostAttachments, getPostHistory } from "@/lib/actions/posts";
import { getOrgForCurrentUser } from "@/lib/actions/admin";
import { PostDetailClient } from "./post-detail-client";

export const dynamic = "force-dynamic";

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const [{ data: post, error }, userRole, { data: attachments }, org, { data: history }] = await Promise.all([
    getPost(id),
    getCurrentUserRole(),
    getPostAttachments(id),
    getOrgForCurrentUser(),
    getPostHistory(id),
  ]);

  if (error || !post) {
    notFound();
  }

  const isManager = userRole === "manager" || userRole === "super_admin";

  return (
    <PostDetailClient
      post={post}
      isManager={isManager}
      initialAttachments={attachments ?? []}
      orgName={org?.name ?? null}
      initialHistory={history ?? []}
    />
  );
}
