import { getPosts, getCurrentUserRole } from "@/lib/actions/posts";
import { PostsList } from "./posts-list";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const [{ data: posts, error }, userRole] = await Promise.all([
    getPosts(),
    getCurrentUserRole(),
  ]);

  return <PostsList posts={posts ?? []} error={error} userRole={userRole} />;
}
