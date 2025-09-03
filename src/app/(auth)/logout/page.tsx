"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LogOut() {
  // Use the useRouter from 'next-intl/navigation'
  const router = useRouter();

  useEffect(() => {
    // The locale is automatically included in the path by next-intl's middleware.
    // We get the current locale from the router object.
    // Construct the callback URL using the current locale and the login page path.
    const callbackUrl = `/login`;

    // Call signOut with the constructed callbackUrl.
    // The redirect: false option prevents next-auth from handling the redirect itself,
    // allowing next-intl's middleware to handle it correctly.
    signOut({ callbackUrl, redirect: false }).then(() => {
      // After sign out is complete, use the router from next-intl to push the user to the login page.
      router.push(callbackUrl);
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-xl">You are being logged out...</h1>
    </div>
  );
}