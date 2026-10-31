import type { LikeablePost } from "@/lib/api";
import { PostPreviewCard } from "./PostPreviewCard";

type PostListProps = {
  posts: LikeablePost[];
};

export default function PostList({ posts }: PostListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post._id} className="flex *:flex-1">
          <PostPreviewCard post={post} />
        </li>
      ))}
    </ul>
  );
}
