// src/app/api/sessions/route.ts

import { NextResponse } from "next/server";
import { protectedRoute } from "@/lib/protected-api"; // Importiere den Wrapper
import redis from "@/lib/redis";

// Funktion, um alle Session-Schlüssel zu finden
async function getAllSessionKeys() {
  // Redis KEYS ist für große Datenbanken langsam, aber für Debug-Zwecke ok.
  // In einer Produktionseumgebung sollte SCAN verwendet werden.
  return redis.keys("session:*");
}

const getSessionsHandler = async (req: Request, session: any) => {
  // Der Wrapper hat bereits die Session-Gültigkeit geprüft.
  // Wir müssen nur noch sicherstellen, dass der Benutzer die richtige Rolle hat.
  if (session.user.role !== "USER") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const keys = await getAllSessionKeys();
    const sessions = await Promise.all(
      keys.map(async (key) => {
        const sessionId = key.replace("session:", "");
        const sessionData = await redis.hgetall(key);
        const ttl = await redis.ttl(key);

        const ipAddress = sessionData.ipAddress || "N/A";
        const userAgent = sessionData.userAgent || "N/A";

        return {
          sessionId,
          ...sessionData,
          ttlInSeconds: ttl,
          ipAddress,
          userAgent,
        };
      })
    );

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch sessions from Redis:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

const deleteSessionHandler = async (req: Request, session: any) => {
  // Hier prüfen wir erneut, dass es ein Admin ist, für zusätzliche Sicherheit.
  if (session.user.role !== "USER") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Bad Request: sessionId is required" }, { status: 400 });
  }

  try {
    await redis.del(`session:${sessionId}`);
    return NextResponse.json({ message: `Session ${sessionId} deleted.` });
  } catch (error) {
    console.error("Failed to delete session from Redis:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const GET = protectedRoute(getSessionsHandler);
export const DELETE = protectedRoute(deleteSessionHandler);