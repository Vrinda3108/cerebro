import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cerebro",
  description: "Adaptive academic workload management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <div className="flex min-h-screen">

          {/* Sidebar */}
          <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-6 hidden md:flex flex-col">
            
            <div className="mb-10">
              <h1 className="text-3xl font-bold">Cerebro</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Academic OS
              </p>
            </div>

            <nav className="flex flex-col gap-3 text-zinc-300">

              <a href="/" className="rounded-xl px-4 py-3 bg-white text-black font-medium">
                Dashboard
              </a>

              <a
                href="/courses"
                className="rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
              >
                Courses
              </a>

              <a
                href="/calendar"
                className="rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
              >
                Calendar
              </a>

              <a
                href="/analytics"
                className="rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
              >
                Analytics
              </a>

              <a
                href="/settings"
                className="rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
              >
                Settings
              </a>

            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}