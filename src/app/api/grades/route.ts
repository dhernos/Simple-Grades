// src/app/api/grades/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { protectedRoute } from "@/lib/protected-api";

const prisma = new PrismaClient();

// Hier ist dein GET-Handler, der jetzt geschützt ist!
// Er ruft nur Noten für den angemeldeten Benutzer ab.
const getGradesHandler = async (req: Request, session: any) => {
  try {
    const userId = session.user.id;
    const grades = await prisma.noten.findMany({
      where: { userId }, // WICHTIG: Filtere die Noten nach der Benutzer-ID
      include: { subject: true },
      orderBy: [
        { jahr: 'asc' }, 
        { createdAt: 'asc' },
      ],
    });
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Fehler beim Abrufen der Noten:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

// Hier ist dein POST-Handler, der jetzt viel kürzer ist!
const postGradeHandler = async (request: Request, session: any) => {
  const userId = session.user.id;
  
  try {
    const newGradeData = await request.json();
    if (!newGradeData.subject?.id || newGradeData.note === undefined || newGradeData.jahr === undefined) {
      return new NextResponse('Missing required data (subject, note, or jahr).', { status: 400 });
    }

    const newGrade = await prisma.noten.create({
      data: {
        jahr: newGradeData.jahr,
        note: newGradeData.note,
        subject: {
          connect: { id: newGradeData.subject.id },
        },
        user: { 
          connect: { id: userId }, // Nutze die sichere ID aus der Session
        },
      },
      include: { subject: true, user: true },
    });
    
    return NextResponse.json(newGrade, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

// WICHTIG: Weise die Wrapper-Funktion den HTTP-Methoden zu
export const GET = protectedRoute(getGradesHandler);
export const POST = protectedRoute(postGradeHandler);