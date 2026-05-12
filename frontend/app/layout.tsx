import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/src/components/Sidebar";

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
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
