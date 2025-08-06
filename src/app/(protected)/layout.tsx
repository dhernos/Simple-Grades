// app/(protected)/layout.tsx
'use client';

import { redirect, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { status } = useSession();
  const pathname = usePathname();

  // If the session is still loading, show a loading state
  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // If the user is not authenticated, redirect them to the login page
  if (status === 'unauthenticated') {
    const callbackUrl = encodeURIComponent(pathname);
    return redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  // If the user is authenticated, render the children (the page content)
  return <>{children}</>;
}