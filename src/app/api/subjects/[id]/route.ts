import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

// PUT-Methode: Aktualisiert ein Fach
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const id = params.id; // Behebung der Next.js-Warnung
  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Ungültiger Fachname' }, { status: 400 });
  }

  try {
    const updatedSubject = await prisma.subject.update({
      where: {
        id,
        userId: session.user.id,
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
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const id = params.id; // Behebung der Next.js-Warnung

  try {
    // Da wir onDelete: Cascade im Schema haben, löscht Prisma
    // automatisch auch alle zugehörigen Noten.
    await prisma.subject.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Fehler beim Löschen des Fachs:', error);
    return NextResponse.json({ error: 'Fach nicht gefunden' }, { status: 404 });
  }
}