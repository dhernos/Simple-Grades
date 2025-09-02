import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRouteWithParams } from "@/lib/protected-api";
import { Session } from 'next-auth';

// Handler für PUT
const putSubjectHandler = async (
  req: Request,
  session: Session,
  context: { params: { id: string } }
): Promise<Response> => {
  const { id } = context.params;
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

// Handler für DELETE
const deleteSubjectHandler = async (
  req: Request,
  session: Session,
  context: { params: { id: string } }
): Promise<Response> => {
  const { id } = context.params;

  try {
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

export const PUT = protectedRouteWithParams(putSubjectHandler);
export const DELETE = protectedRouteWithParams(deleteSubjectHandler);