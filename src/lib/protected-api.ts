// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from "@/lib/auth";

// Typ für Handler ohne Params
type ProtectedHandlerWithoutParams = (
  req: Request,
  session: Session
) => Promise<NextResponse>;

// Typ für Handler mit Context (params als Promise)
type ProtectedHandlerWithContext = (
  req: Request,
  session: Session,
  context: { params: { id: string } }
) => Promise<Response>;

// Wrapper für Handler ohne Params
export const protectedRoute = (handler: ProtectedHandlerWithoutParams) => {
  return async (
    req: Request
  ) => {
    const session = await getServerSession(authOptions);

    if (!session || "error" in session) {
      return NextResponse.json(
        { error: "Unauthorized: Session is invalid or has been revoked." },
        { status: 401 }
      );
    }
    return handler(req, session);
  };
};

// Wrapper für Handler mit Context (params als Promise)
export const protectedRouteWithParams = (handler: ProtectedHandlerWithContext) => {
  return async (
    req: Request,
    context: { params: Promise<{ id: string }> }
  ): Promise<Response> => {
    const session = await getServerSession(authOptions);

    if (!session || "error" in session) {
      return NextResponse.json(
        { error: "Unauthorized: Session is invalid or has been revoked." },
        { status: 401 }
      );
    }

    const params = await context.params;
    return handler(req, session, { params });
  };
};