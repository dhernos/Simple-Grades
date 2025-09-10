import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma"
import { protectedRoute } from "@/lib/protected-api";
import { Session } from 'next-auth';

// Handler for DELETE
const deleteGradesBySubjectAndYearHandler = async (req: Request, session: Session) => {
    // Extract subjectId and year from URL query parameters
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const year = searchParams.get('year');
    const userId = session.user.id;

    if (!subjectId || !year) {
        return NextResponse.json({ error: 'Subject ID and year are required' }, { status: 400 });
    }

    const parsedYear = parseInt(year);
    if (isNaN(parsedYear)) {
        return NextResponse.json({ error: 'Invalid year format' }, { status: 400 });
    }

    try {
        const deletedGrades = await prisma.noten.deleteMany({
            where: {
                subjectId: subjectId,
                jahr: parsedYear,
                subject: {
                    userId: userId,
                },
            },
        });

        if (deletedGrades.count === 0) {
            return NextResponse.json({ message: 'No grades found to delete' }, { status: 200 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting the grades:', error);
        return NextResponse.json({ error: 'Internal Server error' }, { status: 500 });
    }
};

export const DELETE = protectedRoute(deleteGradesBySubjectAndYearHandler);