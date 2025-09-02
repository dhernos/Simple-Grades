import { NextResponse } from "next/server";
import { protectedRoute } from "@/lib/protected-api";
import redis from "@/lib/redis";
import { Session } from "next-auth";

// Function to get all session keys
async function getAllSessionKeys() {
  return redis.keys("session:*");
}

const getSessionsHandler = async (req: Request, session: Session) => {
  try {
    const currentUserId = session.user.id; // Get the ID of the current user

    const keys = await getAllSessionKeys();
    const sessions = await Promise.all(
      keys.map(async (key) => {
        const sessionId = key.replace("session:", "");
        const sessionData = await redis.hgetall(key);
        const ttl = await redis.ttl(key);

        return {
          sessionId,
          userId: sessionData.userId,
          ...sessionData,
          ttlInSeconds: ttl,
        };
      })
    );

    // Filter sessions to only show those belonging to the current user
    const userSessions = sessions.filter(s => s.userId === currentUserId);

    return NextResponse.json({ sessions: userSessions });
  } catch (error) {
    console.error("Failed to fetch sessions from Redis:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

const deleteSessionHandler = async (req: Request, session: Session) => {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Bad Request: sessionId is required" }, { status: 400 });
  }

  try {
    const sessionData = await redis.hgetall(`session:${sessionId}`);
    const currentUserId = session.user.id;

    // Ensure the user can only delete their own sessions
    if (sessionData.userId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized: You can only delete your own sessions." }, { status: 403 });
    }

    await redis.del(`session:${sessionId}`);
    return NextResponse.json({ message: `Session ${sessionId} deleted.` });
  } catch (error) {
    console.error("Failed to delete session from Redis:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const GET = protectedRoute(getSessionsHandler);
export const DELETE = protectedRoute(deleteSessionHandler);