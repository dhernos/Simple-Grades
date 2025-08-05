// src/app/api/grades/bySubjectAndYear/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import { protectedRoute } from "@/lib/protected-api";

const prisma = new PrismaClient();

const deleteGradesBySubjectAndYearHandler = async (req: Request, session: any) => {
  const { subjectId, year } = await req.json();
  const userId = session.user.id; // Sichere Benutzer-ID aus der Session

  if (!subjectId || !year) {
    return NextResponse.json({ error: 'Subject ID and year are required' }, { status: 400 });
  }

  try {
    // Lösche alle Noten, die zu der Fach-ID, dem Jahr und dem eingeloggten Benutzer gehören
    const deletedGrades = await prisma.noten.deleteMany({
      where: {
        subjectId: subjectId,
        jahr: year,
        userId: userId,
      },
    });

    if (deletedGrades.count === 0) {
      return NextResponse.json({ message: 'No grades found to delete' }, { status: 200 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Fehler beim Löschen der Noten:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
};

export const DELETE = protectedRoute(deleteGradesBySubjectAndYearHandler);