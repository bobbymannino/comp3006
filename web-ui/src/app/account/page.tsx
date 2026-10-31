import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>

      <form action={logoutAction}>
        <Button type="submit" variant="destructive">
          <LogOutIcon />
          <span>Log Out</span>
        </Button>
      </form>
    </main>
  );
}
