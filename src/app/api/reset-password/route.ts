import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
    // Durchlaufen Sie die Benutzer, um den passenden Token zu finden
    for (const u of usersWithTokens) {
      if (u.passwordResetToken && await bcrypt.compare(token, u.passwordResetToken)) {
        user = u;
        break; // Sobald der Benutzer gefunden ist, brechen wir die Schleife ab
      }
    }

    if (!user) {
      return NextResponse.json({ message: "Ungültiger oder abgelaufener Token." }, { status: 400 });
    }

    // Prüfen Sie manuell das Ablaufdatum
    if (user.passwordResetExpires && user.passwordResetExpires.getTime() < Date.now()) {
      return NextResponse.json({ message: "Ungültiger oder abgelaufener Token." }, { status: 400 });
    }

    // Passwort hashen und aktualisieren
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