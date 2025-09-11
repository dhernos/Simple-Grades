// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client"

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingPage from '@/components/loading-page';
import Link from 'next/link';
import { SidebarCalendar } from "@/components/SidebarCalendar";
import { Menu, X, Calendar, NotebookText, Settings } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-col h-screen overflow-auto">
        <header className="fixed w-full top-0 z-50 py-4 shadow-lg backdrop-blur-sm bg-background/80">
          <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <div className="lg:hidden mr-4">
                <button onClick={toggleSidebar} className="p-2 rounded-md focus:outline-none">
                  {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
              <div className="hidden lg:flex space-x-4">
                <Link href="/timetable" className={`flex items-center px-4 py-2 font-medium transition duration-300 ease-in-out ${pathname === "/timetable" ? "underline font-semibold" : "hover:underline"}`}>
                  Timetable
                </Link>
                <Link href="/grades" className={`flex items-center px-4 py-2 font-medium transition duration-300 ease-in-out ${pathname === "/grades" ? "underline font-semibold" : "hover:underline"}`}>
                  Grades
                </Link>
              </div>
            </div>

            <div className="flex-1 lg:flex-none text-center lg:text-left text-xl font-bold">
              Simple Grades
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/sessions" className={`hidden lg:flex items-center px-4 py-2 font-medium transition duration-300 ease-in-out ${pathname === "/sessions" ? "underline font-semibold" : "hover:underline"}`}>
                Sessions
              </Link>
              <Link href="/logout" className="font-semibold py-2 px-5 transition duration-300 ease-in-out hover:underline">
                Logout
              </Link>
            </div>
          </nav>
        </header>

        <div className="flex flex-grow mt-20 relative">
          <aside
            className={`
              fixed w-75 p-4 border-r
              transform transition-transform duration-300 ease-in-out z-40
              bg-background
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0
              max-h-full
              top-18
              bottom-16
              lg:bottom-0
              overflow-y-auto
            `}
          >
            <SidebarCalendar />
          </aside>

          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <main className="flex-grow p-4 sm:p-6 lg:p-8 mx-auto w-full pb-20 overflow-auto lg:pl-75">
            {children}
          </main>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-sm shadow-lg z-50 lg:hidden border-t">
          <nav className="flex justify-around items-center h-16">
            <Link
              href="/timetable"
              className={`flex flex-col items-center justify-center p-2 rounded-md ${pathname === "/timetable" ? "text-primary font-bold" : "text-gray-500"}`}
            >
              <Calendar size={24} />
              <span className="text-xs mt-1">Timetable</span>
            </Link>
            <Link
              href="/grades"
              className={`flex flex-col items-center justify-center p-2 rounded-md ${pathname === "/grades" ? "text-primary font-bold" : "text-gray-500"}`}
            >
              <NotebookText size={24} />
              <span className="text-xs mt-1">Grades</span>
            </Link>
            <Link
              href="/sessions"
              className={`flex flex-col items-center justify-center p-2 rounded-md ${pathname === "/sessions" ? "text-primary font-bold" : "text-gray-500"}`}
            >
              <Settings size={24} />
              <span className="text-xs mt-1">Sessions</span>
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  return null;
}