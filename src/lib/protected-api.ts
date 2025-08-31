import { NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from "@/lib/auth";

// Typ für Handler ohne Params
type ProtectedHandlerWithoutParams = (
  req: Request,
  session: Session
) => Promise<NextResponse>;

type ProtectedHandlerWithParams = (
  req: Request,
  session: Session,
  params: { id: string }
) => Promise<Response | NextResponse>;

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

// Wrapper für Handler mit Params
export const protectedRouteWithParams = (handler: ProtectedHandlerWithParams) => {
  return async (req: Request, context: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session || "error" in session) {
      return NextResponse.json(
        { error: "Unauthorized: Session is invalid or has been revoked." },
        { status: 401 }
      );
    }

    const rawId = context.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return NextResponse.json({ error: "Missing param id" }, { status: 400 });
    }

    // Call the provided handler with the extracted parameters.
    return handler(req, session, { id });
  };
};