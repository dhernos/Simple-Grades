import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRoute } from "@/lib/protected-api";
import { Session } from 'next-auth';

const getSubjectsHandler = async (req: Request, session: Session) => {
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
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Internal Servererror' }, { status: 500 });
  }
};

const postSubjectHandler = async (req: Request, session: Session) => {
  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  try {
    const newSubject = await prisma.subject.create({
      data: {
        name: name,
        userId: session.user.id,
      },
    });
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Subject already exists' }, { status: 409 });
    }
    console.error('Error adding the subject:', error);
    return NextResponse.json({ error: 'Internal Servererror' }, { status: 500 });
  }
};

export const GET = protectedRoute(getSubjectsHandler);
export const POST = protectedRoute(postSubjectHandler);