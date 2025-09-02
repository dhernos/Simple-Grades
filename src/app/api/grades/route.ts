import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRoute } from "@/lib/protected-api";
import { Session } from 'next-auth';

// Hier ist dein GET-Handler, der jetzt geschützt ist!
// Er ruft nur Noten für den angemeldeten Benutzer ab.
const getGradesHandler = async (req: Request, session: Session) => {
  try {
    const userId = session.user.id;
    const grades = await prisma.noten.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: [
        { jahr: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

// Hier ist dein POST-Handler, der jetzt viel kürzer ist!
const postGradeHandler = async (request: Request, session: Session) => {
  const userId = session.user.id;

  try {
    const newGradeData = await request.json();
    if (!newGradeData.subject?.id || newGradeData.note === undefined || newGradeData.jahr === undefined) {
      return new NextResponse('Missing required data (subject, grade, or year).', { status: 400 });
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
    console.error('Error creating grade:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

export const GET = protectedRoute(getGradesHandler);
export const POST = protectedRoute(postGradeHandler);