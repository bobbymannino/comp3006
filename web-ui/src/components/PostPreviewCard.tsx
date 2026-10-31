import Link from "next/link";
import { LikeButton } from "@/components/LikeButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LikeablePost } from "@/lib/api";

/** A post in a list, showing a preview of its content */
export function PostPreviewCard({ post }: { post: LikeablePost }) {
  return (
    // `relative` so the title's link can cover the whole card
    <Card className="relative transition-colors hover:bg-muted/50">
      <CardHeader>
        <CardTitle>
          <Link
            href={`/posts/${post._id}`}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                dateStyle: "medium",
              })}
            </time>
          ) : (
            "Draft"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-muted-foreground">
        <p>{post.content}</p>
      </CardContent>
      <CardFooter className="text-muted-foreground">
        <LikeButton
          postId={post._id}
          likeCount={post.likeCount}
          liked={post.liked}
          className="relative z-10 -ml-2.5"
        />
      </CardFooter>
    </Card>
  );
}
