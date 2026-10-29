import { HeartIcon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicPost } from "@/lib/api";

/** A post in a list, showing a preview of its content */
export function PostPreviewCard({ post }: { post: PublicPost }) {
  return (
    // `relative` so the title's link can cover the whole card
    <Card className="relative transition-colors hover:bg-muted/50">
      <CardHeader>
        <CardTitle>
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </CardTitle>
        {post.publishedAt && (
          <CardDescription>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                dateStyle: "medium",
              })}
            </time>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 text-muted-foreground">
        <p>{post.content}</p>
      </CardContent>
      <CardFooter className="gap-1 text-muted-foreground">
        <HeartIcon aria-hidden className="size-4" />
        {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
      </CardFooter>
    </Card>
  );
}
