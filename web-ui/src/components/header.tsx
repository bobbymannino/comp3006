import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/bloggy-logo.svg";

/** The site-wide header */
export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image src={logo} alt="" className="size-6" priority />
          Bloggy
        </Link>
      </div>
    </header>
  );
}
