import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import logo from "@/assets/bloggy-logo.svg";
import { logoutAction } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/session";

/** The site-wide header */
export function Header() {
  return (
    <header className="border-b sticky top-0 z-10 bg-background">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image src={logo} alt="" className="size-6" priority />
          Bloggy
        </Link>
        <nav className="flex items-center gap-2">
          {/* The nav reads cookies, so it streams in while the rest is static */}
          <Suspense>
            <Nav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

/** The header nav, depending on if the user is logged in */
async function Nav() {
  return (await getSession()) ? <NavUser /> : <NavAnon />;
}

/** Logged in header nav */
function NavUser() {
  return (
    <>
      <Link href="/" className={buttonVariants({ variant: "ghost" })}>
        Posts
      </Link>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </>
  );
}

/** Logged out header nav */
function NavAnon() {
  return (
    <>
      <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
        Log in
      </Link>
      <Link href="/signup" className={buttonVariants()}>
        Sign up
      </Link>
    </>
  );
}
