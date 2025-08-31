// src/app/api/subjects/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRoute } from "@/lib/protected-api"; // Importiere den Wrapper

// PUT-Methode: Aktualisiert ein Fach
const putSubjectHandler = async (req: Request, session: any, params: { id: string }) => {
  const { id } = params;
  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Ungültiger Fachname' }, { status: 400 });
  }

  try {
    const updatedSubject = await prisma.subject.update({
      where: {
        id,
        userId: session.user.id, // Hier wird der Benutzer abgeglichen
      },
      data: {
        name,
      },
    });
    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Fachs:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// DELETE-Methode: Löscht ein Fach und alle zugehörigen Noten
const deleteSubjectHandler = async (req: Request, session: any, params: { id: string }) => {
  const { id } = params;

  try {
    await prisma.subject.delete({
      where: {
        id,
        userId: session.user.id, // Hier wird der Benutzer abgeglichen
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Fehler beim Löschen des Fachs:', error);
    return NextResponse.json({ error: 'Fach nicht gefunden' }, { status: 404 });
  }
}

export const PUT = protectedRoute(putSubjectHandler);
export const DELETE = protectedRoute(deleteSubjectHandler);