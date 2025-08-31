import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRouteWithParams } from "@/lib/protected-api";
import { Session } from 'next-auth';

// PUT-Methode: Aktualisiert eine Note in der Datenbank
const putHandler = async (request: Request, session: Session, params: { id: string }) => {
    const { id } = params;
    const userId = session.user.id; // Holen wir uns die sichere Benutzer-ID aus der Session

    try {
        const updateData = await request.json();

        const updatedGrade = await prisma.noten.update({
            where: {
                id: id,
                userId: userId, // WICHTIG: Stelle sicher, dass die Note dem aktuellen Benutzer gehört
            },
            data: {
                jahr: updateData.jahr,
                note: updateData.note,
            },
            include: { subject: true },
        });

        return NextResponse.json(updatedGrade);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Note:', error);
        // Prisma wirft einen Fehler, wenn die ID nicht gefunden wird (auch wenn userId nicht passt)
        return new NextResponse(`Note mit ID ${id} nicht gefunden oder Sie sind nicht berechtigt, diese zu bearbeiten.`, { status: 404 });
    }
}

// DELETE-Methode: Löscht eine Note aus der Datenbank
const deleteHandler = async (request: Request, session: Session, params: { id: string }) => {
    const { id } = params;
    const userId = session.user.id; // Auch hier verwenden wir die sichere Benutzer-ID

    try {
        await prisma.noten.delete({
            where: {
                id: id,
                userId: userId, // WICHTIG: Stelle sicher, dass die Note dem aktuellen Benutzer gehört
            },
        });

        return new NextResponse(`Note mit ID ${id} wurde gelöscht.`, { status: 200 });
    } catch (error) {
        console.error('Fehler beim Löschen der Note:', error);
        return new NextResponse(`Note mit ID ${id} nicht gefunden oder Sie sind nicht berechtigt, diese zu löschen.`, { status: 404 });
    }
}

// Wende den Wrapper auf beide Handler an
export const PUT = protectedRouteWithParams(putHandler);
export const DELETE = protectedRouteWithParams(deleteHandler);