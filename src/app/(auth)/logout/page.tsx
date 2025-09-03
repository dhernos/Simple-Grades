"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogOut() {
  const router = useRouter();

  useEffect(() => {
    const callbackUrl = `/login`;

    signOut({ callbackUrl, redirect: false }).then(() => {
      router.push(callbackUrl);
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-xl">You are being logged out...</h1>
    </div>
  );
}