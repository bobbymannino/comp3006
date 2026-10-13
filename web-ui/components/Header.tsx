import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="w-full p-5 max-w-screen-3xl mx-auto">
        <Link href="/" className="text-blue-500 font-bold text-lg">
          Bloggy
        </Link>
      </div>
    </header>
  );
}
