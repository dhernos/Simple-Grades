import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT-Methode: Aktualisiert eine Note in der Datenbank
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
    const updateData = await request.json();
    
    const updatedGrade = await prisma.noten.update({
      where: { id: id },
      data: {
        jahr: updateData.jahr,
        note: updateData.note,
      },
      include: { subject: true },
    });
    
    return NextResponse.json(updatedGrade);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Note:', error);
    // Prisma wirft einen Fehler, wenn die ID nicht gefunden wird.
    return new NextResponse(`Note mit ID ${id} nicht gefunden.`, { status: 404 });
  }
}

// DELETE-Methode: Löscht eine Note aus der Datenbank
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {  
    await prisma.noten.delete({
      where: { id: id },
    });
    
    return new NextResponse(`Note mit ID ${id} wurde gelöscht.`, { status: 200 });
  } catch (error) {
    console.error('Fehler beim Löschen der Note:', error);
    // Prisma wirft einen Fehler, wenn die ID nicht gefunden wird.
    return new NextResponse(`Note mit ID ${id} nicht gefunden.`, { status: 404 });
  }
}