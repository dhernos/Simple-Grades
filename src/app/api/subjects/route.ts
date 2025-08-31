// src/app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRoute } from "@/lib/protected-api"; // Importiere den Wrapper

// Hier ist dein GET-Handler. Er ist jetzt viel sauberer,
// da die Authentifizierung vom Wrapper übernommen wird.
const getSubjectsHandler = async (req: Request, session: any) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        userId: session.user.id, // Die Benutzer-ID ist jetzt sicher verfügbar
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Fehler beim Abrufen der Fächer:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
};

// Hier ist dein POST-Handler. Die gleiche Logik gilt hier.
const postSubjectHandler = async (req: Request, session: any) => {
  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Ungültiger Fachname' }, { status: 400 });
  }

  try {
    const newSubject = await prisma.subject.create({
      data: {
        name: name,
        userId: session.user.id, // Verwende die Benutzer-ID aus der Session
      },
    });
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return NextResponse.json({ error: 'Dieses Fach existiert bereits' }, { status: 409 });
    }
    console.error('Fehler beim Erstellen des Fachs:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
};

export const GET = protectedRoute(getSubjectsHandler);
export const POST = protectedRoute(postSubjectHandler);