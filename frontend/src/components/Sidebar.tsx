"use client";

import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/src/services/auth";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Calendar", href: "/calendar" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-6 hidden md:flex flex-col">

      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Cerebro</h1>
        <p className="text-zinc-400 text-sm mt-1">Academic OS</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-2 text-zinc-300 flex-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-xl px-4 py-3 font-medium transition ${
              pathname === item.href
                ? "bg-white text-black"
                : "hover:bg-zinc-800"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="text-zinc-500 hover:text-white text-sm px-4 py-3 rounded-xl hover:bg-zinc-800 transition text-left"
      >
        Sign out
      </button>

    </aside>
  );
}
