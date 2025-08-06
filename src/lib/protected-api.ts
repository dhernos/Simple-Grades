import { NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from "@/lib/auth";

// Wir definieren den Typ für deine Handler-Funktion
// Sie bekommt die Request, die Session und die params als Argumente
type ProtectedHandler = (
  req: Request,
  session: Session,
  params: { id: string }
) => Promise<NextResponse>;

// Der Wrapper ist nun eine Funktion, die einen Handler zurückgibt,
// der die Signatur der Next.js-API-Route erfüllt
export const protectedRoute = (handler: ProtectedHandler) => {
  // Diese anonyme Funktion wird als Handler exportiert.
  // Sie empfängt req und params von Next.js.
  return async (req: Request, context: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session || session.error === "SessionInvalidated") {
      return NextResponse.json({
        error: 'Unauthorized: Session is invalid or has been revoked.'
      }, { status: 401 });
    }

    return handler(req, session, context.params);
  };
};