import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from "@prisma/client";

// GET-Anfrage, um alle Noten eines Benutzers abzurufen, inklusive der Fachnamen
export async function GET() {
  const session = await getServerSession(authOptions);
  const prisma = new PrismaClient();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    const grades = await prisma.noten.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { jahr: 'asc' }, // Sortiere nach Jahr
        { subject: { name: 'asc' } }, // Dann nach Fach
      ],
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Fehler beim Abrufen der Noten:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST-Anfrage, um eine neue Note zu speichern (bleibt unverändert)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const prisma = new PrismaClient();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const { subjectId, note, jahr } = await req.json();

  if (!subjectId || !note || !jahr) {
    return NextResponse.json({ error: 'Fehlende Daten' }, { status: 400 });
  }

  if (note < 1 || note > 6 || jahr < 2000) {
      return NextResponse.json({ error: 'Ungültige Note oder Jahr' }, { status: 400 });
  }

  try {
    const newGrade = await prisma.noten.create({
      data: {
        note: parseInt(note),
        jahr: parseInt(jahr),
        subjectId: subjectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newGrade, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Speichern der Note:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}