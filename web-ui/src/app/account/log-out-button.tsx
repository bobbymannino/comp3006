import { LogOutIcon } from "lucide-react";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";

export default function LogOutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="destructive">
        <LogOutIcon />
        <span>Log Out</span>
      </Button>
    </form>
  );
}
