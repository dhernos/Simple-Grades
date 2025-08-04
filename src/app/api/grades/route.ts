// src/app/api/grades/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Importiere getServerSession und deine authOptions
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Passe den Pfad bei Bedarf an

const prisma = new PrismaClient();

// src/app/api/grades/route.ts

// GET-Methode: Ruft alle Noten inklusive der zugehörigen Fächer ab
// GET-Methode: Ruft alle Noten inklusive der zugehörigen Fächer ab

export async function GET() {
  try {
    const grades = await prisma.noten.findMany({
      include: { subject: true },
      orderBy: [
        { jahr: 'asc' }, 
        { createdAt: 'asc' },
      ], // Sortiert die Noten nach Jahr und hinzufüg Datum
      
    });
  return NextResponse.json(grades);
  } catch (error) {
    console.error('Fehler beim Abrufen der Noten:', error);
  return new NextResponse('Internal Server Error', { status: 500 });
  }
} 

// POST-Methode: Fügt eine neue Note in die Datenbank ein
export async function POST(request: Request) {
  // Rufe die Benutzersitzung ab
  const session = await getServerSession(authOptions);

  // Überprüfe, ob ein Benutzer angemeldet ist
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Hole die Benutzer-ID aus dem Session-Objekt
  // Die ID ist hier garantiert vorhanden, da wir die Session überprüft haben
  const userId = session.user.id;
  
  try {
    const newGradeData = await request.json();

    // Validiere die Eingabe vom Frontend
    if (!newGradeData.subject?.id || newGradeData.note === undefined || newGradeData.jahr === undefined) {
      return new NextResponse('Missing required data (subject, note, or jahr).', { status: 400 });
    }

    // Erstellt die neue Note in der Datenbank
    const newGrade = await prisma.noten.create({
      data: {
        jahr: newGradeData.jahr,
        note: newGradeData.note,
        subject: {
          connect: { id: newGradeData.subject.id },
        },
        user: { 
          // Verwende die sichere userId aus der Session!
          connect: { id: userId },
        },
      },
      include: { subject: true, user: true },
    });
    
    return NextResponse.json(newGrade, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}