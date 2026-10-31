import { buttonVariants } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

type EditPostButtonProps = {
  postId: string;
};

/** Edit one of the logged in user's posts */
export default function EditPostButton({ postId }: EditPostButtonProps) {
  return (
    <Link
      href={`/posts/${postId}/edit`}
      className={buttonVariants({ variant: "secondary" })}
    >
      <PencilIcon />
      <span>Edit Post</span>
    </Link>
  );
}
