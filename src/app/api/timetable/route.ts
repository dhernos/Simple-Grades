// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRoute } from "@/lib/protected-api";
import { Session } from 'next-auth';

const postTimetableHandler = async (req: Request, session: Session) => {
  const { data } = await req.json();
  const userId = session.user.id;
  type TimetableCell = {
    subjectId?: string | null;
  };

  if (!Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.timetableRow.deleteMany({
        where: { userId },
      });

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row.label || !Array.isArray(row.cells)) {
            throw new Error("Invalid format");
          }

          const newCellsData = row.cells.map((cell: TimetableCell, cellIndex: number) => ({
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

    return NextResponse.json({ message: "Timetable saved." });
  } catch (error: unknown) {
    let errorMessage = 'Internal Servererror';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('Error fetching the timetable:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};

const getTimetableHandler = async (req: Request, session: Session) => {
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
    console.error('Error fetching the timetable:', error);
    return NextResponse.json({ error: 'Internal Servererror' }, { status: 500 });
  }
};

export const GET = protectedRoute(getTimetableHandler);
export const POST = protectedRoute(postTimetableHandler);