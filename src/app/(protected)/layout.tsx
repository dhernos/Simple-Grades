"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import LoadingPage from '@/components/loading-page';
import Link from 'next/link';
import { SidebarCalendar } from "@/components/SidebarCalendar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" || session?.error) {
      console.log("ProtectedLayout: Session invalid, redirecting.");
      router.push("/logout");
    }
  }, [status, session?.error, router]);

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="py-4 shadow-lg backdrop-blur-sm">
          <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-2">
              <Link
                href="/timetable"
                className={`flex items-center px-4 py-2 font-medium transition duration-300 ease-in-out ${pathname === "/timetable"
                  ? "underline font-semibold"
                  : "hover:underline"
                  }`}
              >
                Timetable
              </Link>
              <Link
                href="/grades"
                className={`flex items-center px-4 py-2 font-medium transition duration-300 ease-in-out ${pathname === "/grades"
                  ? "underline font-semibold"
                  : "hover:underline"
                  }`}
              >
                Grades
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/sessions"
                className={`flex items-center px-4 py-2 font-medium transition duration-300 ease-in-out ${pathname === "/sessions"
                  ? "underline font-semibold"
                  : "hover:underline"
                  }`}
              >
                Sessions
              </Link>
              <Link
                href="/logout"
                className="font-semibold py-2 px-5 transition duration-300 ease-in-out hover:underline"
              >
                Logout
              </Link>
            </div>
          </nav>
        </header>
        <div className="flex flex-grow">
          <aside className="w-75 p-4 border-r">
            <SidebarCalendar />
          </aside>
          <main className="flex-grow p-4 sm:p-6 lg:p-8 mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return null;
}