// src/lib/protected-api.ts

import { NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { JWT } from 'next-auth/jwt'; // Importiere den JWT-Typ

// Wir definieren den Typ für deine Handler-Funktion.
// Sie bekommt die Request, die Session und die params als Argumente.
type ProtectedHandler = (
  req: Request,
  session: Session,
  params: { id: string }
) => Promise<NextResponse>;

// Der Wrapper ist nun eine Funktion, die einen Handler zurückgibt,
// der die Signatur der Next.js-API-Route erfüllt.
export const protectedRoute = (handler: ProtectedHandler) => {
  // Diese anonyme Funktion wird als Handler exportiert.
  // Sie empfängt req und params von Next.js.
  return async (req: Request, context: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    // NEU: Überprüfe auf den 'InvalidSessionError'
    // Die Session wird als ungültig betrachtet, wenn sie null ist oder einen Fehler enthält.
    if (!session || session.error === "InvalidSessionError") {
      return NextResponse.json({
        error: 'Unauthorized: Session is invalid or has been revoked.'
      }, { status: 401 });
    }

    // Übergabe der Argumente:
    // Der ursprüngliche Handler wird mit der Request, der Session und den params aufgerufen.
    return handler(req, session, context.params);
  };
};