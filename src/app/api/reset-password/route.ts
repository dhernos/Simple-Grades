import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Token und Passwort sind erforderlich." }, { status: 400 });
    }

    // Holen Sie alle Benutzer mit einem gültigen passwordResetToken
    const usersWithTokens = await prisma.user.findMany({
      where: {
        passwordResetToken: {
          not: null,
        },
      },
    });

    let user = null;
    for (const u of usersWithTokens) {
      if (u.passwordResetToken && await bcrypt.compare(token, u.passwordResetToken)) {
        user = u;
        break;
      }
    }

    if (!user) {
      return NextResponse.json({ message: "Ungültiger oder abgelaufener Token." }, { status: 400 });
    }

    if (user.passwordResetExpires && user.passwordResetExpires.getTime() < Date.now()) {
      return NextResponse.json({ message: "Ungültiger oder abgelaufener Token." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ message: "Passwort wurde erfolgreich zurückgesetzt." }, { status: 200 });
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  }
}