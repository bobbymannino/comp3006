import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PostForm } from "./post-form";
import { Main } from "@/components/main";

export const metadata: Metadata = { title: "New post" };

/** Write a new post. Logged out users are sent to log in by the proxy */
export default function NewPostPage() {
  return (
    <Main>
      <Card>
        <CardHeader>
          <CardTitle>New post</CardTitle>
          <CardDescription>
            Write a post, publish it now or save it as a draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm />
        </CardContent>
      </Card>
    </Main>
  );
}
