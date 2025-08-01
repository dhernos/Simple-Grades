import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from "@prisma/client"


// GET-Anfrage, um alle Fächer eines Benutzers abzurufen
export async function GET() {
  const session = await getServerSession(authOptions);
  const prisma = new PrismaClient();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    const subjects = await prisma.subject.findMany({
      where: {
        userId: session.user.id,
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
}

// POST-Anfrage, um ein neues Fach hinzuzufügen
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const prisma = new PrismaClient();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Ungültiger Fachname' }, { status: 400 });
  }

  try {
    const newSubject = await prisma.subject.create({
      data: {
        name: name,
        userId: session.user.id,
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
}