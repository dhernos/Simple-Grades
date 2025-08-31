import { NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from "@/lib/auth";

type ProtectedHandler = (
  req: Request,
  session: Session,
  params: { id: string }
) => Promise<NextResponse>;

export const protectedRoute = (handler: ProtectedHandler) => {
  return async (req: Request, context: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session || "error" in session) {
      return NextResponse.json({
        error: 'Unauthorized: Session is invalid or has been revoked.'
      }, { status: 401 });
    }
    return handler(req, session, context.params);
  };
};