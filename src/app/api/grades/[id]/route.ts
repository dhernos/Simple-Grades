// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRouteWithParams } from "@/lib/protected-api";
import { Session } from 'next-auth';

// PUT-Methode: Aktualisiert eine Note in der Datenbank
const putHandler = async (
    request: Request,
    session: Session,
    context: { params: { id: string } }
): Promise<Response> => {
    const { id } = context.params;
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
        console.error('Error updating your grade:', error);
        // Prisma wirft einen Fehler, wenn die ID nicht gefunden wird (auch wenn userId nicht passt)
        return new NextResponse(`Grade with ID ${id} not found or permission denied.`, { status: 404 });
    }
}

// DELETE-Methode: Löscht eine Note aus der Datenbank
const deleteHandler = async (
    request: Request,
    session: Session,
    context: { params: { id: string } }
): Promise<Response> => {
    const { id } = context.params;
    const userId = session.user.id; // Auch hier verwenden wir die sichere Benutzer-ID

    try {
        await prisma.noten.delete({
            where: {
                id: id,
                userId: userId, // WICHTIG: Stelle sicher, dass die Note dem aktuellen Benutzer gehört
            },
        });

        return new NextResponse(`Grade ID ${id} has been deleted.`, { status: 200 });
    } catch (error) {
        console.error('Error deleting grade:', error);
        return new NextResponse(`Grade with ID ${id} not found or permission denied.`, { status: 404 });
    }
}

// Wende den Wrapper auf beide Handler an
export const PUT = protectedRouteWithParams(putHandler);
export const DELETE = protectedRouteWithParams(deleteHandler);