// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from 'next/server';
import { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { protectedRoute } from '@/lib/protected-api';

// Handler für den GET-Request
const getAppointmentsHandler = async (req: Request, session: Session) => {
    try {
        const { searchParams } = new URL(req.url);
        const getAll = searchParams.get('all') === 'true';
        const userId = session.user.id;

        // Führe eine Löschung von Terminen durch, die älter als 1 Jahr sind
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        await prisma.appointment.deleteMany({
            where: {
                userId,
                date: {
                    lt: oneYearAgo,
                },
            },
        });

        // Definiere die Filterbedingungen für die Anzeige
        const whereClause = {
            userId,
            date: {
                gte: new Date(),
            },
        };

        const appointments = await prisma.appointment.findMany({
            where: getAll ? { userId } : whereClause,
            orderBy: { date: 'asc' },
            take: getAll ? undefined : 5,
        });

        return NextResponse.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
};

// Handler für den POST-Request
const postAppointmentHandler = async (req: Request, session: Session) => {
    try {
        const { title, date } = await req.json();
        const userId = session.user.id;

        if (!title || !date) {
            return NextResponse.json({ message: 'Title and date are required' }, { status: 400 });
        }

        const newAppointment = await prisma.appointment.create({
            data: {
                title,
                date: new Date(date),
                userId,
            },
        });

        return NextResponse.json(newAppointment, { status: 201 });
    } catch (error) {
        console.error('Error creating appointment:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
};

// NEUER Handler für den DELETE-Request
const deleteAppointmentHandler = async (req: Request, session: Session) => {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userId = session.user.id;

        if (!id) {
            return NextResponse.json({ message: 'Appointment ID is required' }, { status: 400 });
        }

        // Finde den Termin und überprüfe, ob er dem angemeldeten Benutzer gehört
        const appointmentToDelete = await prisma.appointment.findUnique({
            where: { id },
        });

        if (!appointmentToDelete || appointmentToDelete.userId !== userId) {
            return NextResponse.json({ message: 'Appointment not found or not authorized' }, { status: 404 });
        }

        await prisma.appointment.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Appointment deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
};

export const GET = protectedRoute(getAppointmentsHandler);
export const POST = protectedRoute(postAppointmentHandler);
export const DELETE = protectedRoute(deleteAppointmentHandler);