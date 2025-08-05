// src/app/api/timetable/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client"
import { protectedRoute } from "@/lib/protected-api";

const prisma = new PrismaClient();

// Handler zum Speichern des Stundenplans für den authentifizierten Benutzer
const postTimetableHandler = async (req: Request, session: any) => {
  const { data } = await req.json();
  const userId = session.user.id;

  if (!Array.isArray(data)) {
    return NextResponse.json({ error: 'Ungültiges Datenformat' }, { status: 400 });
  }

  try {
    // Führe die Transaktion aus, um alle Operationen atomar zu gestalten
    await prisma.$transaction(async (tx) => {
      // 1. Lösche zuerst alle alten Stundenplan-Einträge des Benutzers.
      // Dank "onDelete: Cascade" werden auch alle verknüpften Zellen gelöscht.
      await tx.timetableRow.deleteMany({
        where: { userId },
      });

      // 2. Erstelle die neuen Stundenplan-Einträge mit ihren Zellen.
      // Diese Schleife startet erst, wenn das Löschen abgeschlossen ist.
      if (data.length > 0) {
        // Verwenden Sie eine Schleife für jeden Eintrag
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row.label || !Array.isArray(row.cells)) {
            throw new Error("Ungültiges Zeilenformat");
          }

          const newCellsData = row.cells.map((cell: any, cellIndex: number) => ({
            day: cellIndex,
            subjectId: cell.subjectId || null,
          }));

          await tx.timetableRow.create({
            data: {
              label: row.label,
              rowIndex: i,
              userId: userId,
              cells: {
                createMany: {
                  data: newCellsData,
                },
              },
            },
          });
        }
      }
    });

    return NextResponse.json({ message: "Stundenplan erfolgreich gespeichert." });
  } catch (error: any) {
    console.error('Fehler beim Speichern des Stundenplans:', error);
    return NextResponse.json({ error: error.message || 'Interner Serverfehler' }, { status: 500 });
  }
};


// Handler zum Abrufen des Stundenplans für den authentifizierten Benutzer (unverändert)
const getTimetableHandler = async (req: Request, session: any) => {
  try {
    const timetableRows = await prisma.timetableRow.findMany({
      where: { userId: session.user.id },
      orderBy: { rowIndex: 'asc' },
      include: {
        cells: {
          orderBy: { day: 'asc' },
          include: {
            subject: true,
          },
        },
      },
    });

    const formattedData = timetableRows.map(row => ({
      id: row.id,
      label: row.label,
      cells: row.cells.map(cell => ({
        subjectId: cell.subjectId,
        subjectName: cell.subject?.name || null,
      })),
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Fehler beim Abrufen des Stundenplans:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
};

export const GET = protectedRoute(getTimetableHandler);
export const POST = protectedRoute(postTimetableHandler);